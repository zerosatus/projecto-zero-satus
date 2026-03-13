// ===== shared-data.js =====
// Estruturas de dados compartilhadas entre PC e Mobile

// ==================== SCHEMAS ====================

const TarefaSchema = {
    id: String,
    nome: String,
    descricao: String,
    prioridade: String, // 'alta', 'media', 'baixa', 'nenhuma'
    prazo: String, // formato dd/mm/aaaa
    disciplina: String, // 'matematica', 'portugues', etc.
    subtasks: Array, // [{ texto: String, concluida: Boolean }]
    favorita: Boolean,
    concluida: Boolean,
    dataCriacao: String, // ISO
    dataConclusao: String // ISO ou null
};

const AnotacaoSchema = {
    id: String,
    titulo: String,
    conteudo: String, // HTML (rich text)
    dataModificacao: String, // ISO
    dataCriacao: String, // ISO
    disciplina: String, // opcional
    favorita: Boolean,
    tags: Array // ['Física', 'Importante']
};

const EventoSchema = {
    id: String,
    title: String,
    description: String,
    type: String, // 'aula', 'prova', 'trabalho', 'reuniao', 'outro'
    day: Number,
    month: Number,
    year: Number,
    time: String, // 'HH:MM'
    endTime: String,
    repeat: String, // 'nao', 'diario', 'semanal', 'mensal'
    reminder: Boolean,
    color: String // hexadecimal
};

// ==================== FUNÇÕES DE CRUD ====================

function getStorageKey(usuario, tipo) {
    return `${tipo}_${usuario.email}`;
}

function carregarDados(usuario, tipo, dadosPadrao) {
    const key = getStorageKey(usuario, tipo);
    const salvos = localStorage.getItem(key);
    return salvos ? JSON.parse(salvos) : dadosPadrao;
}

function salvarDados(usuario, tipo, dados) {
    const key = getStorageKey(usuario, tipo);
    localStorage.setItem(key, JSON.stringify(dados));
}

// ==================== FUNÇÕES DE CONVERSÃO ====================

// PC -> Mobile
function converterTarefaPCparaMobile(tarefaPC) {
    return {
        id: tarefaPC.id,
        title: tarefaPC.nome,
        subject: getTextoDisciplina(tarefaPC.disciplina),
        date: tarefaPC.prazo || '',
        color: getCorDisciplina(tarefaPC.disciplina),
        completed: tarefaPC.concluida || false,
        priority: tarefaPC.prioridade || 'media'
    };
}

