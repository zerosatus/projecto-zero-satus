// inicio/script.js - COMPLETO COM SISTEMA DE DISCIPLINAS E HORÁRIO

let usuarioAtual = null;
let tarefas = [];
let anotacoes = [];
let eventos = [];
let weeklySchedule = {};
let timeSlots = [];
let profilePhotoUnsubscribe = null;
let editingSubject = null;
let selectedSubjectColor = '#9333ea';
let disciplinaEditando = null;
const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];

// ============================================
// MÓDULO DE DISCIPLINAS - SEM DADOS PADRÃO
// ============================================
const DisciplinaManager = {
    disciplinas: [],
    storageKey: null,
    _loading: false,
    _saveTimeout: null,
    _isInitialized: false,

    init(email) {
        this.storageKey = `disciplinas_${email}`;
        if (!this._isInitialized) {
            this.carregar();
            this._isInitialized = true;
        }
    },

    async carregar() {
        if (this._loading) return;
        this._loading = true;

        try {
            // Tentar carregar do localStorage primeiro
            const cached = localStorage.getItem(this.storageKey);
            let dados = null;

            if (cached) {
                try {
                    dados = JSON.parse(cached);
                } catch(e) {
                    console.warn('[Disciplinas] Cache corrompido');
                }
            }

            // Se não tem cache, tentar do banco
            if (!dados || dados.length === 0) {
                const userId = window.CacheManager?.getCurrentUserId();
                if (userId && window.DatabaseService) {
                    const cloudData = await window.DatabaseService.getDisciplinas(userId);
                    if (cloudData && cloudData.length > 0) {
                        dados = cloudData;
                        console.log('[Disciplinas] Carregadas da nuvem:', dados.length);
                    }
                }
            }

            // Se ainda não tem dados, inicia vazio
            if (!dados) {
                dados = [];
                console.log('[Disciplinas] Nenhuma disciplina encontrada');
            }

            this.disciplinas = dados;
            this.salvar(true);

            if (window.CacheManager) {
                window.CacheManager.set('disciplinas', dados, false);
            }

        } catch (error) {
            console.error('[Disciplinas] Erro ao carregar:', error);
            this.disciplinas = [];
            this.salvar(true);
        } finally {
            this._loading = false;
        }
    },

    salvar(skipCloud = false) {
        // Salvar no localStorage
        if (this.storageKey) {
            localStorage.setItem(this.storageKey, JSON.stringify(this.disciplinas));
        }

        // Salvar no CacheManager
        if (window.CacheManager) {
            window.CacheManager.set('disciplinas', this.disciplinas, false);
        }

        // Salvar na nuvem com debounce
        if (!skipCloud) {
            if (this._saveTimeout) {
                clearTimeout(this._saveTimeout);
            }
            this._saveTimeout = setTimeout(() => {
                this._saveToCloud();
            }, 500);
        }
    },

    async _saveToCloud() {
        const userId = window.CacheManager?.getCurrentUserId();
        if (!userId || !window.DatabaseService) return;

        try {
            await window.DatabaseService.saveDisciplinas(userId, this.disciplinas);
            console.log('[Disciplinas] Salvas na nuvem:', this.disciplinas.length);
        } catch (error) {
            console.error('[Disciplinas] Erro ao salvar na nuvem:', error);
        }
    },

    getAll() {
        return [...this.disciplinas];
    },

    getById(id) {
        return this.disciplinas.find(d => d.id === id);
    },

    getByNome(nome) {
        const normalizado = this.normalizar(nome);
        return this.disciplinas.find(d => this.normalizar(d.nome) === normalizado);
    },

    add(nome, cor, icone = 'fa-book') {
        const id = this.normalizar(nome);
        if (this.disciplinas.find(d => d.id === id)) {
            return { success: false, message: 'Disciplina já existe!' };
        }
        const nova = { id, nome, cor, icone };
        this.disciplinas.push(nova);
        this.salvar();
        return { success: true, disciplina: nova };
    },

    update(id, nome, cor, icone) {
        const index = this.disciplinas.findIndex(d => d.id === id);
        if (index === -1) return { success: false, message: 'Disciplina não encontrada!' };
        this.disciplinas[index] = { ...this.disciplinas[index], nome, cor, icone };
        this.salvar();
        return { success: true };
    },

    delete(id) {
        const index = this.disciplinas.findIndex(d => d.id === id);
        if (index === -1) return { success: false, message: 'Disciplina não encontrada!' };
        this.disciplinas.splice(index, 1);
        this.salvar();
        return { success: true };
    },

    estaEmUso(id) {
        return tarefas.some(t => (t.disciplina || t.subject) === id) ||
               Object.values(weeklySchedule).some(day =>
                   day.some(c => c.materia && this.normalizar(c.materia) === id)
               );
    },

    renderSelect(selectElement, valorSelecionado = null) {
        if (!selectElement) return;
        selectElement.innerHTML = '';

        if (this.disciplinas.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'Nenhuma disciplina cadastrada';
            selectElement.appendChild(option);
            return;
        }

        this.disciplinas.forEach(d => {
            const option = document.createElement('option');
            option.value = d.id;
            option.textContent = d.nome;
            if (d.id === valorSelecionado) option.selected = true;
            selectElement.appendChild(option);
        });
    },

    normalizar(texto) {
        return texto.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '_');
    }
};

