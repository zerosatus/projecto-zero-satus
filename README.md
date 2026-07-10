# projecto-zero-satus

  No painel inicial vai ter todas as informações q o App oferece como os gráficos as palmilhas entre outras coisas 

Já o dasbord vai ter o nomes das secções para n misturar tudo 
Tipo lá vai ter 

calendário e nos vamos usar todas as funções do Google calendário  e deixa simples e prático 

Tarefas vamos procurar o melhor aplicativo de tarefas e vamos usar o msm modelo : tipo aq se alguém quer colocar sua sala q vai ter aulas entre outras coisas 

Anotações vamos tentar copiar um o obsidean
projecto  de gestao de tempo


este è o codigo qnd fores a usar via termux ao fazer upload de pasta etc


link de conversa para usar terminar ao fazer alterações 
:https://g.co/gemini/share/5d7195c60154


adicionado tela de usuario e botao para acessar o perfil

**28 de 2 2026**
A tela de login ja é completamente funcional e ja fiz toda base de dados necessaria no firebase que inclui (tarefas,anotacoes testes agendas e essas cenas) so falta vincular e alterar todo java para que vincule se a base de dados e alterar as regras da base de dados para que seja um pouco segura vams ass dizer.

**1/03/2026**
terminei a primeira pagina de mobile 

**2/03/2026**
A tela de apresentação ja esta feita e responsiva, adaptase automaticamente para descktop e celular no celular aparece bara lateral dinamica etudo esta compactado e bem feito.

## comandos para atualizar o github 

**git pull** :serve para levar tudo q ta no git e colocar no teu pc pra n ter conflit se entrar no vim clica esc e depos shif e z

**git add .**   : serve para adicionar coisas no git e com o ponto e para tudo q esta na determinada pasta 

**git commit -m** "aque vc escreve oq quer para aparecer na pasta ou arquivo de info la no git e tem q tar entre aspas"

**git push origin main** :aq ja para finalizar o processo

## comandos do git q nao sao do dia a dia mas podes precisar

**git status** : Mostra o que você mudou e o que ainda não salvou.

**git log --oneline** : Lista o seu histórico de "fotos" (commits) de forma curta.

**git restore [arquivo]**: Desfaz as mudanças de um arquivo e volta ao original.

**git commit --amend**: Edita a mensagem do seu último commit.

**git checkout -b [nome]**: Cria uma "cópia" do projeto para testar coisas novas.

**git checkout main**: Volta para a versão principal e segura do código.

telas de mobile terminadas e sistema de mudaca de telas de pc para mobile finalizado so falta testar 
 telas de mobile finalizada pronto
 
 09.05.26
 a base de dados ja funciona(realtime) e finalmete ja é usavel. bem continua
 mas uma vez






deua e pai





COMANDOS PARA EXECUTAR APÓS O SCRIPT
1. Verificar estatísticas do admin
sql
SELECT * FROM get_admin_stats();
Resultado esperado:

total_usuarios	total_admins	total_posts	total_comentarios
5	1	3	2
2. Estatísticas por role
sql
SELECT * FROM get_stats_by_role();
Resultado esperado:

role	total
user	4
admin	1
3. Verificar role de um usuário
sql
SELECT * FROM verificar_role('projectozerosatus@gmail.com');
4. Diagnóstico de um usuário
sql
SELECT diagnosticar_usuario('projectozerosatus@gmail.com');
5. Tornar um usuário admin
sql
SELECT tornar_admin('projectozerosatus@gmail.com');
6. Ver todos os usuários
sql
SELECT id, email, nome, role, created_at FROM public.profiles ORDER BY created_at DESC;














-- ============================================
-- CRIAR PERFIS PARA USUÁRIOS FALTANTES
-- ============================================
INSERT INTO public.profiles (id, email, nome, avatar_url, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as nome,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    'user' as role,
    COALESCE(u.created_at, NOW()) as created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    nome = EXCLUDED.nome,
    updated_at = NOW();

-- Verificar resultado
SELECT COUNT(*) FROM public.profiles;