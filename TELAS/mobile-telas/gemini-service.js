// ============================================
// gemini-service.js - SERVIÇO PARA API GEMINI
// ============================================

class GeminiService {
    constructor() {
        this.apiKey = GEMINI_CONFIG.API_KEY;
        this.apiUrl = GEMINI_CONFIG.API_URL;
    }
    
    async sendMessage(prompt, context = '') {
        try {
            // Construir prompt com gíria
            const saudacao = getGiria('saudacoes');
            const fullPrompt = `
${context}

INSTRUÇÕES:
1. Responda em português de Moçambique 🇲🇿
2. Use gírias como: magaia, fixe, bué, bora, arranja, tamos juntos
3. Seja amigável e prático
4. Comece com "${saudacao}" quando apropriado

Usuário: ${prompt}

Resposta (com gírias moçambicanas):
`;

            const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                    generationConfig: GEMINI_CONFIG.generationConfig,
                    safetySettings: GEMINI_CONFIG.safetySettings
                })
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return { 
                    success: false, 
                    error: `Erro ${response.status}: ${error.error?.message || 'Falha na comunicação'}` 
                };
            }

            const data = await response.json();
            
            if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                return { 
                    success: true, 
                    text: data.candidates[0].content.parts[0].text 
                };
            }

            return { success: false, error: 'Resposta inesperada' };

        } catch (error) {
            console.error('[Gemini] ❌ Erro:', error);
            return { success: false, error: error.message };
        }
    }
}

window.GeminiService = new GeminiService();
console.log('[Gemini] ✅ Serviço carregado! 🇲🇿');