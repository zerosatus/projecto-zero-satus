// ============================================
// modules/perfil.js - PERFIL COMPLETO (COM DIAGNÓSTICO)
// ============================================

class PerfilModule {
    constructor(app) {
        this.app = app;
        this.name = 'perfil';
        this.selectedTheme = 'dark';
        this.selectedAccent = '#8b5cf6';
        this.userPhotoURL = null;
        this.notificacoesSettings = {};
        this.appearanceSettings = {};
        
        console.log('[Perfil] 👤 Módulo inicializado');
    }
    
    // ============================================
    // RENDER PRINCIPAL
    // ============================================
    render(data) {
        console.log('[Perfil] 👤 Renderizando...');
        
        this.profile = data.profile || {};
        this.settings = data.settings || {};
        this.notifications = data.notifications || [];
        
        this.renderProfile();
        this.setupEvents();
        this.updateBadge();
    }
    
    // ============================================
    // RENDER PERFIL
    // ============================================
    renderProfile() {
        const profile = this.profile || {};
        const settings = this.settings || {};
        
        // Nome e email
        document.getElementById('profile-name').textContent = profile.nome || 'Usuário';
        document.getElementById('profile-email').textContent = profile.email || 'usuario@email.com';
        
        // Avatar
        this.carregarAvatar();
        
        // Role (se for admin)
        const roleEl = document.querySelector('.profile-role');
        if (roleEl && profile.role === 'admin') {
            roleEl.textContent = '👑 ADMIN';
            roleEl.style.display = 'inline-block';
        } else if (roleEl) {
            roleEl.style.display = 'none';
        }
        
        // Aparência
        this.selectedTheme = settings.theme || 'dark';
        this.selectedAccent = settings.accent || '#8b5cf6';
        document.documentElement.style.setProperty('--accent-purple', this.selectedAccent);
    }
    
