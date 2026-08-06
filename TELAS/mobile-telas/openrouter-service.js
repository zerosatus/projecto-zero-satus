// ============================================
// openrouter-service.js - DIRETO (sem proxy)
// ============================================

class OpenRouterService {
    constructor() {
        this.apiKey = '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';
        
        // 🔥 USAR URL DIRETA (sem proxy)
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        
        this.model = 'deepseek/deepseek-chat:free';
        
        console.log('[OpenRouter] 🚀 Serviço inicializado (URL direta)');
        console.log('[OpenRouter] 🔑 Chave:', this.apiKey.substring(0, 20) + '...');
        console.log('[OpenRouter] 💰 Modelo GRÁTIS:', this.model);
    }
    
    async sendMessage(prompt, context = '') {
        try {
            const saudacao = window.getGiria?.('saudacoes') || 'Tá fixe?';
            
            const fullPrompt = `
${context}

INSTRUÇÕES IMPORTANTES:
1. Responda em português de Moçambique 🇲🇿
2. Use gírias locais como: magaia, fixe, bué, bora, arranja, tamos juntos, massa, campeão
3. Seja amigável, motivador e prático
4. Comece com "${saudacao}" quando apropriado
5. Use emojis: 🇲🇿 📚 💪 🎯 ✨

Usuário: ${prompt}

Resposta (com gírias moçambicanas):
`;

            console.log('[OpenRouter] 📤 Enviando para:', this.apiUrl);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin || 'https://zerosatus.vercel.app',
                    'X-Title': 'Zero Satus App'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { 
                            role: 'system', 
                            content: 'Você é um assistente educacional amigável que fala com gírias moçambicanas. Use: magaia, fixe, bué, bora, arranja, tamos juntos, massa, campeão. Seja motivador e prático.' 
                        },
                        { role: 'user', content: fullPrompt }
                    ],
                    temperature: 0.8,
                    max_tokens: 1024,
                    top_p: 0.9
                })
            });

            console.log('[OpenRouter] 📥 Status:', response.status);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error('[OpenRouter] ❌ Erro:', response.status, error);
                
                if (response.status === 401 || response.status === 403) {
                    return { success: false, error: '🔑 Chave inválida! Verifique sua chave OpenRouter.' };
                }
                if (response.status === 429) {
                    return { success: false, error: '⏳ Limite diário atingido (200 req/dia). Volta amanhã, magaia!' };
                }
                if (response.status === 402) {
                    return { success: false, error: '💳 Precisa de créditos. Use modelo com :free.' };
                }
                
                return { 
                    success: false, 
                    error: `Erro ${response.status}: ${error.error?.message || 'Falha na comunicação'}` 
                };
            }

            const data = await response.json();
            
            if (data.choices && data.choices.length > 0) {
                const text = data.choices[0].message.content;
                console.log('[OpenRouter] ✅ Resposta recebida!');
                return { success: true, text: text };
            }

            return { success: false, error: 'Resposta inesperada da IA' };

        } catch (error) {
            console.error('[OpenRouter] ❌ Erro:', error);
            
            // Verifica se é erro de rede/CORS
            if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                return { 
                    success: false, 
                    error: '🌐 Erro de conexão! Verifique sua internet. Se estiver no localhost, tente usar o Live Server ou servidor HTTPS, magaia.' 
                };
            }
            
            return { success: false, error: error.message || 'Erro de conexão' };
        }
    }
}

window.OpenRouterService = new OpenRouterService();
window.GeminiService = window.OpenRouterService;

console.log('[OpenRouter] ✅ Serviço carregado! 🇲🇿');
console.log('[OpenRouter] 📊 Modelo:', window.OpenRouterService.model);
console.log('[OpenRouter] 💰 Status: GRÁTIS (200 req/dia)');