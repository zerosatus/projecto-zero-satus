// api/proxy.js - Proxy para APIs de IA (resolve CORS)
export default async function handler(req, res) {
    // Permitir CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { provider, prompt, context, model } = req.body;

    // ⭐ CHAVES DAS APIS (armazenadas no backend - SEGURAS)
    const PROVIDER_CONFIG = {
        grok: {
            url: 'https://api.x.ai/v1/chat/completions',
            key: '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',
            model: 'grok-beta',
            headers: (key) => ({
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            })
        },
        sambanova: {
            url: 'https://api.sambanova.ai/v1/chat/completions',
            key: 'f3319e62-2d30-4f16-b9a2-0ec452183696',
            model: 'Llama-3.1-70B-Instruct',
            headers: (key) => ({
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            })
        },
        deepseek: {
            url: 'https://api.deepseek.com/v1/chat/completions',
            key: 'sk-e528baf9102b44f59696badf598dbc4b',
            model: 'deepseek-chat',
            headers: (key) => ({
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            })
        },
        openrouter: {
            url: 'https://openrouter.ai/api/v1/chat/completions',
            key: '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',
            model: 'openrouter/free',
            headers: (key) => ({
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://zerosatus.vercel.app',
                'X-Title': 'Zero Satus App'
            })
        }
    };

    const config = PROVIDER_CONFIG[provider];
    if (!config) {
        return res.status(400).json({ error: 'Provedor não suportado' });
    }

    try {
        console.log(`[Proxy] 📤 Enviando para ${provider}...`);

        const response = await fetch(config.url, {
            method: 'POST',
            headers: config.headers(config.key),
            body: JSON.stringify({
                model: model || config.model,
                messages: [
                    { role: 'system', content: context || 'Você é um assistente educacional útil.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error(`[Proxy] ❌ ${provider} Erro:`, data);
            
            // ⭐ DETECTAR LIMITE EXCEDIDO
            if (response.status === 429 || 
                data.error?.message?.toLowerCase().includes('rate limit') ||
                data.error?.message?.toLowerCase().includes('quota') ||
                data.error?.message?.toLowerCase().includes('exceeded')) {
                return res.status(429).json({ error: 'Limite excedido', limitExceeded: true });
            }

            if (response.status === 402) {
                return res.status(402).json({ error: 'Saldo insuficiente', limitExceeded: true });
            }

            return res.status(response.status).json({
                error: data.error?.message || 'Erro na API'
            });
        }

        // Extrair texto da resposta
        let text = data.choices?.[0]?.message?.content || null;

        if (!text) {
            return res.status(500).json({ error: 'Resposta inesperada' });
        }

        console.log(`[Proxy] ✅ ${provider} respondeu com sucesso!`);
        return res.status(200).json({ success: true, text, provider });

    } catch (error) {
        console.error(`[Proxy] ❌ Erro ${provider}:`, error.message);
        return res.status(500).json({ error: error.message });
    }
}