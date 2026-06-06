// anotacoes/script.js - Painel do Aluno (Desktop)
// Versão corrigida - sem recursão e com suporte a notes

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) { 
        window.location.href = '../login/index.html'; 
        return; 
    }
    
    if (window.initSync) {
        await window.initSync();
    }
    
    inicializarAnotacoes();
});

let anotacoes = [];
let anotacaoAtualId = null;
let autoSaveTimer = null;

function inicializarAnotacoes() {
    carregarAnotacoes();
    configurarEventos();
    carregarPrimeiraAnotacao();
}

function configurarEventos() {
    const editor = document.getElementById('editor');
    const noteTitle = document.querySelector('.note-title');
    
    if (editor) editor.addEventListener('input', () => programarAutoSave());
    if (noteTitle) noteTitle.addEventListener('input', () => programarAutoSave());
    
    const btnNew = document.querySelector('.btn-new');
    if (btnNew) btnNew.addEventListener('click', criarNovaAnotacao);
    
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
            e.preventDefault(); 
            salvarAnotacaoAtual(); 
        }
    });
    
    // Eventos de sincronização com Firebase/Mobile
    window.addEventListener('cloudDataLoaded', () => {
        console.log('[Anotacoes] cloudDataLoaded recebido');
        carregarAnotacoesDoCache();
    });
    
    window.addEventListener('notesUpdated', (event) => {
        console.log('[Anotacoes] notesUpdated recebido');
        if (event.detail && event.detail.notes) {
            const oldCount = anotacoes.length;
            anotacoes = event.detail.notes;
            renderizarListaAnotacoes();
            
            if (anotacaoAtualId) {
                const anotacaoAtualizada = anotacoes.find(a => a.id === anotacaoAtualId);
                if (anotacaoAtualizada) {
                    document.querySelector('.note-title').value = anotacaoAtualizada.titulo || '';
                    document.getElementById('editor').innerHTML = anotacaoAtualizada.conteudo || '';
                    atualizarUltimoSalvo(anotacaoAtualizada.dataModificacao);
                }
            }
            
            if (oldCount !== anotacoes.length) {
                mostrarToast('Anotações sincronizadas!');
            }
        }
    });
    
    window.addEventListener('forceRefresh', () => {
        console.log('[Anotacoes] forceRefresh recebido');
        carregarAnotacoesDoCache();
    });
}

function carregarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    // Tentar carregar do CacheManager primeiro (sincronizado com nuvem)
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null && Array.isArray(cached)) {
            anotacoes = cached;
            console.log('[Anotacoes] Carregado do CacheManager:', anotacoes.length);
            renderizarListaAnotacoes();
            return;
        }
    }
    
    // Fallback para localStorage
    const storageKey = `anotacoes_${usuario.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    
    if (anotacoesSalvas) {
        anotacoes = JSON.parse(anotacoesSalvas);
    } else {
        anotacoes = [];
    }
    
    // Salvar no CacheManager para sincronização futura
    if (window.CacheManager && anotacoes.length > 0) {
        window.CacheManager.set('notes', anotacoes, true);
    }
    
    renderizarListaAnotacoes();
}

function carregarAnotacoesDoCache() {
    if (!window.CacheManager) return;
    
    const cachedNotes = window.CacheManager.get('notes', null);
    if (cachedNotes !== null && Array.isArray(cachedNotes)) {
        const oldCount = anotacoes.length;
        anotacoes = cachedNotes;
        console.log('[Anotacoes] Recarregado do CacheManager:', anotacoes.length);
        
        renderizarListaAnotacoes();
        
        if (anotacaoAtualId) {
            const anotacaoAtualizada = anotacoes.find(a => a.id === anotacaoAtualId);
            if (anotacaoAtualizada) {
                document.querySelector('.note-title').value = anotacaoAtualizada.titulo || '';
                document.getElementById('editor').innerHTML = anotacaoAtualizada.conteudo || '';
                atualizarUltimoSalvo(anotacaoAtualizada.dataModificacao);
            } else if (anotacoes.length > 0) {
                carregarAnotacao(anotacoes[0].id);
            } else {
                document.querySelector('.note-title').value = '';
                document.getElementById('editor').innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Nenhuma anotação selecionada<br>Clique em + para criar uma nova anotação</p>';
                anotacaoAtualId = null;
            }
        }
        
        if (oldCount !== anotacoes.length && anotacoes.length > 0) {
            mostrarToast(`${anotacoes.length} anotações sincronizadas!`);
        } else if (oldCount === 0 && anotacoes.length > 0) {
            console.log('[Anotacoes] Anotações carregadas da nuvem pela primeira vez!');
        }
    }
}

function renderizarListaAnotacoes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    if (!anotacoes || anotacoes.length === 0) {
        notesList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)"><i class="fas fa-sticky-note" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>Nenhuma anotação<br>Clique em + para criar</div>';
        return;
    }
    
    anotacoes.sort((a, b) => new Date(b.dataModificacao || b.date) - new Date(a.dataModificacao || a.date));
    
    anotacoes.forEach(anotacao => {
        const preview = anotacao.conteudo ? anotacao.conteudo.replace(/<[^>]*>/g, '').substring(0, 50) + '...' : (anotacao.content ? anotacao.content.replace(/<[^>]*>/g, '').substring(0, 50) + '...' : 'Anotação vazia');
        const data = new Date(anotacao.dataModificacao || anotacao.date || Date.now());
        const dataFormatada = formatarData(data);
        const titulo = anotacao.titulo || anotacao.title || 'Sem título';
        
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        if (anotacao.id === anotacaoAtualId) noteItem.classList.add('active');
        noteItem.dataset.id = anotacao.id;
        noteItem.innerHTML = `
            <div class="note-item-title">${escapeHtml(titulo)}</div>
            <div class="note-item-preview">${escapeHtml(preview)}</div>
            <div class="note-item-date">${dataFormatada}</div>
        `;
        noteItem.addEventListener('click', () => carregarAnotacao(anotacao.id));
        notesList.appendChild(noteItem);
    });
}

function formatarData(data) {
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    if (data.toDateString() === hoje.toDateString()) {
        return `Hoje, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
    } else if (data.toDateString() === ontem.toDateString()) {
        return `Ontem, ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
    } else {
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
    }
}

function carregarPrimeiraAnotacao() {
    if (anotacoes && anotacoes.length > 0) {
        carregarAnotacao(anotacoes[0].id);
    }
}

function carregarAnotacao(id) {
    const anotacao = anotacoes.find(a => a.id === id);
    if (!anotacao) return;
    
    anotacaoAtualId = id;
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    if (titleInput) titleInput.value = anotacao.titulo || anotacao.title || '';
    if (editor) editor.innerHTML = anotacao.conteudo || anotacao.content || '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Anotação vazia</p>';
    
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });
    
    atualizarUltimoSalvo(anotacao.dataModificacao || anotacao.date);
}

function criarNovaAnotacao() {
    const dataAtual = new Date().toISOString();
    const novaAnotacao = {
        id: gerarId(),
        titulo: '',
        conteudo: '',
        dataModificacao: dataAtual,
        dataCriacao: dataAtual
    };
    
    anotacoes.unshift(novaAnotacao);
    salvarAnotacoes();
    anotacaoAtualId = novaAnotacao.id;
    
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    if (titleInput) titleInput.value = '';
    if (editor) editor.innerHTML = '';
    
    renderizarListaAnotacoes();
    if (titleInput) titleInput.focus();
    mostrarToast('Nova anotação criada!');
}

function salvarAnotacaoAtual() {
    if (!anotacaoAtualId) return;
    
    const noteTitle = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    const anotacaoIndex = anotacoes.findIndex(a => a.id === anotacaoAtualId);
    
    if (anotacaoIndex === -1) return;
    
    const novoTitulo = noteTitle?.value || '';
    const novoConteudo = editor?.innerHTML || '';
    
    // Verificar se houve mudança real para evitar saves desnecessários
    const anotacaoAntiga = anotacoes[anotacaoIndex];
    if (anotacaoAntiga.titulo === novoTitulo && anotacaoAntiga.conteudo === novoConteudo) {
        return;
    }
    
    anotacoes[anotacaoIndex] = {
        ...anotacoes[anotacaoIndex],
        titulo: novoTitulo,
        conteudo: novoConteudo,
        dataModificacao: new Date().toISOString()
    };
    
    salvarAnotacoes();
    renderizarListaAnotacoes();
    atualizarUltimoSalvo(new Date().toISOString());
}

function salvarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    // Salvar no localStorage (backup local)
    const storageKey = `anotacoes_${usuario.email}`;
    localStorage.setItem(storageKey, JSON.stringify(anotacoes));
    
    // Salvar no CacheManager (sincroniza com Firebase e Mobile)
    if (window.CacheManager) {
        window.CacheManager.set('notes', anotacoes, true);
        console.log('[Anotacoes] Anotações salvas no CacheManager:', anotacoes.length);
    }
    
    // Forçar evento de atualização para outras abas
    window.dispatchEvent(new CustomEvent('notesUpdated', { detail: { notes: anotacoes } }));
}

function programarAutoSave() {
    const lastSaved = document.querySelector('.last-saved');
    if (lastSaved) lastSaved.textContent = 'Digitando...';
    
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => salvarAnotacaoAtual(), 2000);
}

function atualizarUltimoSalvo(dataISO) {
    const lastSaved = document.querySelector('.last-saved');
    if (!lastSaved) return;
    
    if (!dataISO) {
        lastSaved.textContent = 'Salvo automaticamente';
        return;
    }
    
    const data = new Date(dataISO);
    const agora = new Date();
    const diffMin = Math.floor((agora - data) / 60000);
    
    if (diffMin < 1) {
        lastSaved.textContent = 'Salvo agora';
    } else if (diffMin === 1) {
        lastSaved.textContent = 'Salvo há 1 minuto';
    } else if (diffMin < 60) {
        lastSaved.textContent = `Salvo há ${diffMin} minutos`;
    } else {
        lastSaved.textContent = `Salvo às ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
    }
}

