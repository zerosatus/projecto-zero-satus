// ==========================================
// FORÇAR EXIBIÇÃO DO PAINEL
// ==========================================
(function() {
    console.log('[Admin] 🔥 Verificando login imediato...');
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            const parsed = JSON.parse(usuarioSalvo);
            if (parsed.role === 'admin' && parsed.logado === true) {
                console.log('[Admin] ✅ Admin encontrado no localStorage:', parsed.nome);
                
                const panel = document.getElementById('adminPanel');
                if (panel) {
                    panel.style.display = 'flex';
                    console.log('[Admin] ✅ Painel exibido imediatamente');
                }
                
                const nameEl = document.getElementById('adminNameDisplay');
                if (nameEl) {
                    nameEl.textContent = parsed.nome || 'Administrador';
                    console.log('[Admin] ✅ Nome definido:', nameEl.textContent);
                }
                
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.style.display = 'block';
                }
                
                const loader = document.querySelector('.loading-overlay');
                if (loader) {
                    loader.style.display = 'none';
                }
            }
        } catch(e) {
            console.warn('[Admin] ⚠️ Erro ao forçar:', e);
        }
    }
})();

// ==========================================
// admin.js - INICIALIZAÇÃO DO PAINEL ADMIN
// ==========================================

console.log('[Admin] 🚀 Iniciando admin.js...');

let adminInicializado = false;
let adminVerificado = false;
let tentativasInicializacao = 0;
const MAX_TENTATIVAS_ADMIN = 5;

// ==========================================
// CARREGAR DADOS DO ADMIN
// ==========================================
async function carregarDadosAdmin() {
    console.log('[Admin] 📊 Carregando dados do admin...');
    
    try {
        if (window.CacheManager) {
            window.CacheManager.init();
            const userId = window.CacheManager.getCurrentUserId();
            if (userId && window.DatabaseService) {
                console.log('[Admin] ☁️ Carregando dados da nuvem...');
                await window.CacheManager.loadFromCloud(true);
                console.log('[Admin] ✅ Dados da nuvem carregados');
            }
        }
        
        const carregarPromises = [];

        if (typeof loadDashboardStats === 'function') {
            carregarPromises.push(loadDashboardStats().catch(e => console.warn('[Admin] ⚠️ Erro dashboard:', e)));
        }
        if (typeof loadUsers === 'function') {
            carregarPromises.push(loadUsers().catch(e => console.warn('[Admin] ⚠️ Erro users:', e)));
        }
        if (typeof loadPosts === 'function') {
            carregarPromises.push(loadPosts().catch(e => console.warn('[Admin] ⚠️ Erro posts:', e)));
        }
        if (typeof loadComments === 'function') {
            carregarPromises.push(loadComments().catch(e => console.warn('[Admin] ⚠️ Erro comments:', e)));
        }
        if (typeof loadNotifications === 'function') {
            carregarPromises.push(loadNotifications().catch(e => console.warn('[Admin] ⚠️ Erro notifications:', e)));
        }
        if (typeof loadAuditLogs === 'function') {
            carregarPromises.push(Promise.resolve(loadAuditLogs()).catch(e => console.warn('[Admin] ⚠️ Erro logs:', e)));
        }
        if (typeof loadReports === 'function') {
            carregarPromises.push(Promise.resolve(loadReports()).catch(e => console.warn('[Admin] ⚠️ Erro reports:', e)));
        }

        await Promise.allSettled(carregarPromises);
        atualizarStatusSistema();

        console.log('[Admin] ✅ Todos os dados carregados com sucesso!');
    } catch (error) {
        console.error('[Admin] ❌ Erro ao carregar dados:', error);
    }
}

