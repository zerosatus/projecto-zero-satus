// neon-service.js - Serviço de Histórico da IA (via Neon Proxy)
class NeonService {
    static SUPABASE_URL = "https://yqxtfnnjjpoitbmtcxjd.supabase.co";
    static SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxeHRmbm5qanBvaXRibXRjeGpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTQ2MTMsImV4cCI6MjA5NDMzMDYxM30.GY3aTXq2leTgJ1WSvDk-Mqn5-wYuLABsLI3_UaBiHN0";

    static async _call(action, payload = {}) {
        try {
            const token = window.supabaseClient?.auth?.currentSession?.access_token || this.SUPABASE_ANON_KEY;
            const response = await fetch(`${this.SUPABASE_URL}/functions/v1/neon-proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action, ...payload })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const json = await response.json();
            return json.data;
        } catch (e) {
            console.error(`[Neon] ❌ Erro em ${action}:`, e);
            return null;
        }
    }

    static async criarConversa(userId, titulo) {
        return await this._call('criar_conversa', { userId, titulo });
    }

    static async guardarMensagem(conversaId, role, conteudo) {
        await this._call('guardar_mensagem', { conversaId, role, conteudo });
    }

    static async carregarHistorico(userId, conversaId = null) {
        const data = await this._call('carregar_historico', { userId, conversaId });
        return data || [];
    }

    static async apagarHistorico(userId) {
        await this._call('apagar_historico', { userId });
    }
}

window.NeonService = NeonService;
console.log('[Neon] ✅ Serviço carregado (via Proxy)');