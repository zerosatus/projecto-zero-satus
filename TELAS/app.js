// ============================================
// app.js - SPA DO PAINEL PC
// ============================================

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
        this.modules = {};
        this.loadedCSS = new Set();
        this.cssModules = {
            'dashboard': 'css/dashboard.css',
            'dashboard-page': 'css/dashboard.css',
            'calendario': 'css/calendario.css',
            'tarefas': 'css/tarefas.css',
            'anotacoes': 'css/anotacoes.css',
            'perfil': 'css/perfil.css'
        };
        
        this.init();
    }
    
    async init() {
        const usuario = localStorage.getItem('usuarioLogado');
        if (!usuario) {
            window.location.href = '../login/index.html';
            return;
        }
        
        try {
            this.user = JSON.parse(usuario);
        } catch(e) {
            window.location.href = '../login/index.html';
            return;
        }
        
        console.log('[App PC] 👤 Usuário:', this.user.email);
        
        // Atualizar nome
        const nomeExibicao = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        document.getElementById('userNameDisplay').textContent = nomeExibicao;
        document.getElementById('userName').textContent = nomeExibicao;
        document.getElementById('miniName').textContent = nomeExibicao;
        document.getElementById('miniEmail').textContent = this.user.email || '';
        
        // Avatar
        const iniciais = nomeExibicao.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('userAvatar').textContent = iniciais || 'U';
        
        // Inicializar CacheManager
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
        }
        
        // Inicializar Sync
        if (window.initSync) {
            await window.initSync({ force: false });
        }
        
        // Carregar módulos
        this.loadModules();
        
        // Carregar dados
        await this.loadData();
        
        // Configurar navegação
        this.setupNavigation();
        
        // Configurar eventos
        this.setupEvents();
        
        // Renderizar view inicial
        this.showView('dashboard');
        
        console.log('[App PC] ✅ Aplicação pronta!');
    }
    
    loadModules() {
        if (typeof DashboardModule !== 'undefined') {
            this.modules.dashboard = new DashboardModule(this);
        }
        if (typeof CalendarioModule !== 'undefined') {
            this.modules.calendario = new CalendarioModule(this);
        }
        if (typeof TarefasModule !== 'undefined') {
            this.modules.tarefas = new TarefasModule(this);
        }
        if (typeof AnotacoesModule !== 'undefined') {
            this.modules.anotacoes = new AnotacoesModule(this);
        }
        if (typeof PerfilModule !== 'undefined') {
            this.modules.perfil = new PerfilModule(this);
        }
        console.log('[App PC] 📦 Módulos carregados:', Object.keys(this.modules));
    }
    
    async loadData() {
        if (window.CacheManager) {
            this.data.tasks = window.CacheManager.get('tasks', []);
            this.data.notes = window.CacheManager.get('notes', []);
            this.data.calendarEvents = window.CacheManager.get('calendarEvents', []);
            this.data.weeklySchedule = window.CacheManager.get('weeklySchedule', {});
            this.data.timeSlots = window.CacheManager.get('timeSlots', []);
            this.data.notifications = window.CacheManager.get('notifications', []);
            this.data.disciplinas = window.CacheManager.get('disciplinas', []);
            this.data.profile = window.CacheManager.get('usuarioLogado', {});
            
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!this.data.weeklySchedule[day]) this.data.weeklySchedule[day] = [];
            });
            
            // Atualizar avatar
            this.carregarAvatar();
        }
    }
    
    async carregarAvatar() {
        if (!this.user) return;
        
        const miniAvatar = document.getElementById('miniAvatar');
        const avatarImage = document.getElementById('avatarImage');
        
        if (window.CacheManager) {
            const photoUrl = await window.CacheManager.getProfilePhotoUrl();
            if (photoUrl && photoUrl.startsWith('data:')) {
                if (miniAvatar) miniAvatar.src = photoUrl;
                if (avatarImage) avatarImage.src = photoUrl;
                this.user.profilePhotoUrl = photoUrl;
                localStorage.setItem('usuarioLogado', JSON.stringify(this.user));
            }
        }
    }
    
    loadCSS(moduleName) {
        const cssPath = this.cssModules[moduleName];
        if (!cssPath || this.loadedCSS.has(moduleName)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
        this.loadedCSS.add(moduleName);
        console.log('[App PC] 🎨 CSS carregado:', moduleName);
    }
    
    setupNavigation() {
        document.querySelectorAll('.menu-item[data-view]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view && view !== this.currentView) {
                    this.showView(view);
                }
            });
        });
    }
    
    showView(viewName) {
        console.log('[App PC] 📄 Mostrando:', viewName);
        
        this.loadCSS(viewName);
        
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        
        const view = document.getElementById(`view-${viewName}`);
        if (view) {
            view.classList.remove('hidden');
            view.classList.add('active');
            
            document.querySelectorAll('.menu-item[data-view]').forEach(item => {
                item.classList.toggle('active', item.dataset.view === viewName);
            });
            
            if (this.modules[viewName]) {
                this.modules[viewName].render(this.data);
            }
            
            this.currentView = viewName;
        }
    }
    
    openNotifications() {
        const modal = document.getElementById('notifModal');
        if (modal) {
            modal.classList.add('active');
            this.renderNotifications();
        }
    }
    
    closeNotifications() {
        const modal = document.getElementById('notifModal');
        if (modal) modal.classList.remove('active');
    }
    
    renderNotifications(filter = 'todas') {
        const container = document.getElementById('notifList');
        if (!container) return;
        
        let notificacoes = this.data.notifications || [];
        if (filter === 'nao-lidas') {
            notificacoes = notificacoes.filter(n => !n.read);
        }
        
        if (notificacoes.length === 0) {
            container.innerHTML = `
                <div class="notif-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>Nenhuma notificação</p>
                </div>
            `;
            return;
        }
        
        const icones = { info: 'bell', aula: 'book', tarefa: 'tasks' };
        container.innerHTML = notificacoes.map(notif => `
            <div class="notif-item ${notif.read ? 'read' : 'unread'}" onclick="app.marcarNotificacaoLida('${notif.id}')">
                <div class="notif-icon ${notif.type || 'info'}">
                    <i class="fas fa-${icones[notif.type] || 'bell'}"></i>
                </div>
                <div class="notif-content">
                    <div class="notif-title">${this.escapeHtml(notif.title)}</div>
                    <div class="notif-message">${this.escapeHtml(notif.message)}</div>
                    <div class="notif-time">${this.formatTimeAgo(notif.time)}</div>
                </div>
            </div>
        `).join('');
    }
    
    marcarNotificacaoLida(id) {
        const notif = this.data.notifications.find(n => n.id == id);
        if (notif && !notif.read) {
            notif.read = true;
            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }
            this.renderNotifications();
            this.updateBadge();
        }
    }
    
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.data.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
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
    
    setupEvents() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Deseja sair?')) {
                localStorage.removeItem('usuarioLogado');
                if (window.CacheManager) window.CacheManager.logout();
                window.location.href = '../login/index.html';
            }
        });
        
        // Notificações
        document.getElementById('bellBtn')?.addEventListener('click', () => {
            this.openNotifications();
        });
        
        document.getElementById('btnMarkAllRead')?.addEventListener('click', () => {
            this.data.notifications.forEach(n => n.read = true);
            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }
            this.renderNotifications();
            this.updateBadge();
        });
        
        document.getElementById('btnClearAll')?.addEventListener('click', () => {
            if (confirm('Limpar todas as notificações?')) {
                this.data.notifications = [];
                if (window.CacheManager) {
                    window.CacheManager.set('notifications', [], true);
                }
                this.renderNotifications();
                this.updateBadge();
            }
        });
        
        // Tabs de notificações
        document.querySelectorAll('.notif-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderNotifications(tab.dataset.filter);
            });
        });
        
        // Fechar modal de notificações
        document.getElementById('notifModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeNotifications();
            }
        });
        
        // Eventos de dados
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[App PC] 📡 Dados carregados da nuvem');
            this.loadData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
            this.updateBadge();
        });
        
        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                const miniAvatar = document.getElementById('miniAvatar');
                const avatarImage = document.getElementById('avatarImage');
                if (miniAvatar) miniAvatar.src = event.detail.photoUrl;
                if (avatarImage) avatarImage.src = event.detail.photoUrl;
            }
        });
        
        // ESC key para fechar modais
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const notifModal = document.getElementById('notifModal');
                if (notifModal?.classList.contains('active')) {
                    this.closeNotifications();
                }
                const confirmModal = document.getElementById('confirmModal');
                if (confirmModal?.classList.contains('active')) {
                    confirmModal.classList.remove('active');
                }
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

console.log('[App PC] ✅ app.js carregado!');