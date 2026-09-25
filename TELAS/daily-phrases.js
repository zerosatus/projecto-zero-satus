// daily-phrases.js - Lista ÚNICA de frases (sincronizada com Flutter)
// ⭐ USA A MESMA LÓGICA DO FLUTTER: SEGUNDA = índice 0
// ⭐ MESMA LISTA DE 20 FRASES DO constants.dart

const FRASES_DO_DIA = [
    // 1 - Primeira frase da sequência (SEGUNDA)
    "Cada munyo anaprogramazatxe...",
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Mentalidade de rei, bolso de rei.",
    "Seu futuro é criado pelo que você faz hoje, não amanhã.",
    "Homem não é pessoa!",
    "A vida não é feita de morrangos.",
    "Não há pão para malucos!",
    "O conhecimento é a única riqueza que cresce quando é compartilhada.",
    "Nunca é tarde para ser o que você poderia ter se tornado.",
    "Bro, cê vai na machamba sem enxada?, então porque esqueceu caneta?",

];

// ⭐ MESMA LÓGICA DO FLUTTER: usa dia da semana (1=Segunda ... 7=Domingo)
// Segunda=0, Terça=1, Quarta=2, Quinta=3, Sexta=4, Sábado=5, Domingo=6
function getFraseDoDia() {
    const hoje = new Date();
    // getDay(): 0=Domingo, 1=Segunda, ..., 6=Sábado
    // Converter para: Segunda=0, Terça=1, ..., Domingo=6
    const diaSemanaJS = hoje.getDay(); // 0..6
    const indice = (diaSemanaJS + 6) % 7; // Segunda->0, Domingo->6
    return FRASES_DO_DIA[indice % FRASES_DO_DIA.length];
}

function getFraseDoDiaComData() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const dia = hoje.getDate();
    
    const frase = getFraseDoDia();
    const dataStr = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
    const diaSemanaJS = hoje.getDay();
    const indice = (diaSemanaJS + 6) % 7;
    
    const nomesDias = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
    
    return {
        frase: frase,
        data: dataStr,
        diaSemana: nomesDias[indice],
        indice: indice,
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

console.log('[Frases] ✅ Módulo carregado com', FRASES_DO_DIA.length, 'frases (sincronizado com Flutter)');
console.log('[Frases] 📅 Frase do dia:', getFraseDoDia());