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

    ZS.start = function (gsap, ST) {
        gsap.registerPlugin(ST);
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

            return function () {
                cleanups.forEach(function (f) { f(); });
                html.classList.remove('zs-live');
            };
        });
    };
})(window);