// ============================================
// INICIALIZAÇÃO
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
    const usuario = localStorage.getItem('usuarioLogado');
    if (!usuario) {
        window.location.href = '../login/index.html';
        return;
    }

    try {
        usuarioAtual = JSON.parse(usuario);

        if (window.initSync) {
            console.log('[Inicio] Inicializando sync...');
            await window.initSync();
        }

        // Inicializar DisciplinaManager
        DisciplinaManager.init(usuarioAtual.email);

        carregarDadosDoCache();

        if (tarefas.length === 0 && anotacoes.length === 0 && eventos.length === 0 && Object.keys(weeklySchedule).length === 0) {
            await criarDadosVazios();
        }

        await carregarFotoPerfilDesktop();
        iniciarEscutaFotoDesktop();

        atualizarMiniPerfil();
        atualizarEstatisticasMini();
        atualizarFraseDoDiaDesktop();

        new Calendar();
        new CircularProgress();
        new StudyChart();
        new StudyTimer();

        document.getElementById('btnEditSchedule')?.addEventListener('click', abrirModalHorario);
        document.getElementById('btnGerenciarDisciplinas')?.addEventListener('click', abrirModalDisciplinas);

        configurarModalDisciplinas();

        window.addEventListener('cloudDataLoaded', (event) => {
            console.log('[Inicio] Cloud data loaded');
            DisciplinaManager.carregar();
            carregarDadosDoCache();
            atualizarEstatisticasMini();
            atualizarHorarioDesktop();
            atualizarListaDisciplinas();
            atualizarFraseDoDiaDesktop();
            if (window.calendarInstance) window.calendarInstance.renderCalendar();
            carregarFotoPerfilDesktop();
        });

        window.addEventListener('profilePhotoUpdated', (event) => {
            if (event.detail && event.detail.photoUrl) {
                atualizarAvatarDesktop(event.detail.photoUrl);
            }
        });

        iniciarEscutaCacheDesktop();

    } catch(e) {
        console.error('Erro ao carregar usuário:', e);
    }
});

function carregarDadosDoCache() {
    if (window.CacheManager) {
        tarefas = window.CacheManager.get('tasks', []);
        anotacoes = window.CacheManager.get('notes', []);
        eventos = window.CacheManager.get('calendarEvents', []);
        weeklySchedule = window.CacheManager.get('weeklySchedule', {});
        timeSlots = window.CacheManager.get('timeSlots', []);

        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        dias.forEach(dia => {
            if (!weeklySchedule[dia]) weeklySchedule[dia] = [];
        });

        atualizarHorarioDesktop();
        atualizarProximasAulas();
        atualizarProximasTarefas();
        atualizarListaDisciplinas();
    }
}

async function criarDadosVazios() {
    const weeklyScheduleVazio = { 'Seg': [], 'Ter': [], 'Qua': [], 'Qui': [], 'Sex': [] };

    if (window.CacheManager) {
        window.CacheManager.set('tasks', [], true);
        window.CacheManager.set('notes', [], true);
        window.CacheManager.set('calendarEvents', [], true);
        window.CacheManager.set('weeklySchedule', weeklyScheduleVazio, true);
        window.CacheManager.set('timeSlots', [], true);
    }

    tarefas = [];
    anotacoes = [];
    eventos = [];
    weeklySchedule = weeklyScheduleVazio;
    timeSlots = [];
}

// ============================================
// FUNÇÕES DE DISCIPLINAS
// ============================================
function configurarModalDisciplinas() {
    const formDisc = document.getElementById('formDisciplina');
    if (formDisc) {
        formDisc.addEventListener('submit', function(e) {
            e.preventDefault();
            salvarDisciplina();
        });
    }

    const colorInput = document.getElementById('discCor');
    if (colorInput) {
        colorInput.addEventListener('input', function() {
            document.getElementById('colorHexDisplay').textContent = this.value;
        });
    }

    const modalDisc = document.getElementById('modalDisciplinas');
    if (modalDisc) {
        modalDisc.addEventListener('click', function(e) {
            if (e.target === this) fecharModalDisciplinas();
        });
    }
}

