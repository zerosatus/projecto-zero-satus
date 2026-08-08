// ============================================
// multi-ai-service.js - MÚLTIPLAS APIs COM FALLBACK
// SUPORTA: Grok, SambaNova, DeepSeek, OpenRouter
// VIA PROXY (resolve CORS e esconde chaves)
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO MULTI-API VIA PROXY...');

class MultiAIService {
    constructor() {
        // ⭐ CONFIGURAÇÃO DAS APIS (via proxy)
        this.providers = [];
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this._limiteDiario = 80; // Limite total combinado
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
        
        // ⭐ REGISTRAR PROVEDORES
        this._registerProviders();
        
        console.log(`[MultiAI] ✅ ${this.providers.length} provedores registrados`);
        this._resetarLimite();
        console.log('[MultiAI] 📊 Status inicial:', this.getStatus());
    }
    
    // ============================================
    // ⭐ REGISTRAR PROVEDORES
    // ============================================
    _registerProviders() {
        // 🔥 GROK (xAI)
        this.providers.push({
            name: 'Grok',
            key: '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',
            url: '/api/proxy', // VIA PROXY
            model: 'grok-beta',
            body: (prompt, context) => ({
                provider: 'grok',
                prompt: prompt,
                context: context || '',
                model: 'grok-beta'
            }),
            isAvailable: true,
            usoHoje: 0,
            limiteDiario: 30
        });
        
        // 🔥 SAMBANOVA
        this.providers.push({
            name: 'SambaNova',
            key: 'f3319e62-2d30-4f16-b9a2-0ec452183696',
            url: '/api/proxy',
            model: 'Llama-3.1-70B-Instruct',
            body: (prompt, context) => ({
                provider: 'sambanova',
                prompt: prompt,
                context: context || '',
                model: 'Llama-3.1-70B-Instruct'
            }),
            isAvailable: true,
            usoHoje: 0,
            limiteDiario: 40
        });
        
        // 🔥 DEEPSEEK
        this.providers.push({
            name: 'DeepSeek',
            key: 'sk-e528baf9102b44f59696badf598dbc4b',
            url: '/api/proxy',
            model: 'deepseek-chat',
            body: (prompt, context) => ({
                provider: 'deepseek',
                prompt: prompt,
                context: context || '',
                model: 'deepseek-chat'
            }),
            isAvailable: true,
            usoHoje: 0,
            limiteDiario: 50
        });
        
        // 🔥 OPENROUTER (Fallback final)
        this.providers.push({
            name: 'OpenRouter',
            key: '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',
            url: '/api/proxy',
            model: 'openrouter/free',
            body: (prompt, context) => ({
                provider: 'openrouter',
                prompt: prompt,
                context: context || '',
                model: 'openrouter/free'
            }),
            isAvailable: true,
            usoHoje: 0,
            limiteDiario: 20
        });
    }
    
    // ============================================
    // ⭐ GERENCIAR LIMITE DIÁRIO
    // ============================================
    _resetarLimite() {
        const hoje = new Date().toDateString();
        const dataSalva = localStorage.getItem('multi_ai_data');
        
        if (dataSalva !== hoje) {
            localStorage.setItem('multi_ai_data', hoje);
            localStorage.setItem('multi_ai_uso', '0');
            this.providers.forEach(p => p.usoHoje = 0);
            this._usosHoje = 0;
            this._dataReset = hoje;
            console.log('[MultiAI] 📅 Limite resetado para novo dia');
        }
    }
    
    getUsoHoje() {
        this._resetarLimite();
        const saved = localStorage.getItem('multi_ai_uso');
        this._usosHoje = parseInt(saved) || 0;
        return this._usosHoje;
    }
    
    _incrementarUso() {
        this._resetarLimite();
        this._usosHoje++;
        localStorage.setItem('multi_ai_uso', String(this._usosHoje));
        console.log(`[MultiAI] 📊 Uso hoje: ${this._usosHoje}/${this._limiteDiario}`);
    }
    
