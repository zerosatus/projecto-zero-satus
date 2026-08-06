// ============================================
// openrouter-service.js - VERSÃO CORRIGIDA COM PROXY
// ============================================

console.log('[OpenRouter] 🔄 Iniciando carregamento...');

class OpenRouterService {
    constructor() {
        // ⭐ SUA CHAVE
        this.apiKey = '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';
        
        // ⭐ USANDO PROXY DA VERCEL (EVITA CORS)
        this.apiUrl = '/api/openrouter';
        
        // ⭐ MODELO GRATUITO
        this.model = 'deepseek/deepseek-chat:free';
        
        console.log('[OpenRouter] 🚀 Serviço inicializado com PROXY!');
        console.log('[OpenRouter] 🔑 Chave:', this.apiKey.substring(0, 20) + '...');
        console.log('[OpenRouter] 💰 Modelo GRÁTIS:', this.model);
        console.log('[OpenRouter] 📡 Proxy URL:', this.apiUrl);
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

            console.log('[OpenRouter] 📤 Enviando via proxy para:', this.model);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
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
                console.error('[OpenRouter] ❌ Erro HTTP:', response.status, error);
                
                if (response.status === 401 || response.status === 403) {
                    return { success: false, error: '🔑 Chave inválida! Verifique sua chave.' };
                }
                if (response.status === 429) {
                    return { success: false, error: '⏳ Limite diário atingido (200 req/dia). Volta amanhã, magaia!' };
                }
                if (response.status === 402) {
                    return { success: false, error: '💳 Precisa de créditos. Use modelo com :free.' };
                }
                if (response.status === 404) {
                    return { success: false, error: '🌐 Proxy não encontrado. Verifique o vercel.json.' };
                }
                
                return { 
                    success: false, 
                    error: `Erro ${response.status}: ${error.error?.message || 'Falha na comunicação'}` 
                };
            }

            const data = await response.json();
            console.log('[OpenRouter] 📦 Resposta recebida!');
            
            if (data.choices && data.choices.length > 0) {
                const text = data.choices[0].message.content;
                console.log('[OpenRouter] ✅ Sucesso!');
                return { success: true, text: text };
            }

            return { success: false, error: 'Resposta inesperada da IA' };

        } catch (error) {
            console.error('[OpenRouter] ❌ Erro:', error);
            
            if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                return { 
                    success: false, 
                    error: '🌐 Erro de conexão! Verifique sua internet ou deploy na Vercel.' 
                };
            }
            
            return { success: false, error: error.message || 'Erro de conexão' };
        }
    }
}

// ⭐ INICIALIZAR
window.OpenRouterService = new OpenRouterService();

// ⭐ ALIAS PARA COMPATIBILIDADE (o ia.js usa window.GeminiService)
window.GeminiService = window.OpenRouterService;

console.log('[OpenRouter] ✅ Serviço carregado com sucesso! 🇲🇿');
console.log('[OpenRouter] 📊 Modelo:', window.OpenRouterService.model);
console.log('[OpenRouter] 💰 Status: GRÁTIS (200 req/dia)');
console.log('[OpenRouter] 📡 Proxy ativo em: /api/openrouter');