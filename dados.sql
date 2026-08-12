-- ============================================
-- SCRIPT COMPLETO - PAINEL ADMIN ZERO SATUS
-- COM HISTÓRICO DE IA E SINCRONIZAÇÃO PC/MOBILE
-- VERSÃO CORRIGIDA - SEM ERROS DE SINTAXE
-- ============================================

-- ============================================
-- 1. EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 2. FUNÇÃO PARA ATUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. DROP DAS FUNÇÕES EXISTENTES
-- ============================================
DROP FUNCTION IF EXISTS get_admin_stats() CASCADE;
DROP FUNCTION IF EXISTS get_stats_by_role() CASCADE;
DROP FUNCTION IF EXISTS get_recent_activities(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS verificar_role(TEXT) CASCADE;
DROP FUNCTION IF EXISTS diagnosticar_usuario(TEXT) CASCADE;
DROP FUNCTION IF EXISTS tornar_admin(TEXT) CASCADE;
DROP FUNCTION IF EXISTS tornar_user(TEXT) CASCADE;
DROP FUNCTION IF EXISTS is_admin() CASCADE;
DROP FUNCTION IF EXISTS banir_usuario(TEXT) CASCADE;
DROP FUNCTION IF EXISTS deletar_usuario(TEXT) CASCADE;
DROP FUNCTION IF EXISTS desbanir_usuario(TEXT) CASCADE;
DROP FUNCTION IF EXISTS enviar_notificacao(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS enviar_notificacao_para_todos(TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS enviar_notificacao_para_role(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS enviar_notificacao_para_usuario(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID, JSONB, TIMESTAMPTZ) CASCADE;
DROP FUNCTION IF EXISTS get_notificacoes_admin(INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS marcar_notificacao_lida(TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS verificar_permissao(TEXT, TEXT, UUID) CASCADE;
DROP FUNCTION IF EXISTS listar_regras(TEXT, TEXT, TEXT, BOOLEAN) CASCADE;
DROP FUNCTION IF EXISTS testar_permissao(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_all_users() CASCADE;
DROP FUNCTION IF EXISTS enviar_email_notificacao(TEXT, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_ia_history(UUID) CASCADE;
DROP FUNCTION IF EXISTS save_ia_history(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS delete_ia_history(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_ia_conversation(UUID, TEXT) CASCADE;

-- ============================================
-- 4. DROP E RECRIAR TABELAS
-- ============================================

DO $$ 
BEGIN
    EXECUTE 'ALTER TABLE IF EXISTS public.system_rules DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.tasks DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.notes DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.calendar_events DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.weekly_schedule DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.time_slots DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.notifications DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.user_settings DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.disciplinas DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.admin_notifications DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.ia_history DISABLE ROW LEVEL SECURITY';
    EXECUTE 'ALTER TABLE IF EXISTS public.ia_conversations DISABLE ROW LEVEL SECURITY';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Erro ao desabilitar RLS: %', SQLERRM;
END $$;

DROP TABLE IF EXISTS public.system_rules CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.weekly_schedule CASCADE;
DROP TABLE IF EXISTS public.time_slots CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.disciplinas CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.admin_notifications CASCADE;
DROP TABLE IF EXISTS public.ia_history CASCADE;
DROP TABLE IF EXISTS public.ia_conversations CASCADE;

-- ============================================
-- 5. TABELA: PROFILES
-- ============================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY,
    email TEXT,
    nome TEXT,
    avatar_url TEXT,
    telefone TEXT,
    nascimento DATE,
    genero TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- ============================================
-- 6. TABELA: TASKS
-- ============================================
CREATE TABLE public.tasks (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    slug TEXT,
    content TEXT,
    description TEXT,
    subject TEXT,
    priority TEXT DEFAULT 'media',
    date TEXT,
    completed BOOLEAN DEFAULT FALSE,
    favorita BOOLEAN DEFAULT FALSE,
    subtasks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);

-- ============================================
-- 7. TABELA: NOTES
-- ============================================
CREATE TABLE public.notes (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT DEFAULT 'Sem título',
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- ============================================
-- 8. TABELA: CALENDAR_EVENTS
-- ============================================
CREATE TABLE public.calendar_events (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    date DATE,
    start_time TEXT,
    end_time TEXT,
    type TEXT DEFAULT 'aula',
    color TEXT DEFAULT '#8b5cf6',
    repeat_type TEXT DEFAULT 'nao',
    reminder BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(date);

-- ============================================
-- 9. TABELA: WEEKLY_SCHEDULE
-- ============================================
CREATE TABLE public.weekly_schedule (
    user_id UUID PRIMARY KEY,
    schedule JSONB NOT NULL DEFAULT '{"Seg":[],"Ter":[],"Qua":[],"Qui":[],"Sex":[]}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. TABELA: TIME_SLOTS
-- ============================================
CREATE TABLE public.time_slots (
    user_id UUID PRIMARY KEY,
    slots JSONB NOT NULL DEFAULT '["08:00","09:30","11:00","14:00","15:30"]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. TABELA: NOTIFICATIONS
-- ============================================
CREATE TABLE public.notifications (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT DEFAULT 'Notificação',
    message TEXT,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- ============================================
-- 12. TABELA: ADMIN_NOTIFICATIONS
-- ============================================
CREATE TABLE public.admin_notifications (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT NOT NULL DEFAULT 'broadcast',
    icone TEXT DEFAULT 'bell',
    destino TEXT NOT NULL,
    total_destinatarios INTEGER DEFAULT 0,
    lidas INTEGER DEFAULT 0,
    canais JSONB DEFAULT '{"inapp":true,"email":false,"push":false}',
    autor TEXT,
    autor_id UUID,
    status TEXT DEFAULT 'enviada',
    enviada_em TIMESTAMPTZ DEFAULT NOW(),
    agendada_para TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_tipo ON public.admin_notifications(tipo);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON public.admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_enviada_em ON public.admin_notifications(enviada_em);

-- ============================================
-- 13. TABELA: USER_SETTINGS
-- ============================================
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY,
    theme TEXT DEFAULT 'dark',
    accent_color TEXT DEFAULT '#8b5cf6',
    font_size INTEGER DEFAULT 14,
    notifications_settings JSONB DEFAULT '{"push":true,"email":false,"aulas":true,"tarefas":true}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. TABELA: DISCIPLINAS
-- ============================================
CREATE TABLE public.disciplinas (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    nome TEXT NOT NULL,
    cor TEXT DEFAULT '#9333ea',
    icone TEXT DEFAULT 'fa-book',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disciplinas_user_id ON public.disciplinas(user_id);

-- ============================================
-- 15. TABELA: SYSTEM_RULES
-- ============================================
CREATE TABLE public.system_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    categoria TEXT NOT NULL DEFAULT 'geral',
    tipo TEXT NOT NULL DEFAULT 'permissao',
    tabela TEXT,
    operacao TEXT,
    condicao TEXT,
    prioridade INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_rules_categoria ON public.system_rules(categoria);
CREATE INDEX IF NOT EXISTS idx_system_rules_tipo ON public.system_rules(tipo);
CREATE INDEX IF NOT EXISTS idx_system_rules_tabela ON public.system_rules(tabela);
CREATE INDEX IF NOT EXISTS idx_system_rules_ativo ON public.system_rules(ativo);
CREATE INDEX IF NOT EXISTS idx_system_rules_prioridade ON public.system_rules(prioridade);

-- ============================================
-- 16. TABELA: IA_HISTORY (Histórico de conversas)
-- ============================================
CREATE TABLE public.ia_history (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL DEFAULT 'Nova conversa',
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ia_history_user_id ON public.ia_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ia_history_updated_at ON public.ia_history(updated_at);

-- ============================================
-- 17. TABELA: IA_CONVERSATIONS (Mensagens individuais) - CORRIGIDA
-- ============================================
CREATE TABLE public.ia_conversations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    history_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    msg_timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ia_conversations_user_id ON public.ia_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ia_conversations_history_id ON public.ia_conversations(history_id);
CREATE INDEX IF NOT EXISTS idx_ia_conversations_msg_timestamp ON public.ia_conversations(msg_timestamp);

-- ============================================
-- 18. TRIGGERS
-- ============================================
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_schedule_updated_at BEFORE UPDATE ON public.weekly_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON public.time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disciplinas_updated_at BEFORE UPDATE ON public.disciplinas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_notifications_updated_at BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_rules_updated_at BEFORE UPDATE ON public.system_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ia_history_updated_at BEFORE UPDATE ON public.ia_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 19. FUNÇÃO: handle_new_user
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    v_is_admin BOOLEAN;
BEGIN
    v_is_admin := (NEW.email = 'projectozerosatus@gmail.com');
    
    INSERT INTO public.profiles (id, email, nome, avatar_url, role)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        CASE WHEN v_is_admin THEN 'admin' ELSE 'user' END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 20. FUNÇÃO: is_admin
-- ============================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_user_id UUID;
    v_user_email TEXT;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    SELECT email INTO v_user_email FROM auth.users WHERE id = v_user_id;
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
    
    IF v_user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN (v_user_role = 'admin' AND v_user_email = 'projectozerosatus@gmail.com');
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 21. FUNÇÕES DE USUÁRIO
-- ============================================

-- 21.1 BANIR USUÁRIO
CREATE OR REPLACE FUNCTION banir_usuario(email_usuario TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_usuario) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || email_usuario;
    END IF;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = email_usuario;
    
    IF email_usuario = 'projectozerosatus@gmail.com' THEN
        RETURN 'ERRO: Nao e possivel banir o administrador principal!';
    END IF;
    
    UPDATE public.profiles SET role = 'banned', updated_at = NOW() WHERE id = v_user_id;
    
    INSERT INTO public.notifications (id, user_id, title, message, type)
    VALUES (
        gen_random_uuid()::TEXT,
        v_user_id,
        'Conta Banida',
        'Sua conta foi banida da plataforma. Entre em contato com o suporte.',
        'warning'
    );
    
    RETURN 'SUCESSO: Usuario ' || email_usuario || ' foi BANIDO!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21.2 DESBANIR USUÁRIO
CREATE OR REPLACE FUNCTION desbanir_usuario(email_usuario TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_usuario) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || email_usuario;
    END IF;
    
    UPDATE public.profiles SET role = 'user', updated_at = NOW() WHERE email = email_usuario;
    
    RETURN 'SUCESSO: Usuario ' || email_usuario || ' foi DESBANIDO!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21.3 DELETAR USUÁRIO
CREATE OR REPLACE FUNCTION deletar_usuario(email_usuario TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_usuario) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || email_usuario;
    END IF;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = email_usuario;
    
    IF email_usuario = 'projectozerosatus@gmail.com' THEN
        RETURN 'ERRO: Nao e possivel deletar o administrador principal!';
    END IF;
    
    DELETE FROM public.tasks WHERE user_id = v_user_id;
    DELETE FROM public.notes WHERE user_id = v_user_id;
    DELETE FROM public.calendar_events WHERE user_id = v_user_id;
    DELETE FROM public.weekly_schedule WHERE user_id = v_user_id;
    DELETE FROM public.time_slots WHERE user_id = v_user_id;
    DELETE FROM public.notifications WHERE user_id = v_user_id;
    DELETE FROM public.user_settings WHERE user_id = v_user_id;
    DELETE FROM public.disciplinas WHERE user_id = v_user_id;
    DELETE FROM public.ia_history WHERE user_id = v_user_id;
    DELETE FROM public.ia_conversations WHERE user_id = v_user_id;
    DELETE FROM public.profiles WHERE id = v_user_id;
    
    BEGIN
        DELETE FROM auth.users WHERE id = v_user_id;
        RETURN 'SUCESSO: Usuario ' || email_usuario || ' e todos os dados foram DELETADOS!';
    EXCEPTION WHEN OTHERS THEN
        RETURN 'AVISO: Dados do usuario deletados, mas a conta no auth.users precisa ser removida manualmente.';
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21.4 TORNAR ADMIN
CREATE OR REPLACE FUNCTION tornar_admin(email_usuario TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_user_exists BOOLEAN;
BEGIN
    IF email_usuario != 'projectozerosatus@gmail.com' THEN
        RETURN 'ERRO: Apenas o email projectozerosatus@gmail.com pode ser administrador!';
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_usuario) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || email_usuario;
    END IF;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = email_usuario;
    
    INSERT INTO public.profiles (id, email, nome, role, created_at, updated_at)
    SELECT 
        id, 
        email, 
        COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)) as nome,
        'admin' as role,
        NOW() as created_at,
        NOW() as updated_at
    FROM auth.users 
    WHERE email = email_usuario
    ON CONFLICT (id) DO UPDATE SET 
        role = 'admin',
        updated_at = NOW();
    
    RETURN 'SUCESSO: Usuario ' || email_usuario || ' agora e ADMIN!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21.5 TORNAR USER
CREATE OR REPLACE FUNCTION tornar_user(email_usuario TEXT)
RETURNS TEXT AS $$
DECLARE
    v_user_exists BOOLEAN;
BEGIN
    IF email_usuario = 'projectozerosatus@gmail.com' THEN
        RETURN 'ERRO: Nao e possivel remover o administrador principal!';
    END IF;
    
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = email_usuario) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || email_usuario;
    END IF;
    
    UPDATE public.profiles SET role = 'user', updated_at = NOW() WHERE email = email_usuario;
    
    RETURN 'SUCESSO: Usuario ' || email_usuario || ' agora e USER!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 21.6 GET_ALL_USERS
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    nome TEXT,
    avatar_url TEXT,
    role TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    IF NOT is_admin() THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.nome,
        p.avatar_url,
        p.role,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_users() TO authenticated;
GRANT EXECUTE ON FUNCTION banir_usuario(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION desbanir_usuario(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION deletar_usuario(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION tornar_admin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION tornar_user(TEXT) TO authenticated;

-- ============================================
-- 22. FUNÇÕES PARA IA HISTORY
-- ============================================

-- 22.1 GET IA HISTORY
CREATE OR REPLACE FUNCTION get_ia_history(p_user_id UUID)
RETURNS TABLE(
    id TEXT,
    title TEXT,
    messages JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    message_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.title,
        h.messages,
        h.created_at,
        h.updated_at,
        (SELECT COUNT(*) FROM public.ia_conversations c WHERE c.history_id = h.id) as message_count
    FROM public.ia_history h
    WHERE h.user_id = p_user_id
    ORDER BY h.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22.2 SAVE IA HISTORY (CORRIGIDO)
CREATE OR REPLACE FUNCTION save_ia_history(
    p_user_id UUID,
    p_history JSONB
)
RETURNS TEXT AS $$
DECLARE
    v_history_id TEXT;
    v_title TEXT;
    v_messages JSONB;
    v_created_at TIMESTAMPTZ;
    v_updated_at TIMESTAMPTZ;
    v_msg RECORD;
BEGIN
    v_history_id := p_history->>'id';
    v_title := COALESCE(p_history->>'title', 'Nova conversa');
    v_messages := p_history->'messages';
    v_created_at := COALESCE((p_history->>'created_at')::TIMESTAMPTZ, NOW());
    v_updated_at := NOW();
    
    -- Inserir ou atualizar o histórico
    INSERT INTO public.ia_history (id, user_id, title, messages, created_at, updated_at)
    VALUES (v_history_id, p_user_id, v_title, v_messages, v_created_at, v_updated_at)
    ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        messages = EXCLUDED.messages,
        updated_at = EXCLUDED.updated_at;
    
    -- Salvar mensagens individuais
    DELETE FROM public.ia_conversations WHERE history_id = v_history_id;
    
    FOR v_msg IN SELECT * FROM jsonb_to_recordset(v_messages) AS x(role TEXT, content TEXT, msg_timestamp TIMESTAMPTZ)
    LOOP
        INSERT INTO public.ia_conversations (id, user_id, history_id, role, content, msg_timestamp)
        VALUES (
            gen_random_uuid()::TEXT,
            p_user_id,
            v_history_id,
            v_msg.role,
            v_msg.content,
            COALESCE(v_msg.msg_timestamp, NOW())
        );
    END LOOP;
    
    RETURN 'SUCESSO: Histórico de IA salvo!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22.3 DELETE IA HISTORY
CREATE OR REPLACE FUNCTION delete_ia_history(
    p_user_id UUID,
    p_history_id TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.ia_history 
        WHERE id = p_history_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        RETURN 'ERRO: Histórico não encontrado!';
    END IF;
    
    DELETE FROM public.ia_conversations WHERE history_id = p_history_id;
    DELETE FROM public.ia_history WHERE id = p_history_id AND user_id = p_user_id;
    
    RETURN 'SUCESSO: Histórico de IA deletado!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 22.4 GET IA CONVERSATION (CORRIGIDO)
CREATE OR REPLACE FUNCTION get_ia_conversation(
    p_user_id UUID,
    p_history_id TEXT
)
RETURNS TABLE(
    id TEXT,
    role TEXT,
    content TEXT,
    msg_timestamp TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.role,
        c.content,
        c.msg_timestamp
    FROM public.ia_conversations c
    WHERE c.user_id = p_user_id AND c.history_id = p_history_id
    ORDER BY c.msg_timestamp ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- GRANT PERMISSIONS FOR IA FUNCTIONS
GRANT EXECUTE ON FUNCTION get_ia_history(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION save_ia_history(UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_ia_history(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_ia_conversation(UUID, TEXT) TO authenticated;

-- ============================================
-- 23. FUNÇÃO: get_admin_stats
-- ============================================
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE(
    total_usuarios BIGINT,
    total_admins BIGINT,
    total_banidos BIGINT,
    total_posts BIGINT,
    total_comentarios BIGINT,
    total_rascunhos BIGINT,
    novos_usuarios_7dias BIGINT,
    ativos_hoje BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.profiles) as total_usuarios,
        (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as total_admins,
        (SELECT COUNT(*) FROM public.profiles WHERE role = 'banned') as total_banidos,
        (SELECT COUNT(*) FROM public.tasks) as total_posts,
        (SELECT COUNT(*) FROM public.notifications WHERE read = false) as total_comentarios,
        (SELECT COUNT(*) FROM public.tasks WHERE completed = false) as total_rascunhos,
        (SELECT COUNT(*) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days') as novos_usuarios_7dias,
        (SELECT COUNT(*) FROM public.profiles WHERE updated_at >= NOW() - INTERVAL '1 day') as ativos_hoje;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 24. FUNÇÃO: get_recent_activities
-- ============================================
CREATE OR REPLACE FUNCTION get_recent_activities(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    tipo TEXT,
    titulo TEXT,
    descricao TEXT,
    usuario TEXT,
    data TIMESTAMPTZ,
    icone TEXT,
    cor TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'user' as tipo,
        'Novo usuario' as titulo,
        p.nome || ' se cadastrou' as descricao,
        p.nome as usuario,
        p.created_at as data,
        'fa-user-plus' as icone,
        '#9333ea' as cor
    FROM public.profiles p
    WHERE p.created_at >= NOW() - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
        'post' as tipo,
        'Novo post' as titulo,
        t.title || ' foi criado' as descricao,
        p.nome as usuario,
        t.created_at as data,
        'fa-newspaper' as icone,
        '#10b981' as cor
    FROM public.tasks t
    LEFT JOIN public.profiles p ON t.user_id = p.id
    WHERE t.created_at >= NOW() - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
        'comment' as tipo,
        'Novo comentario' as titulo,
        COALESCE(n.title, 'Anonimo') || ' comentou' as descricao,
        p.nome as usuario,
        n.created_at as data,
        'fa-comment' as icone,
        '#f59e0b' as cor
    FROM public.notifications n
    LEFT JOIN public.profiles p ON n.user_id = p.id
    WHERE n.created_at >= NOW() - INTERVAL '30 days'
    
    UNION ALL
    
    SELECT 
        'alert' as tipo,
        'Usuario banido' as titulo,
        p.nome || ' foi banido' as descricao,
        'Sistema' as usuario,
        p.updated_at as data,
        'fa-ban' as icone,
        '#ef4444' as cor
    FROM public.profiles p
    WHERE p.role = 'banned'
    AND p.updated_at >= NOW() - INTERVAL '30 days'
    
    ORDER BY data DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 25. FUNÇÕES DE NOTIFICAÇÃO
-- ============================================

-- 25.1 enviar_notificacao_para_todos
CREATE OR REPLACE FUNCTION enviar_notificacao_para_todos(
    p_titulo TEXT,
    p_mensagem TEXT,
    p_tipo TEXT DEFAULT 'broadcast',
    p_icone TEXT DEFAULT 'bell',
    p_autor TEXT DEFAULT 'Sistema',
    p_autor_id UUID DEFAULT NULL,
    p_canais JSONB DEFAULT '{"inapp":true,"email":false,"push":false}',
    p_agendar TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    notif_id TEXT;
    total_count INTEGER := 0;
    inserted_count INTEGER := 0;
BEGIN
    notif_id := gen_random_uuid()::TEXT;
    SELECT COUNT(*) INTO total_count FROM public.profiles;
    
    INSERT INTO public.admin_notifications (
        id, titulo, mensagem, tipo, icone, destino,
        total_destinatarios, lidas, canais, autor, autor_id,
        status, enviada_em, agendada_para
    ) VALUES (
        notif_id,
        p_titulo,
        p_mensagem,
        p_tipo,
        p_icone,
        'Todos os usuarios',
        total_count,
        0,
        p_canais,
        p_autor,
        p_autor_id,
        CASE WHEN p_agendar IS NOT NULL THEN 'agendada' ELSE 'enviada' END,
        CASE WHEN p_agendar IS NULL THEN NOW() ELSE NOW() END,
        p_agendar
    );
    
    IF (p_agendar IS NULL OR p_agendar <= NOW()) THEN
        FOR user_record IN SELECT id FROM public.profiles LOOP
            INSERT INTO public.notifications (id, user_id, title, message, type)
            VALUES (
                gen_random_uuid()::TEXT,
                user_record.id,
                p_titulo,
                p_mensagem,
                p_tipo
            );
            inserted_count := inserted_count + 1;
        END LOOP;
        
        UPDATE public.admin_notifications 
        SET total_destinatarios = inserted_count
        WHERE id = notif_id;
        
        RETURN 'Notificacao enviada para ' || inserted_count || ' usuarios!';
    ELSE
        RETURN 'Notificacao agendada para ' || p_agendar;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25.2 enviar_notificacao_para_role
CREATE OR REPLACE FUNCTION enviar_notificacao_para_role(
    p_role TEXT,
    p_titulo TEXT,
    p_mensagem TEXT,
    p_tipo TEXT DEFAULT 'segmented',
    p_icone TEXT DEFAULT 'bell',
    p_autor TEXT DEFAULT 'Sistema',
    p_autor_id UUID DEFAULT NULL,
    p_canais JSONB DEFAULT '{"inapp":true,"email":false,"push":false}',
    p_agendar TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    user_record RECORD;
    notif_id TEXT;
    total_count INTEGER := 0;
    inserted_count INTEGER := 0;
    role_label TEXT;
BEGIN
    notif_id := gen_random_uuid()::TEXT;
    
    role_label := CASE 
        WHEN p_role = 'admin' THEN 'Administradores'
        WHEN p_role = 'banned' THEN 'Usuarios Banidos'
        ELSE 'Usuarios'
    END;
    
    SELECT COUNT(*) INTO total_count FROM public.profiles WHERE role = p_role;
    
    IF total_count = 0 THEN
        RETURN 'Nenhum usuario com a role: ' || p_role;
    END IF;
    
    INSERT INTO public.admin_notifications (
        id, titulo, mensagem, tipo, icone, destino,
        total_destinatarios, lidas, canais, autor, autor_id,
        status, enviada_em, agendada_para
    ) VALUES (
        notif_id,
        p_titulo,
        p_mensagem,
        p_tipo,
        p_icone,
        'Usuarios: ' || role_label,
        total_count,
        0,
        p_canais,
        p_autor,
        p_autor_id,
        CASE WHEN p_agendar IS NOT NULL THEN 'agendada' ELSE 'enviada' END,
        CASE WHEN p_agendar IS NULL THEN NOW() ELSE NOW() END,
        p_agendar
    );
    
    IF (p_agendar IS NULL OR p_agendar <= NOW()) THEN
        FOR user_record IN SELECT id FROM public.profiles WHERE role = p_role LOOP
            INSERT INTO public.notifications (id, user_id, title, message, type)
            VALUES (
                gen_random_uuid()::TEXT,
                user_record.id,
                p_titulo,
                p_mensagem,
                p_tipo
            );
            inserted_count := inserted_count + 1;
        END LOOP;
        
        UPDATE public.admin_notifications 
        SET total_destinatarios = inserted_count
        WHERE id = notif_id;
        
        RETURN 'Notificacao enviada para ' || inserted_count || ' ' || role_label || '!';
    ELSE
        RETURN 'Notificacao agendada para ' || p_agendar;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25.3 enviar_notificacao_para_usuario
CREATE OR REPLACE FUNCTION enviar_notificacao_para_usuario(
    p_email TEXT,
    p_titulo TEXT,
    p_mensagem TEXT,
    p_tipo TEXT DEFAULT 'individual',
    p_icone TEXT DEFAULT 'bell',
    p_autor TEXT DEFAULT 'Sistema',
    p_autor_id UUID DEFAULT NULL,
    p_canais JSONB DEFAULT '{"inapp":true,"email":false,"push":false}',
    p_agendar TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_user_exists BOOLEAN;
    notif_id TEXT;
BEGIN
    SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) INTO v_user_exists;
    IF NOT v_user_exists THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || p_email;
    END IF;
    
    SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;
    
    notif_id := gen_random_uuid()::TEXT;
    
    INSERT INTO public.admin_notifications (
        id, titulo, mensagem, tipo, icone, destino,
        total_destinatarios, lidas, canais, autor, autor_id,
        status, enviada_em, agendada_para
    ) VALUES (
        notif_id,
        p_titulo,
        p_mensagem,
        p_tipo,
        p_icone,
        'Usuario: ' || p_email,
        1,
        0,
        p_canais,
        p_autor,
        p_autor_id,
        CASE WHEN p_agendar IS NOT NULL THEN 'agendada' ELSE 'enviada' END,
        CASE WHEN p_agendar IS NULL THEN NOW() ELSE NOW() END,
        p_agendar
    );
    
    IF (p_agendar IS NULL OR p_agendar <= NOW()) THEN
        INSERT INTO public.notifications (id, user_id, title, message, type)
        VALUES (
            gen_random_uuid()::TEXT,
            v_user_id,
            p_titulo,
            p_mensagem,
            p_tipo
        );
        
        UPDATE public.admin_notifications 
        SET total_destinatarios = 1
        WHERE id = notif_id;
        
        RETURN 'Notificacao enviada para ' || p_email || '!';
    ELSE
        RETURN 'Notificacao agendada para ' || p_agendar;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25.4 enviar_notificacao (principal)
CREATE OR REPLACE FUNCTION enviar_notificacao(
    p_destino TEXT,
    p_titulo TEXT,
    p_mensagem TEXT,
    p_tipo TEXT DEFAULT 'broadcast',
    p_icone TEXT DEFAULT 'bell',
    p_autor TEXT DEFAULT 'Sistema',
    p_autor_id UUID DEFAULT NULL,
    p_canais JSONB DEFAULT '{"inapp":true,"email":false,"push":false}',
    p_agendar TIMESTAMPTZ DEFAULT NULL
)
RETURNS TEXT AS $$
BEGIN
    IF (p_destino = 'todos' OR p_destino = 'all') THEN
        RETURN enviar_notificacao_para_todos(
            p_titulo => p_titulo,
            p_mensagem => p_mensagem,
            p_tipo => p_tipo,
            p_icone => p_icone,
            p_autor => p_autor,
            p_autor_id => p_autor_id,
            p_canais => p_canais,
            p_agendar => p_agendar
        );
    END IF;
    
    IF (p_destino IN ('admin', 'user', 'banned')) THEN
        RETURN enviar_notificacao_para_role(
            p_role => p_destino,
            p_titulo => p_titulo,
            p_mensagem => p_mensagem,
            p_tipo => p_tipo,
            p_icone => p_icone,
            p_autor => p_autor,
            p_autor_id => p_autor_id,
            p_canais => p_canais,
            p_agendar => p_agendar
        );
    END IF;
    
    IF (p_destino LIKE '%@%') THEN
        RETURN enviar_notificacao_para_usuario(
            p_email => p_destino,
            p_titulo => p_titulo,
            p_mensagem => p_mensagem,
            p_tipo => p_tipo,
            p_icone => p_icone,
            p_autor => p_autor,
            p_autor_id => p_autor_id,
            p_canais => p_canais,
            p_agendar => p_agendar
        );
    END IF;
    
    RETURN enviar_notificacao_para_usuario(
        p_email => p_destino,
        p_titulo => p_titulo,
        p_mensagem => p_mensagem,
        p_tipo => p_tipo,
        p_icone => p_icone,
        p_autor => p_autor,
        p_autor_id => p_autor_id,
        p_canais => p_canais,
        p_agendar => p_agendar
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25.5 get_notificacoes_admin
CREATE OR REPLACE FUNCTION get_notificacoes_admin(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id TEXT,
    titulo TEXT,
    mensagem TEXT,
    tipo TEXT,
    icone TEXT,
    destino TEXT,
    total_destinatarios INTEGER,
    lidas INTEGER,
    canais JSONB,
    autor TEXT,
    status TEXT,
    enviada_em TIMESTAMPTZ,
    agendada_para TIMESTAMPTZ,
    percentual_lidas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.titulo,
        n.mensagem,
        n.tipo,
        n.icone,
        n.destino,
        n.total_destinatarios,
        n.lidas,
        n.canais,
        n.autor,
        n.status,
        n.enviada_em,
        n.agendada_para,
        CASE 
            WHEN n.total_destinatarios > 0 THEN 
                ROUND((n.lidas::FLOAT / n.total_destinatarios::FLOAT) * 100)::INTEGER
            ELSE 0
        END as percentual_lidas
    FROM public.admin_notifications n
    ORDER BY n.enviada_em DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 25.6 marcar_notificacao_lida
CREATE OR REPLACE FUNCTION marcar_notificacao_lida(
    p_notificacao_id TEXT,
    p_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
    notif_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.notifications 
        WHERE id = p_notificacao_id AND user_id = p_user_id
    ) INTO notif_exists;
    
    IF NOT notif_exists THEN
        RETURN 'ERRO: Notificacao nao encontrada';
    END IF;
    
    UPDATE public.notifications 
    SET read = TRUE 
    WHERE id = p_notificacao_id AND user_id = p_user_id;
    
    UPDATE public.admin_notifications 
    SET lidas = (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE id = p_notificacao_id 
        AND read = TRUE
    )
    WHERE id = p_notificacao_id;
    
    RETURN 'SUCESSO: Notificacao marcada como lida!';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 26. FUNÇÕES DA TABELA DE REGRAS
-- ============================================

CREATE OR REPLACE FUNCTION verificar_permissao(
    p_tabela TEXT,
    p_operacao TEXT,
    p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
    permitido BOOLEAN,
    regra_id UUID,
    regra_nome TEXT,
    regra_descricao TEXT,
    motivo TEXT
) AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
BEGIN
    IF p_user_id IS NULL THEN
        v_user_id := auth.uid();
    ELSE
        v_user_id := p_user_id;
    END IF;
    
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Usuario nao autenticado'::TEXT;
        RETURN;
    END IF;
    
    SELECT role INTO v_user_role FROM public.profiles WHERE id = v_user_id;
    
    IF v_user_role IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Usuario nao encontrado'::TEXT;
        RETURN;
    END IF;
    
    IF v_user_role = 'admin' THEN
        RETURN QUERY SELECT TRUE, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Admin tem permissao total'::TEXT;
        RETURN;
    END IF;
    
    IF v_user_role = 'banned' THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Usuario banido'::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        TRUE as permitido,
        sr.id,
        sr.nome,
        sr.descricao,
        'Apenas proprios dados' as motivo
    FROM public.system_rules sr
    WHERE sr.tabela = p_tabela
    AND sr.operacao IN (p_operacao, 'ALL')
    AND sr.tipo = 'permissao'
    AND sr.ativo = TRUE
    AND sr.categoria = 'user'
    ORDER BY sr.prioridade DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT, 'Sem permissao'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION listar_regras(
    p_categoria TEXT DEFAULT NULL,
    p_tipo TEXT DEFAULT NULL,
    p_tabela TEXT DEFAULT NULL,
    p_apenas_ativas BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
    id UUID,
    nome TEXT,
    descricao TEXT,
    categoria TEXT,
    tipo TEXT,
    tabela TEXT,
    operacao TEXT,
    condicao TEXT,
    prioridade INTEGER,
    ativo BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sr.id,
        sr.nome,
        sr.descricao,
        sr.categoria,
        sr.tipo,
        sr.tabela,
        sr.operacao,
        sr.condicao,
        sr.prioridade,
        sr.ativo,
        sr.created_at,
        sr.updated_at
    FROM public.system_rules sr
    WHERE 
        (p_categoria IS NULL OR sr.categoria = p_categoria)
        AND (p_tipo IS NULL OR sr.tipo = p_tipo)
        AND (p_tabela IS NULL OR sr.tabela = p_tabela)
        AND (p_apenas_ativas = FALSE OR sr.ativo = TRUE)
    ORDER BY sr.prioridade DESC, sr.categoria, sr.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION testar_permissao(
    p_email TEXT,
    p_tabela TEXT,
    p_operacao TEXT
)
RETURNS TEXT AS $$
DECLARE
    v_user_id UUID;
    v_resultado BOOLEAN;
    v_motivo TEXT;
BEGIN
    SELECT id INTO v_user_id FROM public.profiles WHERE email = p_email;
    
    IF v_user_id IS NULL THEN
        RETURN 'ERRO: Usuario nao encontrado: ' || p_email;
    END IF;
    
    SELECT permitido, motivo INTO v_resultado, v_motivo 
    FROM verificar_permissao(p_tabela, p_operacao, v_user_id)
    LIMIT 1;
    
    IF v_resultado THEN
        RETURN 'SUCESSO: ' || p_email || ' TEM PERMISSAO para ' || p_operacao || ' em ' || p_tabela;
    ELSE
        RETURN 'ERRO: ' || p_email || ' NAO TEM PERMISSAO para ' || p_operacao || ' em ' || p_tabela || ' | Motivo: ' || COALESCE(v_motivo, 'Negado');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 27. INSERIR REGRAS PADRÃO
-- ============================================

INSERT INTO public.system_rules (nome, descricao, categoria, tipo, tabela, operacao, condicao, prioridade) VALUES
('Admin - Ver todos os perfis', 'Admin ve todos os perfis', 'admin', 'permissao', 'profiles', 'SELECT', NULL, 100),
('Admin - Ver todas as tasks', 'Admin ve todas as tasks', 'admin', 'permissao', 'tasks', 'SELECT', NULL, 100),
('Admin - Ver todas as notificacoes', 'Admin ve todas as notificacoes', 'admin', 'permissao', 'notifications', 'SELECT', NULL, 100),
('Admin - Gerenciar notificacoes', 'Admin gerencia notificacoes em massa', 'admin', 'permissao', 'admin_notifications', 'ALL', NULL, 100),
('Admin - Deletar tasks', 'Admin deleta qualquer task', 'admin', 'permissao', 'tasks', 'DELETE', NULL, 90),
('Admin - Deletar notificacoes', 'Admin deleta qualquer notificacao', 'admin', 'permissao', 'notifications', 'DELETE', NULL, 90),
('Admin - Atualizar perfis', 'Admin atualiza qualquer perfil', 'admin', 'permissao', 'profiles', 'UPDATE', NULL, 90),
('Admin - Ver regras', 'Admin ve regras do sistema', 'admin', 'permissao', 'system_rules', 'SELECT', NULL, 100),
('Admin - Gerenciar regras', 'Admin gerencia regras do sistema', 'admin', 'permissao', 'system_rules', 'ALL', NULL, 100),
('Admin - Ver historico IA', 'Admin ve historico de IA de todos', 'admin', 'permissao', 'ia_history', 'SELECT', NULL, 100),
('Admin - Gerenciar historico IA', 'Admin gerencia historico de IA', 'admin', 'permissao', 'ia_history', 'ALL', NULL, 100),

('User - Ver proprio perfil', 'User ve apenas seu perfil', 'user', 'permissao', 'profiles', 'SELECT', 'auth.uid() = id', 50),
('User - Atualizar proprio perfil', 'User atualiza apenas seu perfil', 'user', 'permissao', 'profiles', 'UPDATE', 'auth.uid() = id', 50),
('User - Ver proprias tasks', 'User ve apenas suas tasks', 'user', 'permissao', 'tasks', 'SELECT', 'auth.uid() = user_id', 50),
('User - Criar tasks', 'User cria suas tasks', 'user', 'permissao', 'tasks', 'INSERT', 'auth.uid() = user_id', 50),
('User - Atualizar proprias tasks', 'User atualiza apenas suas tasks', 'user', 'permissao', 'tasks', 'UPDATE', 'auth.uid() = user_id', 50),
('User - Deletar proprias tasks', 'User deleta apenas suas tasks', 'user', 'permissao', 'tasks', 'DELETE', 'auth.uid() = user_id', 50),
('User - Ver proprias notificacoes', 'User ve apenas suas notificacoes', 'user', 'permissao', 'notifications', 'SELECT', 'auth.uid() = user_id', 50),
('User - Ver proprias notas', 'User ve apenas suas notas', 'user', 'permissao', 'notes', 'SELECT', 'auth.uid() = user_id', 50),
('User - Criar notas', 'User cria suas notas', 'user', 'permissao', 'notes', 'INSERT', 'auth.uid() = user_id', 50),
('User - Atualizar proprias notas', 'User atualiza apenas suas notas', 'user', 'permissao', 'notes', 'UPDATE', 'auth.uid() = user_id', 50),
('User - Deletar proprias notas', 'User deleta apenas suas notas', 'user', 'permissao', 'notes', 'DELETE', 'auth.uid() = user_id', 50),
('User - Ver proprios eventos', 'User ve apenas seus eventos', 'user', 'permissao', 'calendar_events', 'SELECT', 'auth.uid() = user_id', 50),
('User - Ver proprias disciplinas', 'User ve apenas suas disciplinas', 'user', 'permissao', 'disciplinas', 'SELECT', 'auth.uid() = user_id', 50),
('User - Ver proprio historico IA', 'User ve apenas seu historico IA', 'user', 'permissao', 'ia_history', 'SELECT', 'auth.uid() = user_id', 50),
('User - Criar historico IA', 'User cria seu historico IA', 'user', 'permissao', 'ia_history', 'INSERT', 'auth.uid() = user_id', 50),
('User - Atualizar proprio historico IA', 'User atualiza seu historico IA', 'user', 'permissao', 'ia_history', 'UPDATE', 'auth.uid() = user_id', 50),
('User - Deletar proprio historico IA', 'User deleta seu historico IA', 'user', 'permissao', 'ia_history', 'DELETE', 'auth.uid() = user_id', 50);

-- ============================================
-- 28. POLÍTICAS RLS
-- ============================================

-- PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "User update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- TASKS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin view all tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin delete all tasks"
ON public.tasks FOR DELETE
TO authenticated
USING (is_admin());

-- NOTES
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own notes"
ON public.notes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert notes"
ON public.notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own notes"
ON public.notes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own notes"
ON public.notes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- CALENDAR_EVENTS
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own events"
ON public.calendar_events FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert events"
ON public.calendar_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own events"
ON public.calendar_events FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own events"
ON public.calendar_events FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- WEEKLY_SCHEDULE
ALTER TABLE public.weekly_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own schedule"
ON public.weekly_schedule FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert schedule"
ON public.weekly_schedule FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own schedule"
ON public.weekly_schedule FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- TIME_SLOTS
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own time slots"
ON public.time_slots FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert time slots"
ON public.time_slots FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own time slots"
ON public.time_slots FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin delete all notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (is_admin());

-- ADMIN_NOTIFICATIONS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view admin notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin insert admin notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin update admin notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin delete admin notifications"
ON public.admin_notifications FOR DELETE
TO authenticated
USING (is_admin());

-- USER_SETTINGS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own settings"
ON public.user_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert settings"
ON public.user_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own settings"
ON public.user_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DISCIPLINAS
ALTER TABLE public.disciplinas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own disciplinas"
ON public.disciplinas FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert disciplinas"
ON public.disciplinas FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own disciplinas"
ON public.disciplinas FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own disciplinas"
ON public.disciplinas FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- SYSTEM_RULES
ALTER TABLE public.system_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin view system rules"
ON public.system_rules FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin insert system rules"
ON public.system_rules FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin update system rules"
ON public.system_rules FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin delete system rules"
ON public.system_rules FOR DELETE
TO authenticated
USING (is_admin());

-- IA_HISTORY
ALTER TABLE public.ia_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own ia history"
ON public.ia_history FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert ia history"
ON public.ia_history FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User update own ia history"
ON public.ia_history FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own ia history"
ON public.ia_history FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin view all ia history"
ON public.ia_history FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin delete all ia history"
ON public.ia_history FOR DELETE
TO authenticated
USING (is_admin());

-- IA_CONVERSATIONS
ALTER TABLE public.ia_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User view own ia conversations"
ON public.ia_conversations FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User insert ia conversations"
ON public.ia_conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User delete own ia conversations"
ON public.ia_conversations FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admin view all ia conversations"
ON public.ia_conversations FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Admin delete all ia conversations"
ON public.ia_conversations FOR DELETE
TO authenticated
USING (is_admin());

-- ============================================
-- 29. STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('user-content', 'user-content', true, 5242880)
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Authenticated users can upload avatars'
    ) THEN
        CREATE POLICY "Authenticated users can upload avatars"
        ON storage.objects FOR INSERT 
        TO authenticated 
        WITH CHECK (
            bucket_id = 'user-content' 
            AND (storage.foldername(name))[1] = 'avatars'
        );
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Public read access for avatars'
    ) THEN
        CREATE POLICY "Public read access for avatars"
        ON storage.objects FOR SELECT 
        TO public 
        USING (bucket_id = 'user-content');
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can update own avatars'
    ) THEN
        CREATE POLICY "Users can update own avatars"
        ON storage.objects FOR UPDATE 
        TO authenticated 
        USING (bucket_id = 'user-content' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete own avatars'
    ) THEN
        CREATE POLICY "Users can delete own avatars"
        ON storage.objects FOR DELETE 
        TO authenticated 
        USING (bucket_id = 'user-content' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;

-- ============================================
-- 30. CRIAR PERFIS PARA USUÁRIOS FALTANTES
-- ============================================
INSERT INTO public.profiles (id, email, nome, avatar_url, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as nome,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    CASE WHEN u.email = 'projectozerosatus@gmail.com' THEN 'admin' ELSE 'user' END as role,
    COALESCE(u.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    role = CASE WHEN EXCLUDED.email = 'projectozerosatus@gmail.com' THEN 'admin' ELSE EXCLUDED.role END,
    updated_at = NOW();

-- ============================================
-- 31. TORNAR USUÁRIO ADMIN
-- ============================================
SELECT tornar_admin('projectozerosatus@gmail.com');

-- ============================================
-- 32. VERIFICAÇÕES FINAIS
-- ============================================

SELECT id, email, nome, role FROM public.profiles ORDER BY created_at DESC;

SELECT * FROM get_admin_stats();

SELECT * FROM listar_regras();

SELECT 
    id, 
    email, 
    nome, 
    role,
    CASE 
        WHEN role = 'admin' AND email = 'projectozerosatus@gmail.com' THEN 'ADMIN PRINCIPAL ✅'
        WHEN role = 'admin' AND email != 'projectozerosatus@gmail.com' THEN 'ERRO: ADMIN INDEVIDO ❌'
        ELSE 'USUARIO NORMAL'
    END as status
FROM public.profiles 
WHERE email = 'projectozerosatus@gmail.com' OR role = 'admin';

-- ============================================
-- 33. TESTAR NOTIFICAÇÃO
-- ============================================
SELECT enviar_notificacao(
    'todos',
    '📢 Teste de Notificação',
    'Esta é uma notificação de teste!',
    'broadcast',
    'bell',
    'Administrador',
    NULL,
    '{"inapp":true,"email":false,"push":false}',
    NULL
);

-- ============================================
-- 34. MENSAGEM DE CONCLUSÃO
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ SCRIPT EXECUTADO COM SUCESSO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '👑 ADMIN UNICO: projectozerosatus@gmail.com';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📌 PERMISSOES:';
    RAISE NOTICE '   - USUARIOS: so veem/edtam seus proprios dados';
    RAISE NOTICE '   - ADMIN: ve/edita/deleta TODOS os dados';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📬 FUNCOES DE NOTIFICACAO:';
    RAISE NOTICE '   - enviar_notificacao(destino, titulo, mensagem)';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🤖 HISTORICO DE IA:';
    RAISE NOTICE '   - get_ia_history(user_id) - Lista conversas';
    RAISE NOTICE '   - save_ia_history(user_id, history_json) - Salva conversa';
    RAISE NOTICE '   - delete_ia_history(user_id, history_id) - Deleta conversa';
    RAISE NOTICE '   - get_ia_conversation(user_id, history_id) - Pega mensagens';
    RAISE NOTICE '============================================';
    RAISE NOTICE '🔄 SINCRONIZACAO PC/MOBILE:';
    RAISE NOTICE '   - Historico de IA sincronizado automaticamente';
    RAISE NOTICE '   - Mensagens individuais armazenadas';
    RAISE NOTICE '   - Compativel com PC e Mobile';
    RAISE NOTICE '============================================';
    RAISE NOTICE '⚠️ IMPORTANTE: Saia e entre novamente!';
    RAISE NOTICE '============================================';
END $$;













colar a parte no canto 
-- ============================================
-- HABILITAR REALTIME PARA NOTIFICAÇÕES
-- ============================================

ALTER TABLE public.notifications REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION notify_new_notification()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'notification_' || NEW.user_id,
        json_build_object(
            'id', NEW.id,
            'title', NEW.title,
            'message', NEW.message,
            'type', NEW.type,
            'created_at', NEW.created_at
        )::text
    );
    
    IF NEW.read = true AND OLD.read = false THEN
        PERFORM pg_notify(
            'notification_read',
            json_build_object(
                'notification_id', NEW.id,
                'user_id', NEW.user_id
            )::text
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_notification ON public.notifications;

CREATE TRIGGER trigger_notify_notification
    AFTER INSERT OR UPDATE OF read ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_notification();

-- ============================================
-- VERIFICAR SE FUNCIONOU (VERSÃO CORRIGIDA)
-- ============================================
SELECT 
    tablename,
    CASE 
        WHEN relreplident = 'f' THEN 'FULL'
        WHEN relreplident = 'd' THEN 'DEFAULT'
        WHEN relreplident = 'n' THEN 'NOTHING'
        WHEN relreplident = 'i' THEN 'INDEX'
        ELSE 'DESCONHECIDO'
    END as replica_identity
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
JOIN pg_catalog.pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'notifications'
AND t.schemaname = 'public';

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE '✅ REALTIME PARA NOTIFICACOES ATIVADO!';
    RAISE NOTICE '============================================';
    RAISE NOTICE '📬 Tabela: public.notifications';
    RAISE NOTICE '🔔 Canal: notification_{user_id}';
    RAISE NOTICE '============================================';
END $$;