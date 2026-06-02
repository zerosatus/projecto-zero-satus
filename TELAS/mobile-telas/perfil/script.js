// Perfil Mobile - Configurações do usuário

let notifications = [];
let usuarioLogado = null;
let notificacoesSettings = {};
let appearanceSettings = {};
let selectedTheme = 'dark';
let selectedAccent = '#8b5cf6';
let userPhotoURL = null;
let profilePhotoUnsubscribe = null;

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

function saveAllData() {
    window.setCached('usuarioLogado', usuarioLogado);
    window.setCached('notifications', notifications);
    window.setCached('notificacoesSettings', notificacoesSettings);
    window.setCached('appearanceSettings', appearanceSettings);
    
    if (userPhotoURL) {
        localStorage.setItem('userPhotoURL', userPhotoURL);
    }
}

function loadAllData() {
    usuarioLogado = window.getCached('usuarioLogado', window.getDefaultUser());
    
    if (!usuarioLogado || !usuarioLogado.email) {
        window.location.href = '../../login/index.html';
        return;
    }
    
    notifications = window.getCached('notifications', window.getDefaultNotifications());
    notificacoesSettings = window.getCached('notificacoesSettings', window.getDefaultNotificacoesSettings());
    appearanceSettings = window.getCached('appearanceSettings', window.getDefaultAppearanceSettings());
    userPhotoURL = localStorage.getItem('userPhotoURL');
    
    if (appearanceSettings.accent) {
        document.documentElement.style.setProperty('--accent-purple', appearanceSettings.accent);
    }
}

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
        const iconMap = { 'aula': 'book', 'tarefa': 'checkbox', 'lembrete': 'time' };
        html += `<div class="notification-item-modal ${notif.read ? 'read' : 'unread'}" data-id="${notif.id}">
            <div class="notification-icon ${notif.type}">
                <ion-icon name="${iconMap[notif.type] || 'notifications'}-outline"></ion-icon>
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
    window.setCached('notifications', notifications);
    showToast('Todas notificações marcadas como lidas!', 'success');
}

function clearAllNotifications() {
    showConfirm('Limpar todas as notificações?', 'Atenção', (confirmed) => {
        if (confirmed) {
            notifications = [];
            updateNotificationBadge();
            renderNotificationsModal();
            window.setCached('notifications', notifications);
            showToast('Notificações limpas!', 'success');
        }
    });
}

function loadProfileData() {
    if (usuarioLogado) {
        const nameInput = document.getElementById('profile-name-input');
        const emailInput = document.getElementById('profile-email-input');
        const avatarPreview = document.getElementById('avatar-preview');
        const profileAvatar = document.getElementById('profile-avatar');
        
        if (nameInput) nameInput.value = usuarioLogado.nome || '';
        if (emailInput) emailInput.value = usuarioLogado.email || '';
        
        // Atualizar avatar
        if (userPhotoURL) {
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                avatarPreview.style.display = 'flex';
                avatarPreview.style.alignItems = 'center';
                avatarPreview.style.justifyContent = 'center';
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
}

// ========== FUNÇÕES DE FOTO DE PERFIL COM STORAGE ==========

async function carregarFotoPerfil() {
    if (!usuarioLogado) return;
    
    const profileAvatar = document.querySelector('.profile-avatar');
    const profileInitial = document.getElementById('profile-initial');
    const avatarPreview = document.getElementById('avatar-preview');
    
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        
        if (photoUrl) {
            userPhotoURL = photoUrl;
            usuarioLogado.profilePhotoUrl = photoUrl;
            localStorage.setItem('userPhotoURL', photoUrl);
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
            if (profileAvatar) {
                profileAvatar.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                avatarPreview.style.display = 'flex';
                avatarPreview.style.alignItems = 'center';
                avatarPreview.style.justifyContent = 'center';
            }
        } else if (userPhotoURL && userPhotoURL.startsWith('data:')) {
            // Avatar antigo em base64
            if (profileAvatar) {
                profileAvatar.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                avatarPreview.style.display = 'flex';
            }
        } else {
            // Avatar padrão com iniciais
            const initial = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
            if (profileAvatar) {
                profileAvatar.innerHTML = `<span id="profile-initial">${initial}</span>`;
            }
            if (avatarPreview) {
                avatarPreview.textContent = initial;
            }
        }
    } else {
        // Fallback localStorage
        if (userPhotoURL) {
            if (profileAvatar) {
                profileAvatar.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
            if (avatarPreview) {
                avatarPreview.innerHTML = `<img src="${userPhotoURL}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                avatarPreview.style.display = 'flex';
            }
        } else {
            const initial = usuarioLogado.nome ? usuarioLogado.nome.charAt(0).toUpperCase() : 'U';
            if (profileAvatar) {
                profileAvatar.innerHTML = `<span id="profile-initial">${initial}</span>`;
            }
            if (avatarPreview) {
                avatarPreview.textContent = initial;
            }
        }
    }
}

