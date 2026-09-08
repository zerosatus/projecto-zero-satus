// ============================================
// multi-ai-service.js - POLLINATIONS.AI + GEMINI + FALLBACK
// COM CHAVE GEMINI CONFIGURADA - 100% FUNCIONAL
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO MULTI-API...');

class MultiAIService {
    constructor() {
        // ⭐ POLLINATIONS - MODO ANÔNIMO (SEM CHAVE)
        this.POLLINATIONS_API_KEY = null;
        
        // ⭐ GEMINI - CHAVE CONFIGURADA (GRATUITA)
        this.GEMINI_API_KEY = "AQ.Ab8RN6IYNCNTvS8vcBqvI56TT6QH7iMSIOC7H8rHMeIEhcOOFA";
        this.USE_GEMINI = true; // ATIVADO!
        
        // Cache para reduzir chamadas
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 80;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        console.log('[MultiAI] 🚀 Inicializando...');
        console.log('[MultiAI] 📌 Modo: ANÔNIMO (Pollinations) + GEMINI (fallback)');
        console.log('[MultiAI] 🔑 Gemini: ✅ Configurado e ATIVO!');
        this._resetarLimite();
        console.log('[MultiAI] ✅ Serviço pronto!');
    }
    
    // ============================================
    // ⭐ MÉTODO PRINCIPAL - ENVIAR MENSAGEM
    // ============================================
    async sendMessage(prompt, context = '') {
        console.log('[MultiAI] 📤 Enviando:', prompt.substring(0, 60) + '...');
        
        // Verificar limite diário
        if (!this.temLimiteDisponivel()) {
            return {
                success: false,
                error: `⛔ Limite diário de ${this._limiteDiario} perguntas atingido!`
            };
        }
        
        // Verificar cache
        const cached = this._getFromCache(prompt, context);
        if (cached) {
            console.log('[MultiAI] 📦 Resposta do cache!');
            return { success: true, text: cached, fromCache: true };
        }
        
        // ⭐ TENTAR GEMINI PRIMEIRO (MAIS CONFIÁVEL)
        if (this.USE_GEMINI && this.GEMINI_API_KEY) {
            try {
                const result = await this._callGeminiAPI(prompt, context);
                if (result.success) {
                    this._incrementarUso();
                    this._saveToCache(prompt, context, result.text);
                    console.log('[MultiAI] ✅ Resposta do Gemini!');
                    return result;
                }
                console.log('[MultiAI] ⚠️ Gemini falhou:', result.error);
            } catch (error) {
                console.error('[MultiAI] ❌ Erro no Gemini:', error.message);
            }
        }
        
        // ⭐ TENTAR POLLINATIONS (MODO ANÔNIMO)
        try {
            const result = await this._callPollinationsAPI(prompt, context);
            
            if (result.success) {
                this._incrementarUso();
                this._saveToCache(prompt, context, result.text);
                console.log('[MultiAI] ✅ Resposta do Pollinations!');
                return result;
            }
            
            console.log('[MultiAI] ⚠️ Pollinations falhou:', result.error);
            
        } catch (error) {
            console.error('[MultiAI] ❌ Erro no Pollinations:', error.message);
        }
        
        // ⭐ FALLBACK LOCAL (sempre disponível)
        console.log('[MultiAI] 📝 Usando fallback local');
        const fallback = this._getFallback(prompt, context);
        this._incrementarUso();
        return {
            success: true,
            text: fallback,
            fromFallback: true,
            error: 'APIs indisponíveis - usando resposta local'
        };
    }
    
    // ============================================
    // ⭐ GEMINI API (PRINCIPAL - GRATUITA)
    // ============================================
    async _callGeminiAPI(prompt, context) {
        if (!this.GEMINI_API_KEY) {
            return { success: false, error: 'Gemini não configurado' };
        }
        
        // URL CORRETA para a API Gemini
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.GEMINI_API_KEY}`;
        
        console.log('[Gemini] 📡 Enviando para Gemini...');
        console.log('[Gemini] 🔑 Chave:', this.GEMINI_API_KEY.substring(0, 15) + '...');
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 500,
                        topK: 40,
                        topP: 0.95
                    }
                })
            });
            
            console.log('[Gemini] 📥 Status:', response.status);
            
            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    const errorData = await response.json();
                    console.error('[Gemini] ❌ Detalhes:', errorData);
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (e) {
                    // Ignorar erro ao parsear JSON
                }
                return { success: false, error: errorMessage };
            }
            
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (text && text.length > 0) {
                console.log('[Gemini] ✅ Resposta recebida!');
                return { success: true, text: text.trim(), provider: 'Gemini' };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Gemini] ❌ Erro de rede:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // ============================================
    // ⭐ POLLINATIONS API - MODO ANÔNIMO (SEM CHAVE)
    // ============================================
    async _callPollinationsAPI(prompt, context) {
        const seed = Math.floor(Date.now() / 1000) % 2147483647;
        
        // ⭐ URL CORRIGIDA: SEM model=openai (causa erro 402)
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?seed=${seed}`;
        
