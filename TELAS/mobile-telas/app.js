// ============================================
// app.js - SPA COMPLETO (MOBILE-ONLY)
// ============================================

console.log('[SPA] 🚀 Iniciando aplicação mobile...');

class App {
    constructor() {
        this.user = null;
        this.currentView = 'dashboard';
        this.data = {
            tasks: [],
            notes: [],
            calendarEvents: [],
            weeklySchedule: {},
            timeSlots: [],
            notifications: [],
            disciplinas: [],
            profile: {},
            settings: {}
        };
        this.isLoading = false;
        this.isSaving = false;
        this.modules = {};
        this.loadedCSS = new Set();
        this.currentDate = new Date();
        this.selectedDay = this.currentDate.getDate();
        
        // CSS por módulo
        this.cssModules = {
            dashboard: 'css/dashboard.css',
            calendario: 'css/calendario.css',
            tarefas: 'css/tarefas.css',
            notas: 'css/notas.css',
            perfil: 'css/perfil.css'
        };
        
        this.init();
    }
    
    // ============================================
    // CARREGAR CSS DINAMICAMENTE
    // ============================================
    loadCSS(moduleName) {
        const cssPath = this.cssModules[moduleName];
        if (!cssPath || this.loadedCSS.has(moduleName)) return;
        
        console.log(`[SPA] 🎨 Carregando CSS: ${moduleName}`);
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        link.onload = () => {
            console.log(`[SPA] ✅ CSS carregado: ${moduleName}`);
        };
        link.onerror = () => {
            console.warn(`[SPA] ⚠️ Erro ao carregar CSS: ${moduleName}`);
        };
        
        document.head.appendChild(link);
        this.loadedCSS.add(moduleName);
    }
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    async init() {
        // 1. Verificar usuário
        const usuarioSalvo = localStorage.getItem('usuarioLogado');
        if (!usuarioSalvo) {
            window.location.href = '../login/index.html';
            return;
        }
        
        try {
            this.user = JSON.parse(usuarioSalvo);
        } catch(e) {
            window.location.href = '../login/index.html';
            return;
        }
        
        console.log('[SPA] 👤 Usuário:', this.user.id);
        
        // Atualizar nome no header
        const nomeExibicao = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        document.getElementById('header-name').textContent = nomeExibicao.split(' ')[0];
        
        // 2. Inicializar CacheManager
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
        }
        
        // 3. Carregar módulos JavaScript
        this.loadModules();
        
        // 4. Carregar dados
        await this.loadAllData();
        
        // 5. Configurar navegação
        this.setupNavigation();
        
        // 6. Configurar eventos
        this.setupEvents();
        
        // 7. Renderizar view inicial
        this.showView('dashboard');
        
