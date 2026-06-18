// mobile-telas/perfil/script.js - VERSÃO SUPABASE APENAS

let notifications = [];
let usuarioLogado = null;
let notificacoesSettings = {};
let appearanceSettings = {};
let selectedTheme = 'dark';
let selectedAccent = '#8b5cf6';
let userPhotoURL = null;

// ============================================
// TOAST & CONFIRM
// ============================================
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icons = { success: 'checkmark-circle', error: 'close-circle', info: 'information-circle' };
    toast.innerHTML = `<ion-icon name="${icons[type]}-outline"></ion-icon> <span>${message}</span>`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('toast-hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showConfirm(message, title, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) { callback(false); return; }
    
    document.getElementById('confirm-title').textContent = title || 'Confirmar';
    document.getElementById('confirm-message').textContent = message;
    modal.classList.add('active');
    
    const handleConfirm = () => {
        modal.classList.remove('active');
        callback(true);
        cleanup();
    };
    
    const handleCancel = () => {
        modal.classList.remove('active');
        callback(false);
        cleanup();
    };
    
    const cleanup = () => {
        document.getElementById('confirm-ok').removeEventListener('click', handleConfirm);
        document.getElementById('confirm-cancel').removeEventListener('click', handleCancel);
    };
    
    document.getElementById('confirm-ok').onclick = handleConfirm;
    document.getElementById('confirm-cancel').onclick = handleCancel;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('active');
}

// ============================================
// SALVAR DADOS
// ============================================
async function salvarTodosDados() {
    if (!usuarioLogado || !window.CacheManager) return false;
    
    try {
        window.CacheManager.set('notifications', notifications, true);
        window.CacheManager.set('notificacoesSettings', notificacoesSettings, true);
        window.CacheManager.set('appearanceSettings', appearanceSettings, true);
        window.CacheManager.set('usuarioLogado', usuarioLogado, true);
        
        if (userPhotoURL) localStorage.setItem('userPhotoURL', userPhotoURL);
        
        console.log('[Perfil Mobile] ✅ Dados salvos');
        return true;
    } catch (error) {
        console.error('[Perfil Mobile] Erro ao salvar:', error);
        return false;
    }
}

// ============================================
// CARREGAR DADOS
// ============================================
function loadAllData() {
    const usuarioSalvo = localStorage.getItem('usuarioLogado');
    if (!usuarioSalvo || !usuarioSalvo.id) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    usuarioLogado = JSON.parse(usuarioSalvo);
    console.log('[Perfil Mobile] Usuário:', usuarioLogado.id);
    
    if (window.CacheManager) {
        window.CacheManager.init();
        window.CacheManager.currentUserId = usuarioLogado.id;
        
        notifications = window.CacheManager.get('notifications', []);
        notificacoesSettings = window.CacheManager.get('notificacoesSettings', { push: true, email: false, aulas: true, tarefas: true });
        appearanceSettings = window.CacheManager.get('appearanceSettings', { theme: 'dark', accent: '#8b5cf6', fontSize: 14 });
    } else {
        const userId = usuarioLogado.id;
        notifications = JSON.parse(localStorage.getItem(`${userId}_notifications`) || '[]');
        notificacoesSettings = JSON.parse(localStorage.getItem('notificacoesSettings') || '{"push":true,"email":false,"aulas":true,"tarefas":true}');
        appearanceSettings = JSON.parse(localStorage.getItem('appearanceSettings') || '{"theme":"dark","accent":"#8b5cf6","fontSize":14}');
    }
    
    userPhotoURL = localStorage.getItem('userPhotoURL');
    
    if (appearanceSettings.accent) {
        document.documentElement.style.setProperty('--accent-purple', appearanceSettings.accent);
    }
}

// ============================================
// PERFIL
// ============================================
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const unreadCount = notifications.filter(n => !n.read).length;
    if (badge) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
}

function formatTimeAgo(timeString) {
    if (!timeString) return '';
    const now = new Date();
    const notifTime = new Date(timeString);
    const diffMins = Math.floor((now - notifTime) / 60000);
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffMins < 1440) return `Há ${Math.floor(diffMins / 60)}h`;
    return notifTime.toLocaleDateString('pt-BR');
}