    // ============================================
    // AVATAR
    // ============================================
    async carregarAvatar() {
        const avatarEl = document.getElementById('profile-avatar');
        const previewEl = document.getElementById('avatar-preview');
        if (!avatarEl) return;
        
        let photoUrl = localStorage.getItem('userPhotoURL');
        
        if (!photoUrl && window.CacheManager) {
            try {
                photoUrl = await window.CacheManager.getProfilePhotoUrl();
            } catch(e) {}
        }
        
        if (!photoUrl && this.profile) {
            photoUrl = this.profile.avatar_url;
        }
        
        if (photoUrl && (photoUrl.startsWith('data:') || photoUrl.startsWith('http'))) {
            this.userPhotoURL = photoUrl;
            localStorage.setItem('userPhotoURL', photoUrl);
            
            // Atualizar avatar na view
            const initial = this.profile.nome ? this.profile.nome.charAt(0).toUpperCase() : 'U';
            avatarEl.innerHTML = `
                <img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
                <div class="avatar-edit-badge">
                    <ion-icon name="camera-outline"></ion-icon>
                </div>
            `;
            
            // Atualizar preview no modal
            if (previewEl) {
                previewEl.innerHTML = `<img src="${photoUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
                previewEl.style.display = 'flex';
            }
        } else {
            const initial = this.profile.nome ? this.profile.nome.charAt(0).toUpperCase() : 'U';
            avatarEl.innerHTML = `
                <span>${initial}</span>
                <div class="avatar-edit-badge">
                    <ion-icon name="camera-outline"></ion-icon>
                </div>
            `;
            
            if (previewEl) {
                previewEl.innerHTML = `<span>${initial}</span>`;
            }
        }
    }
    
    // ============================================
    // UPLOAD FOTO
    // ============================================
    async uploadProfilePhoto(file) {
        if (!file || !file.type.startsWith('image/')) {
            if (typeof showToast === 'function') {
                showToast('Selecione uma imagem válida!', 'error');
            }
            return null;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            if (typeof showToast === 'function') {
                showToast('Imagem deve ter no máximo 2MB!', 'error');
            }
            return null;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarEl = document.getElementById('profile-avatar');
            if (avatarEl) {
                avatarEl.innerHTML = `
                    <img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
                    <div class="avatar-edit-badge">
                        <ion-icon name="camera-outline"></ion-icon>
                    </div>
                `;
            }
            const previewEl = document.getElementById('avatar-preview');
            if (previewEl) {
                previewEl.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
            }
        };
        reader.readAsDataURL(file);
        
        if (typeof showToast === 'function') {
            showToast('📤 Enviando foto...', 'info');
        }
        
        if (window.CacheManager) {
            try {
                const photoUrl = await window.CacheManager.uploadProfilePhoto(file);
                if (photoUrl) {
                    this.userPhotoURL = photoUrl;
                    localStorage.setItem('userPhotoURL', photoUrl);
                    
                    if (this.profile) {
                        this.profile.avatar_url = photoUrl;
                        this.app.data.profile = this.profile;
                        await this.app.saveAllData();
                    }
                    
                    if (typeof showToast === 'function') {
                        showToast('✅ Foto atualizada!', 'success');
                    }
                    
                    window.dispatchEvent(new CustomEvent('profilePhotoUpdated', {
                        detail: { photoUrl }
                    }));
                    
                    return photoUrl;
                }
            } catch (error) {
                console.error('[Perfil] Erro ao enviar foto:', error);
                if (typeof showToast === 'function') {
                    showToast('❌ Erro ao enviar foto', 'error');
                }
            }
        }
        
        return null;
    }
    
    // ============================================
    // DELETAR FOTO
    // ============================================
    async deleteProfilePhoto() {
        if (!confirm('Remover sua foto de perfil?')) return;
        
        if (window.CacheManager) {
            try {
                const deleted = await window.CacheManager.deleteProfilePhoto();
                if (deleted) {
                    this.userPhotoURL = null;
                    localStorage.removeItem('userPhotoURL');
                    
                    if (this.profile) {
                        this.profile.avatar_url = null;
                        this.app.data.profile = this.profile;
                        await this.app.saveAllData();
                    }
                    
                    this.carregarAvatar();
                    
                    if (typeof showToast === 'function') {
                        showToast('🗑️ Foto removida!', 'success');
                    }
                    return true;
                }
            } catch (error) {
                console.error('[Perfil] Erro ao remover foto:', error);
                if (typeof showToast === 'function') {
                    showToast('❌ Erro ao remover foto', 'error');
                }
            }
        }
        return false;
    }
    
    // ============================================
    // SALVAR DADOS PESSOAIS
    // ============================================
    async salvarDadosPessoais() {
        const nomeInput = document.getElementById('profile-name-input');
        const emailInput = document.getElementById('profile-email-input');
        
        if (!nomeInput || !emailInput) return;
        
        const nome = nomeInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!nome || !email) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Preencha nome e e-mail!', 'error');
            }
            return;
        }
        
        this.profile.nome = nome;
        this.profile.email = email;
        this.app.data.profile = this.profile;
        
        // Salvar no Supabase
        try {
            const userId = this.app.user.id;
            if (userId && window.DatabaseService) {
                await window.DatabaseService.updateUserProfile(userId, {
                    nome: nome,
                    email: email
                });
            }
        } catch (error) {
            console.warn('[Perfil] Erro ao atualizar no banco:', error);
        }
        
        await this.app.saveAllData();
        
        // Atualizar UI
        document.getElementById('profile-name').textContent = nome;
        document.getElementById('profile-email').textContent = email;
        document.getElementById('header-name').textContent = nome.split(' ')[0];
        
        this.fecharModal('dados-modal');
        
        if (typeof showToast === 'function') {
            showToast('✅ Dados atualizados!', 'success');
        }
    }
    
    // ============================================
    // SALVAR NOTIFICAÇÕES
    // ============================================
    async salvarNotificacoes() {
        const push = document.getElementById('toggle-push')?.checked || false;
        const email = document.getElementById('toggle-email')?.checked || false;
        const aulas = document.getElementById('toggle-aulas')?.checked || false;
        const tarefas = document.getElementById('toggle-tarefas')?.checked || false;
        
        this.notificacoesSettings = { push, email, aulas, tarefas };
        
        this.app.data.settings.notifications_settings = this.notificacoesSettings;
        await this.app.saveAllData();
        
        this.fecharModal('notificacoes-modal');
        
        if (typeof showToast === 'function') {
            showToast('✅ Notificações salvas!', 'success');
        }
    }
    
    // ============================================
    // SALVAR APARÊNCIA
    // ============================================
    async salvarAparencia() {
        const fontSize = document.getElementById('font-size-slider')?.value || 14;
        
        this.appearanceSettings = {
            theme: this.selectedTheme,
            accent: this.selectedAccent,
            fontSize: parseInt(fontSize)
        };
        
        this.app.data.settings = this.appearanceSettings;
        await this.app.saveAllData();
        
        // Aplicar visualmente
        document.documentElement.style.setProperty('--accent-purple', this.selectedAccent);
        document.body.style.fontSize = fontSize + 'px';
        
        this.fecharModal('aparencia-modal');
        
        if (typeof showToast === 'function') {
            showToast('✅ Aparência salva!', 'success');
        }
    }
    
    // ============================================
    // CARREGAR DADOS NOS MODAIS
    // ============================================
    loadDadosPessoais() {
        const nomeInput = document.getElementById('profile-name-input');
        const emailInput = document.getElementById('profile-email-input');
        if (nomeInput) nomeInput.value = this.profile.nome || '';
        if (emailInput) emailInput.value = this.profile.email || '';
        this.carregarAvatar();
    }
    
    loadNotificacoes() {
        const settings = this.app.data.settings?.notifications_settings || {};
        const push = document.getElementById('toggle-push');
        const email = document.getElementById('toggle-email');
        const aulas = document.getElementById('toggle-aulas');
        const tarefas = document.getElementById('toggle-tarefas');
        
        if (push) push.checked = settings.push !== undefined ? settings.push : true;
        if (email) email.checked = settings.email || false;
        if (aulas) aulas.checked = settings.aulas !== undefined ? settings.aulas : true;
        if (tarefas) tarefas.checked = settings.tarefas !== undefined ? settings.tarefas : true;
    }
    
    loadAparencia() {
        const settings = this.app.data.settings || {};
        this.selectedTheme = settings.theme || 'dark';
        this.selectedAccent = settings.accent || '#8b5cf6';
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === this.selectedTheme);
        });
        
        document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
            option.classList.toggle('active', option.dataset.accent === this.selectedAccent);
        });
        
        const slider = document.getElementById('font-size-slider');
        if (slider) slider.value = settings.fontSize || 14;
        
        document.documentElement.style.setProperty('--accent-purple', this.selectedAccent);
    }
    
    // ============================================
    // FUNÇÕES DE MODAL
    // ============================================
    abrirModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.add('active');
    }
    
    fecharModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('active');
    }
    
    // ============================================
    // ⭐ DIAGNÓSTICO
    // ============================================
    diagnostico() {
        console.log('========== 🔍 DIAGNÓSTICO ==========');
        console.log('1. Supabase Client:', !!window.supabaseClient);
        console.log('2. AuthService:', !!window.AuthService);
        console.log('3. DatabaseService:', !!window.DatabaseService);
        console.log('4. CacheManager:', !!window.CacheManager);
        console.log('5. SyncHelper:', typeof window.initSync === 'function');
        console.log('6. SyncHelper inicializado:', window.getSyncStatus ? window.getSyncStatus().initialized : 'N/A');
        console.log('7. Usuário ID:', this.app.user?.id);
        console.log('8. Usuário Nome:', this.app.user?.nome);
        console.log('9. Dados no app:', {
            tasks: this.app.data.tasks?.length || 0,
            notes: this.app.data.notes?.length || 0,
            events: this.app.data.calendarEvents?.length || 0,
            schedule: Object.keys(this.app.data.weeklySchedule || {}).length
        });
        console.log('10. Cache Status:', window.getCacheStatus ? window.getCacheStatus() : 'N/A');
        console.log('11. Fila de salvamento:', window.CacheManager?._saveQueue?.length || 0);
        console.log('12. Status do Sync:', window.getSyncStatus ? window.getSyncStatus() : 'Não disponível');
        
        // Tentar forçar sync manualmente
        if (window.CacheManager) {
            console.log('🔄 Forçando sync manual...');
            window.CacheManager.forceSync().then(result => {
                console.log('✅ Sync manual concluído:', result ? 'Sucesso com alterações' : 'Sucesso sem alterações');
                if (typeof showToast === 'function') {
                    showToast(result ? '✅ Sincronização concluída!' : '✅ Dados já estão sincronizados', 'success');
                }
            }).catch(error => {
                console.error('❌ Sync manual falhou:', error);
                if (typeof showToast === 'function') {
                    showToast('❌ Erro na sincronização: ' + error.message, 'error');
                }
            });
        }
        
        alert('🔍 Diagnóstico concluído! Verifique o console (F12) para mais detalhes.');
    }
    
    // ============================================
    // LOGOUT
    // ============================================
    logout() {
        if (!confirm('Deseja realmente sair da conta?')) return;
        
        // Sincronizar antes de sair
        if (window.CacheManager) {
            window.CacheManager.forceSync().then(() => {
                console.log('[Perfil] Dados sincronizados antes do logout');
            }).catch(() => {});
        }
        
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem('userPhotoURL');
        
        if (window.CacheManager) {
            window.CacheManager.logout();
        }
        
        window.location.href = '../login/index.html';
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notification-badge');
        if (!badge) return;
        
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
        badge.style.display = naoLidas > 0 ? 'flex' : 'none';
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Menu items
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                
                switch(action) {
                    case 'dados':
                        this.loadDadosPessoais();
                        this.abrirModal('dados-modal');
                        break;
                    case 'seguranca':
                        this.abrirModal('seguranca-modal');
                        break;
                    case 'notificacoes':
                        this.loadNotificacoes();
                        this.abrirModal('notificacoes-modal');
                        break;
                    case 'aparencia':
                        this.loadAparencia();
                        this.abrirModal('aparencia-modal');
                        break;
                    case 'ajuda':
                        this.abrirModal('ajuda-modal');
                        break;
                    case 'deletar-foto':
                        this.deleteProfilePhoto();
                        break;
                    case 'sincronizar':
                        this.forceSync();
                        break;
                    case 'diagnostico':
                        this.diagnostico();
                        break;
                    case 'logout':
                        this.logout();
                        break;
                }
            });
        });
        
        // Fechar modais
        document.querySelectorAll('.btn-back-modal, .btn-close-modal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const modal = btn.closest('.profile-modal');
                if (modal) modal.classList.remove('active');
            });
        });
        
        // Fechar modais clicando fora
        document.querySelectorAll('.profile-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Avatar - upload
        document.querySelector('.btn-change-avatar')?.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) this.uploadProfilePhoto(file);
            };
            input.click();
        });
        
        // Salvar dados pessoais
        document.getElementById('btn-save-dados')?.addEventListener('click', () => {
            this.salvarDadosPessoais();
        });
        
        // Salvar senha (placeholder)
        document.getElementById('btn-save-senha')?.addEventListener('click', () => {
            const current = document.getElementById('current-password')?.value;
            const newPass = document.getElementById('new-password')?.value;
            const confirm = document.getElementById('confirm-password')?.value;
            
            if (!current || !newPass || !confirm) {
                if (typeof showToast === 'function') {
                    showToast('⚠️ Preencha todos os campos!', 'error');
                }
                return;
            }
            if (newPass.length < 6) {
                if (typeof showToast === 'function') {
                    showToast('⚠️ Senha deve ter 6+ caracteres!', 'error');
                }
                return;
            }
            if (newPass !== confirm) {
                if (typeof showToast === 'function') {
                    showToast('⚠️ Senhas não coincidem!', 'error');
                }
                return;
            }
            
            if (typeof showToast === 'function') {
                showToast('🔐 Use "Esqueci minha senha" no login', 'info');
            }
            this.fecharModal('seguranca-modal');
        });
        
        // Salvar notificações
        document.getElementById('btn-save-notificacoes')?.addEventListener('click', () => {
            this.salvarNotificacoes();
        });
        
        // Salvar aparência
        document.getElementById('btn-save-aparencia')?.addEventListener('click', () => {
            this.salvarAparencia();
        });
        
        // Temas
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.selectedTheme = btn.dataset.theme;
            });
        });
        
        // Cores
        document.querySelectorAll('#aparencia-modal .color-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('#aparencia-modal .color-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedAccent = option.dataset.accent;
                document.documentElement.style.setProperty('--accent-purple', this.selectedAccent);
            });
        });
        
        // Tamanho da fonte
        document.getElementById('font-size-slider')?.addEventListener('input', (e) => {
            document.body.style.fontSize = e.target.value + 'px';
        });
        
        // Help buttons
        document.getElementById('btn-contato')?.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('📱 WhatsApp: (00) 00000-0000', 'info');
            }
        });
        
        document.getElementById('btn-termos')?.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('📄 Termos de Uso (em breve)', 'info');
            }
        });
        
        document.getElementById('btn-privacidade')?.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('🔒 Política de Privacidade (em breve)', 'info');
            }
        });
        
        document.getElementById('btn-avaliar')?.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('⭐ Avalie o App (em breve)', 'info');
            }
        });
    }
    
    // ============================================
    // FORÇAR SINCRONIZAÇÃO
    // ============================================
    async forceSync() {
        if (!window.CacheManager) {
            if (typeof showToast === 'function') {
                showToast('⚠️ Sistema de sincronização indisponível', 'error');
            }
            return;
        }
        
        if (typeof showToast === 'function') {
            showToast('🔄 Sincronizando...', 'info');
        }
        
        try {
            const result = await window.CacheManager.forceSync();
            await this.app.loadAllData();
            this.render(this.app.data);
            
            if (typeof showToast === 'function') {
                showToast(result ? '✅ Dados sincronizados!' : '✅ Dados já estão sincronizados!', 'success');
            }
        } catch (error) {
            console.error('[Perfil] Erro na sincronização:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao sincronizar: ' + error.message, 'error');
            }
        }
    }
}

console.log('[Perfil] ✅ Módulo carregado!');