async function uploadProfilePhoto(file) {
    if (!usuarioLogado) return null;
    
    // Validar arquivo
    if (!file.type.startsWith('image/')) {
        showToast('Selecione uma imagem válida!', 'error');
        return null;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showToast('Imagem deve ter no máximo 5MB!', 'error');
        return null;
    }
    
    // Mostrar preview local imediatamente
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
            usuarioLogado.profilePhotoUrl = photoUrl;
            localStorage.setItem('userPhotoURL', photoUrl);
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
            showToast('Foto atualizada e sincronizada!', 'success');
            
            // Disparar evento para outras telas
            window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl } }));
            
            return photoUrl;
        } else {
            showToast('Erro ao enviar foto!', 'error');
            await carregarFotoPerfil();
            return null;
        }
    } else {
        // Fallback: salvar apenas localmente
        const profileAvatar = document.querySelector('.profile-avatar img');
        if (profileAvatar && profileAvatar.src) {
            userPhotoURL = profileAvatar.src;
            localStorage.setItem('userPhotoURL', userPhotoURL);
            showToast('Foto salva localmente (sem nuvem)', 'success');
        }
        return null;
    }
}

async function deleteProfilePhoto() {
    if (!usuarioLogado) return false;
    
    if (window.CacheManager) {
        const deleted = await window.CacheManager.deleteProfilePhoto();
        
        if (deleted) {
            userPhotoURL = null;
            delete usuarioLogado.profilePhotoUrl;
            localStorage.removeItem('userPhotoURL');
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            
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

function iniciarEscutaFotoMobile() {
    if (!usuarioLogado) return;
    
    const userId = usuarioLogado.uid || usuarioLogado.email;
    
    if (window.FirebaseStorage && window.FirebaseStorage.listenProfilePhoto) {
        profilePhotoUnsubscribe = window.FirebaseStorage.listenProfilePhoto(userId, (photoUrl) => {
            if (photoUrl) {
                console.log('[Mobile Perfil] Foto atualizada em tempo real!');
                userPhotoURL = photoUrl;
                usuarioLogado.profilePhotoUrl = photoUrl;
                localStorage.setItem('userPhotoURL', photoUrl);
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
                
                const profileAvatar = document.querySelector('.profile-avatar');
                const avatarPreview = document.getElementById('avatar-preview');
                
                if (profileAvatar) {
                    profileAvatar.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                }
                if (avatarPreview) {
                    avatarPreview.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                    avatarPreview.style.display = 'flex';
                }
            }
        });
    }
}

function pararEscutaFotoMobile() {
    if (profilePhotoUnsubscribe) {
        profilePhotoUnsubscribe();
        profilePhotoUnsubscribe = null;
    }
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
    
    // Aplicar fonte
    document.body.style.fontSize = `${appearanceSettings.fontSize || 14}px`;
}

window.toggleFaq = function(element) {
    element.classList.toggle('active');
};

function switchView(viewName) {
    if (viewName === 'home') {
        window.location.href = '../index.html';
    } else if (viewName === 'calendar') {
        window.location.href = '../calendario/index.html';
    } else if (viewName === 'tasks') {
        window.location.href = '../tarefas/index.html';
    } else if (viewName === 'notes') {
        window.location.href = '../notas/index.html';
    } else if (viewName === 'profile') {
        loadProfileData();
        carregarFotoPerfil();
    }
}

async function syncToCloud() {
    if (!usuarioLogado || !usuarioLogado.uid) {
        showToast('Faça login primeiro!', 'error');
        return;
    }
    
    try {
        showToast('Sincronizando dados...', 'info');
        
        const allData = {
            usuarioLogado: usuarioLogado,
            notifications: notifications,
            notificacoesSettings: notificacoesSettings,
            appearanceSettings: appearanceSettings,
            userPhotoURL: userPhotoURL,
            weeklySchedule: window.weeklySchedule || {},
            timeSlots: window.timeSlots || [],
            calendarEvents: window.calendarEvents || [],
            tasks: window.tasks || [],
            notes: window.notes || []
        };
        
        if (window.FirebaseSync) {
            const result = await window.FirebaseSync.syncAllDataToCloud(usuarioLogado.uid, allData);
            if (result) {
                showToast('Dados sincronizados com sucesso!', 'success');
            } else {
                showToast('Erro ao sincronizar dados', 'error');
            }
        } else {
            showToast('Firebase não disponível', 'error');
        }
    } catch (error) {
        console.error('Erro na sincronização:', error);
        showToast('Erro ao sincronizar dados', 'error');
    }
}

// Inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', async () => {
    if (window.CacheManager) window.CacheManager.init();
    loadAllData();
    
    if (usuarioLogado) {
        const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
        const headerName = document.getElementById('header-name');
        const profileName = document.getElementById('profile-name');
        const profileEmail = document.getElementById('profile-email');
        
        if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
        if (profileName) profileName.textContent = usuarioLogado.nome || nomeExibicao;
        if (profileEmail) profileEmail.textContent = usuarioLogado.email;
    }
    
    updateNotificationBadge();
    await carregarFotoPerfil();
    iniciarEscutaFotoMobile();
    
    // Botão de notificações
    const notificationBell = document.getElementById('notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) {
                modal.classList.add('active');
                renderNotificationsModal();
            }
        });
    }
    
    // Fechar modal de notificações
    const closeNotificationsBtn = document.getElementById('btn-close-notifications');
    if (closeNotificationsBtn) {
        closeNotificationsBtn.addEventListener('click', () => {
            const modal = document.getElementById('notifications-modal');
            if (modal) modal.classList.remove('active');
        });
    }
    
    // Botões de notificações
    const markReadBtn = document.getElementById('btn-mark-read');
    if (markReadBtn) markReadBtn.addEventListener('click', markAllAsRead);
    
    const clearAllBtn = document.getElementById('btn-clear-all');
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllNotifications);
    
    // Tabs de notificações
    document.querySelectorAll('.notification-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.notification-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderNotificationsModal(tab.dataset.type);
        });
    });
    
    // Upload de avatar
    const btnChangeAvatar = document.querySelector('.btn-change-avatar');
    if (btnChangeAvatar) {
        btnChangeAvatar.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await uploadProfilePhoto(file);
                }
            };
            input.click();
        });
    }
    
    // Menu do perfil
    const profileMenuItems = document.querySelectorAll('.profile-menu .menu-item');
    profileMenuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            
            if (action === 'dados') {
                const modal = document.getElementById('dados-modal');
                if (modal) {
                    modal.classList.add('active');
                    loadProfileData();
                }
            } else if (action === 'seguranca') {
                const modal = document.getElementById('seguranca-modal');
                if (modal) modal.classList.add('active');
            } else if (action === 'notificacoes') {
                const modal = document.getElementById('notificacoes-modal');
                if (modal) {
                    modal.classList.add('active');
                    loadNotificacoes();
                }
            } else if (action === 'aparencia') {
                const modal = document.getElementById('aparencia-modal');
                if (modal) {
                    modal.classList.add('active');
                    loadAparencia();
                }
            } else if (action === 'ajuda') {
                const modal = document.getElementById('ajuda-modal');
                if (modal) modal.classList.add('active');
            } else if (action === 'sincronizar') {
                syncToCloud();
            } else if (action === 'deletar-foto') {
                showConfirm('Remover sua foto de perfil?', 'Remover Foto', async (confirmed) => {
                    if (confirmed) await deleteProfilePhoto();
                });
            } else if (item.classList.contains('logout')) {
                showConfirm('Deseja realmente sair da conta?', 'Sair', (confirmed) => {
                    if (confirmed) {
                        pararEscutaFotoMobile();
                        localStorage.removeItem('usuarioLogado');
                        localStorage.removeItem('userPhotoURL');
                        window.location.href = '../../login/index.html';
                    }
                });
            }
        });
    });
    
    // Fechar modais com botão back
    document.querySelectorAll('.btn-back, .btn-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modalId = btn.dataset.modal;
            if (modalId) {
                closeModal(modalId);
            } else {
                const modal = btn.closest('.profile-modal');
                if (modal) modal.classList.remove('active');
            }
        });
    });
    
    // Salvar dados pessoais
    const saveDadosBtn = document.getElementById('btn-save-dados');
    if (saveDadosBtn) {
        saveDadosBtn.addEventListener('click', () => {
            const nome = document.getElementById('profile-name-input')?.value.trim();
            const email = document.getElementById('profile-email-input')?.value.trim();
            
            if (!nome || !email) {
                showToast('Preencha nome e e-mail!', 'error');
                return;
            }
            
            usuarioLogado.nome = nome;
            usuarioLogado.email = email;
            saveAllData();
            
            const nomeExibicao = usuarioLogado.nome || usuarioLogado.displayName || usuarioLogado.email?.split('@')[0] || 'Usuário';
            const headerName = document.querySelector('.greeting h1');
            const profileName = document.querySelector('.profile-name');
            const profileEmail = document.querySelector('.profile-email');
            
            if (headerName) headerName.textContent = nomeExibicao.split(' ')[0];
            if (profileName) profileName.textContent = nome;
            if (profileEmail) profileEmail.textContent = email;
            
            // Atualizar avatar preview se não tiver foto
            if (!userPhotoURL) {
                const avatarPreview = document.getElementById('avatar-preview');
                const profileInitial = document.getElementById('profile-initial');
                const initial = nome.charAt(0).toUpperCase();
                if (avatarPreview) avatarPreview.textContent = initial;
                if (profileInitial) profileInitial.textContent = initial;
            }
            
            closeModal('dados-modal');
            showToast('Dados atualizados!', 'success');
        });
    }
    
    // Salvar senha
    const saveSenhaBtn = document.getElementById('btn-save-senha');
    if (saveSenhaBtn) {
        saveSenhaBtn.addEventListener('click', () => {
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
            
            // Verificar senha atual (simulação)
            if (currentPassword !== usuarioLogado.senha && usuarioLogado.senha !== '123456') {
                showToast('Senha atual incorreta!', 'error');
                return;
            }
            
            usuarioLogado.senha = newPassword;
            saveAllData();
            
            closeModal('seguranca-modal');
            showToast('Senha alterada!', 'success');
            
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        });
    }
    
    // Salvar notificações
    const saveNotificacoesBtn = document.getElementById('btn-save-notificacoes');
    if (saveNotificacoesBtn) {
        saveNotificacoesBtn.addEventListener('click', () => {
            notificacoesSettings = {
                push: document.getElementById('toggle-push')?.checked,
                email: document.getElementById('toggle-email')?.checked,
                aulas: document.getElementById('toggle-aulas')?.checked,
                tarefas: document.getElementById('toggle-tarefas')?.checked
            };
            saveAllData();
            closeModal('notificacoes-modal');
            showToast('Notificações salvas!', 'success');
        });
    }
    
    // Tema
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedTheme = btn.dataset.theme;
            
            // Aplicar tema
            if (selectedTheme === 'light') {
                document.documentElement.style.setProperty('--bg-color', '#ffffff');
                document.documentElement.style.setProperty('--card-bg', '#f3f4f6');
                document.documentElement.style.setProperty('--text-primary', '#111827');
                document.documentElement.style.setProperty('--text-secondary', '#6b7280');
                document.documentElement.style.setProperty('--border-color', '#e5e7eb');
                document.documentElement.style.setProperty('--nav-bg', '#ffffff');
            } else {
                document.documentElement.style.setProperty('--bg-color', '#0f1115');
                document.documentElement.style.setProperty('--card-bg', '#1a1d24');
                document.documentElement.style.setProperty('--text-primary', '#ffffff');
                document.documentElement.style.setProperty('--text-secondary', '#9ca3af');
                document.documentElement.style.setProperty('--border-color', '#2d3748');
                document.documentElement.style.setProperty('--nav-bg', '#1a1d24');
            }
        });
    });
    
    // Cores
    document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('#aparencia-modal .color-option').forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            selectedAccent = option.dataset.accent;
            document.documentElement.style.setProperty('--accent-purple', selectedAccent);
        });
    });
    
    // Tamanho da fonte
    const fontSizeSlider = document.getElementById('font-size-slider');
    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', (e) => {
            const size = e.target.value;
            document.body.style.fontSize = `${size}px`;
        });
    }
    
    // Salvar aparência
    const saveAparenciaBtn = document.getElementById('btn-save-aparencia');
    if (saveAparenciaBtn) {
        saveAparenciaBtn.addEventListener('click', () => {
            appearanceSettings = {
                theme: selectedTheme,
                accent: selectedAccent,
                fontSize: document.getElementById('font-size-slider')?.value || 14
            };
            saveAllData();
            document.documentElement.style.setProperty('--accent-purple', selectedAccent);
            closeModal('aparencia-modal');
            showToast('Aparência salva!', 'success');
        });
    }
    
    // Ajuda
    const contatoBtn = document.getElementById('btn-contato');
    if (contatoBtn) contatoBtn.addEventListener('click', () => {
        window.open('https://wa.me/nao disponivel', '_blank');
    });
    
    const termosBtn = document.getElementById('btn-termos');
    if (termosBtn) termosBtn.addEventListener('click', () => {
        showToast('Termos de Uso em desenvolvimento!', 'info');
    });
    
    const privacidadeBtn = document.getElementById('btn-privacidade');
    if (privacidadeBtn) privacidadeBtn.addEventListener('click', () => {
        showToast('Política de Privacidade em desenvolvimento!', 'info');
    });
    
    const avaliarBtn = document.getElementById('btn-avaliar');
    if (avaliarBtn) avaliarBtn.addEventListener('click', () => {
        showToast('Obrigado por avaliar! ⭐⭐⭐⭐⭐', 'success');
    });
    
    // Navegação inferior
    document.querySelectorAll('.bottom-nav .nav-item').forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });
});

