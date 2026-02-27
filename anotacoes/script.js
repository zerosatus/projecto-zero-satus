// ===== VERIFICAÇÃO DE LOGIN (ADICIONADO) =====
window.addEventListener('DOMContentLoaded', () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) { window.location.href = '../login/index.html'; return; }
    try {
        const userData = JSON.parse(usuario);
        const titulo = document.querySelector('.note-title');
        if (titulo && userData.nome) {
            // Opcional: personalizar título com nome do usuário
        }
    } catch(e) {}
});

// ===== LOGOUT (ADICIONADO) =====
function logout() {
    if (confirm('Deseja sair?')) {
        localStorage.removeItem('usuarioLogado');
        window.location.href = '../login/index.html';
    }
}

// ===== MENU ATIVO (ADICIONADO - sem bloquear links) =====
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function() {
        if (this.href && !this.href.endsWith('#')) {
            document.querySelectorAll('.menu-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        }
    });
});

// ===== SEU CÓDIGO ORIGINAL DO EDITOR (PRESERVADO) =====
const editor = document.getElementById('editor');
const noteTitle = document.querySelector('.note-title');
const lastSaved = document.querySelector('.last-saved');

function formatText(command, value = null) {
    document.execCommand(command, false, value);
    editor.focus();
}

function saveNote() {
    const title = noteTitle.value;
    const content = editor.innerHTML;
    console.log('Saving note:', { title, content });
    showToast();
    updateLastSaved();
}

function showToast() {
    const toast = document.getElementById('toast');
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 3000);
}

function updateLastSaved() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    lastSaved.textContent = `Salvo às ${timeString}`;
}

function createNewNote() {
    noteTitle.value = '';
    editor.innerHTML = '<h2>Nova Anotação</h2><p>Comece a escrever...</p>';
    updateLastSaved();
    showToast();
}

let autoSaveTimer;
editor.addEventListener('input', () => {
    clearTimeout(autoSaveTimer);
    lastSaved.textContent = 'Digitando...';
    autoSaveTimer = setTimeout(() => { saveNote(); }, 2000);
});

noteTitle.addEventListener('input', () => { lastSaved.textContent = 'Digitando...'; });

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNote(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); formatText('bold'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); formatText('italic'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); formatText('underline'); }
});

document.querySelectorAll('.note-item').forEach(item => {
    item.addEventListener('click', function() {
        document.querySelectorAll('.note-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    updateLastSaved();
    console.log('Painel do Aluno inicializado!');
});

const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);
observer.observe(editor);