// ia-service.js - Serviço da IA (chamada ao Edge Function zero-ia)
class IAService {
    constructor() {
        this.SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
        this.SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";
        this._cache = new Map();
        this._cacheMaxSize = 50;
        this.LIMITE_DIARIO = 15;
        this._usosHoje = 0;
        this._dataReset = new Date().toDateString();
    }

    _resetarLimite() {
        const hoje = new Date().toDateString();
        if (localStorage.getItem('ia_limite_data') !== hoje) {
            localStorage.setItem('ia_limite_data', hoje);
            localStorage.setItem('ia_limite_uso', '0');
            this._usosHoje = 0;
        }
    }

    getUsoHoje() {
        this._resetarLimite();
        this._usosHoje = parseInt(localStorage.getItem('ia_limite_uso')) || 0;
        return this._usosHoje;
    }

    _incrementarUso() {
        this._resetarLimite();
        this._usosHoje++;
        localStorage.setItem('ia_limite_uso', String(this._usosHoje));
    }

    temLimiteDisponivel() {
        return this.getUsoHoje() < this.LIMITE_DIARIO;
    }

    getLimiteRestante() {
        return Math.max(0, this.LIMITE_DIARIO - this.getUsoHoje());
    }

    getAccessToken() {
        try {
            if (window.supabaseClient?.auth?.currentSession) {
                return window.supabaseClient.auth.currentSession.access_token;
            }
        } catch (e) { /* silent */ }
        return this.SUPABASE_ANON_KEY;
    }

    async sendMessage({ prompt, context, imageBase64 = null }) {
        if (!this.temLimiteDisponivel()) {
            throw new Error('Limite diário atingido.');
        }

        const cacheKey = `${prompt.substring(0, 50)}|${context.substring(0, 100)}|img:${!!imageBase64}`;
        if (this._cache.has(cacheKey)) {
            return this._cache.get(cacheKey);
        }

        const modelsToTry = imageBase64
            ? ["qwen/qwen-2-vl-72b-instruct", "openai/gpt-oss-120b"]
            : ["openai/gpt-oss-120b", "llama-3.3-70b-versatile"];

        const token = this.getAccessToken();

        for (const model of modelsToTry) {
            try {
                const body = {
                    prompt: imageBase64 ? [
                        { type: 'text', text: `${context}\n\nUtilizador: ${prompt}` },
                        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                    ] : prompt,
                    context: imageBase64 ? '' : context,
                    models: [model]
                };

                const response = await fetch(`${this.SUPABASE_URL}/functions/v1/zero-ia`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(body)
                });

                if (response.status === 429) {
                    this._usosHoje = this.LIMITE_DIARIO;
                    localStorage.setItem('ia_limite_uso', String(this._usosHoje));
                    throw new Error('Limite diário atingido.');
                }

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices?.[0]?.message?.content;
                    if (content) {
                        this._incrementarUso();
                        const cleaned = this._extractPortugueseResponse(content);
                        this._cache.set(cacheKey, cleaned);
                        if (this._cache.size > this._cacheMaxSize) {
                            this._cache.delete(this._cache.keys().next().value);
                        }
                        return cleaned;
                    }
                }
            } catch (e) {
                console.warn('[IA] Erro com modelo', model, e.message);
            }
        }

        return this._getFallback(prompt);
    }

    _extractPortugueseResponse(text) {
        if (!text) return text;
        return text
            .replace(/<thought>[\s\S]*?<\/thought>/gi, '')
            .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
            .trim();
    }

    _getFallback(prompt) {
        return 'Desculpe, não consegui processar. Poderia reformular?';
    }

    getStatus() {
        return {
            usado: this.getUsoHoje(),
            limite: this.LIMITE_DIARIO,
            restante: this.getLimiteRestante()
        };
    }
}

window.IAService = new IAService();
console.log('[IA] ✅ Serviço de IA carregado');