// =====================================================
// NOTIFICAÇÕES NATIVAS PARA ANDROID (COMPARTILHADAS)
// =====================================================

function isAndroidApp() {
    return typeof Android !== 'undefined';
}

function sendNativeNotification(title, message, type) {
    if (isAndroidApp()) {
        try {
            Android.showNotification(title, message, type);
        } catch(e) {}
    }
}

function checkPendingTasks() {
    const tasks = window.getCached ? window.getCached('tasks', []) : [];
    const today = new Date().toISOString().split('T')[0];
    tasks.forEach(task => {
        if (!task.completed && task.date === today) {
            sendNativeNotification('📋 Tarefa Hoje', task.title, 'tarefa');
        }
    });
}

function checkUpcomingClasses() {
    const schedule = window.getCached ? window.getCached('weeklySchedule', {}) : {};
    const now = new Date();
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const today = days[now.getDay()];
    const currentTotal = now.getHours() * 60 + now.getMinutes();
    
    (schedule[today] || []).forEach(cls => {
        if (cls.horaInicio) {
            const [h, m] = cls.horaInicio.split(':').map(Number);
            const minutesUntil = (h * 60 + m) - currentTotal;
            if (minutesUntil <= 15 && minutesUntil > 0) {
                sendNativeNotification('📚 Aula em Breve', cls.materia, 'aula');
            }
        }
    });
}

// Executar verificações
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 2000);
        setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);
    });
} else {
    setTimeout(() => { checkPendingTasks(); checkUpcomingClasses(); }, 2000);
    setInterval(() => { checkPendingTasks(); checkUpcomingClasses(); }, 15 * 60 * 1000);
}