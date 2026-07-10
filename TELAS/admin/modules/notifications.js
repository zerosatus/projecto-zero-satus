// ==========================================
// modules/notifications.js - NOTIFICAÇÕES (MOCK)
// ==========================================
console.log('[Notif] 📬 Módulo de notificações carregado');

// 🔥 DADOS MOCKADOS (depois trocar por Supabase)
const mockNotificacoes = [
    {
        id: '1',
        tipo: 'broadcast',
        titulo: '🎉 Bem-vindos ao novo semestre!',
        mensagem: 'Olá, pessoal! Estamos muito felizes em receber todos vocês neste novo semestre. Preparem-se para uma jornada incrível de aprendizado!',
        icone: 'star',
        destino: 'Todos os usuários',
        canais: { inapp: true, email: true, push: false },
        autor: 'Jose Samisson',
        totalDestinatarios: 156,
        lidas: 128,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'enviada'
    },
    {
        id: '2',
        tipo: 'system',
        titulo: '⚠️ Manutenção programada',
        mensagem: 'O sistema ficará indisponível no dia 15/07 das 02:00 às 05:00 para manutenção preventiva. Pedimos desculpas pelo inconveniente.',
        icone: 'warning',
        destino: 'Todos os usuários',
        canais: { inapp: true, email: true, push: true },
        autor: 'Sistema',
        totalDestinatarios: 156,
        lidas: 142,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        status: 'enviada'
    },
    {
        id: '3',
        tipo: 'segmented',
        titulo: '📚 Nova tarefa de Matemática disponível!',
        mensagem: 'Uma nova tarefa sobre Equações de 2º Grau foi adicionada à disciplina de Matemática. Não perca o prazo: 20/07!',
        icone: 'bell',
        destino: 'Disciplina: Matemática',
        canais: { inapp: true, email: false, push: true },
        autor: 'Jose Samisson',
        totalDestinatarios: 42,
        lidas: 28,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
        status: 'enviada'
    },
    {
        id: '4',
        tipo: 'individual',
        titulo: '🏆 Parabéns pela conquista!',
        mensagem: 'Você desbloqueou a conquista "Estudante Dedicado" por completar 7 dias seguidos de estudo. Continue assim!',
        icone: 'gift',
        destino: 'Maria Santos (maria@email.com)',
        canais: { inapp: true, email: true, push: false },
        autor: 'Sistema',
        totalDestinatarios: 1,
        lidas: 1,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        status: 'enviada'
    },
    {
        id: '5',
        tipo: 'broadcast',
        titulo: '📝 Novo post: "Como Organizar seus Estudos"',
        mensagem: 'Acabamos de publicar um novo post com dicas incríveis para você organizar sua rotina de estudos. Confira agora!',
        icone: 'rocket',
        destino: 'Todos os usuários',
        canais: { inapp: true, email: false, push: false },
        autor: 'Jose Samisson',
        totalDestinatarios: 156,
        lidas: 89,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        status: 'enviada'
    },
    {
        id: '6',
        tipo: 'segmented',
        titulo: '💤 Sentimos sua falta!',
        mensagem: 'Faz mais de 30 dias que você não acessa a plataforma. Que tal voltar e continuar seus estudos? Temos novidades te esperando!',
        icone: 'info',
        destino: 'Usuários inativos (+30 dias)',
        canais: { inapp: true, email: true, push: true },
        autor: 'Sistema',
        totalDestinatarios: 23,
        lidas: 7,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        status: 'enviada'
    },
    {
        id: '7',
        tipo: 'system',
        titulo: '🔐 Atualização de segurança',
        mensagem: 'Implementamos novas medidas de segurança na plataforma. Recomendamos que todos alterem suas senhas nas próximas 48h.',
        icone: 'warning',
        destino: 'Todos os usuários',
        canais: { inapp: true, email: true, push: false },
        autor: 'Sistema',
        totalDestinatarios: 156,
        lidas: 134,
        enviadaEm: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        status: 'enviada'
    }
];

