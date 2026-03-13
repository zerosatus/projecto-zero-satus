// ===== VARIÁVEIS GLOBAIS =====
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
// ===== DETECTAR MUDANÇAS =====
window.addEventListener('storage', (e) => {
    if (!usuarioAtual) return;
    
    if (e.key === `tarefas_${usuarioAtual.email}` ||
        e.key === `anotacoes_${usuarioAtual.email}` ||
        e.key === `eventos_${usuarioAtual.email}`) {
        
        console.log('🔄 Dados atualizados em outra aba');
        carregarDados();
        atualizarEstatisticas();
        carregarAtividadesRecentes();
    }
});

// ===== VERIFICAÇÃO DE LOGIN E CARREGAMENTO =====
window.addEventListener('DOMContentLoaded', () => {
    console.log('Iniciando carregamento do perfil...');
    
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        console.log('Usuário não encontrado, redirecionando para login...');
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        console.log('Usuário carregado:', usuarioAtual);
        
        // Carregar dados dos outros módulos
        carregarDados();
        
        // Preencher perfil com os dados do usuário
        preencherPerfil();
        
        // Carregar atividades recentes
        carregarAtividadesRecentes();
        
        // Carregar preferências salvas
        carregarPreferencias();
        
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ===== CARREGAR DADOS DE OUTROS MÓDULOS =====
function carregarDados() {
    if (!usuarioAtual || !usuarioAtual.email) return;
    
    console.log('Carregando dados para:', usuarioAtual.email);
    
    // Carregar tarefas
    const tarefasKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(tarefasKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];
    console.log('Tarefas carregadas:', tarefas.length);

    // Carregar anotações
    const anotacoesKey = `anotacoes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(anotacoesKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];
    console.log('Anotações carregadas:', anotacoes.length);

    // Carregar eventos
    const eventosKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvas = localStorage.getItem(eventosKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];
    console.log('Eventos carregados:', eventos.length);

    atualizarEstatisticas();
}

// ===== PREENCHER PERFIL COM DADOS DO USUÁRIO =====
function preencherPerfil() {
    if (!usuarioAtual) return;
    
    console.log('Preenchendo perfil com:', usuarioAtual);
    
    // Elementos do DOM
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const nascimentoInput = document.getElementById('nascimento');
    const generoSelect = document.getElementById('genero');
    const avatarImage = document.getElementById('avatarImage');
    
    // Preencher nome
    if (profileName) {
        profileName.textContent = usuarioAtual.nome || 'Usuário';
    }
    
    // Preencher email
    if (profileEmail) {
        profileEmail.textContent = usuarioAtual.email || '';
    }
    
    // Preencher campos do formulário
    if (nomeInput) {
        nomeInput.value = usuarioAtual.nome || '';
    }
    
    if (emailInput) {
        emailInput.value = usuarioAtual.email || '';
    }
    
    if (telefoneInput) {
        telefoneInput.value = usuarioAtual.telefone || '';
    }
    
    if (nascimentoInput) {
        nascimentoInput.value = usuarioAtual.nascimento || '';
    }
    
    if (generoSelect) {
        generoSelect.value = usuarioAtual.genero || 'nao-informar';
    }
    
    // Avatar (se existir)
    if (avatarImage) {
        if (usuarioAtual.avatar) {
            avatarImage.src = usuarioAtual.avatar;
        } else {
            // Gerar avatar com iniciais
            const iniciais = usuarioAtual.nome 
                ? usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
                : 'U';
            avatarImage.src = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=120`;
        }
    }
    
    // Preencher toggles de preferências
    const emailNotif = document.querySelector('.preference-item input[type="checkbox"]');
    if (emailNotif && usuarioAtual.emailNotificacoes !== undefined) {
        emailNotif.checked = usuarioAtual.emailNotificacoes;
    }
    
    const pushNotif = document.querySelectorAll('.preference-item input[type="checkbox"]')[1];
    if (pushNotif && usuarioAtual.pushNotificacoes !== undefined) {
        pushNotif.checked = usuarioAtual.pushNotificacoes;
    }
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle && usuarioAtual.darkMode !== undefined) {
        darkModeToggle.checked = usuarioAtual.darkMode;
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    // Calcular horas de estudo (baseado em eventos)
    const horasEstudo = eventos.filter(e => e.type === 'aula').length * 2; // 2h por aula
    
    const statTarefas = document.querySelector('.stat-value');
    const statConclusao = document.querySelectorAll('.stat-value')[1];
    const statHoras = document.querySelectorAll('.stat-value')[2];
    
    if (statTarefas) statTarefas.textContent = totalTarefas;
    if (statConclusao) statConclusao.textContent = percentualConclusao + '%';
    if (statHoras) statHoras.textContent = horasEstudo + 'h';
}

