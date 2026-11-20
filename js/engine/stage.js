/* Zero Satus — motor de palco.
   Escolhe a composição (desktop/mobile), respeita reduced-motion e
   entrega a cada capítulo a sua raiz DOM. Cada capítulo regista-se com
   ZS.chapter('nome', { desktop(root, helpers), mobile(root, helpers) })
   e devolve (opcional) uma função de limpeza. */
(function (w) {
    'use strict';
    var ZS = (w.ZS = w.ZS || {});
    ZS.chapters = {};
    ZS.chapter = function (name, def) { ZS.chapters[name] = def; };

    /* Refresh agrupado: vários pedidos seguidos (fontes, load, loader a sair, orientação…) tornam-se um só.
       Nunca é chamado a meio de um gesto de scroll em iOS (ver ignoreMobileResize abaixo). */
    var rafId = 0, tmId = 0;
    ZS.refresh = function (delay) {
        if (!ZS.ST) return;
        clearTimeout(tmId); cancelAnimationFrame(rafId);
        tmId = setTimeout(function () { rafId = requestAnimationFrame(function () { try { ZS.ST.refresh(); } catch (e) {} }); }, delay || 0);
    };

    ZS.start = function (gsap, ST) {
        if (ZS.started) return;                  // arranque único: sem inicializações duplicadas
        ZS.started = true; ZS.ST = ST;
        gsap.registerPlugin(ST);
        // iOS/Android: a barra de endereços a mostrar/esconder muda só a altura da janela; os palcos usam 100svh (estável),
        // por isso não há nada a recalcular — um refresh a meio do scroll reiniciava as timelines e fazia saltar a cena.
        ST.config({ ignoreMobileResize: true });
        var html = document.documentElement;
        var mm = gsap.matchMedia();

        mm.add({
            desktop: ZS.query.desktop,
            mobile: ZS.query.mobile,
            reduce: ZS.query.reduce,
            hover: ZS.query.hover
        }, function (ctx) {
            var c = ctx.conditions;
            if (c.reduce) { html.classList.remove('zs-pending'); return; }

            var mode = c.desktop ? 'desktop' : 'mobile';
            var cleanups = [];
            html.classList.add('zs-live');
            html.classList.remove('zs-pending');

            Object.keys(ZS.chapters).forEach(function (name) {
                var def = ZS.chapters[name];
                var root = document.querySelector('[data-chapter="' + name + '"]');
                if (!root || !def[mode]) return;
                var res = def[mode](root, { gsap: gsap, ST: ST, hover: c.hover });
                if (typeof res === 'function') cleanups.push(res);
            });

            // composição acabada de montar (arranque ou mudança desktop⇄mobile): recalcular posições com o layout final
            ZS.refresh(60);

            return function () {
                cleanups.forEach(function (f) { f(); });
                html.classList.remove('zs-live');
            };
        });
    };
})(window);
