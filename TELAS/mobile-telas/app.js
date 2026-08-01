// ============================================
// app.js - SPA COMPLETO (MOBILE-ONLY) - CORRIGIDO
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
        icon.innerHTML = '📚';
        
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
    waitForSupabase() {
        return new Promise((resolve) => {
            // Se já está disponível, resolve imediatamente
            if (this.getSupabase()) {
                console.log('[SPA] ✅ Supabase já disponível');
                resolve();
                return;
            }
            
            console.log('[SPA] ⏳ Aguardando Supabase inicializar...');
            this.updateLoadingStatus('Conectando ao servidor...', 10);
            
            let resolved = false;
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos (100ms cada)
            
            // Verificar periodicamente
            const interval = setInterval(() => {
                attempts++;
                if (this.getSupabase()) {
                    if (!resolved) {
                        resolved = true;
                        console.log('[SPA] ✅ Supabase pronto (verificação periódica)');
                        this.updateLoadingStatus('Conectado!', 20);
                        cleanup();
                        resolve();
                    }
                } else if (attempts >= maxAttempts) {
                    if (!resolved) {
                        resolved = true;
                        console.warn('[SPA] ⚠️ Timeout aguardando Supabase - continuando sem ele');
                        this.updateLoadingStatus('Modo offline - usando dados locais', 20);
                        cleanup();
                        resolve();
                    }
                }
            }, 100);
            
            // Ouvir evento de pronto
            const onReady = () => {
                if (!resolved) {
                    resolved = true;
                    console.log('[SPA] ✅ Supabase pronto via evento');
                    this.updateLoadingStatus('Conectado!', 20);
                    cleanup();
                    resolve();
                }
            };
            
            const cleanup = () => {
                clearInterval(interval);
                window.removeEventListener('supabaseReady', onReady);
            };
            
            window.addEventListener('supabaseReady', onReady);
            
            // Se o evento já foi disparado antes de adicionarmos o listener
            setTimeout(() => {
                if (this.getSupabase() && !resolved) {
                    resolved = true;
                    console.log('[SPA] ✅ Supabase disponível (verificação tardia)');
                    this.updateLoadingStatus('Conectado!', 20);
                    cleanup();
                    resolve();
                }
            }, 300);
        });
    }
    
    // ============================================
    // GET SUPABASE CLIENT (MELHORADO)
    // ============================================
    getSupabase() {
        // Tentar obter via diferentes formas
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
    // ⭐ SETUP PROFILE OBSERVER (CORRIGIDO - SEM LOOP INFINITO)
    // ============================================
    setupProfileObserver() {
        // Remover observer anterior se existir
        if (this._profileObserver) {
            this._profileObserver.disconnect();
            this._profileObserver = null;
        }
        
        // Remover timeouts pendentes
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
        
        // Observer para mudanças na classe da view
        this._profileObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const isActive = targetNode.classList.contains('active');
                    if (isActive) {
                        console.log('[SPA] 🔍 View perfil ativada via observer, atualizando...');
                        // Resetar contador e atualizar
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
        
        // Verificar se a view já está ativa no momento da configuração
        if (targetNode.classList.contains('active')) {
            console.log('[SPA] 🔍 View perfil já está ativa, atualizando...');
            this._profileUpdateRetries = 0;
            this.updateProfileUI();
            this.updateProfileStats();
        }
    }
    
    // ============================================
    // ⭐ ATUALIZAR UI DO PERFIL (CORRIGIDO - SEM LOOP INFINITO)
    // ============================================
    updateProfileUI() {
        if (!this.user) {
            console.warn('[SPA] ⚠️ Usuário não disponível para atualizar perfil');
            return;
        }
        
        // ⭐ IMPEDIR LOOP INFINITO
        if (this._profileUpdateRetries >= this._maxProfileRetries) {
            console.log('[SPA] ⏹️ Máximo de tentativas atingido, parando atualizações');
            return;
        }
        
        const nome = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        const email = this.user.email || 'usuario@email.com';
        const initial = nome.charAt(0).toUpperCase();
        
        console.log(`[SPA] 📝 Atualizando perfil (tentativa ${this._profileUpdateRetries + 1}/${this._maxProfileRetries}):`, { nome, email });
        
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
            elementsMissing.push('profile-initial');
        }
        
        // Atualizar avatar preview
        const avatarPreview = document.getElementById('avatar-preview');
        if (avatarPreview) {
            avatarPreview.textContent = initial;
            elementsFound++;
        } else {
            elementsMissing.push('avatar-preview');
        }
        
        // Atualizar campos do formulário de dados pessoais
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
        
        // Atualizar header
        const headerName = document.getElementById('header-name');
        if (headerName) {
            headerName.textContent = nome.split(' ')[0];
            elementsFound++;
        } else {
            elementsMissing.push('header-name');
        }
        
        console.log(`[SPA] 📊 Elementos encontrados: ${elementsFound}, faltando: ${elementsMissing.length}`);
        
        // Se faltam elementos, incrementar contador e tentar novamente
        if (elementsMissing.length > 0 && elementsMissing.length < 7) {
            this._profileUpdateRetries++;
            console.warn(`[SPA] ⚠️ Elementos faltando (${this._profileUpdateRetries}/${this._maxProfileRetries}):`, elementsMissing.join(', '));
            
            if (this._profileUpdateRetries < this._maxProfileRetries) {
                const delay = this._profileUpdateRetries * 300;
                console.log(`[SPA] 🔄 Tentando novamente em ${delay}ms...`);
                if (this._profileUpdateTimeout) {
                    clearTimeout(this._profileUpdateTimeout);
                }
                this._profileUpdateTimeout = setTimeout(() => {
                    this.updateProfileUI();
                }, delay);
            } else {
                console.warn('[SPA] ⚠️ Máximo de tentativas atingido para atualizar perfil');
            }
        } else if (elementsMissing.length === 0) {
            console.log('[SPA] ✅ Perfil atualizado com sucesso:', { nome, email });
            this._profileUpdateRetries = 0; // Resetar para futuras atualizações
        } else {
            console.warn('[SPA] ⚠️ Muitos elementos faltando, pode ser problema no HTML');
            this._profileUpdateRetries = 0; // Resetar para não ficar tentando
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
    // INICIALIZAÇÃO (CORRIGIDA)
    // ============================================
    async init() {
        // ⭐ CRIAR OVERLAY DE LOADING
        this.createLoadingOverlay();
        this.updateLoadingStatus('Inicializando...', 5);
        
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
        console.log('[SPA] 📧 Email:', this.user.email);
        console.log('[SPA] 📛 Nome:', this.user.nome);
        
        this.updateLoadingStatus(`Olá, ${this.user.nome || 'Usuário'}!`, 10);
        
        // Atualizar nome no header
        const nomeExibicao = this.user.nome || this.user.displayName || this.user.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        
        // ⭐ ATUALIZAR PERFIL IMEDIATAMENTE com dados do usuário
        this._profileUpdateRetries = 0;
        this.updateProfileUI();
        
        // 2. ⭐ AGUARDAR SUPABASE FICAR PRONTO
        await this.waitForSupabase();
        
        // 3. Inicializar CacheManager
        this.updateLoadingStatus('Inicializando cache...', 25);
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
            console.log('[SPA] ✅ CacheManager inicializado');
        } else {
            console.warn('[SPA] ⚠️ CacheManager não disponível');
        }
        
        // 4. Carregar módulos JavaScript
        this.updateLoadingStatus('Carregando módulos...', 30);
        this.loadModules();
        
        // 5. Carregar dados (com tentativas)
        this.updateLoadingStatus('Carregando seus dados...', 35);
        await this.loadAllData();
        
        // ⭐ ATUALIZAR PERFIL NOVAMENTE (agora com dados carregados)
        this._profileUpdateRetries = 0;
        this.updateProfileUI();
        this.updateProfileStats();
        
        // 6. Configurar navegação
        this.updateLoadingStatus('Configurando...', 85);
        this.setupNavigation();
        
        // 7. Configurar eventos
        this.setupEvents();
        
        // 8. ⭐ Configurar observer do perfil
        this.setupProfileObserver();
        
        // 9. Renderizar view inicial
        this.updateLoadingStatus('Quase pronto!', 95);
        this.showView('dashboard');
        
        // 10. Atualizar badge de notificações
        this.updateBadge();
        
        // 11. ⭐ FECHAR LOADING
        setTimeout(() => {
            this.updateLoadingStatus('Pronto!', 100);
            setTimeout(() => {
                this.closeLoadingOverlay();
            }, 300);
        }, 500);
        
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
    // CARREGAR DADOS (COM RETRY)
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
                // Validar dados
                if (data && typeof data === 'object') {
                    this.data = {
                        ...this.data,
                        ...data
                    };
                    console.log('[SPA] 📦 Dados carregados do cache');
                    this.updateLoadingStatus('Dados do cache carregados', 70);
                    this.isLoading = false;
                    return;
                }
            } catch(e) {
                console.warn('[SPA] ⚠️ Cache inválido, ignorando');
            }
        }
        
        // Se não tem cache ou cache inválido, tentar carregar do Supabase
        try {
            const client = this.getSupabase();
            
            if (!client) {
                // Tentar novamente se ainda não atingiu o limite
                if (retryCount < 5) {
                    console.log(`[SPA] ⏳ Supabase não disponível, tentando novamente em ${(retryCount + 1) * 500}ms...`);
                    this.updateLoadingStatus(`Tentando novamente... (${retryCount + 1}/5)`, 40);
                    this.isLoading = false;
                    await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
                    return this.loadAllData(retryCount + 1);
                }
                throw new Error('Supabase não disponível após múltiplas tentativas');
            }
            
            console.log('[SPA] 🔍 Buscando dados do Supabase...');
            this.updateLoadingStatus('Buscando dados do servidor...', 50);
            
            // Tentar chamar a RPC
            const { data, error } = await client.rpc('get_user_full_data', {
                user_id: this.user.id
            });
            
            if (error) {
                console.error('[SPA] ❌ Erro na RPC:', error);
                // Se a RPC falhar, tentar carregar individualmente
                await this.loadDataIndividually(client);
                this.isLoading = false;
                return;
            }
            
            if (data) {
                // Atualizar dados
                this.data.tasks = data.tasks || [];
                this.data.notes = data.notes || [];
                this.data.calendarEvents = data.calendarEvents || [];
                this.data.weeklySchedule = data.weeklySchedule || {};
                this.data.timeSlots = data.timeSlots || [];
                this.data.notifications = data.notifications || [];
                this.data.disciplinas = data.disciplinas || [];
                this.data.profile = data.profile || {};
                
                // ⭐ Settings - usar padrão se não vier
                this.data.settings = data.settings || { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
                
                // Garantir dias da semana
                const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
                dias.forEach(day => {
                    if (!this.data.weeklySchedule[day]) {
                        this.data.weeklySchedule[day] = [];
                    }
                });
                
                // Salvar cache
                sessionStorage.setItem('app_data', JSON.stringify(this.data));
                
                console.log('[SPA] ✅ Dados carregados do Supabase:', {
                    tasks: this.data.tasks.length,
                    notes: this.data.notes.length,
                    events: this.data.calendarEvents.length
                });
                
                this.updateLoadingStatus('Dados carregados!', 80);
            }
            
        } catch (error) {
            console.error('[SPA] ❌ Erro ao carregar dados:', error);
            
            // Se não tem dados e é a primeira tentativa, tentar carregar do localStorage
            if (retryCount === 0) {
                this.updateLoadingStatus('Carregando dados locais...', 50);
                this.loadDataFromLocalStorage();
            }
        }
        
        this.isLoading = false;
    }
    
    // ============================================
    // ⭐ CARREGAR DADOS INDIVIDUALMENTE (FALLBACK) - CORRIGIDO
    // ============================================
    async loadDataIndividually(client) {
        console.log('[SPA] 🔍 Carregando dados individualmente...');
        this.updateLoadingStatus('Carregando dados (individual)...', 50);
        
        let loadedCount = 0;
        const totalTypes = 7; // tasks, notes, events, schedule, disciplinas, notifications, settings
        
        try {
            // Tasks
            this.updateLoadingStatus(`Carregando tarefas... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            const { data: tasks } = await client
                .from('tasks')
                .select('*')
                .eq('user_id', this.user.id);
            if (tasks) this.data.tasks = tasks.map(t => ({
                id: t.id,
                nome: t.title,
                descricao: t.description,
                disciplina: t.subject,
                prioridade: t.priority,
                prazo: t.date,
                completed: t.completed || false,
                favorita: t.favorita || false,
                subtasks: t.subtasks || [],
                dataCriacao: t.created_at,
                dataConclusao: t.completed ? t.updated_at : null
            }));
            loadedCount++;
            
            // Notes
            this.updateLoadingStatus(`Carregando anotações... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            const { data: notes } = await client
                .from('notes')
                .select('*')
                .eq('user_id', this.user.id);
            if (notes) this.data.notes = notes.map(n => ({
                id: n.id,
                title: n.title || 'Sem título',
                content: n.content || '',
                date: n.created_at,
                dataModificacao: n.updated_at
            }));
            loadedCount++;
            
            // Calendar Events
            this.updateLoadingStatus(`Carregando eventos... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            const { data: events } = await client
                .from('calendar_events')
                .select('*')
                .eq('user_id', this.user.id);
            if (events) this.data.calendarEvents = events.map(e => ({
                id: e.id,
                title: e.title,
                description: e.description || '',
                date: e.date,
                start: e.start_time,
                end: e.end_time,
                type: e.type || 'aula',
                color: e.color || '#8b5cf6',
                repeat: e.repeat_type || 'nao',
                reminder: e.reminder || false
            }));
            loadedCount++;
            
            // Weekly Schedule
            this.updateLoadingStatus(`Carregando horário... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            const { data: schedule } = await client
                .from('weekly_schedule')
                .select('schedule')
                .eq('user_id', this.user.id)
                .single();
            if (schedule) {
                this.data.weeklySchedule = schedule.schedule || {};
                const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
                dias.forEach(day => {
                    if (!this.data.weeklySchedule[day]) {
                        this.data.weeklySchedule[day] = [];
                    }
                });
            }
            loadedCount++;
            
            // Disciplinas
            this.updateLoadingStatus(`Carregando disciplinas... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            const { data: disciplinas } = await client
                .from('disciplinas')
                .select('*')
                .eq('user_id', this.user.id);
            if (disciplinas) this.data.disciplinas = disciplinas;
            loadedCount++;
            
            // Notifications
            this.updateLoadingStatus(`Carregando notificações... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            const { data: notifications } = await client
                .from('notifications')
                .select('*')
                .eq('user_id', this.user.id);
            if (notifications) this.data.notifications = notifications.map(n => ({
                id: n.id,
                title: n.title || 'Notificação',
                message: n.message || '',
                type: n.type || 'info',
                read: n.read || false,
                time: n.created_at
            }));
            loadedCount++;
            
            // ⭐⭐⭐ USER SETTINGS - SEGURO (NUNCA FALHA) ⭐⭐⭐
            this.updateLoadingStatus(`Carregando configurações... (${loadedCount}/${totalTypes})`, 50 + (loadedCount * 4));
            // Usa valores padrão e NUNCA lança erro
            this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
            
            try {
                const { data: settings, error: settingsErr } = await client
                    .from('user_settings')
                    .select('*')
                    .eq('user_id', this.user.id)
                    .single();
                
                // Se não houve erro E tem dados, usa eles
                if (!settingsErr && settings) {
                    this.data.settings = {
                        theme: settings.theme || 'dark',
                        accent: settings.accent_color || '#8b5cf6',
                        fontSize: settings.font_size || 14
                    };
                    console.log('[SPA] ✅ Settings carregados com sucesso');
                } else {
                    // Qualquer erro (inclusive 406) - usa padrão
                    console.log('[SPA] ℹ️ Settings não encontrados - usando padrão');
                }
            } catch (settingsError) {
                // Qualquer exceção - usa padrão (NUNCA FALHA)
                console.log('[SPA] ℹ️ Erro ao carregar settings - usando padrão');
            }
            loadedCount++;
            
            // ⭐ Se por algum motivo os settings ficaram vazios, garantir padrão
            if (!this.data.settings || typeof this.data.settings !== 'object') {
                this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
            }
            
            // Salvar cache
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            
            this.updateLoadingStatus('Dados carregados!', 80);
            console.log('[SPA] ✅ Dados carregados individualmente');
            
        } catch (error) {
            console.error('[SPA] ❌ Erro ao carregar dados individualmente:', error);
            this.loadDataFromLocalStorage();
        }
    }
    
    // ============================================
    // CARREGAR DO LOCALSTORAGE (FALLBACK FINAL)
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
                        this.data[type] = parsed;
                        loaded = true;
                        loadedCount++;
                        console.log(`[SPA] 📂 ${type} carregado do localStorage (${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} itens)`);
                    }
                } catch(e) {
                    console.warn(`[SPA] ⚠️ Erro ao carregar ${type} do localStorage`);
                }
            }
        }
        
        // ⭐ Settings padrão (nunca falha)
        this.data.settings = { theme: 'dark', accent: '#8b5cf6', fontSize: 14 };
        
        if (loaded) {
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            this.updateLoadingStatus(`Dados locais carregados (${loadedCount} tipos)`, 80);
            console.log('[SPA] ✅ Dados carregados do localStorage');
        } else {
            this.updateLoadingStatus('Nenhum dado encontrado', 70);
            console.log('[SPA] ℹ️ Nenhum dado encontrado no localStorage - usando dados vazios');
        }
    }
    
    // ============================================
    // SALVAR DADOS
    // ============================================
    async saveAllData() {
        if (this.isSaving) return;
        this.isSaving = true;
        
        try {
            // Salvar no cache
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            
            // Salvar no localStorage
            const userId = this.user.id;
            const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
            
            for (const type of types) {
                const key = `${userId}_${type}`;
                if (this.data[type]) {
                    localStorage.setItem(key, JSON.stringify(this.data[type]));
                }
            }
            
            // Sincronizar em background
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
        
        // Salvar via CacheManager
        const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        for (const type of types) {
            if (this.data[type]) {
                window.CacheManager.set(type, this.data[type], true);
            }
        }
        
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
    }
    
    // ============================================
    // SHOW VIEW (CORRIGIDO - SEM LOOP)
    // ============================================
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
            
            // ⭐ Se for a view de perfil, atualizar os dados (apenas uma vez)
            if (viewName === 'perfil') {
                console.log('[SPA] 🔍 Atualizando perfil via showView...');
                this._profileUpdateRetries = 0;
                this.updateProfileUI();
                this.updateProfileStats();
            }
            
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
        
        // Escutar evento de força de atualização
        window.addEventListener('forceRefresh', () => {
            console.log('[SPA] 🔄 Forçando atualização da UI');
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });
        
        // Escutar eventos de atualização de dados
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
    }
}

// ============================================
// INICIALIZAR
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para os scripts carregarem
    setTimeout(() => {
        window.app = new App();
    }, 100);
});

console.log('[SPA] ✅ app.js carregado!');