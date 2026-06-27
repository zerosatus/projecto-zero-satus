// pc-pwa/task-notifier.js
// SISTEMA COMPLETO DE NOTIFICAÇÕES - Tarefas, Aulas, Eventos

const TaskNotifier = {
    _checkInterval: null,
    _lastChecked: null,
    _notifiedTasks: new Set(),
    _isRunning: false,
    _usuarioAtual: null,

    /**
     * Inicia o monitoramento completo
     */
    start() {
        // Só executa no PC com PWA instalado
        if (!window.PwaDetector || !window.PwaDetector.canUsePwaFeatures()) {
            console.log('[TaskNotifier] ❌ Não é PC/PWA - desativado');
            return;
        }

        if (this._isRunning) {
            console.log('[TaskNotifier] ⚠️ Já está rodando');
            return;
        }

        console.log('[TaskNotifier] ✅ Monitoramento COMPLETO iniciado');

        // Carrega usuário
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                this._usuarioAtual = JSON.parse(usuario);
            } catch (e) {}
        }

        // Verifica imediatamente
        setTimeout(() => {
            this.verificarTudo();
        }, 2000);

        // Verifica a cada 3 minutos (mais frequente)
        this._checkInterval = setInterval(() => {
            this.verificarTudo();
        }, 3 * 60 * 1000);

        // Verifica quando a página ganha foco
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('[TaskNotifier] 👁️ Página visível - verificando...');
                this.verificarTudo();
            }
        });

        // Verifica quando o usuário logar
        window.addEventListener('autoLoginSuccess', () => {
            const usuario = localStorage.getItem('usuarioLogado');
            if (usuario) {
                try {
                    this._usuarioAtual = JSON.parse(usuario);
                    console.log('[TaskNotifier] 👤 Usuário logado - verificando...');
                    this.verificarTudo();
                } catch (e) {}
            }
        });

        // Verifica quando dados forem atualizados
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[TaskNotifier] ☁️ Dados atualizados - verificando...');
            this.verificarTudo();
        });

        this._isRunning = true;
        console.log('[TaskNotifier] 🟢 Rodando!');
    },

    /**
     * Verifica TUDO de uma vez
     */
    verificarTudo() {
        // Recarrega usuário
        const usuario = localStorage.getItem('usuarioLogado');
        if (usuario) {
            try {
                this._usuarioAtual = JSON.parse(usuario);
            } catch (e) {}
        }

        if (!this._usuarioAtual) {
            console.log('[TaskNotifier] ⚠️ Sem usuário logado');
            return;
        }

        console.log('[TaskNotifier] 🔍 Verificando tudo...');

        this.verificarTarefas();
        this.verificarAulas();
        this.verificarEventos();
        this.verificarHorasEstudo();

        this._lastChecked = new Date();
    },

    /**
     * 1️⃣ VERIFICA TAREFAS PRÓXIMAS DO PRAZO
     */
    verificarTarefas() {
        try {
            const userId = this._usuarioAtual.id;
            const tasksKey = `${userId}_tasks`;
            const tasksData = localStorage.getItem(tasksKey);
            
            if (!tasksData) {
                console.log('[TaskNotifier] 📭 Nenhuma tarefa encontrada');
                return;
            }

            const tasks = JSON.parse(tasksData);
            const agora = new Date();
            let notificacoesEnviadas = 0;

            tasks.forEach(tarefa => {
                if (tarefa.completed) return;
                if (!tarefa.prazo) return;

                const prazo = new Date(tarefa.prazo);
                const diffHoras = (prazo - agora) / (1000 * 60 * 60);
                const diffDias = diffHoras / 24;

                const taskId = tarefa.id;
                const nomeTarefa = tarefa.nome || 'Tarefa';

                // ========================================
                // 🔥 NOTIFICAÇÃO DE URGÊNCIA (menos de 24h)
                // ========================================
                if (diffHoras > 0 && diffHoras <= 24 && !this._notifiedTasks.has(`${taskId}_urgente`)) {
                    const horasRestantes = Math.ceil(diffHoras);
                    const mensagem = horasRestantes <= 1 
                        ? `"${nomeTarefa}" vence em menos de 1 hora! ⚠️`
                        : `"${nomeTarefa}" vence em ${horasRestantes}h! ⏰`;

                    this._enviarNotificacao(
                        '⏰ TAREFA URGENTE!',
                        mensagem,
                        'urgent'
                    );
                    this._notifiedTasks.add(`${taskId}_urgente`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 Urgente: ${nomeTarefa} (${horasRestantes}h)`);
                }

                // ========================================
                // 🔥 NOTIFICAÇÃO DE 1 DIA
                // ========================================
                else if (diffDias > 0 && diffDias <= 1.5 && !this._notifiedTasks.has(`${taskId}_1dia`)) {
                    this._enviarNotificacao(
                        '📋 TAREFA AMANHÃ',
                        `"${nomeTarefa}" vence amanhã! Prepare-se.`,
                        'warning'
                    );
                    this._notifiedTasks.add(`${taskId}_1dia`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 1 dia: ${nomeTarefa}`);
                }

                // ========================================
                // 🔥 NOTIFICAÇÃO DE 2 DIAS
                // ========================================
                else if (diffDias > 1.5 && diffDias <= 2.5 && !this._notifiedTasks.has(`${taskId}_2dias`)) {
                    this._enviarNotificacao(
                        '📋 TAREFA EM 2 DIAS',
                        `"${nomeTarefa}" vence em 2 dias. Não esqueça!`,
                        'info'
                    );
                    this._notifiedTasks.add(`${taskId}_2dias`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 2 dias: ${nomeTarefa}`);
                }

                // ========================================
                // 🔥 NOTIFICAÇÃO DE 3 DIAS
                // ========================================
                else if (diffDias > 2.5 && diffDias <= 3.5 && !this._notifiedTasks.has(`${taskId}_3dias`)) {
                    this._enviarNotificacao(
                        '📋 TAREFA EM 3 DIAS',
                        `"${nomeTarefa}" vence em 3 dias. Planeje-se!`,
                        'info'
                    );
                    this._notifiedTasks.add(`${taskId}_3dias`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 3 dias: ${nomeTarefa}`);
                }

                // ========================================
                // 🔥 NOTIFICAÇÃO DE TAREFA ATRASADA
                // ========================================
                else if (diffHoras < 0 && !this._notifiedTasks.has(`${taskId}_atrasada`)) {
                    const horasAtraso = Math.ceil(Math.abs(diffHoras));
                    this._enviarNotificacao(
                        '⚠️ TAREFA ATRASADA!',
                        `"${nomeTarefa}" está atrasada há ${horasAtraso}h!`,
                        'danger'
                    );
                    this._notifiedTasks.add(`${taskId}_atrasada`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 Atrasada: ${nomeTarefa}`);
                }
            });

            if (notificacoesEnviadas > 0) {
                console.log(`[TaskNotifier] ✅ ${notificacoesEnviadas} notificações de tarefas enviadas`);
            }

        } catch (error) {
            console.error('[TaskNotifier] Erro ao verificar tarefas:', error);
        }
    },

    /**
     * 2️⃣ VERIFICA AULAS PRÓXIMAS
     */
    verificarAulas() {
        try {
            const userId = this._usuarioAtual.id;
            const scheduleKey = `${userId}_weeklySchedule`;
            const scheduleData = localStorage.getItem(scheduleKey);
            
            if (!scheduleData) {
                console.log('[TaskNotifier] 📭 Nenhum horário encontrado');
                return;
            }

            const schedule = JSON.parse(scheduleData);
            const agora = new Date();
            const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const diaAtual = diasSemana[agora.getDay()];
            const horaAtual = agora.getHours() + ':' + String(agora.getMinutes()).padStart(2, '0');
            let notificacoesEnviadas = 0;

            Object.keys(schedule).forEach(dia => {
                if (!schedule[dia] || !Array.isArray(schedule[dia])) return;

                schedule[dia].forEach(aula => {
                    if (!aula.horaInicio || !aula.materia) return;

                    const horaAula = aula.horaInicio;
                    const [h, m] = horaAula.split(':').map(Number);
                    const agoraHora = agora.getHours();
                    const agoraMin = agora.getMinutes();

                    const diffMinutos = (h * 60 + m) - (agoraHora * 60 + agoraMin);
                    const classId = `${dia}_${aula.materia}_${horaAula}`;

                    // ========================================
                    // 🔥 AULA HOJE EM 15 MINUTOS
                    // ========================================
                    if (dia === diaAtual && diffMinutos > 0 && diffMinutos <= 15 && !this._notifiedTasks.has(`${classId}_15min`)) {
                        this._enviarNotificacao(
                            '📚 AULA EM BREVE!',
                            `${aula.materia} começa em ${diffMinutos} minutos!`,
                            'warning'
                        );
                        this._notifiedTasks.add(`${classId}_15min`);
                        notificacoesEnviadas++;
                        console.log(`[TaskNotifier] 📢 Aula em ${diffMinutos}min: ${aula.materia}`);
                    }

                    // ========================================
                    // 🔥 AULA HOJE EM 1 HORA
                    // ========================================
                    else if (dia === diaAtual && diffMinutos > 15 && diffMinutos <= 60 && !this._notifiedTasks.has(`${classId}_1hora`)) {
                        this._enviarNotificacao(
                            '📚 AULA EM 1 HORA',
                            `${aula.materia} começa em 1 hora. Prepare-se!`,
                            'info'
                        );
                        this._notifiedTasks.add(`${classId}_1hora`);
                        notificacoesEnviadas++;
                        console.log(`[TaskNotifier] 📢 Aula em 1h: ${aula.materia}`);
                    }

                    // ========================================
                    // 🔥 AULA AMANHÃ
                    // ========================================
                    else {
                        const diasSemanaMap = { 'Dom':0, 'Seg':1, 'Ter':2, 'Qua':3, 'Qui':4, 'Sex':5, 'Sáb':6 };
                        const hojeIndex = agora.getDay();
                        const diaIndex = diasSemanaMap[dia];
                        
                        let diffDias = diaIndex - hojeIndex;
                        if (diffDias < 0) diffDias += 7;

                        if (diffDias === 1 && !this._notifiedTasks.has(`${classId}_amanha`)) {
                            this._enviarNotificacao(
                                '📖 AULA AMANHÃ',
                                `${aula.materia} amanhã às ${horaAula}`,
                                'info'
                            );
                            this._notifiedTasks.add(`${classId}_amanha`);
                            notificacoesEnviadas++;
                            console.log(`[TaskNotifier] 📢 Aula amanhã: ${aula.materia}`);
                        }
                    }
                });
            });

            if (notificacoesEnviadas > 0) {
                console.log(`[TaskNotifier] ✅ ${notificacoesEnviadas} notificações de aulas enviadas`);
            }

        } catch (error) {
            console.error('[TaskNotifier] Erro ao verificar aulas:', error);
        }
    },

    /**
     * 3️⃣ VERIFICA EVENTOS DO CALENDÁRIO
     */
    verificarEventos() {
        try {
            const userId = this._usuarioAtual.id;
            const eventsKey = `${userId}_calendarEvents`;
            const eventsData = localStorage.getItem(eventsKey);
            
            if (!eventsData) {
                console.log('[TaskNotifier] 📭 Nenhum evento encontrado');
                return;
            }

            const events = JSON.parse(eventsData);
            const agora = new Date();
            let notificacoesEnviadas = 0;

            events.forEach(evento => {
                if (!evento.day || !evento.month || !evento.year) return;

                const dataEvento = new Date(evento.year, evento.month, evento.day);
                const diffHoras = (dataEvento - agora) / (1000 * 60 * 60);
                const diffDias = diffHoras / 24;
                const eventId = evento.id;
                const tituloEvento = evento.title || 'Evento';

                // ========================================
                // 🔥 EVENTO HOJE
                // ========================================
                if (diffDias >= 0 && diffDias < 1 && !this._notifiedTasks.has(`${eventId}_hoje`)) {
                    const horaEvento = evento.time || '';
                    this._enviarNotificacao(
                        '📅 EVENTO HOJE!',
                        `"${tituloEvento}" acontece hoje ${horaEvento ? 'às ' + horaEvento : ''}`,
                        'warning'
                    );
                    this._notifiedTasks.add(`${eventId}_hoje`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 Evento hoje: ${tituloEvento}`);
                }

                // ========================================
                // 🔥 EVENTO AMANHÃ
                // ========================================
                else if (diffDias >= 0.8 && diffDias <= 1.2 && !this._notifiedTasks.has(`${eventId}_amanha`)) {
                    this._enviarNotificacao(
                        '📅 EVENTO AMANHÃ',
                        `"${tituloEvento}" acontece amanhã!`,
                        'info'
                    );
                    this._notifiedTasks.add(`${eventId}_amanha`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 Evento amanhã: ${tituloEvento}`);
                }

                // ========================================
                // 🔥 EVENTO EM 3 DIAS
                // ========================================
                else if (diffDias >= 2.5 && diffDias <= 3.5 && !this._notifiedTasks.has(`${eventId}_3dias`)) {
                    this._enviarNotificacao(
                        '📅 EVENTO EM 3 DIAS',
                        `"${tituloEvento}" acontece em 3 dias. Prepare-se!`,
                        'info'
                    );
                    this._notifiedTasks.add(`${eventId}_3dias`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 Evento em 3 dias: ${tituloEvento}`);
                }

                // ========================================
                // 🔥 EVENTO EM 7 DIAS (1 semana)
                // ========================================
                else if (diffDias >= 6.5 && diffDias <= 7.5 && !this._notifiedTasks.has(`${eventId}_7dias`)) {
                    this._enviarNotificacao(
                        '📅 EVENTO EM 1 SEMANA',
                        `"${tituloEvento}" acontece em 1 semana. Planeje-se!`,
                        'info'
                    );
                    this._notifiedTasks.add(`${eventId}_7dias`);
                    notificacoesEnviadas++;
                    console.log(`[TaskNotifier] 📢 Evento em 1 semana: ${tituloEvento}`);
                }
            });

            if (notificacoesEnviadas > 0) {
                console.log(`[TaskNotifier] ✅ ${notificacoesEnviadas} notificações de eventos enviadas`);
            }

        } catch (error) {
            console.error('[TaskNotifier] Erro ao verificar eventos:', error);
        }
    },

    /**
     * 4️⃣ VERIFICA HORAS DE ESTUDO (Meta diária)
     */
    verificarHorasEstudo() {
        try {
            // Calcula horas estudadas hoje
            const hoje = new Date().toDateString();
            const horasEstudadas = this._calcularHorasEstudoHoje();

            // Meta diária (configurável)
            const META_DIARIA = 2; // 2 horas por dia

            if (horasEstudadas >= META_DIARIA) {
                // Meta alcançada - notifica uma vez por dia
                const hojeStr = hoje.replace(/\s/g, '_');
                if (!this._notifiedTasks.has(`meta_${hojeStr}`)) {
                    this._enviarNotificacao(
                        '🎉 META DE ESTUDO ALCANÇADA!',
                        `Você estudou ${horasEstudadas}h hoje. Continue assim! 💪`,
                        'success'
                    );
                    this._notifiedTasks.add(`meta_${hojeStr}`);
                    console.log(`[TaskNotifier] 📢 Meta alcançada: ${horasEstudadas}h`);
                }
            } else if (horasEstudadas > 0 && horasEstudadas < META_DIARIA) {
                // Aviso de que está perto da meta
                const falta = META_DIARIA - horasEstudadas;
                if (falta <= 0.5 && !this._notifiedTasks.has(`quase_${hoje.replace(/\s/g, '_')}`)) {
                    this._enviarNotificacao(
                        '⏳ QUASE NA META!',
                        `Faltam apenas ${falta}h para bater a meta de estudo de hoje.`,
                        'info'
                    );
                    this._notifiedTasks.add(`quase_${hoje.replace(/\s/g, '_')}`);
                    console.log(`[TaskNotifier] 📢 Quase na meta: ${horasEstudadas}h`);
                }
            }

        } catch (error) {
            console.error('[TaskNotifier] Erro ao verificar horas de estudo:', error);
        }
    },

    /**
     * Calcula horas estudadas hoje
     */
    _calcularHorasEstudoHoje() {
        try {
            let horas = 0;
            const userId = this._usuarioAtual.id;
            
            // Busca tarefas concluídas hoje
            const tasksKey = `${userId}_tasks`;
            const tasksData = localStorage.getItem(tasksKey);
            if (tasksData) {
                const tasks = JSON.parse(tasksData);
                const hoje = new Date().toDateString();
                
                tasks.forEach(t => {
                    if (t.completed && t.dataConclusao) {
                        const dataConclusao = new Date(t.dataConclusao);
                        if (dataConclusao.toDateString() === hoje) {
                            horas += 0.5; // Cada tarefa = 30 min
                        }
                    }
                });
            }

            // Busca eventos de aula hoje
            const eventsKey = `${userId}_calendarEvents`;
            const eventsData = localStorage.getItem(eventsKey);
            if (eventsData) {
                const events = JSON.parse(eventsData);
                const hoje = new Date();
                
                events.forEach(e => {
                    if (e.type === 'aula') {
                        const dataEvento = new Date(e.year, e.month, e.day);
                        if (dataEvento.toDateString() === hoje.toDateString()) {
                            horas += 1.5; // Cada aula = 1.5h
                        }
                    }
                });
            }

            return Math.round(horas * 10) / 10;

        } catch (error) {
            console.error('[TaskNotifier] Erro ao calcular horas:', error);
            return 0;
        }
    },

    /**
     * Envia notificação (com fallback para diferentes métodos)
     */
    _enviarNotificacao(titulo, mensagem, tipo = 'info') {
        // Verifica se o PC Notification está disponível
        if (window.PcNotification) {
            window.PcNotification.sendLocalNotification(titulo, mensagem);
            return;
        }

        // Fallback: Notification API
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const notification = new Notification(titulo, {
                    body: mensagem,
                    icon: '/icons/icon-192x192.png',
                    tag: `notif_${Date.now()}`,
                    requireInteraction: true
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                setTimeout(() => notification.close(), 10000);
                return;
            } catch (e) {
                console.warn('[TaskNotifier] Fallback Notification API falhou:', e);
            }
        }

        // Último fallback: console e alert
        console.log(`[TaskNotifier] 📢 ${titulo}: ${mensagem}`);
        
        // Mostra no DOM se disponível
        if (document.querySelector('.toast')) {
            const toast = document.querySelector('.toast');
            const toastSpan = toast.querySelector('span');
            if (toastSpan) {
                toastSpan.textContent = `${titulo}: ${mensagem}`;
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 5000);
            }
        }
    },

    /**
     * Limpa histórico de notificações
     */
    limparHistorico() {
        this._notifiedTasks.clear();
        console.log('[TaskNotifier] 🧹 Histórico limpo');
    },

    /**
     * Para o monitoramento
     */
    stop() {
        if (this._checkInterval) {
            clearInterval(this._checkInterval);
            this._checkInterval = null;
        }
        this._isRunning = false;
        console.log('[TaskNotifier] ⏹️ Monitoramento parado');
    },

    /**
     * Reinicia o monitoramento
     */
    restart() {
        this.stop();
        setTimeout(() => {
            this.limparHistorico();
            this.start();
        }, 500);
    }
};

// EXPORTA GLOBALMENTE
window.TaskNotifier = TaskNotifier;

// INICIALIZA AUTOMATICAMENTE
document.addEventListener('DOMContentLoaded', () => {
    // Aguarda o PcNotification iniciar
    setTimeout(() => {
        TaskNotifier.start();
    }, 3000);
});

// Listener para quando o usuário logar
window.addEventListener('autoLoginSuccess', () => {
    setTimeout(() => {
        TaskNotifier.restart();
    }, 1000);
});

console.log('📢 TaskNotifier COMPLETO carregado!');