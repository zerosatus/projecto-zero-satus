// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let weeklySchedule = {};

// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        const welcomeTitle = document.querySelector('.header h2');
        if (welcomeTitle && usuarioAtual.nome) {
            welcomeTitle.textContent = `Bem-vindo, ${usuarioAtual.nome}!`;
        }
        
        // Iniciar sincronização
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarTodosDados();
        
        // Escutar mudanças do Firebase
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Dashboard] Dados atualizados do Firebase');
            carregarTodosDados();
            atualizarDashboard();
        });
        
        // Escutar mudanças no localStorage
        window.addEventListener('storage', (e) => {
            if (usuarioAtual && e.key && (e.key.includes(usuarioAtual.email) || e.key === 'sync_notification')) {
                console.log('🔄 Dados atualizados em outra aba');
                carregarTodosDados();
                atualizarDashboard();
            }
        });
        
    } catch (e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ============================================
// CARREGAR DADOS DE TODAS AS FONTES
// ============================================
function carregarTodosDados() {
    carregarTarefas();
    carregarAnotacoes();
    carregarEventos();
    carregarHorario();
    atualizarDashboard();
}

// ============================================
// CARREGAR HORÁRIO
// ============================================
function carregarHorario() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('weeklySchedule', null);
        if (cached) {
            weeklySchedule = cached;
            console.log('[Dashboard] Horário carregado do CacheManager');
            return;
        }
    }
    
    const storageKey = `weeklySchedule_${usuarioAtual.email}`;
    const scheduleSalvo = localStorage.getItem(storageKey);
    weeklySchedule = scheduleSalvo ? JSON.parse(scheduleSalvo) : {};
}

// ============================================
// CARREGAR TAREFAS
// ============================================
function carregarTarefas() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('tasks', null);
        if (cached) {
            tarefas = cached;
            console.log('[Dashboard] Tarefas carregadas do CacheManager:', tarefas.length);
            return;
        }
    }
    
    const storageKey = `tasks_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
}

// ============================================
// CARREGAR ANOTAÇÕES
// ============================================
function carregarAnotacoes() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached) {
            anotacoes = cached;
            return;
        }
    }
    
    const storageKey = `notes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];
}

// ============================================
// CARREGAR EVENTOS
// ============================================
function carregarEventos() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('calendarEvents', null);
        if (cached) {
            eventos = cached;
            return;
        }
    }
    
    const storageKey = `calendarEvents_${usuarioAtual.email}`;
    const eventosSalvas = localStorage.getItem(storageKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
}

// ============================================
// ATUALIZAR DASHBOARD
// ============================================
function atualizarDashboard() {
    atualizarCardsEstatisticas();
    atualizarGraficoDesempenho();
    atualizarAtividadesRecentes();
}

function atualizarCardsEstatisticas() {
    const disciplinasSet = new Set(tarefas.map(t => t.subject || t.disciplina).filter(Boolean));
    const numDisciplinas = disciplinasSet.size || Object.keys(weeklySchedule).reduce((acc, dia) => acc + weeklySchedule[dia].length, 0) || 4;
    const tarefasPendentes = tarefas.filter(t => !t.completed).length;
    const horasEstudadas = calcularHorasEstudadas();
    const mediaGeral = calcularMediaGeral();
    
    atualizarCard('Disciplinas', numDisciplinas);
    atualizarCard('Tarefas Pendentes', tarefasPendentes);
    atualizarCard('Horas Estudadas', horasEstudadas + 'h');
    atualizarCard('Média Geral', mediaGeral.toFixed(1));
}

function atualizarCard(titulo, valor) {
    const cards = document.querySelectorAll('.stat-card');
    cards.forEach(card => {
        const p = card.querySelector('p');
        if (p && p.textContent.includes(titulo)) {
            const h3 = card.querySelector('h3');
            if (h3) h3.textContent = valor;
        }
    });
}

