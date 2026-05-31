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
        carregarAnotacoes();
        renderizarListaAnotacoes();
        if (anotacaoAtualId) {
            const anotacaoAtualizada = anotacoes.find(a => a.id === anotacaoAtualId);
            if (anotacaoAtualizada) {
                document.querySelector('.note-title').value = anotacaoAtualizada.titulo || '';
                document.getElementById('editor').innerHTML = anotacaoAtualizada.conteudo || '';
            }
        }
    });
}

function carregarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null) {
            anotacoes = cached;
            console.log('[Anotacoes] Carregado do CacheManager:', anotacoes.length);
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
        salvarAnotacoes();
    }
    
    renderizarListaAnotacoes();
}

function renderizarListaAnotacoes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    if (!anotacoes || anotacoes.length === 0) {
        notesList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)"><i class="fas fa-sticky-note" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>Nenhuma anotação<br>Clique em + para criar</div>';
        return;
    }
    
    anotacoes.sort((a, b) => new Date(b.dataModificacao) - new Date(a.dataModificacao));
    
    anotacoes.forEach(anotacao => {
        const preview = anotacao.conteudo ? anotacao.conteudo.replace(/<[^>]*>/g, '').substring(0, 50) + '...' : 'Anotação vazia';
        const data = new Date(anotacao.dataModificacao);
        const dataFormatada = formatarData(data);
        
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        if (anotacao.id === anotacaoAtualId) noteItem.classList.add('active');
        noteItem.dataset.id = anotacao.id;
        noteItem.innerHTML = `
            <div class="note-item-title">${escapeHtml(anotacao.titulo || 'Sem título')}</div>
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
    if (anotacoes && anotacoes.length > 0) carregarAnotacao(anotacoes[0].id);
}

function carregarAnotacao(id) {
    const anotacao = anotacoes.find(a => a.id === id);
    if (!anotacao) return;
    
    anotacaoAtualId = id;
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    if (titleInput) titleInput.value = anotacao.titulo || '';
    if (editor) editor.innerHTML = anotacao.conteudo || '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Anotação vazia</p>';
    
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });
    
    atualizarUltimoSalvo(anotacao.dataModificacao);
}

function criarNovaAnotacao() {
    const novaAnotacao = {
        id: gerarId(),
        titulo: 'Nova Anotação',
        conteudo: '<p style="color: var(--text-secondary); text-align: center; padding: 40px;">Comece a escrever sua anotação aqui...</p>',
        dataModificacao: new Date().toISOString(),
        dataCriacao: new Date().toISOString()
    };
    
    anotacoes.unshift(novaAnotacao);
    salvarAnotacoes();
    anotacaoAtualId = novaAnotacao.id;
    
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    if (titleInput) titleInput.value = novaAnotacao.titulo;
    if (editor) editor.innerHTML = novaAnotacao.conteudo;
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
    
    anotacoes[anotacaoIndex] = {
        ...anotacoes[anotacaoIndex],
        titulo: noteTitle?.value || 'Sem título',
        conteudo: editor?.innerHTML || '',
        dataModificacao: new Date().toISOString()
    };
    
    salvarAnotacoes();
    renderizarListaAnotacoes();
    atualizarUltimoSalvo(new Date().toISOString());
}

function salvarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    const storageKey = `anotacoes_${usuario.email}`;
    localStorage.setItem(storageKey, JSON.stringify(anotacoes));
    
    if (window.CacheManager) {
        window.CacheManager.set('notes', anotacoes, true);
    }
}

let autoSaveTimer;
function programarAutoSave() {
    const lastSaved = document.querySelector('.last-saved');
    if (lastSaved) lastSaved.textContent = 'Digitando...';
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => salvarAnotacaoAtual(), 2000);
}

function atualizarUltimoSalvo(dataISO) {
    const lastSaved = document.querySelector('.last-saved');
    if (!lastSaved) return;
    if (!dataISO) { lastSaved.textContent = 'Salvo automaticamente'; return; }
    
    const data = new Date(dataISO);
    const agora = new Date();
    const diffMin = Math.floor((agora - data) / 60000);
    
    if (diffMin < 1) lastSaved.textContent = 'Salvo agora';
    else if (diffMin === 1) lastSaved.textContent = 'Salvo há 1 minuto';
    else if (diffMin < 60) lastSaved.textContent = `Salvo há ${diffMin} minutos`;
    else lastSaved.textContent = `Salvo às ${data.getHours().toString().padStart(2, '0')}:${data.getMinutes().toString().padStart(2, '0')}`;
}

function gerarId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 9); }
function escapeHtml(text) { if (!text) return ''; const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

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

function saveNote() { salvarAnotacaoAtual(); }
function createNewNote() { criarNovaAnotacao(); }

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

console.log('%c📝 Anotações', 'color: #9333ea; font-size: 20px; font-weight: bold;');