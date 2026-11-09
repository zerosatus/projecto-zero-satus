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
    var fontsReady = function () {
        var p = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 4000); })]) : Promise.resolve();
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

    // GSAP e ScrollTrigger têm de estar prontos antes de arrancar; a página só se revela com tudo montado
    Promise.all([chain, Promise.all(imgs.map(preload)), fontsReady()])
        .then(function () {
            function go() { ZS.start(gsap, ScrollTrigger); }
            return L ? L.finish(go) : go();
        })
        .catch(function (err) {
            console.warn('[ZS] Scrollytelling desativado:', err && err.message);
            html.classList.remove('zs-pending');          // recuperação: versão estática, sem ficar preso
            if (L) L.finish(null);
        });
})();
