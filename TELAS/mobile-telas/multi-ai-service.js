// ============================================
// multi-ai-service.js - GROQ (ATUALIZADO)
// ⭐ NOVA API KEY
// ⭐ MODELOS GPT-OSS ADICIONADOS
// ⭐ ACESSO A DADOS DO USUÁRIO (APENAS LEITURA)
// ⭐ HISTÓRICO DE CONVERSAS CONTÍNUO
// ============================================

console.log('🔥 [MultiAI] CARREGANDO SERVIÇO GROQ...');

class MultiAIService {
    constructor() {
        // ⭐ NOVA API KEY
        this.GROQ_API_KEY = "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";
        
        // ⭐ ORDEM ATUALIZADA - MODELOS GPT-OSS ADICIONADOS
        // 1º - llama-3.1-8b-instant (RÁPIDO)
        // 2º - llama-3.3-70b-versatile (QUALIDADE)
        // 3º - openai/gpt-oss-20b (on_demand - NOVO)
        // 4º - openai/gpt-oss-120b (on_demand - NOVO)
        // 5º - mixtral-8x7b-32768 (fallback)
        // 6º - qwen/qwen3.6-27b (ÚLTIMO)
        this.GROQ_MODELS = [
            "llama-3.1-8b-instant",       // 1º - RÁPIDO
            "llama-3.3-70b-versatile",    // 2º - QUALIDADE
            "openai/gpt-oss-20b",         // 3º - NOVO
            "openai/gpt-oss-120b",        // 4º - NOVO
            "mixtral-8x7b-32768",         // 5º - Fallback
            "qwen/qwen3.6-27b"            // 6º - ÚLTIMO
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
    
    // ⭐ MÉTODO PARA ACESSAR DADOS DO USUÁRIO (APENAS LEITURA)
    _getUserDataContext() {
        try {
            // Tentar obter dados do app global
            if (window.app && window.app.data) {
                const data = window.app.data;
                const user = window.app.user || {};
                
                return {
                    nome: user.nome || user.displayName || 'Estudante',
                    email: user.email || '',
                    tarefas: data.tasks || [],
                    anotacoes: data.notes || [],
                    eventos: data.calendarEvents || [],
                    disciplinas: data.disciplinas || [],
                    horario: data.weeklySchedule || {},
                    timeSlots: data.timeSlots || [],
                    documentos: data.documentos || []
                };
            }
            
            // Fallback: tentar do CacheManager
            if (window.CacheManager) {
                return {
                    nome: 'Estudante',
                    email: '',
                    tarefas: window.CacheManager.get('tasks', []),
                    anotacoes: window.CacheManager.get('notes', []),
                    eventos: window.CacheManager.get('calendarEvents', []),
                    disciplinas: window.CacheManager.get('disciplinas', []),
                    horario: window.CacheManager.get('weeklySchedule', {}),
                    timeSlots: window.CacheManager.get('timeSlots', []),
                    documentos: window.CacheManager.get('documentos', [])
                };
            }
        } catch (e) {
            console.warn('[MultiAI] ⚠️ Erro ao obter dados do usuário:', e);
        }
        return null;
    }
    
    // ⭐ CONSTRUIR CONTEXTO COMPLETO COM DADOS DO USUÁRIO
    _buildFullContext(userMessage, extraContext = '') {
        const userData = this._getUserDataContext();
        
        let context = '';
        
        // ⭐ HISTÓRICO DA CONVERSA (últimas 10 mensagens)
        if (window.app?.modules?.ia?.messages) {
            const messages = window.app.modules.ia.messages;
            if (messages.length > 0) {
                const ultimas = messages.slice(-10);
                context += '\n📜 HISTÓRICO DA CONVERSA ATUAL:\n';
                ultimas.forEach(msg => {
                    const role = msg.role === 'user' ? '👤 Usuário' : '🤖 Assistente';
                    const content = (msg.content || '').substring(0, 200);
                    context += `${role}: ${content}${(msg.content || '').length > 200 ? '...' : ''}\n`;
                });
            }
        }
        
        // ⭐ DADOS DO USUÁRIO (APENAS LEITURA)
        if (userData) {
            context += `\n\n📚 DADOS DO ESTUDANTE (APENAS LEITURA - NÃO MODIFIQUE):\n`;
            context += `👤 Nome: ${userData.nome}\n`;
            context += `📧 Email: ${userData.email}\n`;
            
            // Tarefas
            const tarefas = userData.tarefas || [];
            const pendentes = tarefas.filter(t => !t.completed);
            const concluidas = tarefas.filter(t => t.completed);
            context += `\n📋 TAREFAS:\n`;
            context += `   Total: ${tarefas.length}\n`;
            context += `   Pendentes: ${pendentes.length}\n`;
            context += `   Concluídas: ${concluidas.length}\n`;
            if (pendentes.length > 0) {
                context += `   📌 Pendentes:\n`;
                pendentes.slice(0, 5).forEach((t, i) => {
                    context += `      ${i+1}. ${t.title || t.nome || 'Sem título'}${t.subject ? ` (${t.subject})` : ''}${t.date ? ` - Entrega: ${t.date}` : ''}\n`;
                });
            }
            
            // Anotações
            const anotacoes = userData.anotacoes || [];
            context += `\n📝 ANOTAÇÕES: ${anotacoes.length}\n`;
            if (anotacoes.length > 0) {
                anotacoes.slice(0, 3).forEach((n, i) => {
                    context += `   ${i+1}. ${n.title || 'Sem título'}\n`;
                });
            }
            
            // Disciplinas
            const disciplinas = userData.disciplinas || [];
            context += `\n📚 DISCIPLINAS: ${disciplinas.length}\n`;
            if (disciplinas.length > 0) {
                disciplinas.slice(0, 8).forEach(d => {
                    context += `   - ${d.nome}\n`;
                });
            }
            
            // Horário
            const horario = userData.horario || {};
            context += `\n📅 HORÁRIO SEMANAL:\n`;
            Object.entries(horario).forEach(([dia, aulas]) => {
                if (aulas && aulas.length > 0) {
                    const lista = aulas.map(a => `${a.materia} (${a.horaInicio}${a.horaFim ? ` - ${a.horaFim}` : ''})`).join(', ');
                    context += `   ${dia}: ${lista}\n`;
                }
            });
            
            // Documentos
            const documentos = userData.documentos || [];
            context += `\n📁 DOCUMENTOS: ${documentos.length}\n`;
        }
        
        // Contexto extra passado
        if (extraContext) {
            context += `\n\n${extraContext}`;
        }
        
        return context;
    }
    
    async sendMessage(prompt, context = '') {
        console.log('[MultiAI] 📤 Enviando:', prompt.substring(0, 60) + '...');
        
        if (!this.temLimiteDisponivel()) {
            return {
                success: false,
                error: `Limite diário de ${this._limiteDiario} perguntas atingido.`
            };
        }
        
        // ⭐ CONSTRUIR CONTEXTO COMPLETO
        const fullContext = this._buildFullContext(prompt, context);
        
        const cached = this._getFromCache(prompt, fullContext);
        if (cached) {
            console.log('[MultiAI] 📦 Resposta do cache!');
            return { success: true, text: cached, fromCache: true };
        }
        
        const groqResult = await this._callGroqWithFallback(prompt, fullContext);
        if (groqResult.success) {
            this._incrementarUso();
            this._saveToCache(prompt, fullContext, groqResult.text);
            console.log('[MultiAI] ✅ Resposta do Groq!');
            return { success: true, text: groqResult.text };
        }
        
        console.log('[MultiAI] 📝 Usando fallback local');
        const fallback = this._getFallback(prompt, fullContext);
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
        
        // ⭐ SYSTEM PROMPT ATUALIZADO COM ACESSO A DADOS
        const systemPrompt = `Você é um assistente de estudos chamado Zero IA, integrado ao sistema Zero Satus.

⚠️ REGRAS ABSOLUTAS - VIOLAR É PROIBIDO:
1. Responda APENAS em português do Brasil. NUNCA use inglês.
2. NUNCA mostre seu raciocínio, pensamentos ou análises.
3. NUNCA escreva "Okay", "Let me", "First", "Now", "I need", "I should", "Another possibility", "Draft", "Analysis" ou qualquer texto em inglês.
4. Comece sua resposta DIRETAMENTE com o conteúdo final em português.
5. NÃO use tags como <thought>, <thinking> ou similares.
6. Se não souber algo, diga "Desculpe, não tenho essa informação" em português.
7. Seja claro, objetivo e útil.

📊 ACESSO A DADOS DO USUÁRIO (APENAS LEITURA):
- Você tem acesso aos dados do estudante (tarefas, anotações, disciplinas, horário, documentos)
- USE esses dados para dar respostas personalizadas
- NUNCA modifique, crie ou delete dados do usuário
- Apenas LEIA e use as informações para ajudar

💬 HISTÓRICO DE CONVERSA:
- Você tem acesso ao histórico da conversa atual
- Mantenha a CONTINUIDADE e CONTEXTO das mensagens anteriores
- Se o usuário fizer uma pergunta de acompanhamento, responda no contexto

${context ? `\nCONTEXTO COMPLETO:\n${context}` : ''}`;

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
            
            // TRATAR MODELOS COM PREFIXO
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
            
            // TRATAR ERROS
            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorData.error || errorMessage;
                } catch (e) {}
                return { success: false, error: errorMessage };
            }
            
            // PROCESSAR RESPOSTA
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
    
    // ⭐ EXTRAIR APENAS A RESPOSTA EM PORTUGUÊS
    _extractPortugueseResponse(text) {
        if (!text) return text;
        
        let cleaned = text
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .replace(/\[thinking\][\s\S]*?\[\/thinking\]/gi, '')
            .replace(/```[\s\S]*?```/g, '')
            .trim();
        
        const lines = cleaned.split('\n');
        const cleanedLines = [];
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const isEnglishThought = 
                /^(Okay|Ok|Let me|I need|I should|First|Now|So|Well|Hmm|Alright|Draft|Analysis|Step|Wait|Actually|Another|Possibility|Maybe|Perhaps|Note|Important|Considering|However|But|Also|Then|Next|Finally)/i.test(trimmed) ||
                /(I need to|I should|Let me|I'll|I will|I can|I could|I think|I believe|I'm going|It seems|It appears|Another possibility)/i.test(trimmed);
            
            if (!isEnglishThought) {
                cleanedLines.push(trimmed);
            }
        }
        
        cleaned = cleanedLines.join('\n').trim();
        
        if (!cleaned || cleaned.length < 5) {
            return 'Desculpe, não consegui processar sua pergunta. Poderia reformular?';
        }
        
        return cleaned.trim();
    }
    
