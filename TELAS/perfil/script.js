// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    try {
        const userData = JSON.parse(usuario);
        // Preencher dados do usuário
        if (userData.nome) {
            document.getElementById('profileName').textContent = userData.nome;
            document.getElementById('nome').value = userData.nome;
        }
        if (userData.email) {
            document.getElementById('profileEmail').textContent = userData.email;
            document.getElementById('email').value = userData.email;
        }
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO =====
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// ===== TOGGLE PASSWORD =====
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = event.currentTarget;
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

// ===== PREVIEW AVATAR =====
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('avatarImage').src = e.target.result;
            showToast('Foto de perfil atualizada!');
        };
        reader.readAsDataURL(file);
    }
}

// ===== SALVAR ALTERAÇÕES =====
function salvarAlteracoes() {
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const telefone = document.getElementById('telefone').value;
    
    // Validar
    if (!nome || !email) {
        showToast('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    // Atualizar localStorage
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (usuario) {
        usuario.nome = nome;
        usuario.email = email;
        usuario.telefone = telefone;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
    }
    
    // Atualizar display
    document.getElementById('profileName').textContent = nome;
    document.getElementById('profileEmail').textContent = email;
    
    showToast('Alterações salvas com sucesso!');
}

// ===== ALTERAR SENHA =====
function alterarSenha() {
    const senhaAtual = document.getElementById('senhaAtual').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        showToast('Preencha todos os campos de senha!', 'error');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        showToast('As senhas não coincidem!', 'error');
        return;
    }
    
    if (novaSenha.length < 6) {
        showToast('A senha deve ter pelo menos 6 caracteres!', 'error');
        return;
    }
    
    // Simular alteração de senha
    showToast('Senha alterada com sucesso!');
    document.getElementById('securityForm').reset();
}

// ===== TOGGLE DARK MODE =====
function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
    showToast(isDark ? 'Modo escuro ativado!' : 'Modo claro ativado!');
}

// ===== EXPORTAR DADOS =====
function exportarDados() {
    if (confirm('Deseja exportar todos os seus dados?')) {
        const usuario = localStorage.getItem('usuarioLogado');
        const dados = {
            usuario: JSON.parse(usuario),
            dataExportacao: new Date().toISOString(),
            versao: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'meus-dados-painel-aluno.json';
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Dados exportados com sucesso!');
    }
}

// ===== DELETAR CONTA =====
function deletarConta() {
    const confirmacao = prompt('Digite "DELETAR" para confirmar a exclusão da conta:');
    if (confirmacao === 'DELETAR') {
        localStorage.removeItem('usuarioLogado');
        localStorage.clear();
        showToast('Conta deletada. Redirecionando...');
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 2000);
    } else if (confirmacao !== null) {
        showToast('Exclusão cancelada.', 'error');
    }
}

// ===== TOAST NOTIFICATION =====
function showToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (tipo === 'error') {
        toast.style.background = 'linear-gradient(135deg, #d63031, #c0392b)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #00b894, #059669)';
    }
    
    toastMessage.textContent = mensagem;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== FORMATAÇÃO DE TELEFONE =====
document.getElementById('telefone')?.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = valor;
    }
});

// ===== CARREGAR PREFERÊNCIAS SALVAS =====
window.addEventListener('DOMContentLoaded', () => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.getElementById('darkModeToggle').checked = true;
        document.body.classList.add('dark-mode');
    }
});

// ===== ADICIONAR ATIVIDADE =====
function adicionarAtividade(tipo, descricao) {
    const activityList = document.getElementById('activityList');
    const icons = {
        'tarefa': { class: 'blue', icon: 'fa-check-circle' },
        'anotacao': { class: 'purple', icon: 'fa-edit' },
        'evento': { class: 'green', icon: 'fa-calendar-check' },
        'login': { class: 'orange', icon: 'fa-sign-in-alt' }
    };
    
    const activity = icons[tipo] || icons['login'];
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <div class="activity-icon ${activity.class}">
            <i class="fas ${activity.icon}"></i>
        </div>
        <div class="activity-info">
            <p>${descricao}</p>
            <span class="activity-time">Agora mesmo</span>
        </div>
    `;
    
    activityList.insertBefore(activityItem, activityList.firstChild);
}

// ===== CONSOLE INFO =====
console.log('%c👤 Perfil do Usuário', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cPainel do Aluno - Sistema de Gestão', 'color: #636e72; font-size: 12px;');