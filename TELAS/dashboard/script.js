let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let weeklySchedule = {};

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        const welcomeTitle = document.querySelector('.header h2');
        const userNameDisplay = document.getElementById('userNameDisplay');
        if (welcomeTitle && usuarioAtual.nome && userNameDisplay) {
            userNameDisplay.textContent = usuarioAtual.nome;
        }
        
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarTodosDados();
        
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Dashboard] Dados atualizados do Firebase');
            carregarTodosDados();
            atualizarDashboard();
        });
        
        window.addEventListener('storage', (e) => {
            if (usuarioAtual && e.key && (e.key.includes(usuarioAtual.email) || e.key === 'sync_notification')) {
                console.log('🔄 Dados atualizados em outra aba');
                carregarTodosDados();
                atualizarDashboard();
            }
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function carregarTodosDados() {
    carregarTarefas();
    carregarAnotacoes();
    carregarEventos();
    carregarHorario();
    atualizarDashboard();
}

function carregarHorario() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('weeklySchedule', null);
        if (cached !== null) {
            weeklySchedule = cached;
            console.log('[Dashboard] Horário carregado do CacheManager');
            return;
        }
    }
    
    const storageKey = `weeklySchedule_${usuarioAtual.email}`;
    const scheduleSalvo = localStorage.getItem(storageKey);
    weeklySchedule = scheduleSalvo ? JSON.parse(scheduleSalvo) : { Seg: [], Ter: [], Qua: [], Qui: [], Sex: [] };
}

function carregarTarefas() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('tasks', null);
        if (cached !== null) {
            tarefas = cached;
            console.log('[Dashboard] Tarefas carregadas do CacheManager:', tarefas.length);
            return;
        }
    }
    
    const storageKey = `tasks_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
}

function carregarAnotacoes() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null) {
            anotacoes = cached;
            return;
        }
    }
    
    const storageKey = `notes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];
}

function carregarEventos() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('calendarEvents', null);
        if (cached !== null) {
            eventos = cached;
            return;
        }
    }
    
    const storageKey = `calendarEvents_${usuarioAtual.email}`;
    const eventosSalvas = localStorage.getItem(storageKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
}

function atualizarDashboard() {
    atualizarCardsEstatisticas();
    atualizarGraficoDesempenho();
    atualizarAtividadesRecentes();
}

function atualizarCardsEstatisticas() {
    const disciplinasSet = new Set();
    
    tarefas.forEach(t => {
        if (t.subject || t.disciplina) disciplinasSet.add((t.subject || t.disciplina).toLowerCase());
    });
    
    if (weeklySchedule) {
        Object.values(weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => {
                    if (c && c.materia) disciplinasSet.add(c.materia.toLowerCase());
                });
            }
        });
    }
    
    const numDisciplinas = disciplinasSet.size || 0;
    const tarefasPendentes = tarefas.filter(t => !t.completed).length;
    const horasEstudadas = calcularHorasEstudadas();
    const mediaGeral = calcularMediaGeral();
    
    const disciplinasEl = document.getElementById('disciplinasCount');
    const pendentesEl = document.getElementById('pendentesCount');
    const horasEl = document.getElementById('horasCount');
    const mediaEl = document.getElementById('mediaCount');
    
    if (disciplinasEl) disciplinasEl.textContent = numDisciplinas;
    if (pendentesEl) pendentesEl.textContent = tarefasPendentes;
    if (horasEl) horasEl.textContent = horasEstudadas;
    if (mediaEl) mediaEl.textContent = mediaGeral.toFixed(1);
}

function calcularHorasEstudadas() {
    let horas = 0;
    horas += (eventos || []).filter(e => e.type === 'aula').length * 2;
    horas += (tarefas || []).filter(t => t.completed).length * 1.5;
    return horas || 0;
}

function calcularMediaGeral() {
    const notas = [];
    tarefas.forEach(t => {
        if (t.nota && typeof t.nota === 'number') notas.push(t.nota);
    });
    
    if (notas.length === 0) return 0;
    return notas.reduce((a, b) => a + b, 0) / notas.length;
}

function getIconeDisciplina(disciplina) {
    const mapa = {
        'matemática': 'fa-calculator', 'matematica': 'fa-calculator',
        'física': 'fa-flask', 'fisica': 'fa-flask',
        'português': 'fa-pen-nib', 'portugues': 'fa-pen-nib',
        'história': 'fa-code', 'historia': 'fa-code',
        'química': 'fa-flask', 'quimica': 'fa-flask',
        'biologia': 'fa-leaf', 'inglês': 'fa-language', 'ingles': 'fa-language',
        'geografia': 'fa-globe'
    };
    const lower = disciplina?.toLowerCase()?.trim() || '';
    return mapa[lower] || 'fa-book';
}

