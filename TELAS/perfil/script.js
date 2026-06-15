// perfil/script.js - CORRIGIDO COM SUPABASE STORAGE

let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let currentPhotoUnsubscribe = null;

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }
    
    try {
        usuarioAtual = JSON.parse(usuario);
        
        if (window.initSync) {
            await window.initSync();
        }
        
        carregarDados();
        atualizarPerfil();
        await carregarFotoAtual();
        
        window.addEventListener('cloudDataLoaded', () => {
            console.log('[Perfil] Dados atualizados do Supabase');
            carregarDados();
            atualizarEstatisticasPerfil();
            atualizarAtividadesRecentes();
        });
        
        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                atualizarFotoEmTodasTelas(event.detail.photoUrl);
            }
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
        const userId = usuarioAtual.id;  // ✅ UUID
        tarefas = JSON.parse(localStorage.getItem(`${userId}_tasks`) || '[]');
        anotacoes = JSON.parse(localStorage.getItem(`${userId}_notes`) || '[]');
        eventos = JSON.parse(localStorage.getItem(`${userId}_calendarEvents`) || '[]');
    }
    
    atualizarEstatisticasPerfil();
    atualizarAtividadesRecentes();
}

function atualizarPerfil() {
    if (!usuarioAtual) return;
    
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const nomeInput = document.getElementById('nome');
    const emailInput = document.getElementById('email');
    const telefoneInput = document.getElementById('telefone');
    const nascimentoInput = document.getElementById('nascimento');
    const generoSelect = document.getElementById('genero');
    
    if (profileName) profileName.textContent = usuarioAtual.nome || 'Usuário';
    if (profileEmail) profileEmail.textContent = usuarioAtual.email || '';
    if (nomeInput) nomeInput.value = usuarioAtual.nome || '';
    if (emailInput) emailInput.value = usuarioAtual.email || '';
    if (telefoneInput) telefoneInput.value = usuarioAtual.telefone || '';
    if (nascimentoInput) nascimentoInput.value = usuarioAtual.nascimento || '';
    if (generoSelect) generoSelect.value = usuarioAtual.genero || 'nao-informar';
}

function atualizarEstatisticasPerfil() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.completed).length;
    const percentual = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    
    let horasEstudo = 0;
    horasEstudo += eventos.filter(e => e.type === 'aula').length * 2;
    horasEstudo += tarefasConcluidas * 1.5;
    
    const statTarefas = document.getElementById('statTarefas');
    const statConclusao = document.getElementById('statConclusao');
    const statHoras = document.getElementById('statHoras');
    
    if (statTarefas) statTarefas.textContent = totalTarefas;
    if (statConclusao) statConclusao.textContent = percentual + '%';
    if (statHoras) statHoras.textContent = Math.floor(horasEstudo) + 'h';
}

function atualizarAtividadesRecentes() {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;
    
    const atividades = [];
    
    (tarefas || []).slice(0, 2).forEach(tarefa => {
        atividades.push({
            titulo: tarefa.title || tarefa.nome,
            descricao: tarefa.completed ? 'Concluída' : 'Pendente',
            icone: 'fa-check-circle',
            cor: '#10b981',
            data: new Date(tarefa.dataCriacao || Date.now())
        });
    });
    
    (anotacoes || []).slice(0, 2).forEach(anotacao => {
        atividades.push({
            titulo: anotacao.title || anotacao.titulo,
            descricao: 'Anotação atualizada',
            icone: 'fa-edit',
            cor: '#8B5CF6',
            data: new Date(anotacao.date || anotacao.dataModificacao || Date.now())
        });
    });
    
    (eventos || []).slice(0, 2).forEach(evento => {
        atividades.push({
            titulo: evento.title,
            descricao: `Evento ${evento.type}`,
            icone: 'fa-calendar-check',
            cor: '#3B82F6',
            data: new Date(evento.date || `${evento.year}-${evento.month + 1}-${evento.day}`)
        });
    });
    
    atividades.sort((a, b) => b.data - a.data);
    const recentes = atividades.slice(0, 4);
    
    activityList.innerHTML = '';
    if (recentes.length === 0) {
        activityList.innerHTML = '<p style="color: #888; text-align: center; padding: 20px;">Nenhuma atividade recente</p>';
        return;
    }
    
    recentes.forEach(atividade => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon ${getCorClasse(atividade.cor)}">
                <i class="fas ${atividade.icone}"></i>
            </div>
            <div class="activity-info">
                <p>${escapeHtml(atividade.titulo)}</p>
                <span class="activity-time">${formatarDataRelativa(atividade.data)}</span>
            </div>
        `;
        activityList.appendChild(activityItem);
    });
}

function getCorClasse(cor) {
    const mapa = {
        '#10b981': 'green',
        '#8B5CF6': 'purple',
        '#3B82F6': 'blue',
        '#f59e0b': 'orange'
    };
    return mapa[cor] || 'blue';
}

function formatarDataRelativa(data) {
    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMs / 3600000);
    const diffDias = Math.floor(diffMs / 86400000);
    
    if (diffMin < 1) return 'agora mesmo';
    if (diffMin < 60) return `Há ${diffMin} minutos`;
    if (diffHoras < 24) return `Há ${diffHoras} horas`;
    if (diffDias === 1) return 'Ontem';
    if (diffDias < 7) return `Há ${diffDias} dias`;
    return data.toLocaleDateString('pt-BR');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========== FUNÇÕES DE FOTO DE PERFIL CORRIGIDAS ==========

async function carregarFotoAtual() {
    if (!usuarioAtual) return;
    
    const avatarImg = document.getElementById('avatarImage');
    
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();
        
        if (photoUrl && photoUrl.startsWith('data:')) {
            if (avatarImg) avatarImg.src = photoUrl;
            usuarioAtual.profilePhotoUrl = photoUrl;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        } else {
            const iniciais = usuarioAtual.nome ? 
                usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';
            const defaultAvatar = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=150`;
            if (avatarImg) avatarImg.src = defaultAvatar;
        }
    }
}

