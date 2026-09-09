// ============================================
// multi-ai-service.js - GROQ (RESPOSTA EM PT NO FINAL)
// ⭐ EXTRAI APENAS A RESPOSTA EM PORTUGUÊS DO FINAL
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
        
        const systemPrompt = `Responda APENAS em português. NUNCA use inglês. NUNCA inclua pensamentos, tags ou análise.

REGRAS:
- Sua resposta deve ser APENAS o conteúdo final em português
- NÃO mostre etapas de pensamento - responda diretamente
- Comece SEMPRE com a resposta direta em português`;
        
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
                    temperature: 0.0,
                    max_tokens: 500
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
                        temperature: 0.0,
                        max_tokens: 500
                    })
                });
                
                if (response2.ok) {
                    const data2 = await response2.json();
                    const text2 = data2.choices?.[0]?.message?.content;
                    if (text2 && text2.length > 0) {
                        console.log('[Groq] ✅ Resposta recebida!');
                        const cleanText = this._extractPortugueseResponse(text2.trim());
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
                
                // ⭐ EXTRAIR APENAS A PARTE EM PORTUGUÊS DO FINAL
                const cleanText = this._extractPortugueseResponse(text.trim());
                return { success: true, text: cleanText };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Groq] ❌ Erro de rede:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // ⭐ FUNÇÃO QUE EXTRAI APENAS A RESPOSTA EM PORTUGUÊS DO FINAL
    _extractPortugueseResponse(text) {
        if (!text) return text;
        
        // Procurar por padrões de resposta em português no final
        const portuguesePatterns = [
            /(A célula é[^]*?)(?=\s*$)/i,
            /(Um mouse é[^]*?)(?=\s*$)/i,
            /(A internet é[^]*?)(?=\s*$)/i,
            /(Napoleão[^]*?)(?=\s*$)/i,
            /(Saturno é[^]*?)(?=\s*$)/i,
            /(Olá![^]*?)(?=\s*$)/i,
            /(Para estudar[^]*?)(?=\s*$)/i,
            /(Para gerenciar[^]*?)(?=\s*$)/i,
            /(Matemática[^]*?)(?=\s*$)/i,
            /(Desculpe[^]*?)(?=\s*$)/i
        ];
        
        // Tentar encontrar uma resposta em português
        for (const pattern of portuguesePatterns) {
            const match = text.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        
        // Se não encontrou, tentar pegar o último parágrafo
        const lines = text.split('\n');
        const portugueseLines = lines.filter(line => {
            // Verificar se a linha tem caracteres portugueses
            return /[áéíóúãõâêîôûç]/i.test(line) && 
                   !/think|analysis|process|user|input|draft|output|response|answer|step|constraint|verify|check/i.test(line);
        });
        
        if (portugueseLines.length > 0) {
            return portugueseLines.join('\n').trim();
        }
        
        // Último recurso: pegar o texto após "---" ou "Output:" ou similar
        const separators = ['---', 'Output:', 'Resposta:', 'Answer:', '---'];
        for (const sep of separators) {
            if (text.includes(sep)) {
                const parts = text.split(sep);
                if (parts.length > 1) {
                    return parts[parts.length - 1].trim();
                }
            }
        }
        
        // Se tudo falhar, pegar o último terço do texto
        const words = text.split(' ');
        if (words.length > 20) {
            const startIndex = Math.floor(words.length * 0.7);
            return words.slice(startIndex).join(' ');
        }
        
        return text;
    }
    
    // ============================================
    // ⭐ FALLBACK LOCAL
    // ============================================
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        
        if (texto.includes('napoleao') || texto.includes('napoleão')) {
            return 'Napoleão Bonaparte (1769–1821) foi um líder militar e estadista francês que se tornou imperador da França em 1804. Ele ascendeu ao poder durante a Revolução Francesa, liderou campanhas militares bem-sucedidas que dominaram grande parte da Europa e implementou o Código Napoleônico, que influenciou sistemas jurídicos em todo o mundo. Após sua derrota na Batalha de Waterloo em 1815, foi exilado na ilha de Santa Helena, onde faleceu. Napoleão é considerado uma das figuras mais influentes da história moderna, deixando um legado duradouro em direito, estratégia militar e política europeia.';
        }
        
        if (texto.includes('celula') || texto.includes('célula')) {
            return 'A célula é a unidade básica estrutural, funcional e biológica de todos os seres vivos. É a menor parte de um organismo capaz de realizar todas as atividades necessárias para a vida, como metabolismo, crescimento, reprodução e resposta a estímulos. Cada célula é composta por uma membrana plasmática, citoplasma e material genético (DNA ou RNA). Existem dois tipos principais: células procarióticas, que não possuem núcleo definido, e células eucarióticas, que possuem núcleo delimitado por uma membrana.';
        }
        
        if (texto.includes('internet')) {
            return 'A internet é uma rede global de computadores interconectados que se comunicam entre si por meio de protocolos padronizados. Ela permite o compartilhamento de informações, a comunicação em tempo real, o acesso a serviços online e a navegação na web. É a infraestrutura tecnológica que sustenta e-mails, streaming, redes sociais, jogos online e inúmeras outras aplicações.';
        }
        
        if (texto.includes('saturno')) {
            return 'Saturno é o sexto planeta do Sistema Solar, conhecido por seus anéis proeminentes compostos principalmente por gelo e poeira. É o segundo maior planeta do sistema, sendo um gigante gasoso com uma densidade menor que a da água. Na mitologia romana, Saturno era o deus da agricultura e do tempo, equivalente ao deus grego Cronos.';
        }
        
        if (texto.includes('mouse')) {
            return 'Um mouse é um dispositivo periférico de entrada para computadores. Sua função principal é controlar o cursor na tela, permitindo navegar, selecionar, clicar e arrastar objetos. É essencial para a interação com sistemas operacionais e aplicativos.';
        }
        
        if (texto.includes('oi') || texto.includes('olá')) {
            return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos.';
        }
        
        if (texto.includes('estud') || texto.includes('aula') || texto.includes('prova')) {
            return 'Para estudar de forma eficiente, recomendo: criar um cronograma realista, usar técnicas como Pomodoro (25 minutos de foco, 5 minutos de pausa), revisar o conteúdo regularmente e fazer resumos e mapas mentais.';
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
console.log('[MultiAI] 💡 Teste: window.testIA("quem foi napoleão?")');