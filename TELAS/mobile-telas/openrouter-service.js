// ============================================
// openrouter-service.js - VERSÃO ULTRA SIMPLES
// ============================================

console.log('🔥🔥🔥 [OpenRouter] CARREGANDO...');

// ⭐ CLASSE DO SERVIÇO
class OpenRouterService {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = '/api/openrouter';
        this.model = 'deepseek/deepseek-chat:free';
        console.log('[OpenRouter] ✅ CONSTRUTOR EXECUTADO!');
    }
    
    async sendMessage(prompt, context = '') {
        console.log('[OpenRouter] 📤 Enviando:', prompt.substring(0, 30) + '...');
        
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: 'system', content: 'Você é um assistente educacional amigável que fala com gírias moçambicanas.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 500
                })
            });

            console.log('[OpenRouter] 📥 Status:', response.status);

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                return { success: false, error: `Erro ${response.status}: ${error.error?.message || 'Falha'}` };
            }

            const data = await response.json();
            console.log('[OpenRouter] ✅ Resposta recebida!');
            
            if (data.choices && data.choices.length > 0) {
                return { success: true, text: data.choices[0].message.content };
            }

            return { success: false, error: 'Resposta inesperada' };

        } catch (error) {
            console.error('[OpenRouter] ❌ Erro:', error);
            return { success: false, error: error.message || 'Erro de conexão' };
        }
    }
}

// ⭐ CRIAR INSTÂNCIA
console.log('[OpenRouter] 📦 Criando instância...');
const service = new OpenRouterService();

// ⭐ EXPORTAR
window.OpenRouterService = service;
window.GeminiService = service;

console.log('[OpenRouter] ✅ CARREGADO COM SUCESSO!');
console.log('[OpenRouter] 🔑 Chave:', service.apiKey.substring(0, 20) + '...');
console.log('[OpenRouter] 📡 Proxy:', service.apiUrl);
console.log('[OpenRouter] 🤖 Modelo:', service.model);