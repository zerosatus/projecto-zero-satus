// ============================================
// modules/perfil.js - PERFIL
// ============================================

class PerfilModule {
    constructor(app) {
        this.app = app;
        this.name = 'perfil';
        this.userPhotoURL = null;
        
        console.log('[Perfil] 👤 Módulo inicializado');
    }
    
    render(data) {
        console.log('[Perfil] 👤 Renderizando...');
        
        this.profile = data.profile || {};
        this.tasks = data.tasks || [];
        this.notes = data.notes || [];
        this.events = data.calendarEvents || [];
        this.notifications = data.notifications || {};
        
        this.renderProfile();
        this.renderStats();
        this.renderActivities();
        this.setupEvents();
        this.carregarAvatar();
        this.updateBadge();
    }
    
    // ============================================
    // RENDER PROFILE
    // ============================================
    renderProfile() {
        const profile = this.profile || this.app.user || {};
        
        document.getElementById('profileName').textContent = profile.nome || 'Usuário';
        document.getElementById('profileEmail').textContent = profile.email || '';
        document.getElementById('nome').value = profile.nome || '';
        document.getElementById('email').value = profile.email || '';
        document.getElementById('telefone').value = profile.telefone || '';
        document.getElementById('nascimento').value = profile.nascimento || '';
        document.getElementById('genero').value = profile.genero || 'nao-informar';
    }
    
    // ============================================
    // RENDER STATS
    // ============================================
    renderStats() {
        const totalTarefas = this.tasks.length;
        const tarefasConcluidas = this.tasks.filter(t => t.completed).length;
        const percentual = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
        const horasEstudo = tarefasConcluidas * 1.5 + this.events.filter(e => e.type === 'aula').length * 2;
        
        document.getElementById('statTarefasPerfil').textContent = totalTarefas;
        document.getElementById('statConclusaoPerfil').textContent = percentual + '%';
        document.getElementById('statHorasPerfil').textContent = Math.floor(horasEstudo) + 'h';
    }
    
    // ============================================
    // RENDER ACTIVITIES
    // ============================================
    renderActivities() {
        const container = document.getElementById('activityListPerfil');
        if (!container) return;
        
        const atividades = [];
        this.tasks.slice(0, 2).forEach(t => {
            atividades.push({
                titulo: t.title || t.nome || 'Tarefa',
                descricao: t.completed ? 'Concluída' : 'Pendente',
                icone: 'fa-tasks',
                cor: t.completed ? 'green' : 'orange'
            });
        });
        this.notes.slice(0, 2).forEach(n => {
            atividades.push({
                titulo: n.title || n.titulo || 'Anotação',
                descricao: 'Anotação atualizada',
                icone: 'fa-edit',
                cor: 'purple'
            });
        });
        
        if (atividades.length === 0) {
            container.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">Nenhuma atividade recente</p>';
            return;
        }
        
        const cores = { green: 'green', orange: 'orange', purple: 'purple' };
        container.innerHTML = atividades.map(a => `
            <div class="activity-item">
                <div class="activity-icon ${cores[a.cor] || 'blue'}"><i class="fas ${a.icone}"></i></div>
                <div class="activity-info">
                    <p>${this.app.escapeHtml(a.titulo)}</p>
                    <span class="activity-time">${a.descricao}</span>
                </div>
            </div>
        `).join('');
    }
    