function converterAnotacaoPCparaMobile(anotacaoPC) {
    let cor = 'fisica';
    if (anotacaoPC.tags && anotacaoPC.tags.length > 0) {
        const tag = anotacaoPC.tags[0].toLowerCase();
        if (tag.includes('fís') || tag.includes('fisica')) cor = 'fisica';
        else if (tag.includes('ing') || tag.includes('ingles')) cor = 'ingles';
        else if (tag.includes('port') || tag.includes('portugues')) cor = 'portugues';
        else if (tag.includes('quím') || tag.includes('quimica')) cor = 'quimica';
        else if (tag.includes('mat') || tag.includes('matematica')) cor = 'matematica';
        else if (tag.includes('hist') || tag.includes('historia')) cor = 'historia';
    }
    
    return {
        id: anotacaoPC.id,
        title: anotacaoPC.titulo,
        subject: anotacaoPC.disciplina || 'Geral',
        content: stripHtml(anotacaoPC.conteudo).substring(0, 100),
        date: new Date(anotacaoPC.dataModificacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        color: cor
    };
}

function converterEventoPCparaMobile(eventoPC) {
    return {
        id: eventoPC.id,
        title: eventoPC.title,
        description: eventoPC.description || '',
        date: `${eventoPC.year}-${String(eventoPC.month + 1).padStart(2, '0')}-${String(eventoPC.day).padStart(2, '0')}`,
        start: eventoPC.time,
        end: eventoPC.endTime || '',
        type: eventoPC.type || 'outro',
        color: eventoPC.color || getEventColor(eventoPC.type)
    };
}

// Mobile -> PC
function converterTarefaMobileParaPC(tarefaMobile, tarefaExistente = null) {
    return {
        id: tarefaMobile.id,
        nome: tarefaMobile.title,
        descricao: tarefaExistente?.descricao || '',
        prioridade: tarefaMobile.priority || 'media',
        prazo: tarefaMobile.date || '',
        disciplina: getDisciplinaFromText(tarefaMobile.subject),
        subtasks: tarefaExistente?.subtasks || [],
        favorita: tarefaExistente?.favorita || false,
        concluida: tarefaMobile.completed || false,
        dataCriacao: tarefaExistente?.dataCriacao || new Date().toISOString(),
        dataConclusao: tarefaMobile.completed ? new Date().toISOString() : null
    };
}

function converterAnotacaoMobileParaPC(anotacaoMobile, anotacaoExistente = null) {
    return {
        id: anotacaoMobile.id,
        titulo: anotacaoMobile.title,
        conteudo: anotacaoExistente?.conteudo || `<p>${anotacaoMobile.content || ''}</p>`,
        disciplina: anotacaoMobile.subject || 'Geral',
        tags: [anotacaoMobile.color],
        dataModificacao: new Date().toISOString(),
        dataCriacao: anotacaoExistente?.dataCriacao || new Date().toISOString(),
        favorita: anotacaoExistente?.favorita || false
    };
}

function converterEventoMobileParaPC(eventoMobile, eventoExistente = null) {
    const [ano, mes, dia] = eventoMobile.date.split('-').map(Number);
    
    return {
        id: eventoMobile.id,
        title: eventoMobile.title,
        description: eventoMobile.description || '',
        type: eventoMobile.type || 'outro',
        day: dia,
        month: mes - 1,
        year: ano,
        time: eventoMobile.start,
        endTime: eventoMobile.end || '',
        repeat: eventoExistente?.repeat || 'nao',
        reminder: eventoExistente?.reminder || false,
        color: eventoMobile.color || '#8b5cf6'
    };
}

// ==================== FUNÇÕES AUXILIARES ====================

function stripHtml(html) {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
}

function getTextoDisciplina(disciplina) {
    const textos = {
        matematica: 'Matemática', portugues: 'Português', historia: 'História',
        fisica: 'Física', quimica: 'Química', biologia: 'Biologia',
        geografia: 'Geografia', ingles: 'Inglês', outros: 'Outros'
    };
    return textos[disciplina] || disciplina;
}

function getCorDisciplina(disciplina) {
    const cores = {
        matematica: '#9b59b6', portugues: '#3498db', historia: '#e74c3c',
        fisica: '#e67e22', quimica: '#2ecc71', biologia: '#f1c40f',
        geografia: '#1abc9c', ingles: '#34495e', outros: '#95a5a6'
    };
    return cores[disciplina] || '#95a5a6';
}

function getDisciplinaFromText(text) {
    const mapa = {
        'matemática': 'matematica', 'matematica': 'matematica',
        'português': 'portugues', 'portugues': 'portugues',
        'história': 'historia', 'historia': 'historia',
        'física': 'fisica', 'fisica': 'fisica',
        'química': 'quimica', 'quimica': 'quimica',
        'biologia': 'biologia',
        'geografia': 'geografia',
        'inglês': 'ingles', 'ingles': 'ingles'
    };
    
    const lower = text.toLowerCase();
    for (let [key, value] of Object.entries(mapa)) {
        if (lower.includes(key)) return value;
    }
    return 'outros';
}

function getEventColor(type) {
    const cores = {
        'aula': '#6366f1',
        'prova': '#ef4444',
        'tarefa': '#10b981',
        'trabalho': '#f59e0b',
        'reuniao': '#8b5cf6',
        'outro': '#8b5cf6'
    };
    return cores[type] || '#8b5cf6';
}