// ==========================================
// FUNÇÃO PRINCIPAL DE INICIALIZAÇÃO
// ==========================================
async function inicializarAdmin() {
    if (adminInicializado) {
        console.log('[Admin] ⏳ Admin já inicializado');
        return;
    }

    if (tentativasInicializacao >= MAX_TENTATIVAS_ADMIN) {
        console.error('[Admin] ❌ Máximo de tentativas atingido');
        mostrarErro('Não foi possível inicializar o painel. Recarregue a página.');
        return;
    }

    tentativasInicializacao++;
    console.log(`[Admin] 📋 Inicializando painel admin (tentativa ${tentativasInicializacao}/${MAX_TENTATIVAS_ADMIN})...`);

    try {
        const authOk = await verificarAdminComRetry();
        
        if (!authOk) {
            console.error('[Admin] ❌ Falha na verificação de autenticação');
            if (tentativasInicializacao < MAX_TENTATIVAS_ADMIN) {
                console.log('[Admin] 🔄 Tentando novamente em 2 segundos...');
                setTimeout(() => inicializarAdmin(), 2000);
            }
            return;
        }

        configurarNavegacao();
        await carregarDadosAdmin();
        configurarEventos();

        adminInicializado = true;
        adminVerificado = true;
        console.log('[Admin] ✅ Admin inicializado com sucesso!');

    } catch (error) {
        console.error('[Admin] ❌ Erro ao inicializar:', error);
        
        if (tentativasInicializacao < MAX_TENTATIVAS_ADMIN) {
            console.log('[Admin] 🔄 Tentando novamente em 2 segundos...');
            setTimeout(() => inicializarAdmin(), 2000);
        } else {
            mostrarErro('Erro ao inicializar painel admin: ' + error.message);
        }
    }
}

// ==========================================
// VERIFICAR ADMIN COM RETRY
// ==========================================
async function verificarAdminComRetry() {
    console.log('[Admin] 🔍 Verificando admin...');
    
    if (adminVerificado) {
        console.log('[Admin] ✅ Já verificado');
        return true;
    }

    if (typeof window.verificarAdmin !== 'function') {
        console.error('[Admin] ❌ verificarAdmin não encontrado');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (typeof window.verificarAdmin !== 'function') {
            console.error('[Admin] ❌ verificarAdmin ainda não disponível');
            return false;
        }
    }

    try {
        const resultado = await window.verificarAdmin();
        
        if (resultado === true) {
            adminVerificado = true;
            console.log('[Admin] ✅ Verificação admin bem-sucedida');
            return true;
        }
        
        console.log('[Admin] ⚠️ Verificação falhou');
        return false;
        
    } catch (error) {
        console.error('[Admin] ❌ Erro na verificação:', error);
        return false;
    }
}

// ==========================================
// CONFIGURAR NAVEGAÇÃO
// ==========================================
function configurarNavegacao() {
    console.log('[Admin] 🧭 Configurando navegação...');
    
    const links = document.querySelectorAll('.sidebar-menu a[data-target]');
    
    links.forEach(link => {
        const novoLink = link.cloneNode(true);
        link.parentNode.replaceChild(novoLink, link);
        
        novoLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;
            
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.classList.add('active');
                console.log(`[Admin] 📄 Seção ativada: ${targetId}`);
            }

            carregarDadosSecao(targetId);
        });
    });
    
    console.log('[Admin] ✅ Navegação configurada');
}

