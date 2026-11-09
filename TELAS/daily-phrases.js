// daily-phrases.js - Lista ÚNICA de frases (SINCRONIZADA COM FLUTTER)
// ⭐ MESMA LÓGICA DO FLUTTER: dia do ano + ano
// ⭐ MESMA LISTA DO constants.dart

const FRASES_DO_DIA = [
    "Ou você aumenta o sacrifício ou diminui os teu sonhos.",
    "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
    "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
    "Mentalidade de rei, bolso de rei.",
    "Seu futuro é criado pelo que você faz hoje, não amanhã.",
    "A vida não é feita de morrangos.",
    "Não há pão para malucos!",
    "O conhecimento é a única riqueza que cresce quando é compartilhada.",
    "Não existe atalho para nenhum lugar que valha a pena.",
    "Cansado de tudo, mas nunca da fé!"
];

// ⭐ MESMA LÓGICA DO FLUTTER: (diaDoAno + ano) % totalFrases
function getFraseDoDia() {
    const now = new Date();
    const ano = now.getUTCFullYear();
    const primeiroDiaDoAno = new Date(Date.UTC(ano, 0, 0));
    const diferenca = now.getTime() - primeiroDiaDoAno.getTime();
    const diaDoAno = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    
    const indice = (diaDoAno + ano) % FRASES_DO_DIA.length;
    return FRASES_DO_DIA[indice];
}

function getFraseDoDiaComData() {
    const now = new Date();
    const ano = now.getUTCFullYear();
    const mes = now.getUTCMonth() + 1;
    const dia = now.getUTCDate();
    
    const frase = getFraseDoDia();
    const dataStr = `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${ano}`;
    
    const primeiroDiaDoAno = new Date(Date.UTC(ano, 0, 0));
    const diferenca = now.getTime() - primeiroDiaDoAno.getTime();
    const diaDoAno = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const indice = (diaDoAno + ano) % FRASES_DO_DIA.length;
    
    const nomesDias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    
    return {
        frase: frase,
        data: dataStr,
        diaSemana: nomesDias[now.getUTCDay()],
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