// daily-phrases.js - Lista de frases motivacionais, reflexivas e divertidas (com toque africano e moçambicano)
// ⭐ CORRIGIDO: Usa UTC para evitar problemas de fuso horário

const FRASES_DO_DIA = [
    // Frases clássicas (mantidas algumas)
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Não espere o momento perfeito. Aproveite o que tem e faça acontecer.",
    "Seu futuro é criado pelo que você faz hoje, não amanhã.",
    "Pequenos passos todos os dias levam a grandes conquistas.",
    "Estudar não é um evento, é um hábito.",
    "A disciplina é a ponte entre metas e realizações.",
    "O conhecimento é a única riqueza que cresce quando é compartilhada.",
    "Nunca é tarde para ser o que você poderia ter se tornado.",

    // 🇲🇿 Sabedoria moçambicana e africana
    "Em Moz, a chuva não avisa – mas quem planta, colhe.",
    "O macaco não pula de galho em galho sem razão – ele sabe onde está o fruto.",
    "Se queres ir rápido, vá sozinho. Se queres ir longe, vá acompanhado.",
    "Até o leão mais forte precisa descansar à sombra da árvore.",
    "A caneta é mais leve que a enxada, mas pode cavar poços mais profundos.",
    "Não há caminho sem poeira, nem vitória sem suor.",
    "O velho que senta à sombra da mangueira já viveu mais tempestades que o jovem que corre.",
    "O aluno que não pergunta é como o viajante que não olha o mapa.",

    // 😄 Frases divertidas e leves
    "Estudar é igual a comer xima sem molho: é possível, mas não anima! ",
    "Se a vida te der limões, vende e compra uma Coca-Cola!",
    "O problema de acordar cedo é que a almofada ainda está com saudade de você.",
    "Dormir na sala de aula é estudar com os olhos fechados.",
    "Minha matéria favorita? O intervalo!",
    "Dizem que a prática leva à perfeição… mas eu ainda estou praticando como começar a praticar.",
    "O segredo da felicidade? Estar sempre perto de quem tem comida e compartilha.",
    "Se amanhã é outro dia, então vou deixar pra amanhã o que não fiz hoje.",

    // 🌍 Mais reflexões africanas
    "O rio não precisa de mapa para encontrar o mar.",
    "Em África, a história não se escreve nos livros, mas nas cicatrizes e nas canções.",
    "A boca que mente seca antes do poço.",
    "O caçador que não treina a pontaria nunca vai jantar carne.",
    "A tartaruga só chega ao outro lado do rio se começar a nadar.",
    "O sol nasce para todos, mas só acordam cedo os que querem ver o dia.",
    "Nossos avós não tinham relógio, mas sabiam a hora de tudo."
];

// ⭐ Função que retorna uma frase baseada na data atual (USANDO UTC)
function getFraseDoDia() {
    const hoje = new Date();
    
    // ⭐ USAR UTC para evitar problemas de fuso horário
    // Isso garante que a frase seja a mesma em todos os dispositivos,
    // independente do fuso horário (Moçambique, Brasil, Portugal, etc.)
    const ano = hoje.getUTCFullYear();
    const mes = hoje.getUTCMonth();
    const dia = hoje.getUTCDate();
    
    // Criar data UTC para calcular o dia do ano
    const dataUTC = new Date(Date.UTC(ano, mes, dia));
    const inicioAno = new Date(Date.UTC(ano, 0, 0));
    const diffMs = dataUTC - inicioAno;
    const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Calcular índice baseado no dia do ano + ano (para variar entre anos)
    const indice = (diaDoAno + ano) % FRASES_DO_DIA.length;
    
    return FRASES_DO_DIA[indice];
}

// ⭐ Função que retorna a frase do dia com a data atual (para debug)
function getFraseDoDiaComData() {
    const hoje = new Date();
    const ano = hoje.getUTCFullYear();
    const mes = hoje.getUTCMonth() + 1;
    const dia = hoje.getUTCDate();
    
    const frase = getFraseDoDia();
    const dataStr = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
    
    return {
        frase: frase,
        data: dataStr,
        indice: (Math.floor((new Date(Date.UTC(ano, mes - 1, dia)) - new Date(Date.UTC(ano, 0, 0))) / (1000 * 60 * 60 * 24)) + ano) % FRASES_DO_DIA.length,
        totalFrases: FRASES_DO_DIA.length
    };
}

// ⭐ Função para forçar uma frase específica (para testes)
function getFrasePorIndice(indice) {
    if (indice >= 0 && indice < FRASES_DO_DIA.length) {
        return FRASES_DO_DIA[indice];
    }
    return getFraseDoDia();
}

// Exportar para uso global
window.FrasesDoDia = {
    getFraseDoDia: getFraseDoDia,
    getFraseDoDiaComData: getFraseDoDiaComData,
    getFrasePorIndice: getFrasePorIndice,
    todasFrases: FRASES_DO_DIA,
    totalFrases: FRASES_DO_DIA.length
};

console.log('[Frases] ✅ Módulo carregado com', FRASES_DO_DIA.length, 'frases disponíveis (incluindo sabedoria africana e moçambicana 🇲🇿)');
console.log('[Frases] 📅 Frase do dia (UTC):', getFraseDoDia());
console.log('[Frases] 📊 Info:', getFraseDoDiaComData());