function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('editor')?.focus();
    programarAutoSave();
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const toastSpan = toast.querySelector('span');
    if (toastSpan) toastSpan.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function saveNote() {
    salvarAnotacaoAtual();
    mostrarToast('Anotação salva!');
}

function createNewNote() {
    criarNovaAnotacao();
}

function logout() {
    if (confirm('Deseja sair?')) {
        if (anotacaoAtualId) salvarAnotacaoAtual();
        localStorage.removeItem('usuarioLogado');
        if (window.CacheManager) window.CacheManager.logout();
        window.location.href = '../login/index.html';
    }
}

// Navegação do menu
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Registrar função global para sincronização de anotações
window.carregarAnotacoes = function() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null && Array.isArray(cached)) {
            anotacoes = cached;
            renderizarListaAnotacoes();
            console.log('[Anotacoes] Forçado recarregamento via window.carregarAnotacoes:', anotacoes.length);
        }
    }
};

window.recarregarAnotacoesDaNuvem = carregarAnotacoesDoCache;

// Forçar sincronização manual
window.forcarSincronizacaoAnotacoes = async function() {
    if (window.CacheManager) {
        mostrarToast('Sincronizando...');
        await window.CacheManager.forceSync();
        carregarAnotacoesDoCache();
        mostrarToast('Sincronização concluída!');
    }
};

// Forçar carregamento imediato
setTimeout(() => {
    carregarAnotacoesDoCache();
}, 2000);

console.log('%c📝 Anotações com sincronização completa!', 'color: #9333ea; font-size: 20px; font-weight: bold;');