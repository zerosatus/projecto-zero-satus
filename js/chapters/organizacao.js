/* Capítulo 1 — Organização (Tarefas → Calendário) · versão "cinematográfica"
   Interface grande (a janela ocupa quase todo o palco) + câmara que aproxima cada zona.
   WOW 1: um enxame de luz, nas cores das disciplinas, gira e converge para formar a lista de tarefas.
   WOW 2: as tarefas desfazem-se em energia que atravessa o ecrã e se condensa nos eventos do calendário
          (as mesmas cores de disciplina), cada um a estourar em anéis de luz.
   WOW 3: um cometa percorre a semana de exames e acende cada exame. */
(function () {
    'use strict';
    var TK = ['tk-panel', 'tk-st1', 'tk-st2', 'tk-st3', 'tk-btn', 'tk-filt', 'tk-disc', 'tk-c1', 'tk-c2', 'tk-c3', 'tk-c4'];
    var EV = []; for (var i = 1; i <= 10; i++) EV.push('cl-ev' + i);
    var CL = ['cl-grid', 'cl-bar', 'cl-day'];
    var CARD_COL = ['#22c55e', '#ff2bd6', '#22d3ee', '#ef4444'];                       // álgebra, ética, desenho, física 2
    var CHIP_COL = ['#8b5cf6', '#3b6df0', '#ef4444', '#ff2bd6', '#22d3ee', '#3b6df0', '#ef4444', '#22c55e', '#ff2bd6', '#22d3ee'];
    var S = [0.26, 0.36, 0.46, 0.64, 0.74, 0.84], E = [0.36, 0.46, 0.54, 0.74, 0.84, 0.92];

    function build(root, h, M) {
        var gsap = h.gsap;
        var K = ZS.kit(root, h, M, 1106, 630), f = K.f;
        var ct = root.querySelector('.zs-comp--t'), cc = root.querySelector('.zs-comp--c');
        var title = root.querySelector('.zs-ftitle'), stepsOl = root.querySelector('.zs-steps');
        var steps = root.querySelectorAll('.zs-steps li'), pings = root.querySelectorAll('.zs-ping');
        var dims = root.querySelectorAll('.zs-dim'), dimIn = dims[0], dimOut = dims[1];
        var view = root.querySelector('.zs-view'), deco = root.querySelector('.zs-deco');
        var shards = root.querySelectorAll('.zs-shard');
        function dx(k) { return function () { return K.vw * (k === undefined ? 0.07 : k); }; }

        var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } });

        // ---------- entrada: do escuro para o ambiente violeta ----------
        tl.fromTo(dimIn, { opacity: 1 }, { opacity: 0, duration: 0.06, ease: 'power1.out' }, 0)
          .fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.05, ease: 'power2.out' }, 0.01)
          .to(title, { y: -30, opacity: 0, duration: 0.05, ease: 'power2.in' }, 0.15)
          .fromTo('.zs-ch1 .zs-comp--t .zs-plane2', { opacity: 0, scale: 0.92 }, { opacity: 1, scale: 1, duration: 0.09, ease: 'power2.out' }, 0.03)
          .fromTo('.zs-ch1 .zs-obg__a', { scale: 0.8, opacity: 0.6 }, { scale: 1.5, opacity: 1, duration: 1 }, 0);
        // decoração 3D em parallax (profundidade)
        [].forEach.call(shards, function (el) {
            var s = parseFloat(el.dataset.s) || 1;
            tl.fromTo(el, { opacity: 0 }, { opacity: 0.85, duration: 0.08 }, 0.02)
              .fromTo(el, { y: 90 * s, rotationY: -30, rotationX: 14 }, { y: -170 * s, rotationY: 30, rotationX: -12, duration: 1 }, 0);
        });

        // ---------- tarefas: materializam-se onde o enxame chega ----------
        var pop = { scale: 0.6, opacity: 0, z: -220 };
        var arrive = [
            ['tk-panel', 0.06, { scale: 0.9, opacity: 0, z: -300 }, 'power3.out', 0.1],
            ['tk-st1', 0.09, { scale: 0.6, opacity: 0, z: -220, rotationX: -35 }, 'back.out(1.7)', 0.07],
            ['tk-st2', 0.10, { scale: 0.6, opacity: 0, z: -220, rotationX: -35 }, 'back.out(1.7)', 0.07],
            ['tk-st3', 0.11, { scale: 0.6, opacity: 0, z: -220, rotationX: -35 }, 'back.out(1.7)', 0.07],
            ['tk-btn', 0.115, { x: -140, scale: 0.7, opacity: 0 }, 'back.out(1.6)', 0.07],
            ['tk-filt', 0.125, { x: -160, scale: 0.7, opacity: 0, z: -150 }, 'back.out(1.5)', 0.08],
            ['tk-disc', 0.135, { x: -160, scale: 0.7, opacity: 0, z: -150 }, 'back.out(1.5)', 0.08],
            ['tk-c1', 0.14, { y: 70, scale: 0.7, opacity: 0, z: -200, rotationX: 22 }, 'back.out(1.5)', 0.07],
            ['tk-c2', 0.16, { y: 70, scale: 0.7, opacity: 0, z: -200, rotationX: 22 }, 'back.out(1.5)', 0.07],
            ['tk-c3', 0.18, { y: 70, scale: 0.7, opacity: 0, z: -200, rotationX: 22 }, 'back.out(1.5)', 0.07],
            ['tk-c4', 0.20, { y: 70, scale: 0.7, opacity: 0, z: -200, rotationX: 22 }, 'back.out(1.5)', 0.07]
        ];
        arrive.forEach(function (a) {
            var el = f(a[0]);
            tl.fromTo(el, a[2], { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, opacity: 1, duration: a[4], ease: a[3] }, a[1]);
            var g = el.querySelector('.zs-frag__gleam b');
            if (g) tl.fromTo(g, { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.07 }, a[1] + a[4] - 0.02);
        });
        tl.fromTo(stepsOl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, S[0] - 0.012);

        // ---------- passos 1–3 ----------
        K.spot(tl, TK, ['tk-c1', 'tk-c2', 'tk-c3', 'tk-c4'], S[0]);
        tl.fromTo(pings, { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.03, stagger: 0.008, ease: 'back.out(2)' }, S[0] + 0.02)
          .to(pings, { opacity: 0, duration: 0.02 }, E[0] - 0.02);
        K.spot(tl, TK, ['tk-st1', 'tk-st2', 'tk-st3'], S[1]);
        K.spot(tl, TK, ['tk-filt', 'tk-disc', 'tk-btn'], S[2]);

        // ---------- transição: a energia das tarefas atravessa o ecrã e vira calendário ----------
        tl.to(ct, { z: -900, rotationX: 14, scale: 1.08, opacity: 0, duration: 0.1, ease: 'power2.in' }, 0.56)
          .fromTo(cc, { z: 500, scale: 0.92, rotationX: -10, opacity: 0 }, { z: 0, scale: 1, rotationX: 0, opacity: 1, duration: 0.1, ease: 'power2.out' }, 0.60)
          .to('.zs-ch1 .zs-obg__b', { opacity: 1, duration: 0.1 }, 0.54)
          .to('.zs-ch1 .zs-obg__v', { opacity: 0, duration: 0.1 }, 0.54)
          .fromTo('.zs-ch1 .zs-sweep', { xPercent: -120, opacity: 1 }, { xPercent: 120, opacity: 1, duration: 0.1 }, 0.58)
          .to('.zs-ch1 .zs-sweep', { opacity: 0, duration: 0.01 }, 0.69);
        gsap.set(EV.map(f), { opacity: 0 });

        // ---------- calendário: os eventos reais condensam-se nas datas ----------
        K.spot(tl, CL, CL, S[3], 1);
        EV.forEach(function (id, n) {
            tl.fromTo(f(id), { scale: 0.2, y: -50, z: 220, opacity: 0 }, { scale: 1, y: 0, z: 0, opacity: 1, duration: 0.03, ease: 'back.out(2.4)' }, 0.63 + n * 0.0065);
        });
        K.spot(tl, CL.concat(EV), ['cl-ev6', 'cl-ev7', 'cl-ev8', 'cl-ev9', 'cl-ev10'], S[4]);
        K.spot(tl, CL.concat(EV), ['cl-day'], S[5]);

        // ---------- câmara: aproxima cada zona (desktop) / percorre a interface em zoom (mobile) ----------
        function camTo(target, at, dur) { tl.to(K.rig, Object.assign({}, target, { duration: dur || 0.06, ease: 'power2.inOut' }), at); }
        if (!M) {
            camTo(K.cam(640, 430, 1.3, true, dx()), S[0] - 0.01);
            camTo(K.cam(553, 70, 1.22, true, dx()), S[1], 0.05);
            camTo(K.cam(130, 390, 1.65, true, dx(0.1)), S[2], 0.05);
            camTo(K.home(0), 0.54, 0.07);
            camTo(K.cam(553, 315, 1.0, true, dx(), -8), S[3], 0.05);
            camTo(K.cam(555, 359, 1.6, true, dx()), S[4], 0.06);
            camTo(K.cam(553, 560, 1.45, true, dx()), S[5], 0.06);
        } else {
            camTo(K.cam(470, 425, 1.05), S[0] - 0.01);
            camTo(K.cam(179, 42, 1.15), S[1], 0.03); camTo(K.cam(553, 42, 1.15), S[1] + 0.035, 0.03); camTo(K.cam(927, 42, 1.15), S[1] + 0.07, 0.03);
            camTo(K.cam(112, 367, 1.0), S[2]);
            camTo(K.home(0), 0.54, 0.06);
            camTo(K.cam(300, 170, 0.95), S[3]);
            camTo(K.cam(250, 359, 1.1), S[4], 0.04); camTo(K.cam(850, 359, 1.1), S[4] + 0.05, 0.04);
            camTo(K.cam(400, 571, 1.05), S[5]);
        }
        S.forEach(function (st, i) { K.step(tl, steps[i], st, E[i], i === 5); });

        // ---------- efeitos de luz ----------
        var fx = K.fx(tl);
        function cardPts() { var o = []; ['tk-c1', 'tk-c2', 'tk-c3', 'tk-c4'].forEach(function (id, j) { [0.06, 0.3, 0.55, 0.8].forEach(function (x) { o.push(K.anchor(id, x, 0.5, CARD_COL[j])); }); }); return o; }
        function uiPts() {
            var o = [K.anchor('tk-st1', 0.2, 0.5, '#3b82f6'), K.anchor('tk-st2', 0.2, 0.5, '#10b981'), K.anchor('tk-st3', 0.2, 0.5, '#ef4444'), K.anchor('tk-btn', 0.5, 0.5, '#a855f7')];
            [0.15, 0.5, 0.85].forEach(function (y) { o.push(K.anchor('tk-filt', 0.5, y, '#a78bfa')); });
            [0.12, 0.3, 0.48, 0.66, 0.84].forEach(function (y, k) { o.push(K.anchor('tk-disc', 0.12, y, CARD_COL[k % 4])); });
            return o;
        }
        function chipPts(x) { return EV.map(function (id, i) { return K.anchor(id, x === undefined ? 0.5 : x, 0.5, CHIP_COL[i]); }); }
        fx.add({ type: 'dust', n: 80, speed: 150, colors: ['#c4b5fd', '#f0abfc', '#93c5fd'] })
          .add({ type: 'flow', t0: 0.02, t1: 0.2, n: 280, colors: ['#c4b5fd', '#f0abfc'], swirl: { r: 0.46, spin: 5 }, curve: 0.5,
                src: function () { return [{ x: 0, y: 0 }]; }, dst: function () { return cardPts().concat(cardPts(), uiPts()); } })
          .add({ type: 'flow', t0: 0.55, t1: 0.7, n: 340, colors: ['#fff'], curve: 0.75, src: cardPts, dst: function () { return chipPts(); } })
          .add({ type: 'burst', t0: 0.63, dt: 0.0065, dur: 0.05, r: 48, m: 14, colors: ['#fff'], pts: function () { return chipPts(); } })
          .add({ type: 'path', t0: S[4] + 0.012, t1: S[4] + 0.075, n: 48, gap: 7, size: 4.4, colors: ['#ffffff', '#c4b5fd', '#67e8f9'],
                pts: function () { var a = chipPts(); var p = [K.anchor('cl-ev6', -0.35, 0.5)]; a.slice(5).forEach(function (q) { p.push(q); }); p.push(K.anchor('cl-ev10', 1.35, 0.5)); return p; } })
          .add({ type: 'burst', t0: S[4] + 0.026, dt: 0.0135, dur: 0.045, r: 56, m: 16, colors: ['#fff'], pts: function () { return chipPts().slice(5); } });

        // ---------- saída: apaga-se a luz (o Modo Foco começa no escuro) ----------
        tl.to([title, stepsOl, deco], { opacity: 0, duration: 0.05 }, 0.93)
          .to(view, { opacity: 0, scale: 0.92, duration: 0.07, ease: 'power2.in' }, 0.92)
          .to(dimOut, { opacity: 1, duration: 0.07, ease: 'power1.in' }, 0.93);

        return function () { K.dispose(); };
    }
    ZS.chapter('organizacao', { desktop: function (r, h) { return build(r, h, false); }, mobile: function (r, h) { return build(r, h, true); } });
})();