    temLimiteDisponivel() {
        return this.getUsoHoje() < this._limiteDiario;
    }
    
    getLimiteRestante() {
        return Math.max(0, this._limiteDiario - this.getUsoHoje());
    }
    
    // ============================================
    // ⭐ CACHE DE RESPOSTAS
    // ============================================
    _getCacheKey(prompt, context) {
        return `${prompt.substring(0, 50)}|${context.substring(0, 100)}`;
    }
    
    _getFromCache(prompt, context) {
        const key = this._getCacheKey(prompt, context);
        if (this._cache.has(key)) {
            const item = this._cache.get(key);
            if (Date.now() - item.timestamp < 3600000) {
                console.log('[MultiAI] 📦 Resposta do cache!');
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
    // ⭐ ENVIAR MENSAGEM (COM FALLBACK AUTOMÁTICO)
    // ============================================
    async sendMessage(prompt, context = '') {
        console.log('[MultiAI] 📤 Enviando mensagem...');
        console.log(`[MultiAI] 📝 Prompt: ${prompt.substring(0, 60)}...`);
        
        if (!this.temLimiteDisponivel()) {
            return {
                success: false,
                error: `⛔ Limite diário de ${this._limiteDiario} perguntas atingido! Volte amanhã.`
            };
        }
        
        // Verificar cache
        const cached = this._getFromCache(prompt, context);
        if (cached) {
            return { success: true, text: cached, fromCache: true };
        }
        
        // ⭐ TENTAR CADA PROVEDOR EM ORDEM (com randomização para balancear)
        const shuffledProviders = this._shuffleProviders();
        let lastError = null;
        
        for (let i = 0; i < shuffledProviders.length; i++) {
            const provider = shuffledProviders[i];
            
            // Verificar se o provedor tem limite disponível
            if (provider.usoHoje >= provider.limiteDiario) {
                console.log(`[MultiAI] ⏭️ ${provider.name} atingiu limite (${provider.usoHoje}/${provider.limiteDiario})`);
                continue;
            }
            
            console.log(`[MultiAI] 🔄 Tentando ${provider.name} (${i+1}/${shuffledProviders.length})...`);
            
            try {
                const result = await this._tryProvider(provider, prompt, context);
                
                if (result.success) {
                    // Incrementar uso
                    provider.usoHoje++;
                    this._incrementarUso();
                    
                    // Salvar no cache
                    this._saveToCache(prompt, context, result.text);
                    
                    console.log(`[MultiAI] ✅ ${provider.name} respondeu com sucesso!`);
                    return {
                        success: true,
                        text: result.text,
                        provider: provider.name,
                        fromCache: false
                    };
                }
                
                // Se falhou por limite, marcar como indisponível
                if (result.limitExceeded) {
                    provider.usoHoje = provider.limiteDiario;
                    console.log(`[MultiAI] ⚠️ ${provider.name} excedeu limite`);
                }
                
                lastError = result.error;
                console.log(`[MultiAI] ⚠️ ${provider.name} falhou:`, result.error);
                
            } catch (error) {
                console.error(`[MultiAI] ❌ ${provider.name} erro:`, error.message);
                lastError = error.message;
            }
        }
        
        // ⭐ SE TODOS FALHAREM, USAR FALLBACK OFFLINE
        console.log('[MultiAI] 📦 Usando fallback offline...');
        const fallback = this._getFallbackResponse(prompt, context);
        return { 
            success: true, 
            text: fallback, 
            fromFallback: true,
            error: lastError 
        };
    }
    
    // ============================================
    // ⭐ EMBARALHAR PROVEDORES (evita sobrecarga)
    // ============================================
    _shuffleProviders() {
        const shuffled = [...this.providers];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // ⭐ PRIORIZAR GROK E SAMBANOVA (menos restritos)
        // Coloca Grok e SambaNova no início
        const priorityOrder = ['Grok', 'SambaNova', 'DeepSeek', 'OpenRouter'];
        shuffled.sort((a, b) => {
            const idxA = priorityOrder.indexOf(a.name);
            const idxB = priorityOrder.indexOf(b.name);
            return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
        });
        return shuffled;
    }
    
    // ============================================
    // ⭐ TENTAR PROVEDOR ESPECÍFICO (VIA PROXY)
    // ============================================
    async _tryProvider(provider, prompt, context) {
        const timeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout após 30s')), 30000)
        );
        
        try {
            const fetchPromise = fetch(provider.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(provider.body(prompt, context))
            });
            
            const response = await Promise.race([fetchPromise, timeout]);
            
            console.log(`[MultiAI] 📥 ${provider.name} Status:`, response.status);
            
            // Tentar parsear a resposta
            let data;
            try {
                data = await response.json();
            } catch (e) {
                // Se não for JSON, tentar texto
                const text = await response.text();
                console.error(`[MultiAI] ❌ ${provider.name} resposta não-JSON:`, text.substring(0, 200));
                return { success: false, error: 'Resposta inválida do servidor' };
            }
            
            if (!response.ok) {
                // ⭐ DETECTAR LIMITE EXCEDIDO
                if (response.status === 429 || 
                    response.status === 402 ||
                    data.limitExceeded ||
                    data.error?.toLowerCase().includes('rate limit') ||
                    data.error?.toLowerCase().includes('quota') ||
                    data.error?.toLowerCase().includes('exceeded') ||
                    data.error?.toLowerCase().includes('insufficient balance') ||
                    data.error?.toLowerCase().includes('saldo insuficiente')) {
                    return { success: false, error: 'Limite excedido', limitExceeded: true };
                }
                
                if (response.status === 401 || response.status === 403) {
                    return { success: false, error: '🔑 Chave inválida!' };
                }
                
                if (response.status === 404) {
                    return { success: false, error: 'Modelo não encontrado', modelError: true };
                }
                
                return {
                    success: false,
                    error: data.error || `Erro ${response.status}: Falha na comunicação`
                };
            }
            
            // ⭐ VERIFICAR SE O PROXY RETORNOU SUCESSO
            if (data.success && data.text) {
                return { success: true, text: data.text.trim() };
            }
            
            // Se o proxy retornou erro
            if (data.error) {
                // Verificar se é limite
                if (data.error.toLowerCase().includes('limit') || 
                    data.error.toLowerCase().includes('quota') ||
                    data.error.toLowerCase().includes('exceeded') ||
                    data.error.toLowerCase().includes('saldo')) {
                    return { success: false, error: 'Limite excedido', limitExceeded: true };
                }
                return { success: false, error: data.error };
            }
            
            return { success: false, error: 'Resposta inesperada da API' };
            
        } catch (error) {
            console.error(`[MultiAI] ❌ ${provider.name} erro:`, error.message);
            // Se for erro de rede, tentar novamente com outro provedor
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                return { success: false, error: 'Erro de rede' };
            }
            return { success: false, error: error.message };
        }
    }
    