function renderNotificationsModal(filter = 'all') {
    const list = document.getElementById('notifications-list-modal');
    if (!list) return;
    
    let filtered = [...notifications];
    if (filter === 'unread') filtered = notifications.filter(n => !n.read);
    else if (filter === 'aulas') filtered = notifications.filter(n => n.type === 'aula');
    else if (filter === 'tarefas') filtered = notifications.filter(n => n.type === 'tarefa');
    
    if (filtered.length === 0) {
        list.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)">Nenhuma notificação</div>';
        return;
    }
    
    let html = '';
    filtered.forEach(notif => {
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type || 'info'}">
                <ion-icon name="notifications-outline"></ion-icon>
            </div>
            <div class="notification-content">
                <div class="notification-title">${escapeHtml(notif.title)}</div>
                <div class="notification-message">${escapeHtml(notif.message)}</div>
                <div class="notification-time">${formatTimeAgo(notif.time)}</div>
            </div>
        </div>`;
    });
    list.innerHTML = html;
}

function markAllAsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    renderNotificationsModal();
    salvarTodosDados();
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            salvarTodosDados();
            showToast('Notificações limpas!', 'success');
        }
    });
}

function loadProfileData() {
    if (!usuarioLogado) return;
    
    const nameInput = document.getElementById('profile-name-input');
    const emailInput = document.getElementById('profile-email-input');
    const avatarPreview = document.getElementById('avatar-preview');
    const profileAvatar = document.getElementById('profile-avatar');
    
    if (nameInput) nameInput.value = usuarioLogado.nome || '';
    if (emailInput) emailInput.value = usuarioLogado.email || '';
    
    if (userPhotoURL && (userPhotoURL.startsWith('data:') || userPhotoURL.startsWith('http'))) {
        if (avatarPreview) {
            avatarPreview.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            avatarPreview.style.display = 'flex';
        }
        if (profileAvatar) {
            profileAvatar.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        }
    } else {
        const initial = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
        if (avatarPreview) avatarPreview.textContent = initial;
        if (profileAvatar) {
            profileAvatar.innerHTML = `<span id="profile-initial">${initial}</span>`;
        }
    }
}

async function carregarFotoPerfil() {
    if (!usuarioLogado) return;
    
    const profileAvatar = document.querySelector('.profile-avatar');
    const avatarPreview = document.getElementById('avatar-preview');
    
    let photoUrl = localStorage.getItem('userPhotoURL');
    
    if (!photoUrl && window.CacheManager) {
        photoUrl = await window.CacheManager.getProfilePhotoUrl();
    }
    
    if (!photoUrl && usuarioLogado) {
        photoUrl = usuarioLogado.avatar_url || usuarioLogado.profilePhotoUrl || usuarioLogado.foto;
    }
    
    if (photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('http'))) {
        userPhotoURL = photoUrl;
        localStorage.setItem('userPhotoURL', photoUrl);
        
        if (usuarioLogado) {
            usuarioLogado.profilePhotoUrl = photoUrl;
            usuarioLogado.avatar_url = photoUrl;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
        }
        
        if (profileAvatar) {
            profileAvatar.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        }
        if (avatarPreview) {
            avatarPreview.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            avatarPreview.style.display = 'flex';
        }
        return;
    }
    
    const initial = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
    if (profileAvatar) {
        profileAvatar.innerHTML = `<span id="profile-initial">${initial}</span>`;
    }
    if (avatarPreview) {
        avatarPreview.textContent = initial;
    }
}

async function uploadProfilePhoto(file) {
    if (!usuarioLogado) return null;
    
    if (!file.type.startsWith('image/')) {
        showToast('Selecione uma imagem válida!', 'error');
        return null;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        showToast('Imagem deve ter no máximo 2MB!', 'error');
        return null;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const profileAvatar = document.querySelector('.profile-avatar');
        const avatarPreview = document.getElementById('avatar-preview');
        if (profileAvatar) {
            profileAvatar.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
        }
        if (avatarPreview) {
            avatarPreview.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            avatarPreview.style.display = 'flex';
        }
    };
    reader.readAsDataURL(file);
    
    showToast('Enviando foto...', 'info');
    
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.uploadProfilePhoto(file);
        if (photoUrl) {
            userPhotoURL = photoUrl;
            localStorage.setItem('userPhotoURL', photoUrl);
            
            if (usuarioLogado) {
                usuarioLogado.profilePhotoUrl = photoUrl;
                usuarioLogado.avatar_url = photoUrl;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
            
            showToast('Foto atualizada e sincronizada!', 'success');
            window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl } }));
            return photoUrl;
        } else {
            showToast('Erro ao enviar foto!', 'error');
            await carregarFotoPerfil();
            return null;
        }
    } else {
        showToast('Sistema de upload não disponível', 'error');
        return null;
    }
}

async function deleteProfilePhoto() {
    if (!usuarioLogado) return false;
    
    if (window.CacheManager) {
        const deleted = await window.CacheManager.deleteProfilePhoto();
        if (deleted) {
            userPhotoURL = null;
            localStorage.removeItem('userPhotoURL');
            
            if (usuarioLogado) {
                delete usuarioLogado.profilePhotoUrl;
                delete usuarioLogado.avatar_url;
                delete usuarioLogado.foto;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            }
            
            const initial = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
            const profileAvatar = document.querySelector('.profile-avatar');
            const avatarPreview = document.getElementById('avatar-preview');
            
            if (profileAvatar) {
                profileAvatar.innerHTML = `<span id="profile-initial">${initial}</span>`;
            }
            if (avatarPreview) {
                avatarPreview.textContent = initial;
            }
            
            showToast('Foto removida!', 'success');
            return true;
        }
    }
    return false;
}

async function salvarDadosPessoais() {
    const nome = document.getElementById('profile-name-input')?.value.trim();
    const email = document.getElementById('profile-email-input')?.value.trim();
    
    if (!nome || !email) {
        showToast('Preencha nome e e-mail!', 'error');
        return;
    }
    
    usuarioLogado.nome = nome;
    usuarioLogado.email = email;
    
    try {
        const userId = usuarioLogado.id;
        if (userId && window.DatabaseService) {
            await window.DatabaseService.updateUserProfile(userId, {
                nome: nome,
                email: email
            });
        }
    } catch (dbError) {
        console.warn('[Perfil] Erro ao atualizar no banco:', dbError);
    }
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
    
    if (window.CacheManager) {
        window.CacheManager.set('usuarioLogado', usuarioLogado, true);
    }
    
    const nomeExibicao = usuarioLogado.nome || usuarioLogado.email?.split('@')[0] || 'Usuário';
    const headerName = document.querySelector('.greeting h1');
    const profileName = document.querySelector('.profile-name');
    const profileEmail = document.querySelector('.profile-email');
    
    if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
    if (profileName) profileName.textContent = nome;
    if (profileEmail) profileEmail.textContent = email;
    
    closeModal('dados-modal');
    showToast('Dados atualizados com sucesso!', 'success');
}

function loadNotificacoes() {
    const push = document.getElementById('toggle-push');
    const email = document.getElementById('toggle-email');
    const aulas = document.getElementById('toggle-aulas');
    const tarefas = document.getElementById('toggle-tarefas');
    if (push) push.checked = notificacoesSettings.push;
    if (email) email.checked = notificacoesSettings.email;
    if (aulas) aulas.checked = notificacoesSettings.aulas;
    if (tarefas) tarefas.checked = notificacoesSettings.tarefas;
}

function loadAparencia() {
    selectedTheme = appearanceSettings.theme || 'dark';
    selectedAccent = appearanceSettings.accent || '#8b5cf6';
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === selectedTheme);
    });
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
        option.classList.toggle('active', option.dataset.accent === selectedAccent);
    });
    const slider = document.getElementById('font-size-slider');
    if (slider) slider.value = appearanceSettings.fontSize || 14;
    
    document.body.style.fontSize = `${appearanceSettings.fontSize || 14}px`;
}

async function syncToCloud() {
    if (!usuarioLogado || !window.CacheManager) {
        showToast('Sincronização não disponível', 'error');
        return;
    }
    
    try {
        showToast('Sincronizando dados...', 'info');
        const result = await window.CacheManager.forceSync();
        if (result) {
            await carregarFotoPerfil();
            showToast('Dados sincronizados com sucesso!', 'success');
        } else {
            showToast('Erro ao sincronizar dados', 'error');
        }
    } catch (error) {
        console.error('Erro na sincronização:', error);
        showToast('Erro ao sincronizar dados', 'error');
    }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('👤 Iniciando perfil mobile com Supabase...');
    
    loadAllData();
    
    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        if (profileName) profileName.textContent = usuarioLogado.nome || nomeExibicao;
        if (profileEmail) profileEmail.textContent = usuarioLogado.email;
        
        if (window.initSync && !window._perfilMobileSyncInit) {
            window._perfilMobileSyncInit = true;
            await window.initSync({ force: false });
        }
        
        await carregarFotoPerfil();
    }
    
    updateNotificationBadge();
    
    // Eventos UI
    document.getElementById('notification-bell')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.add('active');
        renderNotificationsModal();
    });
    
    document.getElementById('btn-close-notifications')?.addEventListener('click', () => {
        document.getElementById('notifications-modal').classList.remove('active');
    });
    
    document.getElementById('btn-mark-read')?.addEventListener('click', markAllAsRead);
    document.getElementById('btn-clear-all')?.addEventListener('click', clearAllNotifications);
    
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    document.querySelector('.btn-change-avatar')?.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) await uploadProfilePhoto(file);
        };
        input.click();
    });
    
    document.querySelectorAll('.profile-menu .menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            
            if (action === 'dados') {
                document.getElementById('dados-modal').classList.add('active');
                loadProfileData();
            } else if (action === 'seguranca') {
                document.getElementById('seguranca-modal').classList.add('active');
            } else if (action === 'notificacoes') {
                document.getElementById('notificacoes-modal').classList.add('active');
                loadNotificacoes();
            } else if (action === 'aparencia') {
                document.getElementById('aparencia-modal').classList.add('active');
                loadAparencia();
            } else if (action === 'ajuda') {
                document.getElementById('ajuda-modal').classList.add('active');
            } else if (action === 'sincronizar') {
                syncToCloud();
            } else if (action === 'deletar-foto') {
                showConfirm('Remover sua foto de perfil?', 'Remover Foto', async (confirmed) => {
                    if (confirmed) await deleteProfilePhoto();
                });
            } else if (item.classList.contains('logout')) {
                showConfirm('Deseja realmente sair da conta?', 'Sair', (confirmed) => {
                    if (confirmed) {
                        localStorage.removeItem('usuarioLogado');
                        localStorage.removeItem('userPhotoURL');
                        if (window.CacheManager) window.CacheManager.logout();
                        window.location.href = '../../login/index.html';
                    }
                });
            }
        });
    });
    
    document.querySelectorAll('.btn-back, .btn-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modalId = btn.dataset.modal;
            if (modalId) closeModal(modalId);
            else {
                const modal = btn.closest('.profile-modal');
                if (modal) modal.classList.remove('active');
            }
        });
    });
    
    document.getElementById('btn-save-dados')?.addEventListener('click', salvarDadosPessoais);
    
    document.getElementById('btn-save-senha')?.addEventListener('click', () => {
        const currentPassword = document.getElementById('current-password')?.value;
        const newPassword = document.getElementById('new-password')?.value;
        const confirmPassword = document.getElementById('confirm-password')?.value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            showToast('Preencha todos os campos!', 'error');
            return;
        }
        if (newPassword.length < 6) {
            showToast('Senha deve ter 6+ caracteres!', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('Senhas não coincidem!', 'error');
            return;
        }
        showToast('Para alterar a senha, use "Esqueci minha senha" no login', 'info');
        closeModal('seguranca-modal');
    });
    
    document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
        notificacoesSettings = {
            push: document.getElementById('toggle-push')?.checked,
            email: document.getElementById('toggle-email')?.checked,
            aulas: document.getElementById('toggle-aulas')?.checked,
            tarefas: document.getElementById('toggle-tarefas')?.checked
        };
        salvarTodosDados();
        closeModal('notificacoes-modal');
        showToast('Notificações salvas!', 'success');
    });
    
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTheme = btn.dataset.theme;
            document.body.classList.toggle('dark-mode', selectedTheme === 'dark');
        });
    });
    
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#aparencia-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedAccent = option.dataset.accent;
            document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        });
    });
    
    document.getElementById('font-size-slider')?.addEventListener('input', (e) => {
        document.body.style.fontSize = `${e.target.value}px`;
    });
    
    document.getElementById('btn-save-aparencia')?.addEventListener('click', () => {
        appearanceSettings = {
            theme: selectedTheme,
            accent: selectedAccent,
            fontSize: document.getElementById('font-size-slider')?.value || 14
        };
        salvarTodosDados();
        document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        closeModal('aparencia-modal');
        showToast('Aparência salva!', 'success');
    });
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            if (view === 'home') window.location.href = '../index.html';
            else if (view === 'calendar') window.location.href = '../calendario/index.html';
            else if (view === 'tasks') window.location.href = '../tarefas/index.html';
            else if (view === 'notes') window.location.href = '../notas/index.html';
        });
    });
    
    // Listeners globais
    window.addEventListener('cloudDataLoaded', async () => {
        console.log('[Perfil Mobile] 📡 Dados da nuvem carregados!');
        loadAllData();
        loadProfileData();
        await carregarFotoPerfil();
        updateNotificationBadge();
        showToast('🔄 Dados sincronizados!', 'success');
    });
    
    window.addEventListener('profilePhotoUpdated', async (event) => {
        if (event.detail && event.detail.photoUrl) {
            userPhotoURL = event.detail.photoUrl;
            const profileAvatar = document.querySelector('.profile-avatar');
            const avatarPreview = document.getElementById('avatar-preview');
            if (profileAvatar) {
                profileAvatar.innerHTML = `<img src="${event.detail.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${event.detail.photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
        }
    });
    
    console.log('✅ Perfil mobile com Supabase inicializado!');
});

console.log('%c👤 Perfil Mobile - Supabase Apenas!', 'color: #8b5cf6; font-size: 16px; font-weight: bold;');