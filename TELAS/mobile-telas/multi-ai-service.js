// ============================================
// multi-ai-service.js - POLLINATIONS.AI
// ============================================

console.log('🔥 [MultiAI] CARREGANDO POLLINATIONS.AI...');

class MultiAIService {
    constructor() {
        // ⭐ SUA CHAVE DA POLLINATIONS
        this.POLLINATIONS_API_KEY = 'sk_URhX96g3ylXVWJFqk6eBMIwGZVAG0Bqn';
        
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 80;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        console.log('[MultiAI] 🚀 Inicializando Pollinations...');
        console.log('[MultiAI] 🔑 Chave:', this.POLLINATIONS_API_KEY ? '✅ Configurada' : '❌ Não configurada');
        this._resetarLimite();
        console.log('[MultiAI] ✅ Serviço pronto!');
        console.log('[MultiAI] 📊 Status:', this.getStatus());
    }
    
    // ⭐ MÉTODO PRINCIPAL
    async sendMessage(prompt, context = '') {
        console.log('[Pollinations] 📤 Enviando:', prompt.substring(0, 60) + '...');
        
        // Verificar limite
        if (!this.temLimiteDisponivel()) {
            return {
                success: false,
                error: `⛔ Limite diário de ${this._limiteDiario} perguntas atingido!`
            };
        }
        
        // Verificar cache
        const cached = this._getFromCache(prompt, context);
        if (cached) {
            console.log('[Pollinations] 📦 Resposta do cache!');
            return { success: true, text: cached, fromCache: true };
        }
        
        try {
            const result = await this._callAPI(prompt, context);
            
            if (result.success) {
                this._incrementarUso();
                this._saveToCache(prompt, context, result.text);
                console.log('[Pollinations] ✅ Resposta recebida!');
                return result;
            }
            
            console.log('[Pollinations] ⚠️ Falha na API:', result.error);
            
            // FALLBACK OFFLINE
            const fallback = this._getFallback(prompt, context);
            return {
                success: true,
                text: fallback,
                fromFallback: true,
                error: result.error
            };
            
        } catch (error) {
            console.error('[Pollinations] ❌ Erro:', error);
            const fallback = this._getFallback(prompt, context);
            return {
                success: true,
                text: fallback,
                fromFallback: true,
                error: error.message
            };
        }
    }
    
    // ⭐ CHAMADA À API POLLINATIONS
    async _callAPI(prompt, context) {
        const url = 'https://text.pollinations.ai/api/v1/chat/completions';
        
        const body = {
            model: 'openai',
            messages: [
                { 
                    role: 'system', 
                    content: context || 'Você é um assistente útil chamado Zero, que ajuda estudantes com suas dúvidas educacionais.' 
                },
                { 
                    role: 'user', 
                    content: prompt 
                }
            ],
            temperature: 0.7,
            max_tokens: 1024
        };
        
        console.log('[Pollinations] 📡 URL:', url);
        console.log('[Pollinations] 📡 Modelo:', body.model);
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.POLLINATIONS_API_KEY}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            console.log('[Pollinations] 📥 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Pollinations] ❌ Erro:', response.status, errorText);
                
                if (response.status === 429 || response.status === 402) {
                    return { success: false, error: 'Limite excedido', limitExceeded: true };
                }
                
