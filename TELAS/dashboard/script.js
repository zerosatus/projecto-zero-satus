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
        
        const welcomeTitle = document.querySelector('.header h1');
        const userNameDisplay = document.getElementById('userNameDisplay');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        if (userNameDisplay && usuarioAtual.nome) {
            userNameDisplay.textContent = usuarioAtual.nome;
        }
        if (userName && usuarioAtual.nome) {
            userName.textContent = usuarioAtual.nome;
        }
        if (userAvatar && usuarioAtual.nome) {
            const iniciais = usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase();
            userAvatar.textContent = iniciais || usuarioAtual.nome.charAt(0).toUpperCase();
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
        'história': 'fa-landmark', 'historia': 'fa-landmark',
        'química': 'fa-flask', 'quimica': 'fa-flask',
        'biologia': 'fa-leaf', 'inglês': 'fa-language', 'ingles': 'fa-language',
        'geografia': 'fa-globe'
    };
    const lower = disciplina?.toLowerCase()?.trim() || '';
    return mapa[lower] || 'fa-book';
}

function getCorDisciplina(disciplina) {
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
        barChart.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Adicione tarefas com notas para ver o gráfico</p>';
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
        const barItem = document.createElement('div');
        barItem.className = 'bar-item';
        barItem.innerHTML = `
            <div class="bar-icon" style="background: ${disciplina.cor}20; color: ${disciplina.cor};">
                <i class="fas ${disciplina.icone}"></i>
            </div>
            <div class="bar-container">
                <div class="bar-fill" style="width: ${Math.min(100, disciplina.media * 10)}%; background: ${disciplina.cor};"></div>
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
            cor: '#10b981',
            data: new Date(tarefa.dataCriacao || Date.now())
        });
    });

    (anotacoes || []).slice(0, 2).forEach(anotacao => {
        atividades.push({
            titulo: anotacao.title || anotacao.titulo,
            descricao: 'Anotação atualizada',
            icone: 'fa-file-lines',
            cor: '#9333ea',
            data: new Date(anotacao.date || anotacao.dataModificacao || Date.now())
        });
    });

    (eventos || []).slice(0, 2).forEach(evento => {
        atividades.push({
            titulo: evento.title,
            descricao: `Evento ${evento.type}`,
            icone: 'fa-calendar',
            cor: '#3b82f6',
            data: new Date(evento.date || `${evento.year}-${evento.month + 1}-${evento.day}`)
        });
    });

    atividades.sort((a, b) => b.data - a.data);
    const recentes = atividades.slice(0, 3);

    activityList.innerHTML = '';
    if (recentes.length === 0) {
        activityList.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Nenhuma atividade recente</p>';
        return;
    }

    recentes.forEach(atividade => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon" style="background: ${atividade.cor}20; color: ${atividade.cor};">
                <i class="fas ${atividade.icone}"></i>
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
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

setInterval(() => {
    carregarTodosDados();
    console.log('Dashboard atualizado');
}, 30000);

console.log('%c📊 Dashboard - Tema Roxo Escuro', 'color: #9333ea; font-size: 20px; font-weight: bold;');