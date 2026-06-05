// daily-phrases.js - Lista de frases motivacionais para o sistema

const FRASES_DO_DIA = [
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "Acredite em si mesmo e todo o resto se encaixará.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Não espere o momento perfeito. Aproveite o que tem e faça acontecer.",
    "Seu futuro é criado pelo que você faz hoje, não amanhã.",
    "Pequenos passos todos os dias levam a grandes conquistas.",
    "A persistência é o caminho do êxito.",
    "Estudar não é um evento, é um hábito.",
    "A disciplina é a ponte entre metas e realizações.",
    "O conhecimento é a única riqueza que cresce quando é compartilhada.",
    "Nunca é tarde para ser o que você poderia ter se tornado.",
    "A jornada de mil milhas começa com um único passo.",
    "Aprender é um dom, mesmo quando a dor é sua professora.",
    "Você não precisa ser ótimo para começar, mas precisa começar para ser ótimo.",
    "A determinação hoje leva ao sucesso amanhã.",
    "Dê o seu melhor, não para superar os outros, mas para superar a si mesmo.",
    "Estude enquanto eles dormem, lute enquanto eles descansam, sonhe enquanto eles apenas imaginam.",
    "A diferença entre o impossível e o possível está na vontade da pessoa.",
    "Foco, força e fé: a tríade do sucesso."
];

// Função que retorna uma frase baseada na data atual
// Usando uma combinação de data (dia do ano) e ano para variar
function getFraseDoDia() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const diaDoAno = Math.floor((hoje - new Date(ano, 0, 0)) / (1000 * 60 * 60 * 24));
    
    // Calcula um índice estável que muda a cada dia, mas é o mesmo para todos os usuários
    const indice = (diaDoAno + ano) % FRASES_DO_DIA.length;
    
    return FRASES_DO_DIA[indice];
}

// Exportar para uso global
window.FrasesDoDia = {
    getFraseDoDia: getFraseDoDia,
    todasFrases: FRASES_DO_DIA
};

console.log('[Frases] Módulo carregado com', FRASES_DO_DIA.length, 'frases disponíveis');