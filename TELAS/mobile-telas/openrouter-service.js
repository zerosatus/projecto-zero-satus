// ============================================
// openrouter-service.js - SERVIÇO OPENROUTER (GRÁTIS)
// ============================================

class OpenRouterService {
    constructor() {
        // ⭐ SUA CHAVE (JÁ CONFIGURADA)
        this.apiKey = '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';
        
        this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
        
        // ⭐ MODELO GRATUITO - MELHOR PARA PORTUGUÊS
        this.model = 'deepseek/deepseek-chat:free';
        
        console.log('[OpenRouter] 🚀 Serviço inicializado com modelo gratuito!');
        console.log('[OpenRouter] 💰 Custo: GRÁTIS (200 req/dia)');
    }
    
    async sendMessage(prompt, context = '') {
        try {
            // ⭐ PEGAR GÍRIA ALEATÓRIA
            const saudacao = window.getGiria?.('saudacoes') || 'Tá fixe?';
            
            // ⭐ CONSTRUIR PROMPT COM GÍRIAS MOÇAMBICANAS
            const fullPrompt = `
${context}

INSTRUÇÕES IMPORTANTES:
1. Responda em português de Moçambique 🇲🇿
2. Use gírias locais como: magaia, fixe, bué, bora, arranja, tamos juntos, massa, campeão
3. Seja amigável, motivador e prático
4. Comece com "${saudacao}" quando apropriado
5. Use emojis ocasionalmente: 🇲🇿 📚 💪 🎯 ✨

Usuário: ${prompt}

Resposta (com gírias moçambicanas):
`;

            console.log('[OpenRouter] 📤 Enviando para:', this.model);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin || 'https://localhost',
                    'X-Title': 'Zero Satus App'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { 
                            role: 'system', 
                            content: 'Você é um assistente educacional amigável que fala com gírias moçambicanas. Use: magaia, fixe, bué, bora, arranja, tamos juntos, massa, campeão, etc. Seja motivador e prático.' 
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
                
                // ⭐ MENSAGENS DE ERRO AMIGÁVEIS
                if (response.status === 401 || response.status === 403) {
                    return { 
                        success: false, 
                        error: '🔑 Chave inválida! Verifique sua chave OpenRouter.' 
                    };
                }
                if (response.status === 429) {
                    return { 
                        success: false, 
                        error: '⏳ Limite diário atingido (200 req/dia). Volta amanhã, magaia!' 
                    };
                }
                if (response.status === 402) {
                    return { 
                        success: false, 
                        error: '💳 Precisa de créditos. Use um modelo gratuito (com :free).' 
                    };
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
            return { success: false, error: error.message || 'Erro de conexão' };
        }
    }
}

// ⭐ INICIALIZAR
window.OpenRouterService = new OpenRouterService();

// ⭐ ALIAS PARA COMPATIBILIDADE (não precisa mudar o ia.js)
window.GeminiService = window.OpenRouterService;

console.log('[OpenRouter] ✅ Serviço carregado! 🇲🇿');
console.log('[OpenRouter] 📊 Modelo:', window.OpenRouterService.model);
console.log('[OpenRouter] 💰 Status: GRÁTIS (200 req/dia)');