// ============================================
// gemini-config.js - CONFIGURAÇÃO DA API GEMINI
// ============================================

const GEMINI_CONFIG = {
    API_KEY: 'AIzaSyCWznVpiNlyUZL_5lTacQ-S_fYNR3L1fo0',
    API_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 1024,
        topP: 0.9,
        topK: 40
    },
    safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
    ]
};

// ⭐ GÍRIAS MOÇAMBICANAS
const GIRIAS_MOCAMBICANAS = {
    saudacoes: ['Tá fixe?', 'Como estás?', 'Tudo bem?', 'Paz!', 'Boa!', 'Tá tudo em cima?', 'Tamos juntos!'],
    aprovacao: ['Fixe!', 'Boa!', 'Tá certo!', 'Perfeito!', 'Arranja-se!', 'Tá bué fixe!', 'Massa!'],
    encorajamento: ['Bora lá!', 'Força aí!', 'Não desanima!', 'Tá a brilhar!', 'Magaia!', 'Tás a dar conta!'],
    resposta: ['Tá fixe, mano!', 'Arranja-se!', 'Bora lá!', 'Tamos juntos!', 'Magaia!']
};

function getGiria(categoria) {
    const lista = GIRIAS_MOCAMBICANAS[categoria] || GIRIAS_MOCAMBICANAS.saudacoes;
    return lista[Math.floor(Math.random() * lista.length)];
}

window.GeminiConfig = GEMINI_CONFIG;
window.GiriasMocambicanas = GIRIAS_MOCAMBICANAS;
window.getGiria = getGiria;

console.log('[Gemini] ✅ Configuração carregada! 🇲🇿');