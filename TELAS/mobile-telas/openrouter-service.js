// ============================================
// openrouter-service.js - VERSÃO DEFINITIVA COM LOGS
// ============================================

(function() {
    'use strict';
    
    console.log('🔥🔥🔥 [OpenRouter] INICIANDO CARREGAMENTO...');
    
    try {
        // ⭐ CLASSE DO SERVIÇO
        class OpenRouterService {
            constructor() {
                console.log('[OpenRouter] 🏗️ Executando construtor...');
                this.apiKey = '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';
                this.apiUrl = '/api/openrouter';
                this.model = 'deepseek/deepseek-chat:free';
                console.log('[OpenRouter] ✅ CONSTRUTOR EXECUTADO!');
                console.log('[OpenRouter] 🔑 Chave:', this.apiKey.substring(0, 20) + '...');
                console.log('[OpenRouter] 📡 Proxy:', this.apiUrl);
                console.log('[OpenRouter] 🤖 Modelo:', this.model);
            }
            
            async sendMessage(prompt, context = '') {
                console.log('[OpenRouter] 📤 Enviando mensagem...');
                console.log('[OpenRouter] 📝 Prompt:', prompt.substring(0, 50) + '...');
                
                try {
                    // ⭐ CONSTRUIR PROMPT COMPLETO COM CONTEXTO E GÍRIAS
                    const saudacao = window.getGiria?.('saudacoes') || 'Tá fixe?';
                    const fullPrompt = `
${context}

INSTRUÇÕES IMPORTANTES:
1. Responda em português de Moçambique 🇲🇿
2. Use gírias locais como: magaia, fixe, bué, bora, arranja, tamos juntos
3. Seja amigável, motivador e prático
4. Comece com "${saudacao}" quando apropriado

Usuário: ${prompt}

Resposta (com gírias moçambicanas):
`;

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
                                    content: 'Você é um assistente educacional amigável que fala com gírias moçambicanas. Use: magaia, fixe, bué, bora, arranja, tamos juntos.' 
                                },
                                { role: 'user', content: fullPrompt }
                            ],
                            temperature: 0.8,
                            max_tokens: 1024,
                            top_p: 0.9
                        })
                    });

                    console.log('[OpenRouter] 📥 Status da resposta:', response.status);

                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}));
                        console.error('[OpenRouter] ❌ Erro HTTP:', response.status, error);
                        return { 
                            success: false, 
                            error: `Erro ${response.status}: ${error.error?.message || 'Falha na comunicação'}` 
                        };
                    }

                    const data = await response.json();
                    console.log('[OpenRouter] 📦 Resposta recebida!');
                    
                    if (data.choices && data.choices.length > 0) {
                        const text = data.choices[0].message.content;
                        console.log('[OpenRouter] ✅ Sucesso! Resposta:', text.substring(0, 50) + '...');
                        return { success: true, text: text };
                    }

                    return { success: false, error: 'Resposta inesperada da IA' };

                } catch (error) {
                    console.error('[OpenRouter] ❌ Erro:', error);
                    
                    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
                        return { 
                            success: false, 
                            error: '🌐 Erro de conexão! Verifique sua internet ou use o Live Server, magaia.' 
                        };
                    }
                    
                    return { success: false, error: error.message || 'Erro de conexão' };
                }
            }
        }

        // ⭐ CRIAR INSTÂNCIA
        console.log('[OpenRouter] 📦 Criando instância...');
        const service = new OpenRouterService();

        // ⭐ EXPORTAR PARA O WINDOW
        window.OpenRouterService = service;
        window.GeminiService = service;

        console.log('[OpenRouter] ✅ ✅ ✅ CARREGADO COM SUCESSO!');
        console.log('[OpenRouter] 📊 window.OpenRouterService:', typeof window.OpenRouterService);
        console.log('[OpenRouter] 📊 window.GeminiService:', typeof window.GeminiService);
        
        // ⭐ DISPARAR EVENTO
        window.dispatchEvent(new CustomEvent('openrouterLoaded', { detail: { service } }));
        
    } catch (error) {
        console.error('[OpenRouter] ❌ ERRO FATAL:', error);
        // ⭐ FALLBACK: criar um serviço vazio para não quebrar
        const fallbackService = {
            sendMessage: async () => ({ 
                success: false, 
                error: 'Erro ao carregar o serviço de IA. Recarregue a página.' 
            })
        };
        window.OpenRouterService = fallbackService;
        window.GeminiService = fallbackService;
        console.warn('[OpenRouter] ⚠️ Fallback ativado - IA não funcionará corretamente.');
    }
    
    console.log('🔥🔥🔥 [OpenRouter] FIM DO CARREGAMENTO');
})();