    // FALLBACK LOCAL
    _getFallback(prompt, context) {
        const texto = prompt.toLowerCase();
        
        if (texto.includes('tarefa') || texto.includes('pendente')) {
            const tarefas = window.app?.data?.tasks || [];
            const pendentes = tarefas.filter(t => !t.completed);
            if (pendentes.length === 0) {
                return 'Você não tem tarefas pendentes. Parabéns! 🎉';
            }
            return `Você tem ${pendentes.length} tarefas pendentes. Acesse a aba Tarefas para vê-las.`;
        }
        
        if (texto.includes('anota') || texto.includes('nota')) {
            const notas = window.app?.data?.notes || [];
            return `Você tem ${notas.length} anotações salvas.`;
        }
        
        if (texto.includes('disciplina')) {
            const disciplinas = window.app?.data?.disciplinas || [];
            if (disciplinas.length === 0) {
                return 'Nenhuma disciplina cadastrada.';
            }
            return `Suas disciplinas: ${disciplinas.map(d => d.nome).join(', ')}`;
        }
        
        if (texto.includes('oi') || texto.includes('olá') || texto.includes('eai')) {
            return 'Olá! Como posso ajudar você hoje? Estou aqui para auxiliar nos seus estudos!';
        }
        
        return 'Desculpe, não entendi completamente sua pergunta. Poderia reformular ou dar mais detalhes?';
    }
    
    // MÉTODOS DE LIMITE E CACHE
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
// INSTÂNCIA GLOBAL
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
console.log('[MultiAI] 💡 Teste: window.testIA("quais são minhas tarefas?")');