// ==========================================
// modules/notifications.js - NOTIFICAÇÕES
// ==========================================

console.log('[Notif] 📬 Módulo de notificações carregado');

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let notificacoesCache = [];
let iconeSelecionado = 'bell';
let supabaseClient = window.supabaseClient;

// ==========================================
// MAPA DE ÍCONES
// ==========================================
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

// ==========================================
// TEMPLATES
// ==========================================
const templatesNotificacao = {
    welcome: {
        titulo: '👋 Bem-vindo(a) ao Zero Satus!',
        mensagem: 'Estamos muito felizes em ter você conosco! Comece explorando as disciplinas, criando sua primeira tarefa e organizando seus estudos. Se precisar de ajuda, estamos aqui!',
        icone: 'star'
    },
    maintenance: {
        titulo: '⚠️ Manutenção Programada',
        mensagem: 'O sistema ficará indisponível para manutenção preventiva. Pedimos desculpas pelo inconveniente.',
        icone: 'warning'
    },
    newpost: {
        titulo: '📝 Novo post publicado!',
        mensagem: 'Acabamos de publicar um novo post no blog. Confira agora e aproveite o conteúdo!',
        icone: 'bell'
    },
    reminder: {
        titulo: '🔔 Lembrete de estudo',
        mensagem: 'Continue seus estudos! Você tem tarefas pendentes. Vamos juntos alcançar seus objetivos!',
        icone: 'bell'
    },
    congrats: {
        titulo: '🏆 Parabéns pela conquista!',
        mensagem: 'Você desbloqueou uma nova conquista! Continue assim e alcance seus objetivos!',
        icone: 'gift'
    },
    urgent: {
        titulo: '🚨 Aviso Importante',
        mensagem: 'Atenção! Leia esta mensagem com cuidado.',
        icone: 'warning'
    }
};