// Templates prontos
const templatesNotificacao = {
    welcome: {
        titulo: '👋 Bem-vindo(a) ao Zero Satus!',
        mensagem: 'Estamos muito felizes em ter você conosco! Comece explorando as disciplinas, criando sua primeira tarefa e organizando seus estudos. Se precisar de ajuda, estamos aqui!',
        icone: 'star'
    },
    maintenance: {
        titulo: '⚠️ Manutenção Programada',
        mensagem: 'O sistema ficará indisponível para manutenção no dia [DATA] das [HORA_INICIO] às [HORA_FIM]. Pedimos desculpas pelo inconveniente.',
        icone: 'warning'
    },
    newpost: {
        titulo: '📝 Novo post publicado!',
        mensagem: 'Acabamos de publicar um novo post no blog: "[TÍTULO]". Confira agora e aproveite o conteúdo!',
        icone: 'bell'
    },
    reminder: {
        titulo: '🔔 Lembrete de estudo',
        mensagem: 'Oi! Passando pra te lembrar de continuar estudando hoje. Você tem [NUMERO] tarefas pendentes. Vamos juntos!',
        icone: 'bell'
    },
    congrats: {
        titulo: '🏆 Parabéns pela conquista!',
        mensagem: 'Você desbloqueou uma nova conquista: "[CONQUISTA]". Continue assim e alcance seus objetivos!',
        icone: 'gift'
    },
    urgent: {
        titulo: '🚨 Aviso Importante',
        mensagem: '[MENSAGEM]',
        icone: 'warning'
    }
};

// Ícones do picker
const iconesMap = {
    bell: '🔔',
    info: 'ℹ️',
    warning: '⚠️',
    success: '✅',
    error: '❌',
    star: '⭐',
    gift: '🎁',
    rocket: '🚀'
};

// Carregar notificações
function loadNotifications() {
    console.log('[Notif] 📬 Carregando notificações...');
    
    atualizarStatsNotificacoes();
    renderizarListaNotificacoes(mockNotificacoes);
}

// Atualizar stats
function atualizarStatsNotificacoes() {
    const totalEnviadas = mockNotificacoes.length;
    const totalLidas = mockNotificacoes.reduce((acc, n) => acc + n.lidas, 0);
    const totalDestinatarios = mockNotificacoes.reduce((acc, n) => acc + n.totalDestinatarios, 0);
    const pendentes = totalDestinatarios - totalLidas;
    
    document.getElementById('statTotalEnviadas').textContent = totalEnviadas;
    document.getElementById('statTotalLidas').textContent = totalLidas.toLocaleString('pt-BR');
    document.getElementById('statPendentes').textContent = pendentes.toLocaleString('pt-BR');
    document.getElementById('statAlcance').textContent = totalDestinatarios.toLocaleString('pt-BR');
}

