// ============================================
// multi-ai-service.js - GROQ (RESPOSTA DIRETA EM PT)
// COM CHAVE GROQ FUNCIONANDO - 100% TESTADO
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO GROQ...');

class MultiAIService {
    constructor() {
        // ⭐ GROQ API (PRINCIPAL - Funcionando!)
        this.GROQ_API_KEY = "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";
        this.GROQ_MODELS = [
            "qwen/qwen3.6-27b",           // ✅ Funcionou!
            "llama-3.1-8b-instant",       // ✅ Funciona
            "llama-3.3-70b-versatile",    // ✅ Funciona
            "mixtral-8x7b-32768"          // Fallback
        ];
        
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 100;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        console.log('[MultiAI] 🚀 Inicializando...');
        console.log('[MultiAI] 📌 Modo: GROQ');
        console.log('[MultiAI] 🔑 Groq: ✅ Configurado');
        console.log('[MultiAI] 📌 Modelos:', this.GROQ_MODELS);
        this._resetarLimite();
        console.log('[MultiAI] ✅ Serviço pronto!');
    }
    
    // ============================================
    // ⭐ MÉTODO PRINCIPAL
    // ============================================
    async sendMessage(prompt, context = '') {
        console.log('[MultiAI] 📤 Enviando:', prompt.substring(0, 60) + '...');
        
        // Verificar limite
        if (!this.temLimiteDisponivel()) {
            return {
                success: false,
                error: `Limite diário de ${this._limiteDiario} perguntas atingido.`
            };
        }
        
        // Verificar cache
        const cached = this._getFromCache(prompt, context);
        if (cached) {
            console.log('[MultiAI] 📦 Resposta do cache!');
            return { success: true, text: cached, fromCache: true };
        }
        
        // ⭐ TENTAR GROQ (PRINCIPAL)
        const groqResult = await this._callGroqWithFallback(prompt, context);
        if (groqResult.success) {
            this._incrementarUso();
            this._saveToCache(prompt, context, groqResult.text);
            console.log('[MultiAI] ✅ Resposta do Groq!');
            return { success: true, text: groqResult.text };
        }
        
        console.log('[MultiAI] ⚠️ Todos os modelos Groq falharam');
        
        // ⭐ FALLBACK LOCAL (sempre disponível)
        console.log('[MultiAI] 📝 Usando fallback local');
        const fallback = this._getFallback(prompt, context);
        this._incrementarUso();
        return {
            success: true,
            text: fallback,
            fromFallback: true,
            error: 'Groq indisponível - usando resposta local'
        };
    }
    
    // ============================================
    // ⭐ GROQ API COM FALLBACK
    // ============================================
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
        
