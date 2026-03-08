// ===== VARIÁVEIS GLOBAIS =====
let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];

// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        carregarDados();
        preencherPerfil();
        carregarAtividadesRecentes();
    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

// ===== CARREGAR DADOS DE OUTROS MÓDULOS =====
function carregarDados() {
    // Carregar tarefas
    const tarefasKey = `tarefas_${usuarioAtual.email}`;
    const tarefasSalvas = localStorage.getItem(tarefasKey);
    tarefas = tarefasSalvas ? JSON.parse(tarefasSalvas) : [];

    // Carregar anotações
    const anotacoesKey = `anotacoes_${usuarioAtual.email}`;
    const anotacoesSalvas = localStorage.getItem(anotacoesKey);
    anotacoes = anotacoesSalvas ? JSON.parse(anotacoesSalvas) : [];

    // Carregar eventos
    const eventosKey = `eventos_${usuarioAtual.email}`;
    const eventosSalvas = localStorage.getItem(eventosKey);
    eventos = eventosSalvas ? JSON.parse(eventosSalvas) : [];

    atualizarEstatisticas();
}

// ===== PREENCHER PERFIL =====
function preencherPerfil() {
    // Dados básicos
    document.getElementById('profileName').textContent = usuarioAtual.nome || 'Usuário';
    document.getElementById('profileEmail').textContent = usuarioAtual.email || '';
    document.getElementById('nome').value = usuarioAtual.nome || '';
    document.getElementById('email').value = usuarioAtual.email || '';
    
    // Dados adicionais (se existirem)
    if (usuarioAtual.telefone) {
        document.getElementById('telefone').value = usuarioAtual.telefone;
    }
    if (usuarioAtual.nascimento) {
        document.getElementById('nascimento').value = usuarioAtual.nascimento;
    }
    if (usuarioAtual.genero) {
        document.getElementById('genero').value = usuarioAtual.genero;
    }
    
    // Avatar (se existir)
    if (usuarioAtual.avatar) {
        document.getElementById('avatarImage').src = usuarioAtual.avatar;
    }
}

// ===== ATUALIZAR ESTATÍSTICAS =====
function atualizarEstatisticas() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.concluida).length;
    const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    // Calcular horas de estudo (baseado em eventos)
    const horasEstudo = eventos.filter(e => e.type === 'aula').length * 2; // 2h por aula
    
    document.getElementById('statTarefas').textContent = totalTarefas;
    document.getElementById('statConclusao').textContent = percentualConclusao + '%';
    document.getElementById('statHoras').textContent = horasEstudo + 'h';
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
            descricao: `Anotação criada: ${anotacao.titulo}`,
            data: new Date(anotacao.dataModificacao || Date.now()),
            icone: 'fa-edit',
            corClasse: 'purple'
        });
    });
    
    // Adicionar eventos recentes
    eventos.slice(0, 2).forEach(evento => {
        atividades.push({
            tipo: 'evento',
            descricao: `Evento agendado: ${evento.title}`,
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

// ===== SALVAR ALTERAÇÕES =====
function salvarAlteracoes() {
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const nascimento = document.getElementById('nascimento').value;
    const genero = document.getElementById('genero').value;
    
    // Validar
    if (!nome || !email) {
        showToast('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    if (!validarEmail(email)) {
        showToast('E-mail inválido!', 'error');
        return;
    }
    
    // Atualizar objeto do usuário
    usuarioAtual = {
        ...usuarioAtual,
        nome: nome,
        email: email,
        telefone: telefone,
        nascimento: nascimento,
        genero: genero,
        ultimaAtualizacao: new Date().toISOString()
    };
    
    // Salvar no localStorage
    localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    
    // Atualizar display
    document.getElementById('profileName').textContent = nome;
    document.getElementById('profileEmail').textContent = email;
    
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
    
    // Verificar senha atual (simulado - em produção, seria verificado no backend)
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

// ===== PREVIEW AVATAR =====
function previewAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        // Validar tipo e tamanho
        if (!file.type.startsWith('image/')) {
            showToast('Por favor, selecione uma imagem!', 'error');
            return;
        }
        
        if (file.size > 5 * 1024 * 1024) { // 5MB
            showToast('A imagem deve ter no máximo 5MB!', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarUrl = e.target.result;
            document.getElementById('avatarImage').src = avatarUrl;
            
            // Salvar avatar no usuário
            if (usuarioAtual) {
                usuarioAtual.avatar = avatarUrl;
                localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
            }
            
            showToast('Foto de perfil atualizada!');
            
            // Registrar atividade
            adicionarAtividade('perfil', 'Avatar atualizado');
        };
        reader.readAsDataURL(file);
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
    if (usuarioAtual && usuarioAtual.darkMode) {
        document.getElementById('darkModeToggle').checked = true;
        toggleDarkMode();
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

console.log('%c👤 Perfil do Usuário', 'color: #9333ea; font-size: 20px; font-weight: bold;');
console.log('%cSistema integrado carregado!', 'color: #00b894; font-size: 14px;');
