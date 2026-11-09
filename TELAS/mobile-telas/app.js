// ============================================
// app.js - MOBILE COMPLETO (v4)
// ⭐ FAB da IA funcional
// ⭐ Modo Foco → download app
// ⭐ Documentos (Storage + Turso) via CacheManager
// ⭐ IA com histórico na nuvem
// ⭐ SEM gíria
// ============================================

console.log('[SPA] 🚀 Iniciando aplicação mobile...');

class App {
    constructor() {
        this.user = null;
        this.currentView = 'dashboard';

        this.viewToModuleMap = {
            'dashboard': 'dashboard',
            'calendario': 'calendario',
            'tarefas': 'tarefas',
            'notas': 'notas',
            'perfil': 'perfil',
            'ia': 'ia',
            'documentos': 'documentos',
            'disciplinas': 'disciplinas'
        };

        this.data = {
            tasks: [],
            notes: [],
            calendarEvents: [],
            weeklySchedule: {},
            timeSlots: [],
            notifications: [],
            disciplinas: [],
            documentos: [],
            profile: {},
            settings: {
                theme: 'dark',
                accent: '#8b5cf6',
                fontSize: 14
            }
        };

        this.isLoading = false;
        this.isSaving = false;
        this.modules = {};
        this.loadedCSS = new Set();
        this.currentDate = new Date();
        this.selectedDay = this.currentDate.getDate();
        this._loadingOverlay = null;
        this._profileObserver = null;
        this._profileUpdateTimeout = null;
        this._profileUpdateRetries = 0;
        this._maxProfileRetries = 3;
        this._isAppReady = false;
        this._isInitializing = false;
        this._syncRetryCount = 0;
        this._maxSyncRetries = 3;
        this._saveTimeout = null;
        this._dataLoadedFromCloud = false;

        this.cssModules = {
            dashboard: 'css/dashboard.css',
            calendario: 'css/calendario.css',
            tarefas: 'css/tarefas.css',
            notas: 'css/notas.css',
            perfil: 'css/perfil.css',
            ia: 'css/ia.css',
            documentos: 'css/documentos.css',
            disciplinas: 'css/disciplinas.css'
        };

        this.init();
    }

    // ══════════════════════════════════════════════════════
    //  LOADING OVERLAY
    // ══════════════════════════════════════════════════════
    createLoadingOverlay() {
        if (this._loadingOverlay) return;

        this._loadingOverlay = document.createElement('div');
        this._loadingOverlay.id = 'app-loading-overlay';
        this._loadingOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            transition: opacity 0.5s ease;
        `;

        const icon = document.createElement('div');
        icon.style.cssText = `font-size: 48px; margin-bottom: 20px; animation: pulse 1.5s ease-in-out infinite;`;
        icon.innerHTML = `<img src='https://i.postimg.cc/4y9jpb8K/logo1-removebg-preview.png' border='0' alt='logo' style='width: 120px; height: 120px; object-fit: contain;'>`;

        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px; height: 50px;
            border: 4px solid rgba(139, 92, 246, 0.2);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 24px;
        `;

        const title = document.createElement('h2');
        title.style.cssText = `color: #fff; font-size: 20px; font-weight: 600; margin: 0 0 8px 0;`;
        title.textContent = 'Carregando...';

        const subtitle = document.createElement('p');
        subtitle.style.cssText = `color: rgba(255, 255, 255, 0.6); font-size: 14px; margin: 0;`;
        subtitle.id = 'loading-status';
        subtitle.textContent = 'Preparando seus dados...';

        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 200px; height: 4px; background: rgba(255, 255, 255, 0.1);
            border-radius: 2px; margin-top: 20px; overflow: hidden;
        `;

        const progressBar = document.createElement('div');
        progressBar.id = 'loading-progress-bar';
        progressBar.style.cssText = `
            width: 0%; height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
            border-radius: 2px; transition: width 0.3s ease;
        `;
        progressContainer.appendChild(progressBar);

        this._loadingOverlay.appendChild(icon);
        this._loadingOverlay.appendChild(spinner);
        this._loadingOverlay.appendChild(title);
        this._loadingOverlay.appendChild(subtitle);
        this._loadingOverlay.appendChild(progressContainer);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        `;
        this._loadingOverlay.appendChild(style);

        document.body.appendChild(this._loadingOverlay);
    }

