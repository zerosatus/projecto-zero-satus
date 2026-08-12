// api/proxy.js - API Proxy para IA
// ============================================

export default async function handler(req, res) {
    // ⭐ APENAS POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { provider, prompt, context, model } = req.body;

        console.log(`[Proxy] 📤 Requisição para: ${provider}`);
        console.log(`[Proxy] 📝 Prompt: ${prompt.substring(0, 60)}...`);

        let apiKey, apiUrl, requestBody;

        // ⭐ CONFIGURAR CADA PROVEDOR
        switch (provider) {
            case 'grok':
                apiKey = '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';
                apiUrl = 'https://api.x.ai/v1/chat/completions';
                requestBody = {
                    model: model || 'grok-beta',
                    messages: [
                        { role: 'system', content: context || 'Você é um assistente útil.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                };
                break;

            case 'sambanova':
                apiKey = 'f3319e62-2d30-4f16-b9a2-0ec452183696';
                apiUrl = 'https://api.sambanova.ai/v1/chat/completions';
                requestBody = {
                    model: model || 'Llama-3.1-70B-Instruct',
                    messages: [
                        { role: 'system', content: context || 'Você é um assistente útil.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                };
                break;

            case 'deepseek':
                apiKey = 'sk-e528baf9102b44f59696badf598dbc4b';
                apiUrl = 'https://api.deepseek.com/v1/chat/completions';
                requestBody = {
                    model: model || 'deepseek-chat',
                    messages: [
                        { role: 'system', content: context || 'Você é um assistente útil.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                };
                break;

            case 'openrouter':
                apiKey = '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';
                apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
                requestBody = {
                    model: model || 'openrouter/free',
                    messages: [
                        { role: 'system', content: context || 'Você é um assistente útil.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                };
                break;

            default:
                return res.status(400).json({ error: 'Provedor não suportado' });
        }

        // ⭐ FAZER A REQUISIÇÃO PARA A API
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // ⭐ VERIFICAR ERROS
        if (!response.ok) {
            console.error(`[Proxy] ❌ ${provider} Erro:`, response.status, data);

            // Detectar limites
            const isLimit = response.status === 429 || 
                           response.status === 402 ||
                           data.error?.message?.toLowerCase().includes('rate limit') ||
                           data.error?.message?.toLowerCase().includes('quota') ||
                           data.error?.message?.toLowerCase().includes('exceeded') ||
                           data.error?.message?.toLowerCase().includes('insufficient balance');

            return res.status(response.status).json({
                error: data.error?.message || `Erro ${response.status}`,
                limitExceeded: isLimit,
                provider: provider
            });
        }

        // ⭐ EXTRAIR A RESPOSTA
        let text = '';
        if (data.choices && data.choices.length > 0) {
            text = data.choices[0].message?.content || data.choices[0].text || '';
        } else if (data.response) {
            text = data.response;
        } else if (data.content) {
            text = data.content;
        }

        console.log(`[Proxy] ✅ ${provider} Resposta: ${text.substring(0, 60)}...`);

        return res.status(200).json({
            success: true,
            text: text,
            provider: provider
        });

    } catch (error) {
        console.error('[Proxy] ❌ Erro:', error);
        return res.status(500).json({
            error: error.message || 'Erro interno do servidor'
        });
    }
}