// ===== SALVAR ALTERAÇÕES DO PERFIL =====
function salvarAlteracoes() {
    console.log('Salvando alterações...');
    
    // Obter valores dos campos
    const nome = document.getElementById('nome')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const telefone = document.getElementById('telefone')?.value.trim();
    const nascimento = document.getElementById('nascimento')?.value;
    const genero = document.getElementById('genero')?.value;
    
    // Validar campos obrigatórios
    if (!nome || !email) {
        showToast('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        showToast('E-mail inválido!', 'error');
        return;
    }
    
    // Obter preferências
    const emailNotif = document.querySelector('.preference-item input[type="checkbox"]')?.checked || false;
    const pushNotif = document.querySelectorAll('.preference-item input[type="checkbox"]')[1]?.checked || false;
    const darkMode = document.getElementById('darkModeToggle')?.checked || false;
    
    // Atualizar objeto do usuário (manter dados existentes)
    usuarioAtual = {
        ...usuarioAtual,
        nome: nome,
        email: email,
        telefone: telefone,
        nascimento: nascimento,
        genero: genero,
        emailNotificacoes: emailNotif,
        pushNotificacoes: pushNotif,
        darkMode: darkMode,
        ultimaAtualizacao: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    console.log('Usuário salvo:', usuarioAtual);
    
    // Atualizar display
    document.getElementById('profileName').textContent = nome;
    document.getElementById('profileEmail').textContent = email;
    
    // Aplicar dark mode se necessário
    if (darkMode) {
        document.documentElement.style.setProperty('--bg-primary', '#1a1a2e');
        document.documentElement.style.setProperty('--bg-secondary', '#16213e');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#a0a0a0');
        document.documentElement.style.setProperty('--border-color', '#2a2a4a');
    } else {
        document.documentElement.style.setProperty('--bg-primary', '#f5f6fa');
        document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#2d3436');
        document.documentElement.style.setProperty('--text-secondary', '#636e72');
        document.documentElement.style.setProperty('--border-color', '#dfe6e9');
    }
    
    showToast('Alterações salvas com sucesso!');
    
    // Registrar atividade
    adicionarAtividade('perfil', 'Perfil atualizado');
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
    
    // Verificar senha atual
    if (usuarioAtual.senha && senhaAtual !== usuarioAtual.senha) {
        showToast('Senha atual incorreta!', 'error');
        return;
    }
    
    // Atualizar senha
    usuarioAtual.senha = novaSenha;
    usuarioAtual.ultimaAlteracaoSenha = new Date().toISOString();
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    
    showToast('Senha alterada com sucesso!');
    document.getElementById('securityForm').reset();
    
    // Registrar atividade
    adicionarAtividade('seguranca', 'Senha alterada');
}

// ===== PREVIEW E SALVAR AVATAR =====
function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log('Arquivo selecionado:', file.name);
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        showToast('Por favor, selecione uma imagem!', 'error');
        return;
    }
    
    // Validar tamanho (5MB max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('A imagem deve ter no máximo 5MB!', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarUrl = e.target.result;
        
        // Atualizar imagem na tela
        const avatarImage = document.getElementById('avatarImage');
        if (avatarImage) {
            avatarImage.src = avatarUrl;
        }
        
        // Salvar avatar no usuário
        if (usuarioAtual) {
            usuarioAtual.avatar = avatarUrl;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
            console.log('Avatar salvo com sucesso!');
            
            showToast('Foto de perfil atualizada!');
            
            // Registrar atividade
            adicionarAtividade('perfil', 'Avatar atualizado');
        }
    };
    
    reader.readAsDataURL(file);
}

// ===== CARREGAR ATIVIDADES RECENTES =====
function carregarAtividadesRecentes() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const atividades = [];
    
    // Adicionar tarefas recentes
    tarefas.slice(0, 2).forEach(tarefa => {
        atividades.push({
            tipo: 'tarefa',
            descricao: `Tarefa ${tarefa.concluida ? 'concluída' : 'criada'}: ${tarefa.nome}`,
            data: new Date(tarefa.dataCriacao || Date.now()),
            icone: tarefa.concluida ? 'fa-check-circle' : 'fa-clipboard-list',
            corClasse: 'blue'
        });
    });
    
    // Adicionar anotações recentes
    anotacoes.slice(0, 2).forEach(anotacao => {
        atividades.push({
            tipo: 'anotacao',
            descricao: `Anotação: ${anotacao.titulo}`,
            data: new Date(anotacao.dataModificacao || Date.now()),
            icone: 'fa-edit',
            corClasse: 'purple'
        });
    });
    
    // Adicionar eventos recentes
    eventos.slice(0, 2).forEach(evento => {
        atividades.push({
            tipo: 'evento',
            descricao: `Evento: ${evento.title}`,
            data: new Date(evento.year, evento.month, evento.day),
            icone: 'fa-calendar-check',
            corClasse: 'green'
        });
    });
    
    // Adicionar login atual
    atividades.push({
        tipo: 'login',
        descricao: 'Login realizado',
        data: new Date(),
        icone: 'fa-sign-in-alt',
        corClasse: 'orange'
    });
    
    // Ordenar por data (mais recente primeiro)
    atividades.sort((a, b) => b.data - a.data);
    
    // Limitar a 4 atividades
    const recentes = atividades.slice(0, 4);
    
    activityList.innerHTML = '';
    recentes.forEach(atividade => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${atividade.corClasse}">
                <i class="fas ${atividade.icone}"></i>
            </div>
            <div class="activity-info">
                <p>${atividade.descricao}</p>
                <span class="activity-time">${formatarDataRelativa(atividade.data)}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

// ===== ADICIONAR ATIVIDADE À LISTA =====
function adicionarAtividade(tipo, descricao) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const icons = {
        'tarefa': { class: 'blue', icon: 'fa-check-circle' },
        'anotacao': { class: 'purple', icon: 'fa-edit' },
        'evento': { class: 'green', icon: 'fa-calendar-check' },
        'login': { class: 'orange', icon: 'fa-sign-in-alt' },
        'perfil': { class: 'purple', icon: 'fa-user' },
        'seguranca': { class: 'blue', icon: 'fa-shield-alt' },
        'sistema': { class: 'green', icon: 'fa-cog' }
    };
    
    const activity = icons[tipo] || icons['sistema'];
    
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
    
    // Manter apenas as 10 mais recentes
    while (activityList.children.length > 10) {
        activityList.removeChild(activityList.lastChild);
    }
}

