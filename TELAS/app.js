// ============================================
// app.js - SPA DO PAINEL PC (COMPLETO COM LOADING)
// ============================================

class App {
    constructor() {
        this.user = null;
        this.currentView = 'inicio';
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
        this._loadingOverlay = null;
        this.cssModules = {
            'inicio': 'css/inicio.css',
            'dashboard': 'css/dashboard.css',
            'dashboard-page': 'css/dashboard.css',
            'calendario': 'css/calendario.css',
            'tarefas': 'css/tarefas.css',
            'anotacoes': 'css/anotacoes.css',
            'perfil': 'css/perfil.css',
            'ia': 'css/ia.css'
        };
        
        this.viewToModuleMap = {
            'inicio': 'inicio',
            'dashboard-page': 'dashboard',
            'dashboard': 'dashboard',
            'calendario': 'calendario',
            'tarefas': 'tarefas',
            'anotacoes': 'anotacoes',
            'perfil': 'perfil',
            'ia': 'ia'
        };
        
        this.init();
    }
    
    // ============================================
    // ⭐ CRIAR OVERLAY DE LOADING
    // ============================================
    createLoadingOverlay() {
        if (this._loadingOverlay) return;
        
        this._loadingOverlay = document.createElement('div');
        this._loadingOverlay.id = 'app-loading-overlay';
        this._loadingOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.92);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: opacity 0.6s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        // Logo
        const logo = document.createElement('div');
        logo.className = 'loading-logo';
        logo.style.cssText = `
            width: 120px;
            height: 120px;
            margin-bottom: 24px;
            animation: loadingPulse 1.8s ease-in-out infinite;
        `;
        logo.innerHTML = `<img src="https://i.postimg.cc/4y9jpb8K/logo1-removebg-preview.png" alt="Zero Satus" style="width:100%;height:100%;object-fit:contain;">`;
        
        // Spinner
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `
            width: 48px;
            height: 48px;
            border: 4px solid rgba(139, 92, 246, 0.15);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: loadingSpin 0.8s linear infinite;
            margin-bottom: 20px;
        `;
        
        // Título
        const title = document.createElement('h2');
        title.className = 'loading-title';
        title.style.cssText = `
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 6px 0;
            letter-spacing: 0.5px;
        `;
        title.textContent = 'Carregando...';
        
        // Subtítulo
        const subtitle = document.createElement('p');
        subtitle.className = 'loading-subtitle';
        subtitle.id = 'loading-status';
        subtitle.style.cssText = `
            color: rgba(255, 255, 255, 0.5);
            font-size: 14px;
            margin: 0 0 20px 0;
            font-weight: 400;
        `;
        subtitle.textContent = 'Preparando seus dados...';
        
        // Barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.className = 'loading-progress-container';
        progressContainer.style.cssText = `
            width: 240px;
            height: 4px;
            background: rgba(255, 255, 255, 0.08);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 4px;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress-bar';
        progressBar.id = 'loading-progress-bar';
        progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1, #a78bfa);
            border-radius: 4px;
            transition: width 0.4s ease;
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        `;
        progressContainer.appendChild(progressBar);
        
        // Status
        const status = document.createElement('p');
        status.className = 'loading-status';
        status.id = 'loading-status-text';
        status.style.cssText = `
            color: rgba(255, 255, 255, 0.4);
            font-size: 12px;
            margin-top: 14px;
            font-weight: 300;
            letter-spacing: 0.3px;
        `;
        status.textContent = 'Inicializando...';
        
