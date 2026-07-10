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
                
                // Mostrar painel imediatamente
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
                
                // Esconder qualquer loader
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

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================
let adminInicializado = false;
let adminVerificado = false;
let tentativasInicializacao = 0;
const MAX_TENTATIVAS = 5;
let adminInitialized = false;

// ==========================================
// CARREGAR DADOS DO ADMIN
// ==========================================
async function carregarDadosAdmin() {
    console.log('[Admin] 📊 Carregando dados do admin...');
    
    try {
        // Inicializar CacheManager
        if (window.CacheManager) {
            window.CacheManager.init();
            const userId = window.CacheManager.getCurrentUserId();
            if (userId && window.DatabaseService) {
                console.log('[Admin] ☁️ Carregando dados da nuvem...');
                await window.CacheManager.loadFromCloud(true);
                console.log('[Admin] ✅ Dados da nuvem carregados');
            }
        }
        
        // Carregar cada seção
        const carregarPromises = [];

        // Dashboard
        if (typeof loadDashboardStats === 'function') {
            carregarPromises.push(
                loadDashboardStats().catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar dashboard:', e);
                })
            );
        }

        // Usuários
        if (typeof loadUsers === 'function') {
            carregarPromises.push(
                loadUsers().catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar usuários:', e);
                })
            );
        }

        // Posts
        if (typeof loadPosts === 'function') {
            carregarPromises.push(
                loadPosts().catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar posts:', e);
                })
            );
        }

        // Comentários
        if (typeof loadComments === 'function') {
            carregarPromises.push(
                loadComments().catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar comentários:', e);
                })
            );
        }

        // Notificações
        if (typeof loadNotifications === 'function') {
            carregarPromises.push(
                loadNotifications().catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar notificações:', e);
                })
            );
        }

        // Logs
        if (typeof loadAuditLogs === 'function') {
            carregarPromises.push(
                Promise.resolve(loadAuditLogs()).catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar logs:', e);
                })
            );
        }

        // Relatórios
        if (typeof loadReports === 'function') {
            carregarPromises.push(
                Promise.resolve(loadReports()).catch(e => {
                    console.warn('[Admin] ⚠️ Erro ao carregar relatórios:', e);
                })
            );
        }

        // Aguardar todos os carregamentos
        await Promise.allSettled(carregarPromises);

        // Atualizar status do sistema
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

    if (tentativasInicializacao >= MAX_TENTATIVAS) {
        console.error('[Admin] ❌ Máximo de tentativas atingido');
        mostrarErro('Não foi possível inicializar o painel. Recarregue a página.');
        return;
    }

    tentativasInicializacao++;
    console.log(`[Admin] 📋 Inicializando painel admin (tentativa ${tentativasInicializacao}/${MAX_TENTATIVAS})...`);

    try {
        // 1. Verificar autenticação
        const authOk = await verificarAdminComRetry();
        
        if (!authOk) {
            console.error('[Admin] ❌ Falha na verificação de autenticação');
            if (tentativasInicializacao < MAX_TENTATIVAS) {
                console.log('[Admin] 🔄 Tentando novamente em 2 segundos...');
                setTimeout(() => inicializarAdmin(), 2000);
            }
            return;
        }

        // 2. Configurar navegação
        configurarNavegacao();

        // 3. Carregar dados iniciais
        await carregarDadosAdmin();

        // 4. Configurar eventos
        configurarEventos();

        adminInicializado = true;
        adminVerificado = true;
        console.log('[Admin] ✅ Admin inicializado com sucesso!');

    } catch (error) {
        console.error('[Admin] ❌ Erro ao inicializar:', error);
        
        if (tentativasInicializacao < MAX_TENTATIVAS) {
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
    
    // Verificar se já está verificado
    if (adminVerificado) {
        console.log('[Admin] ✅ Já verificado');
        return true;
    }

    // Verificar se a função existe
    if (typeof window.verificarAdmin !== 'function') {
        console.error('[Admin] ❌ verificarAdmin não encontrado');
        
        // Aguardar o auth carregar
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
        // Remover listeners antigos
        const novoLink = link.cloneNode(true);
        link.parentNode.replaceChild(novoLink, link);
        
        novoLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('data-target');
            if (!targetId) return;
            
            // Atualizar active na sidebar
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar seção
            document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                targetEl.classList.add('active');
                console.log(`[Admin] 📄 Seção ativada: ${targetId}`);
            }

            // Carregar dados conforme a seção
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
            // Sem ação específica
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
    
    // Configurar modal de posts
    configurarModalPosts();
    
    // Configurar modal de notificações
    configurarModalNotificacoes();
    
    // Configurar botão de logout
    configurarLogoutBtn();
    
    // Configurar botão de recarregar
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

    // Novo post
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

    // Fechar modal
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    });

    // Fechar clicando fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    // Salvar post
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
        const supabaseClient = window.supabaseClient;
        if (!supabaseClient) throw new Error('Supabase não inicializado');

        if (id) {
            console.log('[Admin] 📝 Atualizando post:', id);
            const { error } = await supabaseClient
                .from('tasks')
                .update(postData)
                .eq('id', id);

            if (error) throw error;
            showToast('✅ Post atualizado!');
        } else {
            console.log('[Admin] 📝 Criando novo post...');
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabaseClient
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

    // Fechar clicando fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            fecharModalNotificacao();
        }
    });

    // Contador de caracteres
    const msgInput = document.getElementById('notifMensagem');
    if (msgInput) {
        msgInput.addEventListener('input', () => {
            const count = document.getElementById('charCount');
            if (count) count.textContent = msgInput.value.length;
        });
    }

    // Atualizar campos de destino
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
        // Recarregar do cache/nuvem
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
        const supabaseClient = window.supabaseClient;
        if (supabaseClient) {
            await supabaseClient.auth.signOut();
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
                
                // Verificar se a sessão ainda é válida
                const supabaseClient = window.supabaseClient;
                if (supabaseClient) {
                    const { data: { session } } = await supabaseClient.auth.getSession();
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

    // Verificar login existente primeiro
    verificarLoginExistente().then(logado => {
        if (logado) {
            console.log('[Admin] ✅ Login existente encontrado, inicializando...');
            setTimeout(() => {
                inicializarAdmin();
            }, 300);
            return;
        }

        // Aguardar o supabase e auth carregarem
        let verificacoes = 0;
        const maxVerificacoes = 20;
        
        const verificarDependencias = setInterval(() => {
            verificacoes++;
            
            const supabaseOk = !!window.supabaseClient;
            const authOk = typeof window.verificarAdmin === 'function';
            
            if (supabaseOk && authOk) {
                clearInterval(verificarDependencias);
                console.log('[Admin] ✅ Dependências carregadas');
                
                // Inicializar admin
                setTimeout(() => {
                    inicializarAdmin();
                }, 300);
            } else if (verificacoes >= maxVerificacoes) {
                clearInterval(verificarDependencias);
                console.warn('[Admin] ⚠️ Timeout aguardando dependências');
                
                // Tentar inicializar mesmo assim
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