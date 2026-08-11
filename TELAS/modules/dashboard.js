// ============================================
// modules/dashboard.js - DASHBOARD COMPLETO
// ============================================

class DashboardModule {
    constructor(app) {
        this.app = app;
        this.name = 'dashboard';
        console.log('[Dashboard] 📊 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Dashboard] 📊 Renderizando...');
        
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.calendarEvents = data.calendarEvents || [];
        this.weeklySchedule = data.weeklySchedule || {};
        this.timeSlots = data.timeSlots || [];
        this.notifications = data.notifications || [];
        this.disciplinas = data.disciplinas || [];
        this.profile = data.profile || {};
        
        // Atualizar nome do usuário no header
        this.atualizarNomeUsuario();
        
        this.renderStats();
        this.renderChart();
        this.renderActivities();
        this.updateBadge();
        this.setupEvents();
    }
    
    // ============================================
    // ATUALIZAR NOME DO USUÁRIO
    // ============================================
    atualizarNomeUsuario() {
        const profile = this.profile || this.app.user || {};
        const nome = profile.nome || profile.displayName || 'Usuário';
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (userNameDisplay) {
            userNameDisplay.textContent = nome;
        }
    }
    
    // ============================================
    // STATS CARDS
    // ============================================
    renderStats() {
        const disciplinas = new Set();
        
        // Disciplinas das tarefas
        this.tasks.forEach(t => {
            if (t.subject || t.disciplina) {
                disciplinas.add((t.subject || t.disciplina).toLowerCase());
            }
        });
        
        // Disciplinas do horário
        if (this.weeklySchedule) {
            Object.values(this.weeklySchedule).forEach(day => {
                if (Array.isArray(day)) {
                    day.forEach(c => {
                        if (c && c.materia) {
                            disciplinas.add(c.materia.toLowerCase());
                        }
                    });
                }
            });
        }
        
        const pendentes = this.tasks.filter(t => !t.completed).length;
        const horasEstudo = this.calcularHorasEstudo();
        const media = this.calcularMedia();
        
        const disciplinasEl = document.getElementById('disciplinasCount');
        const pendentesEl = document.getElementById('pendentesCount');
        const horasEl = document.getElementById('horasCount');
        const mediaEl = document.getElementById('mediaCount');
        
        if (disciplinasEl) this.animarNumero(disciplinasEl, disciplinas.size || 0);
        if (pendentesEl) this.animarNumero(pendentesEl, pendentes);
        if (horasEl) this.animarNumero(horasEl, Math.floor(horasEstudo));
        if (mediaEl) this.animarNumero(mediaEl, media.toFixed(1));
    }
    
    animarNumero(elemento, valorFinal) {
        if (!elemento) return;
        const valorInicial = 0;
        const duracao = 500;
        const inicio = performance.now();
        
        const animar = (tempo) => {
            const progresso = Math.min((tempo - inicio) / duracao, 1);
            const valorAtual = valorInicial + (valorFinal - valorInicial) * progresso;
            
            if (typeof valorFinal === 'string' && valorFinal.includes('.')) {
                elemento.textContent = valorAtual.toFixed(1);
            } else {
                elemento.textContent = Math.floor(valorAtual);
            }
            
            if (progresso < 1) {
                requestAnimationFrame(animar);
            } else {
                elemento.textContent = valorFinal;
            }
        };
        
        requestAnimationFrame(animar);
    }
    
    calcularHorasEstudo() {
        let horas = 0;
        horas += this.calendarEvents.filter(e => e.type === 'aula').length * 2;
        horas += this.tasks.filter(t => t.completed).length * 1.5;
        return horas || 0;
    }
    
    calcularMedia() {
        const notas = this.tasks.filter(t => t.nota && typeof t.nota === 'number');
        if (notas.length === 0) return 0;
        return notas.reduce((acc, t) => acc + t.nota, 0) / notas.length;
    }
    
