export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { provider, prompt, context, model } = req.body;

  const providers = {
    grok: {
      url: 'https://api.x.ai/v1/chat/completions',
      key: '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',
      model: model || 'grok-beta',
    },
    sambanova: {
      url: 'https://api.sambanova.ai/v1/chat/completions',
      key: 'f3319e62-2d30-4f16-b9a2-0ec452183696',
      model: model || 'Llama-3.1-70B-Instruct',
    },
  };

  const config = providers[provider];
  if (!config) {
    return res.status(400).json({ error: 'Provedor não suportado' });
  }

  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: context || 'Você é um assistente educacional útil.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: data.error?.message || 'Erro na API' 
      });
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return res.status(500).json({ error: 'Resposta vazia' });
    }

    return res.status(200).json({ success: true, text: text.trim() });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}