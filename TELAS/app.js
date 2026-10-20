// ============================================
// app.js - SPA DO PAINEL PC (CORRIGIDO)
// ⭐ SEM loop em disciplinasUpdated
// ⭐ Profile nunca é sobrescrito
// ============================================

console.log('[App PC] 🚀 Iniciando aplicação PC...');

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
            documentos: [],
            studySessions: [],   // ⭐ ADICIONAR
            profile: {},
            settings: {}
        };
        this.modules = {};
        this.loadedCSS = new Set();
        this._loadingOverlay = null;
        this._isInitializing = false;
        this._syncRetryCount = 0;
        this._maxSyncRetries = 3;
        this.isSaving = false;
        
       this.cssModules = {
    'inicio': 'css/inicio.css',
    'dashboard': 'css/dashboard.css',
    'dashboard-page': 'css/dashboard.css',
    'calendario': 'css/calendario.css',
    'tarefas': 'css/tarefas.css',
    'anotacoes': 'css/anotacoes.css',
    'perfil': 'css/perfil.css',
    'ia': 'css/ia.css',
    'disciplinas': 'css/disciplinas.css',
    'documentos': 'css/documentos.css',
    'foco': 'css/foco.css'
};
        
        this.viewToModuleMap = {
    'inicio': 'inicio',
    'dashboard-page': 'dashboard',
    'dashboard': 'dashboard',
    'calendario': 'calendario',
    'tarefas': 'tarefas',
    'anotacoes': 'anotacoes',
    'notas': 'anotacoes',
    'perfil': 'perfil',
    'ia': 'ia',
    'disciplinas': 'disciplinas',
    'documentos': 'documentos',
    'foco': 'foco'
};
        
        this.init();
    }
    
    // ============================================
    // LOADING OVERLAY
    // ============================================
    createLoadingOverlay() {
        if (this._loadingOverlay) return;
        
        this._loadingOverlay = document.createElement('div');
        this._loadingOverlay.id = 'app-loading-overlay';
        this._loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.92);
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            z-index: 99999; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
            transition: opacity 0.6s ease;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        `;
        
        const logo = document.createElement('div');
        logo.className = 'loading-logo';
        logo.style.cssText = `width: 120px; height: 120px; margin-bottom: 24px; animation: loadingPulse 1.8s ease-in-out infinite;`;
        logo.innerHTML = `<img src="https://i.postimg.cc/4y9jpb8K/logo1-removebg-preview.png" alt="Zero Satus" style="width:100%;height:100%;object-fit:contain;">`;
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.style.cssText = `width: 48px; height: 48px; border: 4px solid rgba(139, 92, 246, 0.15); border-top-color: #8b5cf6; border-radius: 50%; animation: loadingSpin 0.8s linear infinite; margin-bottom: 20px;`;
        
        const title = document.createElement('h2');
        title.className = 'loading-title';
        title.style.cssText = `color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 0.5px;`;
        title.textContent = 'Carregando...';
        
        const subtitle = document.createElement('p');
        subtitle.className = 'loading-subtitle';
        subtitle.id = 'loading-status';
        subtitle.style.cssText = `color: rgba(255, 255, 255, 0.5); font-size: 14px; margin: 0 0 20px 0;`;
        subtitle.textContent = 'Preparando seus dados...';
        
        const progressContainer = document.createElement('div');
        progressContainer.className = 'loading-progress-container';
        progressContainer.style.cssText = `width: 240px; height: 4px; background: rgba(255, 255, 255, 0.08); border-radius: 4px; overflow: hidden; margin-top: 4px;`;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'loading-progress-bar';
        progressBar.id = 'loading-progress-bar';
        progressBar.style.cssText = `width: 0%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #6366f1, #a78bfa); border-radius: 4px; transition: width 0.4s ease;`;
        progressContainer.appendChild(progressBar);
        
        const status = document.createElement('p');
        status.className = 'loading-status';
        status.id = 'loading-status-text';
        status.style.cssText = `color: rgba(255, 255, 255, 0.4); font-size: 12px; margin-top: 14px;`;
        status.textContent = 'Inicializando...';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loadingPulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.06); opacity: 0.85; } }
            @keyframes loadingSpin { to { transform: rotate(360deg); } }
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
    
    getSupabase() {
        if (window.SupabaseClient?.getClient) {
            const client = window.SupabaseClient.getClient();
            if (client) return client;
        }
        if (window.SupabaseClient?.client) return window.SupabaseClient.client;
        if (window.supabaseClient) return window.supabaseClient;
        return null;
    }
    
    getNomeUsuario() {
        if (!this.user) return 'Usuário';
        return this.user.nome || this.user.displayName || this.user.full_name || this.user.name ||
               this.user.email?.split('@')[0] || 'Usuário';
    }
    
    async init() {
        if (this._isInitializing) return;
        this._isInitializing = true;
        
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
        console.log('[App PC] 🆔 User ID:', this.user.id);
        console.log('[App PC] 📛 Nome:', this.getNomeUsuario());
        
        const nomeExibicao = this.getNomeUsuario();
        this.updateLoadingStatus(`Olá, ${nomeExibicao}!`, 10);
        this.atualizarNomeUsuario(nomeExibicao);
        
        const iniciais = nomeExibicao.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        this.atualizarAvatar(iniciais);
        
        if (window.CacheManager) {
            console.log('[App PC] 🔄 Inicializando CacheManager...');
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
            console.log('[App PC] ✅ CacheManager inicializado');
        }
        
        this.updateLoadingStatus('Inicializando cache...', 20);
        
        this.updateLoadingStatus('Conectando ao servidor...', 25);
        await this.waitForSupabase();
        
        this.updateLoadingStatus('Inicializando sincronização...', 30);
        if (window.initSync) {
            try {
                await window.initSync({ force: false });
            } catch(e) {
                console.warn('[App PC] ⚠️ Erro no sync:', e);
            }
        }
        
        this.updateLoadingStatus('Carregando módulos...', 40);
        this.loadModules();
        
        this.updateLoadingStatus('Carregando dados da nuvem...', 45);
        await this.loadDataFromCloud();
        
        this.updateLoadingStatus('Carregando dados locais...', 55);
        await this.loadData();
        
        this.updateLoadingStatus('Configurando...', 70);
        this.setupNavigation();
        
        this.updateLoadingStatus('Preparando...', 80);
        this.setupEvents();
        
        this.updateLoadingStatus('Quase pronto!', 90);
        this.showView('inicio');
        
        this.updateLoadingStatus('Atualizando...', 95);
        this.updateBadge();
        
        this.updateLoadingStatus('Carregando notificações...', 96);
        await this.loadNotificationsFromSupabase();
        
        this.updateLoadingStatus('Pronto!', 100);
        setTimeout(() => { this.closeLoadingOverlay(); }, 400);
        
        this._isInitializing = false;
        console.log('[App PC] ✅ Aplicação pronta!');
    }
    
    atualizarNomeUsuario(nome) {
        if (!nome && this.user) nome = this.getNomeUsuario();
        
        const ids = ['userNameDisplay', 'userName', 'userName2', 'userName3', 
                     'userName4', 'userName5', 'userNameIA', 'miniName',
                     'header-name', 'profile-name'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = nome;
        });
        
        const miniEmail = document.getElementById('miniEmail');
        if (miniEmail && this.user) miniEmail.textContent = this.user.email || '';
        
        const profileEmail = document.getElementById('profileEmail');
        if (profileEmail && this.user) profileEmail.textContent = this.user.email || '';
        
        const iniciais = nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
        this.atualizarAvatar(iniciais);
    }
    
    atualizarAvatar(iniciais) {
        const ids = ['userAvatar', 'userAvatar2', 'userAvatar3', 'userAvatar4', 'userAvatar5', 'userAvatarIA'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = iniciais || 'U';
        });
    }
    
    async carregarAvatar() {
        if (!this.user) return;
        const miniAvatar = document.getElementById('miniAvatar');
        const avatarImage = document.getElementById('avatarImage');
        
        if (window.CacheManager) {
            const photoUrl = await window.CacheManager.getProfilePhotoUrl();
            if (photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('http'))) {
                if (miniAvatar) miniAvatar.src = photoUrl;
                if (avatarImage) avatarImage.src = photoUrl;
                this.user.profilePhotoUrl = photoUrl;
                localStorage.setItem('usuarioLogado', JSON.stringify(this.user));
            }
        }
    }
    
    async waitForSupabase() {
        if (this.getSupabase()) return true;
        
        if (window.SupabaseClient?.initSupabase) {
            window.SupabaseClient.initSupabase();
        }
        
        let attempts = 0;
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                attempts++;
                if (this.getSupabase()) {
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= 50) {
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 200);
        });
    }
    
    async loadDataFromCloud() {
        try {
            if (!window.CacheManager) return false;
            const result = await window.CacheManager.loadFromCloud(true);
            return result;
        } catch (error) {
            console.error('[App PC] ❌ Erro nuvem:', error);
            return false;
        }
    }
    
    async loadData() {
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                this.data.profile = JSON.parse(usuario);
                console.log('[App PC] 👤 Perfil carregado do localStorage');
            } catch(e) {
                console.warn('[App PC] ⚠️ Erro ao ler usuarioLogado:', e);
                this.data.profile = {};
            }
        }
        
        if (window.CacheManager) {
            this.data.tasks = window.CacheManager.get('tasks', []);
            this.data.notes = window.CacheManager.get('notes', []);
            this.data.calendarEvents = window.CacheManager.get('calendarEvents', []);
            this.data.weeklySchedule = window.CacheManager.get('weeklySchedule', {});
            this.data.timeSlots = window.CacheManager.get('timeSlots', []);
            this.data.notifications = window.CacheManager.get('notifications', []);
            this.data.disciplinas = window.CacheManager.get('disciplinas', []);
            this.data.documentos = window.CacheManager.get('documentos', []);
            this.data.studySessions = window.CacheManager.get('studySessions', []); // ⭐ ADICIONAR
            
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!this.data.weeklySchedule[day]) this.data.weeklySchedule[day] = [];
            });
            
            if (Array.isArray(this.data.notes)) {
                this.data.notes = this.data.notes.filter(n => {
                    const hasTitle = n.title && n.title.trim().length > 0;
                    const hasContent = n.content && n.content.trim().length > 0 && 
                                      n.content !== '<br>' && n.content !== '<div><br></div>' && n.content !== '<p><br></p>';
                    return hasTitle || hasContent;
                });
            }
            
            console.log('[App PC] 📊 Dados carregados:', {
                tasks: this.data.tasks.length,
                notes: this.data.notes.length,
                disciplinas: this.data.disciplinas.length,
                studySessions: this.data.studySessions.length // ⭐ ADICIONAR
            });
            
            if (this.data.profile && this.data.profile.nome) {
                this.atualizarNomeUsuario(this.data.profile.nome);
            }
            this.carregarAvatar();
        }
    }
    
    async saveAllData() {
        if (this.isSaving) return;
        this.isSaving = true;
        
        if (!window.CacheManager) { this.isSaving = false; return; }
        const userId = this.user?.id;
        if (!userId) { this.isSaving = false; return; }
        
        try {
            const KEYS_TO_SAVE = [
                'tasks', 'notes', 'calendarEvents', 'weeklySchedule',
                'timeSlots', 'notifications', 'disciplinas', 'documentos', 'studySessions' // ⭐ ADICIONAR
            ];
            
            for (const key of KEYS_TO_SAVE) {
                if (this.data[key] !== undefined && this.data[key] !== null) {
                    window.CacheManager.set(key, this.data[key], false);
                }
            }
            
            if (window.CacheManager._syncTimeout) clearTimeout(window.CacheManager._syncTimeout);
            window.CacheManager._syncTimeout = setTimeout(() => {
                if (window.CacheManager.forceSync) {
                    window.CacheManager.forceSync().catch(() => {});
                }
            }, 3000);
            
        } catch (error) {
            console.error('[App PC] ❌ Erro ao salvar:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
    }
    
    async deleteItem(type, id) {
        if (!window.CacheManager) return false;
        const userId = this.user?.id;
        if (!userId) return false;
        
        try {
            const deleted = window.CacheManager.delete(type, id, true);
            if (deleted) {
                this.data[type] = window.CacheManager.get(type, []);
                if (window.CacheManager._syncTimeout) clearTimeout(window.CacheManager._syncTimeout);
                window.CacheManager._syncTimeout = setTimeout(() => {
                    window.CacheManager.forceSync().catch(() => {});
                }, 1000);
                window.dispatchEvent(new CustomEvent(`${type}Updated`, { detail: this.data[type] }));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`[App PC] ❌ Erro delete ${type}:`, error);
            return false;
        }
    }
    
    async loadNotificationsFromSupabase() {
        try {
            const client = this.getSupabase();
            if (!client || !this.user) return;

            const { data, error } = await client
                .from('notifications').select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false }).limit(50);

            if (error) return;

            if (data && data.length > 0) {
                const notificacoes = data.map(n => ({
                    id: n.id, title: n.title || 'Notificação', message: n.message || '',
                    type: n.type || 'info', read: n.read || false, time: n.created_at
                }));
                this.data.notifications = notificacoes;
                if (window.CacheManager) window.CacheManager.set('notifications', notificacoes, true);
                localStorage.setItem(`${this.user.id}_notifications`, JSON.stringify(notificacoes));
                this.updateBadge();
                window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            }
        } catch (error) {
            console.error('[App PC] ❌ Erro notificações:', error);
        }
    }
    
    async deleteNotification(id) {
        try {
            const client = this.getSupabase();
            if (client && this.user) {
                await client.from('notifications').delete().eq('id', id).eq('user_id', this.user.id);
            }
            this.data.notifications = this.data.notifications.filter(n => n.id != id);
            if (window.CacheManager) window.CacheManager.set('notifications', this.data.notifications, true);
            this.updateBadge();
            this.renderNotifications();
            if (typeof showToast === 'function') showToast('🗑️ Notificação removida!', 'success');
        } catch (error) {
            console.error('[App PC] ❌ Erro:', error);
        }
    }
    
    async marcarTodasComoLidas() {
        try {
            const naoLidas = this.data.notifications.filter(n => !n.read);
            if (naoLidas.length === 0) {
                if (typeof showToast === 'function') showToast('✅ Já estão lidas!', 'info');
                return;
            }
            const client = this.getSupabase();
            if (client && this.user) {
                await client.from('notifications').update({ read: true })
                    .in('id', naoLidas.map(n => n.id)).eq('user_id', this.user.id);
            }
            this.data.notifications.forEach(n => { if (!n.read) n.read = true; });
            if (window.CacheManager) window.CacheManager.set('notifications', this.data.notifications, true);
            this.updateBadge();
            this.renderNotifications();
            if (typeof showToast === 'function') showToast('✅ Marcadas como lidas!', 'success');
        } catch (error) {
            console.error('[App PC] ❌ Erro:', error);
        }
    }
    
    async limparTodasNotificacoes() {
        if (!confirm('Limpar todas as notificações?')) return;
        try {
            const client = this.getSupabase();
            if (client && this.user) {
                await client.from('notifications').delete().eq('user_id', this.user.id);
            }
            this.data.notifications = [];
            if (window.CacheManager) window.CacheManager.set('notifications', [], true);
            this.updateBadge();
            this.renderNotifications();
            if (typeof showToast === 'function') showToast('🗑️ Limpas!', 'success');
        } catch (error) {
            console.error('[App PC] ❌ Erro:', error);
        }
    }
    
    loadModules() {
        console.log('[App PC] 🔧 Carregando módulos...');
        
        if (typeof InicioModule !== 'undefined') {
            this.modules.inicio = new InicioModule(this);
            console.log('[App PC] ✅ InicioModule carregado');
        } else {
            console.error('[App PC] ❌ InicioModule NÃO definido!');
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
        } else if (typeof IAModule !== 'undefined') {
            this.modules.ia = new IAModule(this);
        }
        if (typeof DisciplinasModule !== 'undefined') {
            this.modules.disciplinas = new DisciplinasModule(this);
            this.modules.disciplinas.setupEventos();
        }
      if (typeof DocumentosModule !== 'undefined') {
    this.modules.documentos = new DocumentosModule(this);
}
if (typeof FocoModule !== 'undefined') {
    this.modules.foco = new FocoModule(this);
    console.log('[App PC] ✅ FocoModule carregado');
} else {
    console.error('[App PC] ❌ FocoModule NÃO definido! Verifique modules/foco.js');
}
console.log('[App PC] 📦 Módulos carregados:', Object.keys(this.modules));
    }
    
    loadCSS(moduleName) {
        const cssPath = this.cssModules[moduleName];
        if (!cssPath || this.loadedCSS.has(moduleName)) return;
        
        const existing = document.querySelector(`link[href="${cssPath}"]`);
        if (existing) { this.loadedCSS.add(moduleName); return; }
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
        this.loadedCSS.add(moduleName);
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
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const viewIA = document.getElementById('view-ia');
    const viewFoco = document.getElementById('view-foco');
    const btnIA = document.getElementById('btnOpenIA');

    // Esconder sidebar para IA e FOCO (tela cheia)
    if (viewName === 'ia' || viewName === 'foco') {
        if (sidebar) sidebar.style.display = 'none';
        if (mainContent) {
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
            mainContent.style.padding = '0';
        }
        if (btnIA) btnIA.style.display = 'none';
        document.body.style.overflow = 'hidden';

        if (viewName === 'ia') {
            if (viewIA) {
                viewIA.style.display = 'flex';
                viewIA.style.position = 'fixed';
                viewIA.style.top = '0';
                viewIA.style.left = '0';
                viewIA.style.width = '100%';
                viewIA.style.height = '100vh';
                viewIA.style.zIndex = '9999';
                viewIA.style.background = 'var(--bg-color)';
                viewIA.style.overflow = 'auto';
            }
            if (viewFoco) viewFoco.style.display = 'none';
        } else if (viewName === 'foco') {
            if (viewFoco) {
                viewFoco.style.display = 'block';
                viewFoco.style.position = 'fixed';
                viewFoco.style.top = '0';
                viewFoco.style.left = '0';
                viewFoco.style.width = '100vw';
                viewFoco.style.height = '100vh';
                viewFoco.style.zIndex = '9998';
                viewFoco.style.overflow = 'auto';
                viewFoco.style.background = '#0a0810';
            }
            if (viewIA) viewIA.style.display = 'none';
        }
    } else {
        // Restaurar layout normal
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
        if (viewFoco) {
            viewFoco.style.display = 'none';
            viewFoco.style.position = 'relative';
            viewFoco.style.zIndex = '1';
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
        if (viewName !== 'ia' && viewName !== 'foco') {
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
            try {
                this.modules[moduleName].render(this.data);
            } catch (err) {
                console.error(`[App PC] ❌ Erro render ${moduleName}:`, err);
            }
        } else {
            console.warn('[App PC] ⚠️ Módulo não encontrado:', viewName, '→', moduleName);
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
        if (filter === 'nao-lidas') notificacoes = notificacoes.filter(n => !n.read);
        
        if (notificacoes.length === 0) {
            container.innerHTML = `<div class="notif-empty"><i class="fas fa-bell-slash"></i><p>Nenhuma notificação</p></div>`;
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
            if (window.CacheManager) window.CacheManager.set('notifications', this.data.notifications, true);
            this.renderNotifications();
            this.updateBadge();
        }
    }
    
    updateBadge() {
        const naoLidas = (this.data.notifications || []).filter(n => !n.read).length;
        document.querySelectorAll('.badge, .notif-badge').forEach(badge => {
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
    
    setupEvents() {
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Deseja sair?')) {
                localStorage.removeItem('usuarioLogado');
                if (window.CacheManager) window.CacheManager.logout();
                window.location.href = 'login/index.html';
            }
        });
        
        document.querySelectorAll('[id^="bellBtn"]').forEach(btn => {
            btn.addEventListener('click', () => this.openNotifications());
        });
        
        document.getElementById('btnOpenIA')?.addEventListener('click', () => this.showView('ia'));
        document.getElementById('navBackBtn')?.addEventListener('click', () => this.showView('inicio'));
        document.getElementById('btnMarkAllRead')?.addEventListener('click', () => this.marcarTodasComoLidas());
        document.getElementById('btnClearAll')?.addEventListener('click', () => this.limparTodasNotificacoes());
        
        document.querySelectorAll('.notif-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.notif-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderNotifications(tab.dataset.filter);
            });
        });
        
        document.getElementById('notifModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeNotifications();
        });
        
        window.addEventListener('cloudDataLoaded', () => {
           console.log('[App PC] 📡 cloudDataLoaded recebido (ignorado para evitar sobrescrever)');
           this.updateBadge();
       });
        
        window.addEventListener('forceRefresh', () => {
            if (this.modules[this.currentView]) this.modules[this.currentView].render(this.data);
            this.updateBadge();
        });
        
        window.addEventListener('notificationsUpdated', () => {
            if (this.modules[this.currentView]) this.modules[this.currentView].render(this.data);
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
        
        window.addEventListener('disciplinasUpdated', () => {
            this.updateBadge();
        });
        
        window.addEventListener('documentosUpdated', () => {
            if (this.modules.documentos) this.modules.documentos.render(this.data);
        });
        
        document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (document.getElementById('notifModal')?.classList.contains('active')) {
            this.closeNotifications();
        }
        if (this.currentView === 'ia' || this.currentView === 'foco') {
            this.showView('inicio');
        }
    }
});
        
        window.addEventListener('newNotification', () => {
            this.loadNotificationsFromSupabase();
            this.updateBadge();
            if (this.modules[this.currentView]) this.modules[this.currentView].render(this.data);
        });
        
        window.addEventListener('storage', (e) => {
            if (e.key && (e.key.includes('_') || e.key === 'usuarioLogado')) {
                if (e.key === 'usuarioLogado' && e.newValue) {
                    try {
                        const user = JSON.parse(e.newValue);
                        if (user && user.nome) this.atualizarNomeUsuario(user.nome);
                    } catch(err) {}
                }
                this.loadData();
                if (this.modules[this.currentView]) this.modules[this.currentView].render(this.data);
                this.updateBadge();
            }
        });
        
        setTimeout(() => {
            const nome = this.getNomeUsuario();
            if (nome && nome !== 'Usuário') this.atualizarNomeUsuario(nome);
        }, 1000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { window.app = new App(); }, 100);
});

console.log('[App PC] ✅ app.js carregado!');