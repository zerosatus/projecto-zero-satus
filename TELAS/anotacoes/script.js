// anotacoes/script.js - COMPLETO E CORRIGIDO

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) { 
        window.location.href = '../login/index.html'; 
        return; 
    }
    
    // 🔥 CRÍTICO: Inicializar sincronização ANTES de carregar dados
    if (window.initSync) {
        await window.initSync();
    }
    
    inicializarAnotacoes();
});

let anotacoes = [];
let anotacaoAtualId = null;
let autoSaveTimer = null;
let isSaving = false;

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
    
    window.addEventListener('cloudDataLoaded', () => {
        carregarAnotacoesDoCacheSemPerderEditor();
    });
    
    window.addEventListener('notesUpdated', (event) => {
        if (event.detail && event.detail.notes) {
            carregarAnotacoesDoCacheSemPerderEditor();
        }
    });
    
    window.addEventListener('forceRefresh', () => {
        carregarAnotacoesDoCacheSemPerderEditor();
    });
}

function carregarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null && Array.isArray(cached)) {
            anotacoes = cached;
            renderizarListaAnotacoes();
            return;
        }
    }
    
    const storageKey = `anotacoes_${usuario.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    
    if (anotacoesSalvas) {
        anotacoes = JSON.parse(anotacoesSalvas);
    } else {
        anotacoes = [];
    }
    
    if (window.CacheManager && anotacoes.length > 0) {
        window.CacheManager.set('notes', anotacoes, true);
    }
    
    renderizarListaAnotacoes();
}

function carregarAnotacoesDoCacheSemPerderEditor() {
    if (!window.CacheManager) return;
    
    if (anotacaoAtualId && !isSaving) {
        salvarAnotacaoAtual();
    }
    
    const cachedNotes = window.CacheManager.get('notes', null);
    if (cachedNotes !== null && Array.isArray(cachedNotes)) {
        const oldCount = anotacoes.length;
        const oldCurrentNote = anotacaoAtualId ? anotacoes.find(a => a.id === anotacaoAtualId) : null;
        
        anotacoes = cachedNotes;
        
        if (anotacaoAtualId) {
            const anotacaoAtualizada = anotacoes.find(a => a.id === anotacaoAtualId);
            if (anotacaoAtualizada) {
                const titleInput = document.querySelector('.note-title');
                const editor = document.getElementById('editor');
                
                const tituloAtual = titleInput?.value || '';
                const conteudoAtual = editor?.innerHTML || '';
                const tituloCache = anotacaoAtualizada.titulo || '';
                const conteudoCache = anotacaoAtualizada.conteudo || '';
                
                if (tituloAtual !== tituloCache && tituloCache !== '') {
                    titleInput.value = tituloCache;
                }
                if (conteudoAtual !== conteudoCache && conteudoCache !== '') {
                    editor.innerHTML = conteudoCache;
                    atualizarUltimoSalvo(anotacaoAtualizada.dataModificacao);
                }
            } else if (anotacoes.length > 0) {
                carregarAnotacao(anotacoes[0].id);
            }
        }
        
        renderizarListaAnotacoes();
        
        if (oldCount !== anotacoes.length && anotacoes.length > 0) {
            mostrarToast(`${anotacoes.length} anotações sincronizadas!`);
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
        const preview = anotacao.conteudo ? anotacao.conteudo.replace(/<[^>]*>/g, '').substring(0, 50) + '...' : 'Anotação vazia';
        const data = new Date(anotacao.dataModificacao || anotacao.date || Date.now());
        const dataFormatada = formatarData(data);
        const titulo = anotacao.titulo || 'Sem título';
        
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
    if (anotacoes && anotacoes.length > 0 && !anotacaoAtualId) {
        carregarAnotacao(anotacoes[0].id);
    }
}

function carregarAnotacao(id) {
    if (anotacaoAtualId && anotacaoAtualId !== id) {
        salvarAnotacaoAtual();
    }
    
    const anotacao = anotacoes.find(a => a.id === id);
    if (!anotacao) return;
    
    anotacaoAtualId = id;
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    if (titleInput) titleInput.value = anotacao.titulo || '';
    if (editor) editor.innerHTML = anotacao.conteudo || '';
    
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });
    
    atualizarUltimoSalvo(anotacao.dataModificacao);
}

function criarNovaAnotacao() {
    if (anotacaoAtualId) {
        salvarAnotacaoAtual();
    }
    
    const dataAtual = new Date().toISOString();
    const novaAnotacao = {
        id: gerarId(),
        titulo: '',
        conteudo: '',
        dataModificacao: dataAtual,
        dataCriacao: dataAtual
    };
    
    anotacoes.unshift(novaAnotacao);
    anotacaoAtualId = novaAnotacao.id;
    
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    if (titleInput) titleInput.value = '';
    if (editor) editor.innerHTML = '';
    
    renderizarListaAnotacoes();
    salvarAnotacoes();
    
    if (titleInput) titleInput.focus();
    mostrarToast('Nova anotação criada!');
}

function salvarAnotacaoAtual() {
    if (!anotacaoAtualId || isSaving) return;
    
    isSaving = true;
    
    try {
        const noteTitle = document.querySelector('.note-title');
        const editor = document.getElementById('editor');
        const anotacaoIndex = anotacoes.findIndex(a => a.id === anotacaoAtualId);
        
        if (anotacaoIndex === -1) {
            isSaving = false;
            return;
        }
        
        const novoTitulo = noteTitle?.value || '';
        const novoConteudo = editor?.innerHTML || '';
        
        const anotacaoAntiga = anotacoes[anotacaoIndex];
        if (anotacaoAntiga.titulo === novoTitulo && anotacaoAntiga.conteudo === novoConteudo) {
            isSaving = false;
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
    } finally {
        isSaving = false;
    }
}

function salvarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    if (window.CacheManager) {
        window.CacheManager.set('notes', anotacoes, true);
    }
    
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

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

window.carregarAnotacoes = function() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null && Array.isArray(cached)) {
            anotacoes = cached;
            renderizarListaAnotacoes();
        }
    }
};

window.recarregarAnotacoesDaNuvem = carregarAnotacoesDoCacheSemPerderEditor;
window.forcarSincronizacaoAnotacoes = async function() {
    if (window.CacheManager) {
        mostrarToast('Sincronizando...');
        await window.CacheManager.forceSync();
        carregarAnotacoesDoCacheSemPerderEditor();
        mostrarToast('Sincronização concluída!');
    }
};

setTimeout(() => {
    carregarAnotacoesDoCacheSemPerderEditor();
}, 2000);

console.log('%c📝 Anotações com sincronização completa!', 'color: #9333ea; font-size: 20px; font-weight: bold;');