// ==========================================
// CARREGAR NOTIFICAÇÕES DO SUPABASE
// ==========================================
async function loadNotifications() {
    console.log('[Notif] 📬 Carregando notificações...');
    
    const container = document.getElementById('notifList');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <p>Carregando notificações...</p>
            </div>
        `;
    }

    try {
        if (!supabaseClient) {
            supabaseClient = window.supabaseClient;
            if (!supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
        }

        const { data, error } = await supabaseClient
            .from('admin_notifications')
            .select('*')
            .order('enviada_em', { ascending: false });

        if (error) {
            console.error('[Notif] ❌ Erro ao carregar:', error);
            if (container) {
                container.innerHTML = `
                    <div style="text-align:center; padding:40px; color:var(--danger);">
                        <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                        <p>Erro ao carregar notificações: ${error.message}</p>
                        <button class="btn-secondary" onclick="recarregarNotificacoes()" style="margin-top: 10px;">
                            <i class="fas fa-sync"></i> Tentar novamente
                        </button>
                    </div>
                `;
            }
            return;
        }

        notificacoesCache = data || [];
        
        // Atualizar badge
        const badge = document.getElementById('notifBadge');
        if (badge) {
            const naoLidas = notificacoesCache.filter(n => n.status !== 'agendada').length;
            badge.textContent = naoLidas > 0 ? naoLidas : '0';
        }
        
        // Atualizar stats
        atualizarStats();
        
        // Renderizar lista
        renderizarLista(notificacoesCache);
        
        console.log('[Notif] ✅ Notificações carregadas:', notificacoesCache.length);

    } catch (error) {
        console.error('[Notif] ❌ Erro:', error);
        if (container) {
            container.innerHTML = `
                <div style="text-align:center; padding:40px; color:var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                    <p>Erro ao carregar notificações</p>
                    <button class="btn-secondary" onclick="recarregarNotificacoes()" style="margin-top: 10px;">
                        <i class="fas fa-sync"></i> Tentar novamente
                    </button>
                </div>
            `;
        }
    }
}

// ==========================================
// ATUALIZAR ESTATÍSTICAS
// ==========================================
function atualizarStats() {
    const total = notificacoesCache.length;
    const totalLidas = notificacoesCache.reduce((acc, n) => acc + (n.lidas || 0), 0);
    const totalDestinatarios = notificacoesCache.reduce((acc, n) => acc + (n.total_destinatarios || 0), 0);
    const pendentes = totalDestinatarios - totalLidas;

    const elTotal = document.getElementById('statTotalEnviadas');
    const elLidas = document.getElementById('statTotalLidas');
    const elPendentes = document.getElementById('statPendentes');
    const elAlcance = document.getElementById('statAlcance');

    if (elTotal) elTotal.textContent = total;
    if (elLidas) elLidas.textContent = totalLidas.toLocaleString('pt-BR');
    if (elPendentes) elPendentes.textContent = pendentes.toLocaleString('pt-BR');
    if (elAlcance) elAlcance.textContent = totalDestinatarios.toLocaleString('pt-BR');
}

// ==========================================
// RENDERIZAR LISTA
// ==========================================
function renderizarLista(notificacoes) {
    const container = document.getElementById('notifList');
    if (!container) return;

    if (!notificacoes || notificacoes.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--text-muted);">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                <p>Nenhuma notificação encontrada</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notificacoes.map(n => {
        const percentual = n.total_destinatarios > 0 
            ? Math.round((n.lidas / n.total_destinatarios) * 100) 
            : 0;
        const naoLidas = (n.total_destinatarios || 0) - (n.lidas || 0);
        const icone = iconesMap[n.icone] || '🔔';
        const tipoLabel = getTipoLabel(n.tipo);
        const isAgendada = n.status === 'agendada';

        return `
            <div class="notif-item ${n.tipo} ${isAgendada ? 'agendada' : ''}">
                <div class="notif-icon-box ${n.tipo}">
                    ${icone}
                </div>
                <div class="notif-content">
                    <div class="notif-header">
                        <h4 class="notif-title">${n.titulo}</h4>
                        <div class="notif-time">
                            <i class="fas fa-clock"></i>
                            ${formatarData(n.enviada_em)}
                            ${isAgendada ? '<span style="color: #f59e0b; margin-left: 8px;">📅 Agendada</span>' : ''}
                        </div>
                    </div>
                    <p class="notif-message">${n.mensagem}</p>
                    <div class="notif-meta">
                        <span class="notif-tag ${n.tipo}">${tipoLabel}</span>
                        <div class="notif-stat">
                            <i class="fas fa-users"></i>
                            ${n.destino || 'Não especificado'}
                        </div>
                        <div class="notif-stat read">
                            <i class="fas fa-check-circle"></i>
                            ${n.lidas || 0}/${n.total_destinatarios || 0} (${percentual}%)
                        </div>
                        ${naoLidas > 0 ? `
                            <div class="notif-stat unread">
                                <i class="fas fa-hourglass-half"></i>
                                ${naoLidas} não lidas
                            </div>
                        ` : ''}
                        ${n.canais ? `
                            <div class="notif-channels">
                                ${n.canais.inapp ? '<div class="notif-channel-icon active" title="No site"><i class="fas fa-bell"></i></div>' : ''}
                                ${n.canais.email ? '<div class="notif-channel-icon active" title="Email"><i class="fas fa-envelope"></i></div>' : ''}
                                ${n.canais.push ? '<div class="notif-channel-icon active" title="Push"><i class="fas fa-mobile-alt"></i></div>' : ''}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="notif-actions">
                    <button class="btn-secondary" onclick="verDetalhesNotificacao('${n.id}')" title="Ver detalhes">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-danger" onclick="deletarNotificacao('${n.id}')" title="Deletar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==========================================
// HELPERS
// ==========================================
function getTipoLabel(tipo) {
    const labels = {
        broadcast: '📢 Em massa',
        segmented: '🎯 Segmentada',
        individual: '👤 Individual',
        system: '⚙️ Sistema'
    };
    return labels[tipo] || tipo;
}

function formatarData(timestamp) {
    if (!timestamp) return 'Data desconhecida';
    try {
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
        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return timestamp;
    }
}

// ==========================================
// FILTRAR NOTIFICAÇÕES
// ==========================================
function filtrarNotificacoes() {
    const tipo = document.getElementById('notifFilterTipo')?.value || 'all';
    const busca = document.getElementById('notifSearch')?.value?.toLowerCase() || '';

    let filtradas = notificacoesCache;

    if (tipo !== 'all') {
        filtradas = filtradas.filter(n => n.tipo === tipo);
    }

    if (busca) {
        filtradas = filtradas.filter(n =>
            (n.titulo || '').toLowerCase().includes(busca) ||
            (n.mensagem || '').toLowerCase().includes(busca)
        );
    }

    renderizarLista(filtradas);
}

// ==========================================
// RECARREGAR NOTIFICAÇÕES
// ==========================================
function recarregarNotificacoes() {
    console.log('[Notif] 🔄 Recarregando...');
    loadNotifications();
}

// ==========================================
// ABRIR MODAL
// ==========================================
function abrirModalNovaNotificacao() {
    const modal = document.getElementById('notifModal');
    if (!modal) return;

    document.getElementById('notifModalTitle').textContent = '📢 Nova Notificação';
    document.getElementById('notifDestino').value = 'todos';
    document.getElementById('notifEmailDestino').value = '';
    document.getElementById('notifTitulo').value = '';
    document.getElementById('notifMensagem').value = '';
    document.getElementById('notifAgendar').value = '';
    document.getElementById('channelInapp').checked = true;
    document.getElementById('channelEmail').checked = false;
    document.getElementById('channelPush').checked = false;
    document.getElementById('emailDestinoGroup').style.display = 'none';
    document.getElementById('charCount').textContent = '0';
    
    // Resetar ícone
    document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
    const defaultIcon = document.querySelector('.icon-option[data-icon="bell"]');
    if (defaultIcon) defaultIcon.classList.add('active');
    iconeSelecionado = 'bell';
    
    modal.classList.add('active');
}

function fecharModalNotificacao() {
    const modal = document.getElementById('notifModal');
    if (modal) modal.classList.remove('active');
}

// ==========================================
// ATUALIZAR CAMPOS DE DESTINO
// ==========================================
function atualizarCamposDestino() {
    const destino = document.getElementById('notifDestino')?.value || 'todos';
    const emailGroup = document.getElementById('emailDestinoGroup');
    
    if (emailGroup) {
        emailGroup.style.display = destino === 'individual' ? 'block' : 'none';
    }
}

// ==========================================
// SELECIONAR ÍCONE
// ==========================================
function selecionarIcone(btn) {
    document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    iconeSelecionado = btn.dataset.icon;
}

// ==========================================
// USAR TEMPLATE
// ==========================================
function usarTemplate(tipo) {
    const template = templatesNotificacao[tipo];
    if (!template) return;

    abrirModalNovaNotificacao();
    document.getElementById('notifTitulo').value = template.titulo;
    document.getElementById('notifMensagem').value = template.mensagem;
    document.getElementById('charCount').textContent = template.mensagem.length;

    // Selecionar ícone
    document.querySelectorAll('.icon-option').forEach(b => {
        b.classList.toggle('active', b.dataset.icon === template.icone);
    });
    iconeSelecionado = template.icone;

    if (typeof showToast === 'function') {
        showToast('✅ Template carregado! Edite e envie.');
    }
}

// ==========================================
// CONTADOR DE CARACTERES
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const msgInput = document.getElementById('notifMensagem');
    if (msgInput) {
        msgInput.addEventListener('input', () => {
            const count = document.getElementById('charCount');
            if (count) count.textContent = msgInput.value.length;
        });
    }
});

// ==========================================
// ENVIAR NOTIFICAÇÃO
// ==========================================
async function enviarNotificacao() {
    const btn = document.getElementById('btnEnviarNotificacao');
    const titulo = document.getElementById('notifTitulo')?.value?.trim() || '';
    const mensagem = document.getElementById('notifMensagem')?.value?.trim() || '';
    const destino = document.getElementById('notifDestino')?.value || 'todos';
    const emailDestino = document.getElementById('notifEmailDestino')?.value?.trim() || '';
    const agendar = document.getElementById('notifAgendar')?.value || '';
    const canais = {
        inapp: document.getElementById('channelInapp')?.checked || false,
        email: document.getElementById('channelEmail')?.checked || false,
        push: document.getElementById('channelPush')?.checked || false
    };

    // Validações
    if (!titulo) {
        if (typeof showToast === 'function') showToast('⚠️ Preencha o título!', true);
        return;
    }

    if (!mensagem) {
        if (typeof showToast === 'function') showToast('⚠️ Preencha a mensagem!', true);
        return;
    }

    if (destino === 'individual' && !emailDestino) {
        if (typeof showToast === 'function') showToast('⚠️ Digite o email do usuário!', true);
        return;
    }

    if (destino === 'individual' && !emailDestino.includes('@')) {
        if (typeof showToast === 'function') showToast('⚠️ Email inválido!', true);
        return;
    }

    // Desabilitar botão
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    }

    try {
        if (!supabaseClient) {
            supabaseClient = window.supabaseClient;
            if (!supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
        }

        const autor = document.getElementById('adminNameDisplay')?.textContent || 'Administrador';
        
        let destinoSql = destino;
        if (destino === 'individual') {
            destinoSql = emailDestino;
        }

        const { data, error } = await supabaseClient.rpc('enviar_notificacao', {
            p_destino: destinoSql,
            p_titulo: titulo,
            p_mensagem: mensagem,
            p_tipo: destino === 'todos' ? 'broadcast' : 
                    destino === 'individual' ? 'individual' : 'segmented',
            p_icone: iconeSelecionado || 'bell',
            p_autor: autor,
            p_autor_id: null,
            p_canais: canais,
            p_agendar: agendar || null
        });

        if (error) {
            console.error('[Notif] ❌ Erro ao enviar:', error);
            if (typeof showToast === 'function') showToast('❌ Erro ao enviar: ' + error.message, true);
            return;
        }

        console.log('[Notif] ✅ Notificação enviada:', data);
        if (typeof showToast === 'function') showToast('✅ ' + (data || 'Notificação enviada com sucesso!'));
        
        fecharModalNotificacao();
        await loadNotifications();

    } catch (error) {
        console.error('[Notif] ❌ Erro:', error);
        if (typeof showToast === 'function') showToast('❌ Erro ao enviar: ' + error.message, true);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Enviar';
        }
    }
}

// ==========================================
// VER DETALHES DA NOTIFICAÇÃO
// ==========================================
function verDetalhesNotificacao(id) {
    const notif = notificacoesCache.find(n => n.id === id);
    if (!notif) {
        if (typeof showToast === 'function') showToast('❌ Notificação não encontrada', true);
        return;
    }

    const percentual = notif.total_destinatarios > 0 
        ? Math.round((notif.lidas / notif.total_destinatarios) * 100) 
        : 0;

    alert(`📬 ${notif.titulo}\n\n${notif.mensagem}\n\n---\n📊 Estatísticas:\n• Enviada para: ${notif.total_destinatarios || 0} usuário(s)\n• Lidas: ${notif.lidas || 0} (${percentual}%)\n• Não lidas: ${(notif.total_destinatarios || 0) - (notif.lidas || 0)}\n\n👤 Autor: ${notif.autor || 'Sistema'}\n📅 Enviada em: ${formatarData(notif.enviada_em)}\n📌 Tipo: ${getTipoLabel(notif.tipo)}`);
}

// ==========================================
// DELETAR NOTIFICAÇÃO
// ==========================================
async function deletarNotificacao(id) {
    if (!confirm('Tem certeza que deseja DELETAR esta notificação?')) return;

    try {
        if (!supabaseClient) {
            supabaseClient = window.supabaseClient;
            if (!supabaseClient) {
                throw new Error('Supabase não inicializado');
            }
        }

        const { error } = await supabaseClient
            .from('admin_notifications')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('[Notif] ❌ Erro ao deletar:', error);
            if (typeof showToast === 'function') showToast('❌ Erro ao deletar: ' + error.message, true);
            return;
        }

        if (typeof showToast === 'function') showToast('🗑️ Notificação deletada!');
        await loadNotifications();

    } catch (error) {
        console.error('[Notif] ❌ Erro:', error);
        if (typeof showToast === 'function') showToast('❌ Erro ao deletar: ' + error.message, true);
    }
}

// ==========================================
// EXPORTAR CSV
// ==========================================
function exportarNotificacoes() {
    if (!notificacoesCache || notificacoesCache.length === 0) {
        if (typeof showToast === 'function') showToast('⚠️ Nenhuma notificação para exportar', true);
        return;
    }

    const headers = ['ID', 'Título', 'Mensagem', 'Tipo', 'Destino', 'Destinatários', 'Lidas', 'Autor', 'Status', 'Data'];
    const rows = notificacoesCache.map(n => [
        n.id || '',
        `"${(n.titulo || '').replace(/"/g, '""')}"`,
        `"${(n.mensagem || '').replace(/"/g, '""')}"`,
        n.tipo || '',
        n.destino || '',
        n.total_destinatarios || 0,
        n.lidas || 0,
        n.autor || 'Sistema',
        n.status || 'enviada',
        n.enviada_em || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `notificacoes-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof showToast === 'function') showToast('📥 Notificações exportadas!');
}

// ==========================================
// FECHAR MODAL CLICANDO FORA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('notifModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) fecharModalNotificacao();
        });
    }
    
    // Carregar notificações quando a página carregar
    if (document.querySelector('#notifications')) {
        loadNotifications();
    }
});

// ==========================================
// EXPORTAR FUNÇÕES GLOBAIS
// ==========================================
window.loadNotifications = loadNotifications;
window.filtrarNotificacoes = filtrarNotificacoes;
window.recarregarNotificacoes = recarregarNotificacoes;
window.abrirModalNovaNotificacao = abrirModalNovaNotificacao;
window.fecharModalNotificacao = fecharModalNotificacao;
window.atualizarCamposDestino = atualizarCamposDestino;
window.selecionarIcone = selecionarIcone;
window.usarTemplate = usarTemplate;
window.enviarNotificacao = enviarNotificacao;
window.verDetalhesNotificacao = verDetalhesNotificacao;
window.deletarNotificacao = deletarNotificacao;
window.exportarNotificacoes = exportarNotificacoes;

console.log('[Notif] ✅ Módulo de notificações carregado com sucesso!');