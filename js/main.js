/* Zero Satus — arranque. Carrega GSAP, o motor e os capítulos.
   Sem reduced-motion: palco animado (desktop e mobile, composições distintas).
   Com reduced-motion ou falha: versão estática (o conteúdo nunca depende do JS). */
(function () {
    'use strict';
    if (!window.ZS) return;
    var html = document.documentElement;

    // Cada capítulo = 1 ficheiro. Para acrescentar um, listar aqui.
    var CHAPTERS = [
        'js/chapters/abertura.js',
        'js/chapters/organizacao.js',
        'js/chapters/foco.js',
        'js/chapters/anotacoes.js',
        'js/chapters/progresso.js',
        'js/chapters/blog.js',
        'js/chapters/encerramento.js'
    ];

    var MOBILE = [
        'js/mobile/m-home.js', 'js/mobile/m-organizacao.js', 'js/mobile/m-foco.js', 'js/mobile/m-anotacoes.js',
        'js/mobile/m-progresso.js', 'js/mobile/m-blog.js', 'js/mobile/m-depoimentos.js', 'js/mobile/m-encerramento.js'
    ];

    /* ---------- carregamento real: scripts, fontes e imagens essenciais dos primeiros capítulos ---------- */
    var L = window.ZSLoader || null;
    var isM = window.matchMedia && matchMedia('(max-width: 899px)').matches;
    function track(p) { return Promise.resolve(p).then(function (v) { if (L) L.tick(); return v; }, function (e) { if (L) L.tick(); throw e; }); }
    function load(u) { return track(ZS.load(u)); }

    function essentialImages() {
        var seen = {}, list = [];
        // mobile: peças das cenas .zm · desktop: fragmentos do palco (exclui as cenas mobile, escondidas)
        ['#home', '#organizacao'].forEach(function (id) {
            [].slice.call(document.querySelectorAll(id + ' img[src]')).forEach(function (im) {
                var inM = !!im.closest('.zm'); if (inM !== !!isM) return;
                var u = im.getAttribute('src'); if (!seen[u]) { seen[u] = 1; list.push(u); }
            });
        });
        return list.slice(0, 28);
    }
    function preload(u) {
        return track(new Promise(function (res) {
            var im = new Image(), t = setTimeout(res, 8000);
            im.onload = im.onerror = function () { clearTimeout(t); res(); };   // falha numa imagem nunca bloqueia
            im.decoding = 'async'; im.src = u;
        }));
    }
    // As fontes só são pedidas quando o texto que as usa é desenhado; document.fonts.ready pode resolver ANTES disso e as
    // posições seriam calculadas com a fonte de substituição. Pedimos explicitamente as faces usadas e esperamos por elas.
    var FONTS = ['400 1em Inter', '500 1em Inter', '600 1em Inter', '700 1em Inter', '600 1em Fraunces', 'italic 400 1em Fraunces', 'italic 600 1em Fraunces'];
    var fontsReady = function () {
        var p = Promise.resolve();
        if (document.fonts && document.fonts.load) {
            var all = Promise.all(FONTS.map(function (f) { return document.fonts.load(f).catch(function () {}); }))
                .then(function () { return document.fonts.ready; });
            p = Promise.race([all, new Promise(function (r) { setTimeout(r, 4000); })]);
        }
        return track(p);
    };

    var imgs = essentialImages();
    if (L) L.expect(5 + CHAPTERS.length + 1 + MOBILE.length + 1 + imgs.length);

    var chain = load('js/vendor/gsap.min.js')
        .then(function () { return load('js/vendor/ScrollTrigger.min.js'); })
        .then(function () { return load('js/engine/stage.js'); })
        .then(function () { return load('js/engine/kit.js'); })
        .then(function () { return load('js/engine/fx.js'); })
        .then(function () { return Promise.all(CHAPTERS.map(function (u) { return load(u); })); })
        // Experiência mobile (cenas próprias, substituem só def.mobile; o desktop não é tocado)
        .then(function () { return load('js/mobile/mkit.js'); })
        .then(function () { return Promise.all(MOBILE.map(function (u) { return load(u); })); });

    /* ---------- depois de arrancar: manter as posições do ScrollTrigger sempre certas ---------- */
    function wireRefresh() {
        if (wireRefresh.done) return; wireRefresh.done = true;
        // o overlay sai (scrollbar clássica volta, scroll desbloqueia) · load completo · fontes tardias
        window.addEventListener('zs:revealed', function () { ZS.refresh(0); });
        if (document.readyState !== 'complete') window.addEventListener('load', function () { ZS.refresh(0); }, { once: true });
        else ZS.refresh(0);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ZS.refresh(0); });
        if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { ZS.refresh(100); });
        // regresso pelo histórico / bfcache: a página volta "congelada" com medidas antigas
        window.addEventListener('pageshow', function (e) { if (e.persisted) { ZS.refresh(0); ZS.refresh(400); } });
        // iOS: após rodar o ecrã as dimensões demoram a estabilizar
        window.addEventListener('orientationchange', function () { ZS.refresh(350); ZS.refresh(900); });
        // largura do documento mudou sem evento de resize (p. ex. aparece a barra de scroll quando o loader sai)
        if (window.ResizeObserver) {
            var lw = document.documentElement.clientWidth, lh = document.documentElement.scrollHeight;
            new ResizeObserver(function () {
                var w = document.documentElement.clientWidth, h = document.documentElement.scrollHeight;
                if (Math.abs(w - lw) > 1 || Math.abs(h - lh) > 2) { lw = w; lh = h; ZS.refresh(120); }
            }).observe(document.documentElement);
        }
    }

    /* ---------- imagens dos capítulos seguintes: descarregar com antecedência, por ordem ----------
       As peças voam de fora do ecrã (transform), por isso o loading="lazy" só as pedia quando já estavam a entrar em cena e
       apareciam vazias — sobretudo em redes lentas e no Safari, que antecipa menos que o Chrome. Só o modo ativo. */
    function warmImages() {
        var c = navigator.connection || {};
        if (c.saveData || /(^|-)2g$/.test(c.effectiveType || '')) return;      // poupar dados: fica o lazy nativo
        var mobile = window.matchMedia(ZS.query.mobile).matches, queue = [];
        [].slice.call(document.querySelectorAll('.zs-chapter')).forEach(function (ch) {
            [].slice.call(ch.querySelectorAll('img[loading="lazy"]')).forEach(function (im) {
                if (im.closest('.zs-static')) return;
                if (!!im.closest('.zm') !== mobile) return;
                queue.push(im);
            });
        });
        var i = 0, idle = window.requestIdleCallback || function (f) { return setTimeout(f, 80); };
        (function next() {
            var n = 0;
            while (i < queue.length && n < 4) {
                var im = queue[i++]; n++;
                im.loading = 'eager';
                if (!im.complete) { var p = new Image(); p.decoding = 'async'; p.src = im.currentSrc || im.src; }
            }
            if (i < queue.length) idle(next, { timeout: 600 });
        })();
    }

    // GSAP e ScrollTrigger têm de estar prontos antes de arrancar; a página só se revela com tudo montado
    Promise.all([chain, Promise.all(imgs.map(preload)), fontsReady()])
        .then(function () {
            function go() { ZS.start(gsap, ScrollTrigger); wireRefresh(); setTimeout(warmImages, 400); }
            return L ? L.finish(go) : go();
        })
        .catch(function (err) {
            console.warn('[ZS] Scrollytelling desativado:', err && err.message);
            html.classList.remove('zs-pending');          // recuperação: versão estática, sem ficar preso
            if (L) L.finish(null);
        });
})();