    // ============================================
    // ⭐ FALLBACK OFFLINE (com gíria)
    // ============================================
    _getFallbackResponse(prompt, context) {
        const texto = prompt.toLowerCase();
        const isGiria = context && context.includes('MODO GÍRIA ATIVO');
        
        const respostas = {
            saudacao: isGiria 
                ? '🇲🇿 Eai broo! Tá fixe? Como posso ajudar hoje?'
                : 'Olá! Como posso ajudar você hoje?',
            
            texto: isGiria
                ? '🇲🇿 Para escrever bem, lê bastante e pratica todo dia. Começa com um rascunho, depois revisa. Tamos juntos! 📝'
                : 'Para escrever bem: 1) Leia bastante, 2) Pratique todos os dias, 3) Faça rascunhos e revise, 4) Peça feedback.',
            
            matematica: isGiria
                ? '🇲🇿 Matemática é prática, broo! Treina os básicos primeiro: adição, subtração, multiplicação e divisão. Depois vai avançando! 🧮'
                : 'Para matemática: 1) Domine as operações básicas, 2) Pratique exercícios diariamente, 3) Entenda os conceitos antes de memorizar fórmulas.',
            
            estudo: isGiria
                ? '🇲🇿 Bora estudar, magaia! A chave é consistência. Faz um plano e segue firme! Tamos juntos! 💪'
                : 'Para estudar de forma eficiente: 1) Crie um cronograma, 2) Use técnicas como Pomodoro (25min foco, 5min pausa), 3) Revise o conteúdo regularmente.',
            
            padrao: isGiria
                ? '🇲🇿 Boa pergunta, broo! Tenta reformular ou pergunta de outro jeito. Tamos juntos!'
                : 'Desculpe, não entendi sua pergunta. Poderia reformular? Estou aqui para ajudar!'
        };
        
        // ⭐ DETECTAR INTENÇÃO
        if (texto.includes('oi') || texto.includes('olá') || texto.includes('bom dia') || texto.includes('boa tarde')) {
            return respostas.saudacao;
        }
        if (texto.includes('escrever') || texto.includes('redação') || texto.includes('texto') || texto.includes('português') || texto.includes('gramática')) {
            return respostas.texto;
        }
        if (texto.includes('matem') || texto.includes('conta') || texto.includes('númer') || texto.includes('soma') || texto.includes('multiplic') || texto.includes('divis')) {
            return respostas.matematica;
        }
        if (texto.includes('estud') || texto.includes('aula') || texto.includes('prova') || texto.includes('aprender')) {
            return respostas.estudo;
        }
        
        return respostas.padrao;
    }
    
