// ===== VERIFICAÇÃO DE LOGIN =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) { 
        window.location.href = '../login/index.html'; 
        return; 
    }
    inicializarAnotacoes();
});

// ===== SISTEMA DE ANOTAÇÕES =====
let anotacoes = [];
let anotacaoAtualId = null;

function inicializarAnotacoes() {
    carregarAnotacoes();
    configurarEventos();
    carregarPrimeiraAnotacao();
}

function configurarEventos() {
    // Eventos do editor
    const editor = document.getElementById('editor');
    const noteTitle = document.querySelector('.note-title');
    
    editor.addEventListener('input', () => {
        programarAutoSave();
    });
    
    noteTitle.addEventListener('input', () => {
        programarAutoSave();
    });
    
    // Eventos das notas na sidebar
    document.querySelectorAll('.note-item').forEach(item => {
        item.addEventListener('click', function() {
            const noteId = this.dataset.id;
            carregarAnotacao(noteId);
        });
    });
    
    // Evento do botão nova nota
    const btnNew = document.querySelector('.btn-new');
    if (btnNew) {
        btnNew.addEventListener('click', criarNovaAnotacao);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') { 
            e.preventDefault(); 
            salvarAnotacaoAtual(); 
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') { 
            e.preventDefault(); 
            formatText('bold'); 
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') { 
            e.preventDefault(); 
            formatText('italic'); 
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') { 
            e.preventDefault(); 
            formatText('underline'); 
        }
    });
}

// ===== CARREGAR ANOTAÇÕES DO LOCALSTORAGE =====
function carregarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    const storageKey = `anotacoes_${usuario.email}`;
    const anotacoesSalvas = localStorage.getItem(storageKey);
    
    if (anotacoesSalvas) {
        anotacoes = JSON.parse(anotacoesSalvas);
    } else {
        // Anotações padrão para primeiro acesso
        anotacoes = [
            {
                id: gerarId(),
                titulo: 'Introdução à Física Quântica',
                conteudo: `<h2>Introdução à Física Quântica</h2>
                        <h3>Conceitos Fundamentais</h3>
                        <p>A física quântica estuda o comportamento da matéria e energia em escalas atômicas e subatômicas.</p>
                        <h3>Princípios Básicos</h3>
                        <ul>
                            <li><strong>Dualidade onda-partícula</strong>: Partículas podem se comportar como ondas</li>
                            <li><strong>Princípio da Incerteza de Heisenberg</strong>: Impossível medir posição e momento simultaneamente</li>
                            <li><strong>Quantização de energia</strong>: Energia existe em pacotes discretos chamados "quanta"</li>
                            <li><strong>Superposição quântica</strong>: Um sistema pode existir em múltiplos estados</li>
                        </ul>
                        <h3>Equação de Schrödinger</h3>
                        <p>A equação fundamental da mecânica quântica:</p>
                        <pre>iℏ ∂ψ/∂t = Ĥψ</pre>
                        <p>Onde <strong>ψ</strong> é a função de onda e <strong>Ĥ</strong> é o operador hamiltoniano.</p>
                        <h3>Aplicações Práticas</h3>
                        <ol>
                            <li>Computação quântica</li>
                            <li>Criptografia quântica</li>
                            <li>Sensores de alta precisão</li>
                            <li>Lasers e semicondutores</li>
                        </ol>
                        <blockquote>"Qualquer pessoa que não ficou chocada com a física quântica não a entendeu." - Niels Bohr</blockquote>
                        <h3>Links Relacionados</h3>
                        <p><a href="#">[Mecânica Clássica]</a></p>`,
                dataModificacao: new Date().toISOString(),
                dataCriacao: new Date().toISOString()
            },
            {
                id: gerarId(),
                titulo: 'Cálculo Diferencial',
                conteudo: '<h2>Cálculo Diferencial</h2><p>Derivadas e aplicações...</p>',
                dataModificacao: new Date(Date.now() - 86400000).toISOString(), // ontem
                dataCriacao: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: gerarId(),
                titulo: 'Programação Web',
                conteudo: '<h2>Programação Web</h2><p>HTML, CSS e JavaScript...</p>',
                dataModificacao: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
                dataCriacao: new Date(Date.now() - 172800000).toISOString()
            }
        ];
        salvarAnotacoes();
    }
    
    renderizarListaAnotacoes();
}

// ===== RENDERIZAR LISTA DE ANOTAÇÕES =====
function renderizarListaAnotacoes() {
    const notesList = document.getElementById('notesList');
    if (!notesList) return;
    
    notesList.innerHTML = '';
    
    anotacoes.sort((a, b) => new Date(b.dataModificacao) - new Date(a.dataModificacao));
    
    anotacoes.forEach(anotacao => {
        const preview = anotacao.conteudo.replace(/<[^>]*>/g, '').substring(0, 50) + '...';
        const data = new Date(anotacao.dataModificacao);
        const dataFormatada = formatarData(data);
        
        const noteItem = document.createElement('div');
        noteItem.className = 'note-item';
        if (anotacao.id === anotacaoAtualId) {
            noteItem.classList.add('active');
        }
        noteItem.dataset.id = anotacao.id;
        noteItem.innerHTML = `
            <div class="note-item-title">${anotacao.titulo}</div>
            <div class="note-item-preview">${preview}</div>
            <div class="note-item-date">${dataFormatada}</div>
        `;
        
        noteItem.addEventListener('click', () => {
            carregarAnotacao(anotacao.id);
        });
        
        notesList.appendChild(noteItem);
    });
}

