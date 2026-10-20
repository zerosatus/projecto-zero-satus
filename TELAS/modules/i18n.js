// ============================================
// modules/i18n.js - INTERNACIONALIZAÇÃO
// ============================================

class I18nModule {
    constructor(app) {
        this.app = app;
        this.name = 'i18n';
        this.currentLang = 'pt-BR';
        
        // ============================================
        // TRADUÇÕES
        // ============================================
        this.translations = {
            'pt-BR': {
                // Navegação
                'nav.inicio': 'Início',
                'nav.dashboard': 'Dashboard',
                'nav.calendario': 'Calendário',
                'nav.tarefas': 'Tarefas',
                'nav.anotacoes': 'Anotações',
                'nav.documentos': 'Documentos',
                'nav.perfil': 'Perfil',
                'nav.ia': 'Assistente IA',
                'nav.logout': 'Sair',
                
                // Ações
                'action.save': 'Salvar',
                'action.cancel': 'Cancelar',
                'action.delete': 'Excluir',
                'action.edit': 'Editar',
                'action.add': 'Adicionar',
                'action.close': 'Fechar',
                'action.confirm': 'Confirmar',
                'action.search': 'Pesquisar',
                'action.download': 'Baixar',
                'action.upload': 'Enviar',
                
                // Dashboard
                'dashboard.welcome': 'Bem-vindo',
                'dashboard.subtitle': 'Visão geral do seu dia',
                'dashboard.stats.tasks': 'Tarefas',
                'dashboard.stats.completion': 'Conclusão',
                'dashboard.stats.study': 'Estudo',
                'dashboard.progress': 'Progresso Semanal',
                'dashboard.nextClass': 'Próxima Aula',
                'dashboard.nextTask': 'Próxima Tarefa',
                'dashboard.notifications': 'Notificações Recentes',
                'dashboard.schedule': 'Horário Semanal',
                'dashboard.phrase': 'Frase do Dia',
                'dashboard.disciplines': 'Minhas Disciplinas',
                
                // Tarefas
                'tasks.title': 'Tarefas',
                'tasks.subtitle': 'Gerencie suas tarefas acadêmicas',
                'tasks.new': 'Nova Tarefa',
                'tasks.all': 'Todas',
                'tasks.pending': 'Pendentes',
                'tasks.completed': 'Concluídas',
                'tasks.favorites': 'Favoritas',
                'tasks.search': 'Buscar tarefas...',
                'tasks.sort.deadline': 'Por prazo',
                'tasks.sort.subject': 'Por disciplina',
                'tasks.sort.priority': 'Por prioridade',
                'tasks.empty': 'Nenhuma tarefa encontrada',
                
                // Calendário
                'calendar.title': 'Calendário',
                'calendar.subtitle': 'Gerencie seus eventos acadêmicos',
                'calendar.new': 'Novo Evento',
                'calendar.month': 'Mês',
                'calendar.week': 'Semana',
                'calendar.day': 'Dia',
                'calendar.today': 'Hoje',
                'calendar.events': 'Eventos do Dia',
                'calendar.noEvents': 'Nenhum evento para este dia',
                
                // Anotações
                'notes.title': 'Anotações',
                'notes.subtitle': 'Organize suas anotações',
                'notes.new': 'Nova Anotação',
                'notes.search': 'Pesquisar anotações...',
                'notes.titlePlaceholder': 'Título da anotação...',
                'notes.contentPlaceholder': 'Digite sua anotação...',
                'notes.empty': 'Nenhuma anotação ainda',
                'notes.lastSaved': 'Salvo',
                
                // Documentos
                'docs.title': 'Meus Documentos',
                'docs.subtitle': 'Gerencie seus arquivos',
                'docs.upload': 'Enviar Documento',
                'docs.name': 'Nome do Documento',
                'docs.category': 'Categoria',
                'docs.description': 'Descrição',
                'docs.file': 'Arquivo',
                'docs.empty': 'Nenhum documento enviado',
                'docs.categories.works': 'Trabalhos',
                'docs.categories.exams': 'Provas',
                'docs.categories.presentations': 'Apresentações',
                'docs.categories.articles': 'Artigos',
                'docs.categories.others': 'Outros',
                
                // Perfil
                'profile.title': 'Minha Conta',
                'profile.personalData': 'Dados Pessoais',
                'profile.security': 'Segurança',
                'profile.notifications': 'Notificações',
                'profile.appearance': 'Aparência',
                'profile.themes': 'Temas',
                'profile.accessibility': 'Acessibilidade',
                'profile.language': 'Idioma',
                'profile.help': 'Ajuda e Suporte',
                'profile.documents': 'Meus Documentos',
                'profile.sync': 'Sincronizar com Nuvem',
                'profile.deletePhoto': 'Remover Foto',
                'profile.logout': 'Sair da Conta',
                'profile.version': 'Versão do App',
                
                // IA
                'ai.title': 'Zero IA',
                'ai.subtitle': 'Seu ajudante de estudos',
                'ai.placeholder': 'Pergunte algo sobre seus estudos...',
                'ai.newChat': 'Nova conversa',
                'ai.searchChats': 'Buscar conversas...',
                'ai.noChats': 'Nenhuma conversa ainda',
                'ai.limit': 'perguntas hoje',
                
                // Configurações
                'settings.darkMode': 'Tema Escuro',
                'settings.language': 'Idioma',
                'settings.notifications': 'Notificações',
                'settings.fontSize': 'Tamanho da Fonte',
                
                // Mensagens
                'msg.saved': 'Salvo com sucesso!',
                'msg.deleted': 'Excluído com sucesso!',
                'msg.updated': 'Atualizado com sucesso!',
                'msg.created': 'Criado com sucesso!',
                'msg.error': 'Ocorreu um erro',
                'msg.confirmDelete': 'Tem certeza que deseja excluir?',
                'msg.loading': 'Carregando...',
                
                // Dias da semana
                'day.sun': 'Dom',
                'day.mon': 'Seg',
                'day.tue': 'Ter',
                'day.wed': 'Qua',
                'day.thu': 'Qui',
                'day.fri': 'Sex',
                'day.sat': 'Sáb',
                
                // Meses
                'month.jan': 'Janeiro',
                'month.feb': 'Fevereiro',
                'month.mar': 'Março',
                'month.apr': 'Abril',
                'month.may': 'Maio',
                'month.jun': 'Junho',
                'month.jul': 'Julho',
                'month.aug': 'Agosto',
                'month.sep': 'Setembro',
                'month.oct': 'Outubro',
                'month.nov': 'Novembro',
                'month.dec': 'Dezembro'
            },
            
            'en-US': {
                // Navigation
                'nav.inicio': 'Home',
                'nav.dashboard': 'Dashboard',
                'nav.calendario': 'Calendar',
                'nav.tarefas': 'Tasks',
                'nav.anotacoes': 'Notes',
                'nav.documentos': 'Documents',
                'nav.perfil': 'Profile',
                'nav.ia': 'AI Assistant',
                'nav.logout': 'Logout',
                
                // Actions
                'action.save': 'Save',
                'action.cancel': 'Cancel',
                'action.delete': 'Delete',
                'action.edit': 'Edit',
                'action.add': 'Add',
                'action.close': 'Close',
                'action.confirm': 'Confirm',
                'action.search': 'Search',
                'action.download': 'Download',
                'action.upload': 'Upload',
                
                // Dashboard
                'dashboard.welcome': 'Welcome',
                'dashboard.subtitle': 'Overview of your day',
                'dashboard.stats.tasks': 'Tasks',
                'dashboard.stats.completion': 'Completion',
                'dashboard.stats.study': 'Study',
                'dashboard.progress': 'Weekly Progress',
                'dashboard.nextClass': 'Next Class',
                'dashboard.nextTask': 'Next Task',
                'dashboard.notifications': 'Recent Notifications',
                'dashboard.schedule': 'Weekly Schedule',
                'dashboard.phrase': 'Phrase of the Day',
                'dashboard.disciplines': 'My Subjects',
                
                // Tasks
                'tasks.title': 'Tasks',
                'tasks.subtitle': 'Manage your academic tasks',
                'tasks.new': 'New Task',
                'tasks.all': 'All',
                'tasks.pending': 'Pending',
                'tasks.completed': 'Completed',
                'tasks.favorites': 'Favorites',
                'tasks.search': 'Search tasks...',
                'tasks.sort.deadline': 'By deadline',
                'tasks.sort.subject': 'By subject',
                'tasks.sort.priority': 'By priority',
                'tasks.empty': 'No tasks found',
                
                // Calendar
                'calendar.title': 'Calendar',
                'calendar.subtitle': 'Manage your academic events',
                'calendar.new': 'New Event',
                'calendar.month': 'Month',
                'calendar.week': 'Week',
                'calendar.day': 'Day',
                'calendar.today': 'Today',
                'calendar.events': 'Day Events',
                'calendar.noEvents': 'No events for this day',
                
                // Notes
                'notes.title': 'Notes',
                'notes.subtitle': 'Organize your notes',
                'notes.new': 'New Note',
                'notes.search': 'Search notes...',
                'notes.titlePlaceholder': 'Note title...',
                'notes.contentPlaceholder': 'Write your note...',
                'notes.empty': 'No notes yet',
                'notes.lastSaved': 'Saved',
                
                // Documents
                'docs.title': 'My Documents',
                'docs.subtitle': 'Manage your files',
                'docs.upload': 'Upload Document',
                'docs.name': 'Document Name',
                'docs.category': 'Category',
                'docs.description': 'Description',
                'docs.file': 'File',
                'docs.empty': 'No documents uploaded',
                'docs.categories.works': 'Assignments',
                'docs.categories.exams': 'Exams',
                'docs.categories.presentations': 'Presentations',
                'docs.categories.articles': 'Articles',
                'docs.categories.others': 'Others',
                
                // Profile
                'profile.title': 'My Account',
                'profile.personalData': 'Personal Data',
                'profile.security': 'Security',
                'profile.notifications': 'Notifications',
                'profile.appearance': 'Appearance',
                'profile.themes': 'Themes',
                'profile.accessibility': 'Accessibility',
                'profile.language': 'Language',
                'profile.help': 'Help & Support',
                'profile.documents': 'My Documents',
                'profile.sync': 'Sync with Cloud',
                'profile.deletePhoto': 'Remove Photo',
                'profile.logout': 'Logout',
                'profile.version': 'App Version',
                
                // AI
                'ai.title': 'Zero AI',
                'ai.subtitle': 'Your study helper',
                'ai.placeholder': 'Ask something about your studies...',
                'ai.newChat': 'New chat',
                'ai.searchChats': 'Search chats...',
                'ai.noChats': 'No chats yet',
                'ai.limit': 'questions today',
                
                // Settings
                'settings.darkMode': 'Dark Mode',
                'settings.language': 'Language',
                'settings.notifications': 'Notifications',
                'settings.fontSize': 'Font Size',
                
                // Messages
                'msg.saved': 'Saved successfully!',
                'msg.deleted': 'Deleted successfully!',
                'msg.updated': 'Updated successfully!',
                'msg.created': 'Created successfully!',
                'msg.error': 'An error occurred',
                'msg.confirmDelete': 'Are you sure you want to delete?',
                'msg.loading': 'Loading...',
                
                // Days
                'day.sun': 'Sun',
                'day.mon': 'Mon',
                'day.tue': 'Tue',
                'day.wed': 'Wed',
                'day.thu': 'Thu',
                'day.fri': 'Fri',
                'day.sat': 'Sat',
                
                // Months
                'month.jan': 'January',
                'month.feb': 'February',
                'month.mar': 'March',
                'month.apr': 'April',
                'month.may': 'May',
                'month.jun': 'June',
                'month.jul': 'July',
                'month.aug': 'August',
                'month.sep': 'September',
                'month.oct': 'October',
                'month.nov': 'November',
                'month.dec': 'December'
            },
            
            'es': {
                // Navegación
                'nav.inicio': 'Inicio',
                'nav.dashboard': 'Panel',
                'nav.calendario': 'Calendario',
                'nav.tarefas': 'Tareas',
                'nav.anotacoes': 'Notas',
                'nav.documentos': 'Documentos',
                'nav.perfil': 'Perfil',
                'nav.ia': 'Asistente IA',
                'nav.logout': 'Salir',
                
                // Acciones
                'action.save': 'Guardar',
                'action.cancel': 'Cancelar',
                'action.delete': 'Eliminar',
                'action.edit': 'Editar',
                'action.add': 'Añadir',
                'action.close': 'Cerrar',
                'action.confirm': 'Confirmar',
                'action.search': 'Buscar',
                'action.download': 'Descargar',
                'action.upload': 'Subir',
                
                // Dashboard
                'dashboard.welcome': 'Bienvenido',
                'dashboard.subtitle': 'Resumen de tu día',
                'dashboard.stats.tasks': 'Tareas',
                'dashboard.stats.completion': 'Completado',
                'dashboard.stats.study': 'Estudio',
                'dashboard.progress': 'Progreso Semanal',
                'dashboard.nextClass': 'Próxima Clase',
                'dashboard.nextTask': 'Próxima Tarea',
                'dashboard.notifications': 'Notificaciones Recientes',
                'dashboard.schedule': 'Horario Semanal',
                'dashboard.phrase': 'Frase del Día',
                'dashboard.disciplines': 'Mis Asignaturas',
                
                // Tasks
                'tasks.title': 'Tareas',
                'tasks.subtitle': 'Gestiona tus tareas académicas',
                'tasks.new': 'Nueva Tarea',
                'tasks.all': 'Todas',
                'tasks.pending': 'Pendientes',
                'tasks.completed': 'Completadas',
                'tasks.favorites': 'Favoritas',
                'tasks.search': 'Buscar tareas...',
                'tasks.sort.deadline': 'Por fecha',
                'tasks.sort.subject': 'Por asignatura',
                'tasks.sort.priority': 'Por prioridad',
                'tasks.empty': 'No se encontraron tareas',
                
                // Calendar
                'calendar.title': 'Calendario',
                'calendar.subtitle': 'Gestiona tus eventos académicos',
                'calendar.new': 'Nuevo Evento',
                'calendar.month': 'Mes',
                'calendar.week': 'Semana',
                'calendar.day': 'Día',
                'calendar.today': 'Hoy',
                'calendar.events': 'Eventos del Día',
                'calendar.noEvents': 'No hay eventos para este día',
                
                // Notes
                'notes.title': 'Notas',
                'notes.subtitle': 'Organiza tus notas',
                'notes.new': 'Nueva Nota',
                'notes.search': 'Buscar notas...',
                'notes.titlePlaceholder': 'Título de la nota...',
                'notes.contentPlaceholder': 'Escribe tu nota...',
                'notes.empty': 'Aún no hay notas',
                'notes.lastSaved': 'Guardado',
                
                // Documents
                'docs.title': 'Mis Documentos',
                'docs.subtitle': 'Gestiona tus archivos',
                'docs.upload': 'Subir Documento',
                'docs.name': 'Nombre del Documento',
                'docs.category': 'Categoría',
                'docs.description': 'Descripción',
                'docs.file': 'Archivo',
                'docs.empty': 'No hay documentos subidos',
                'docs.categories.works': 'Trabajos',
                'docs.categories.exams': 'Exámenes',
                'docs.categories.presentations': 'Presentaciones',
                'docs.categories.articles': 'Artículos',
                'docs.categories.others': 'Otros',
                
                // Profile
                'profile.title': 'Mi Cuenta',
                'profile.personalData': 'Datos Personales',
                'profile.security': 'Seguridad',
                'profile.notifications': 'Notificaciones',
                'profile.appearance': 'Apariencia',
                'profile.themes': 'Temas',
                'profile.accessibility': 'Accesibilidad',
                'profile.language': 'Idioma',
                'profile.help': 'Ayuda y Soporte',
                'profile.documents': 'Mis Documentos',
                'profile.sync': 'Sincronizar con Nube',
                'profile.deletePhoto': 'Eliminar Foto',
                'profile.logout': 'Cerrar Sesión',
                'profile.version': 'Versión de la App',
                
                // AI
                'ai.title': 'Zero IA',
                'ai.subtitle': 'Tu ayudante de estudios',
                'ai.placeholder': 'Pregunta algo sobre tus estudios...',
                'ai.newChat': 'Nueva conversación',
                'ai.searchChats': 'Buscar conversaciones...',
                'ai.noChats': 'Aún no hay conversaciones',
                'ai.limit': 'preguntas hoy',
                
                // Settings
                'settings.darkMode': 'Modo Oscuro',
                'settings.language': 'Idioma',
                'settings.notifications': 'Notificaciones',
                'settings.fontSize': 'Tamaño de Fuente',
                
                // Messages
                'msg.saved': '¡Guardado con éxito!',
                'msg.deleted': '¡Eliminado con éxito!',
                'msg.updated': '¡Actualizado con éxito!',
                'msg.created': '¡Creado con éxito!',
                'msg.error': 'Ocurrió un error',
                'msg.confirmDelete': '¿Estás seguro de que quieres eliminar?',
                'msg.loading': 'Cargando...',
                
                // Days
                'day.sun': 'Dom',
                'day.mon': 'Lun',
                'day.tue': 'Mar',
                'day.wed': 'Mié',
                'day.thu': 'Jue',
                'day.fri': 'Vie',
                'day.sat': 'Sáb',
                
                // Months
                'month.jan': 'Enero',
                'month.feb': 'Febrero',
                'month.mar': 'Marzo',
                'month.apr': 'Abril',
                'month.may': 'Mayo',
                'month.jun': 'Junio',
                'month.jul': 'Julio',
                'month.aug': 'Agosto',
                'month.sep': 'Septiembre',
                'month.oct': 'Octubre',
                'month.nov': 'Noviembre',
                'month.dec': 'Diciembre'
            }
        };
        
        // Idiomas disponíveis
        this.languages = [
            { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
            { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
            { code: 'es', name: 'Español', flag: '🇪🇸' }
        ];
        
        console.log('[I18n] 🌍 Módulo inicializado');
        this.loadLanguage();
    }
    
    // ============================================
    // CARREGAR IDIOMA SALVO
    // ============================================
    loadLanguage() {
        const saved = localStorage.getItem('app_language');
        if (saved && this.translations[saved]) {
            this.currentLang = saved;
        } else {
            // Detectar do navegador
            const browserLang = navigator.language || 'pt-BR';
            if (browserLang.startsWith('en')) this.currentLang = 'en-US';
            else if (browserLang.startsWith('es')) this.currentLang = 'es';
            else this.currentLang = 'pt-BR';
        }
        
        this.applyLanguage();
    }
    
    // ============================================
    // TRADUZIR
    // ============================================
    t(key, fallback = null) {
        const lang = this.translations[this.currentLang];
        if (!lang) return fallback || key;
        
        // Suporte a chaves aninhadas: 'tasks.title'
        const keys = key.split('.');
        let value = lang;
        
        for (const k of keys) {
            value = value?.[k];
            if (value === undefined) break;
        }
        
        return value || fallback || key;
    }
    
    // ============================================
    // APLICAR IDIOMA
    // ============================================
    applyLanguage() {
        // Atualizar todos os elementos com data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = this.t(key);
            
            // Placeholder
            if (el.hasAttribute('data-i18n-placeholder')) {
                el.placeholder = translation;
            }
            // Title
            else if (el.hasAttribute('data-i18n-title')) {
                el.title = translation;
            }
            // HTML
            else if (el.hasAttribute('data-i18n-html')) {
                el.innerHTML = translation;
            }
            // Texto normal
            else {
                el.textContent = translation;
            }
        });
        
        // Atualizar atributos lang
        document.documentElement.lang = this.currentLang;
        
        console.log('[I18n] ✅ Idioma aplicado:', this.currentLang);
        
        // Disparar evento
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang: this.currentLang }
        }));
    }
    
    // ============================================
    // ALTERAR IDIOMA
    // ============================================
    setLanguage(langCode) {
        if (!this.translations[langCode]) {
            console.warn('[I18n] ⚠️ Idioma não suportado:', langCode);
            return;
        }
        
        this.currentLang = langCode;
        localStorage.setItem('app_language', langCode);
        
        if (window.CacheManager) {
            window.CacheManager.set('language', langCode, true);
        }
        
        this.applyLanguage();
        
        const lang = this.languages.find(l => l.code === langCode);
        this.showToast(`${lang.flag} ${lang.name}`, 'success');
        
        // Atualizar UI do app
        if (this.app?.modules?.perfil) {
            this.app.modules.perfil.render(this.app.data);
        }
    }
    
    // ============================================
    // RENDER (chamado do app)
    // ============================================
    render(data) {
        this.loadLanguage();
    }
    
    // ============================================
    // ABRIR MODAL DE IDIOMAS
    // ============================================
    openModal() {
        let modal = document.getElementById('language-modal');
        
        if (!modal) {
            modal = this.createModal();
        }
        
        this.updateModalUI();
        modal.classList.add('active');
    }
    
    // ============================================
    // CRIAR MODAL
    // ============================================
    createModal() {
        const modal = document.createElement('div');
        modal.className = 'profile-modal';
        modal.id = 'language-modal';
        
        let languagesHTML = '';
        this.languages.forEach(lang => {
            languagesHTML += `
                <div class="language-option ${lang.code === this.currentLang ? 'active' : ''}"
                     data-lang="${lang.code}"
                     onclick="app.modules.i18n.setLanguage('${lang.code}')">
                    <div class="language-flag">${lang.flag}</div>
                    <div class="language-info">
                        <span class="language-name">${lang.name}</span>
                        <span class="language-code">${lang.code}</span>
                    </div>
                    <div class="language-check">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        });
        
        modal.innerHTML = `
            <div class="profile-modal-content">
                <div class="profile-modal-header">
                    <button class="btn-back-modal" onclick="app.modules.i18n.closeModal()">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <h2><i class="fas fa-globe"></i> Idioma</h2>
                    <button class="btn-close-modal-btn" onclick="app.modules.i18n.closeModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="profile-form">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 16px;">
                        Escolha o idioma da interface do aplicativo.
                    </p>
                    
                    <div class="languages-list">
                        ${languagesHTML}
                    </div>
                    
                    <!-- Preview -->
                    <div style="margin-top: 20px; padding: 16px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px;">
                        <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">
                            <i class="fas fa-eye"></i> Pré-visualização
                        </div>
                        <div style="color: var(--text-primary); font-size: 0.9rem; line-height: 1.8;">
                            <div><strong>${this.t('nav.inicio')}</strong> - ${this.t('dashboard.subtitle')}</div>
                            <div><strong>${this.t('nav.tarefas')}</strong> - ${this.t('tasks.subtitle')}</div>
                            <div><strong>${this.t('nav.anotacoes')}</strong> - ${this.t('notes.subtitle')}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        return modal;
    }
    
    // ============================================
    // ATUALIZAR UI DO MODAL
    // ============================================
    updateModalUI() {
        document.querySelectorAll('.language-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === this.currentLang);
        });
    }
    
    closeModal() {
        document.getElementById('language-modal')?.classList.remove('active');
    }
    
    showToast(mensagem, tipo) {
        if (typeof showToast === 'function') {
            showToast(mensagem, tipo);
        } else {
            console.log('[I18n]', mensagem);
        }
    }
    
    // ============================================
    // HELPERS
    // ============================================
    getCurrentLanguage() {
        return this.languages.find(l => l.code === this.currentLang);
    }
    
    getAvailableLanguages() {
        return [...this.languages];
    }
}

console.log('[I18n] ✅ Módulo carregado!');