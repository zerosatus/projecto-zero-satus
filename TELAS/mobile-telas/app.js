// ============================================
// app.js - SPA COMPLETO (MOBILE-ONLY) - CORRIGIDO SEM RPC
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
        this._supabaseReady = false;
        this._supabaseWaitResolve = null;
        
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
                        cleanup();
                        resolve();
                    }
                } else if (attempts >= maxAttempts) {
                    if (!resolved) {
                        resolved = true;
                        console.warn('[SPA] ⚠️ Timeout aguardando Supabase - continuando sem ele');
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
    // INICIALIZAÇÃO (CORRIGIDA)
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
        const headerName = document.getElementById('header-name');
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        
        // 2. ⭐ AGUARDAR SUPABASE FICAR PRONTO
        await this.waitForSupabase();
        
        // 3. Inicializar CacheManager
        if (window.CacheManager) {
            window.CacheManager.init();
            window.CacheManager.currentUserId = this.user.id;
            console.log('[SPA] ✅ CacheManager inicializado');
        } else {
            console.warn('[SPA] ⚠️ CacheManager não disponível');
        }
        
        // 4. Carregar módulos JavaScript
        this.loadModules();
        
        // 5. ⭐ CARREGAR DADOS (SEM RPC)
        await this.loadAllData();
        
        // 6. Configurar navegação
        this.setupNavigation();
        
        // 7. Configurar eventos
        this.setupEvents();
        
        // 8. Renderizar view inicial
        this.showView('dashboard');
        
        // 9. Atualizar badge de notificações
        this.updateBadge();
        
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
    // ⭐ CARREGAR DADOS - SEM RPC (CONSULTAS INDIVIDUAIS)
    // ============================================
    async loadAllData(retryCount = 0) {
        if (this.isLoading) return;
        this.isLoading = true;
        
        console.log(`[SPA] 📊 Carregando dados... (tentativa ${retryCount + 1})`);
        
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
                    this.isLoading = false;
                    return;
                }
            } catch(e) {
                console.warn('[SPA] ⚠️ Cache inválido, ignorando');
            }
        }
        
        // Tentar carregar do localStorage
        this.loadDataFromLocalStorage();
        
        // Se temos dados locais, não precisamos do Supabase
        const hasLocalData = this.data.tasks.length > 0 || 
                            this.data.notes.length > 0 || 
                            this.data.calendarEvents.length > 0;
        
        if (hasLocalData) {
            console.log('[SPA] 📂 Dados carregados do localStorage');
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            this.isLoading = false;
            return;
        }
        
        // Tentar carregar do Supabase (consultas individuais)
        try {
            const client = this.getSupabase();
            
            if (!client) {
                if (retryCount < 3) {
                    console.log(`[SPA] ⏳ Supabase não disponível, tentando novamente em ${(retryCount + 1) * 500}ms...`);
                    this.isLoading = false;
                    await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 500));
                    return this.loadAllData(retryCount + 1);
                }
                console.warn('[SPA] ⚠️ Supabase indisponível - usando dados locais');
                this.isLoading = false;
                return;
            }
            
            console.log('[SPA] 🔍 Buscando dados do Supabase (consultas individuais)...');
            
            // ⭐ CARREGAR CADA TABELA INDIVIDUALMENTE
            await this.loadDataIndividually(client);
            
            // Salvar cache
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            
            console.log('[SPA] ✅ Dados carregados do Supabase:', {
                tasks: this.data.tasks.length,
                notes: this.data.notes.length,
                events: this.data.calendarEvents.length,
                disciplinas: this.data.disciplinas.length
            });
            
        } catch (error) {
            console.error('[SPA] ❌ Erro ao carregar dados:', error);
        }
        
        this.isLoading = false;
    }
    
    // ============================================
    // ⭐ CARREGAR DADOS INDIVIDUALMENTE (SEM RPC)
    // ============================================
    async loadDataIndividually(client) {
        console.log('[SPA] 🔍 Carregando dados individualmente...');
        
        try {
            // ==========================================
            // 1. TASKS
            // ==========================================
            console.log('[SPA] 📋 Buscando tasks...');
            const { data: tasks, error: tasksErr } = await client
                .from('tasks')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false });
            
            if (tasksErr) {
                console.warn('[SPA] ⚠️ Erro ao buscar tasks:', tasksErr.message);
            } else if (tasks) {
                this.data.tasks = tasks.map(t => ({
                    id: t.id,
                    nome: t.title || t.nome || 'Sem título',
                    descricao: t.description || t.descricao || '',
                    disciplina: t.subject || t.disciplina || 'geral',
                    prioridade: t.priority || t.prioridade || 'media',
                    prazo: t.date || t.prazo || null,
                    completed: t.completed || false,
                    favorita: t.favorita || false,
                    subtasks: t.subtasks || [],
                    dataCriacao: t.created_at || new Date().toISOString(),
                    dataConclusao: t.completed ? (t.updated_at || new Date().toISOString()) : null
                }));
                console.log(`[SPA] ✅ ${this.data.tasks.length} tasks carregadas`);
            }
            
            // ==========================================
            // 2. NOTES
            // ==========================================
            console.log('[SPA] 📝 Buscando notes...');
            const { data: notes, error: notesErr } = await client
                .from('notes')
                .select('*')
                .eq('user_id', this.user.id)
                .order('updated_at', { ascending: false });
            
            if (notesErr) {
                console.warn('[SPA] ⚠️ Erro ao buscar notes:', notesErr.message);
            } else if (notes) {
                this.data.notes = notes.map(n => ({
                    id: n.id,
                    title: n.title || 'Sem título',
                    content: n.content || '',
                    date: n.created_at || new Date().toISOString(),
                    dataModificacao: n.updated_at || new Date().toISOString()
                }));
                console.log(`[SPA] ✅ ${this.data.notes.length} notes carregadas`);
            }
            
            // ==========================================
            // 3. CALENDAR EVENTS
            // ==========================================
            console.log('[SPA] 📅 Buscando eventos...');
            const { data: events, error: eventsErr } = await client
                .from('calendar_events')
                .select('*')
                .eq('user_id', this.user.id)
                .order('date', { ascending: true });
            
            if (eventsErr) {
                console.warn('[SPA] ⚠️ Erro ao buscar eventos:', eventsErr.message);
            } else if (events) {
                this.data.calendarEvents = events.map(e => ({
                    id: e.id,
                    title: e.title || 'Evento',
                    description: e.description || '',
                    date: e.date || new Date().toISOString().split('T')[0],
                    start: e.start_time || e.start || '08:00',
                    end: e.end_time || e.end || '09:00',
                    type: e.type || 'aula',
                    color: e.color || '#8b5cf6',
                    repeat: e.repeat_type || e.repeat || 'nao',
                    reminder: e.reminder || false
                }));
                console.log(`[SPA] ✅ ${this.data.calendarEvents.length} eventos carregados`);
            }
            
            // ==========================================
            // 4. WEEKLY SCHEDULE
            // ==========================================
            console.log('[SPA] 📊 Buscando horário semanal...');
            const { data: schedule, error: scheduleErr } = await client
                .from('weekly_schedule')
                .select('schedule')
                .eq('user_id', this.user.id)
                .single();
            
            if (scheduleErr && scheduleErr.code !== 'PGRST116') {
                console.warn('[SPA] ⚠️ Erro ao buscar horário:', scheduleErr.message);
            } else if (schedule) {
                this.data.weeklySchedule = schedule.schedule || {};
                const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
                dias.forEach(day => {
                    if (!this.data.weeklySchedule[day]) {
                        this.data.weeklySchedule[day] = [];
                    }
                });
                console.log('[SPA] ✅ Horário semanal carregado');
            }
            
            // ==========================================
            // 5. TIME SLOTS
            // ==========================================
            console.log('[SPA] ⏰ Buscando time slots...');
            const { data: slots, error: slotsErr } = await client
                .from('time_slots')
                .select('slots')
                .eq('user_id', this.user.id)
                .single();
            
            if (slotsErr && slotsErr.code !== 'PGRST116') {
                console.warn('[SPA] ⚠️ Erro ao buscar time slots:', slotsErr.message);
            } else if (slots) {
                this.data.timeSlots = slots.slots || ['08:00', '09:30', '11:00', '14:00', '15:30'];
                console.log(`[SPA] ✅ ${this.data.timeSlots.length} time slots carregados`);
            }
            
            // ==========================================
            // 6. DISCIPLINAS
            // ==========================================
            console.log('[SPA] 📚 Buscando disciplinas...');
            const { data: disciplinas, error: discErr } = await client
                .from('disciplinas')
                .select('*')
                .eq('user_id', this.user.id)
                .order('nome', { ascending: true });
            
            if (discErr) {
                console.warn('[SPA] ⚠️ Erro ao buscar disciplinas:', discErr.message);
            } else if (disciplinas) {
                this.data.disciplinas = disciplinas;
                console.log(`[SPA] ✅ ${this.data.disciplinas.length} disciplinas carregadas`);
            }
            
            // ==========================================
            // 7. NOTIFICATIONS
            // ==========================================
            console.log('[SPA] 🔔 Buscando notificações...');
            const { data: notifications, error: notifErr } = await client
                .from('notifications')
                .select('*')
                .eq('user_id', this.user.id)
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (notifErr) {
                console.warn('[SPA] ⚠️ Erro ao buscar notificações:', notifErr.message);
            } else if (notifications) {
                this.data.notifications = notifications.map(n => ({
                    id: n.id,
                    title: n.title || 'Notificação',
                    message: n.message || '',
                    type: n.type || 'info',
                    read: n.read || false,
                    time: n.created_at || new Date().toISOString()
                }));
                console.log(`[SPA] ✅ ${this.data.notifications.length} notificações carregadas`);
            }
            
            // ==========================================
            // 8. PROFILE
            // ==========================================
            console.log('[SPA] 👤 Buscando perfil...');
            const { data: profile, error: profileErr } = await client
                .from('profiles')
                .select('*')
                .eq('id', this.user.id)
                .single();
            
            if (profileErr && profileErr.code !== 'PGRST116') {
                console.warn('[SPA] ⚠️ Erro ao buscar perfil:', profileErr.message);
            } else if (profile) {
                this.data.profile = profile;
                console.log('[SPA] ✅ Perfil carregado');
            }
            
            // ==========================================
            // 9. SETTINGS
            // ==========================================
            console.log('[SPA] ⚙️ Buscando settings...');
            const { data: settings, error: settingsErr } = await client
                .from('user_settings')
                .select('*')
                .eq('user_id', this.user.id)
                .single();
            
            if (settingsErr && settingsErr.code !== 'PGRST116') {
                console.warn('[SPA] ⚠️ Erro ao buscar settings:', settingsErr.message);
            } else if (settings) {
                this.data.settings = {
                    theme: settings.theme || 'dark',
                    accent: settings.accent_color || '#8b5cf6',
                    fontSize: settings.font_size || 14,
                    notificationsSettings: settings.notifications_settings || {}
                };
                console.log('[SPA] ✅ Settings carregados');
            }
            
            // Salvar cache
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            
            // Salvar no localStorage também
            const userId = this.user.id;
            const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
            for (const type of types) {
                if (this.data[type]) {
                    localStorage.setItem(`${userId}_${type}`, JSON.stringify(this.data[type]));
                }
            }
            
            console.log('[SPA] ✅ Todos os dados carregados individualmente!');
            
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
        
        const userId = this.user.id;
        const types = ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications', 'disciplinas'];
        
        let loaded = false;
        
        for (const type of types) {
            const key = `${userId}_${type}`;
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed && (Array.isArray(parsed) ? parsed.length > 0 : Object.keys(parsed).length > 0)) {
                        this.data[type] = parsed;
                        loaded = true;
                        console.log(`[SPA] 📂 ${type} carregado do localStorage (${Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length} itens)`);
                    }
                } catch(e) {
                    console.warn(`[SPA] ⚠️ Erro ao carregar ${type} do localStorage`);
                }
            }
        }
        
        if (loaded) {
            sessionStorage.setItem('app_data', JSON.stringify(this.data));
            console.log('[SPA] ✅ Dados carregados do localStorage');
        } else {
            console.log('[SPA] ℹ️ Nenhum dado encontrado no localStorage');
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