                return { 
                    success: false, 
                    error: `Erro ${response.status}: ${errorText.substring(0, 100)}` 
                };
            }
            
            const data = await response.json();
            console.log('[Pollinations] ✅ Dados recebidos');
            
            let text = '';
            if (data.choices && data.choices.length > 0) {
                text = data.choices[0].message?.content || '';
            } else if (data.response) {
                text = data.response;
            } else if (data.text) {
                text = data.text;
            }
            
            if (text) {
                return { success: true, text: text.trim() };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Pollinations] ❌ Erro na requisição:', error);
            return { success: false, error: error.message };
        }
    }
    
    // ⭐ MÉTODOS DE LIMITE
    _resetarLimite() {
        const hoje = new Date().toDateString();
        const dataSalva = localStorage.getItem('pollinations_data');
        
        if (dataSalva !== hoje) {
            localStorage.setItem('pollinations_data', hoje);
            localStorage.setItem('pollinations_uso', '0');
            this._usosHoje = 0;
            console.log('[Pollinations] 📅 Limite resetado');
        }
    }
    
    getUsoHoje() {
        this._resetarLimite();
        this._usosHoje = parseInt(localStorage.getItem('pollinations_uso')) || 0;
        return this._usosHoje;
    }
    
    _incrementarUso() {
        this._resetarLimite();
        this._usosHoje++;
        localStorage.setItem('pollinations_uso', String(this._usosHoje));
        console.log(`[Pollinations] 📊 Uso: ${this._usosHoje}/${this._limiteDiario}`);
    }
    
    temLimiteDisponivel() {
        return this.getUsoHoje() < this._limiteDiario;
    }
    
    getLimiteRestante() {
        return Math.max(0, this._limiteDiario - this.getUsoHoje());
    }
    
    // ⭐ CACHE
    _getCacheKey(prompt, context) {
        return `${prompt.substring(0, 50)}|${context.substring(0, 100)}`;
    }
    
    _getFromCache(prompt, context) {
        const key = this._getCacheKey(prompt, context);
        if (this._cache.has(key)) {
            const item = this._cache.get(key);
            if (Date.now() - item.timestamp < 3600000) {
                return item.value;
            }
            this._cache.delete(key);
        }
        return null;
    }
    
    _saveToCache(prompt, context, response) {
        const key = this._getCacheKey(prompt, context);
        this._cache.set(key, {
            value: response,
            timestamp: Date.now()
        });
        
        if (this._cache.size > this._cacheMaxSize) {
            const keys = Array.from(this._cache.keys());
            const oldest = keys.sort((a, b) => 
                this._cache.get(a).timestamp - this._cache.get(b).timestamp
            )[0];
            this._cache.delete(oldest);
        }
    }
    
    // ⭐ FALLBACK OFFLINE
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        const isGiria = context && context.includes('MODO GÍRIA ATIVO');
        
        const respostas = {
            saudacao: isGiria 
                ? '🇲🇿 Eai broo! Tá fixe? Como posso ajudar hoje?'
                : 'Olá! Como posso ajudar você hoje?',
            estudo: isGiria
                ? '🇲🇿 Bora estudar, magaia! A chave é consistência. Tamos juntos! 💪'
                : 'Para estudar bem: 1) Faça um cronograma, 2) Use Pomodoro, 3) Revise regularmente.',
            tarefa: isGiria
                ? '🇲🇿 As tarefas tão aí, mas tu consegues! Vai devagar. 😎'
                : 'Priorize as tarefas mais urgentes e divida em pequenas etapas.',
            padrao: isGiria
                ? '🇲🇿 Boa pergunta, broo! Tenta reformular. Tamos juntos!'
                : 'Desculpe, não entendi. Poderia reformular?'
        };
        
        if (texto.includes('oi') || texto.includes('olá') || texto.includes('bom dia')) {
            return respostas.saudacao;
        }
        if (texto.includes('estud') || texto.includes('aula') || texto.includes('prova')) {
            return respostas.estudo;
        }
        if (texto.includes('tarefa') || texto.includes('dever')) {
            return respostas.tarefa;
        }
        return respostas.padrao;
    }
    
    // ⭐ STATUS
    getStatus() {
        return {
            usoTotal: this.getUsoHoje(),
            limiteTotal: this._limiteDiario,
            restante: this.getLimiteRestante(),
            apiKeySet: !!this.POLLINATIONS_API_KEY && this.POLLINATIONS_API_KEY.length > 10,
            cacheSize: this._cache.size
        };
    }
    
    resetLimite() {
        localStorage.setItem('pollinations_data', new Date().toDateString());
        localStorage.setItem('pollinations_uso', '0');
        this._usosHoje = 0;
        console.log('[Pollinations] 📅 Limite resetado manualmente');
        return this.getStatus();
    }
}

// ============================================
// INSTÂNCIA GLOBAL
// ============================================
const multiAI = new MultiAIService();
window.MultiAIService = multiAI;
window.GeminiService = multiAI;
window.OpenRouterService = multiAI;

// ⭐ FUNÇÕES GLOBAIS
window.getLimiteIA = () => {
    const status = multiAI.getStatus();
    return {
        usado: status.usoTotal,
        maximo: status.limiteTotal,
        restante: status.restante,
        apiKeySet: status.apiKeySet,
        reset: () => multiAI.resetLimite()
    };
};

// ⭐ FUNÇÃO DE TESTE
window.testPollinations = async (pergunta) => {
    console.log('🧪 Testando Pollinations...');
    console.log('📝 Pergunta:', pergunta);
    const result = await multiAI.sendMessage(pergunta);
    console.log('🤖 Resposta:', result);
    return result;
};

console.log('[MultiAI] ✅ Pollinations carregado com sucesso!');
console.log('[MultiAI] 🔑 Status da chave:', multiAI.POLLINATIONS_API_KEY ? '✅ Configurada' : '❌ Não configurada');
console.log('[MultiAI] 📊 Limite:', multiAI.getLimiteRestante(), 'perguntas restantes');
console.log('[MultiAI] 💡 Teste: window.testPollinations("Qual é a capital de Moçambique?")');