function getCorDisciplina(disciplina) {
    const mapa = {
        'matemática': '#9b59b6', 'matematica': '#9b59b6',
        'física': '#e67e22', 'fisica': '#e67e22',
        'português': '#3498db', 'portugues': '#3498db',
        'história': '#e74c3c', 'historia': '#e74c3c',
        'química': '#2ecc71', 'quimica': '#2ecc71',
        'biologia': '#f1c40f', 'inglês': '#34495e', 'ingles': '#34495e',
        'geografia': '#1abc9c'
    };
    const lower = disciplina?.toLowerCase()?.trim() || '';
    return mapa[lower] || '#95a5a6';
}

function atualizarGraficoDesempenho() {
    const disciplinasMap = new Map();
    
    tarefas.forEach(t => {
        const disc = t.subject || t.disciplina;
        if (disc) {
            const discLower = disc.toLowerCase();
            if (!disciplinasMap.has(discLower)) {
                disciplinasMap.set(discLower, { media: 0, count: 0, icone: getIconeDisciplina(disc), cor: getCorDisciplina(disc), nome: disc });
            }
            if (t.nota) {
                const data = disciplinasMap.get(discLower);
                data.media += t.nota;
                data.count++;
            }
        }
    });
    
    const barChart = document.getElementById('barChart');
    if (!barChart) return;
    
    if (disciplinasMap.size === 0) {
        barChart.innerHTML = '<div style="grid-column: span 4; text-align: center; padding: 40px; color: #888;">Adicione tarefas com notas para ver o gráfico</div>';
        return;
    }
    
    const disciplinas = Array.from(disciplinasMap.entries()).map(([_, data]) => ({
        nome: data.nome,
        icone: data.icone,
        cor: data.cor,
        media: data.count > 0 ? (data.media / data.count) : 0
    }));
    
    disciplinas.sort((a, b) => b.media - a.media);
    const topDisciplinas = disciplinas.slice(0, 4);
    
    barChart.innerHTML = '';
    topDisciplinas.forEach(disciplina => {
        const corBg = disciplina.cor === '#9b59b6' ? '#F3E8FF' : '#FEF3C7';
        const corIcon = disciplina.cor === '#9b59b6' ? '#8B5CF6' : '#F59E0B';
        
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        barItem.innerHTML = `
            <div class="bar-icon" style="background: ${corBg}; color: ${corIcon};">
                <i class="fa-solid ${disciplina.icone}"></i>
            </div>
            <div class="bar-container">
                <div class="bar-fill ${disciplina.cor === '#9b59b6' ? 'fill-purple' : 'fill-yellow'}" style="width: ${Math.min(100, disciplina.media * 10)}%;"></div>
            </div>
            <span class="bar-value">${disciplina.media.toFixed(1)}</span>
        `;
        barChart.appendChild(barItem);
    });
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

function atualizarAtividadesRecentes() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const atividades = [];
    
    (tarefas || []).slice(0, 2).forEach(tarefa => {
        atividades.push({
            titulo: tarefa.title || tarefa.nome,
            descricao: tarefa.completed ? 'Concluída' : 'Pendente',
            icone: tarefa.completed ? 'fa-check-circle' : 'fa-clipboard-list',
            cor: '#10B981',
            data: new Date(tarefa.dataCriacao || Date.now())
        });
    });
    
    (anotacoes || []).slice(0, 2).forEach(anotacao => {
        atividades.push({
            titulo: anotacao.title || anotacao.titulo,
            descricao: 'Anotação atualizada',
            icone: 'fa-file-lines',
            cor: '#8B5CF6',
            data: new Date(anotacao.date || anotacao.dataModificacao || Date.now())
        });
    });
    
    (eventos || []).slice(0, 2).forEach(evento => {
        atividades.push({
            titulo: evento.title,
            descricao: `Evento ${evento.type}`,
            icone: 'fa-calendar',
            cor: '#3B82F6',
            data: new Date(evento.date || `${evento.year}-${evento.month + 1}-${evento.day}`)
        });
    });
    
    atividades.sort((a, b) => b.data - a.data);
    const recentes = atividades.slice(0, 3);
    
    activityList.innerHTML = '';
    if (recentes.length === 0) {
        activityList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nenhuma atividade recente</p>';
        return;
    }
    
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
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
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