// ==========================================
// CARREGAR DADOS DA SEÇÃO
// ==========================================
function carregarDadosSecao(targetId) {
    console.log(`[Admin] 📊 Carregando dados da seção: ${targetId}`);
    
    switch(targetId) {
        case 'dashboard':
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats().catch(e => console.warn('[Admin] ⚠️ Erro dashboard:', e));
            }
            break;
        case 'users':
            if (typeof loadUsers === 'function') {
                loadUsers().catch(e => console.warn('[Admin] ⚠️ Erro users:', e));
            }
            break;
        case 'posts':
            if (typeof loadPosts === 'function') {
                loadPosts().catch(e => console.warn('[Admin] ⚠️ Erro posts:', e));
            }
            break;
        case 'comments':
            if (typeof loadComments === 'function') {
                loadComments().catch(e => console.warn('[Admin] ⚠️ Erro comments:', e));
            }
            break;
        case 'notifications':
            if (typeof loadNotifications === 'function') {
                loadNotifications().catch(e => console.warn('[Admin] ⚠️ Erro notifications:', e));
            }
            break;
        case 'logs':
            if (typeof loadAuditLogs === 'function') {
                loadAuditLogs();
            }
            break;
        case 'reports':
            if (typeof loadReports === 'function') {
                loadReports();
            }
            break;
        case 'settings':
            break;
        default:
            console.warn(`[Admin] ⚠️ Seção desconhecida: ${targetId}`);
    }
}

// ==========================================
// CONFIGURAR EVENTOS
// ==========================================
function configurarEventos() {
    console.log('[Admin] 🔧 Configurando eventos...');
    
    configurarModalPosts();
    configurarModalNotificacoes();
    configurarLogoutBtn();
    configurarBotaoRecarregar();
    
    console.log('[Admin] ✅ Eventos configurados');
}

// ==========================================
// CONFIGURAR MODAL DE POSTS
// ==========================================
function configurarModalPosts() {
    const modal = document.getElementById('postModal');
    const btnNewPost = document.getElementById('btnNewPost');
    const closeBtns = modal?.querySelectorAll('.close-modal') || [];
    const btnSave = document.getElementById('btnSavePost');

    if (!modal) {
        console.warn('[Admin] ⚠️ Modal de posts não encontrado');
        return;
    }

    if (btnNewPost) {
        btnNewPost.addEventListener('click', () => {
            console.log('[Admin] 📝 Abrindo modal de novo post');
            document.getElementById('modalTitle').textContent = '📝 Novo Post';
            document.getElementById('postId').value = '';
            document.getElementById('postTitle').value = '';
            document.getElementById('postSlug').value = '';
            document.getElementById('postContent').value = '';
            document.getElementById('postPublished').checked = false;
            modal.classList.add('active');
        });
    }

    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    if (btnSave) {
        btnSave.addEventListener('click', salvarPost);
    }
}

// ==========================================
// SALVAR POST
// ==========================================
async function salvarPost() {
    const id = document.getElementById('postId').value;
    const title = document.getElementById('postTitle').value.trim();
    const slug = document.getElementById('postSlug').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const published = document.getElementById('postPublished').checked;

    if (!title) {
        showToast('⚠️ Título é obrigatório!', true);
        return;
    }

    const postData = {
        title,
        slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content,
        completed: published,
        updated_at: new Date().toISOString()
    };

    try {
        const client = window.supabaseClient;
        if (!client) throw new Error('Supabase não inicializado');

        if (id) {
            console.log('[Admin] 📝 Atualizando post:', id);
            const { error } = await client
                .from('tasks')
                .update(postData)
                .eq('id', id);

            if (error) throw error;
            showToast('✅ Post atualizado!');
        } else {
            console.log('[Admin] 📝 Criando novo post...');
            const { data: { user } } = await client.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await client
                .from('tasks')
                .insert({
                    ...postData,
                    user_id: user.id,
                    created_at: new Date().toISOString()
                });

            if (error) throw error;
            showToast('✅ Post criado!');
        }

        document.getElementById('postModal').classList.remove('active');
        await loadPosts();
        await loadDashboardStats();

    } catch (error) {
        console.error('[Admin] ❌ Erro ao salvar post:', error);
        showToast('❌ Erro: ' + error.message, true);
    }
}

