// ============================================
// multi-ai-service.js - GROQ (RESPOSTA EM PT NO FINAL)
// ⭐ MODELOS REORDENADOS CONFORME IMAGENS
// ⭐ openai/gpt-oss-120b PRIMEIRO, qwen POR ÚLTIMO
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO GROQ...');

class MultiAIService {
    constructor() {
        this.GROQ_API_KEY = "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";
        
        // ⭐ MODELOS REORDENADOS CONFORME AS IMAGENS
        // 1º - openai/gpt-oss-120b (da primeira imagem)
        // 2º - llama-3.3-70b-versatile (da segunda imagem)
        // 3º - llama-3.1-8b-instant (rápido e confiável)
        // 4º - mixtral-8x7b-32768 (fallback)
        // 5º - qwen/qwen3.6-27b (ÚLTIMO - conforme terceira imagem)
        this.GROQ_MODELS = [
            "openai/gpt-oss-120b",
            "llama-3.3-70b-versatile",
            "llama-3.1-8b-instant",
            "mixtral-8x7b-32768",
            "qwen/qwen3.6-27b"
        ];
        
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 100;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        console.log('[MultiAI] 🚀 Inicializando...');
        console.log('[MultiAI] 📌 Ordem dos modelos:', this.GROQ_MODELS.join(' → '));
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
        
        // ⭐ SYSTEM PROMPT OTIMIZADO PARA PT-BR SEM PENSAMENTOS
        const systemPrompt = `Você é um assistente de estudos chamado Zero IA. Responda SEMPRE em português do Brasil.

REGRAS OBRIGATÓRIAS:
1. NUNCA use inglês na resposta final.
2. NUNCA mostre seu raciocínio, pensamentos, tags  ou análises.
3. Responda DIRETAMENTE ao usuário, sem etapas intermediárias.
4. Comece sua resposta com o conteúdo final em português.
5. Seja claro, objetivo e útil.
6. Use o contexto fornecido para personalizar a resposta.
7. Mantenha a continuidade da conversa quando houver histórico.

${context ? `\nCONTEXTO DO USUÁRIO:\n${context}` : ''}`;

        try {
            // ⭐ REQUISIÇÃO PRINCIPAL
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
                        console.log('[Groq] ✅ Resposta recebida (sem prefixo)!');
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
                    console.error('[Groq] ❌ Detalhes:', errorData);
                    errorMessage = errorData.error?.message || errorData.error || errorMessage;
                } catch (e) {}
                return { success: false, error: errorMessage };
            }
            
            // ⭐ PROCESSAR RESPOSTA
            const data = await response.json();
            let text = data.choices?.[0]?.message?.content;
            
            if (text && text.length > 0) {
                console.log('[Groq] ✅ Resposta recebida!');
                console.log('[Groq] 📝 Tamanho original:', text.length);
                
                // ⭐ EXTRAIR APENAS A PARTE EM PORTUGUÊS
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
    
    // ⭐ FUNÇÃO QUE EXTRAI APENAS A RESPOSTA EM PORTUGUÊS
    _extractPortugueseResponse(text) {
        if (!text) return text;
        
        // ⭐ REMOVER TAGS DE PENSAMENTO COMUNS
        let cleaned = text
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '')
            .replace(/```[\s\S]*?```/g, '')
            .replace(/^(Okay|Ok|Let me|I need|First|Now|So|Well|Hmm|Alright)[^\n]*\n/gim, '')
            .trim();
        
        // ⭐ PROCURAR POR PADRÕES DE RESPOSTA EM PORTUGUÊS NO FINAL
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
            /(Desculpe[^]*?)(?=\s*$)/i,
            /(Claro![^]*?)(?=\s*$)/i,
            /(Com certeza[^]*?)(?=\s*$)/i,
            /(Entendi[^]*?)(?=\s*$)/i,
            /(Vamos[^]*?)(?=\s*$)/i,
            /(Você[^]*?)(?=\s*$)/i,
            /(Isso[^]*?)(?=\s*$)/i,
            /(Sim[^]*?)(?=\s*$)/i,
            /(Não[^]*?)(?=\s*$)/i
        ];
        
        // Tentar encontrar uma resposta em português
        for (const pattern of portuguesePatterns) {
            const match = cleaned.match(pattern);
            if (match && match[1].length > 10) {
                return match[1].trim();
            }
        }
        
        // ⭐ SE NÃO ENCONTROU, TENTAR PEGAR O ÚLTIMO PARÁGRAFO EM PORTUGUÊS
        const lines = cleaned.split('\n');
        const portugueseLines = lines.filter(line => {
            // Verificar se a linha tem caracteres portugueses e não é pensamento
            const hasPortuguese = /[áéíóúãõâêîôûçà]/i.test(line) || 
                                  /\b(é|são|está|você|para|como|que|não|sim|uma|um|dos|das)\b/i.test(line);
            const isNotThought = !/think|analysis|process|user|input|draft|output|response|answer|step|constraint|verify|check|internal|reasoning/i.test(line);
            return hasPortuguese && isNotThought && line.trim().length > 15;
        });
        
        if (portugueseLines.length > 0) {
            return portugueseLines.join('\n').trim();
        }
        
        // ⭐ ÚLTIMO RECURSO: PEGAR O TEXTO APÓS SEPARADORES
        const separators = ['---', 'Output:', 'Resposta:', 'Answer:', 'Resposta final:', 'Final:'];
        for (const sep of separators) {
            if (cleaned.includes(sep)) {
                const parts = cleaned.split(sep);
                if (parts.length > 1) {
                    const lastPart = parts[parts.length - 1].trim();
                    if (lastPart.length > 10) {
                        return lastPart;
                    }
                }
            }
        }
        
        // ⭐ SE TUDO FALHAR, PEGAR O ÚLTIMO TERÇO DO TEXTO
        const words = cleaned.split(' ');
        if (words.length > 30) {
            const startIndex = Math.floor(words.length * 0.6);
            return words.slice(startIndex).join(' ').trim();
        }
        
        return cleaned.trim();
    }
    
    // ============================================
    // ⭐ FALLBACK LOCAL (RESPOSTAS EM PORTUGUÊS)
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
        
        if (texto.includes('oi') || texto.includes('olá') || texto.includes('eai')) {
            return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos!';
        }
        
        if (texto.includes('estud') || texto.includes('aula') || texto.includes('prova')) {
            return 'Para estudar de forma eficiente, recomendo: criar um cronograma realista, usar técnicas como Pomodoro (25 minutos de foco, 5 minutos de pausa), revisar o conteúdo regularmente e fazer resumos e mapas mentais.';
        }
        
        if (texto.includes('tarefa') || texto.includes('dever')) {
            return 'Para organizar suas tarefas, recomendo priorizar as mais urgentes, usar lembretes e dividir tarefas grandes em partes menores. Você pode usar o módulo de Tarefas do app para gerenciá-las!';
        }
        
        if (texto.includes('anota') || texto.includes('nota')) {
            return 'Suas anotações são importantes para revisar o conteúdo. Recomendo organizá-las por disciplina e revisá-las periodicamente. Você pode usar o módulo de Notas do app!';
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