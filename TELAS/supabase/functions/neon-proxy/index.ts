// supabase/functions/neon-proxy/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";

// Variáveis de ambiente (configuradas no Passo 4)
const NEON_HOST = Deno.env.get("NEON_HOST") || "ep-square-queen-b5ez10e6-pooler.c-7.us-east-2.aws.neon.tech";
const NEON_DB = Deno.env.get("NEON_DB") || "neondb";
const NEON_USER = Deno.env.get("NEON_USER") || "neondb_owner";
const NEON_PASS = Deno.env.get("NEON_PASS") || "npg_HB43bVSfCiwa";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Lidar com pedidos CORS (Preflight)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Criar um pool de conexão (1 conexão por pedido)
  const client = new Pool({
    hostname: NEON_HOST,
    database: NEON_DB,
    user: NEON_USER,
    password: NEON_PASS,
    port: 5432,
    tls: true,
  }, 1);

  try {
    const { action, userId, conversaId, titulo, role, conteudo } = await req.json();
    const conn = await client.connect();
    let data = null;

    // ============================================
    // AÇÕES DO HISTÓRICO DA IA
    // ============================================

    if (action === "criar_conversa") {
      const res = await conn.queryObject(
        `INSERT INTO ia_conversas (user_id, titulo) VALUES ($1, $2) RETURNING id`,
        [userId, titulo]
      );
      data = res.rows[0]?.id;
    } 
    else if (action === "guardar_mensagem") {
      await conn.queryObject(
        `INSERT INTO ia_mensagens (conversa_id, role, conteudo) VALUES ($1, $2, $3)`,
        [conversaId, role, conteudo]
      );
      await conn.queryObject(
        `UPDATE ia_conversas SET updated_at = NOW() WHERE id = $1`,
        [conversaId]
      );
    } 
    else if (action === "carregar_historico") {
      let id = conversaId;
      
      // Se não foi passado um ID, procura a conversa mais recente do utilizador
      if (!id) {
        const convs = await conn.queryObject(
          `SELECT id FROM ia_conversas WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1`,
          [userId]
        );
        if (convs.rows.length > 0) id = convs.rows[0].id;
      }
      
      if (id) {
        const msgs = await conn.queryObject(
          `SELECT role, conteudo, created_at FROM ia_mensagens WHERE conversa_id = $1 ORDER BY created_at ASC`,
          [id]
        );
        data = msgs.rows.map((r: any) => ({ 
            role: r.role, 
            content: r.conteudo, 
            timestamp: r.created_at 
        }));
      }
    } 
    else if (action === "apagar_historico") {
      await conn.queryObject(`DELETE FROM ia_conversas WHERE user_id = $1`, [userId]);
    }

    // Libertar a conexão
    await conn.release();

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (e) {
    // Em caso de erro, fecha o pool e devolve o erro
    await client.end();
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});