// ==========================================
// CONFIGURAR MODAL DE NOTIFICAÇÕES
// ==========================================
function configurarModalNotificacoes() {
    const modal = document.getElementById('notifModal');
    if (!modal) {
        console.warn('[Admin] ⚠️ Modal de notificações não encontrado');
        return;
    }

    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModalNotificacao();
        }
    });

    const msgInput = document.getElementById('notifMensagem');
    if (msgInput) {
        msgInput.addEventListener('input', () => {
            const count = document.getElementById('charCount');
            if (count) count.textContent = msgInput.value.length;
        });
    }

    const destinoSelect = document.getElementById('notifDestino');
    if (destinoSelect) {
        destinoSelect.addEventListener('change', atualizarCamposDestino);
    }
}

// ==========================================
// CONFIGURAR BOTÃO DE LOGOUT
// ==========================================
function configurarLogoutBtn() {
    const btnLogout = document.getElementById('logoutBtn');
    if (btnLogout) {
        btnLogout.addEventListener('click', function(e) {
            e.preventDefault();
            window.logoutAdmin();
        });
        console.log('[Admin] ✅ Botão de logout configurado');
    } else {
        console.warn('[Admin] ⚠️ Botão de logout não encontrado');
    }
}

// ==========================================
// CONFIGURAR BOTÃO DE RECARREGAR
// ==========================================
function configurarBotaoRecarregar() {
    let btnRecarregar = document.getElementById('btnRecarregarDados');
    
    if (!btnRecarregar) {
        const header = document.querySelector('.section-header');
        if (header) {
            btnRecarregar = document.createElement('button');
            btnRecarregar.id = 'btnRecarregarDados';
            btnRecarregar.className = 'btn-secondary';
            btnRecarregar.innerHTML = '<i class="fas fa-sync"></i> Recarregar Tudo';
            btnRecarregar.onclick = window.recarregarTodosDados;
            header.appendChild(btnRecarregar);
            console.log('[Admin] ✅ Botão de recarregar criado');
        }
    }
}

// ==========================================
// ATUALIZAR STATUS DO SISTEMA
// ==========================================
function atualizarStatusSistema() {
    const statusEl = document.getElementById('lastSyncStatus');
    if (statusEl) {
        const agora = new Date();
        statusEl.textContent = `Última sincronização: ${agora.toLocaleTimeString('pt-BR')}`;
        console.log('[Admin] ✅ Status do sistema atualizado');
    }
}

// ==========================================
// MOSTRAR ERRO NA INTERFACE
// ==========================================
function mostrarErro(mensagem) {
    console.error('[Admin] ❌ Erro:', mensagem);
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = '❌ ' + mensagem;
        toast.className = 'toast error';
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    } else {
        alert('❌ ' + mensagem);
    }
}

// ==========================================
// FUNÇÃO PARA RECARREGAR TODOS OS DADOS
// ==========================================
window.recarregarTodosDados = async function() {
    console.log('[Admin] 🔄 Recarregando todos os dados...');
    
    const btn = document.querySelector('[onclick="recarregarTodosDados()"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recarregando...';
    }

    try {
        if (window.CacheManager) {
            console.log('[Admin] ☁️ Recarregando do cache...');
            await window.CacheManager.loadFromCloud(true);
        }
        
        await carregarDadosAdmin();
        
        if (typeof showToast === 'function') {
            showToast('✅ Todos os dados foram recarregados!');
        }
        console.log('[Admin] ✅ Dados recarregados com sucesso');
    } catch (error) {
        console.error('[Admin] ❌ Erro ao recarregar:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erro ao recarregar dados: ' + error.message, true);
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sync"></i> Recarregar Tudo';
        }
    }
};

// ==========================================
// FUNÇÃO PARA LOGOUT
// ==========================================
window.logoutAdmin = async function() {
    console.log('[Admin] 🔴 Realizando logout...');
    
    if (!confirm('Tem certeza que deseja sair?')) return;

    try {
        const client = window.supabaseClient;
        if (client) {
            await client.auth.signOut();
        }

        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('userPhotoURL');

        if (window.CacheManager) {
            window.CacheManager.logout();
        }

        adminInicializado = false;
        adminVerificado = false;
        
        window.location.replace('../login/index.html');

    } catch (error) {
        console.error('[Admin] ❌ Erro no logout:', error);
        if (typeof showToast === 'function') {
            showToast('❌ Erro ao sair: ' + error.message, true);
        }
    }
};