function abrirModalDisciplinas() {
    disciplinaEditando = null;
    renderizarListaDisciplinas();
    limparFormDisciplina();
    const modal = document.getElementById('modalDisciplinas');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function fecharModalDisciplinas() {
    const modal = document.getElementById('modalDisciplinas');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    disciplinaEditando = null;
}

function renderizarListaDisciplinas() {
    const container = document.getElementById('listaDisciplinas');
    if (!container) return;

    const disciplinas = DisciplinaManager.getAll();

    if (disciplinas.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: var(--text-secondary);">Nenhuma disciplina cadastrada. Clique em "Nova Disciplina" para adicionar.</p>';
        return;
    }

    let html = '';
    disciplinas.forEach(d => {
        const emUso = DisciplinaManager.estaEmUso(d.id);
        html += `
            <div class="disciplina-card" data-id="${d.id}">
                <div class="disciplina-info">
                    <div class="disciplina-color" style="background-color: ${d.cor};">
                        <i class="fas ${d.icone || 'fa-book'}"></i>
                    </div>
                    <div class="disciplina-text">
                        <strong>${d.nome}</strong>
                        <span class="disciplina-id">${d.id}</span>
                        ${emUso ? '<span class="badge-uso">Em uso</span>' : ''}
                    </div>
                </div>
                <div class="disciplina-actions">
                    <button class="btn-edit-disc" onclick="editarDisciplina('${d.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete-disc" onclick="confirmarExcluirDisciplina('${d.id}')" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editarDisciplina(id) {
    const disc = DisciplinaManager.getById(id);
    if (!disc) return;

    disciplinaEditando = disc;
    document.getElementById('modalDiscTitle').textContent = 'Editar Disciplina';
    document.getElementById('discNome').value = disc.nome;
    document.getElementById('discCor').value = disc.cor;
    document.getElementById('colorHexDisplay').textContent = disc.cor;
    document.getElementById('discIcone').value = disc.icone || 'fa-book';
    document.getElementById('btnSalvarDisc').textContent = 'Salvar Alterações';

    window.scrollTo({ top: document.getElementById('formDisciplina').offsetTop, behavior: 'smooth' });
}

function confirmarExcluirDisciplina(id) {
    const disc = DisciplinaManager.getById(id);
    if (!disc) return;

    const emUso = DisciplinaManager.estaEmUso(id);
    let msg = `Deseja excluir a disciplina "${disc.nome}"?`;
    if (emUso) {
        msg += '\n\n⚠️ ATENÇÃO: Esta disciplina está sendo usada em tarefas ou horários.';
    }

    if (confirm(msg)) {
        const resultado = DisciplinaManager.delete(id);
        if (resultado.success) {
            renderizarListaDisciplinas();
            atualizarListaDisciplinas();
            mostrarToast('Disciplina excluída!', 'success');
        } else {
            mostrarToast(resultado.message, 'error');
        }
    }
}

function limparFormDisciplina() {
    document.getElementById('modalDiscTitle').textContent = 'Nova Disciplina';
    document.getElementById('discNome').value = '';
    document.getElementById('discCor').value = '#9333ea';
    document.getElementById('colorHexDisplay').textContent = '#9333ea';
    document.getElementById('discIcone').value = 'fa-book';
    document.getElementById('btnSalvarDisc').textContent = 'Criar Disciplina';
    disciplinaEditando = null;
}

function salvarDisciplina() {
    const nome = document.getElementById('discNome').value.trim();
    const cor = document.getElementById('discCor').value;
    const icone = document.getElementById('discIcone').value;

    if (!nome) {
        mostrarToast('Preencha o nome da disciplina!', 'error');
        return;
    }

    let resultado;
    if (disciplinaEditando) {
        resultado = DisciplinaManager.update(disciplinaEditando.id, nome, cor, icone);
    } else {
        resultado = DisciplinaManager.add(nome, cor, icone);
    }

    if (resultado.success) {
        limparFormDisciplina();
        renderizarListaDisciplinas();
        atualizarListaDisciplinas();
        mostrarToast(disciplinaEditando ? 'Disciplina atualizada!' : 'Disciplina criada!', 'success');
    } else {
        mostrarToast(resultado.message, 'error');
    }
}

function atualizarListaDisciplinas() {
    const subjectsGrid = document.getElementById('subjectsGrid');
    if (!subjectsGrid) return;

    const disciplinasMap = new Map();

    // Coletar das tarefas
    tarefas.forEach(t => {
        const disc = t.disciplina || t.subject;
        if (disc && disc !== 'outros') {
            if (!disciplinasMap.has(disc)) {
                disciplinasMap.set(disc, 0);
            }
            if (!t.completed) {
                disciplinasMap.set(disc, disciplinasMap.get(disc) + 1);
            }
        }
    });

    // Coletar do horário
    if (weeklySchedule) {
        Object.values(weeklySchedule).forEach(day => {
            if (Array.isArray(day)) {
                day.forEach(c => {
                    if (c && c.materia) {
                        const disc = DisciplinaManager.normalizar(c.materia);
                        if (!disciplinasMap.has(disc)) {
                            disciplinasMap.set(disc, 0);
                        }
                    }
                });
            }
        });
    }

    const disciplinas = Array.from(disciplinasMap.entries());

    if (disciplinas.length === 0) {
        subjectsGrid.innerHTML = '<p style="grid-column: span 2; text-align: center; padding: 20px; color: #888;">Nenhuma disciplina em uso</p>';
        return;
    }

    let html = '';
    disciplinas.forEach(([discId, count]) => {
        const disc = DisciplinaManager.getById(discId);
        const cor = disc ? disc.cor : '#9ca3af';
        const nome = disc ? disc.nome : discId;
        const icone = disc ? disc.icone : 'fa-book';

        html += `<div class="subject-card" style="background: ${cor}20; border-left: 3px solid ${cor};">
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas ${icone}" style="color: ${cor}; font-size: 16px;"></i>
                <span style="color: ${cor}; font-weight: 600;">${nome}</span>
            </div>
            ${count > 0 ? `<span style="background: var(--bg-card); padding: 2px 8px; border-radius: 10px; font-size: 12px; color: var(--text-secondary);">${count}</span>` : ''}
        </div>`;
    });

    subjectsGrid.innerHTML = html;
}

function getCorDisciplina(disciplina) {
    const disc = DisciplinaManager.getById(disciplina);
    if (disc) return disc.cor;
    return '#95a5a6';
}

function getNomeDisciplina(disciplina) {
    const disc = DisciplinaManager.getById(disciplina);
    if (disc) return disc.nome;
    return disciplina.charAt(0).toUpperCase() + disciplina.slice(1);
}

// ============================================
// SISTEMA DE HORÁRIO
// ============================================
function abrirModalHorario() {
    renderizarGradeEdicao();
    atualizarDatalistDisciplinas();
    document.getElementById('editScheduleModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharModalHorario() {
    document.getElementById('editScheduleModal').classList.remove('active');
    document.body.style.overflow = '';
}

function renderizarGradeEdicao() {
    const grid = document.getElementById('editScheduleGrid');
    if (!grid) return;

    let html = '<div class="day-header">Hora</div>';
    days.forEach(day => html += `<div class="day-header">${day}</div>`);

    const slots = timeSlots.length ? timeSlots : [];

    if (slots.length === 0) {
        html += `<div class="edit-cell" style="grid-column: span 6; padding: 40px; text-align: center; color: var(--text-secondary);">
            Nenhum horário cadastrado. Adicione um horário abaixo.
        </div>`;
        grid.innerHTML = html;
        return;
    }

    slots.forEach(time => {
        html += `<div class="time-slot-with-delete">
            <span class="time-slot-text">${time}</span>
            <button class="btn-delete-time" onclick="removerHorario('${time}')" title="Remover horário">
                <i class="fas fa-trash"></i>
            </button>
        </div>`;

        days.forEach(day => {
            const classItem = weeklySchedule[day]?.find(c => c.horaInicio === time);
            if (classItem && classItem.materia) {
                html += `<div class="edit-cell">
                    <div class="class-block subject-custom" style="background-color: ${classItem.color || '#9333ea'}" onclick="editarMateria('${day}', '${time}')">
                        ${escapeHtml(classItem.materia)}
                        <button class="btn-delete-class" onclick="event.stopPropagation(); removerAula('${day}', '${time}')" title="Remover aula">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>`;
            } else {
                html += `<div class="edit-cell">
                    <button class="btn-add" onclick="abrirModalMateria('${day}', '${time}')" title="Adicionar matéria">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>`;
            }
        });
    });

    grid.innerHTML = html;
}

function atualizarDatalistDisciplinas() {
    const datalist = document.getElementById('disciplinasList');
    if (!datalist) return;

    datalist.innerHTML = '';

    const disciplinas = DisciplinaManager.getAll();
    disciplinas.forEach(d => {
        const option = document.createElement('option');
        option.value = d.nome;
        datalist.appendChild(option);
    });
}

function abrirModalMateria(day, time) {
    editingSubject = null;
    selectedSubjectColor = '#9333ea';

    document.getElementById('subjectModalTitle').textContent = 'Adicionar Matéria';
    document.getElementById('subjectNameInput').value = '';
    document.getElementById('subjectTeacherInput').value = '';
    document.getElementById('subjectStartInput').value = time;
    document.getElementById('subjectEndInput').value = '';
    document.getElementById('subjectDayInput').value = day;

    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    document.querySelector('.color-option[data-color="#9333ea"]')?.classList.add('active');

    document.getElementById('subjectModal').classList.add('active');
}

function editarMateria(day, time) {
    const aula = weeklySchedule[day]?.find(c => c.horaInicio === time);
    if (!aula) return;

    editingSubject = { ...aula, day, time };
    selectedSubjectColor = aula.color || '#9333ea';

    document.getElementById('subjectModalTitle').textContent = 'Editar Matéria';
    document.getElementById('subjectNameInput').value = aula.materia || '';
    document.getElementById('subjectTeacherInput').value = aula.professor || '';
    document.getElementById('subjectStartInput').value = aula.horaInicio || '';
    document.getElementById('subjectEndInput').value = aula.horaFim || '';
    document.getElementById('subjectDayInput').value = day;

    document.querySelectorAll('.color-option').forEach(opt => {
        opt.classList.toggle('active', opt.dataset.color === selectedSubjectColor);
    });

    document.getElementById('subjectModal').classList.add('active');
}

function fecharModalMateria() {
    document.getElementById('subjectModal').classList.remove('active');
    editingSubject = null;
}

function selecionarCor(element) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
    element.classList.add('active');
    selectedSubjectColor = element.dataset.color;
}

async function salvarMateria(event) {
    event.preventDefault();

    const name = document.getElementById('subjectNameInput').value.trim();
    const startTime = document.getElementById('subjectStartInput').value;
    const endTime = document.getElementById('subjectEndInput').value;
    const day = document.getElementById('subjectDayInput').value;

    if (!name) {
        mostrarToast('Preencha o nome da matéria!', 'error');
        return;
    }
    if (!startTime || !endTime) {
        mostrarToast('Defina início e término!', 'error');
        return;
    }

    if (!weeklySchedule[day]) weeklySchedule[day] = [];

    if (editingSubject) {
        const oldStart = editingSubject.horaInicio;
        weeklySchedule[day] = weeklySchedule[day].filter(c => !(c.materia === editingSubject.materia && c.horaInicio === oldStart));
    }

    if (!timeSlots.includes(startTime)) {
        timeSlots.push(startTime);
        timeSlots.sort();
    }

    weeklySchedule[day].push({
        materia: name,
        professor: document.getElementById('subjectTeacherInput').value.trim() || '',
        color: selectedSubjectColor,
        horaInicio: startTime,
        horaFim: endTime
    });

    weeklySchedule[day].sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));

    if (window.CacheManager) {
        window.CacheManager.set('weeklySchedule', weeklySchedule, true);
        window.CacheManager.set('timeSlots', timeSlots, true);
    }

    fecharModalMateria();
    renderizarGradeEdicao();
    atualizarHorarioDesktop();
    atualizarListaDisciplinas();
    atualizarProximasAulas();
    mostrarToast(editingSubject ? 'Matéria atualizada!' : 'Matéria adicionada!', 'success');
}

async function removerHorario(timeSlot) {
    let hasClasses = false;
    for (const day of days) {
        if (weeklySchedule[day]?.some(cls => cls.horaInicio === timeSlot)) {
            hasClasses = true;
            break;
        }
    }

    if (hasClasses) {
        if (!confirm(`O horário ${timeSlot} possui aulas. Remover mesmo assim?`)) {
            return;
        }
    }

    const index = timeSlots.indexOf(timeSlot);
    if (index !== -1) timeSlots.splice(index, 1);

    for (const day of days) {
        if (weeklySchedule[day]) {
            weeklySchedule[day] = weeklySchedule[day].filter(cls => cls.horaInicio !== timeSlot);
        }
    }

    timeSlots.sort();

    if (window.CacheManager) {
        window.CacheManager.set('weeklySchedule', weeklySchedule, true);
        window.CacheManager.set('timeSlots', timeSlots, true);
    }

    renderizarGradeEdicao();
    atualizarHorarioDesktop();
    mostrarToast(`Horário ${timeSlot} removido!`, 'success');
}

async function removerAula(day, timeSlot) {
    if (!confirm(`Remover aula de ${day} às ${timeSlot}?`)) {
        return;
    }

    if (weeklySchedule[day]) {
        weeklySchedule[day] = weeklySchedule[day].filter(cls => cls.horaInicio !== timeSlot);

        if (window.CacheManager) {
            window.CacheManager.set('weeklySchedule', weeklySchedule, true);
        }

        renderizarGradeEdicao();
        atualizarHorarioDesktop();
        atualizarListaDisciplinas();
        mostrarToast('Aula removida!', 'success');
    }
}

function adicionarHorario() {
    const newTime = document.getElementById('newTimeInput').value;
    if (newTime && !timeSlots.includes(newTime)) {
        timeSlots.push(newTime);
        timeSlots.sort();
        if (window.CacheManager) {
            window.CacheManager.set('timeSlots', timeSlots, true);
        }
        renderizarGradeEdicao();
        atualizarHorarioDesktop();
        mostrarToast('Horário adicionado!', 'success');
    } else if (timeSlots.includes(newTime)) {
        mostrarToast('Este horário já existe!', 'error');
    } else {
        mostrarToast('Selecione um horário!', 'error');
    }
}

// ============================================
// FUNÇÕES DE FOTO DE PERFIL
// ============================================
async function carregarFotoPerfilDesktop() {
    if (!usuarioAtual) return;
    const miniAvatar = document.getElementById('miniAvatar');

    if (window.CacheManager) {
        const photoUrl = await window.CacheManager.getProfilePhotoUrl();

        if (photoUrl && photoUrl.startsWith('data:')) {
            if (miniAvatar) miniAvatar.src = photoUrl;
            usuarioAtual.profilePhotoUrl = photoUrl;
            localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
        } else {
            const iniciais = usuarioAtual.nome ?
                usuarioAtual.nome.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U';
            const defaultAvatar = `https://ui-avatars.com/api/?name=${iniciais}&background=9333ea&color=fff&size=70`;
            if (miniAvatar) miniAvatar.src = defaultAvatar;
        }
    }
}

function atualizarAvatarDesktop(photoUrl) {
    const miniAvatar = document.getElementById('miniAvatar');
    if (miniAvatar && photoUrl && photoUrl.startsWith('data:')) {
        miniAvatar.src = photoUrl;
    }
    if (usuarioAtual) {
        usuarioAtual.profilePhotoUrl = photoUrl;
        localStorage.setItem('usuarioLogado', JSON.stringify(usuarioAtual));
    }
}

function iniciarEscutaFotoDesktop() {
    // Implementação vazia - mantida para compatibilidade
}

function pararEscutaFotoDesktop() {
    if (profilePhotoUnsubscribe) {
        profilePhotoUnsubscribe();
        profilePhotoUnsubscribe = null;
    }
}

// ============================================
// FUNÇÕES DA UI
// ============================================
function atualizarMiniPerfil() {
    if (!usuarioAtual) return;
    const miniName = document.getElementById('miniName');
    const miniEmail = document.getElementById('miniEmail');
    if (miniName) miniName.textContent = usuarioAtual.nome || 'Usuário';
    if (miniEmail) miniEmail.textContent = usuarioAtual.email || '';
}

function atualizarEstatisticasMini() {
    const totalTarefas = tarefas.length;
    const tarefasConcluidas = tarefas.filter(t => t.completed).length;
    const percentualConclusao = totalTarefas > 0 ? Math.round((tarefasConcluidas / totalTarefas) * 100) : 0;
    let horasEstudo = 0;
    horasEstudo += eventos.filter(e => e.type === 'aula').length * 2;
    horasEstudo += tarefasConcluidas * 1.5;

    const progressoSemanal = Math.min(100, Math.round((tarefasConcluidas / (totalTarefas || 1)) * 100));

    const statTarefas = document.getElementById('statTarefas');
    const statConclusao = document.getElementById('statConclusao');
    const statHoras = document.getElementById('statHoras');
    const progressFill = document.getElementById('progressFill');
    const progressValue = document.getElementById('progressValue');
    const percentageEl = document.querySelector('.percentage');

    if (statTarefas) statTarefas.textContent = totalTarefas;
    if (statConclusao) statConclusao.textContent = percentualConclusao + '%';
    if (statHoras) statHoras.textContent = horasEstudo + 'h';
    if (progressFill) progressFill.style.width = progressoSemanal + '%';
    if (progressValue) progressValue.textContent = progressoSemanal + '%';
    if (percentageEl) percentageEl.textContent = progressoSemanal + '%';

    const totalHoursEl = document.getElementById('totalHours');
    if (totalHoursEl) totalHoursEl.textContent = horasEstudo + 'h';

    const circularProgress = document.querySelector('.progress-ring-fill');
    if (circularProgress) {
        const radius = circularProgress.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progressoSemanal / 100) * circumference;
        circularProgress.style.strokeDashoffset = offset;
    }
}

