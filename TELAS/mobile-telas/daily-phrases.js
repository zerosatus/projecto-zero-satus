// daily-phrases.js - Lista ÚNICA de frases (sincronizada com Flutter)
// ⭐ USA A LÓGICA DE DIA DO ANO + ANO (rodízio real das 11 frases)
// ⭐ MESMA LISTA DE 11 FRASES DO constants.dart

const FRASES_DO_DIA = [
    // 1
    "Cada munyo anaprogramazatxe...",
    // 2
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    // 3
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    // 4
    "Mentalidade de rei, bolso de rei.",
    // 5
    "Seu futuro é criado pelo que você faz hoje, não amanhã.",
    // 6
    "Homem não é pessoa!",
    // 7
    "A vida não é feita de morrangos.",
    // 8
    "Não há pão para malucos!",
    // 9
    "O conhecimento é a única riqueza que cresce quando é compartilhada.",
    // 10
    "Nunca é tarde para ser o que você poderia ter se tornado.",
    // 11
    "Bro, cê vai na machamba sem enxada?, então porque esqueceu caneta?",
];

// ⭐ LÓGICA ÚNICA: dia do ano + ano (igual ao Flutter)
// ⭐ Usa UTC para garantir que todos os dispositivos vejam a mesma frase
function getFraseDoDia() {
    const hoje = new Date();

    const ano = hoje.getUTCFullYear();
    const mes = hoje.getUTCMonth();
    const dia = hoje.getUTCDate();

    // Criar data UTC para calcular o dia do ano
    const dataUTC = new Date(Date.UTC(ano, mes, dia));
    const inicioAno = new Date(Date.UTC(ano, 0, 0));
    const diffMs = dataUTC - inicioAno;
    const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    const indice = (diaDoAno + ano) % FRASES_DO_DIA.length;
    return FRASES_DO_DIA[indice];
}

function getFraseDoDiaComData() {
    const hoje = new Date();

    const ano = hoje.getUTCFullYear();
    const mes = hoje.getUTCMonth() + 1;
    const dia = hoje.getUTCDate();

    const frase = getFraseDoDia();
    const dataStr = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;

    // Calcular índice
    const dataUTC = new Date(Date.UTC(ano, mes - 1, dia));
    const inicioAno = new Date(Date.UTC(ano, 0, 0));
    const diffMs = dataUTC - inicioAno;
    const diaDoAno = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const indice = (diaDoAno + ano) % FRASES_DO_DIA.length;

    // Nome do dia da semana
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const diaSemana = diasSemana[hoje.getUTCDay()];

    return {
        frase: frase,
        data: dataStr,
        diaSemana: diaSemana,
        indice: indice,
        diaDoAno: diaDoAno,
        totalFrases: FRASES_DO_DIA.length,
        proximaFrase: FRASES_DO_DIA[(indice + 1) % FRASES_DO_DIA.length]
    };
}

function getFrasePorIndice(indice) {
    if (indice >= 0 && indice < FRASES_DO_DIA.length) {
        return FRASES_DO_DIA[indice];
    }
    return getFraseDoDia();
}

window.FrasesDoDia = {
    getFraseDoDia: getFraseDoDia,
    getFraseDoDiaComData: getFraseDoDiaComData,
    getFrasePorIndice: getFrasePorIndice,
    todasFrases: FRASES_DO_DIA,
    totalFrases: FRASES_DO_DIA.length
};

console.log('[Frases] ✅ Módulo carregado com', FRASES_DO_DIA.length, 'frases (lógica: dia do ano + ano)');
console.log('[Frases] 📅 Frase do dia:', getFraseDoDia());
console.log('[Frases] 📊 Info:', getFraseDoDiaComData());