// ==========================================
// VERIFICAR SE JÁ ESTÁ LOGADO AO CARREGAR
// ==========================================
async function verificarLoginExistente() {
    console.log('[Admin] 🔍 Verificando login existente...');
    
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (usuarioSalvo) {
        try {
            const parsed = JSON.parse(usuarioSalvo);
            if (parsed.role === 'admin' && parsed.logado === true) {
                console.log('[Admin] ✅ Admin já logado:', parsed.nome);
                
                const client = window.supabaseClient;
                if (client) {
                    const { data: { session } } = await client.auth.getSession();
                    if (session) {
                        console.log('[Admin] ✅ Sessão válida, restaurando...');
                        adminVerificado = true;
                        return true;
                    } else {
                        console.log('[Admin] ⚠️ Sessão expirada, removendo localStorage');
                        localStorage.removeItem('usuarioLogado');
                    }
                }
            }
        } catch (e) {
            console.warn('[Admin] ⚠️ Erro ao parsear usuarioLogado:', e);
        }
    }
    return false;
}

// ==========================================
// INICIALIZAR QUANDO O DOM ESTIVER PRONTO
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Admin] 📋 DOM carregado, preparando inicialização...');

    verificarLoginExistente().then(logado => {
        if (logado) {
            console.log('[Admin] ✅ Login existente encontrado, inicializando...');
            setTimeout(() => {
                inicializarAdmin();
            }, 300);
            return;
        }

        let verificacoes = 0;
        const maxVerificacoes = 20;
        
        const verificarDependencias = setInterval(() => {
            verificacoes++;
            
            const supabaseOk = !!window.supabaseClient;
            const authOk = typeof window.verificarAdmin === 'function';
            
            if (supabaseOk && authOk) {
                clearInterval(verificarDependencias);
                console.log('[Admin] ✅ Dependências carregadas');
                
                setTimeout(() => {
                    inicializarAdmin();
                }, 300);
            } else if (verificacoes >= maxVerificacoes) {
                clearInterval(verificarDependencias);
                console.warn('[Admin] ⚠️ Timeout aguardando dependências');
                
                setTimeout(() => {
                    inicializarAdmin();
                }, 500);
            }
        }, 500);
    });
});

// ==========================================
// ESCUTAR EVENTO DE ADMIN VERIFICADO
// ==========================================
document.addEventListener('adminVerificado', async () => {
    console.log('[Admin] 📡 Evento adminVerificado recebido');
    
    if (!adminInicializado) {
        await inicializarAdmin();
    }
});

// ==========================================
// RECARREGAR QUANDO A PÁGINA VOLTAR A TER FOCO
// ==========================================
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && adminInicializado) {
        console.log('[Admin] 🔄 Página voltou ao foco, recarregando dados...');
        setTimeout(() => {
            carregarDadosAdmin();
        }, 500);
    }
});

// ==========================================
// EXPORTA FUNÇÕES GLOBAIS
// ==========================================
window.inicializarAdmin = inicializarAdmin;
window.carregarDadosAdmin = carregarDadosAdmin;
window.atualizarStatusSistema = atualizarStatusSistema;
window.mostrarErro = mostrarErro;
window.adminInicializado = () => adminInicializado;
window.adminVerificado = () => adminVerificado;

console.log('[Admin] ✅ admin.js completamente carregado!');
console.log('[Admin] 📌 Funções disponíveis:');
console.log('   - inicializarAdmin()');
console.log('   - carregarDadosAdmin()');
console.log('   - recarregarTodosDados()');
console.log('   - logoutAdmin()');