        console.log('[Pollinations] 📡 URL:', url);
        console.log('[Pollinations] 📡 Modo: ANÔNIMO (sem chave)');
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain'
                    // ⭐ NÃO ENVIAR Authorization - modo anônimo puro!
                }
            });
            
            console.log('[Pollinations] 📥 Status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('[Pollinations] ❌ Erro:', response.status, errorText);
                
                // Se for 402, tentar sem seed
                if (response.status === 402) {
                    console.log('[Pollinations] 🔄 Tentando sem seed...');
                    const url2 = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`;
                    const response2 = await fetch(url2, {
                        method: 'GET',
                        headers: { 'Accept': 'text/plain' }
                    });
                    if (response2.ok) {
                        const text2 = await response2.text();
                        if (text2 && text2.length > 0) {
                            return { success: true, text: text2.trim() };
                        }
                    }
                }
                
                return { success: false, error: `Erro ${response.status}` };
            }
            
            const text = await response.text();
            console.log('[Pollinations] ✅ Resposta recebida!');
            
            if (text && text.length > 0) {
                return { success: true, text: text.trim(), provider: 'Pollinations' };
            }
            
            return { success: false, error: 'Resposta vazia' };
            
        } catch (error) {
            console.error('[Pollinations] ❌ Erro na requisição:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    // ============================================
    // ⭐ FALLBACK LOCAL INTELIGENTE
    // ============================================
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        const isGiria = context && context.includes('MODO GÍRIA ATIVO');
        
        // Detectar tópicos
        const topicos = {
            saudacao: ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'eai', 'e aí'],
            estudo: ['estud', 'aula', 'prova', 'matéria', 'aprender', 'revisar'],
            tarefa: ['tarefa', 'dever', 'trabalho', 'entrega', 'prazo'],
            matematica: ['matemática', 'matematica', 'cálculo', 'equação', 'fórmula', 'número'],
            fisica: ['física', 'fisica', 'movimento', 'energia', 'força'],
            historia: ['história', 'historia', 'passado', 'acontecimento', 'época'],
            programacao: ['programação', 'programacao', 'código', 'código', 'javascript', 'python'],
            motivacao: ['motivação', 'motivacao', 'ânimo', 'animar', 'força', 'foco']
        };
        
        // Encontrar tópico principal
        let topicoPrincipal = 'padrao';
        for (const [key, palavras] of Object.entries(topicos)) {
            if (palavras.some(p => texto.includes(p))) {
                topicoPrincipal = key;
                break;
            }
        }
        
        // Respostas por tópico
        const respostas = {
            saudacao: isGiria 
                ? '🇲🇿 Eai broo! Tá fixe? Como posso ajudar hoje? Tamos juntos! 😎'
                : 'Olá! Como posso ajudar você hoje? Estou aqui para te auxiliar nos estudos!',
            
            estudo: isGiria
                ? '🇲🇿 Bora estudar, magaia! A chave é consistência. Faz um plano, segue firme e tamos juntos! 💪'
                : 'Para estudar de forma eficiente, recomendo: 1) Criar um cronograma realista, 2) Usar técnicas como Pomodoro (25min foco, 5min pausa), 3) Revisar o conteúdo regularmente, 4) Fazer resumos e mapas mentais.',
            
            tarefa: isGiria
                ? '🇲🇿 As tarefas tão aí, mas tu consegues! Vai devagar, uma de cada vez. Faz uma lista e prioriza! 😎'
                : 'Para gerenciar suas tarefas: 1) Priorize as mais urgentes, 2) Divida em pequenas etapas, 3) Defina prazos realistas, 4) Use a técnica Pomodoro para manter o foco.',
            
            matematica: isGiria
                ? '🇲🇿 Matemática é treino, broo! Resolve exercícios todo dia que melhora! Tamos juntos! 📐'
                : 'Matemática requer prática constante. Resolva exercícios diariamente, entenda os conceitos antes de memorizar fórmulas e não tenha medo de errar — o erro faz parte do aprendizado.',
            
            fisica: isGiria
                ? '🇲🇿 Física é entender o mundo, magaia! Pensa nos exemplos do dia a dia! ⚡'
                : 'Física é sobre entender como o mundo funciona. Relacione os conceitos com situações cotidianas e pratique a resolução de problemas com calma.',
            
            historia: isGiria
                ? '🇲🇿 História é contar histórias! Liga os acontecimentos que fica mais fácil! 📖'
                : 'História é sobre conexões. Entenda a linha do tempo, os contextos e as relações entre eventos. Fazer resumos cronológicos ajuda muito.',
            
            programacao: isGiria
                ? '🇲🇿 Programação é prática, broo! Escreve código todo dia e vai ficando! 💻'
                : 'Programação se aprende praticando. Escreva código todos os dias, resolva problemas pequenos primeiro e não desista dos erros — eles são seus melhores professores.',
            
            motivacao: isGiria
                ? '🇲🇿 Força, magaia! Tu consegues! Cada dia é uma vitória! Tamos juntos! 🚀'
                : 'Você é capaz de realizar grandes coisas! Lembre-se: o sucesso é a soma de pequenos esforços repetidos dia após dia. Continue firme!',
            
            padrao: isGiria
                ? '🇲🇿 Boa pergunta, broo! Tenta reformular ou me conta mais detalhes. Tamos juntos! 🤝'
                : 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes? Estou aqui para ajudar com seus estudos!'
        };
        
        return respostas[topicoPrincipal] || respostas.padrao;
    }
    
    // ============================================
    // ⭐ MÉTODOS DE LIMITE DIÁRIO
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
    
    // ============================================
    // ⭐ CACHE
    // ============================================
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
    
    // ============================================
    // ⭐ STATUS E CONFIGURAÇÃO
    // ============================================
    getStatus() {
        return {
            usoTotal: this.getUsoHoje(),
            limiteTotal: this._limiteDiario,
            restante: this.getLimiteRestante(),
            cacheSize: this._cache.size,
            modo: 'ANÔNIMO + GEMINI (fallback)',
            geminiConfigurado: !!this.GEMINI_API_KEY,
            geminiAtivo: this.USE_GEMINI
        };
    }
    
    resetLimite() {
        localStorage.setItem('pollinations_data', new Date().toDateString());
        localStorage.setItem('pollinations_uso', '0');
        this._usosHoje = 0;
        console.log('[MultiAI] 📅 Limite resetado');
        return this.getStatus();
    }
    
    // ⭐ CONFIGURAR GEMINI (dinamicamente)
    configurarGemini(apiKey, ativar = true) {
        this.GEMINI_API_KEY = apiKey;
        this.USE_GEMINI = ativar && !!apiKey;
        console.log(`[MultiAI] ${this.USE_GEMINI ? '✅' : '❌'} Gemini ${this.USE_GEMINI ? 'ativado' : 'desativado'}`);
        return this.getStatus();
    }
}

// ============================================
// ⭐ INSTÂNCIA GLOBAL
// ============================================
const multiAI = new MultiAIService();
window.MultiAIService = multiAI;
window.GeminiService = multiAI;
window.OpenRouterService = multiAI;

// ============================================
// ⭐ FUNÇÕES GLOBAIS DE UTILIDADE
// ============================================
window.getLimiteIA = () => {
    const status = multiAI.getStatus();
    return {
        usado: status.usoTotal,
        maximo: status.limiteTotal,
        restante: status.restante,
        modo: status.modo,
        gemini: status.geminiConfigurado,
        reset: () => multiAI.resetLimite()
    };
};

window.testPollinations = async (pergunta) => {
    console.log('🧪 Testando Pollinations...');
    const result = await multiAI.sendMessage(pergunta);
    console.log('🤖 Resposta:', result);
    return result;
};

window.configurarGemini = (apiKey) => {
    return multiAI.configurarGemini(apiKey, true);
};

// ============================================
// ⭐ LOG DE INICIALIZAÇÃO
// ============================================
console.log('[MultiAI] ✅ Serviço carregado com sucesso!');
console.log('[MultiAI] 📌 Modo: GEMINI (principal) + POLLINATIONS (fallback) + LOCAL (último recurso)');
console.log('[MultiAI] 🔑 Gemini: CONFIGURADO e ATIVO!');
console.log('[MultiAI] 💡 Teste: window.testPollinations("Qual é a capital de Moçambique?")');