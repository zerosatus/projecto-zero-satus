// shared-data.js - Compartilhamento de dados entre páginas

window.SharedData = {
    // Dados
    tasks: [],
    notes: [],
    calendarEvents: [],
    weeklySchedule: {},
    timeSlots: [],
    disciplinas: [],
    notifications: [],
    user: null,

    // Listeners
    listeners: new Map(),

    // Inicialização
    init() {
        console.log('[SharedData] Inicializado');
        this.carregarDoCache();
        this.setupListeners();
    },

    carregarDoCache() {
        if (!window.CacheManager) return;

        this.tasks = window.CacheManager.get('tasks', []);
        this.notes = window.CacheManager.get('notes', []);
        this.calendarEvents = window.CacheManager.get('calendarEvents', []);
        this.weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        this.timeSlots = window.CacheManager.get('timeSlots', []);
        this.disciplinas = window.CacheManager.get('disciplinas', []);
        this.notifications = window.CacheManager.get('notifications', []);

        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                this.user = JSON.parse(usuario);
            } catch(e) {}
        }
    },

    setupListeners() {
        if (!window.CacheManager) return;

        window.CacheManager.addListener('tasks', (data) => {
            this.tasks = data;
            this.notify('tasks', data);
        });

        window.CacheManager.addListener('notes', (data) => {
            this.notes = data;
            this.notify('notes', data);
        });

        window.CacheManager.addListener('calendarEvents', (data) => {
            this.calendarEvents = data;
            this.notify('calendarEvents', data);
        });

        window.CacheManager.addListener('weeklySchedule', (data) => {
            this.weeklySchedule = data;
            this.notify('weeklySchedule', data);
        });

        window.CacheManager.addListener('timeSlots', (data) => {
            this.timeSlots = data;
            this.notify('timeSlots', data);
        });

        window.CacheManager.addListener('disciplinas', (data) => {
            this.disciplinas = data;
            this.notify('disciplinas', data);
        });

        window.CacheManager.addListener('notifications', (data) => {
            this.notifications = data;
            this.notify('notifications', data);
        });
    },

    // Getters
    getTasks() { return this.tasks; },
    getNotes() { return this.notes; },
    getCalendarEvents() { return this.calendarEvents; },
    getWeeklySchedule() { return this.weeklySchedule; },
    getTimeSlots() { return this.timeSlots; },
    getDisciplinas() { return this.disciplinas; },
    getNotifications() { return this.notifications; },
    getUser() { return this.user; },

    // Setters com notificação
    setTasks(tasks, notify = true) {
        this.tasks = tasks;
        if (window.CacheManager) window.CacheManager.set('tasks', tasks, true);
        if (notify) this.notify('tasks', tasks);
    },

    setNotes(notes, notify = true) {
        this.notes = notes;
        if (window.CacheManager) window.CacheManager.set('notes', notes, true);
        if (notify) this.notify('notes', notes);
    },

    setCalendarEvents(events, notify = true) {
        this.calendarEvents = events;
        if (window.CacheManager) window.CacheManager.set('calendarEvents', events, true);
        if (notify) this.notify('calendarEvents', events);
    },

    setWeeklySchedule(schedule, notify = true) {
        this.weeklySchedule = schedule;
        if (window.CacheManager) window.CacheManager.set('weeklySchedule', schedule, true);
        if (notify) this.notify('weeklySchedule', schedule);
    },

    setTimeSlots(slots, notify = true) {
        this.timeSlots = slots;
        if (window.CacheManager) window.CacheManager.set('timeSlots', slots, true);
        if (notify) this.notify('timeSlots', slots);
    },

    setDisciplinas(disciplinas, notify = true) {
        this.disciplinas = disciplinas;
        if (window.CacheManager) window.CacheManager.set('disciplinas', disciplinas, true);
        if (notify) this.notify('disciplinas', disciplinas);
    },

    setNotifications(notifications, notify = true) {
        this.notifications = notifications;
        if (window.CacheManager) window.CacheManager.set('notifications', notifications, true);
        if (notify) this.notify('notifications', notifications);
    },

    // Sistema de eventos
    addListener(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);

        // Retornar função para remover
        return () => {
            const callbacks = this.listeners.get(key);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index > -1) callbacks.splice(index, 1);
            }
        };
    },

    notify(key, data) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(cb => cb(data));
        }

        // Disparar evento global
        window.dispatchEvent(new CustomEvent(`shared:${key}`, { detail: data }));
    },

    // Limpar dados
    clear() {
        this.tasks = [];
        this.notes = [];
        this.calendarEvents = [];
        this.weeklySchedule = {};
        this.timeSlots = [];
        this.disciplinas = [];
        this.notifications = [];
        this.user = null;
        this.listeners.clear();
    }
};

// Inicializar
window.SharedData.init();

console.log('[SharedData] Módulo carregado');