function calcularHorasEstudadas() {
    const horasEventos = eventos.filter(e => e.type === 'aula').length * 2;
    const horasTarefas = tarefas.filter(t => t.completed).length * 1.5;
    return horasEventos + horasTarefas || 45;
}

function calcularMediaGeral() {
    const medias = [8.5, 7.0, 9.0, 6.0];
    return medias.reduce((a, b) => a + b, 0) / medias.length;
}

function atualizarGraficoDesempenho() {
    const disciplinas = [
        { nome: 'Matemática', icone: 'fa-calculator', cor: 'fill-purple', media: 8.5 },
        { nome: 'Física', icone: 'fa-flask', cor: 'fill-purple', media: 7.0 },
        { nome: 'Português', icone: 'fa-pen-nib', cor: 'fill-yellow', media: 9.0 },
        { nome: 'História', icone: 'fa-code', cor: 'fill-yellow', media: 6.0 }
    ];
    
    const barChart = document.querySelector('.bar-chart');
    if (!barChart) return;
    
    barChart.innerHTML = '';
    disciplinas.forEach(disciplina => {
        const corBg = disciplina.cor === 'fill-purple' ? '#F3E8FF' : '#FEF3C7';
        const corIcon = disciplina.cor === 'fill-purple' ? '#8B5CF6' : '#F59E0B';
        
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        barItem.innerHTML = `
            <div class="bar-icon" style="background: ${corBg}; color: ${corIcon};">
                <i class="fa-solid ${disciplina.icone}"></i>
            </div>
            <div class="bar-container">
                <div class="bar-fill ${disciplina.cor}" style="width: ${disciplina.media * 10}%;"></div>
            </div>
            <span class="bar-value">${disciplina.media}</span>
        `;
        barChart.appendChild(barItem);
    });
}

function atualizarAtividadesRecentes() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    const atividades = [];
    
    tarefas.slice(0, 2).forEach(tarefa => {
        atividades.push({
            titulo: tarefa.title || tarefa.nome,
            descricao: tarefa.completed ? 'Concluída' : 'Pendente',
            icone: tarefa.completed ? 'fa-check-circle' : 'fa-clipboard-list',
            cor: tarefa.completed ? '#10B981' : '#F59E0B',
            data: new Date(tarefa.dataCriacao || Date.now())
        });
    });
    
    anotacoes.slice(0, 2).forEach(anotacao => {
        atividades.push({
            titulo: anotacao.title,
            descricao: 'Anotação atualizada',
            icone: 'fa-file-lines',
            cor: '#8B5CF6',
            data: new Date(anotacao.date || Date.now())
        });
    });
    
    eventos.slice(0, 2).forEach(evento => {
        atividades.push({
            titulo: evento.title,
            descricao: `Evento ${evento.type}`,
            icone: 'fa-calendar',
            cor: '#3B82F6',
            data: new Date(evento.date || `${evento.year}-${evento.month+1}-${evento.day}`)
        });
    });
    
    atividades.sort((a, b) => b.data - a.data);
    const recentes = atividades.slice(0, 3);
    
    activityList.innerHTML = '';
    recentes.forEach(atividade => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon" style="background: ${atividade.cor}20; color: ${atividade.cor};">
                <i class="fa-solid ${atividade.icone}"></i>
            </div>
            <div class="activity-text">
                <h4>${escapeHtml(atividade.titulo)}</h4>
                <p>${atividade.descricao} • ${formatarDataRelativa(atividade.data)}</p>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
    
    if (recentes.length === 0) {
        activityList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nenhuma atividade recente</p>';
    }
}

function formatarDataRelativa(data) {
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

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

setInterval(() => {
    carregarTodosDados();
    console.log('Dashboard atualizado');
}, 30000);

console.log('%c📊 Dashboard Dinâmico', 'color: #8B5CF6; font-size: 20px; font-weight: bold;');