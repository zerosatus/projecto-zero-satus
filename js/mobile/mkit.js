/* Zero Satus — kit da experiência mobile.
   Cada capítulo mobile regista-se com ZM.chapter('nome-do-capítulo', function (C) { ...coreografia... }).
   Substitui só a versão mobile do capítulo (def.mobile); a versão desktop nunca é tocada.
   O palco é o telemóvel: C.focus aproxima a câmara de uma zona do ecrã, C.scrollImg desliza o conteúdo
   da app e C.steps liga as legendas ao scroll. Tudo em transform/opacity (leve em telemóveis fracos). */
(function (w) {
    'use strict';
    var ZM = (w.ZM = w.ZM || {});

    ZM.chapter = function (name, build) {
        var def = (w.ZS.chapters[name] = w.ZS.chapters[name] || {});
        def.mobile = function (root, h) { return ZM.run(root, h, build); };
    };

    ZM.run = function (root, h, build) {
        var gsap = h.gsap, zm = root.querySelector('.zm');
        if (!zm) return;
        var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true } });
        var C = { gsap: gsap, tl: tl, root: root, zm: zm };
        C.q = function (s) { return zm.querySelector(s); };
        C.qa = function (s) { return [].slice.call(zm.querySelectorAll(s)); };
        C.W = function () { return zm.clientWidth; };
        C.H = function () { return zm.clientHeight; };

        /* câmara: leva o ponto (fx, fy) do telemóvel (frações 0-1) para a altura ty do ecrã, com zoom s */
        C.focus = function (ph, fx, fy, s, at, d, ty) {
            tl.to(ph, {
                scale: s, duration: d, ease: 'power2.inOut',
                x: function () { return -(fx - 0.5) * ph.offsetWidth * s; },
                y: function () { return (ty || 0.66) * C.H() - (ph.offsetTop + ph.offsetHeight / 2) - (fy - 0.5) * ph.offsetHeight * s; }
            }, at);
        };
        /* desliza o conteúdo de uma captura alta dentro do ecrã (f0 → f1 do percurso total) */
        C.scrollImg = function (ph, f0, f1, at, d) {
            var scr = ph.querySelector('.zm-screen'), img = scr.querySelector('img');
            function tr() { return Math.max(0, img.offsetHeight - scr.offsetHeight); }
            tl.fromTo(img, { y: function () { return -tr() * f0; } }, { y: function () { return -tr() * f1; }, duration: d, ease: 'none' }, at);
        };
        C.rise = function (el, at, d, from, to) { tl.fromTo(el, from, Object.assign({ duration: d, ease: 'power3.out' }, to), at); };
        C.fade = function (el, at, d, to) { tl.to(el, Object.assign({ duration: d, ease: 'power2.inOut' }, to || { opacity: 0 }), at); };
        C.ping = function (el, at, until) {
            tl.fromTo(el, { opacity: 0, scale: 1.25 }, { opacity: 1, scale: 1, duration: 0.03, ease: 'back.out(2)' }, at)
              .to(el, { opacity: 0, duration: 0.03 }, until);
        };
        /* legendas: cada uma entra em S[i] e sai antes de E[i] (a última fica até ao fim) */
        C.steps = function (S, E, opts) {
            var li = C.qa('.zm-steps li'), copy = C.q('.zm-copy');
            if (copy && S[0] && !(opts && opts.keepCopy)) tl.to(copy, { y: -46, opacity: 0, duration: 0.05, ease: 'power2.in' }, S[0] - 0.06);
            li.forEach(function (el, i) {
                tl.fromTo(el, { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.04, ease: 'power3.out' }, S[i]);
                if (i < li.length - 1) tl.to(el, { y: -18, opacity: 0, duration: 0.035, ease: 'power2.in' }, E[i] - 0.035);
            });
        };
        /* peças de um ecrã real: voam de uma "tempestade" até formarem o ecrã (as peças têm a resolução nativa da captura) */
        C.pcs = function (a, o) {
            o = o || {};
            return [].slice.call(a.querySelectorAll('.zm-pc')).filter(function (pc) {
                var k = pc.getAttribute('data-k');
                return (!o.only || o.only.indexOf(k) > -1) && (!o.skip || o.skip.indexOf(k) < 0);
            });
        };
        C.piece = function (a, k) { return a.querySelector('.zm-pc[data-k="' + k + '"]'); };
        function vals(pc) { return (pc.getAttribute('data-st') || pc.getAttribute('data-rs') || '0,0,0,1,0').split(',').map(Number); }
        function origin(a, pc) {
            var abs = pc.hasAttribute('data-st'), v = vals(pc);
            return {
                x: function () { return abs ? v[0] * C.W() - (a.offsetLeft + pc.offsetLeft + pc.offsetWidth / 2) : v[0] * C.W(); },
                y: function () { return abs ? v[1] * C.H() - (a.offsetTop + pc.offsetTop + pc.offsetHeight / 2) : v[1] * C.H(); }, v: v
            };
        }
        /* o.keep: peças visíveis desde o início (tempestade) · peças "hero" aparecem primeiro em o.heroAt e só depois se juntam ao ecrã */
        C.storm = function (a, at, dur, o) {
            o = o || {};
            var pcs = C.pcs(a, o), n = pcs.length, part = o.part || 0.62;
            pcs.forEach(function (pc, i) {
                var s = origin(a, pc), v = s.v, hero = pc.hasAttribute('data-hero') && o.heroAt !== undefined;
                var end = { x: 0, y: 0, rotation: 0, scale: 1, z: 0, opacity: 1, duration: dur * part, ease: o.ease || 'power3.out' };
                var t = at + dur * (1 - part) * (n > 1 ? i / (n - 1) : 0);
                if (hero) {
                    tl.fromTo(pc, { x: s.x, y: s.y, rotation: v[2] * 1.7, scale: v[3] * 0.55, z: v[4], opacity: 0 }, { x: s.x, y: s.y, rotation: v[2], scale: v[3], z: v[4], opacity: 1, duration: 0.09, ease: 'power3.out' }, o.heroAt);
                    tl.to(pc, Object.assign({}, end, { ease: 'power3.inOut', duration: dur * 0.7 }), at);
                } else {
                    tl.fromTo(pc, { x: s.x, y: s.y, rotation: v[2], scale: v[3], z: v[4], opacity: o.keep ? 1 : 0 }, end, t);
                }
            });
        };
        /* saída de um ecrã: as peças afastam-se em profundidade */
        C.scatter = function (a, at, dur) {
            tl.to(C.pcs(a), { z: -420, y: function (i) { return -C.H() * 0.22 - i * 7; }, rotation: function (i) { return (i % 2 ? 6 : -6); }, opacity: 0, scale: 0.9, duration: dur, ease: 'power2.in', stagger: { each: dur * 0.035 } }, at);
        };
        C.pulse = function (els, at, dur, s) { tl.to(els, { scale: s || 1.06, z: 60, duration: dur / 2, ease: 'power2.out', stagger: dur * 0.12 }, at).to(els, { scale: 1, z: 0, duration: dur / 2, ease: 'power2.in', stagger: dur * 0.12 }, at + dur / 2); };
        /* saída do capítulo: íris com o "cartão de título" do capítulo seguinte (continuidade entre cenas) */
        C.exit = function (at) {
            var iris = C.q('.zm-iris'), next = zm.getAttribute('data-next');
            tl.to(C.q('.zm-wrap'), { scale: 0.95, opacity: 0.15, duration: 0.09, ease: 'power2.in', transformOrigin: '50% 40%' }, at);
            if (iris && next) {
                iris.style.background = next;
                iris.innerHTML = '<span class="zm-iris__t"><b>' + zm.getAttribute('data-nn') + '</b><i>' + zm.getAttribute('data-nt') + '</i></span>';
                tl.fromTo(iris, { clipPath: 'circle(0% at 50% 100%)' }, { clipPath: 'circle(150% at 50% 100%)', duration: 0.09, ease: 'power2.in' }, at);
                tl.fromTo(iris.firstChild, { y: 50, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.06, ease: 'power2.out' }, at + 0.045);
            }
        };
        build(C);
        return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
    };
})(window);