// Renderizar lista
function renderizarListaNotificacoes(notificacoes) {
    const container = document.getElementById('notifList');
    if (!container) return;
    
    if (notificacoes.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i>
                <p>Nenhuma notificação encontrada</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notificacoes.map(n => {
        const naoLidas = n.totalDestinatarios - n.lidas;
        const percentLidas = Math.round((n.lidas / n.totalDestinatarios) * 100);
        
        return `
            <div class="notif-item ${n.tipo}">
                <div class="notif-icon-box ${n.tipo}">
                    ${iconesMap[n.icone] || '🔔'}
                </div>
                <div class="notif-content">
                    <div class="notif-header">
                        <h4 class="notif-title">${n.titulo}</h4>
                        <div class="notif-time">
                            <i class="fas fa-clock"></i>
                            ${formatarTempoRelativoNotif(n.enviadaEm)}
                        </div>
                    </div>
                    <p class="notif-message">${n.mensagem}</p>
                    <div class="notif-meta">
                        <span class="notif-tag ${n.tipo}">${getTipoLabel(n.tipo)}</span>
                        <div class="notif-stat">
                            <i class="fas fa-users"></i>
                            ${n.destino}
                        </div>
                        <div class="notif-stat read">
                            <i class="fas fa-check-circle"></i>
                            ${n.lidas}/${n.totalDestinatarios} (${percentLidas}%)
                        </div>
                        ${naoLidas > 0 ? `
                            <div class="notif-stat unread">
                                <i class="fas fa-hourglass-half"></i>
                                ${naoLidas} não lidas
                            </div>
                        ` : ''}
                        <div class="notif-channels">
                            ${n.canais.inapp ? '<div class="notif-channel-icon active" title="No site"><i class="fas fa-bell"></i></div>' : ''}
                            ${n.canais.email ? '<div class="notif-channel-icon active" title="Email"><i class="fas fa-envelope"></i></div>' : ''}
                            ${n.canais.push ? '<div class="notif-channel-icon active" title="Push"><i class="fas fa-mobile-alt"></i></div>' : ''}
                        </div>
                    </div>
                </div>
                <div class="notif-actions">
                    <button class="btn-secondary" onclick="verDetalhesNotificacao('${n.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-danger" onclick="deletarNotificacao('${n.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helpers
function getTipoLabel(tipo) {
    const labels = {
        broadcast: '📢 Em massa',
        segmented: '🎯 Segmentada',
        individual: '👤 Individual',
        system: '⚙️ Sistema'
    };
    return labels[tipo] || tipo;
}

function formatarTempoRelativoNotif(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
}

// Filtrar notificações
function filtrarNotificacoes() {
    const tipo = document.getElementById('notifFilterTipo').value;
    const busca = document.getElementById('notifSearch').value.toLowerCase();
    
    let filtradas = mockNotificacoes;
    
    if (tipo !== 'all') {
        filtradas = filtradas.filter(n => n.tipo === tipo);
    }
    
    if (busca) {
        filtradas = filtradas.filter(n => 
            n.titulo.toLowerCase().includes(busca) || 
            n.mensagem.toLowerCase().includes(busca)
        );
    }
    
    renderizarListaNotificacoes(filtradas);
}

// Abrir modal
function abrirModalNovaNotificacao() {
    document.getElementById('notifModalTitle').textContent = '📢 Nova Notificação';
    document.getElementById('notifTitulo').value = '';
    document.getElementById('notifMensagem').value = '';
    document.getElementById('notifAgendar').value = '';
    document.getElementById('notifTipo').value = 'broadcast';
    document.getElementById('channelInapp').checked = true;
    document.getElementById('channelEmail').checked = false;
    document.getElementById('channelPush').checked = false;
    atualizarCampoDestino();
    document.getElementById('notifModal').classList.add('active');
}

function fecharModalNotificacao() {
    document.getElementById('notifModal').classList.remove('active');
}

// Atualizar campo destino baseado no tipo
function atualizarCampoDestino() {
    const tipo = document.getElementById('notifTipo').value;
    const segmentoGroup = document.getElementById('segmentoGroup');
    const destinoGroup = document.getElementById('destinoGroup');
    
    segmentoGroup.style.display = 'none';
    destinoGroup.style.display = 'none';
    
    if (tipo === 'segmented') {
        segmentoGroup.style.display = 'block';
        destinoGroup.style.display = 'block';
    } else if (tipo === 'individual') {
        destinoGroup.style.display = 'block';
        document.getElementById('notifDestinoValor').innerHTML = `
            <option value="user1">Maria Santos (maria@email.com)</option>
            <option value="user2">João Silva (joao@email.com)</option>
            <option value="user3">Ana Oliveira (ana@email.com)</option>
        `;
    }
}

// Selecionar ícone
function selecionarIcone(btn) {
    document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// Usar template
function usarTemplate(tipo) {
    const template = templatesNotificacao[tipo];
    if (!template) return;
    
    abrirModalNovaNotificacao();
    document.getElementById('notifTitulo').value = template.titulo;
    document.getElementById('notifMensagem').value = template.mensagem;
    
    // Selecionar ícone
    document.querySelectorAll('.icon-option').forEach(b => {
        b.classList.toggle('active', b.dataset.icon === template.icone);
    });
    
    showToast('✅ Template carregado! Edite e envie.');
}

// Enviar notificação (MOCK)
function enviarNotificacao() {
    const titulo = document.getElementById('notifTitulo').value.trim();
    const mensagem = document.getElementById('notifMensagem').value.trim();
    
    if (!titulo || !mensagem) {
        showToast('⚠️ Preencha título e mensagem!', true);
        return;
    }
    
    const tipo = document.getElementById('notifTipo').value;
    const iconeAtivo = document.querySelector('.icon-option.active');
    const icone = iconeAtivo ? iconeAtivo.dataset.icon : 'bell';
    
    // Calcular destinatários (mock)
    let totalDestinatarios = 156;
    let destino = 'Todos os usuários';
    
    if (tipo === 'segmented') {
        totalDestinatarios = Math.floor(Math.random() * 50) + 20;
        destino = 'Usuários segmentados';
    } else if (tipo === 'individual') {
        totalDestinatarios = 1;
        destino = 'Usuário específico';
    }
    
    // Criar nova notificação
    const novaNotif = {
        id: String(Date.now()),
        tipo,
        titulo,
        mensagem,
        icone,
        destino,
        canais: {
            inapp: document.getElementById('channelInapp').checked,
            email: document.getElementById('channelEmail').checked,
            push: document.getElementById('channelPush').checked
        },
        autor: 'Jose Samisson',
        totalDestinatarios,
        lidas: 0,
        enviadaEm: new Date().toISOString(),
        status: 'enviada'
    };
    
    // Adicionar ao início da lista
    mockNotificacoes.unshift(novaNotif);
    
    fecharModalNotificacao();
    loadNotifications();
    showToast(`✅ Notificação enviada pra ${totalDestinatarios} usuário(s)!`);
}

// Ver detalhes
function verDetalhesNotificacao(id) {
    const notif = mockNotificacoes.find(n => n.id === id);
    if (!notif) return;
    
    const percentLidas = Math.round((notif.lidas / notif.totalDestinatarios) * 100);
    
    alert(`📬 ${notif.titulo}\n\n${notif.mensagem}\n\n---\n📊 Estatísticas:\n• Enviada para: ${notif.totalDestinatarios}\n• Lidas: ${notif.lidas} (${percentLidas}%)\n• Não lidas: ${notif.totalDestinatarios - notif.lidas}\n\n👤 Autor: ${notif.autor}\n📅 Enviada em: ${new Date(notif.enviadaEm).toLocaleString('pt-BR')}`);
}

// Deletar
function deletarNotificacao(id) {
    if (!confirm('Tem certeza que deseja deletar esta notificação?')) return;
    
    const index = mockNotificacoes.findIndex(n => n.id === id);
    if (index !== -1) {
        mockNotificacoes.splice(index, 1);
        loadNotifications();
        showToast('🗑️ Notificação deletada!');
    }
}

// Exportar CSV
function exportarNotificacoes() {
    const csvContent = [
        ['ID', 'Tipo', 'Título', 'Mensagem', 'Destino', 'Destinatários', 'Lidas', 'Autor', 'Data'].join(','),
        ...mockNotificacoes.map(n => [
            n.id,
            n.tipo,
            `"${n.titulo.replace(/"/g, '""')}"`,
            `"${n.mensagem.replace(/"/g, '""')}"`,
            n.destino,
            n.totalDestinatarios,
            n.lidas,
            n.autor,
            n.enviadaEm
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `notificacoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('📥 Notificações exportadas!');
}

// Fechar modal clicando fora
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('notifModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) fecharModalNotificacao();
        });
    }
});

// Expor globalmente
window.abrirModalNovaNotificacao = abrirModalNovaNotificacao;
window.fecharModalNotificacao = fecharModalNotificacao;
window.atualizarCampoDestino = atualizarCampoDestino;
window.selecionarIcone = selecionarIcone;
window.usarTemplate = usarTemplate;
window.enviarNotificacao = enviarNotificacao;
window.verDetalhesNotificacao = verDetalhesNotificacao;
window.deletarNotificacao = deletarNotificacao;
window.filtrarNotificacoes = filtrarNotificacoes;
window.exportarNotificacoes = exportarNotificacoes;

console.log('[Notif] ✅ Módulo pronto!');