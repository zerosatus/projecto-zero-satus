// anotacoes/script.js - COMPLETO CORRIGIDO COM CACHEMANAGER

window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) { 
        window.location.href = '../login/index.html'; 
        return; 
    }
    
    // Inicializar sincronização
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
    
    // ✅ ESCUTAR EVENTOS DE SINCRONIZAÇÃO
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

    // ✅ ESCUTAR MUDANÇAS NO localStorage (outras abas)
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.includes('_notes')) {
            console.log('[Anotacoes] Mudança detectada em outra aba:', e.key);
            carregarAnotacoesDoCacheSemPerderEditor();
        }
    });
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: CARREGAR ANOTAÇÕES
// ============================================
function carregarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    // ✅ PRIORIDADE 1: CacheManager (JÁ ENVIA PARA SUPABASE)
    if (window.CacheManager) {
        const cached = window.CacheManager.get('notes', null);
        if (cached !== null && Array.isArray(cached)) {
            anotacoes = cached;
            console.log('[Anotacoes] Carregado do CacheManager:', anotacoes.length);
            renderizarListaAnotacoes();
            
            // ✅ GARANTIR QUE LOCALSTORAGE TAMBÉM ESTÁ ATUALIZADO
            const userId = usuario.id;
            localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoes));
            return;
        }
    }
    
    // ✅ PRIORIDADE 2: localStorage com UUID
    const userId = usuario.id;
    const storageKey = `${userId}_notes`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    
    if (anotacoesSalvas) {
        anotacoes = JSON.parse(anotacoesSalvas);
        console.log('[Anotacoes] Carregado do localStorage:', anotacoes.length);
    } else {
        // Tentar migrar dados antigos (se existirem com email)
        const oldStorageKey = `anotacoes_${usuario.email}`;
        const oldAnotacoes = localStorage.getItem(oldStorageKey);
        if (oldAnotacoes) {
            anotacoes = JSON.parse(oldAnotacoes);
            console.log('[Anotacoes] Migrado do formato antigo:', anotacoes.length);
            localStorage.setItem(storageKey, oldAnotacoes);
            localStorage.removeItem(oldStorageKey);
        } else {
            anotacoes = [];
        }
    }
    
    // ✅ SALVAR NO CACHEMANAGER (para enviar para nuvem)
    if (window.CacheManager && anotacoes.length > 0) {
        window.CacheManager.set('notes', anotacoes, true);
    }
    
    renderizarListaAnotacoes();
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: SALVAR ANOTAÇÕES
// ============================================
function salvarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    // ✅ 1. Salvar no CacheManager (ENVIA PARA SUPABASE)
    if (window.CacheManager) {
        window.CacheManager.set('notes', anotacoes, true);
        console.log('[Anotacoes] ✅ Salvo no CacheManager (nuvem):', anotacoes.length);
    }
    
    // ✅ 2. Backup no localStorage com UUID
    const userId = usuario.id;
    const storageKey = `${userId}_notes`;
    localStorage.setItem(storageKey, JSON.stringify(anotacoes));
    
    // ✅ 3. Backup com email (compatibilidade)
    localStorage.setItem(`anotacoes_${usuario.email}`, JSON.stringify(anotacoes));
    
    // ✅ 4. Disparar evento para outras abas
    window.dispatchEvent(new CustomEvent('notesUpdated', { detail: { notes: anotacoes } }));
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: SALVAR ANOTAÇÃO ATUAL
// ============================================
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
            dataModificacao: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        // ✅ CHAMAR salvarAnotacoes() que usa CacheManager
        salvarAnotacoes();
        renderizarListaAnotacoes();
        atualizarUltimoSalvo(new Date().toISOString());
        
        console.log('[Anotacoes] ✅ Anotação salva com sucesso');
    } catch (error) {
        console.error('[Anotacoes] Erro ao salvar:', error);
    } finally {
        isSaving = false;
    }
}

// ============================================
// ✅ FUNÇÃO CORRIGIDA: CRIAR NOVA ANOTAÇÃO
// ============================================
function criarNovaAnotacao() {
    // Salvar anotação atual antes de criar nova
    if (anotacaoAtualId) {
        salvarAnotacaoAtual();
    }
    
    const dataAtual = new Date().toISOString();
    const novaAnotacao = {
        id: gerarId(),
        titulo: '',
        conteudo: '',
        dataModificacao: dataAtual,
        dataCriacao: dataAtual,
        updated_at: dataAtual,
        created_at: dataAtual
    };
    
    anotacoes.unshift(novaAnotacao);
    anotacaoAtualId = novaAnotacao.id;
    
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    if (titleInput) titleInput.value = '';
    if (editor) editor.innerHTML = '';
    
    renderizarListaAnotacoes();
    
    // ✅ SALVAR NO CACHEMANAGER
    salvarAnotacoes();
    
    if (titleInput) titleInput.focus();
    mostrarToast('Nova anotação criada!', 'success');
}

