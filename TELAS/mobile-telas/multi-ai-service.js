// ============================================
// multi-ai-service.js - GROQ (RESPOSTA DIRETA EM PT)
// ⭐ CORREÇÃO: FORÇAR RESPOSTA EM PORTUGUÊS COM EXEMPLOS
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO GROQ...');

class MultiAIService {
    constructor() {
        this.GROQ_API_KEY = "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";
        this.GROQ_MODELS = [
            "qwen/qwen3.6-27b",
            "llama-3.1-8b-instant",
            "llama-3.3-70b-versatile",
            "mixtral-8x7b-32768"
        ];
        
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 100;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        console.log('[MultiAI] 🚀 Inicializando...');
        console.log('[MultiAI] 📌 Modo: GROQ');
        this._resetarLimite();
        console.log('[MultiAI] ✅ Serviço pronto!');
    }
    
    async sendMessage(prompt, context = '') {
        console.log('[MultiAI] 📤 Enviando:', prompt.substring(0, 60) + '...');
        
        if (!this.temLimiteDisponivel()) {
            return {
                success: false,
                error: `Limite diário de ${this._limiteDiario} perguntas atingido.`
            };
        }
        
        const cached = this._getFromCache(prompt, context);
        if (cached) {
            console.log('[MultiAI] 📦 Resposta do cache!');
            return { success: true, text: cached, fromCache: true };
        }
        
        const groqResult = await this._callGroqWithFallback(prompt, context);
        if (groqResult.success) {
            this._incrementarUso();
            this._saveToCache(prompt, context, groqResult.text);
            console.log('[MultiAI] ✅ Resposta do Groq!');
            return { success: true, text: groqResult.text };
        }
        
        console.log('[MultiAI] 📝 Usando fallback local');
        const fallback = this._getFallback(prompt, context);
        this._incrementarUso();
        return {
            success: true,
            text: fallback,
            fromFallback: true
        };
    }
    
    async _callGroqWithFallback(prompt, context) {
        const errors = [];
        
        for (let i = 0; i < this.GROQ_MODELS.length; i++) {
            const model = this.GROQ_MODELS[i];
            console.log(`[Groq] 📡 Tentando modelo ${i+1}/${this.GROQ_MODELS.length}: ${model}`);
            
            try {
                const result = await this._callGroqAPI(prompt, context, model);
                if (result.success) {
                    return { success: true, text: result.text };
                }
                errors.push(`[${model}] ${result.error}`);
                console.log(`[Groq] ❌ Modelo ${model} falhou:`, result.error);
            } catch (error) {
                errors.push(`[${model}] ${error.message}`);
                console.error(`[Groq] ❌ Erro no modelo ${model}:`, error.message);
            }
        }
        
        return { success: false, error: `Todos os modelos falharam: ${errors.join('; ')}` };
    }
    