        // Estilos de animação
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loadingPulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.06); opacity: 0.85; }
            }
            @keyframes loadingSpin {
                to { transform: rotate(360deg); }
            }
        `;
        
        this._loadingOverlay.appendChild(logo);
        this._loadingOverlay.appendChild(spinner);
        this._loadingOverlay.appendChild(title);
        this._loadingOverlay.appendChild(subtitle);
        this._loadingOverlay.appendChild(progressContainer);
        this._loadingOverlay.appendChild(status);
        this._loadingOverlay.appendChild(style);
        
        document.body.appendChild(this._loadingOverlay);
    }
    
    // ============================================
    // ⭐ ATUALIZAR STATUS DO LOADING
    // ============================================
    updateLoadingStatus(message, progress = null) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) statusEl.textContent = message;
        
        const statusText = document.getElementById('loading-status-text');
        if (statusText) statusText.textContent = message;
        
        if (progress !== null) {
            const bar = document.getElementById('loading-progress-bar');
            if (bar) bar.style.width = Math.min(progress, 100) + '%';
        }
    }
    
    // ============================================
    // ⭐ FECHAR OVERLAY DE LOADING
    // ============================================
    closeLoadingOverlay() {
        if (this._loadingOverlay) {
            this._loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                if (this._loadingOverlay && this._loadingOverlay.parentNode) {
                    this._loadingOverlay.parentNode.removeChild(this._loadingOverlay);
                    this._loadingOverlay = null;
                }
            }, 500);
        }
    }
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    async init() {
        // ⭐ CRIAR OVERLAY DE LOADING
        this.createLoadingOverlay();
        this.updateLoadingStatus('Inicializando...', 5);
        
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
        this.updateLoadingStatus(`Olá, ${nomeExibicao}!`, 10);
        this.atualizarNomeUsuario(nomeExibicao);
        
        // Avatar
        const iniciais = nomeExibicao.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        this.atualizarAvatar(iniciais);
        
        // Inicializar CacheManager
        this.updateLoadingStatus('Inicializando cache...', 20);
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
            console.log('[App PC] ✅ CacheManager inicializado');
        }
        
        // Inicializar Sync
        this.updateLoadingStatus('Conectando ao servidor...', 30);
        if (window.initSync) {
            try {
                await window.initSync({ force: false });
                console.log('[App PC] ✅ Sync inicializado');
            } catch(e) {
                console.warn('[App PC] ⚠️ Erro no sync:', e);
            }
        }
        
        // Carregar módulos
        this.updateLoadingStatus('Carregando módulos...', 40);
        this.loadModules();
        
        // Carregar dados
        this.updateLoadingStatus('Carregando seus dados...', 50);
        await this.loadData();
        
        // Configurar navegação
        this.updateLoadingStatus('Configurando...', 70);
        this.setupNavigation();
        
        // Configurar eventos
        this.updateLoadingStatus('Preparando...', 80);
        this.setupEvents();
        
        // Renderizar view inicial
        this.updateLoadingStatus('Quase pronto!', 90);
        this.showView('inicio');
        
        // Atualizar badge
        this.updateLoadingStatus('Atualizando...', 95);
        this.updateBadge();
        
        // ⭐ FECHAR LOADING
        this.updateLoadingStatus('Pronto!', 100);
        setTimeout(() => {
            this.closeLoadingOverlay();
        }, 400);
        
        console.log('[App PC] ✅ Aplicação pronta!');
    }
    
    atualizarNomeUsuario(nome) {
        const ids = [
            'userNameDisplay', 'userName', 'userName2', 'userName3', 
            'userName4', 'userName5', 'userNameIA', 'miniName'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = nome;
        });
        
        const miniEmail = document.getElementById('miniEmail');
        if (miniEmail && this.user) miniEmail.textContent = this.user.email || '';
        
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail && this.user) profileEmail.textContent = this.user.email || '';
    }
    
    atualizarAvatar(iniciais) {
        const ids = [
            'userAvatar', 'userAvatar2', 'userAvatar3', 
            'userAvatar4', 'userAvatar5', 'userAvatarIA'
        ];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = iniciais || 'U';
        });
    }
    
    loadModules() {
        if (typeof InicioModule !== 'undefined') {
            this.modules.inicio = new InicioModule(this);
        }
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
        if (typeof IaModule !== 'undefined') {
            this.modules.ia = new IaModule(this);
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
        
        const existing = document.querySelector(`link[href="${cssPath}"]`);
        if (existing) {
            this.loadedCSS.add(moduleName);
            return;
        }
        
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
        
        // 🔥 GERENCIAR SIDEBAR E SCROLL PARA IA
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const viewIA = document.getElementById('view-ia');
        const btnIA = document.getElementById('btnOpenIA');
        
        if (viewName === 'ia') {
            if (sidebar) sidebar.style.display = 'none';
            if (mainContent) {
                mainContent.style.marginLeft = '0';
                mainContent.style.width = '100%';
                mainContent.style.padding = '0';
            }
            if (btnIA) btnIA.style.display = 'none';
            
            if (viewIA) {
                viewIA.style.display = 'flex';
                viewIA.style.position = 'fixed';
                viewIA.style.top = '0';
                viewIA.style.left = '0';
                viewIA.style.width = '100%';
                viewIA.style.height = '100vh';
                viewIA.style.zIndex = '9999';
                viewIA.style.background = 'var(--bg-color)';
                viewIA.style.overflow = 'hidden';
                viewIA.style.padding = '0';
                viewIA.style.margin = '0';
            }
            
            document.body.style.overflow = 'hidden';
            
        } else {
            if (sidebar) sidebar.style.display = 'flex';
            if (mainContent) {
                mainContent.style.marginLeft = '260px';
                mainContent.style.width = 'calc(100% - 260px)';
                mainContent.style.padding = '30px';
            }
            if (btnIA) {
                btnIA.style.display = 'flex';
                btnIA.style.visibility = 'visible';
                btnIA.style.opacity = '1';
            }
            
            if (viewIA) {
                viewIA.style.display = 'none';
                viewIA.style.position = 'relative';
                viewIA.style.zIndex = '1';
                viewIA.style.overflow = 'visible';
            }
            
            document.body.style.overflow = '';
        }
        
        this.loadCSS(viewName);
        
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        
        const view = document.getElementById(`view-${viewName}`);
        if (view) {
            if (viewName !== 'ia') {
                view.style.display = 'block';
                view.style.position = 'relative';
                view.style.zIndex = '1';
                view.style.overflow = 'visible';
            }
            
            view.classList.remove('hidden');
            view.classList.add('active');
            
            document.querySelectorAll('.menu-item[data-view]').forEach(item => {
                item.classList.toggle('active', item.dataset.view === viewName);
            });
            
            const moduleName = this.viewToModuleMap[viewName];
            if (moduleName && this.modules[moduleName]) {
                this.modules[moduleName].render(this.data);
            } else {
                console.warn('[App PC] ⚠️ Módulo não encontrado para:', viewName);
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
        const naoLidas = (this.data.notifications || []).filter(n => !n.read).length;
        const badges = document.querySelectorAll('.badge, .notif-badge');
        badges.forEach(badge => {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        });
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
    
    saveAllData() {
        if (window.CacheManager) {
            const userId = this.user?.id;
            if (!userId) return;
            
            Object.keys(this.data).forEach(key => {
                window.CacheManager.set(key, this.data[key], true);
            });
        }
    }
    
    setupEvents() {
        // Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
        window.location.href = 'login/index.html';
    }
});
        
        // Notificações - todos os botões de sino
        document.querySelectorAll('[id^="bellBtn"]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.openNotifications();
            });
        });
        
        // Botão IA (FLUTUANTE)
        document.getElementById('btnOpenIA')?.addEventListener('click', () => {
            this.showView('ia');
        });
        
        // Botão voltar na IA
        document.getElementById('navBackBtn')?.addEventListener('click', () => {
            this.showView('inicio');
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
        
        document.querySelectorAll('.notif-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderNotifications(tab.dataset.filter);
            });
        });
        
        document.getElementById('notifModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeNotifications();
            }
        });
        
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
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const notifModal = document.getElementById('notifModal');
                if (notifModal?.classList.contains('active')) {
                    this.closeNotifications();
                }
                // Se estiver na IA, voltar para o início
                if (this.currentView === 'ia') {
                    this.showView('inicio');
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