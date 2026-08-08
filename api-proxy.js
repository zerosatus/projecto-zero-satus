// api-proxy.js - Proxy direto no cliente (usa CORS Anywhere)
// ============================================

console.log('🔥 [API Proxy] Carregando proxy direto...');

class ApiProxy {
    constructor() {
        // Usa um serviço de CORS proxy público
        this.corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';
        this.providers = {
            grok: {
                url: 'https://api.x.ai/v1/chat/completions',
                key: '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',
                model: 'grok-beta'
            },
            sambanova: {
                url: 'https://api.sambanova.ai/v1/chat/completions',
                key: 'f3319e62-2d30-4f16-b9a2-0ec452183696',
                model: 'Llama-3.1-70B-Instruct'
            }
        };
    }

    async call(provider, prompt, context = '') {
        const config = this.providers[provider];
        if (!config) {
            return { success: false, error: 'Provedor não suportado' };
        }

        try {
            console.log(`[API Proxy] 📤 Chamando ${provider} via CORS proxy...`);

            const response = await fetch(this.corsProxyUrl + config.url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${config.key}`,
                    'Content-Type': 'application/json',
                    'Origin': window.location.origin
                },
                body: JSON.stringify({
                    model: config.model,
                    messages: [
                        { role: 'system', content: context || 'Você é um assistente educacional útil.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!response.ok) {
                return { success: false, error: `Erro ${response.status}` };
            }

            const data = await response.json();
            const text = data.choices?.[0]?.message?.content;

            if (!text) {
                return { success: false, error: 'Resposta vazia' };
            }

            return { success: true, text: text.trim() };

        } catch (error) {
            console.error(`[API Proxy] ❌ Erro:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

window.ApiProxy = new ApiProxy();
console.log('[API Proxy] ✅ Proxy direto carregado!');