function atualizarFotoEmTodasTelas(photoUrl) {
    if (usuarioAtual) {
        usuarioAtual.profilePhotoUrl = photoUrl;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    }
    
    const avatarImg = document.getElementById('avatarImage');
    if (avatarImg && photoUrl && photoUrl.startsWith('data:')) {
        avatarImg.src = photoUrl;
    }
}

async function previewAvatar(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        mostrarToast('Por favor, selecione uma imagem válida!', 'error');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        mostrarToast('A imagem deve ter no máximo 2MB!', 'error');
        return;
    }
    
    // Preview imediato
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarImg = document.getElementById('avatarImage');
        if (avatarImg) avatarImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    mostrarToast('Enviando foto...', 'info');
    
    // Upload para o Supabase
    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.uploadProfilePhoto(file);
        
        if (photoUrl && photoUrl.startsWith('data:')) {
            mostrarToast('Foto atualizada com sucesso e sincronizada!', 'success');
            atualizarFotoEmTodasTelas(photoUrl);
            // Disparar evento para outras abas/dispositivos
            window.dispatchEvent(new CustomEvent('profilePhotoUpdated', { detail: { photoUrl } }));
        } else {
            mostrarToast('Erro ao enviar foto!', 'error');
            await carregarFotoAtual();
        }
    } else {
        mostrarToast('Sistema de upload não disponível', 'error');
    }
}

function togglePassword(inputId) {
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

function salvarAlteracoes() {
    const nome = document.getElementById('nome')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const telefone = document.getElementById('telefone')?.value.trim();
    const nascimento = document.getElementById('nascimento')?.value;
    const genero = document.getElementById('genero')?.value;
    
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
    if (window.CacheManager) {
        window.CacheManager.set('usuarioLogado', usuarioAtual, true);
    }
    
    atualizarPerfil();
    mostrarToast('Alterações salvas com sucesso!', 'success');
}

function alterarSenha() {
    const senhaAtual = document.getElementById('senhaAtual')?.value;
    const novaSenha = document.getElementById('novaSenha')?.value;
    const confirmarSenha = document.getElementById('confirmarSenha')?.value;
    
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
    if (window.CacheManager) {
        window.CacheManager.set('usuarioLogado', usuarioAtual, true);
    }
    
    document.getElementById('senhaAtual').value = '';
    document.getElementById('novaSenha').value = '';
    document.getElementById('confirmarSenha').value = '';
    
    mostrarToast('Senha alterada com sucesso!', 'success');
}

function toggleDarkMode() {
    const isDark = document.getElementById('darkModeToggle')?.checked;
    if (isDark) {
        document.body.classList.add('dark-mode');
        if (window.CacheManager) {
            window.CacheManager.set('appearanceSettings', { theme: 'dark', accent: '#8b5cf6', fontSize: 14 }, true);
        }
    } else {
        document.body.classList.remove('dark-mode');
        if (window.CacheManager) {
            window.CacheManager.set('appearanceSettings', { theme: 'light', accent: '#8b5cf6', fontSize: 14 }, true);
        }
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
    if (confirm('TEM CERTEZA ABSOLUTA? Esta ação é irreversível e todos os seus dados serão permanentemente excluídos.')) {
        const confirmacao = prompt('Digite "DELETAR" para confirmar a exclusão da sua conta:');
        if (confirmacao === 'DELETAR') {
            const userId = usuarioAtual.id;
            localStorage.removeItem(`${userId}_tasks`);
            localStorage.removeItem(`${userId}_notes`);
            localStorage.removeItem(`${userId}_calendarEvents`);
            localStorage.removeItem(`${userId}_weeklySchedule`);
            localStorage.removeItem(`${userId}_timeSlots`);
            localStorage.removeItem(`${userId}_notifications`);
            localStorage.removeItem('usuarioLogado');
            
            if (window.CacheManager) {
                window.CacheManager.deleteProfilePhoto();
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

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    if (toast && toastMessage) {
        toastMessage.textContent = mensagem;
        toast.className = `toast show`;
        if (tipo === 'error') {
            toast.style.background = 'linear-gradient(135deg, #d63031, #c0392b)';
        } else {
            toast.style.background = 'linear-gradient(135deg, #00b894, #059669)';
        }
        
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

setInterval(() => {
    carregarDados();
    console.log('[Perfil] Dados atualizados');
}, 30000);

console.log('%c👤 Perfil - Painel do Aluno (Supabase)', 'color: #9333ea; font-size: 20px; font-weight: bold;');