    async _callGroqAPI(prompt, context, model) {
        if (!this.GROQ_API_KEY) {
            return { success: false, error: 'Groq não configurado' };
        }
        
        const url = 'https://api.groq.com/openai/v1/chat/completions';
        
        // ⭐ SYSTEM PROMPT SUPER FORTE - COM EXEMPLOS
        const systemPrompt = `Você é um assistente que fala APENAS português. NUNCA use inglês.

REGRAS ABSOLUTAS:
1. SUA RESPOSTA DEVE SER 100% EM PORTUGUÊS
2. NÃO use palavras em inglês na sua resposta
3. NÃO pense em inglês - responda diretamente em português
4. NÃO inclua tags como <think>, [analysis], etc.
5. Responda APENAS o conteúdo final

EXEMPLO DO QUE VOCÊ DEVE FAZER:
Usuário: "o que é um computador?"
Você: "Um computador é uma máquina eletrônica..."

EXEMPLO DO QUE VOCÊ NUNCA DEVE FAZER:
Usuário: "o que é um computador?"
Você: "<think>We need to answer...</think> Um computador é..."

IMPORTANTE: Você deve responder DIRETAMENTE em português, sem pensar em inglês primeiro.`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { 
                            role: 'system', 
                            content: systemPrompt
                        },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.2,  // ⭐ BAIXÍSSIMO = RESPOSTA DIRETA
                    max_tokens: 600
                })
            });
            
            console.log(`[Groq] 📥 Status:`, response.status);
            
            if (response.status === 404 && model.includes('/')) {
                const modelSimple = model.split('/').pop();
                console.log(`[Groq] 🔄 Tentando sem prefixo: ${modelSimple}`);
                const response2 = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.GROQ_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: modelSimple,
                        messages: [
                            { 
                                role: 'system', 
                                content: systemPrompt
                            },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.2,
                        max_tokens: 600
                    })
                });
                
                if (response2.ok) {
                    const data2 = await response2.json();
                    const text2 = data2.choices?.[0]?.message?.content;
                    if (text2 && text2.length > 0) {
                        console.log('[Groq] ✅ Resposta recebida!');
                        const cleanText = this._cleanText(text2.trim());
                        return { success: true, text: cleanText };
                    }
                }
            }
            
            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('[Groq] ❌ Detalhes:', errorData);
                    errorMessage = errorData.error?.message || errorData.error || errorMessage;
                } catch (e) {}
                return { success: false, error: errorMessage };
            }
            
            const data = await response.json();
            let text = data.choices?.[0]?.message?.content;
            
            if (text && text.length > 0) {
                console.log('[Groq] ✅ Resposta recebida!');
                
                // ⭐ LIMPEZA AGRESSIVA
                text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
                text = text.replace(/```[\s\S]*?```/g, '');
                text = text.replace(/^\s*think\s*/i, '');
                text = text.replace(/^\s*We need to/i, '');
                text = text.replace(/^\s*I need to/i, '');
                text = text.replace(/^\s*Let me/i, '');
                text = text.replace(/^\s*First,?/i, '');
                text = text.replace(/^\s*So,?/i, '');
                text = text.replace(/^\s*The user is asking/i, '');
                text = text.replace(/^\s*The question is/i, '');
                
                const cleanText = this._cleanText(text.trim());
                return { success: true, text: cleanText };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Groq] ❌ Erro de rede:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    _cleanText(text) {
        if (!text) return text;
        
        let clean = text;
        
        // Remover tags
        clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '');
        clean = clean.replace(/```[\s\S]*?```/g, '');
        clean = clean.replace(/<[^>]*>/g, '');
        
        // Remover prefácios em inglês
        clean = clean.replace(/^\s*think\s*/i, '');
        clean = clean.replace(/^\s*We need to/i, '');
        clean = clean.replace(/^\s*I need to/i, '');
        clean = clean.replace(/^\s*Let me/i, '');
        clean = clean.replace(/^\s*First,?/i, '');
        clean = clean.replace(/^\s*So,?/i, '');
        clean = clean.replace(/^\s*The user is asking/i, '');
        clean = clean.replace(/^\s*The question is/i, '');
        clean = clean.replace(/^\s*Here is/i, '');
        clean = clean.replace(/^\s*Here's/i, '');
        clean = clean.replace(/^\s*This is/i, '');
        clean = clean.replace(/^\s*I will/i, '');
        clean = clean.replace(/^\s*I'm going to/i, '');
        
        // Remover "(via Groq (xxx))"
        clean = clean.replace(/\s*\(via\s+[^)]+\)/gi, '');
        clean = clean.replace(/\s*\[via\s+[^\]]+\]/gi, '');
        clean = clean.replace(/\s*provedor:\s*[^\s]+/gi, '');
        
        // Remover espaços extras
        clean = clean.replace(/\s+/g, ' ').trim();
        
        // Se a resposta começar com letra minúscula, capitalizar
        if (clean.length > 0 && clean[0] === clean[0].toLowerCase()) {
            clean = clean.charAt(0).toUpperCase() + clean.slice(1);
        }
        
        return clean;
    }
    
    // ============================================
    // ⭐ FALLBACK LOCAL (APENAS PORTUGUÊS)
    // ============================================
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        
        if (texto.includes('saturno') || texto.includes('saturnao')) {
            return 'O termo "Saturnão" parece ser uma variação de "Saturno". Saturno é o sexto planeta do Sistema Solar, conhecido por seus anéis proeminentes. Na mitologia romana, Saturno era o deus da agricultura e do tempo, equivalente ao deus grego Cronos.';
        }
        
        if (texto.includes('mouse')) {
            return 'Um mouse é um dispositivo periférico de entrada para computadores. Sua função principal é controlar o cursor na tela, permitindo navegar, selecionar, clicar e arrastar objetos. É essencial para a interação com sistemas operacionais e aplicativos.';
        }
        
        if (texto.includes('oi') || texto.includes('olá')) {
            return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos.';
        }
        
        if (texto.includes('estud') || texto.includes('aula')) {
            return 'Para estudar de forma eficiente, recomendo: criar um cronograma realista, usar técnicas como Pomodoro (25 minutos de foco, 5 minutos de pausa), revisar o conteúdo regularmente e fazer resumos e mapas mentais.';
        }
        
        if (texto.includes('tarefa') || texto.includes('dever')) {
            return 'Para gerenciar suas tarefas: priorize as mais urgentes, divida em pequenas etapas, defina prazos realistas e mantenha o foco em uma tarefa de cada vez.';
        }
        
        return 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes? Estou aqui para ajudar com seus estudos.';
    }
    
    // ============================================
    // ⭐ MÉTODOS DE LIMITE E CACHE
    // ============================================
    _resetarLimite() {
        const hoje = new Date().toDateString();
        const dataSalva = localStorage.getItem('pollinations_data');
        if (dataSalva !== hoje) {
            localStorage.setItem('pollinations_data', hoje);
            localStorage.setItem('pollinations_uso', '0');
            this._usosHoje = 0;
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
    }
    
    temLimiteDisponivel() {
        return this.getUsoHoje() < this._limiteDiario;
    }
    
    getLimiteRestante() {
        return Math.max(0, this._limiteDiario - this.getUsoHoje());
    }
    
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
    
    getStatus() {
        return {
            usoTotal: this.getUsoHoje(),
            limiteTotal: this._limiteDiario,
            restante: this.getLimiteRestante(),
            cacheSize: this._cache.size,
            modo: 'GROQ',
            groqConfigurado: !!this.GROQ_API_KEY,
            modelos: this.GROQ_MODELS
        };
    }
    
    resetLimite() {
        localStorage.setItem('pollinations_data', new Date().toDateString());
        localStorage.setItem('pollinations_uso', '0');
        this._usosHoje = 0;
        console.log('[MultiAI] Limite resetado');
        return this.getStatus();
    }
}

// ============================================
// ⭐ INSTÂNCIA GLOBAL
// ============================================
const multiAI = new MultiAIService();
window.MultiAIService = multiAI;

window.getLimiteIA = () => {
    const status = multiAI.getStatus();
    return {
        usado: status.usoTotal,
        maximo: status.limiteTotal,
        restante: status.restante,
        modo: status.modo,
        modelos: status.modelos,
        reset: () => multiAI.resetLimite()
    };
};

window.testIA = async (pergunta) => {
    console.log('🧪 Testando IA...');
    const result = await multiAI.sendMessage(pergunta);
    console.log('🤖 Resposta:', result);
    return result;
};

console.log('[MultiAI] ✅ Serviço carregado!');
console.log('[MultiAI] 📌 Modelos:', multiAI.GROQ_MODELS);
console.log('[MultiAI] 💡 Teste: window.testIA("o que é saturno?")');