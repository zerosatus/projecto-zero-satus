// ===== VARIÁVEIS GLOBAIS =====
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];

// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        atualizarPerfil();
        
        // Iniciar sincronização
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarDados();
        
        // Escutar mudanças do Firebase
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Perfil] Dados atualizados do Firebase');
            carregarDados();
        });
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function carregarDados() {
    if (!usuarioAtual) return;
    
    if (window.CacheManager) {
        tarefas = window.CacheManager.get('tasks', []);
        anotacoes = window.CacheManager.get('notes', []);
        eventos = window.CacheManager.get('calendarEvents', []);
    } else {
        const userId = usuarioAtual.email;
        tarefas = JSON.parse(localStorage.getItem(`tasks_${userId}`) || '[]');
        anotacoes = JSON.parse(localStorage.getItem(`notes_${userId}`) || '[]');
        eventos = JSON.parse(localStorage.getItem(`calendarEvents_${userId}`) || '[]');
    }
    
    atualizarEstatisticasPerfil();
}

function atualizarPerfil() {
    if (!usuarioAtual) return;
    
    document.getElementById('profileName').textContent = usuarioAtual.nome || 'Usuário';
    document.getElementById('profileEmail').textContent = usuarioAtual.email || '';
    document.getElementById('nome').value = usuarioAtual.nome || '';
    document.getElementById('email').value = usuarioAtual.email || '';
    
    const iniciais = usuarioAtual.nome ? usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';
    const avatarImg = document.getElementById('avatarImage');
    if (avatarImg && usuarioAtual.avatar) {
        avatarImg.src = usuarioAtual.avatar;
    } else if (avatarImg) {
        avatarImg.src = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=150`;
    }
}

function atualizarEstatisticasPerfil() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.completed).length;
    const percentual = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    const horasEstudo = eventos.filter(e => e.type === 'aula').length * 2 + tarefasConcluidas * 1.5;
    
    document.querySelector('.profile-stat .stat-value:first-child').textContent = totalTarefas;
    document.querySelector('.profile-stat .stat-value:nth-child(2)').textContent = percentual + '%';
    document.querySelector('.profile-stat .stat-value:last-child').textContent = Math.floor(horasEstudo) + 'h';
}

function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarImg = document.getElementById('avatarImage');
            if (avatarImg) avatarImg.src = e.target.result;
            usuarioAtual.avatar = e.target.result;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        };
        reader.readAsDataURL(file);
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling;
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

function salvarAlteracoes() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const nascimento = document.getElementById('nascimento').value;
    const genero = document.getElementById('genero').value;
    
    if (!nome || !email) {
        mostrarToast('Preencha nome e e-mail!', 'error');
        return;
    }
    
    usuarioAtual.nome = nome;
    usuarioAtual.email = email;
    usuarioAtual.telefone = telefone;
    usuarioAtual.nascimento = nascimento;
    usuarioAtual.genero = genero;
    
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    atualizarPerfil();
    mostrarToast('Alterações salvas com sucesso!', 'success');
}

function alterarSenha() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarToast('Preencha todos os campos de senha!', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        mostrarToast('As senhas não coincidem!', 'error');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarToast('A nova senha deve ter no mínimo 6 caracteres!', 'error');
        return;
    }
    
    usuarioAtual.senha = novaSenha;
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    
    document.getElementById('senhaAtual').value = '';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarSenha').value = '';
    
    mostrarToast('Senha alterada com sucesso!', 'success');
}

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function exportarDados() {
    const dados = {
        usuario: usuarioAtual,
        tarefas: tarefas,
        anotacoes: anotacoes,
        eventos: eventos,
        dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dados_${usuarioAtual.nome}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    mostrarToast('Dados exportados com sucesso!', 'success');
}

function deletarConta() {
    if (confirm('TEM CERTEZA ABSOLUTA? Esta ação é irreversível e todos os seus dados serão永久mente excluídos.')) {
        if (confirm('Digite "DELETAR" para confirmar a exclusão da sua conta:')) {
            const confirmacao = prompt('Digite DELETAR para confirmar:');
            if (confirmacao === 'DELETAR') {
                const userId = usuarioAtual.email;
                localStorage.removeItem(`tasks_${userId}`);
                localStorage.removeItem(`notes_${userId}`);
                localStorage.removeItem(`calendarEvents_${userId}`);
                localStorage.removeItem(`weeklySchedule_${userId}`);
                localStorage.removeItem(`timeSlots_${userId}`);
                localStorage.removeItem('usuarioLogado');
                
                if (window.CacheManager) {
                    window.CacheManager.clearAllCache();
                }
                
                mostrarToast('Conta deletada com sucesso!', 'success');
                setTimeout(() => {
                    window.location.href = '../login/index.html';
                }, 2000);
            } else {
                mostrarToast('Confirmação incorreta. Operação cancelada.', 'error');
            }
        }
    }
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = mensagem;
        toast.className = `toast ${tipo === 'success' ? 'show' : 'show error'}`;
        if (tipo === 'error') toast.style.background = '#d63031';
        else toast.style.background = 'linear-gradient(135deg, #00b894, #059669)';
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    } else {
        alert(mensagem);
    }
}

function logout() {
    if (confirm('Deseja sair da sua conta?')) {
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

console.log('%c👤 Perfil - Painel do Aluno', 'color: #9333ea; font-size: 20px; font-weight: bold;');