function atualizarHorarioDesktop() {
    const scheduleTableBody = document.getElementById('scheduleTableBody');
    if (!scheduleTableBody) return;
    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
    const slots = timeSlots.length ? timeSlots : [];

    if (slots.length === 0 || diasSemana.every(day => !weeklySchedule[day] || weeklySchedule[day].length === 0)) {
        scheduleTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 40px;">Nenhum horário cadastrado</td></tr>';
        return;
    }

    let html = '';
    slots.forEach(time => {
        html += '<tr>';
        html += `<td class="time-slot">${time}</td>`;
        diasSemana.forEach(day => {
            const aula = weeklySchedule[day]?.find(a => a.horaInicio === time);
            if (aula && aula.materia) {
                const cor = aula.color || getCorDisciplina(aula.materia.toLowerCase());
                html += `<td class="subject" style="background-color: ${cor}20; color: ${cor}; border-left: 3px solid ${cor};">
                    ${aula.materia}
                </td>`;
            } else {
                html += '<td class="empty-cell"></td>';
            }
        });
        html += '</tr>';
    });

    scheduleTableBody.innerHTML = html;
}

function atualizarProximasAulas() {
    const nextClassInfo = document.getElementById('nextClassInfo');
    if (!nextClassInfo) return;
    const agora = new Date();
    const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const hoje = diasSemana[agora.getDay()];
    const horaAtual = agora.getHours() + ':' + String(agora.getMinutes()).padStart(2, '0');

    let proximaAula = null;

    if (weeklySchedule[hoje]) {
        proximaAula = weeklySchedule[hoje].find(a => a.horaInicio > horaAtual);
    }

    if (!proximaAula) {
        const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
        const hojeIndex = dias.indexOf(hoje);
        for (let i = 1; i <= 5; i++) {
            const nextDay = dias[(hojeIndex + i) % 5];
            if (weeklySchedule[nextDay] && weeklySchedule[nextDay].length > 0) {
                proximaAula = weeklySchedule[nextDay][0];
                proximaAula.dia = nextDay;
                break;
            }
        }
    }

    if (proximaAula) {
        const diaTexto = proximaAula.dia ? proximaAula.dia : 'hoje';
        nextClassInfo.textContent = `${proximaAula.materia} - ${diaTexto} às ${proximaAula.horaInicio}`;
    } else {
        nextClassInfo.textContent = 'Nenhuma aula cadastrada';
    }
}

