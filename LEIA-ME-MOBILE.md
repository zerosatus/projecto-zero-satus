# Zero Satus — experiência mobile (como testar no telemóvel)

A landing page tem agora **duas experiências independentes**:

| | Desktop (≥ 900 px) | Mobile (≤ 899 px) |
|---|---|---|
| Ideia | A câmara passeia pelas janelas do Dashboard | Os ecrãs reais da app Android desfazem-se em peças (cartões, linhas, anéis) que voam em profundidade e se reorganizam no ecrã completo, ao ritmo do scroll |
| Código | `js/chapters/*.js`, `css/chapters/*.css` (inalterados) | `js/mobile/*.js`, `css/mobile.css` (novos) |
| Marcação | `.zs-stage` original | blocos `.zm` (só visíveis em mobile) |
| Imagens | `assets/fragments`, `assets/mockups` | `assets/m` (peças das capturas Android reais, em resolução nativa de 1080 px) |

O breakpoint é o que já existia (`ZS.query.mobile`, 899 px). Ao redimensionar a janela a experiência troca sozinha.

## Testar no telemóvel (Live Server + ngrok)

1. VS Code → abrir a pasta do projeto → **Go Live** (Live Server, normalmente porta 5500).
2. Noutro terminal: `ngrok http 5500`
3. Abrir no telemóvel o endereço `https://xxxx.ngrok-free.app` (se aparecer o aviso do ngrok, tocar em *Visit Site*).
4. Após alterações: recarregar com cache limpo (no Chrome Android: menu ⋮ → Definições do site → limpar; no iPhone: fechar o separador e reabrir).

Para ver no computador: DevTools → modo dispositivo (largura < 900 px) e recarregar a página.

## Capítulos mobile e ficheiros

| Capítulo | Ficheiro | Coreografia |
|---|---|---|
| Home | `js/mobile/m-home.js` | O Dashboard estilhaça-se em peças à volta do título e reorganiza-se no ecrã Início, que o scroll percorre |
| Organização | `m-organizacao.js` | As semanas do calendário entram pelos lados, dias marcados acendem-se, evento em destaque; depois o horário monta-se linha a linha |
| Modo Foco | `m-foco.js` | O anel desenha-se e roda; os controlos reais fixam-se à volta; o Estudo Online monta-se em laranja |
| Anotações | `m-anotacoes.js` | Duas notas pairam e assentam no caderno digital; pesquisa; Documentos |
| Progresso | `m-progresso.js` | Resumo semanal, números de relance, barras de disciplina a encher e histórico |
| Blog | `m-blog.js` | Três páginas de revista com capas compostas por peças reais |
| Depoimentos | `m-depoimentos.js` | Uma citação real por cena, palavra a palavra (usa as citações já existentes no HTML) |
| Contacto | `m-encerramento.js` | Leque de três ecrãs e painel com o convite final |

Kit partilhado: `js/mobile/mkit.js` (`storm` = peças que se reorganizam, `scatter`, `pulse`, legendas `steps`, saída em íris com cartão de título `exit`).

## Qualidade de imagem
Todas as peças são recortadas das capturas Android **sem redimensionar** (1080 px de largura, WebP de qualidade 90–92) e mostradas a, no máximo, a largura do ecrã, para ficarem nítidas.

## Sem JavaScript / movimento reduzido
Cada capítulo mobile tem uma versão estática em coluna (texto + um telemóvel). Os depoimentos mantêm a faixa original.

## Dados
Os ecrãs vêm das capturas Android reais (28/10 e 06/11/2026). Mostram os valores dessa conta (por exemplo, 0h 1min na semana); nenhum número foi inventado.


---

# Carregamento e canais oficiais

## Ecrã de carregamento (`js/loader.js`, `css/loader.css`, marcação no início do `<body>`)
- **Composição:** o logótipo (capelo) desenha-se; "Zero Satus" sobe letra a letra; cartões académicos (tarefas, calendário, nota, estatísticas, foco, horário), feitos só em CSS e sem dados inventados, entram em cena e flutuam. Mensagens rotativas: "A preparar o teu espaço de conquistas…", "Cada grande conquista começa com organização.", "Menos distrações. Mais conquistas.", e no fim "O teu próximo capítulo está prestes a começar.". Desktop: cartões espalhados no ecrã largo; mobile: composição vertical.
- **Carregamento real:** a barra só avança com tarefas realmente concluídas (GSAP, ScrollTrigger, motor, capítulos, cenas mobile, fontes e as imagens essenciais de Home e Organização). Não há percentagens.
- **Arranque:** as animações só arrancam quando GSAP/ScrollTrigger e tudo o resto estão prontos; a página abre com um "portal" que se expande a partir do logótipo.
- **Sem esperas artificiais:** o mínimo é o tempo do logótipo se desenhar (~1,3 s na 1.ª visita; ~0,4 s nas visitas seguintes da mesma sessão).
- **Recuperação:** se um script falhar, a versão estática abre logo; aos 7 s aparece o aviso "A ligação está lenta…"; aos 14 s o ecrã sai sozinho; aos 17 s há uma salvaguarda final no `<head>`. Imagens que falham nunca bloqueiam.
- **Saltar:** botão "Saltar introdução" (ou tecla Esc).
- **Movimento reduzido:** sem animações, só logótipo e mensagem; sai com um fade curto.
- **Sem JavaScript / SEO:** o ecrã só existe com JS (`html.zs-loading` é posta por JS); o conteúdo continua no HTML e acessível.

## Redes sociais e contactos (`js/social-config.js` = único sítio a editar)
- Email: suportezerosatus@gmail.com (mailto). Facebook e X funcionais.
- Instagram, TikTok, YouTube e Pinterest aparecem com "Em breve" e **não são ligações**. Para ativar uma rede, colar o `url` em `js/social-config.js`: o botão passa a funcionar no rodapé e no capítulo Contacto (desktop e mobile).
- Onde aparecem: rodapé (logótipo, descrição, email, redes, direitos) e capítulo Contacto (desktop: ícones em cascata quando o convite final surge; mobile: painel inferior com ícones que entram em sequência).
- Sem JavaScript ficam visíveis o email, o Facebook e o X (versão básica no HTML).
- Os ícones usam o Font Awesome que a página já carrega; o X é um SVG próprio. Cada botão tem também o nome por baixo.
