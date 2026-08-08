// app.js - COMPLETO E CORRIGIDO (NOTIFICAÇÕES E NOTAS)
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
        this._supabaseReady = false;
        this._supabaseWaitResolve = null;
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
        this._notificationRefreshTimeout = null;
        
        // CSS por módulo
        this.cssModules = {
            dashboard: 'css/dashboard.css',
            calendario: 'css/calendario.css',
            tarefas: 'css/tarefas.css',
            notas: 'css/notas.css',
            perfil: 'css/perfil.css',
            ia: 'css/ia.css'
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
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 99999;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            transition: opacity 0.5s ease;
        `;
        
        // Logo/Ícone
        const icon = document.createElement('div');
        icon.style.cssText = `
            font-size: 48px;
            margin-bottom: 20px;
            animation: pulse 1.5s ease-in-out infinite;
        `;
        icon.innerHTML = `<a href='https://postimages.org/' target='_blank'>
            <img src='https://i.postimg.cc/4y9jpb8K/logo1-removebg-preview.png' 
                 border='0' 
                 alt='logo1-removebg-preview'
                 style='width: 120px; height: 120px; object-fit: contain;'>
        </a>`;

        // Spinner
        const spinner = document.createElement('div');
        spinner.style.cssText = `
            width: 50px;
            height: 50px;
            border: 4px solid rgba(139, 92, 246, 0.2);
            border-top-color: #8b5cf6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin-bottom: 24px;
        `;
        
        // Título
        const title = document.createElement('h2');
        title.style.cssText = `
            color: #fff;
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        title.textContent = 'Carregando...';
        
        // Subtítulo
        const subtitle = document.createElement('p');
        subtitle.style.cssText = `
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            margin: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        subtitle.id = 'loading-status';
        subtitle.textContent = 'Preparando seus dados...';
        
        // Barra de progresso
        const progressContainer = document.createElement('div');
        progressContainer.style.cssText = `
            width: 200px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            margin-top: 20px;
            overflow: hidden;
        `;
        
        const progressBar = document.createElement('div');
        progressBar.id = 'loading-progress-bar';
        progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #8b5cf6, #6366f1);
            border-radius: 2px;
            transition: width 0.3s ease;
        `;
        progressContainer.appendChild(progressBar);
        
        // Adicionar elementos
        this._loadingOverlay.appendChild(icon);
        this._loadingOverlay.appendChild(spinner);
        this._loadingOverlay.appendChild(title);
        this._loadingOverlay.appendChild(subtitle);
        this._loadingOverlay.appendChild(progressContainer);
        
        // Adicionar CSS para animações
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }
        `;
        this._loadingOverlay.appendChild(style);
        
        document.body.appendChild(this._loadingOverlay);
    }
    
    // ============================================
    // ⭐ ATUALIZAR STATUS DO LOADING
    // ============================================
    updateLoadingStatus(message, progress = null) {
        const statusEl = document.getElementById('loading-status');
        if (statusEl) statusEl.textContent = message;
        
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
    // ⭐ AGUARDAR SUPABASE FICAR PRONTO
    // ============================================
    async waitForSupabase() {
        if (this.getSupabase()) {
            console.log('[SPA] ✅ Supabase já disponível');
            return true;
        }
        
        console.log('[SPA] ⏳ Aguardando Supabase inicializar...');
        this.updateLoadingStatus('Conectando ao servidor...', 10);
        
        if (window.SupabaseClient?.initSupabase) {
            console.log('[SPA] 🔄 Inicializando Supabase manualmente...');
            window.SupabaseClient.initSupabase();
        }
        
        let attempts = 0;
        const maxAttempts = 50;
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                attempts++;
                if (this.getSupabase()) {
                    console.log('[SPA] ✅ Supabase pronto!');
                    clearInterval(checkInterval);
                    this.updateLoadingStatus('Conectado!', 20);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    console.warn('[SPA] ⚠️ Timeout aguardando Supabase - continuando offline');
                    clearInterval(checkInterval);
                    this.updateLoadingStatus('Modo offline - usando dados locais', 20);
                    resolve(false);
                }
            }, 200);
        });
    }
    
    // ============================================
    // GET SUPABASE CLIENT
    // ============================================
    getSupabase() {
        if (window.SupabaseClient?.getClient) {
            const client = window.SupabaseClient.getClient();
            if (client) return client;
        }
        
        if (window.SupabaseClient?.client) {
            return window.SupabaseClient.client;
        }
        
        if (window.SupabaseClient?.supabase) {
            return window.SupabaseClient.supabase;
        }
        
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        
        return null;
    }
    
    // ============================================
    // ⭐ SETUP PROFILE OBSERVER
    // ============================================
    setupProfileObserver() {
        if (this._profileObserver) {
            this._profileObserver.disconnect();
            this._profileObserver = null;
        }
        
        if (this._profileUpdateTimeout) {
            clearTimeout(this._profileUpdateTimeout);
            this._profileUpdateTimeout = null;
        }
        
        const targetNode = document.getElementById('view-perfil');
        if (!targetNode) {
            console.warn('[SPA] ⚠️ Elemento view-perfil não encontrado para observer');
            return;
        }
        
        console.log('[SPA] 🔍 Configurando Profile Observer...');
        
        this._profileObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isActive = targetNode.classList.contains('active');
                    if (isActive) {
                        console.log('[SPA] 🔍 View perfil ativada via observer, atualizando...');
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
        
        console.log('[SPA] ✅ Profile Observer configurado com sucesso');
        
        if (targetNode.classList.contains('active')) {
            console.log('[SPA] 🔍 View perfil já está ativa, atualizando...');
            this._profileUpdateRetries = 0;
            this.updateProfileUI();
            this.updateProfileStats();
        }
    }
    
    // ============================================
    // ⭐ ATUALIZAR UI DO PERFIL
    // ============================================
    updateProfileUI() {
        if (!this.user) {
            console.warn('[SPA] ⚠️ Usuário não disponível para atualizar perfil');
            return;
        }

        if (this._profileUpdateRetries >= this._maxProfileRetries) {
            console.log('[SPA] ⏹️ Máximo de tentativas atingido, parando atualizações');
            return;
        }

        const nome = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        const email = this.user.email || 'usuario@email.com';
        const initial = nome.charAt(0).toUpperCase();

        console.log(`[SPA] 📝 Atualizando perfil (tentativa ${this._profileUpdateRetries + 1}/${this._maxProfileRetries})`);

        let elementsFound = 0;
        let elementsMissing = [];

        // Atualizar elementos do perfil
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            profileName.textContent = nome;
            elementsFound++;
        } else {
            elementsMissing.push('profile-name');
        }

        const profileEmail = document.getElementById('profile-email');
        if (profileEmail) {
            profileEmail.textContent = email;
            elementsFound++;
        } else {
            elementsMissing.push('profile-email');
        }

        const profileInitial = document.getElementById('profile-initial');
        if (profileInitial) {
            profileInitial.textContent = initial;
            elementsFound++;
        } else {
            console.log('[SPA] ℹ️ profile-initial não encontrado - ignorando');
        }

        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.textContent = initial;
            elementsFound++;
        } else {
            elementsMissing.push('avatar-preview');
        }

        const profileNameInput = document.getElementById('profile-name-input');
        if (profileNameInput) {
            profileNameInput.value = nome;
            elementsFound++;
        } else {
            elementsMissing.push('profile-name-input');
        }

        const profileEmailInput = document.getElementById('profile-email-input');
        if (profileEmailInput) {
            profileEmailInput.value = email;
            elementsFound++;
        } else {
            elementsMissing.push('profile-email-input');
        }

        const headerName = document.getElementById('header-name');
        if (headerName) {
            headerName.textContent = nome.split(' ')[0];
            elementsFound++;
        } else {
            elementsMissing.push('header-name');
        }

        console.log(`[SPA] 📊 Elementos encontrados: ${elementsFound}, faltando: ${elementsMissing.length}`);

        const criticalMissing = elementsMissing.filter(el => 
            el === 'profile-name' || 
            el === 'profile-email' || 
            el === 'profile-name-input' ||
            el === 'profile-email-input'
        );

        if (criticalMissing.length > 0 && this._profileUpdateRetries < this._maxProfileRetries) {
            this._profileUpdateRetries++;
            console.warn(`[SPA] ⚠️ Elementos críticos faltando (${this._profileUpdateRetries}/${this._maxProfileRetries}):`, criticalMissing.join(', '));
            
            if (this._profileUpdateTimeout) {
                clearTimeout(this._profileUpdateTimeout);
            }
            this._profileUpdateTimeout = setTimeout(() => {
                this.updateProfileUI();
            }, this._profileUpdateRetries * 300);
        } else if (criticalMissing.length === 0) {
            console.log('[SPA] ✅ Perfil atualizado com sucesso');
            this._profileUpdateRetries = 0;
        } else {
            console.warn('[SPA] ⚠️ Não foi possível atualizar todos os elementos do perfil');
            this._profileUpdateRetries = 0;
        }
    }
    
    // ============================================
    // ⭐ ATUALIZAR ESTATÍSTICAS DO PERFIL
    // ============================================
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
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    async init() {
        if (this._isInitializing) {
            console.log('[SPA] ⏳ Já inicializando...');
            return;
        }
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
        console.log('[SPA] 📧 Email:', this.user.email);
        console.log('[SPA] 📛 Nome:', this.user.nome);
        
        this.updateLoadingStatus(`Olá, ${this.user.nome || 'Usuário'}!`, 10);
        
        const nomeExibicao = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        
        this._profileUpdateRetries = 0;
        this.updateProfileUI();
        
        // Aguardar Supabase
        await this.waitForSupabase();
        
        // Inicializar CacheManager
        this.updateLoadingStatus('Inicializando cache...', 25);
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
            console.log('[SPA] ✅ CacheManager inicializado');
            console.log('[SPA] 📊 Status do Cache:', window.CacheManager.getStatus());
        } else {
            console.warn('[SPA] ⚠️ CacheManager não disponível');
        }
        
        // Inicializar SyncHelper
        this.updateLoadingStatus('Inicializando sincronização...', 30);
        if (window.initSync) {
            try {
                await window.initSync();
                console.log('[SPA] ✅ SyncHelper inicializado');
            } catch(e) {
                console.warn('[SPA] ⚠️ Erro ao inicializar SyncHelper:', e);
            }
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
        
        // Configurar navegação
        this.updateLoadingStatus('Configurando...', 85);
        this.setupNavigation();
        
        // Configurar eventos
        this.setupEvents();
        
        // Configurar observer do perfil
        this.setupProfileObserver();
        
        // ⭐ CONECTA O BOTÃO DA IA NA INICIALIZAÇÃO
        if (this.modules.ia) this.modules.ia.setupEvents();
        
        // Renderizar view inicial
        this.updateLoadingStatus('Quase pronto!', 95);
        this.showView('dashboard');
        
        // Atualizar badge
        this.updateBadge();
        
        // ⭐ FORÇAR SINCRONIZAÇÃO INICIAL COM VERIFICAÇÃO
        this.updateLoadingStatus('Sincronizando dados...', 90);
        await this.forceInitialSync();
        
        // ⭐ CARREGAR NOTIFICAÇÕES DO SUPABASE
        this.updateLoadingStatus('Carregando notificações...', 92);
        await this.loadNotificationsFromSupabase();
        
        // Fechar loading
        setTimeout(() => {
            this.updateLoadingStatus('Pronto!', 100);
            setTimeout(() => {
                this.closeLoadingOverlay();
            }, 300);
        }, 500);
        
        this._isAppReady = true;
        this._isInitializing = false;
        console.log('[SPA] ✅ Aplicação mobile pronta!');
    }
    
    // ============================================
    // ⭐ CARREGAR NOTIFICAÇÕES DO SUPABASE
    // ============================================
    async loadNotificationsFromSupabase() {
        try {
            const client = this.getSupabase();
            if (!client || !this.user) {
                console.log('[SPA] ℹ️ Supabase ou usuário não disponível para carregar notificações');
                return;
            }

            console.log('[SPA] 📬 Carregando notificações do Supabase...');
            
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

                // Atualizar dados
                this.data.notifications = notificacoes;
                
                // Salvar no cache
                if (window.CacheManager) {
                    window.CacheManager.set('notifications', notificacoes, true);
                }
                
                // Salvar no localStorage com userId
                const key = `${this.user.id}_notifications`;
                localStorage.setItem(key, JSON.stringify(notificacoes));

                console.log(`[SPA] ✅ ${notificacoes.length} notificações carregadas do Supabase`);
                
                // Atualizar badge
                this.updateBadge();
                
                // Notificar UI
                window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            } else {
                console.log('[SPA] ℹ️ Nenhuma notificação encontrada no Supabase');
            }
        } catch (error) {
            console.error('[SPA] ❌ Erro ao carregar notificações:', error);
        }
    }
    
    // ============================================
    // ⭐ FORÇAR SINCRONIZAÇÃO INICIAL
    // ============================================
    async forceInitialSync() {
        try {
            console.log('[SPA] 🔄 Forçando sincronização inicial...');
            
            if (!window.CacheManager) {
                console.warn('[SPA] ⚠️ CacheManager não disponível');
                return false;
            }
            
            // Verificar DatabaseService
            if (!window.DatabaseService) {
                console.warn('[SPA] ⚠️ DatabaseService não disponível, tentando inicializar...');
                if (window.SupabaseClient?.initSupabase) {
                    await window.SupabaseClient.initSupabase();
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
                if (!window.DatabaseService) {
                    console.error('[SPA] ❌ DatabaseService não disponível');
                    return false;
                }
            }
            
            // Tentar sincronizar
            const result = await window.CacheManager.forceSync();
            console.log('[SPA] ✅ Sincronização inicial:', result ? 'com alterações' : 'sem alterações');
            
            // Atualizar dados após sincronização
            await this.loadAllData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
            
            return result;
        } catch (error) {
            console.error('[SPA] ❌ Erro na sincronização inicial:', error);
            
            // Tentar novamente após 3s
            if (this._syncRetryCount < this._maxSyncRetries) {
                this._syncRetryCount++;
                console.log(`[SPA] 🔄 Tentativa ${this._syncRetryCount}/${this._maxSyncRetries} em 3s...`);
                setTimeout(() => {
                    this.forceInitialSync();
                }, 3000);
            }
            return false;
        }
    }
    
    // ============================================
    // CARREGAR MÓDULOS
    // ============================================
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
        
        if (typeof NotasModule !== 'undefined') {
            this.modules.notas = new NotasModule(this);
        }
        
        if (typeof PerfilModule !== 'undefined') {
            this.modules.perfil = new PerfilModule(this);
        }

        if (typeof IAModule !== 'undefined') {
             this.modules.ia = new IAModule(this);
        }
        
        console.log('[SPA] 📦 Módulos carregados:', Object.keys(this.modules));
    }
    
    // ============================================
    // CARREGAR DADOS
    // ============================================
    async loadAllData(retryCount = 0) {
        if (this.isLoading) return;
        this.isLoading = true;
        
        console.log(`[SPA] 📊 Carregando dados... (tentativa ${retryCount + 1})`);
        this.updateLoadingStatus(`Carregando dados... (${retryCount + 1}/5)`, 35 + (retryCount * 5));
        
        // Verificar cache primeiro
        const cached = sessionStorage.getItem('app_data');
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data && typeof data === 'object') {
                    this.data = {
                        ...this.data,
                        ...data
                    };
                    console.log('[SPA] 📦 Dados carregados do cache');
                    this.updateLoadingStatus('Dados do cache carregados', 70);
                    this.isLoading = false;
                    
                    if (this.modules.dashboard) {
                        this.modules.dashboard.render(this.data);
                    }
                    return;
                }
            } catch(e) {
                console.warn('[SPA] ⚠️ Cache inválido, ignorando');
            }
        }
        
        // Tentar carregar do CacheManager
        try {
            if (window.CacheManager) {
                const tipos = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
                let loadedCount = 0;
                
                for (const tipo of tipos) {
                    const dados = window.CacheManager.get(tipo, null);
                    if (dados !== null && dados !== undefined) {
                        // ⭐ FILTRAR NOTAS FANTASMAS
                        if (tipo === 'notes' && Array.isArray(dados)) {
                            const filtradas = dados.filter(n => {
                                const hasTitle = n.title && n.title.trim().length > 0;
                                const hasContent = n.content && n.content.trim().length > 0 && 
                                                  n.content !== '<br>' && 
                                                  n.content !== '<div><br></div>' &&
                                                  n.content !== '<p><br></p>';
                                return hasTitle || hasContent;
                            });
                            if (filtradas.length !== dados.length) {
                                console.log(`[SPA] 🧹 Removidas ${dados.length - filtradas.length} notas fantasmas do cache`);
                                this.data[tipo] = filtradas;
                                window.CacheManager.set(tipo, filtradas, true);
                            } else {
                                this.data[tipo] = dados;
                            }
                        } else {
                            this.data[tipo] = dados;
                        }
                        loadedCount++;
                        console.log(`[SPA] 📊 ${tipo} carregado: ${Array.isArray(dados) ? dados.length : Object.keys(dados).length} itens`);
                    }
                }
                
                const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
                dias.forEach(day => {
                    if (!this.data.weeklySchedule[day]) {
                        this.data.weeklySchedule[day] = [];
                    }
                });
                
                if (!this.data.settings || typeof this.data.settings !== 'object') {
                    this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
                }
                
                sessionStorage.setItem('app_data', JSON.stringify(this.data));
                
                console.log(`[SPA] ✅ Dados carregados do CacheManager (${loadedCount} tipos)`);
                this.updateLoadingStatus('Dados carregados!', 80);
                this.isLoading = false;
                
                if (this.modules.dashboard) {
                    this.modules.dashboard.render(this.data);
                }
                return;
            }
        } catch (error) {
            console.error('[SPA] ❌ Erro ao carregar dados do CacheManager:', error);
        }
        
        // Fallback: localStorage
        this.loadDataFromLocalStorage();
        this.isLoading = false;
    }
    
    // ============================================
    // CARREGAR DO LOCALSTORAGE (FALLBACK)
    // ============================================
    loadDataFromLocalStorage() {
        console.log('[SPA] 📂 Tentando carregar do localStorage...');
        this.updateLoadingStatus('Carregando dados locais...', 60);
        
        const userId = this.user.id;
        const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        
        let loaded = false;
        let loadedCount = 0;
        
        for (const type of types) {
            const key = `${userId}_${type}`;
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
                        // ⭐ FILTRAR NOTAS FANTASMAS
                        if (type === 'notes' && Array.isArray(parsed)) {
                            const filtradas = parsed.filter(n => {
                                const hasTitle = n.title && n.title.trim().length > 0;
                                const hasContent = n.content && n.content.trim().length > 0 && 
                                                  n.content !== '<br>' && 
                                                  n.content !== '<div><br></div>' &&
                                                  n.content !== '<p><br></p>';
                                return hasTitle || hasContent;
                            });
                            if (filtradas.length !== parsed.length) {
                                console.log(`[SPA] 🧹 Removidas ${parsed.length - filtradas.length} notas fantasmas do localStorage`);
                                this.data[type] = filtradas;
                                localStorage.setItem(key, JSON.stringify(filtradas));
                            } else {
                                this.data[type] = parsed;
                            }
                        } else {
                            this.data[type] = parsed;
                        }
                        loaded = true;
                        loadedCount++;
                        console.log(`[SPA] 📂 ${type} carregado do localStorage (${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} itens)`);
                    }
                } catch(e) {
                    console.warn(`[SPA] ⚠️ Erro ao carregar ${type} do localStorage`);
                }
            }
        }
        
        if (!this.data.settings || typeof this.data.settings !== 'object') {
            this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        }
        
        if (loaded) {
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            this.updateLoadingStatus(`Dados locais carregados (${loadedCount} tipos)`, 80);
            console.log('[SPA] ✅ Dados carregados do localStorage');
            
            if (this.modules.dashboard) {
                this.modules.dashboard.render(this.data);
            }
        } else {
            this.updateLoadingStatus('Nenhum dado encontrado', 70);
            console.log('[SPA] ℹ️ Nenhum dado encontrado no localStorage - usando dados vazios');
            
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!this.data.weeklySchedule[day]) {
                    this.data.weeklySchedule[day] = [];
                }
            });
            
            if (this.modules.dashboard) {
                this.modules.dashboard.render(this.data);
            }
        }
    }
    
    // ============================================
    // ⭐ SALVAR DADOS
    // ============================================
    async saveAllData() {
        if (this.isSaving) return;
        this.isSaving = true;
        
        console.log('[SPA] 💾 Salvando dados...');
        
        try {
            // ⭐ FILTRAR NOTAS FANTASMAS ANTES DE SALVAR
            if (Array.isArray(this.data.notes)) {
                const antes = this.data.notes.length;
                this.data.notes = this.data.notes.filter(n => {
                    const hasTitle = n.title && n.title.trim().length > 0;
                    const hasContent = n.content && n.content.trim().length > 0 && 
                                      n.content !== '<br>' && 
                                      n.content !== '<div><br></div>' &&
                                      n.content !== '<p><br></p>';
                    return hasTitle || hasContent;
                });
                if (this.data.notes.length !== antes) {
                    console.log(`[SPA] 🧹 Removidas ${antes - this.data.notes.length} notas fantasmas ao salvar`);
                }
            }
            
            // Salvar no sessionStorage
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            
            // Salvar no localStorage com userId
            const userId = this.user.id;
            const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
            
            for (const type of types) {
                const key = `${userId}_${type}`;
                if (this.data[type] !== undefined && this.data[type] !== null) {
                    localStorage.setItem(key, JSON.stringify(this.data[type]));
                    
                    // ⭐ TAMBÉM SALVAR COM EMAIL PARA COMPATIBILIDADE
                    if (this.user.email) {
                        localStorage.setItem(`${type}_${this.user.email}`, JSON.stringify(this.data[type]));
                    }
                }
            }
            
            // ⭐ SALVAR NO CACHEMANAGER
            if (window.CacheManager) {
                console.log('[SPA] 💾 Salvando no CacheManager...');
                let savedCount = 0;
                let failedCount = 0;
                
                for (const type of types) {
                    if (this.data[type] !== undefined && this.data[type] !== null) {
                        const result = window.CacheManager.set(type, this.data[type], true);
                        if (result) {
                            savedCount++;
                        } else {
                            failedCount++;
                            console.warn(`[SPA] ⚠️ Falha ao salvar ${type} no CacheManager`);
                        }
                    }
                }
                
                console.log(`[SPA] 📊 ${savedCount} tipos salvos, ${failedCount} falhas`);
                
                // ⭐ FORÇAR SYNC
                if (savedCount > 0) {
                    try {
                        console.log('[SPA] 🔄 Forçando sincronização imediata...');
                        const result = await window.CacheManager.forceSync();
                        console.log('[SPA] ✅ Sync concluído:', result ? 'Sucesso' : 'Sem alterações');
                        
                        window.dispatchEvent(new CustomEvent('syncCompleted', {
                            detail: { success: result, source: 'saveAllData' }
                        }));
                    } catch (error) {
                        console.error('[SPA] ❌ Erro no sync imediato:', error);
                        
                        if (this._saveTimeout) {
                            clearTimeout(this._saveTimeout);
                        }
                        this._saveTimeout = setTimeout(async () => {
                            try {
                                console.log('[SPA] 🔄 Tentando sync novamente (delay)...');
                                await window.CacheManager.forceSync();
                            } catch(e) {
                                console.error('[SPA] ❌ Erro no sync delay:', e);
                            }
                        }, 3000);
                    }
                }
            } else {
                console.error('[SPA] ❌ CacheManager não disponível!');
            }
            
            console.log('[SPA] ✅ Dados salvos com sucesso');
        } catch (error) {
            console.error('[SPA] ❌ Erro ao salvar dados:', error);
        }
        
        setTimeout(() => { this.isSaving = false; }, 500);
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
        
        document.getElementById('go-to-calendar')?.addEventListener('click', () => {
            this.showView('calendario');
        });
        
        document.getElementById('go-to-tasks')?.addEventListener('click', () => {
            this.showView('tarefas');
        });
        
        document.getElementById('notification-bell-link')?.addEventListener('click', () => {
            this.openNotifications();
        });
    }
    
    // ============================================
    // SHOW VIEW
    // ============================================
    showView(viewName) {
        console.log(`[SPA] 📄 Mostrando: ${viewName}`);
        
        this.loadCSS(viewName);
        
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
            v.classList.add('hidden');
        });
        
        const view = document.getElementById(`view-${viewName}`);
        if (view) {
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
                ia: 'Assistente IA 🤖'
            };
            const subtitleEl = document.getElementById('header-subtitle');
            if (subtitleEl) subtitleEl.textContent = subtitles[viewName] || '';
            
            if (viewName === 'perfil') {
                console.log('[SPA] 🔍 Atualizando perfil via showView...');
                this._profileUpdateRetries = 0;
                this.updateProfileUI();
                this.updateProfileStats();
            }
            
            // ⭐ CONTROLE DO BOTÃO FLUTUANTE DA IA
            const fabIa = document.getElementById('btn-open-ia');
            if (fabIa) {
                if (viewName === 'ia') {
                    fabIa.style.display = 'none';
                } else {
                    fabIa.style.display = 'flex';
                }
            }
            
            // ⭐ ESCONDE A BARRA DE NAVEGAÇÃO NA TELA DE IA
            const navBar = document.querySelector('.bottom-nav');
            if (navBar) {
                navBar.style.display = (viewName === 'ia') ? 'none' : 'flex';
            }
            
            if (this.modules[viewName]) {
                this.modules[viewName].render(this.data);
            }
            
            this.currentView = viewName;
        }
    }
    
    // ============================================
    // ⭐ NOTIFICAÇÕES - CORRIGIDO (APAGA DO SUPABASE)
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
        
        // ⭐ EVENTO PARA DELETAR NOTIFICAÇÃO INDIVIDUAL
        container.querySelectorAll('.btn-delete-notification').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.dataset.id;
                await this.deleteNotification(id);
            });
        });
    }
    
    // ============================================
    // ⭐ DELETAR NOTIFICAÇÃO INDIVIDUAL (DO SUPABASE)
    // ============================================
    async deleteNotification(id) {
        try {
            const client = this.getSupabase();
            if (client && this.user) {
                // Deletar do Supabase
                const { error } = await client
                    .from('notifications')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', this.user.id);

                if (error) {
                    console.error('[SPA] ❌ Erro ao deletar notificação do Supabase:', error);
                    // Tentar deletar localmente mesmo com erro
                }
            }

            // Deletar localmente
            this.data.notifications = this.data.notifications.filter(n => n.id != id);
            
            // Salvar no localStorage
            if (this.user) {
                const key = `${this.user.id}_notifications`;
                localStorage.setItem(key, JSON.stringify(this.data.notifications));
            }
            
            // Salvar no CacheManager
            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }
            
            // Atualizar UI
            this.updateBadge();
            this.renderNotificationsModal();
            
            // Atualizar dashboard
            if (this.modules.dashboard) {
                this.modules.dashboard.renderNotifications();
            }
            
            if (typeof showToast === 'function') {
                showToast('🗑️ Notificação removida!', 'success');
            }
            
            console.log('[SPA] ✅ Notificação deletada:', id);
            
        } catch (error) {
            console.error('[SPA] ❌ Erro ao deletar notificação:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao remover notificação', 'error');
            }
        }
    }
    
    // ============================================
    // ⭐ MARCAR TODAS COMO LIDAS (COM SUPABASE)
    // ============================================
    async marcarTodasComoLidas() {
        try {
            const naoLidas = this.data.notifications.filter(n => !n.read);
            if (naoLidas.length === 0) {
                if (typeof showToast === 'function') {
                    showToast('✅ Todas as notificações já estão lidas!', 'info');
                }
                return;
            }

            const client = this.getSupabase();
            if (client && this.user) {
                // Atualizar no Supabase
                const ids = naoLidas.map(n => n.id);
                const { error } = await client
                    .from('notifications')
                    .update({ read: true })
                    .in('id', ids)
                    .eq('user_id', this.user.id);

                if (error) {
                    console.error('[SPA] ❌ Erro ao marcar como lidas no Supabase:', error);
                }
            }

            // Atualizar localmente
            this.data.notifications.forEach(n => {
                if (!n.read) n.read = true;
            });

            // Salvar no localStorage
            if (this.user) {
                const key = `${this.user.id}_notifications`;
                localStorage.setItem(key, JSON.stringify(this.data.notifications));
            }

            // Salvar no CacheManager
            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            // Atualizar UI
            this.updateBadge();
            this.renderNotificationsModal();

            if (this.modules.dashboard) {
                this.modules.dashboard.renderNotifications();
            }

            if (typeof showToast === 'function') {
                showToast('✅ Todas as notificações marcadas como lidas!', 'success');
            }

        } catch (error) {
            console.error('[SPA] ❌ Erro ao marcar como lidas:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao marcar como lidas', 'error');
            }
        }
    }
    
    // ============================================
    // ⭐ LIMPAR TODAS AS NOTIFICAÇÕES (DO SUPABASE)
    // ============================================
    async limparTodasNotificacoes() {
        if (!confirm('Limpar todas as notificações?')) return;

        try {
            const client = this.getSupabase();
            if (client && this.user) {
                // Deletar todas do Supabase
                const { error } = await client
                    .from('notifications')
                    .delete()
                    .eq('user_id', this.user.id);

                if (error) {
                    console.error('[SPA] ❌ Erro ao limpar notificações do Supabase:', error);
                }
            }

            // Limpar localmente
            this.data.notifications = [];

            // Salvar no localStorage
            if (this.user) {
                const key = `${this.user.id}_notifications`;
                localStorage.setItem(key, JSON.stringify(this.data.notifications));
            }

            // Salvar no CacheManager
            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            // Atualizar UI
            this.updateBadge();
            this.renderNotificationsModal();

            if (this.modules.dashboard) {
                this.modules.dashboard.renderNotifications();
            }

            if (typeof showToast === 'function') {
                showToast('🗑️ Todas as notificações removidas!', 'success');
            }

        } catch (error) {
            console.error('[SPA] ❌ Erro ao limpar notificações:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao limpar notificações', 'error');
            }
        }
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
        document.getElementById('notification-bell')?.addEventListener('click', () => {
            this.openNotifications();
        });
        
        document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
            document.getElementById('notifications-modal').classList.remove('active');
        });
        
        // ⭐ MARCAR TODAS COMO LIDAS (CORRIGIDO)
        document.getElementById('btn-mark-read')?.addEventListener('click', () => {
            this.marcarTodasComoLidas();
        });
        
        // ⭐ LIMPAR TODAS (CORRIGIDO)
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
        
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[SPA] 📡 Dados da nuvem atualizados');
            this.loadAllData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });
        
        window.addEventListener('forceRefresh', () => {
            console.log('[SPA] 🔄 Forçando atualização da UI');
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });
        
        ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'disciplinas', 'notifications'].forEach(type => {
            window.addEventListener(`${type}Updated`, (e) => {
                if (e.detail) {
                    this.data[type] = e.detail;
                    console.log(`[SPA] 📡 ${type} atualizado via evento`);
                    sessionStorage.setItem('app_data', JSON.stringify(this.data));
                    if (this.modules[this.currentView]) {
                        this.modules[this.currentView].render(this.data);
                    }
                }
            });
        });
        
        window.addEventListener('syncCompleted', (e) => {
            console.log('[SPA] 📡 Sincronização concluída:', e.detail);
            if (e.detail && e.detail.success) {
                this.loadAllData();
                if (this.modules[this.currentView]) {
                    this.modules[this.currentView].render(this.data);
                }
            }
        });
        
        window.addEventListener('scheduleUpdated', (e) => {
            console.log('[SPA] 📡 Horário atualizado via evento');
            if (e.detail) {
                this.data.weeklySchedule = e.detail.weeklySchedule || this.data.weeklySchedule;
                this.data.timeSlots = e.detail.timeSlots || this.data.timeSlots;
                sessionStorage.setItem('app_data', JSON.stringify(this.data));
                if (this.modules.dashboard) {
                    this.modules.dashboard.render(this.data);
                }
            }
        });

        // ⭐ NOVAS NOTIFICAÇÕES EM TEMPO REAL
        window.addEventListener('newNotification', (e) => {
            console.log('[App] 📬 Nova notificação recebida via Realtime!');
            
            if (this.user && this.getSupabase()) {
                this.getSupabase()
                    .from('notifications')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .order('created_at', { ascending: false })
                    .limit(10)
                    .then(({ data, error }) => {
                        if (!error && data && data.length > 0) {
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
                            
                            if (this.modules.dashboard) {
                                this.modules.dashboard.renderNotifications();
                            }
                            this.updateBadge();
                            
                            if (data.length > 0 && typeof showToast === 'function') {
                                showToast(`📬 ${data[0].title || 'Nova notificação'}`, 'info');
                            }
                        }
                    })
                    .catch(err => console.warn('[App] ⚠️ Erro ao buscar notificação:', err));
            }
        });

        window.addEventListener('notificationsUpdated', () => {
            console.log('[App] 📬 Notificações atualizadas!');
            
            if (this.user && this.getSupabase()) {
                this.getSupabase()
                    .from('notifications')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .order('created_at', { ascending: false })
                    .limit(10)
                    .then(({ data, error }) => {
                        if (!error && data && data.length > 0) {
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
                            if (this.modules.dashboard) {
                                this.modules.dashboard.renderNotifications();
                            }
                            this.updateBadge();
                        }
                    })
                    .catch(err => console.warn('[App] ⚠️ Erro ao atualizar notificações:', err));
            }
        });

        // ⭐ CARREGAR NOTIFICAÇÕES DO SUPABASE AO INICIAR
        setTimeout(() => {
            this.loadNotificationsFromSupabase();
        }, 2000);

        // ⭐ BOTÃO FLUTUANTE DA IA - OBSERVER
        const fabIa = document.getElementById('btn-open-ia');
        
        const observer = new MutationObserver(() => {
            const viewIa = document.getElementById('view-ia');
            if (fabIa) {
                if (viewIa && viewIa.classList.contains('active')) {
                    fabIa.style.display = 'none';
                } else {
                    fabIa.style.display = 'flex';
                }
            }
        });

        document.querySelectorAll('.view').forEach(view => {
            observer.observe(view, { attributes: true, attributeFilter: ['class'] });
        });

        setTimeout(() => {
            const viewIa = document.getElementById('view-ia');
            if (fabIa) {
                if (viewIa && viewIa.classList.contains('active')) {
                    fabIa.style.display = 'none';
                } else {
                    fabIa.style.display = 'flex';
                }
            }
        }, 100);
    }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.app = new App();
    }, 100);
});

console.log('[SPA] ✅ app.js carregado (corrigido - notificações e notas)!');