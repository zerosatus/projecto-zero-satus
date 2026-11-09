/* Zero Satus — orquestrador do ecrã de carregamento (sem dependências; corre antes do GSAP).
   API (usada por js/main.js):
     ZSLoader.expect(n)   n tarefas reais a aguardar (scripts, fontes, imagens essenciais)
     ZSLoader.tick()      uma tarefa concluída (ou falhada: nunca bloqueia)
     ZSLoader.finish(fn)  tudo pronto: completa, chama fn() (arranque das animações) e abre o portal
     ZSLoader.skip()      revela já a página
   Regras: a barra só reflete tarefas realmente concluídas (sem percentagens inventadas); não se prolonga a espera além do
   mínimo necessário para o logótipo se desenhar; nunca fica preso (aviso aos 7 s, saída forçada aos 14 s); botão "Saltar". */
(function () {
    'use strict';
    var html = document.documentElement, el = document.getElementById('zs-loader');
    if (!el) { window.ZSLoader = null; return; }
    var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var seen = false; try { seen = sessionStorage.getItem('zs-intro') === '1'; } catch (e) {}
    var t0 = Date.now(), total = 0, done = 0, started = false, out = false, startFn = null, msgTimer = null, warn = null, hard = null;
    var msgs = [].slice.call(el.querySelectorAll('.zs-ld__msg span')), mi = 0;
    if (!(window.CSS && 'registerProperty' in CSS)) el.classList.add('no-reg');

    function setP() { el.style.setProperty('--p', total ? Math.min(1, done / total).toFixed(3) : 0); }
    function show(i) { msgs.forEach(function (m, k) { m.classList.toggle('is-on', k === i); }); }
    // mensagens: mudam enquanto espera (a última fica reservada para o fim)
    if (!rm && !seen) {
        msgTimer = setInterval(function () { mi = (mi + 1) % (msgs.length - 1); show(mi); }, 2600);
    }
    // se demorar: aviso discreto e saída forçada (nunca preso)
    warn = setTimeout(function () {
        if (out) return;
        var s = el.querySelector('.zs-ld__sr'); if (s) s.textContent = 'O carregamento está a demorar. Podes saltar a introdução.';
        msgs.forEach(function (m) { m.classList.remove('is-on'); });
        msgs[0].textContent = 'A ligação está lenta. Podes entrar já, a página continua a preparar-se.'; msgs[0].classList.add('is-on');
        clearInterval(msgTimer);
    }, 7000);
    hard = setTimeout(function () { reveal(); }, 14000);

    function reveal() {
        if (out) return; out = true;
        clearInterval(msgTimer); clearTimeout(warn); clearTimeout(hard);
        // arranque das animações da página já com o portal a abrir
        if (!started) { started = true; try { if (startFn) startFn(); } catch (e) { console.warn('[ZS] arranque:', e && e.message); html.classList.remove('zs-pending'); } }
        el.classList.add('is-out'); el.setAttribute('aria-busy', 'false');
        try { sessionStorage.setItem('zs-intro', '1'); } catch (e) {}
        var fin = function () { if (!el.parentNode) return; el.parentNode.removeChild(el); html.classList.remove('zs-loading'); window.dispatchEvent(new Event('zs:revealed')); };
        var dur = rm ? 300 : (el.classList.contains('no-reg') ? 800 : 1150);
        setTimeout(fin, dur);
    }
    var L = {
        expect: function (n) { total += n; setP(); },
        tick: function () { done++; setP(); },
        finish: function (fn) {
            startFn = fn;
            // já se saltou/revelou (botão, Esc ou 14 s): arranca as animações assim que estiverem prontas
            if (out) {
                if (!started) {
                    started = true;
                    // se o visitante já está a ler a versão estática, não trocar de modo a meio do scroll
                    if (window.pageYOffset > 120) { html.classList.remove('zs-pending'); return Promise.resolve(); }
                    try { if (fn) fn(); } catch (e) { html.classList.remove('zs-pending'); }
                }
                return Promise.resolve();
            }
            return new Promise(function (resolve) {
                var minShow = rm ? 200 : (seen ? 350 : 1250);               // só o necessário para o logótipo se desenhar
                var wait = Math.max(0, minShow - (Date.now() - t0));
                setTimeout(function () {
                    if (out) return resolve();
                    el.classList.add('is-done'); clearInterval(msgTimer);
                    if (!rm && !seen) show(msgs.length - 1);
                    setTimeout(function () { reveal(); resolve(); }, rm || seen ? 60 : 650);
                }, wait);
            });
        },
        skip: function () { reveal(); }
    };
    var skip = document.getElementById('zs-ld-skip');
    if (skip) skip.addEventListener('click', function () { L.skip(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !out) L.skip(); });
    window.ZSLoader = L;
})();