        // ⭐ SYSTEM PROMPT - Força resposta em português
        const systemPrompt = `Você é um assistente de estudos útil e profissional.

INSTRUÇÕES OBRIGATÓRIAS:
1. Responda SEMPRE em português, de forma direta e natural
2. NÃO pense em inglês primeiro - responda diretamente em português
3. Seja claro, objetivo e bem estruturado
4. Use linguagem formal e educada
5. NÃO inclua "think", "análise" ou "raciocínio" na resposta
6. Responda APENAS o conteúdo final, sem mostrar o processo de pensamento
7. Seja completo, mas conciso
8. Use os dados do contexto para personalizar a resposta`;
        
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
                    temperature: 0.5,
                    max_tokens: 600
                })
            });
            
            console.log(`[Groq] 📥 Status:`, response.status);
            
            // Tentar sem prefixo se 404
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
                        temperature: 0.5,
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
                
                // ⭐ REMOVER QUALQUER TAG <think>
                text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
                text = text.replace(/```[\s\S]*?```/g, '');
                text = text.replace(/^\s*think\s*/i, '');
                
                const cleanText = this._cleanText(text.trim());
                return { success: true, text: cleanText };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Groq] ❌ Erro de rede:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // ============================================
    // ⭐ LIMPAR TEXTO
    // ============================================
    _cleanText(text) {
        if (!text) return text;
        
        // Remover tags de pensamento
        let clean = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
        clean = clean.replace(/```[\s\S]*?```/g, '');
        clean = clean.replace(/^\s*think\s*/i, '');
        clean = clean.replace(/^\s*análise\s*/i, '');
        clean = clean.replace(/^\s*raciocínio\s*/i, '');
        
        // Remover "(via Groq (xxx))"
        clean = clean.replace(/\s*\(via\s+[^)]+\)/gi, '');
        clean = clean.replace(/\s*\[via\s+[^\]]+\]/gi, '');
        clean = clean.replace(/\s*provedor:\s*[^\s]+/gi, '');
        
        // Remover emojis (opcional - comentar se quiser manter)
        // clean = clean.replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
        // clean = clean.replace(/[\u{2600}-\u{27BF}]/gu, '');
        
        // Remover espaços extras
        clean = clean.replace(/\s+/g, ' ').trim();
        
        return clean;
    }
    
    // ============================================
    // ⭐ FALLBACK LOCAL
    // ============================================
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        const isGiria = context && context.includes('MODO GÍRIA ATIVO');
        
        const topicos = {
            saudacao: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'e aí'],
            estudo: ['estud', 'aula', 'prova', 'matéria', 'aprender', 'revisar'],
            tarefa: ['tarefa', 'dever', 'trabalho', 'entrega', 'prazo', 'pendente'],
            matematica: ['matemática', 'matematica', 'cálculo', 'equação', 'fórmula', 'número'],
            fisica: ['física', 'fisica', 'movimento', 'energia', 'força'],
            historia: ['história', 'historia', 'passado', 'acontecimento', 'época'],
            programacao: ['programação', 'programacao', 'código', 'javascript', 'python'],
            motivacao: ['motivação', 'motivacao', 'ânimo', 'animar', 'força', 'foco'],
            geografia: ['capital', 'país', 'cidade', 'estado', 'países', 'continente'],
            anotacao: ['anotação', 'nota', 'anotacoes', 'notas'],
            disciplina: ['disciplina', 'matéria', 'disciplinas', 'matérias']
        };
        
        let topicoPrincipal = 'padrao';
        let maiorMatch = 0;
        for (const [key, palavras] of Object.entries(topicos)) {
            const matches = palavras.filter(p => texto.includes(p)).length;
            if (matches > maiorMatch) {
                maiorMatch = matches;
                topicoPrincipal = key;
            }
        }
        
        const respostas = {
            saudacao: isGiria 
                ? 'Eai broo! Tá fixe? Como posso ajudar hoje? Tamos juntos!'
                : 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos!',
            
            estudo: isGiria
                ? 'Bora estudar, magaia! A chave é consistência. Faz um plano, segue firme e tamos juntos!'
                : 'Para estudar de forma eficiente, recomendo: criar um cronograma realista, usar técnicas como Pomodoro (25min foco, 5min pausa), revisar o conteúdo regularmente e fazer resumos e mapas mentais.',
            
            geografia: isGiria
                ? `Sobre geografia: ${this._respostaGeografia(texto)}`
                : `Sobre geografia: ${this._respostaGeografia(texto)}`,
            
            anotacao: isGiria
                ? `Tu tens anotações guardadas, broo! Quer ver alguma específica?`
                : `Você tem anotações salvas. Posso ajudar a revisar ou organizar alguma delas.`,
            
            disciplina: isGiria
                ? `Tuas disciplinas estão registradas. Quer saber de alguma em específico?`
                : `Suas disciplinas estão registradas. Posso ajudar com alguma matéria específica.`,
            
            tarefa: isGiria
                ? 'As tarefas tão aí, mas tu consegues! Vai devagar, uma de cada vez. Faz uma lista e prioriza!'
                : 'Para gerenciar suas tarefas: priorize as mais urgentes, divida em pequenas etapas, defina prazos realistas e use a técnica Pomodoro para manter o foco.',
            
            matematica: isGiria
                ? 'Matemática é treino, broo! Resolve exercícios todo dia que melhora! Tamos juntos!'
                : 'Matemática requer prática constante. Resolva exercícios diariamente, entenda os conceitos antes de memorizar fórmulas e não tenha medo de errar - o erro faz parte do aprendizado.',
            
            fisica: isGiria
                ? 'Física é entender o mundo, magaia! Pensa nos exemplos do dia a dia!'
                : 'Física é sobre entender como o mundo funciona. Relacione os conceitos com situações cotidianas e pratique a resolução de problemas com calma.',
            
            historia: isGiria
                ? 'História é contar histórias! Liga os acontecimentos que fica mais fácil!'
                : 'História é sobre conexões. Entenda a linha do tempo, os contextos e as relações entre eventos. Fazer resumos cronológicos ajuda muito.',
            
            programacao: isGiria
                ? 'Programação é prática, broo! Escreve código todo dia e vai ficando!'
                : 'Programação se aprende praticando. Escreva código todos os dias, resolva problemas pequenos primeiro e não desista dos erros - eles são seus melhores professores.',
            
            motivacao: isGiria
                ? 'Força, magaia! Tu consegues! Cada dia é uma vitória! Tamos juntos!'
                : 'Você é capaz de realizar grandes coisas. Lembre-se: o sucesso é a soma de pequenos esforços repetidos dia após dia. Continue firme!',
            
            padrao: isGiria
                ? 'Boa pergunta, broo! Tenta reformular ou me conta mais detalhes. Tamos juntos!'
                : 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes? Estou aqui para ajudar com seus estudos!'
        };
        
        return respostas[topicoPrincipal] || respostas.padrao;
    }
    
    _respostaGeografia(texto) {
        const paises = {
            'moçambique': 'A capital de Moçambique é Maputo.',
            'zambia': 'A capital da Zâmbia é Lusaka.',
            'zâmbia': 'A capital da Zâmbia é Lusaka.',
            'angola': 'A capital de Angola é Luanda.',
            'brasil': 'A capital do Brasil é Brasília.',
            'portugal': 'A capital de Portugal é Lisboa.',
            'etiopia': 'A capital da Etiópia é Adis Abeba.',
            'china': 'A capital da China é Pequim.',
            'rússia': 'A capital da Rússia é Moscou.',
            'eua': 'A capital dos EUA é Washington D.C.',
            'frança': 'A capital da França é Paris.',
            'inglaterra': 'A capital da Inglaterra é Londres.',
            'japão': 'A capital do Japão é Tóquio.',
            'índia': 'A capital da Índia é Nova Délhi.',
            'nigéria': 'A capital da Nigéria é Abuja.',
            'egito': 'A capital do Egito é Cairo.'
        };
        
        for (const [key, resposta] of Object.entries(paises)) {
            if (texto.includes(key)) {
                return resposta;
            }
        }
        
        return 'Desculpe, não sei a capital desse país. Tente perguntar de outro.';
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
console.log('[MultiAI] 🔑 Groq: CONFIGURADO');
console.log('[MultiAI] 💡 Teste: window.testIA("para que serve um mouse?")');