// ===== TOGGLE DARK MODE =====
function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle').checked;
    
    if (isDark) {
        document.documentElement.style.setProperty('--bg-primary', '#1a1a2e');
        document.documentElement.style.setProperty('--bg-secondary', '#16213e');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#a0a0a0');
        document.documentElement.style.setProperty('--border-color', '#2a2a4a');
    } else {
        document.documentElement.style.setProperty('--bg-primary', '#f5f6fa');
        document.documentElement.style.setProperty('--bg-secondary', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#2d3436');
        document.documentElement.style.setProperty('--text-secondary', '#636e72');
        document.documentElement.style.setProperty('--border-color', '#dfe6e9');
    }
    
    // Salvar preferência
    if (usuarioAtual) {
        usuarioAtual.darkMode = isDark;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    }
    
    showToast(isDark ? 'Modo escuro ativado!' : 'Modo claro ativado!');
}

// ===== CARREGAR PREFERÊNCIAS SALVAS =====
function carregarPreferencias() {
    if (!usuarioAtual) return;
    
    // Dark mode
    if (usuarioAtual.darkMode) {
        document.getElementById('darkModeToggle').checked = true;
        document.documentElement.style.setProperty('--bg-primary', '#1a1a2e');
        document.documentElement.style.setProperty('--bg-secondary', '#16213e');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
        document.documentElement.style.setProperty('--text-secondary', '#a0a0a0');
        document.documentElement.style.setProperty('--border-color', '#2a2a4a');
    }
    
    // Notificações
    if (usuarioAtual.emailNotificacoes !== undefined) {
        const emailNotif = document.querySelector('.preference-item input[type="checkbox"]');
        if (emailNotif) emailNotif.checked = usuarioAtual.emailNotificacoes;
    }
    
    if (usuarioAtual.pushNotificacoes !== undefined) {
        const pushNotif = document.querySelectorAll('.preference-item input[type="checkbox"]')[1];
        if (pushNotif) pushNotif.checked = usuarioAtual.pushNotificacoes;
    }
}

// ===== EXPORTAR DADOS =====
function exportarDados() {
    if (confirm('Deseja exportar todos os seus dados?')) {
        const dadosCompletos = {
            usuario: usuarioAtual,
            tarefas: tarefas,
            anotacoes: anotacoes,
            eventos: eventos,
            dataExportacao: new Date().toISOString(),
            versao: '1.0'
        };
        
        const blob = new Blob([JSON.stringify(dadosCompletos, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-painel-aluno-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showToast('Dados exportados com sucesso!');
        
        // Registrar atividade
        adicionarAtividade('sistema', 'Dados exportados');
    }
}

// ===== DELETAR CONTA =====
function deletarConta() {
    const confirmacao = prompt('Digite "DELETAR" para confirmar a exclusão permanente da conta:');
    
    if (confirmacao === 'DELETAR') {
        // Remover todos os dados do usuário
        const email = usuarioAtual.email;
        
        localStorage.removeItem('usuarioLogado');
        localStorage.removeItem(`tarefas_${email}`);
        localStorage.removeItem(`anotacoes_${email}`);
        localStorage.removeItem(`eventos_${email}`);
        
        showToast('Conta deletada. Redirecionando...');
        
        setTimeout(() => {
            window.location.href = '../login/index.html';
        }, 2000);
    } else if (confirmacao !== null) {
        showToast('Exclusão cancelada.', 'error');
    }
}

// ===== UTILITÁRIOS =====
function validarEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function formatarDataRelativa(data) {
    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 24) return `${diffHoras} h atrás`;
    if (diffDias === 1) return 'ontem';
    if (diffDias < 7) return `${diffDias} dias atrás`;
    return data.toLocaleDateString('pt-BR');
}

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

// ===== FORMATAÇÃO DE TELEFONE =====
document.getElementById('telefone')?.addEventListener('input', function(e) {
    let valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
        valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
        valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
        e.target.value = valor;
    }
});

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

console.log('%c👤 Perfil do Usuário', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cSistema integrado carregado!', 'color: #00b894; font-size: 14px;');