// ============================================
// FUNÇÃO: CARREGAR DO CACHE SEM PERDER O EDITOR
// ============================================
function carregarAnotacoesDoCacheSemPerderEditor() {
    if (!window.CacheManager) return;
    
    // Salvar anotação atual antes de recarregar
    if (anotacaoAtualId && !isSaving) {
        salvarAnotacaoAtual();
    }
    
    const cachedNotes = window.CacheManager.get('notes', null);
    if (cachedNotes !== null && Array.isArray(cachedNotes)) {
        const oldCount = anotacoes.length;
        
        // Verificar se a anotação atual ainda existe no cache
        const anotacaoAtualExistente = anotacaoAtualId ? cachedNotes.find(a => a.id === anotacaoAtualId) : null;
        
        // ✅ ATUALIZAR O CACHE EM MEMÓRIA
        anotacoes = cachedNotes;
        
        // ✅ ATUALIZAR LOCALSTORAGE
        const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuario) {
            const userId = usuario.id;
            localStorage.setItem(`${userId}_notes`, JSON.stringify(anotacoes));
        }
        
        if (anotacaoAtualId) {
            if (anotacaoAtualExistente) {
                // Atualizar o editor se o conteúdo mudou externamente
                const titleInput = document.querySelector('.note-title');
                const editor = document.getElementById('editor');
                
                const tituloAtual = titleInput?.value || '';
                const conteudoAtual = editor?.innerHTML || '';
                const tituloCache = anotacaoAtualExistente.titulo || anotacaoAtualExistente.title || '';
                const conteudoCache = anotacaoAtualExistente.conteudo || anotacaoAtualExistente.content || '';
                
                if (tituloAtual !== tituloCache && tituloCache !== '') {
                    titleInput.value = tituloCache;
                }
                if (conteudoAtual !== conteudoCache && conteudoCache !== '') {
                    editor.innerHTML = conteudoCache;
                    atualizarUltimoSalvo(anotacaoAtualExistente.dataModificacao || anotacaoAtualExistente.updated_at);
                }
            } else if (anotacoes.length > 0) {
                // A anotação atual foi deletada em outro lugar, carregar a primeira
                carregarAnotacao(anotacoes[0].id);
                mostrarToast('Anotação atual foi removida em outro dispositivo', 'info');
            }
        }
        
        renderizarListaAnotacoes();
        
        if (oldCount !== anotacoes.length && anotacoes.length > 0) {
            mostrarToast(`${anotacoes.length} anotações sincronizadas!`, 'success');
        }
    }
}

// ============================================
// FUNÇÕES AUXILIARES (MANTER AS MESMAS)
// ============================================

function renderizarListaAnotacoes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    if (!anotacoes || anotacoes.length === 0) {
        notesList.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-secondary)"><i class="fas fa-sticky-note" style="font-size: 48px; margin-bottom: 16px; display: block;"></i>Nenhuma anotação<br>Clique em + para criar</div>';
        return;
    }
    
    anotacoes.sort((a, b) => new Date(b.dataModificacao || b.updated_at || b.date) - new Date(a.dataModificacao || a.updated_at || a.date));
    
    anotacoes.forEach(anotacao => {
        const preview = (anotacao.conteudo || anotacao.content || '').replace(/<[^>]*>/g, '').substring(0, 50) + '...';
        const data = new Date(anotacao.dataModificacao || anotacao.updated_at || anotacao.date || Date.now());
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

function carregarAnotacao(id) {
    if (anotacaoAtualId && anotacaoAtualId !== id) {
        salvarAnotacaoAtual();
    }
    
    const anotacao = anotacoes.find(a => a.id === id);
    if (!anotacao) return;
    
    anotacaoAtualId = id;
    const titleInput = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    if (titleInput) titleInput.value = anotacao.titulo || anotacao.title || '';
    if (editor) editor.innerHTML = anotacao.conteudo || anotacao.content || '';
    
    document.querySelectorAll('.note-item').forEach(item => {
        item.classList.toggle('active', item.dataset.id === id);
    });
    
    atualizarUltimoSalvo(anotacao.dataModificacao || anotacao.updated_at);
}

function carregarPrimeiraAnotacao() {
    if (anotacoes && anotacoes.length > 0 && !anotacaoAtualId) {
        carregarAnotacao(anotacoes[0].id);
    }
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

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const toastSpan = toast.querySelector('span');
    if (toastSpan) toastSpan.textContent = mensagem;
    
    if (tipo === 'error') {
        toast.style.background = 'linear-gradient(135deg, #d63031, #c0392b)';
    } else {
        toast.style.background = 'linear-gradient(135deg, #00b894, #059669)';
    }
    
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function saveNote() {
    salvarAnotacaoAtual();
    mostrarToast('Anotação salva!', 'success');
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

// ============================================
// FUNÇÕES GLOBAIS PARA SINCRONIZAÇÃO
// ============================================

window.carregarAnotacoes = function() {
    carregarAnotacoes();
};

window.recarregarAnotacoesDaNuvem = carregarAnotacoesDoCacheSemPerderEditor;

window.forcarSincronizacaoAnotacoes = async function() {
    if (window.CacheManager) {
        mostrarToast('Sincronizando...', 'info');
        await window.CacheManager.forceSync();
        carregarAnotacoesDoCacheSemPerderEditor();
        mostrarToast('Sincronização concluída!', 'success');
    }
};

// NAVEGAÇÃO DO MENU
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// Sincronização inicial atrasada
setTimeout(() => {
    carregarAnotacoesDoCacheSemPerderEditor();
}, 2000);

console.log('%c📝 Anotações com sincronização completa (CacheManager)!', 'color: #9333ea; font-size: 20px; font-weight: bold;');