    // ============================================
    // AVATAR
    // ============================================
    async carregarAvatar() {
        const avatarImg = document.getElementById('avatarImage');
        
        if (window.CacheManager) {
            const photoUrl = await window.CacheManager.getProfilePhotoUrl();
            if (photoUrl && photoUrl.startsWith('data:')) {
                if (avatarImg) avatarImg.src = photoUrl;
                this.userPhotoURL = photoUrl;
                return;
            }
        }
        
        const profile = this.profile || this.app.user || {};
        const iniciais = profile.nome ? profile.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';
        if (avatarImg) {
            avatarImg.src = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=150`;
        }
    }
    
    async uploadAvatar(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showToast('Selecione uma imagem válida!', 'error');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) {
            this.showToast('A imagem deve ter no máximo 2MB!', 'error');
            return;
        }
        
        // Preview imediato
        const reader = new FileReader();
        reader.onload = (e) => {
            const avatarImg = document.getElementById('avatarImage');
            if (avatarImg) avatarImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
        
        this.showToast('Enviando foto...', 'info');
        
        if (window.CacheManager) {
            try {
                const photoUrl = await window.CacheManager.uploadProfilePhoto(file);
                if (photoUrl) {
                    this.userPhotoURL = photoUrl;
                    this.showToast('Foto atualizada e sincronizada!', 'success');
                    window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl } }));
                } else {
                    this.showToast('Erro ao enviar foto!', 'error');
                    await this.carregarAvatar();
                }
            } catch (error) {
                console.error('[Perfil] Erro no upload:', error);
                this.showToast('Erro ao enviar foto!', 'error');
            }
        }
    }
    
    // ============================================
    // SALVAR DADOS
    // ============================================
    async salvarAlteracoes() {
        const nome = document.getElementById('nome')?.value.trim();
        const email = document.getElementById('email')?.value.trim();
        const telefone = document.getElementById('telefone')?.value.trim();
        const nascimento = document.getElementById('nascimento')?.value;
        const genero = document.getElementById('genero')?.value;
        
        if (!nome || !email) {
            this.showToast('Preencha nome e e-mail!', 'error');
            return;
        }
        
        const profile = this.profile || this.app.user || {};
        profile.nome = nome;
        profile.email = email;
        profile.telefone = telefone || '';
        profile.nascimento = nascimento || '';
        profile.genero = genero || 'nao-informar';
        
        this.app.data.profile = profile;
        this.app.user = profile;
        
        // Salvar no Supabase
        try {
            const userId = this.app.user.id;
            if (userId && window.DatabaseService) {
                await window.DatabaseService.updateUserProfile(userId, {
                    nome: nome,
                    email: email,
                    telefone: telefone || '',
                    nascimento: nascimento || null,
                    genero: genero || 'nao-informar'
                });
            }
        } catch (error) {
            console.warn('[Perfil] Erro ao salvar no banco:', error);
        }
        
        localStorage.setItem('usuarioLogado', JSON.stringify(profile));
        await this.app.saveAllData();
        
        this.renderProfile();
        this.showToast('Alterações salvas com sucesso!', 'success');
    }
    
    // ============================================
    // SEGURANÇA
    // ============================================
    togglePassword(inputId) {
        const input = document.getElementById(inputId);
        const icon = input?.nextElementSibling;
        if (input && icon) {
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        }
    }
    
    alterarSenha() {
        const senhaAtual = document.getElementById('senhaAtual')?.value;
        const novaSenha = document.getElementById('novaSenha')?.value;
        const confirmarSenha = document.getElementById('confirmarSenha')?.value;
        
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            this.showToast('Preencha todos os campos de senha!', 'error');
            return;
        }
        
        if (novaSenha !== confirmarSenha) {
            this.showToast('As senhas não coincidem!', 'error');
            return;
        }
        
        if (novaSenha.length < 6) {
            this.showToast('A nova senha deve ter no mínimo 6 caracteres!', 'error');
            return;
        }
        
        this.showToast('Para alterar a senha, use a opção "Esqueci minha senha" no login', 'info');
        document.getElementById('senhaAtual').value = '';
        document.getElementById('novaSenha').value = '';
        document.getElementById('confirmarSenha').value = '';
    }
    
    // ============================================
    // EXPORTAR DADOS
    // ============================================
    exportarDados() {
        const dados = {
            usuario: this.profile || this.app.user,
            tarefas: this.tasks,
            anotacoes: this.notes,
            eventos: this.events,
            dataExportacao: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(dados, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `dados_${this.profile.nome || 'usuario'}_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Dados exportados com sucesso!', 'success');
    }
    
    // ============================================
    // DELETAR CONTA
    // ============================================
    deletarConta() {
        if (!confirm('TEM CERTEZA ABSOLUTA? Esta ação é irreversível e todos os seus dados serão permanentemente excluídos.')) {
            return;
        }
        
        const confirmacao = prompt('Digite "DELETAR" para confirmar a exclusão da sua conta:');
        if (confirmacao !== 'DELETAR') {
            this.showToast('Confirmação incorreta. Operação cancelada.', 'error');
            return;
        }
        
        const userId = this.app.user?.id;
        if (userId) {
            ['tasks', 'notes', 'calendarEvents', 'weeklySchedule', 'timeSlots', 'notifications'].forEach(key => {
                localStorage.removeItem(`${userId}_${key}`);
            });
        }
        
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) {
            window.CacheManager.deleteProfilePhoto();
            window.CacheManager.logout();
        }
        
        this.showToast('Conta deletada com sucesso!', 'success');
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 2000);
    }
    
    // ============================================
    // HELPERS
    // ============================================
    showToast(mensagem, tipo = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = mensagem;
            toast.className = 'toast show';
            toast.style.background = tipo === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' :
                                   tipo === 'warning' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                   tipo === 'info' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' :
                                   'linear-gradient(135deg, #10b981, #059669)';
            
            setTimeout(() => toast.classList.remove('show'), 3000);
        } else {
            alert(mensagem);
        }
    }
    
    // ============================================
    // NOTIFICAÇÕES
    // ============================================
    updateBadge() {
        const badge = document.getElementById('notificationBadge');
        const naoLidas = (this.notifications || []).filter(n => !n.read).length;
        if (badge) {
            badge.textContent = naoLidas > 9 ? '9+' : naoLidas;
            badge.style.display = naoLidas > 0 ? 'flex' : 'none';
        }
    }
    
    // ============================================
    // EVENTOS DA UI
    // ============================================
    setupEvents() {
        // Upload de avatar
        document.getElementById('avatarUpload')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.uploadAvatar(file);
            e.target.value = '';
        });
        
        // Salvar alterações
        document.querySelectorAll('.btn-save, .btn-save-form').forEach(btn => {
            btn.addEventListener('click', () => this.salvarAlteracoes());
        });
        
        // Alterar senha
        document.querySelector('[onclick*="alterarSenha"]')?.addEventListener('click', () => this.alterarSenha());
        
        // Exportar dados
        document.querySelector('[onclick*="exportarDados"]')?.addEventListener('click', () => this.exportarDados());
        
        // Deletar conta
        document.querySelector('[onclick*="deletarConta"]')?.addEventListener('click', () => this.deletarConta());
    }
}

console.log('[Perfil] ✅ Módulo carregado!');