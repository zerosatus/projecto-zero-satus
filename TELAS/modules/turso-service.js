// turso-service.js - Serviço Turso (HTTP Puro)
class TursoService {
    static DB_URL = 'https://zerosatusdb-zerosatus.aws-eu-central-1.turso.io';
    static AUTH_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTMxODE0MTQsImlkIjoiMDFhMTdmNDUtOGEwMS03NTk4LTg4Y2MtNWQwNjg5ZmQxY2ZkIiwia2lkIjoiN2xJODlYb0xiS1AzVmhqOV9nSzVSZ2ZCX0hZUTgwZ01HMnBheXF6LVZYUSIsInJpZCI6ImRjMGNlYzc0LWEyZWYtNDU4Yy04MmU4LTk4MmY4NTQ3ZTQwZCJ9.p1iXQQTKfYAyNMgOz0EaC_ZqyHrkzFZq9hYwHa7hAX_eAtfXnwLNPP-9iWCeu4LbJELYVyh5L14FrbO908umAQ';
    static _initialized = false;

    static async _pipeline(requests) {
        try {
            const response = await fetch(`${this.DB_URL}/v2/pipeline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ requests })
            }).then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status}`);
                return r.json();
            });

            const results = response.results || [];
            for (const r of results) {
                if (r.type === 'error') throw new Error(`Turso: ${r.error}`);
            }
            return response;
        } catch (e) {
            console.error('[Turso] ❌ Erro:', e);
            throw e;
        }
    }

    static _exec(sql, args = []) {
        return {
            type: 'execute',
            stmt: { sql, args: args.map(this._toTursoValue.bind(this)) }
        };
    }

    static _toTursoValue(v) {
        if (v === null || v === undefined) return { type: 'null' };
        if (typeof v === 'number') return { type: Number.isInteger(v) ? 'integer' : 'float', value: v };
        if (typeof v === 'boolean') return { type: 'integer', value: v ? '1' : '0' };
        return { type: 'text', value: String(v) };
    }

    static async initialize() {
        if (this._initialized) return;
        try {
            await this._pipeline([
                this._exec(`CREATE TABLE IF NOT EXISTS documentos_ia (
                    id TEXT PRIMARY KEY, user_id TEXT, title TEXT, category TEXT,
                    content TEXT, format TEXT, created_at TEXT
                )`),
                { type: 'close' }
            ]);
            this._initialized = true;
            console.log('✅ [Turso] Inicializado');
        } catch (e) {
            console.error('❌ [Turso] Erro ao inicializar:', e);
        }
    }

    static async saveDocument({ id, userId, title, category, content, format }) {
        if (!this._initialized) await this.initialize();
        try {
            await this._pipeline([
                this._exec(
                    `INSERT OR REPLACE INTO documentos_ia (id, user_id, title, category, content, format, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [id, userId, title, category, content, format, new Date().toISOString()]
                ),
                { type: 'close' }
            ]);
            console.log(`✅ [Turso] Documento guardado: ${title}`);
            return true;
        } catch (e) {
            console.error('❌ [Turso] saveDocument falhou:', e);
            throw e;
        }
    }

    static async getDocument(userId, titleSearch) {
        if (!this._initialized) await this.initialize();
        try {
            const result = await this._pipeline([
                this._exec(
                    `SELECT title, category, content, format FROM documentos_ia
                     WHERE user_id = ? AND title LIKE ? LIMIT 1`,
                    [userId, `%${titleSearch}%`]
                ),
                { type: 'close' }
            ]);

            const rows = result.results?.[0]?.response?.result?.rows || [];
            if (rows.length === 0) return null;

            const cols = result.results[0].response.result.cols;
            const row = rows[0];
            const map = {};
            cols.forEach((col, i) => { map[col.name] = row[i]?.value; });
            return map;
        } catch (e) {
            console.error('❌ [Turso] getDocument falhou:', e);
            return null;
        }
    }

    static async deleteDocument(id) {
        if (!this._initialized) await this.initialize();
        try {
            await this._pipeline([
                this._exec(`DELETE FROM documentos_ia WHERE id = ?`, [id]),
                { type: 'close' }
            ]);
            return true;
        } catch (e) {
            return false;
        }
    }
}

window.TursoService = TursoService;
console.log('[Turso] ✅ Serviço carregado');