// ===== FORMATAR DATA =====
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

// ===== CARREGAR PRIMEIRA ANOTAÇÃO =====
function carregarPrimeiraAnotacao() {
    if (anotacoes.length > 0) {
        carregarAnotacao(anotacoes[0].id);
    } else {
        criarNovaAnotacao();
    }
}

// ===== CARREGAR ANOTAÇÃO ESPECÍFICA =====
function carregarAnotacao(id) {
    const anotacao = anotacoes.find(a => a.id === id);
    if (!anotacao) return;
    
    anotacaoAtualId = id;
    
    const noteTitle = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    noteTitle.value = anotacao.titulo;
    editor.innerHTML = anotacao.conteudo;
    
    document.querySelectorAll('.note-item').forEach(item => {
        if (item.dataset.id === id) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
    
    atualizarUltimoSalvo(anotacao.dataModificacao);
}

// ===== CRIAR NOVA ANOTAÇÃO =====
function criarNovaAnotacao() {
    const novaAnotacao = {
        id: gerarId(),
        titulo: 'Nova Anotação',
        conteudo: '<h2>Nova Anotação</h2><p>Comece a escrever...</p>',
        dataModificacao: new Date().toISOString(),
        dataCriacao: new Date().toISOString()
    };
    
    anotacoes.push(novaAnotacao);
    salvarAnotacoes();
    
    anotacaoAtualId = novaAnotacao.id;
    
    const noteTitle = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    noteTitle.value = novaAnotacao.titulo;
    editor.innerHTML = novaAnotacao.conteudo;
    
    renderizarListaAnotacoes();
    
    // Focar no título para edição imediata
    noteTitle.focus();
    noteTitle.select();
    
    mostrarToast('Nova anotação criada!');
}

// ===== SALVAR ANOTAÇÃO ATUAL =====
function salvarAnotacaoAtual() {
    if (!anotacaoAtualId) return;
    
    const noteTitle = document.querySelector('.note-title');
    const editor = document.getElementById('editor');
    
    const anotacaoIndex = anotacoes.findIndex(a => a.id === anotacaoAtualId);
    if (anotacaoIndex === -1) return;
    
    anotacoes[anotacaoIndex] = {
        ...anotacoes[anotacaoIndex],
        titulo: noteTitle.value || 'Sem título',
        conteudo: editor.innerHTML,
        dataModificacao: new Date().toISOString()
    };
    
    salvarAnotacoes();
    renderizarListaAnotacoes();
    
    atualizarUltimoSalvo(new Date().toISOString());
    mostrarToast('Anotação salva com sucesso!');
}

// ===== SALVAR TODAS ANOTAÇÕES NO LOCALSTORAGE =====
function salvarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    const storageKey = `anotacoes_${usuario.email}`;
    localStorage.setItem(storageKey, JSON.stringify(anotacoes));
}

// ===== AUTO SAVE =====
let autoSaveTimer;
function programarAutoSave() {
    const lastSaved = document.querySelector('.last-saved');
    lastSaved.textContent = 'Digitando...';
    
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
        salvarAnotacaoAtual();
    }, 2000);
}

// ===== ATUALIZAR ÚLTIMO SALVO =====
function atualizarUltimoSalvo(dataISO) {
    const lastSaved = document.querySelector('.last-saved');
    if (!lastSaved) return;
    
    if (!dataISO) {
        lastSaved.textContent = 'Salvo automaticamente';
        return;
    }
    
    const data = new Date(dataISO);
    const agora = new Date();
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    
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

// ===== GERAR ID ÚNICO =====
function gerarId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// ===== FUNÇÕES DO EDITOR =====
function formatText(command, value = null) {
    document.execCommand(command, false, value);
    document.getElementById('editor').focus();
    programarAutoSave();
}

// ===== FUNÇÕES DE INTERFACE =====
function mostrarToast(mensagem) {
    const toast = document.getElementById('toast');
    const toastSpan = toast.querySelector('span');
    toastSpan.textContent = mensagem;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

// Manter função saveNote para compatibilidade
function saveNote() {
    salvarAnotacaoAtual();
}

// Manter função createNewNote para compatibilidade
function createNewNote() {
    criarNovaAnotacao();
}

// Manter função showToast para compatibilidade
function showToast() {
    mostrarToast('Anotação salva com sucesso!');
}

// ===== LOGOUT =====
function logout() {
    if (confirm('Deseja sair?')) {
        // Salvar anotação atual antes de sair
        if (anotacaoAtualId) {
            salvarAnotacaoAtual();
        }
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

// Inicializar
updateLastSaved(); // função original mantida para compatibilidade


// ===== NOTIFICAR OUTRAS ABAS SOBRE MUDANÇAS =====
function notificarSincronizacao() {
    localStorage.setItem('sync_notification', Date.now().toString());
}

// Modificar a função salvarAnotacoes
function salvarAnotacoes() {
    const usuario = JSON.parse(localStorage.getItem('usuarioLogado'));
    if (!usuario) return;
    
    const storageKey = `anotacoes_${usuario.email}`;
    localStorage.setItem(storageKey, JSON.stringify(anotacoes));
    
    // NOTIFICAR OUTRAS ABAS
    notificarSincronizacao();
}
