// realtime-sync.js - Sincronização em tempo real com Supabase

class RealtimeSyncManager {
    constructor() {
        this.subscriptions = [];
        this.userId = null;
        this.callbacks = new Map();
    }
    
    async init(userId) {
        this.userId = userId;
        console.log('[Realtime] Iniciando sincronização para:', userId);
        
        const client = window.SupabaseClient?.initSupabase();
        if (!client) {
            console.error('[Realtime] Supabase não inicializado');
            return;
        }
        
        // Configurar subscriptions para cada tabela
        this.setupSubscription('tasks', this.handleTasksChange.bind(this));
        this.setupSubscription('notes', this.handleNotesChange.bind(this));
        this.setupSubscription('calendar_events', this.handleEventsChange.bind(this));
        this.setupSubscription('weekly_schedule', this.handleScheduleChange.bind(this));
        this.setupSubscription('time_slots', this.handleTimeSlotsChange.bind(this));
        this.setupSubscription('notifications', this.handleNotificationsChange.bind(this));
        this.setupSubscription('profiles', this.handleProfileChange.bind(this));
        
        console.log('[Realtime] Subscriptions configuradas');
    }
    
    setupSubscription(table, handler) {
        const client = window.SupabaseClient?.initSupabase();
        if (!client || !this.userId) return;
        
        const subscription = client.channel(`public:${table}`)
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: table, filter: `user_id=eq.${this.userId}` },
                handler
            )
            .subscribe();
        
        this.subscriptions.push(subscription);
    }
    
    handleTasksChange(payload) {
        console.log('[Realtime] Tasks alteradas:', payload.eventType);
        this.loadAndNotify('tasks');
    }
    
    handleNotesChange(payload) {
        console.log('[Realtime] Notes alteradas:', payload.eventType);
        this.loadAndNotify('notes');
    }
    
    handleEventsChange(payload) {
        console.log('[Realtime] Events alteradas:', payload.eventType);
        this.loadAndNotify('calendarEvents');
    }
    
    handleScheduleChange(payload) {
        console.log('[Realtime] Schedule alterado:', payload.eventType);
        this.loadAndNotify('weeklySchedule');
    }
    
    handleTimeSlotsChange(payload) {
        console.log('[Realtime] TimeSlots alterados:', payload.eventType);
        this.loadAndNotify('timeSlots');
    }
    
    handleNotificationsChange(payload) {
        console.log('[Realtime] Notifications alteradas:', payload.eventType);
        this.loadAndNotify('notifications');
    }
    
    handleProfileChange(payload) {
        console.log('[Realtime] Profile alterado:', payload.eventType);
        this.loadAndNotify('profile');
    }
    
    async loadAndNotify(dataType) {
        if (!this.userId || !window.DatabaseService) return;
        
        try {
            let data = null;
            let cacheKey = dataType;
            
            switch(dataType) {
                case 'tasks':
                    data = await window.DatabaseService.getTasks(this.userId);
                    if (window.CacheManager) window.CacheManager.set('tasks', data, false);
                    break;
                case 'notes':
                    data = await window.DatabaseService.getNotes(this.userId);
                    if (window.CacheManager) window.CacheManager.set('notes', data, false);
                    break;
                case 'calendarEvents':
                    data = await window.DatabaseService.getCalendarEvents(this.userId);
                    if (window.CacheManager) window.CacheManager.set('calendarEvents', data, false);
                    break;
                case 'weeklySchedule':
                    data = await window.DatabaseService.getWeeklySchedule(this.userId);
                    if (window.CacheManager) window.CacheManager.set('weeklySchedule', data, false);
                    break;
                case 'timeSlots':
                    data = await window.DatabaseService.getTimeSlots(this.userId);
                    if (window.CacheManager) window.CacheManager.set('timeSlots', data, false);
                    break;
                case 'notifications':
                    data = await window.DatabaseService.getNotifications(this.userId);
                    if (window.CacheManager) window.CacheManager.set('notifications', data, false);
                    break;
                case 'profile':
                    data = await window.DatabaseService.getUserProfile(this.userId);
                    break;
            }
            
            // Disparar evento para recarregar UI
            window.dispatchEvent(new CustomEvent('cloudDataLoaded', { detail: { type: dataType, data } }));
            
            // Disparar evento específico para cada tipo
            window.dispatchEvent(new CustomEvent(`${dataType}Updated`, { detail: data }));
            
        } catch (error) {
            console.error(`[Realtime] Erro ao carregar ${dataType}:`, error);
        }
    }
    
    addListener(eventName, callback) {
        if (!this.callbacks.has(eventName)) {
            this.callbacks.set(eventName, []);
        }
        this.callbacks.get(eventName).push(callback);
        
        window.addEventListener(eventName, (e) => callback(e.detail));
    }
    
    disconnect() {
        console.log('[Realtime] Desconectando subscriptions...');
        this.subscriptions.forEach(sub => {
            try { sub.unsubscribe(); } catch(e) {}
        });
        this.subscriptions = [];
    }
}

// Instância global
window.RealtimeSyncManager = new RealtimeSyncManager();

console.log('[Realtime] Módulo carregado');