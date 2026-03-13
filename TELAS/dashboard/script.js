// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
// ===== DETECTAR MUDANÇAS =====
window.addEventListener('storage', (e) => {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    if (e.key === `tarefas_${usuario.email}` ||
        e.key === `anotacoes_${usuario.email}` ||
        e.key === `eventos_${usuario.email}` ||
        e.key === 'sync_notification') {
        
        console.log('🔄 Dados atualizados em outra aba');
        carregarTodosDados();
    }
});
// ============================================
// VERIFICAÇÃO DE LOGIN E CARREGAMENTO DE DADOS
// ============================================
window.addEventListener('DOMContentLoaded', () => {
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
        
        // Carregar dados de todas as fontes
        carregarTodosDados();
        
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
    atualizarDashboard();
}

// ============================================
// CARREGAR TAREFAS DO LOCALSTORAGE
// ============================================
function carregarTarefas() {
    if (!usuarioAtual) return;
    
    const storageKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(storageKey);
    
    if (tarefasSalvas) {
        tarefas = JSON.parse(tarefasSalvas);
    } else {
        // Dados de exemplo para primeiro acesso
        tarefas = [
            { 
                id: gerarId(), 
                nome: 'Resolver exercícios de Matemática', 
                disciplina: 'matematica', 
                prioridade: 'alta', 
                prazo: '25/07/2024', 
                concluida: false,
                dataCriacao: new Date().toISOString()
            },
            { 
                id: gerarId(), 
                nome: 'Fazer resumo de Português', 
                disciplina: 'portugues', 
                prioridade: 'media', 
                prazo: '26/07/2024', 
                concluida: true,
                dataCriacao: new Date(Date.now() - 86400000).toISOString()
            },
            { 
                id: gerarId(), 
                nome: 'Estudar para prova de Física', 
                disciplina: 'fisica', 
                prioridade: 'alta', 
                prazo: '28/07/2024', 
                concluida: false,
                dataCriacao: new Date().toISOString()
            }
        ];
    }
}

// ============================================
// CARREGAR ANOTAÇÕES DO LOCALSTORAGE
// ============================================
function carregarAnotacoes() {
    if (!usuarioAtual) return;
    
    const storageKey = `anotacoes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    
    if (anotacoesSalvas) {
        anotacoes = JSON.parse(anotacoesSalvas);
    } else {
        // Dados de exemplo
        anotacoes = [
            { 
                id: gerarId(), 
                titulo: 'Introdução à Física Quântica', 
                dataModificacao: new Date().toISOString() 
            },
            { 
                id: gerarId(), 
                titulo: 'Cálculo Diferencial', 
                dataModificacao: new Date(Date.now() - 86400000).toISOString() 
            }
        ];
    }
}

// ============================================
// CARREGAR EVENTOS DO LOCALSTORAGE
// ============================================
function carregarEventos() {
    if (!usuarioAtual) return;
    
    const storageKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvos = localStorage.getItem(storageKey);
    
    if (eventosSalvos) {
        eventos = JSON.parse(eventosSalvos);
    } else {
        // Dados de exemplo
        eventos = [
            { 
                id: gerarId(), 
                title: 'Aula de Física', 
                type: 'aula', 
                day: new Date().getDate(),
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                time: '15:00'
            },
            { 
                id: gerarId(), 
                title: 'Prova de Matemática', 
                type: 'prova', 
                day: new Date().getDate() + 2,
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                time: '11:00'
            }
        ];
    }
}

// ============================================
// ATUALIZAR DASHBOARD COM DADOS REAIS
// ============================================
function atualizarDashboard() {
    atualizarCardsEstatisticas();
    atualizarGraficoDesempenho();
    atualizarAtividadesRecentes();
    atualizarLinksAcessoRapido();
}

// ============================================
// ATUALIZAR CARDS DE ESTATÍSTICAS
// ============================================
function atualizarCardsEstatisticas() {
    // Contar disciplinas únicas das tarefas
    const disciplinasSet = new Set(tarefas.map(t => t.disciplina).filter(Boolean));
    const numDisciplinas = disciplinasSet.size || 4; // Fallback para 4 se não houver dados
    
    // Contar tarefas pendentes
    const tarefasPendentes = tarefas.filter(t => !t.concluida).length;
    
    // Calcular horas estudadas (simulado baseado em eventos e tarefas)
    const horasEstudadas = calcularHorasEstudadas();
    
    // Calcular média geral (baseado em notas fictícias ou dados reais)
    const mediaGeral = calcularMediaGeral();
    
    // Atualizar cards
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
    // Simular horas baseado em eventos de aula e tarefas concluídas
    const horasEventos = eventos.filter(e => e.type === 'aula').length * 2; // 2h por aula
    const horasTarefas = tarefas.filter(t => t.concluida).length * 1.5; // 1.5h por tarefa
    return horasEventos + horasTarefas || 45; // Fallback
}

function calcularMediaGeral() {
    // Simular médias por disciplina (você pode expandir isso depois)
    const medias = [8.5, 7.0, 9.0, 6.0];
    return medias.reduce((a, b) => a + b, 0) / medias.length;
}

// ============================================
// ATUALIZAR GRÁFICO DE DESEMPENHO
// ============================================
function atualizarGraficoDesempenho() {
    // Mapear disciplinas e suas médias
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

// ============================================
// ATUALIZAR ATIVIDADES RECENTES
// ============================================
function atualizarAtividadesRecentes() {
    const activityList = document.querySelector('.activity-list');
    if (!activityList) return;
    
    // Coletar atividades recentes de todas as fontes
    const atividades = [];
    
    // Atividades de tarefas
    tarefas.slice(0, 3).forEach(tarefa => {
        atividades.push({
            titulo: tarefa.nome,
            descricao: tarefa.concluida ? 'Concluída' : 'Pendente',
            icone: tarefa.concluida ? 'fa-check-circle' : 'fa-clipboard-list',
            cor: tarefa.concluida ? '#10B981' : '#F59E0B',
            data: new Date(tarefa.dataCriacao || Date.now())
        });
    });
    
    // Atividades de anotações
    anotacoes.slice(0, 3).forEach(anotacao => {
        atividades.push({
            titulo: anotacao.titulo,
            descricao: 'Anotação atualizada',
            icone: 'fa-file-lines',
            cor: '#8B5CF6',
            data: new Date(anotacao.dataModificacao || Date.now())
        });
    });
    
    // Atividades de eventos
    eventos.slice(0, 3).forEach(evento => {
        atividades.push({
            titulo: evento.title,
            descricao: `Evento ${evento.type}`,
            icone: 'fa-calendar',
            cor: '#3B82F6',
            data: new Date(evento.year, evento.month, evento.day)
        });
    });
    
    // Ordenar por data (mais recentes primeiro)
    atividades.sort((a, b) => b.data - a.data);
    
    // Pegar as 3 mais recentes
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
                <h4>${atividade.titulo}</h4>
                <p>${atividade.descricao} • ${formatarDataRelativa(atividade.data)}</p>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
    
    // Se não houver atividades, mostrar mensagem
    if (recentes.length === 0) {
        activityList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nenhuma atividade recente</p>';
    }
}

// ============================================
// ATUALIZAR LINKS DE ACESSO RÁPIDO
// ============================================
function atualizarLinksAcessoRapido() {
    // Adicionar contadores aos links
    const tarefasPendentes = tarefas.filter(t => !t.concluida).length;
    const eventosHoje = eventos.filter(e => {
        const hoje = new Date();
        return e.day === hoje.getDate() && 
               e.month === hoje.getMonth() && 
               e.year === hoje.getFullYear();
    }).length;
    
    // Encontrar e atualizar badges se existirem (opcional)
    // Você pode adicionar badges aos links se quiser
}

// ============================================
// UTILITÁRIOS
// ============================================
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
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

// ============================================
// DESTACAR MENU ITEM ATIVO
// ============================================
const menuItems = document.querySelectorAll('.menu-item');

menuItems.forEach(item => {
    item.addEventListener('click', function() {
        menuItems.forEach(link => link.classList.remove('active'));
        this.classList.add('active');
    });
});

// ============================================
// FUNÇÃO DE LOGOUT
// ============================================
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ============================================
// ANIMAÇÃO DOS BOTÕES DE ÍCONE
// ============================================
const iconBtns = document.querySelectorAll('.icon-btn');
iconBtns.forEach(btn => {
    btn.addEventListener('click', function() {
        this.style.transform = 'scale(0.95)';
        setTimeout(() => {
            this.style.transform = '';
        }, 150);
    });
});

// ============================================
// ATUALIZAÇÃO PERIÓDICA (a cada 30 segundos)
// ============================================
setInterval(() => {
    carregarTodosDados();
    console.log('Dashboard atualizado');
}, 30000);

console.log('%c📊 Dashboard Dinâmico', 'color: #8B5CF6; font-size: 20px; font-weight: bold;');
console.log('%cSistema carregado com sucesso!', 'color: #10B981; font-size: 14px;');