    // ============================================
    // ⭐ STATUS DOS PROVEDORES
    // ============================================
    getStatus() {
        this._resetarLimite();
        return {
            usoTotal: this._usosHoje,
            limiteTotal: this._limiteDiario,
            restante: this.getLimiteRestante(),
            providers: this.providers.map(p => ({
                name: p.name,
                usoHoje: p.usoHoje,
                limiteDiario: p.limiteDiario,
                disponivel: p.usoHoje < p.limiteDiario,
                percentual: Math.round((p.usoHoje / p.limiteDiario) * 100)
            }))
        };
    }
    
    // ============================================
    // ⭐ RESETAR MANUALMENTE
    // ============================================
    resetLimite() {
        localStorage.setItem('multi_ai_data', new Date().toDateString());
        localStorage.setItem('multi_ai_uso', '0');
        this.providers.forEach(p => p.usoHoje = 0);
        this._usosHoje = 0;
        console.log('[MultiAI] 📅 Limite resetado manualmente');
        return this.getStatus();
    }
}

// ============================================
// ⭐ INSTÂNCIA GLOBAL
// ============================================
const multiAI = new MultiAIService();
window.MultiAIService = multiAI;

// ⭐ COMPATIBILIDADE COM CÓDIGO EXISTENTE
window.GeminiService = multiAI;
window.OpenRouterService = multiAI;

// ⭐ FUNÇÃO GLOBAL PARA LIMITE
window.getLimiteIA = () => {
    const status = multiAI.getStatus();
    return {
        usado: status.usoTotal,
        maximo: status.limiteTotal,
        restante: status.restante,
        providers: status.providers,
        reset: () => multiAI.resetLimite()
    };
};

console.log('[MultiAI] ✅ Serviço Multi-API via Proxy carregado com sucesso!');
console.log(`[MultiAI] 📊 ${multiAI.providers.length} provedores disponíveis via proxy`);
console.log('[MultiAI] 📊 Detalhes:');
multiAI.providers.forEach(p => {
    console.log(`   - ${p.name}: ${p.limiteDiario} perguntas/dia (via proxy)`);
});