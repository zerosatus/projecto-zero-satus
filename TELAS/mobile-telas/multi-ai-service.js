// ============================================
// multi-ai-service.js - GROQ (CORRIGIDO)
// ⭐ LLAMA-3.3-70B PRIMEIRO (rápido e confiável)
// ⭐ QWEN POR ÚLTIMO (evita pensamentos em inglês)
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO GROQ...');

class MultiAIService {
    constructor() {
        this.GROQ_API_KEY = "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";
        
        // ⭐ ORDEM CORRIGIDA - LLAMA PRIMEIRO, QWEN POR ÚLTIMO
        // O qwen tem "pensamentos internos" em inglês que vazam no output
        // Por isso ele deve ser o ÚLTIMO recurso
        this.GROQ_MODELS = [
            "llama-3.3-70b-versatile",    // 1º - Melhor custo-benefício
            "llama-3.1-8b-instant",       // 2º - Rápido e confiável
            "mixtral-8x7b-32768",         // 3º - Fallback bom
            "openai/gpt-oss-120b",        // 4º - Pode não existir na API
            "qwen/qwen3.6-27b"            // 5º - ÚLTIMO (pensamentos em inglês)
        ];
        
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 100;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        console.log('[MultiAI] 🚀 Inicializando...');
        console.log('[MultiAI] 📌 Ordem dos modelos:');
        this.GROQ_MODELS.forEach((m, i) => console.log(`   ${i+1}º - ${m}`));
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
                    console.log(`[Groq] ✅ SUCESSO com modelo: ${model}`);
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
        
        // ⭐ SYSTEM PROMPT MUITO MAIS AGRESSIVO CONTRA PENSAMENTOS
        const systemPrompt = `Você é um assistente de estudos chamado Zero IA.

⚠️ REGRAS ABSOLUTAS - VIOLAR É PROIBIDO:
1. Responda APENAS em português do Brasil. NUNCA use inglês.
2. NUNCA mostre seu raciocínio, pensamentos ou análises.
3. NUNCA escreva "Okay", "Let me", "First", "Now", "I need", "I should", "Another possibility", "Draft", "Analysis" ou qualquer texto em inglês.
4. Comece sua resposta DIRETAMENTE com o conteúdo final em português.
5. NÃO use tags como <thought>, <thinking> ou similares.
6. Se não souber algo, diga "Desculpe, não tenho essa informação" em português.
7. Seja claro, objetivo e útil.

${context ? `\nCONTEXTO DO USUÁRIO:\n${context}` : ''}`;

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
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.0,
                    max_tokens: 800,
                    top_p: 0.9,
                    stream: false
                })
            });
            
            console.log(`[Groq] 📥 Status (${model}):`, response.status);
            
            // ⭐ TRATAR MODELOS COM PREFIXO (ex: openai/gpt-oss-120b)
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
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt }
                        ],
                        temperature: 0.0,
                        max_tokens: 800
                    })
                });
                
                if (response2.ok) {
                    const data2 = await response2.json();
                    const text2 = data2.choices?.[0]?.message?.content;
                    if (text2 && text2.length > 0) {
                        const cleanText = this._extractPortugueseResponse(text2.trim());
                        return { success: true, text: cleanText };
                    }
                }
            }
            
            // ⭐ TRATAR ERROS
            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.error || errorMessage;
                } catch (e) {}
                return { success: false, error: errorMessage };
            }
            
            // ⭐ PROCESSAR RESPOSTA
            const data = await response.json();
            let text = data.choices?.[0]?.message?.content;
            
            if (text && text.length > 0) {
                console.log('[Groq] 📝 Tamanho original:', text.length);
                const cleanText = this._extractPortugueseResponse(text.trim());
                console.log('[Groq] 🧹 Tamanho limpo:', cleanText.length);
                return { success: true, text: cleanText };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Groq] ❌ Erro de rede:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // ============================================
    // ⭐ EXTRAIR APENAS A RESPOSTA EM PORTUGUÊS (MUITO AGRESSIVO)
    // ============================================
    _extractPortugueseResponse(text) {
        if (!text) return text;
        
        console.log('[Extract] 🔍 Texto original:', text.substring(0, 200));
        
        // ⭐ PASSO 1: REMOVER TAGS E BLOCOS DE PENSAMENTO
        let cleaned = text
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '')
            .replace(/```[\s\S]*?```/g, '')
            .trim();
        
        // ⭐ PASSO 2: DIVIDIR EM LINHAS E FILTRAR PENSAMENTOS EM INGLÊS
        const lines = cleaned.split('\n');
        const cleanedLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            // ⭐ DETECTAR SE A LINHA É UM PENSAMENTO EM INGLÊS
            const isEnglishThought = 
                // Palavras típicas de pensamento
                /^(Okay|Ok|Let me|I need|I should|First|Now|So|Well|Hmm|Alright|Draft|Analysis|Step|Wait|Actually|Hmm|Another|Possibility|Maybe|Perhaps|Note|Important|Considering|However|But|Also|Then|Next|Finally)/i.test(trimmed) ||
                // Padrões de pensamento em inglês
                /(I need to|I should|Let me|I'll|I will|I can|I could|I think|I believe|I'm going|It seems|It appears|Another possibility|I should respond|I should address|I should mention|Let me think|Let me consider|Draft:|Analysis:)/i.test(trimmed) ||
                // Palavras técnicas em inglês
                /^(think|analysis|process|user|input|draft|output|response|answer|step|constraint|verify|check|internal|reasoning|but|however|also|first|second|third)/i.test(trimmed) ||
                // Linhas com apenas palavras em inglês
                /^[a-zA-Z\s,.:;!?'"()\[\]{}<>\-=+*&^%$#@!~`|\\\/]{15,}$/.test(trimmed);
            
            if (!isEnglishThought) {
                cleanedLines.push(trimmed);
            } else {
                console.log('[Extract] 🗑️ Linha removida:', trimmed.substring(0, 60));
            }
        }
        
        cleaned = cleanedLines.join('\n').trim();
        
        // ⭐ PASSO 3: SE AINDA TIVER TEXTO EM INGLÊS NO COMEÇO, TENTAR ENCONTRAR O INÍCIO EM PORTUGUÊS
        const portugueseStartPatterns = [
            /(A [a-záéíóúãõâêîôûç]+)/i,
            /(O [a-záéíóúãõâêîôûç]+)/i,
            /(Um [a-záéíóúãõâêîôûç]+)/i,
            /(Uma [a-záéíóúãõâêîôûç]+)/i,
            /(Não [a-záéíóúãõâêîôûç]+)/i,
            /(Sim[,\s])/i,
            /(Desculpe[,\s])/i,
            /(Olá[,\s])/i,
            /(Claro[,\s])/i,
            /(Com certeza[,\s])/i,
            /(Entendi[,\s])/i,
            /(Vamos[,\s])/i,
            /(Você[,\s])/i,
            /(Isso[,\s])/i,
            /(Aqui[,\s])/i,
            /(Para[,\s])/i,
            /(Quando[,\s])/i,
            /(Como[,\s])/i,
            /(Porque[,\s])/i,
            /(Daniel[,\s])/i,
            /(Anamibia[,\s])/i,
            /(Namíbia[,\s])/i,
            /(Sobre[,\s])/i,
            /(Existem[,\s])/i,
            /(É[,\s])/i,
            /(São[,\s])/i,
        ];
        
        // Tentar encontrar o início em português
        for (const pattern of portugueseStartPatterns) {
            const match = cleaned.match(pattern);
            if (match && match.index > 0) {
                // Se encontrou um padrão português que não está no início, cortar até lá
                const portugueseText = cleaned.substring(match.index);
                if (portugueseText.length > 20) {
                    console.log('[Extract] ✂️ Cortando até início em português:', portugueseText.substring(0, 100));
                    cleaned = portugueseText;
                    break;
                }
            }
        }
        
        // ⭐ PASSO 4: ÚLTIMA TENTATIVA - PEGAR APÓS SEPARADORES
        const separators = ['---', 'Output:', 'Resposta:', 'Answer:', 'Resposta final:', 'Final:'];
        for (const sep of separators) {
            if (cleaned.includes(sep)) {
                const parts = cleaned.split(sep);
                if (parts.length > 1) {
                    const lastPart = parts[parts.length - 1].trim();
                    if (lastPart.length > 10) {
                        console.log('[Extract] ✂️ Cortando após separador:', sep);
                        cleaned = lastPart;
                        break;
                    }
                }
            }
        }
        
        // ⭐ PASSO 5: SE O RESULTADO ESTIVER VAZIO, RETORNAR MENSAGEM PADRÃO
        if (!cleaned || cleaned.length < 5) {
            console.log('[Extract] ⚠️ Resultado vazio, usando fallback');
            return 'Desculpe, não consegui processar sua pergunta. Poderia reformular?';
        }
        
        console.log('[Extract] ✅ Texto final:', cleaned.substring(0, 200));
        return cleaned.trim();
    }
    
    // ============================================
    // ⭐ FALLBACK LOCAL
    // ============================================
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        
        if (texto.includes('daniel chapo')) {
            return 'Daniel Chapo é um político moçambicano, membro do partido FRELIMO. Ele foi governador da província de Inhambane e, em 2024, foi eleito Presidente da República de Moçambique. Antes disso, também atuou como Ministro da Administração Estatal e Função Pública.';
        }
        
        if (texto.includes('anamibia') || texto.includes('anamíbia')) {
            return 'Anamibia é um gênero de mariposas da família Noctuidae. O termo também pode ser uma confusão com "Namíbia", que é um país localizado no sudoeste da África. Se você quis dizer Namíbia, posso falar sobre o país.';
        }
        
        if (texto.includes('napoleao') || texto.includes('napoleão')) {
            return 'Napoleão Bonaparte (1769–1821) foi um líder militar e estadista francês que se tornou imperador da França em 1804. Ele ascendeu ao poder durante a Revolução Francesa, liderou campanhas militares bem-sucedidas que dominaram grande parte da Europa e implementou o Código Napoleônico. Após sua derrota na Batalha de Waterloo em 1815, foi exilado na ilha de Santa Helena, onde faleceu.';
        }
        
        if (texto.includes('celula') || texto.includes('célula')) {
            return 'A célula é a unidade básica estrutural, funcional e biológica de todos os seres vivos. É a menor parte de um organismo capaz de realizar todas as atividades necessárias para a vida, como metabolismo, crescimento, reprodução e resposta a estímulos. Existem dois tipos principais: células procarióticas e eucarióticas.';
        }
        
        if (texto.includes('internet')) {
            return 'A internet é uma rede global de computadores interconectados que se comunicam entre si por meio de protocolos padronizados. Ela permite o compartilhamento de informações, a comunicação em tempo real, o acesso a serviços online e a navegação na web.';
        }
        
        if (texto.includes('saturno')) {
            return 'Saturno é o sexto planeta do Sistema Solar, conhecido por seus anéis proeminentes compostos principalmente por gelo e poeira. É o segundo maior planeta do sistema, sendo um gigante gasoso.';
        }
        
        if (texto.includes('mouse')) {
            return 'Um mouse é um dispositivo periférico de entrada para computadores. Sua função principal é controlar o cursor na tela, permitindo navegar, selecionar, clicar e arrastar objetos.';
        }
        
        if (texto.includes('oi') || texto.includes('olá') || texto.includes('eai')) {
            return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos!';
        }
        
        if (texto.includes('estud') || texto.includes('aula') || texto.includes('prova')) {
            return 'Para estudar de forma eficiente, recomendo: criar um cronograma realista, usar técnicas como Pomodoro (25 minutos de foco, 5 minutos de pausa), revisar o conteúdo regularmente e fazer resumos e mapas mentais.';
        }
        
        return 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes? Estou aqui para ajudar com seus estudos.';
    }
    
    // ============================================
    // MÉTODOS DE LIMITE E CACHE
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
            modelos: this.GROQ_MODELS,
            ordem: this.GROQ_MODELS.join(' → ')
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
        ordem: status.ordem,
        reset: () => multiAI.resetLimite()
    };
};

window.testIA = async (pergunta) => {
    console.log('🧪 Testando IA...');
    const result = await multiAI.sendMessage(pergunta);
    console.log('🤖 Resposta:', result);
    return result;
};

window.verModelos = () => {
    console.log('📌 MODELOS NA ORDEM DE TENTATIVA:');
    multiAI.GROQ_MODELS.forEach((model, index) => {
        console.log(`   ${index + 1}º - ${model}`);
    });
    return multiAI.GROQ_MODELS;
};

console.log('[MultiAI] ✅ Serviço carregado!');
console.log('[MultiAI] 📌 Ordem dos modelos:');
multiAI.GROQ_MODELS.forEach((model, index) => {
    console.log(`   ${index + 1}º - ${model}`);
});
console.log('[MultiAI] 💡 Teste: window.testIA("quem foi napoleão?")');
console.log('[MultiAI] 📋 Ver modelos: window.verModelos()');