    updateLoadingStatus(message, progress = null) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) statusEl.textContent = message;
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

    loadCSS(moduleName) {
        const cssPath = this.cssModules[moduleName];
        if (!cssPath || this.loadedCSS.has(moduleName)) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
        this.loadedCSS.add(moduleName);
    }

    // ══════════════════════════════════════════════════════
    //  SUPABASE
    // ══════════════════════════════════════════════════════
    async waitForSupabase() {
        if (this.getSupabase()) {
            console.log('[SPA] ✅ Supabase já disponível');
            return true;
        }

        console.log('[SPA] ⏳ Aguardando Supabase...');
        this.updateLoadingStatus('Conectando ao servidor...', 10);

        if (window.SupabaseClient?.initSupabase) {
            window.SupabaseClient.initSupabase();
        }

        let attempts = 0;
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                attempts++;
                if (this.getSupabase()) {
                    clearInterval(checkInterval);
                    this.updateLoadingStatus('Conectado!', 20);
                    resolve(true);
                } else if (attempts >= 50) {
                    clearInterval(checkInterval);
                    this.updateLoadingStatus('Modo offline', 20);
                    resolve(false);
                }
            }, 200);
        });
    }

    getSupabase() {
        if (window.SupabaseClient?.getClient) return window.SupabaseClient.getClient();
        if (window.SupabaseClient?.client) return window.SupabaseClient.client;
        if (window.supabaseClient) return window.supabaseClient;
        return null;
    }

    // ══════════════════════════════════════════════════════
    //  PROFILE OBSERVER
    // ══════════════════════════════════════════════════════
    setupProfileObserver() {
        if (this._profileObserver) {
            this._profileObserver.disconnect();
        }
        if (this._profileUpdateTimeout) {
            clearTimeout(this._profileUpdateTimeout);
        }

        const targetNode = document.getElementById('view-perfil');
        if (!targetNode) return;

        this._profileObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (targetNode.classList.contains('active')) {
                        this._profileUpdateRetries = 0;
                        this.updateProfileUI();
                        this.updateProfileStats();
                    }
                }
            }
        });

        this._profileObserver.observe(targetNode, {
            attributes: true,
            attributeFilter: ['class']
        });

        if (targetNode.classList.contains('active')) {
            this._profileUpdateRetries = 0;
            this.updateProfileUI();
            this.updateProfileStats();
        }
    }

    updateProfileUI() {
        if (!this.user) return;
        if (this._profileUpdateRetries >= this._maxProfileRetries) return;

        const nome = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        const email = this.user.email || 'usuario@email.com';
        const initial = nome.charAt(0).toUpperCase();

        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = nome;

        const profileEmail = document.getElementById('profile-email');
        if (profileEmail) profileEmail.textContent = email;

        const profileInitial = document.getElementById('profile-initial');
        if (profileInitial) profileInitial.textContent = initial;

        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) avatarPreview.textContent = initial;

        const profileNameInput = document.getElementById('profile-name-input');
        if (profileNameInput) profileNameInput.value = nome;

        const profileEmailInput = document.getElementById('profile-email-input');
        if (profileEmailInput) profileEmailInput.value = email;

        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nome.split(' ')[0];

        this._profileUpdateRetries++;
    }

    updateProfileStats() {
        const tarefas = this.data.tasks?.length || 0;
        const notas = this.data.notes?.length || 0;
        const eventos = this.data.calendarEvents?.length || 0;

        const statTarefas = document.getElementById('stat-tarefas');
        if (statTarefas) statTarefas.textContent = tarefas;

        const statNotas = document.getElementById('stat-notas');
        if (statNotas) statNotas.textContent = notas;

        const statEventos = document.getElementById('stat-eventos');
        if (statEventos) statEventos.textContent = eventos;
    }

    // ══════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════
    async init() {
        if (this._isInitializing) return;
        this._isInitializing = true;

        this.createLoadingOverlay();
        this.updateLoadingStatus('Inicializando...', 5);

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
        this.updateLoadingStatus(`Olá, ${this.user.nome || 'Usuário'}!`, 10);

        // CacheManager
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
            window.dispatchEvent(new CustomEvent('cacheReady'));
            console.log('[SPA] ✅ CacheManager inicializado com userId:', this.user.id);
        } else {
            console.warn('[SPA] ⚠️ CacheManager não encontrado!');
        }

        const nomeExibicao = this.user.nome || this.user.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];

        this._profileUpdateRetries = 0;
        this.updateProfileUI();

        // Aguardar Supabase
        await this.waitForSupabase();

        // SyncHelper
        this.updateLoadingStatus('Inicializando sincronização...', 30);
        if (window.initSync) {
            try {
                await window.initSync();
                console.log('[SPA] ✅ SyncHelper inicializado');
            } catch(e) {
                console.warn('[SPA] ⚠️ Erro no SyncHelper:', e);
            }
        } else {
            console.warn('[SPA] ⚠️ sync-helper.js não carregado!');
        }

        // Carregar módulos
        this.updateLoadingStatus('Carregando módulos...', 35);
        this.loadModules();

        // Carregar dados
        this.updateLoadingStatus('Carregando seus dados...', 40);
        await this.loadAllData();

        // Atualizar perfil
        this._profileUpdateRetries = 0;
        this.updateProfileUI();
        this.updateProfileStats();

        // Setup
        this.updateLoadingStatus('Configurando...', 85);
        this.setupNavigation();
        this.setupEvents();
        this.setupProfileObserver();

        if (this.modules.ia) this.modules.ia.setupEvents();

        // Renderizar view inicial
        this.updateLoadingStatus('Quase pronto!', 95);
        await this.showView('dashboard');

        this.updateBadge();

        // Sync inicial
        this.updateLoadingStatus('Sincronizando dados...', 90);
        await this.forceInitialSync();

        // Notificações
        this.updateLoadingStatus('Carregando notificações...', 92);
        await this.loadNotificationsFromSupabase();

        // Fechar loading
        setTimeout(() => {
            this.updateLoadingStatus('Pronto!', 100);
            setTimeout(() => this.closeLoadingOverlay(), 300);
        }, 500);

        this._isAppReady = true;
        this._isInitializing = false;
        console.log('[SPA] ✅ Aplicação pronta!');
    }

    // ══════════════════════════════════════════════════════
    //  NOTIFICAÇÕES
    // ══════════════════════════════════════════════════════
    async loadNotificationsFromSupabase() {
        try {
            const client = this.getSupabase();
            if (!client || !this.user) return;

            const { data, error } = await client
                .from('notifications')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('[SPA] ⚠️ Erro ao carregar notificações:', error);
                return;
            }

            if (data && data.length > 0) {
                const notificacoes = data.map(n => ({
                    id: n.id,
                    title: n.title || 'Notificação',
                    message: n.message || '',
                    type: n.type || 'info',
                    read: n.read || false,
                    time: n.created_at
                }));

                this.data.notifications = notificacoes;

                if (window.CacheManager) {
                    window.CacheManager.set('notifications', notificacoes, true);
                }

                localStorage.setItem(`${this.user.id}_notifications`, JSON.stringify(notificacoes));

                this.updateBadge();
                window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            }
        } catch (error) {
            console.error('[SPA] ❌ Erro notificações:', error);
        }
    }

    // ══════════════════════════════════════════════════════
    //  SYNC INICIAL
    // ══════════════════════════════════════════════════════
    async forceInitialSync() {
        try {
            if (!window.CacheManager) return false;
            if (!window.DatabaseService) {
                if (window.SupabaseClient?.initSupabase) {
                    await window.SupabaseClient.initSupabase();
                    await new Promise(r => setTimeout(r, 1000));
                }
                if (!window.DatabaseService) return false;
            }

            const result = await window.CacheManager.forceSync();
            await this.loadAllData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
            return result;
        } catch (error) {
            console.error('[SPA] ❌ Erro no sync inicial:', error);
            if (this._syncRetryCount < this._maxSyncRetries) {
                this._syncRetryCount++;
                setTimeout(() => this.forceInitialSync(), 3000);
            }
            return false;
        }
    }

    // ══════════════════════════════════════════════════════
    //  CARREGAR MÓDULOS
    // ══════════════════════════════════════════════════════
    loadModules() {
        if (typeof DashboardModule !== 'undefined') this.modules.dashboard = new DashboardModule(this);
        if (typeof CalendarioModule !== 'undefined') this.modules.calendario = new CalendarioModule(this);
        if (typeof TarefasModule !== 'undefined') this.modules.tarefas = new TarefasModule(this);
        if (typeof NotasModule !== 'undefined') this.modules.notas = new NotasModule(this);
        if (typeof PerfilModule !== 'undefined') this.modules.perfil = new PerfilModule(this);
        if (typeof IAModule !== 'undefined') this.modules.ia = new IAModule(this);
        if (typeof DocumentosModule !== 'undefined') this.modules.documentos = new DocumentosModule(this);
        if (typeof DisciplinasModule !== 'undefined') {
            this.modules.disciplinas = new DisciplinasModule(this);
            this.modules.disciplinas._setupEventos();
        }
        console.log('[SPA] 📦 Módulos:', Object.keys(this.modules));
    }

    // ══════════════════════════════════════════════════════
    //  CARREGAR DADOS
    // ══════════════════════════════════════════════════════
    async loadAllData(retryCount = 0) {
        if (this.isLoading) return;
        this.isLoading = true;

        console.log(`[SPA] 📊 Carregando dados (tentativa ${retryCount + 1})`);
        this.updateLoadingStatus('Carregando dados...', 40);

        let loadedFromCloud = false;
        try {
            if (window.CacheManager && window.DatabaseService) {
                const userId = this.user?.id;
                if (userId) {
                    const cloudData = await window.CacheManager.loadFromCloud(false);
                    if (cloudData) {
                        loadedFromCloud = true;
                        this._dataLoadedFromCloud = true;
                        this.updateLoadingStatus('Dados da nuvem carregados!', 70);
                        await this._syncDataFromCacheManager();
                        this.isLoading = false;
                        if (this.modules.dashboard) this.modules.dashboard.render(this.data);
                        return;
                    }
                }
            }
        } catch (error) {
            console.warn('[SPA] ⚠️ Erro ao carregar da nuvem:', error);
        }

        // Cache
        if (!loadedFromCloud) {
            const cached = sessionStorage.getItem('app_data');
            if (cached) {
                try {
                    const data = JSON.parse(cached);
                    if (data && typeof data === 'object') {
                        this.data = { ...this.data, ...data };
                        this.updateLoadingStatus('Dados do cache', 70);
                        this.isLoading = false;
                        if (this.modules.dashboard) this.modules.dashboard.render(this.data);
                        return;
                    }
                } catch(e) {}
            }
        }

        // localStorage
        this.loadDataFromLocalStorage();
        this.isLoading = false;
    }

    async _syncDataFromCacheManager() {
        if (!window.CacheManager) return;

        const tipos = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas', 'documentos'];

        for (const tipo of tipos) {
            const dados = window.CacheManager.get(tipo, null);
            if (dados !== null && dados !== undefined) {
                if (tipo === 'documentos' && Array.isArray(dados)) {
                    if (dados.length > 0 || this.data.documentos.length > 0) {
                        this.data[tipo] = dados;
                    }
                } else if (tipo === 'notes' && Array.isArray(dados)) {
                    const filtradas = dados.filter(n => {
                        const hasTitle = n.title && n.title.trim().length > 0;
                        const hasContent = n.content && n.content.trim().length > 0 &&
                                          n.content !== '<br>' &&
                                          n.content !== '<div><br></div>' &&
                                          n.content !== '<p><br></p>';
                        return hasTitle || hasContent;
                    });
                    this.data[tipo] = filtradas;
                    if (filtradas.length > 0) window.CacheManager.set(tipo, filtradas, true);
                } else {
                    this.data[tipo] = dados;
                }
            }
        }

        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(day => {
            if (!this.data.weeklySchedule[day]) this.data.weeklySchedule[day] = [];
        });

        if (!this.data.settings || typeof this.data.settings !== 'object') {
            this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        }

        sessionStorage.setItem('app_data', JSON.stringify(this.data));
    }

    loadDataFromLocalStorage() {
        this.updateLoadingStatus('Carregando dados locais...', 60);

        const userId = this.user.id;
        const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas', 'documentos'];

        let loaded = false;

        for (const type of types) {
            const key = `${userId}_${type}`;
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
                        if (type === 'notes' && Array.isArray(parsed)) {
                            this.data[type] = parsed.filter(n => {
                                const hasTitle = n.title && n.title.trim().length > 0;
                                const hasContent = n.content && n.content.trim().length > 0 &&
                                                  n.content !== '<br>' &&
                                                  n.content !== '<div><br></div>' &&
                                                  n.content !== '<p><br></p>';
                                return hasTitle || hasContent;
                            });
                        } else {
                            this.data[type] = parsed;
                        }
                        loaded = true;
                    }
                } catch(e) {}
            }
        }

        if (!this.data.settings || typeof this.data.settings !== 'object') {
            this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        }

        if (loaded) {
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            this.updateLoadingStatus('Dados locais carregados', 80);
            if (this.modules.dashboard) this.modules.dashboard.render(this.data);
        } else {
            this.updateLoadingStatus('Sem dados locais', 70);
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!this.data.weeklySchedule[day]) this.data.weeklySchedule[day] = [];
            });
            if (this.modules.dashboard) this.modules.dashboard.render(this.data);
        }
    }

    // ══════════════════════════════════════════════════════
    //  SALVAR
    // ══════════════════════════════════════════════════════
    async saveAllData() {
        if (this.isSaving) return;
        this.isSaving = true;

        try {
            if (Array.isArray(this.data.notes)) {
                this.data.notes = this.data.notes.filter(n => {
                    const hasTitle = n.title && n.title.trim().length > 0;
                    const hasContent = n.content && n.content.trim().length > 0 &&
                                      n.content !== '<br>' &&
                                      n.content !== '<div><br></div>' &&
                                      n.content !== '<p><br></p>';
                    return hasTitle || hasContent;
                });
            }

            if (Array.isArray(this.data.documentos)) {
                this.data.documentos = this.data.documentos.filter(doc => {
                    if (!doc.nome || doc.nome.trim() === '') return false;
                    if (!doc.arquivo || doc.arquivo.trim() === '') return false;
                    return true;
                });
            }

            sessionStorage.setItem('app_data', JSON.stringify(this.data));

            const userId = this.user.id;
            const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas', 'documentos'];

            for (const type of types) {
                const key = `${userId}_${type}`;
                if (this.data[type] !== undefined && this.data[type] !== null) {
                    localStorage.setItem(key, JSON.stringify(this.data[type]));
                    if (this.user.email) {
                        localStorage.setItem(`${type}_${this.user.email}`, JSON.stringify(this.data[type]));
                    }
                }
            }

            if (window.CacheManager) {
                for (const type of types) {
                    if (this.data[type] !== undefined && this.data[type] !== null) {
                        window.CacheManager.set(type, this.data[type], true);
                    }
                }

                if (window.CacheManager._syncTimeout) {
                    clearTimeout(window.CacheManager._syncTimeout);
                }
                window.CacheManager._syncTimeout = setTimeout(() => {
                    if (window.CacheManager._saveQueue.length > 0 ||
                        window.CacheManager._deleteQueue.length > 0) {
                        window.CacheManager.forceSync().catch(() => {});
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('[SPA] ❌ Erro ao salvar:', error);
        }

        setTimeout(() => { this.isSaving = false; }, 500);
    }

    // ══════════════════════════════════════════════════════
    //  NAVEGAÇÃO
    // ══════════════════════════════════════════════════════
    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = item.dataset.view;
                if (view && view !== this.currentView) this.showView(view);
            });
        });

        document.getElementById('go-to-calendar')?.addEventListener('click', () => this.showView('calendario'));
        document.getElementById('go-to-disciplinas')?.addEventListener('click', () => this.showView('disciplinas'));
        document.getElementById('go-to-tasks')?.addEventListener('click', () => this.showView('tarefas'));
        document.getElementById('notification-bell-link')?.addEventListener('click', () => this.openNotifications());
    }

    async showView(viewName) {
        console.log(`[SPA] 📄 Mostrando: ${viewName}`);

        this.loadCSS(viewName);

        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });

        const view = document.getElementById(`view-${viewName}`);
        if (!view) {
            console.warn(`[SPA] ⚠️ View ${viewName} não encontrada`);
            return;
        }

        view.classList.remove('hidden');
        view.classList.add('active');

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        const subtitles = {
            dashboard: 'Bem-vindo de volta 👋',
            calendario: 'Meu Calendário 📅',
            tarefas: 'Gerenciador de Tarefas 📋',
            notas: 'Minhas Anotações 📝',
            perfil: 'Configurações da Conta 👤',
            ia: 'Assistente IA 🤖',
            documentos: 'Meus Documentos 📁'
        };
        const subtitleEl = document.getElementById('header-subtitle');
        if (subtitleEl) subtitleEl.textContent = subtitles[viewName] || '';

        if (viewName === 'perfil') {
            this._profileUpdateRetries = 0;
            this.updateProfileUI();
            this.updateProfileStats();
        }

        // FAB
        const fabIa = document.getElementById('btn-open-ia');
        if (fabIa) fabIa.style.display = (viewName === 'ia') ? 'none' : 'flex';

        const navBar = document.querySelector('.bottom-nav');
        if (navBar) navBar.style.display = (viewName === 'ia') ? 'none' : 'flex';

        // Render
        if (this.modules[viewName]) {
            try {
                await this.modules[viewName].render(this.data);
            } catch (e) {
                console.error(`[SPA] ❌ Erro ao renderizar ${viewName}:`, e);
            }
        }

        this.currentView = viewName;
    }

    // ══════════════════════════════════════════════════════
    //  NOTIFICAÇÕES (POP-UP)
    // ══════════════════════════════════════════════════════
    openNotifications() {
        const modal = document.getElementById('notifications-modal');
        if (modal) {
            modal.classList.add('active');
            this.renderNotificationsModal();
        } else {
            console.warn('[SPA] ⚠️ #notifications-modal não encontrado');
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
            const isRead = notif.read || false;
            html += `
                <div class="notification-item-modal ${isRead ? 'read' : 'unread'}" data-id="${notif.id}">
                    <div class="notification-icon ${notif.type || 'info'}">
                        <ion-icon name="notifications-outline"></ion-icon>
                    </div>
                    <div class="notification-content">
                        <div class="notification-title">${this.escapeHtml(notif.title)}</div>
                        <div class="notification-message">${this.escapeHtml(notif.message)}</div>
                        <div class="notification-time">${this.formatTimeAgo(notif.time)}</div>
                        ${!isRead ? '<span style="font-size:0.6rem;color:var(--accent-purple);font-weight:600;">● Nova</span>' : ''}
                    </div>
                    <button class="btn-delete-notification" data-id="${notif.id}" style="background:none;border:none;color:var(--text-secondary);font-size:1.2rem;cursor:pointer;padding:4px;">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            `;
        });
        container.innerHTML = html;

        container.querySelectorAll('.btn-delete-notification').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.deleteNotification(btn.dataset.id);
            });
        });
    }

    async deleteNotification(id) {
        try {
            const client = this.getSupabase();
            if (client && this.user) {
                await client.from('notifications').delete().eq('id', id).eq('user_id', this.user.id);
            }

            this.data.notifications = this.data.notifications.filter(n => n.id != id);

            if (this.user) {
                localStorage.setItem(`${this.user.id}_notifications`, JSON.stringify(this.data.notifications));
            }

            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            this.updateBadge();
            this.renderNotificationsModal();

            if (this.modules.dashboard) this.modules.dashboard.renderNotifications();

            if (typeof showToast === 'function') showToast('🗑️ Notificação removida!', 'success');
        } catch (error) {
            console.error('[SPA] ❌ Erro:', error);
        }
    }

    async marcarTodasComoLidas() {
        try {
            const naoLidas = this.data.notifications.filter(n => !n.read);
            if (naoLidas.length === 0) {
                if (typeof showToast === 'function') showToast('✅ Já estão todas lidas!', 'info');
                return;
            }

            const client = this.getSupabase();
            if (client && this.user) {
                const ids = naoLidas.map(n => n.id);
                await client.from('notifications').update({ read: true }).in('id', ids).eq('user_id', this.user.id);
            }

            this.data.notifications.forEach(n => { if (!n.read) n.read = true; });

            if (this.user) {
                localStorage.setItem(`${this.user.id}_notifications`, JSON.stringify(this.data.notifications));
            }

            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            this.updateBadge();
            this.renderNotificationsModal();

            if (this.modules.dashboard) this.modules.dashboard.renderNotifications();

            if (typeof showToast === 'function') showToast('✅ Todas marcadas como lidas!', 'success');
        } catch (error) {
            console.error('[SPA] ❌ Erro:', error);
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

            if (this.user) {
                localStorage.setItem(`${this.user.id}_notifications`, JSON.stringify(this.data.notifications));
            }

            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            this.updateBadge();
            this.renderNotificationsModal();

            if (this.modules.dashboard) this.modules.dashboard.renderNotifications();

            if (typeof showToast === 'function') showToast('🗑️ Notificações limpas!', 'success');
        } catch (error) {
            console.error('[SPA] ❌ Erro:', error);
        }
    }

    // ══════════════════════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════════════════════
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

    // ══════════════════════════════════════════════════════
    //  DOWNLOAD APP MESSAGE
    // ══════════════════════════════════════════════════════
    showDownloadAppMessage(featureName) {
        const overlay = document.createElement('div');
        overlay.id = 'download-app-modal';
        overlay.style.cssText = `
            position: fixed; inset: 0; background: rgba(0,0,0,0.75);
            display: flex; align-items: center; justify-content: center;
            z-index: 99999; padding: 20px;
            backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        `;

        overlay.innerHTML = `
            <div style="
                background: var(--card-bg, #1a1d24);
                border-radius: 20px; padding: 32px 24px; max-width: 340px; width: 100%;
                text-align: center; border: 1px solid var(--border-color, #2d3748);
                animation: slideUpApp 0.3s ease-out;
            ">
                <div style="
                    width: 72px; height: 72px; margin: 0 auto 20px;
                    background: linear-gradient(135deg, #8b5cf6, #6366f1);
                    border-radius: 20px; display: flex; align-items: center;
                    justify-content: center; font-size: 36px;
                ">🚀</div>
                <h2 style="color: var(--text-primary, #fff); margin: 0 0 12px; font-size: 20px;">
                    ${featureName}
                </h2>
                <p style="color: var(--text-secondary, #9ca3af); font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
                    Esta funcionalidade está disponível apenas na app Zero Satus.
                    Baixa agora e tem acesso completo!
                </p>
                <a href="https://play.google.com/store/apps/details?id=com.seu.app.zero"
                   target="_blank"
                   style="
                       display: flex; align-items: center; justify-content: center; gap: 8px;
                       width: 100%; padding: 14px; text-decoration: none;
                       background: linear-gradient(135deg, #8b5cf6, #6366f1);
                       color: white; border-radius: 12px; font-size: 15px;
                       font-weight: 600; margin-bottom: 10px;
                       box-sizing: border-box;
                   ">
                    <ion-icon name="logo-google-playstore"></ion-icon>
                    Baixar na Play Store
                </a>
                <button id="btn-cancel-download" style="
                    width: 100%; padding: 12px; border: 1px solid var(--border-color, #2d3748);
                    background: transparent; color: var(--text-secondary, #9ca3af);
                    border-radius: 12px; cursor: pointer; font-size: 14px;
                ">
                    Agora não
                </button>
            </div>
            <style>
                @keyframes slideUpApp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

        document.body.appendChild(overlay);

        document.getElementById('btn-cancel-download').onclick = () => overlay.remove();
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    // ══════════════════════════════════════════════════════
    //  SETUP EVENTS
    // ══════════════════════════════════════════════════════
    setupEvents() {
        // ⭐ FAB DA IA
        const btnOpenIA = document.getElementById('btn-open-ia');
        if (btnOpenIA) {
            btnOpenIA.addEventListener('click', () => {
                console.log('[SPA] 🤖 Abrindo IA via FAB...');
                this.showView('ia');
            });
        } else {
            console.warn('[SPA] ⚠️ #btn-open-ia não encontrado');
        }

        // ⭐ Modo Foco → download app
        const focusCard = document.getElementById('focus-card');
        if (focusCard) {
            focusCard.addEventListener('click', () => {
                this.showDownloadAppMessage('Modo Foco');
            });
        }

        // Notificações
        document.getElementById('notification-bell')?.addEventListener('click', () => {
            this.openNotifications();
        });

        document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
            document.getElementById('notifications-modal')?.classList.remove('active');
        });

        document.getElementById('btn-mark-read')?.addEventListener('click', () => {
            this.marcarTodasComoLidas();
        });

        document.getElementById('btn-clear-all')?.addEventListener('click', () => {
            this.limparTodasNotificacoes();
        });

        document.querySelectorAll('.notification-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderNotificationsModal(tab.dataset.type);
            });
        });

        // Storage
        window.addEventListener('storage', (e) => {
            if (e.key === 'app_data' && !this.isSaving) {
                try {
                    this.data = JSON.parse(e.newValue);
                    if (this.modules[this.currentView]) {
                        this.modules[this.currentView].render(this.data);
                    }
                } catch(e) {}
            }
        });

        // Cloud events
        window.addEventListener('cloudDataLoaded', () => {
            this.loadAllData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });

        window.addEventListener('forceRefresh', () => {
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });

        ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'disciplinas', 'notifications', 'documentos'].forEach(type => {
            window.addEventListener(`${type}Updated`, (e) => {
                if (e.detail) {
                    this.data[type] = e.detail;
                    sessionStorage.setItem('app_data', JSON.stringify(this.data));
                    if (this.modules[this.currentView]) {
                        this.modules[this.currentView].render(this.data);
                    }
                }
            });
        });

        window.addEventListener('syncCompleted', (e) => {
            if (e.detail && e.detail.success) {
                this.loadAllData();
                if (this.modules[this.currentView]) {
                    this.modules[this.currentView].render(this.data);
                }
            }
        });

        window.addEventListener('scheduleUpdated', (e) => {
            if (e.detail) {
                this.data.weeklySchedule = e.detail.weeklySchedule || this.data.weeklySchedule;
                this.data.timeSlots = e.detail.timeSlots || this.data.timeSlots;
                sessionStorage.setItem('app_data', JSON.stringify(this.data));
                if (this.currentView !== 'dashboard' && this.modules[this.currentView]) {
                    this.modules[this.currentView].render(this.data);
                }
            }
        });

        // Realtime
        window.addEventListener('newNotification', () => {
            if (this.user && this.getSupabase()) {
                this.getSupabase()
                    .from('notifications')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .order('created_at', { ascending: false })
                    .limit(10)
                    .then(({ data, error }) => {
                        if (!error && data && data.length > 0) {
                            this.data.notifications = data.map(n => ({
                                id: n.id,
                                title: n.title || 'Notificação',
                                message: n.message || '',
                                type: n.type || 'info',
                                read: n.read || false,
                                time: n.created_at
                            }));
                            if (window.CacheManager) {
                                window.CacheManager.set('notifications', this.data.notifications, true);
                            }
                            if (this.modules.dashboard) this.modules.dashboard.renderNotifications();
                            this.updateBadge();
                        }
                    });
            }
        });

        window.addEventListener('notificationsUpdated', () => {
            this.loadNotificationsFromSupabase();
        });

        setTimeout(() => this.loadNotificationsFromSupabase(), 2000);

        // FAB observer
        const fabIa = document.getElementById('btn-open-ia');
        const observer = new MutationObserver(() => {
            const viewIa = document.getElementById('view-ia');
            if (fabIa) {
                fabIa.style.display = (viewIa && viewIa.classList.contains('active')) ? 'none' : 'flex';
            }
        });

        document.querySelectorAll('.view').forEach(view => {
            observer.observe(view, { attributes: true, attributeFilter: ['class'] });
        });

        setTimeout(() => {
            const viewIa = document.getElementById('view-ia');
            if (fabIa) {
                fabIa.style.display = (viewIa && viewIa.classList.contains('active')) ? 'none' : 'flex';
            }
        }, 100);
    }
}

// ══════════════════════════════════════════════════════
//  INICIALIZAR
// ══════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.app = new App();
    }, 100);
});

console.log('[SPA] ✅ app.js carregado (v4 - FAB IA funcional)');