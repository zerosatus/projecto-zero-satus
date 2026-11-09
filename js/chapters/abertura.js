/* Capítulo 0 — Abertura
   Peças reais do Zero Satus flutuam em profundidade; ao scroll voam para
   os seus lugares e montam o dashboard (desktop) ou um baralho vertical de
   cartões (mobile). Os satélites (peças de outros ecrãs) passam pela câmara
   e voltam nos capítulos seguintes. */
(function () {
    'use strict';

    // Posição final no espaço do dashboard (1366×641): [x, y, w, h]
    var DASH = {
        'd-sidebar': [0, 0, 260, 641],   'd-pill':  [1151, 31, 179, 52],
        'd-title':   [290, 29, 350, 64], 'd-next':  [290, 135, 361, 203],
        'd-algebra': [670, 135, 361, 204], 'd-week': [1050, 137, 281, 370],
        'd-stats':   [290, 359, 361, 148], 'd-best': [670, 359, 361, 148],
        'd-draft':   [290, 525, 1041, 116], 'd-fab': [1276, 551, 60, 60]
    };

    // Dispersão inicial: [nx, ny (−1..1 do meio-palco), z, rotX, rotY, rotZ, escala, opacidade]
    var SC_D = {
        'd-sidebar': [-1.02, 0.42, -150, 6, 34, -3, 0.62],
        'd-pill':    [0.90, -0.60, 140, 0, -20, -5, 0.85],
        'd-next':    [-0.70, -0.74, 60, -8, 22, -6, 0.66],
        'd-algebra': [0.80, -0.44, -80, 8, -24, 5, 0.68],
        'd-week':    [0.98, 0.42, 20, -6, -34, 6, 0.6],
        'd-stats':   [-0.74, 0.74, 100, 10, 20, 5, 0.72],
        'd-best':    [0.64, 0.84, -40, -10, -18, -4, 0.68],
        's-cal':     [1.0, 0.0, -300, 4, -28, 6, 0.48, 0.8],
        's-note':    [-0.30, 1.06, -380, 12, 0, -3, 0.46, 0.8]
    };
    var SC_M = {
        'd-sidebar': [-1.0, 0.25, -200, 0, 28, -3, 0.5],
        'd-pill':    [0.9, 0.2, -150, 0, -20, 3, 0.8],
        'd-next':    [-0.42, 0.08, 60, -8, 18, -8, 0.62],
        'd-algebra': [0.52, 0.24, -60, 8, -18, 6, 0.62],
        'd-week':    [0.98, -0.02, -140, -6, -26, 6, 0.5],
        'd-stats':   [-0.40, 0.52, 100, 10, 14, 5, 0.62],
        'd-best':    [0.46, 0.62, -30, -6, -16, -6, 0.58],
        's-cal':     [-0.92, 0.70, -260, 4, 20, -6, 0.38, 0.8],
        's-note':    [0.05, 0.74, -300, 10, 0, 2, 0.38, 0.8]
    };

    var KEYS = ['x', 'y', 'z', 'rotationX', 'rotationY', 'rotation', 'scale', 'opacity'];
    var STACK = ['d-next', 'd-algebra', 'd-stats', 'd-best'];

    function build(root, h, M) {
        var gsap = h.gsap, ST = h.ST;
        var stage = root.querySelector('.zs-stage');
        var par = root.querySelector('.zs-parallax');
        var world = root.querySelector('.zs-world');
        var plane = root.querySelector('.zs-plane');
        var intro = root.querySelector('.zs-copy--intro');
        var cue = root.querySelector('.zs-cue');
        var flash = root.querySelector('.zs-flash');
        var frags = {};
        [].forEach.call(root.querySelectorAll('.zs-frag'), function (el) { frags[el.dataset.id] = el; });
        var ids = Object.keys(frags);
        var SC = M ? SC_M : SC_D;
        var L = { W: 0, H: 0, k: 1, k0: 1, oy: 0, step: 0 };

        function measure() {
            L.W = stage.clientWidth; L.H = stage.clientHeight;
            if (M) { L.k = (L.W - 36) / 361; L.k0 = L.W / 390; L.oy = 0; L.step = 118 * L.k; }
            else   { L.k = Math.min(L.W * 0.78 / 1366, L.H * 0.54 / 641); L.k0 = L.W / 1366; L.oy = -L.H * 0.02; }
            ids.forEach(function (id) {
                var el = frags[id];
                el.style.width = (el.dataset.w * L.k) + 'px';
                el.style.setProperty('--r', (el.dataset.r * L.k) + 'px');
            });
            plane.style.width = (1366 * L.k) + 'px';
            plane.style.height = (641 * L.k) + 'px';
            plane.style.top = (L.H / 2 + L.oy) + 'px';
        }
        measure();
        ST.addEventListener('refreshInit', measure);
        gsap.set(ids.map(function (i) { return frags[i]; }), { xPercent: -50, yPercent: -50 });
        ids.forEach(function (id, i) {
            frags[id].querySelector('.zs-frag__in').style.setProperty('--di', (1.0 + i * 0.09) + 's');
            frags[id].querySelector('.zs-frag__in').style.setProperty('--fd', (6 + (i % 5) * 0.9) + 's');
            frags[id].querySelector('.zs-frag__in').style.setProperty('--fl', (-i * 0.7) + 's');
        });

        function scat(id) {
            var t = SC[id];
            return { x: t[0] * L.W / 2, y: t[1] * L.H / 2, z: t[2], rotationX: t[3], rotationY: t[4],
                     rotation: t[5], scale: t[6] * L.k0 / L.k, opacity: t[7] === undefined ? 1 : t[7] };
        }
        function fin(id) {
            var r = DASH[id];
            if (!M) return { x: (r[0] + r[2] / 2 - 683) * L.k, y: (r[1] + r[3] / 2 - 320.5) * L.k + L.oy };
            var i = STACK.indexOf(id);
            if (i >= 0) return { x: 0, y: L.H * 0.205 + i * L.step + r[3] * L.k / 2 - L.H / 2 };
            if (id === 'd-title') return { x: 0, y: 86 + r[3] * L.k / 2 - L.H / 2 };
            if (id === 'd-fab')   return { x: L.W / 2 - 40, y: L.H * 0.205 + 3 * L.step + 120 * L.k - L.H / 2 };
            return null;
        }
        // fábrica de valores dependentes do layout (re-avaliados em refresh)
        function fromVars(id) {
            var o = {};
            KEYS.forEach(function (k) { o[k] = function () { return scat(id)[k]; }; });
            return o;
        }
        function toFinal(id, dur) {
            return { x: function () { return fin(id).x; }, y: function () { return fin(id).y; },
                     z: 0, rotationX: 0, rotationY: 0, rotation: 0, scale: 1, opacity: 1,
                     duration: dur, ease: 'power3.inOut' };
        }
        function appearFrom(id) {
            return { x: function () { return fin(id).x; }, y: function () { return fin(id).y + 60; },
                     z: 0, rotationX: 0, rotationY: 0, rotation: 0, scale: 0.92, opacity: 0 };
        }
        function toExit(id, dur) {
            return { x: function () { return scat(id).x * 1.9; }, y: function () { return scat(id).y * 1.9; },
                     z: 650, scale: function () { return scat(id).scale * 1.5; }, opacity: 0,
                     duration: dur, ease: 'power2.in' };
        }

        var tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true,
                onUpdate: function (self) {
                    var p = self.progress;
                    stage.classList.toggle('is-moving', p > 0.1);
                    intro.inert = p > 0.16;
                }
            }
        });

        // ---- câmara: o mundo roda e aproxima-se ao longo do capítulo
        tl.fromTo(world, { rotationX: M ? 4 : 7, rotationY: M ? 0 : -9, scale: 0.94 },
                         { rotationX: 0, rotationY: 0, scale: 1.03, duration: 0.85 }, 0);

        // ---- texto de abertura sai; indicador de scroll desaparece
        tl.to(intro, { y: -80, opacity: 0, duration: 0.13, ease: 'power2.in' }, 0.07);
        if (cue) tl.to(cue, { opacity: 0, duration: 0.05 }, 0.02);

        // ---- peças do dashboard voam para o lugar
        var flights = M
            ? [['d-next', 0.14], ['d-algebra', 0.19], ['d-stats', 0.24], ['d-best', 0.29]]
            : [['d-sidebar', 0.12], ['d-next', 0.15], ['d-algebra', 0.18], ['d-week', 0.21], ['d-stats', 0.24], ['d-best', 0.27], ['d-pill', 0.30]];
        var DUR = 0.3, flying = {};
        flights.forEach(function (f) {
            flying[f[0]] = 1;
            tl.fromTo(frags[f[0]], fromVars(f[0]), toFinal(f[0], DUR), f[1]);
            var g = frags[f[0]].querySelector('.zs-frag__gleam b');
            tl.fromTo(g, { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.13, ease: 'none' }, f[1] + DUR - 0.04);
        });

        // ---- satélites (e peças sem lugar no mobile) passam pela câmara
        var ex = ids.filter(function (id) { return !flying[id] && SC[id]; });
        ex.forEach(function (id, i) {
            tl.fromTo(frags[id], fromVars(id), toExit(id, 0.34), 0.06 + i * 0.012);
        });

        // ---- peças que só aparecem na montagem
        var late = M ? [['d-title', 0.52], ['d-fab', 0.58]] : [['d-title', 0.50], ['d-draft', 0.53], ['d-fab', 0.57]];
        late.forEach(function (f) {
            tl.fromTo(frags[f[0]], appearFrom(f[0]), toFinal(f[0], 0.14), f[1]);
        });
        if (M) gsap.set(frags['d-draft'], { opacity: 0 });

        // ---- plano do dashboard + flash de luz (muda o ritmo)
        if (!M) tl.fromTo(plane, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.1, ease: 'power2.out' }, 0.48);
        tl.fromTo(flash, { opacity: 0 }, { opacity: 0.85, duration: 0.06, ease: 'power2.out' }, 0.50)
          .to(flash, { opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.56);

        // ---- luz de fundo acompanha o scroll
        tl.fromTo('.zs-blob--a', { xPercent: 0, yPercent: 0, scale: 1 }, { xPercent: 30, yPercent: 22, scale: 1.3, duration: 1 }, 0)
          .fromTo('.zs-blob--b', { xPercent: 0, yPercent: 0, scale: 1 }, { xPercent: -26, yPercent: -18, scale: 1.25, duration: 1 }, 0)
          .fromTo('.zs-blob--c', { scale: 0.8, opacity: 0.25 }, { scale: 1.4, opacity: 0.55, duration: 0.6 }, 0.1)
          ;


        // ---- saída: a câmara atravessa o ecrã e a luz apaga-se (entrada do Modo Foco)
        tl.to(world, { scale: 1.45, duration: 0.1, ease: 'power2.in' }, 0.9)
          .to(root.querySelector('.zs-dim'), { opacity: 1, duration: 0.08, ease: 'power1.in' }, 0.92);

        // ---- paralaxe ao rato (só desktop com rato)
        var offMove = null;
        if (!M && h.hover) {
            var rx = gsap.quickTo(par, 'rotationX', { duration: 0.9, ease: 'power3.out' });
            var ry = gsap.quickTo(par, 'rotationY', { duration: 0.9, ease: 'power3.out' });
            var onMove = function (e) {
                rx(((e.clientY / window.innerHeight) - 0.5) * -4);
                ry(((e.clientX / window.innerWidth) - 0.5) * 5);
            };
            stage.addEventListener('pointermove', onMove);
            offMove = function () { stage.removeEventListener('pointermove', onMove); };
        }

        return function () {
            ST.removeEventListener('refreshInit', measure);
            if (offMove) offMove();
            intro.inert = false;
            stage.classList.remove('is-moving');
        };
    }

    ZS.chapter('abertura', {
        desktop: function (root, h) { return build(root, h, false); },
        mobile:  function (root, h) { return build(root, h, true); }
    });
})();