    // ============================================
    // PERFORMANCE CHART
    // ============================================
    renderChart() {
        const container = document.getElementById('barChart');
        if (!container) return;
        
        const disciplinasMap = new Map();
        
        this.tasks.forEach(t => {
            const disc = t.subject || t.disciplina;
            if (disc && t.nota && typeof t.nota === 'number') {
                const key = disc.toLowerCase();
                if (!disciplinasMap.has(key)) {
                    disciplinasMap.set(key, { 
                        nome: disc, 
                        soma: 0, 
                        count: 0,
                        cor: this.getCorDisciplina(disc),
                        icone: this.getIconeDisciplina(disc)
                    });
                }
                const data = disciplinasMap.get(key);
                data.soma += t.nota;
                data.count++;
            }
        });
        
        if (disciplinasMap.size === 0) {
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;color:var(--text-secondary);text-align:center;gap:8px;">
                    <i class="fas fa-chart-simple" style="font-size:32px;opacity:0.3;"></i>
                    <p>Adicione tarefas com notas para ver o gráfico</p>
                </div>
            `;
            return;
        }
        
        const disciplinas = Array.from(disciplinasMap.entries()).map(([_, data]) => ({
            nome: data.nome,
            icone: data.icone,
            cor: data.cor,
            media: data.count > 0 ? (data.soma / data.count) : 0
        }));
        
        disciplinas.sort((a, b) => b.media - a.media);
        const topDisciplinas = disciplinas.slice(0, 4);
        
        container.innerHTML = '';
        
        topDisciplinas.forEach(disc => {
            const barItem = document.createElement('div');
            barItem.className = 'bar-item';
            const percentual = Math.min(100, (disc.media / 10) * 100);
            
            barItem.innerHTML = `
                <div class="bar-icon" style="background: ${disc.cor}20; color: ${disc.cor};">
                    <i class="fas ${disc.icone}"></i>
                </div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentual}%; background: ${disc.cor};"></div>
                </div>
                <span class="bar-value">${disc.media.toFixed(1)}</span>
            `;
            container.appendChild(barItem);
        });
    }
    
    // ============================================
    // ACTIVITIES
    // ============================================
    renderActivities() {
        const container = document.getElementById('activityList');
        if (!container) return;
        
        const atividades = [];
        
        // Tarefas recentes
        this.tasks.slice(0, 2).forEach(t => {
            atividades.push({
                titulo: t.title || t.nome || 'Tarefa',
                descricao: t.completed ? 'Concluída' : 'Pendente',
                icone: t.completed ? 'fa-check-circle' : 'fa-clipboard-list',
                cor: t.completed ? '#10b981' : '#f59e0b',
                data: new Date(t.dataCriacao || t.created_at || Date.now())
            });
        });
        
        // Anotações recentes
        this.notes.slice(0, 2).forEach(n => {
            atividades.push({
                titulo: n.title || n.titulo || 'Anotação',
                descricao: 'Anotação atualizada',
                icone: 'fa-file-lines',
                cor: '#9333ea',
                data: new Date(n.dataModificacao || n.updated_at || n.date || Date.now())
            });
        });
        
        // Eventos recentes
        this.calendarEvents.slice(0, 2).forEach(e => {
            atividades.push({
                titulo: e.title || 'Evento',
                descricao: `Evento ${e.type || 'geral'}`,
                icone: 'fa-calendar',
                cor: '#3b82f6',
                data: new Date(e.date || e.dataCriacao || Date.now())
            });
        });
        
        atividades.sort((a, b) => b.data - a.data);
        const recentes = atividades.slice(0, 4);
        
        if (recentes.length === 0) {
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;color:var(--text-secondary);text-align:center;gap:8px;">
                    <i class="fas fa-clock" style="font-size:28px;opacity:0.3;"></i>
                    <p>Nenhuma atividade recente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentes.map(a => `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${a.cor}20; color: ${a.cor};">
                    <i class="fas ${a.icone}"></i>
                </div>
                <div class="activity-text">
                    <h4>${this.app.escapeHtml(a.titulo)}</h4>
                    <p>${a.descricao} • ${this.formatarDataRelativa(a.data)}</p>
                </div>
            </div>
        `).join('');
    }
    
    // ============================================
    // HELPERS
    // ============================================
    getCorDisciplina(disciplina) {
        const mapa = {
            'matemática': '#9333ea', 'matematica': '#9333ea',
            'física': '#f59e0b', 'fisica': '#f59e0b',
            'português': '#3b82f6', 'portugues': '#3b82f6',
            'história': '#ef4444', 'historia': '#ef4444',
            'química': '#10b981', 'quimica': '#10b981',
            'biologia': '#eab308', 'inglês': '#64748b', 'ingles': '#64748b',
            'geografia': '#14b8a6'
        };
        const lower = disciplina?.toLowerCase()?.trim() || '';
        return mapa[lower] || '#95a5a6';
    }
    
    getIconeDisciplina(disciplina) {
        const mapa = {
            'matemática': 'fa-calculator', 'matematica': 'fa-calculator',
            'física': 'fa-flask', 'fisica': 'fa-flask',
            'português': 'fa-pen-nib', 'portugues': 'fa-pen-nib',
            'história': 'fa-landmark', 'historia': 'fa-landmark',
            'química': 'fa-flask', 'quimica': 'fa-flask',
            'biologia': 'fa-leaf', 'inglês': 'fa-language', 'ingles': 'fa-language',
            'geografia': 'fa-globe'
        };
        const lower = disciplina?.toLowerCase()?.trim() || '';
        return mapa[lower] || 'fa-book';
    }
    
    formatarDataRelativa(data) {
        if (!data || isNaN(data.getTime())) return 'agora';
        const agora = new Date();
        const diffMs = agora - data;
        const diffMin = Math.floor(diffMs / 60000);
        const diffHoras = Math.floor(diffMs / 3600000);
        const diffDias = Math.floor(diffMs / 86400000);
        
        if (diffMin < 1) return 'agora mesmo';
        if (diffMin < 60) return `${diffMin} min atrás`;
        if (diffHoras < 24) return `${diffHoras} h atrás`;
        if (diffDias === 1) return 'ontem';
        if (diffDias < 7) return `${diffDias} dias atrás`;
        return data.toLocaleDateString('pt-BR');
    }
    
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    setupEvents() {
        window.addEventListener('cloudDataLoaded', () => {
            this.tasks = this.app.data.tasks || [];
            this.notes = this.app.data.notes || [];
            this.calendarEvents = this.app.data.calendarEvents || [];
            this.weeklySchedule = this.app.data.weeklySchedule || {};
            this.timeSlots = this.app.data.timeSlots || [];
            this.notifications = this.app.data.notifications || [];
            this.disciplinas = this.app.data.disciplinas || [];
            this.profile = this.app.data.profile || {};
            
            this.atualizarNomeUsuario();
            this.renderStats();
            this.renderChart();
            this.renderActivities();
            this.updateBadge();
        });
    }
}

console.log('[Dashboard] ✅ Módulo carregado!');