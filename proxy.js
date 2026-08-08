// api/proxy.js - Proxy para APIs de IA (CORRIGIDO)
// ============================================

export default async function handler(req, res) {
    // ⭐ LOG PARA DEBUG
    console.log('[Proxy] 📥 Requisição recebida:', req.method, req.url);
    console.log('[Proxy] 📦 Body:', req.body);

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

    if (!provider) {
        return res.status(400).json({ error: 'Provider é obrigatório' });
    }

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt é obrigatório' });
    }

    // ⭐ CHAVES DAS APIS
    const PROVIDER_CONFIG = {
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

    const config = PROVIDER_CONFIG[provider];
    if (!config) {
        return res.status(400).json({ error: 'Provedor não suportado: ' + provider });
    }

    try {
        console.log(`[Proxy] 📤 Enviando para ${provider}...`);

        const headers = {
            'Authorization': `Bearer ${config.key}`,
            'Content-Type': 'application/json'
        };

        const response = await fetch(config.url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model || config.model,
                messages: [
                    { role: 'system', content: context || 'Você é um assistente educacional útil. Responda de forma clara e didática.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1024,
                top_p: 0.9
            })
        });

        // ⭐ LER RESPOSTA COMO TEXTO PRIMEIRO
        const textResponse = await response.text();
        console.log(`[Proxy] 📥 ${provider} Status:`, response.status);
        console.log(`[Proxy] 📥 ${provider} Resposta (primeiros 200 chars):`, textResponse.substring(0, 200));

        let data;
        try {
            data = JSON.parse(textResponse);
        } catch (e) {
            console.error(`[Proxy] ❌ ${provider} resposta não-JSON:`, textResponse);
            return res.status(500).json({ error: 'Resposta inválida da API', raw: textResponse.substring(0, 500) });
        }

        if (!response.ok) {
            console.error(`[Proxy] ❌ ${provider} Erro:`, data);
            
            if (response.status === 429 || 
                data.error?.message?.toLowerCase().includes('rate limit') ||
                data.error?.message?.toLowerCase().includes('quota') ||
                data.error?.message?.toLowerCase().includes('exceeded') ||
                data.error?.message?.toLowerCase().includes('too many')) {
                return res.status(429).json({ error: 'Limite excedido', limitExceeded: true });
            }

            if (response.status === 402 || 
                data.error?.message?.toLowerCase().includes('insufficient balance') ||
                data.error?.message?.toLowerCase().includes('saldo insuficiente')) {
                return res.status(402).json({ error: 'Saldo insuficiente', limitExceeded: true });
            }

            return res.status(response.status).json({
                error: data.error?.message || data.message || 'Erro na API',
                provider: provider
            });
        }

        let text = data.choices?.[0]?.message?.content || null;

        if (!text) {
            console.error(`[Proxy] ❌ ${provider} resposta sem conteúdo:`, data);
            return res.status(500).json({ error: 'Resposta inesperada' });
        }

        console.log(`[Proxy] ✅ ${provider} respondeu com sucesso! (${text.length} caracteres)`);
        return res.status(200).json({ success: true, text: text.trim(), provider });

    } catch (error) {
        console.error(`[Proxy] ❌ Erro ${provider}:`, error.message);
        return res.status(500).json({ error: error.message });
    }
}