function atualizarProximasTarefas() {
    const nextTaskInfo = document.getElementById('nextTaskInfo');
    if (!nextTaskInfo) return;
    const tarefasPendentes = tarefas.filter(t => !t.completed);
    if (tarefasPendentes.length > 0) {
        nextTaskInfo.textContent = `${tarefasPendentes[0].title || tarefasPendentes[0].nome} - Pendente`;
    } else {
        nextTaskInfo.textContent = 'Nenhuma tarefa pendente';
    }
}

function atualizarFraseDoDiaDesktop() {
    const fraseElement = document.querySelector('.focus-content p');
    if (fraseElement && window.FrasesDoDia) {
        const frase = window.FrasesDoDia.getFraseDoDia();
        fraseElement.textContent = frase;
    } else if (fraseElement) {
        fraseElement.textContent = 'Não espere o momento perfeito. Aproveite o que tem e faça acontecer!';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function mostrarToast(mensagem, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const toastSpan = toast.querySelector('span');
    if (toastSpan) toastSpan.textContent = mensagem;

    toast.style.background = tipo === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ============================================
// CLASSES
// ============================================
class Calendar {
    constructor() {
        this.currentDate = new Date();
        this.today = new Date();
        window.calendarInstance = this;
        this.init();
    }

    init() {
        this.renderCalendar();
        document.getElementById('prevMonth')?.addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth')?.addEventListener('click', () => this.changeMonth(1));
    }

    changeMonth(delta) {
        this.currentDate.setMonth(this.currentDate.getMonth() + delta);
        this.renderCalendar();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

        const currentMonthEl = document.getElementById('currentMonth');
        if (currentMonthEl) currentMonthEl.textContent = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const calendarDates = document.getElementById('calendarDates');
        if (!calendarDates) return;

        calendarDates.innerHTML = '';

        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'date-cell empty';
            calendarDates.appendChild(emptyCell);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = day;

            if (year === this.today.getFullYear() && month === this.today.getMonth() && day === this.today.getDate()) {
                dateCell.classList.add('today');
            }

            calendarDates.appendChild(dateCell);
        }
    }
}

class CircularProgress {
    constructor() {
        this.circle = document.querySelector('.progress-ring-fill');
        if (!this.circle) return;
        this.radius = this.circle.r.baseVal.value;
        this.circumference = 2 * Math.PI * this.radius;
        this.init();
    }

    init() {
        this.circle.style.strokeDasharray = `${this.circumference} ${this.circumference}`;
        this.circle.style.strokeDashoffset = this.circumference;
    }
}

class StudyChart {
    constructor() {
        this.chartContainer = document.getElementById('studyChart');
        if (!this.chartContainer) return;
        this.init();
    }

    init() {
        this.chartContainer.innerHTML = '<canvas id="studyCanvas" width="200" height="80" style="width:100%;height:100%"></canvas>';
        this.drawChart();
        window.addEventListener('resize', () => this.drawChart());
    }

    drawChart() {
        const canvas = document.getElementById('studyCanvas');
        if (!canvas) return;

        canvas.width = canvas.offsetWidth || 200;
        canvas.height = canvas.offsetHeight || 80;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const dados = [2, 4, 3, 5, 4, 6, 3];
        const maxVal = Math.max(...dados, 5);
        const larguraBarra = (canvas.width - 40) / dados.length - 4;

        for (let i = 0; i < dados.length; i++) {
            const altura = (dados[i] / maxVal) * (canvas.height - 40);
            const x = 20 + i * (larguraBarra + 4);
            const y = canvas.height - 20 - altura;

            ctx.fillStyle = '#9333ea';
            ctx.fillRect(x, y, larguraBarra, altura);
        }
    }
}

class StudyTimer {
    constructor() {
        this.isActive = false;
        this.seconds = 0;
        this.interval = null;
        this.btnStart = document.getElementById('startStudy');
        if (this.btnStart) {
            this.btnStart.addEventListener('click', () => this.toggleTimer());
            this.carregarTimerSalvo();
        }
    }

    carregarTimerSalvo() {
        const timerKey = `timer_${usuarioAtual?.email}`;
        const timerSalvo = localStorage.getItem(timerKey);
        if (timerSalvo) {
            const timerData = JSON.parse(timerSalvo);
            const hoje = new Date().toDateString();
            if (timerData.data === hoje) {
                this.seconds = timerData.segundos;
                this.updateDisplay();
            }
        }
    }

    salvarTimer() {
        if (!usuarioAtual) return;
        const timerKey = `timer_${usuarioAtual.email}`;
        localStorage.setItem(timerKey, JSON.stringify({
            segundos: this.seconds,
            data: new Date().toDateString(),
            ativo: this.isActive
        }));
    }

    toggleTimer() {
        if (this.isActive) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        this.isActive = true;
        this.btnStart.innerHTML = '<i class="fas fa-pause"></i> Pausar Sessão';
        this.btnStart.style.background = '#e74c3c';
        this.interval = setInterval(() => {
            this.seconds++;
            this.updateDisplay();
            this.salvarTimer();
        }, 1000);
    }

    pauseTimer() {
        this.isActive = false;
        clearInterval(this.interval);
        this.btnStart.innerHTML = '<i class="fas fa-play"></i> Continuar Sessão';
        this.btnStart.style.background = '';
        this.salvarTimer();
    }

    updateDisplay() {
        const h = Math.floor(this.seconds / 3600);
        const m = Math.floor((this.seconds % 3600) / 60);
        const s = this.seconds % 60;
        this.btnStart.innerHTML = `<i class="fas fa-pause"></i> ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }
}

// ============================================
// ESCUTA DE CACHE
// ============================================
function iniciarEscutaCacheDesktop() {
    if (!window.CacheManager) {
        setTimeout(iniciarEscutaCacheDesktop, 1000);
        return;
    }

    window.CacheManager.addListener('weeklySchedule', (newSchedule) => {
        if (newSchedule && Object.keys(newSchedule).length > 0) {
            weeklySchedule = newSchedule;
            atualizarHorarioDesktop();
            atualizarListaDisciplinas();
        }
    });

    window.CacheManager.addListener('timeSlots', (newSlots) => {
        if (newSlots && newSlots.length) {
            timeSlots = newSlots;
            atualizarHorarioDesktop();
        }
    });

    window.CacheManager.addListener('tasks', (newTasks) => {
        if (newTasks) {
            tarefas = newTasks;
            atualizarEstatisticasMini();
            atualizarProximasTarefas();
            atualizarListaDisciplinas();
        }
    });

    window.CacheManager.addListener('notes', (newNotes) => {
        if (newNotes) anotacoes = newNotes;
    });

    window.CacheManager.addListener('calendarEvents', (newEvents) => {
        if (newEvents) {
            eventos = newEvents;
            if (window.calendarInstance) window.calendarInstance.renderCalendar();
        }
    });

    window.CacheManager.addListener('disciplinas', (newDisciplinas) => {
        if (newDisciplinas) {
            DisciplinaManager.disciplinas = newDisciplinas;
            DisciplinaManager.salvar(true);
            atualizarListaDisciplinas();
        }
    });
}

function logout() {
    if (confirm('Deseja sair?')) {
        pararEscutaFotoDesktop();
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

window.addEventListener('forceRefresh', () => {
    setTimeout(() => {
        if (window.CacheManager) {
            const newSchedule = window.CacheManager.get('weeklySchedule', {});
            const newSlots = window.CacheManager.get('timeSlots', []);
            if (newSchedule && Object.keys(newSchedule).length > 0) {
                weeklySchedule = newSchedule;
                timeSlots = newSlots;
                atualizarHorarioDesktop();
            }
            atualizarEstatisticasMini();
            atualizarListaDisciplinas();
            atualizarFraseDoDiaDesktop();
        }
    }, 100);
});

// Expor globalmente
window.DisciplinaManager = DisciplinaManager;

console.log('%c🏠 Painel Inicial - Sistema Completo!', 'color: #9333ea; font-size: 20px; font-weight: bold;');