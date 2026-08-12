// ============================================
// app.js - SPA DO PAINEL PC (COMPLETO CORRIGIDO)
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
        this._isInitializing = false;
        this._syncRetryCount = 0;
        this._maxSyncRetries = 3;
        
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
        
        if (window.supabaseClient) {
            return window.supabaseClient;
        }
        
        return null;
    }
    
    // ============================================
    // INICIALIZAÇÃO
    // ============================================
    async init() {
        if (this._isInitializing) {
            console.log('[App PC] ⏳ Já inicializando...');
            return;
        }
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
        } else {
            console.warn('[App PC] ⚠️ CacheManager não disponível');
        }
        
        // Aguardar Supabase
        this.updateLoadingStatus('Conectando ao servidor...', 25);
        await this.waitForSupabase();
        
        // Inicializar Sync
        this.updateLoadingStatus('Inicializando sincronização...', 30);
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
        
        // ⭐ CARREGAR DADOS DA NUVEM (FORÇADO)
        this.updateLoadingStatus('Carregando dados da nuvem...', 45);
        await this.loadDataFromCloud();
        
        // Carregar dados locais
        this.updateLoadingStatus('Carregando dados locais...', 55);
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
        
        // ⭐ CARREGAR NOTIFICAÇÕES DO SUPABASE
        this.updateLoadingStatus('Carregando notificações...', 96);
        await this.loadNotificationsFromSupabase();
        
        // ⭐ FECHAR LOADING
        this.updateLoadingStatus('Pronto!', 100);
        setTimeout(() => {
            this.closeLoadingOverlay();
        }, 400);
        
        this._isInitializing = false;
        console.log('[App PC] ✅ Aplicação pronta!');
    }
    
    // ============================================
    // ⭐ AGUARDAR SUPABASE
    // ============================================
    async waitForSupabase() {
        if (this.getSupabase()) {
            console.log('[App PC] ✅ Supabase já disponível');
            return true;
        }
        
        console.log('[App PC] ⏳ Aguardando Supabase inicializar...');
        
        if (window.SupabaseClient?.initSupabase) {
            window.SupabaseClient.initSupabase();
        }
        
        let attempts = 0;
        const maxAttempts = 50;
        
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                attempts++;
                if (this.getSupabase()) {
                    console.log('[App PC] ✅ Supabase pronto!');
                    clearInterval(checkInterval);
                    resolve(true);
                } else if (attempts >= maxAttempts) {
                    console.warn('[App PC] ⚠️ Timeout aguardando Supabase - continuando offline');
                    clearInterval(checkInterval);
                    resolve(false);
                }
            }, 200);
        });
    }
    
    // ============================================
    // ⭐ CARREGAR DADOS DA NUVEM
    // ============================================
    async loadDataFromCloud() {
        try {
            if (!window.CacheManager) {
                console.warn('[App PC] ⚠️ CacheManager não disponível');
                return false;
            }
            
            console.log('[App PC] ☁️ Carregando dados da nuvem...');
            const result = await window.CacheManager.loadFromCloud(true);
            console.log('[App PC] ✅ Dados da nuvem carregados:', result ? 'com alterações' : 'sem alterações');
            return result;
        } catch (error) {
            console.error('[App PC] ❌ Erro ao carregar dados da nuvem:', error);
            return false;
        }
    }
    
    // ============================================
    // ⭐ CARREGAR DADOS (LOCAL + CACHE)
    // ============================================
    async loadData() {
        if (window.CacheManager) {
            // ⭐ CARREGAR DO CACHE (QUE JÁ TEM OS DADOS DA NUVEM)
            this.data.tasks = window.CacheManager.get('tasks', []);
            this.data.notes = window.CacheManager.get('notes', []);
            this.data.calendarEvents = window.CacheManager.get('calendarEvents', []);
            this.data.weeklySchedule = window.CacheManager.get('weeklySchedule', {});
            this.data.timeSlots = window.CacheManager.get('timeSlots', []);
            this.data.notifications = window.CacheManager.get('notifications', []);
            this.data.disciplinas = window.CacheManager.get('disciplinas', []);
            this.data.profile = window.CacheManager.get('usuarioLogado', {});
            
            // Garantir estrutura do horário
            const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
            dias.forEach(day => {
                if (!this.data.weeklySchedule[day]) {
                    this.data.weeklySchedule[day] = [];
                }
            });
            
            // ⭐ FILTRAR NOTAS FANTASMAS
            if (Array.isArray(this.data.notes)) {
                const filtradas = this.data.notes.filter(n => {
                    const hasTitle = n.title && n.title.trim().length > 0;
                    const hasContent = n.content && n.content.trim().length > 0 && 
                                      n.content !== '<br>' && 
                                      n.content !== '<div><br></div>' &&
                                      n.content !== '<p><br></p>';
                    return hasTitle || hasContent;
                });
                if (filtradas.length !== this.data.notes.length) {
                    console.log(`[App PC] 🧹 Removidas ${this.data.notes.length - filtradas.length} notas fantasmas`);
                    this.data.notes = filtradas;
                    window.CacheManager.set('notes', filtradas, true);
                }
            }
            
            console.log('[App PC] 📊 Dados carregados:');
            console.log(`   - Tarefas: ${this.data.tasks.length}`);
            console.log(`   - Anotações: ${this.data.notes.length}`);
            console.log(`   - Eventos: ${this.data.calendarEvents.length}`);
            console.log(`   - Notificações: ${this.data.notifications.length}`);
            console.log(`   - Disciplinas: ${this.data.disciplinas.length}`);
            
            this.carregarAvatar();
        }
    }
    
    // ============================================
    // ⭐ SALVAR DADOS (CORRIGIDO)
    // ============================================
    async saveAllData() {
        if (window.CacheManager) {
            const userId = this.user?.id;
            if (!userId) {
                console.warn('[App PC] ⚠️ Usuário não logado para salvar');
                return;
            }
            
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
                    console.log(`[App PC] 🧹 Removidas ${antes - this.data.notes.length} notas fantasmas ao salvar`);
                }
            }
            
            console.log('[App PC] 💾 Salvando dados...');
            let savedCount = 0;
            
            for (const key of Object.keys(this.data)) {
                if (this.data[key] !== undefined && this.data[key] !== null) {
                    const result = window.CacheManager.set(key, this.data[key], true);
                    if (result) savedCount++;
                }
            }
            
            console.log(`[App PC] ✅ ${savedCount} tipos salvos no CacheManager`);
            
            // ⭐ FORÇAR SYNC COM SUPABASE
            try {
                const result = await window.CacheManager.forceSync();
                console.log('[App PC] ✅ Sync concluído:', result ? 'com alterações' : 'sem alterações');
            } catch (error) {
                console.error('[App PC] ❌ Erro no sync:', error);
            }
        } else {
            console.error('[App PC] ❌ CacheManager não disponível');
        }
    }
    
    // ============================================
    // ⭐ CARREGAR NOTIFICAÇÕES DO SUPABASE
    // ============================================
    async loadNotificationsFromSupabase() {
        try {
            const client = this.getSupabase();
            if (!client || !this.user) {
                console.log('[App PC] ℹ️ Supabase ou usuário não disponível para carregar notificações');
                return;
            }

            console.log('[App PC] 📬 Carregando notificações do Supabase...');
            
            const { data, error } = await client
                .from('notifications')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.warn('[App PC] ⚠️ Erro ao carregar notificações:', error);
                return;
            }

            if (data && data.length > 0) {
                const notificacoes = data.map(n => ({
                    id: n.id,
                    title: n.title || 'Notificação',
                    message: n.message || '',
                    type: n.type || 'info',
                    read: n.read || false, // ⭐ MANTER O VALOR DO BANCO
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

                console.log(`[App PC] ✅ ${notificacoes.length} notificações carregadas do Supabase`);
                
                // Atualizar badge
                this.updateBadge();
                
                // Notificar UI
                window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            } else {
                console.log('[App PC] ℹ️ Nenhuma notificação encontrada no Supabase');
            }
        } catch (error) {
            console.error('[App PC] ❌ Erro ao carregar notificações:', error);
        }
    }
    
    // ============================================
    // ⭐ DELETAR NOTIFICAÇÃO INDIVIDUAL (DO SUPABASE)
    // ============================================
    async deleteNotification(id) {
        try {
            const client = this.getSupabase();
            if (client && this.user) {
                const { error } = await client
                    .from('notifications')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', this.user.id);

                if (error) {
                    console.error('[App PC] ❌ Erro ao deletar notificação do Supabase:', error);
                }
            }

            this.data.notifications = this.data.notifications.filter(n => n.id != id);
            
            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }
            
            this.updateBadge();
            this.renderNotifications();
            
            if (typeof showToast === 'function') {
                showToast('🗑️ Notificação removida!', 'success');
            }
            
            console.log('[App PC] ✅ Notificação deletada:', id);
            
        } catch (error) {
            console.error('[App PC] ❌ Erro ao deletar notificação:', error);
        }
    }
    
    // ============================================
    // ⭐ MARCAR TODAS COMO LIDAS
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
                const ids = naoLidas.map(n => n.id);
                const { error } = await client
                    .from('notifications')
                    .update({ read: true })
                    .in('id', ids)
                    .eq('user_id', this.user.id);

                if (error) {
                    console.error('[App PC] ❌ Erro ao marcar como lidas no Supabase:', error);
                }
            }

            this.data.notifications.forEach(n => {
                if (!n.read) n.read = true;
            });

            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            this.updateBadge();
            this.renderNotifications();

            if (typeof showToast === 'function') {
                showToast('✅ Todas as notificações marcadas como lidas!', 'success');
            }

        } catch (error) {
            console.error('[App PC] ❌ Erro ao marcar como lidas:', error);
        }
    }
    
    // ============================================
    // ⭐ LIMPAR TODAS AS NOTIFICAÇÕES
    // ============================================
    async limparTodasNotificacoes() {
        if (!confirm('Limpar todas as notificações?')) return;

        try {
            const client = this.getSupabase();
            if (client && this.user) {
                const { error } = await client
                    .from('notifications')
                    .delete()
                    .eq('user_id', this.user.id);

                if (error) {
                    console.error('[App PC] ❌ Erro ao limpar notificações do Supabase:', error);
                }
            }

            this.data.notifications = [];

            if (window.CacheManager) {
                window.CacheManager.set('notifications', this.data.notifications, true);
            }

            this.updateBadge();
            this.renderNotifications();

            if (typeof showToast === 'function') {
                showToast('🗑️ Todas as notificações removidas!', 'success');
            }

        } catch (error) {
            console.error('[App PC] ❌ Erro ao limpar notificações:', error);
        }
    }
    
    // ============================================
    // ATUALIZAR NOME DO USUÁRIO
    // ============================================
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
    
    // ============================================
    // CARREGAR MÓDULOS
    // ============================================
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
    
    // ============================================
    // CARREGAR CSS
    // ============================================
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
    
    // ============================================
    // NAVEGAÇÃO
    // ============================================
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
    
    // ============================================
    // SHOW VIEW
    // ============================================
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
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
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
    
    // ============================================
    // HELPERS
    // ============================================
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
    
    // ============================================
    // EVENTOS
    // ============================================
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
        
        // Botão marcar todas como lidas
        document.getElementById('btnMarkAllRead')?.addEventListener('click', () => {
            this.marcarTodasComoLidas();
        });
        
        // Botão limpar todas
        document.getElementById('btnClearAll')?.addEventListener('click', () => {
            this.limparTodasNotificacoes();
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
        
        // ⭐ EVENTO DE DADOS CARREGADOS DA NUVEM
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[App PC] 📡 Dados carregados da nuvem');
            this.loadData();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
            this.updateBadge();
        });
        
        // ⭐ EVENTO DE FORÇAR REFRESH
        window.addEventListener('forceRefresh', () => {
            console.log('[App PC] 🔄 Forçando atualização da UI');
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
            this.updateBadge();
        });
        
        // ⭐ EVENTO DE NOTIFICAÇÕES ATUALIZADAS
        window.addEventListener('notificationsUpdated', () => {
            console.log('[App PC] 📬 Notificações atualizadas!');
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
            this.updateBadge();
        });
        
        // ⭐ EVENTO DE PERFIL ATUALIZADO
        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                const miniAvatar = document.getElementById('miniAvatar');
                const avatarImage = document.getElementById('avatarImage');
                if (miniAvatar) miniAvatar.src = event.detail.photoUrl;
                if (avatarImage) avatarImage.src = event.detail.photoUrl;
            }
        });
        
        // ⭐ TECLA ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const notifModal = document.getElementById('notifModal');
                if (notifModal?.classList.contains('active')) {
                    this.closeNotifications();
                }
                if (this.currentView === 'ia') {
                    this.showView('inicio');
                }
            }
        });
        
        // ⭐ NOVAS NOTIFICAÇÕES EM TEMPO REAL
        window.addEventListener('newNotification', (e) => {
            console.log('[App PC] 📬 Nova notificação recebida via Realtime!');
            this.loadNotificationsFromSupabase();
            this.updateBadge();
            if (this.modules[this.currentView]) {
                this.modules[this.currentView].render(this.data);
            }
        });
        
        // ⭐ SINCRONIZAÇÃO DE DADOS ENTRE ABAS
        window.addEventListener('storage', (e) => {
            if (e.key && e.key.includes('_')) {
                console.log('[App PC] 📡 Dados alterados em outra aba:', e.key);
                this.loadData();
                if (this.modules[this.currentView]) {
                    this.modules[this.currentView].render(this.data);
                }
                this.updateBadge();
            }
        });
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

console.log('[App PC] ✅ app.js carregado (corrigido)!');