        console.log('[SPA] ✅ Aplicação mobile pronta!');
    }
    
    // ============================================
    // CARREGAR MÓDULOS
    // ============================================
    loadModules() {
        // Dashboard
        if (typeof DashboardModule !== 'undefined') {
            this.modules.dashboard = new DashboardModule(this);
        }
        
        // Calendário
        if (typeof CalendarioModule !== 'undefined') {
            this.modules.calendario = new CalendarioModule(this);
        }
        
        // Tarefas
        if (typeof TarefasModule !== 'undefined') {
            this.modules.tarefas = new TarefasModule(this);
        }
        
        // Notas
        if (typeof NotasModule !== 'undefined') {
            this.modules.notas = new NotasModule(this);
        }
        
        // Perfil
        if (typeof PerfilModule !== 'undefined') {
            this.modules.perfil = new PerfilModule(this);
        }
        
        console.log('[SPA] 📦 Módulos carregados:', Object.keys(this.modules));
    }
    
    // ============================================
    // CARREGAR DADOS
    // ============================================
    async loadAllData() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        console.log('[SPA] 📊 Carregando dados...');
        
        // Verificar cache primeiro
        const cached = sessionStorage.getItem('app_data');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                this.data = data;
                console.log('[SPA] 📦 Dados carregados do cache');
                this.isLoading = false;
                return;
            } catch(e) {}
        }
        
        // Carregar do Supabase
        try {
            const client = this.getSupabase();
            if (!client) throw new Error('Supabase não disponível');
            
            const { data, error } = await client.rpc('get_user_full_data', {
                user_id: this.user.id
            });
            
            if (error) throw error;
            
            // Atualizar dados
            this.data.tasks = data.tasks || [];
            this.data.notes = data.notes || [];
            this.data.calendarEvents = data.calendarEvents || [];
            this.data.weeklySchedule = data.weeklySchedule || {};
            this.data.timeSlots = data.timeSlots || [];
            this.data.notifications = data.notifications || [];
            this.data.disciplinas = data.disciplinas || [];
            this.data.profile = data.profile || {};
            this.data.settings = data.settings || {};
            
            // Garantir dias da semana
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!this.data.weeklySchedule[day]) {
                    this.data.weeklySchedule[day] = [];
                }
            });
            
            // Salvar cache
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            
            console.log('[SPA] ✅ Dados carregados:', {
                tasks: this.data.tasks.length,
                notes: this.data.notes.length,
                events: this.data.calendarEvents.length
            });
            
        } catch (error) {
            console.error('[SPA] ❌ Erro ao carregar dados:', error);
        }
        
        this.isLoading = false;
    }
    
    // ============================================
    // SALVAR DADOS
    // ============================================
    async saveAllData() {
        if (this.isSaving) return;
        this.isSaving = true;
        
        try {
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            this.syncInBackground();
        } catch (error) {
            console.error('[SPA] ❌ Erro ao salvar:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }
    
    // ============================================
    // SINCRONIZAR EM BACKGROUND
    // ============================================
    syncInBackground() {
        if (!window.CacheManager) return;
        
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                window.CacheManager.forceSync();
            });
        } else {
            setTimeout(() => {
                window.CacheManager.forceSync();
            }, 1000);
        }
    }
    
    // ============================================
    // GET SUPABASE CLIENT
    // ============================================
    getSupabase() {
        return window.SupabaseClient?.getClient() || window.supabaseClient;
    }
    
    // ============================================
    // NAVEGAÇÃO
    // ============================================
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.dataset.view;
                if (view && view !== this.currentView) {
                    this.showView(view);
                }
            });
        });
        
        // Links internos do dashboard
        document.getElementById('go-to-calendar')?.addEventListener('click', () => {
            this.showView('calendario');
        });
        
        document.getElementById('go-to-tasks')?.addEventListener('click', () => {
            this.showView('tarefas');
        });
        
        document.getElementById('notification-bell-link')?.addEventListener('click', () => {
            this.openNotifications();
        });
        
        // ✅ REMOVIDO: Qualquer redirecionamento para PC
        // O app é 100% mobile
    }
    
    showView(viewName) {
        console.log(`[SPA] 📄 Mostrando: ${viewName}`);
        
        // Carregar CSS do módulo (se ainda não carregado)
        this.loadCSS(viewName);
        
        // Esconder todas
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        
        // Mostrar selecionada
        const view = document.getElementById(`view-${viewName}`);
        if (view) {
            view.classList.remove('hidden');
            view.classList.add('active');
            
            // Atualizar nav
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.toggle('active', item.dataset.view === viewName);
            });
            
            // Atualizar header
            const subtitles = {
                dashboard: 'Bem-vindo de volta 👋',
                calendario: 'Meu Calendário 📅',
                tarefas: 'Gerenciador de Tarefas 📋',
                notas: 'Minhas Anotações 📝',
                perfil: 'Configurações da Conta 👤'
            };
            const subtitleEl = document.getElementById('header-subtitle');
            if (subtitleEl) subtitleEl.textContent = subtitles[viewName] || '';
            
            // Chamar módulo para renderizar
            if (this.modules[viewName]) {
                this.modules[viewName].render(this.data);
            }
            
            this.currentView = viewName;
        }
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    openNotifications() {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.add('active');
            this.renderNotificationsModal();
        }
    }
    
    renderNotificationsModal(filter = 'all') {
        const container = document.getElementById('notifications-list-modal');
        if (!container) return;
        
        let filtered = [...this.data.notifications];
        if (filter === 'unread') {
            filtered = this.data.notifications.filter(n => !n.read);
        }
        
        if (filtered.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px;color:var(--text-secondary)">
                    Nenhuma notificação
                </div>
            `;
            return;
        }
        
        let html = '';
        filtered.forEach(notif => {
            html += `
                <div class="notification-item-modal ${notif.read ? 'read' : 'unread'}">
                    <div class="notification-icon ${notif.type || 'info'}">
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notif.title)}</div>
                        <div class="notification-message">${this.escapeHtml(notif.message)}</div>
                        <div class="notification-time">${this.formatTimeAgo(notif.time)}</div>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    }
    
    // ============================================
    // HELPERS
    // ============================================
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatTimeAgo(timeString) {
        if (!timeString) return '';
        const now = new Date();
        const notifTime = new Date(timeString);
        const diffMins = Math.floor((now - notifTime) / 60000);
        
        if (diffMins < 1) return 'Agora';
        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
        return notifTime.toLocaleDateString('pt-BR');
    }
    
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        const naoLidas = this.data.notifications.filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    // ============================================
    // EVENTOS
    // ============================================
    setupEvents() {
        // Notificações
        document.getElementById('notification-bell')?.addEventListener('click', () => {
            this.openNotifications();
        });
        
        document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
            document.getElementById('notifications-modal').classList.remove('active');
        });
        
        document.getElementById('btn-mark-read')?.addEventListener('click', () => {
            this.data.notifications.forEach(n => n.read = true);
            this.saveAllData();
            this.updateBadge();
            this.renderNotificationsModal();
            if (this.modules.dashboard) {
                this.modules.dashboard.render(this.data);
            }
        });
        
        document.getElementById('btn-clear-all')?.addEventListener('click', () => {
            if (confirm('Limpar todas as notificações?')) {
                this.data.notifications = [];
                this.saveAllData();
                this.updateBadge();
                this.renderNotificationsModal();
                if (this.modules.dashboard) {
                    this.modules.dashboard.render(this.data);
                }
            }
        });
        
        document.querySelectorAll('.notification-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderNotificationsModal(tab.dataset.type);
            });
        });
        
        // Escutar mudanças no storage (outras abas)
        window.addEventListener('storage', (e) => {
            if (e.key === 'app_data' && !this.isSaving) {
                try {
                    const data = JSON.parse(e.newValue);
                    this.data = data;
                    if (this.modules[this.currentView]) {
                        this.modules[this.currentView].render(data);
                    }
                } catch(e) {}
            }
        });
        
        // Escutar eventos do CacheManager
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[SPA] 📡 Dados da nuvem atualizados');
            this.loadAllData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });
    }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

console.log('[SPA] ✅ app.js carregado!');