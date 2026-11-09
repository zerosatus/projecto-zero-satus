/* Capítulo 3 — Anotações · versão "cinematográfica"
   Ambiente claro e luminoso; a interface escura aparece em contraste e muito maior.
   WOW 1: quatro "notas" de cor (as cores das disciplinas) flutuam em 3D e voam para a lista, onde estouram
          em luz e passam a ser as notas reais.
   WOW 2: o texto é escrito por uma linha de luz com faíscas; o marcador pinta o destaque amarelo. */
(function () {
    'use strict';
    var ALL = ['nt-tool', 'nt-head', 'nt-plain', 'nt-lh', 'nt-sel', 'nt-1', 'nt-2', 'nt-3', 'nt-4'];
    var NOTE_COL = ['#f97316', '#ef4444', '#22c55e', '#3b6df0'];                         // oficinas, física 2, álgebra, cálculo 2
    var S = [0.28, 0.46, 0.74], E = [0.46, 0.74, 0.90];

    function build(root, h, M) {
        var gsap = h.gsap;
        var K = ZS.kit(root, h, M, 1076, 620), f = K.f;
        var title = root.querySelector('.zs-ftitle'), stepsOl = root.querySelector('.zs-steps');
        var steps = root.querySelectorAll('.zs-steps li'), pings = root.querySelectorAll('.zs-ping');
        var scan = root.querySelector('.zs-scan'), view = root.querySelector('.zs-view'), dim = root.querySelector('.zs-dim');
        var deco = root.querySelector('.zs-deco'), decoF = root.querySelector('.zs-deco--front'), shards = root.querySelectorAll('.zs-shard'), stickies = root.querySelectorAll('.zs-sticky');
        var plane = root.querySelector('.zs-plane2'), planeEd = root.querySelector('.zs-plane2--ed');
        var body = f('nt-plain'), inner = body.querySelector('.zs-frag__in'), hls = body.querySelectorAll('.zs-hl');
        function dx(k) { return function () { return K.vw * k; }; }
        // ponto da composição no ecrã (câmara em "home")
        function pt(px, py) {
            var v = root.querySelector('.zs-view').getBoundingClientRect(), s = K.stage.getBoundingClientRect();
            return { x: v.left - s.left + v.width / 2 + (px - K.cw / 2) * K.fit, y: v.top - s.top + v.height / 2 + (py - K.ch / 2) * K.fit };
        }
        function tagPt(k) { return pt(880, 193 + k * 101.5); }
        gsap.set(scan, { opacity: 0 });
        gsap.set(inner, { clipPath: 'inset(0 0 100% 0)' });
        gsap.set(hls, { clipPath: 'inset(0 100% 0 0)' });

        var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } });

        // ---------- entrada (a luz do Modo Foco continua aqui) ----------
        tl.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.04, ease: 'power2.out' }, 0.005)
          .to(title, { y: -30, opacity: 0, duration: 0.04, ease: 'power2.in' }, 0.075)
          .fromTo(plane, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.09, ease: 'power2.out' }, 0.085)
          .fromTo(planeEd, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.09, ease: 'power2.out' }, 0.095)
          .fromTo('.zs-nbg__a', { xPercent: -10, scale: 0.9 }, { xPercent: 12, scale: 1.2, duration: 1 }, 0)
          .fromTo('.zs-nbg__b', { xPercent: 8 }, { xPercent: -14, scale: 1.2, duration: 1 }, 0)
          .fromTo('.zs-nbg__c', { yPercent: 10, opacity: 0.6 }, { yPercent: -16, opacity: 1, duration: 1 }, 0);
        [].forEach.call(shards, function (el) {
            var s = parseFloat(el.dataset.s) || 1;
            tl.fromTo(el, { opacity: 0 }, { opacity: 0.9, duration: 0.08 }, 0.02)
              .fromTo(el, { y: 90 * s, rotationY: -30, rotationX: 14 }, { y: -170 * s, rotationY: 30, rotationX: -12, duration: 1 }, 0);
        });

        // ---------- a interface escura monta-se em contraste ----------
        var arrive = [
            ['nt-tool', 0.10, { y: -160, rotationX: -50, opacity: 0 }, 'power3.out'],
            ['nt-head', 0.115, { x: -320, rotationY: 40, opacity: 0 }, 'power3.out'],
            ['nt-lh', 0.13, { x: 240, opacity: 0 }, 'power3.out'],
            ['nt-sel', 0.14, { x: 240, opacity: 0 }, 'power3.out']
        ];
        arrive.forEach(function (a) {
            tl.fromTo(f(a[0]), a[2], { x: 0, y: 0, z: 0, rotationX: 0, rotationY: 0, scale: 1, opacity: 1, duration: 0.09, ease: a[3] }, a[1]);
            var g = f(a[0]).querySelector('.zs-frag__gleam b');
            if (g) tl.fromTo(g, { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.07 }, a[1] + 0.06);
        });
        tl.fromTo(body, { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power3.out' }, 0.12);

        // ---------- as quatro notas de cor voam para a lista e tornam-se as notas reais ----------
        [].forEach.call(stickies, function (el, k) {
            var W = function () { return K.stage.clientWidth; }, H = function () { return K.stage.clientHeight; };
            var start = [[0.07, 0.3], [0.9, 0.26], [0.1, 0.78], [0.9, 0.8]][k];
            var tgt = function () { var p = tagPt(k); return { x: p.x - 33, y: p.y - 33 }; };
            tl.fromTo(el, { x: function () { return start[0] * W() - 33; }, y: function () { return start[1] * H() - 33; }, z: -200 - k * 80, rotationX: 30, rotationY: -40 + k * 25, rotationZ: -20 + k * 14, scale: 1, opacity: 0 },
                          { x: function () { return start[0] * W() - 33 + (k % 2 ? -40 : 40); }, y: function () { return start[1] * H() - 33 - 70; }, z: 40, rotationX: -15, rotationY: 30 - k * 20, rotationZ: 10, opacity: 1, duration: 0.11, ease: 'sine.inOut' }, 0.03 + k * 0.01)
              .to(el, { x: function () { return tgt().x; }, y: function () { return tgt().y; }, z: 0, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 0.55, duration: 0.07, ease: 'power3.in' }, 0.16 + k * 0.016)
              .to(el, { opacity: 0, scale: 0.1, duration: 0.012 }, 0.23 + k * 0.016);
            tl.fromTo(f('nt-' + (k + 1)), { scale: 0.55, opacity: 0, z: -150 }, { scale: 1, opacity: 1, z: 0, duration: 0.05, ease: 'back.out(2.2)' }, 0.228 + k * 0.016);
        });

        // ---------- passos ----------
        tl.fromTo(stepsOl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, S[0] - 0.012);
        K.spot(tl, ALL, ['nt-lh', 'nt-sel', 'nt-1', 'nt-2', 'nt-3', 'nt-4'], S[0], 0.45);
        tl.fromTo(pings, { opacity: 0, scale: 1.7 }, { opacity: 1, scale: 1, duration: 0.03, stagger: 0.012, ease: 'back.out(2)' }, S[0] + 0.02)
          .to(pings, { opacity: 0, duration: 0.02 }, E[0] - 0.02);
        K.spot(tl, ALL, ['nt-tool', 'nt-head', 'nt-plain'], S[1], 0.4);
        // escrita: a linha de luz revela o texto; o marcador pinta o destaque
        var T0 = S[1] + 0.03, T1 = S[1] + 0.23;
        tl.fromTo(inner, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: T1 - T0, ease: 'none' }, T0)
          .fromTo(scan, { y: 330, opacity: 1 }, { y: 618, opacity: 1, duration: T1 - T0, ease: 'none', immediateRender: false }, T0)
          .to(scan, { opacity: 0, duration: 0.01 }, T1)
          .fromTo(hls[0], { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.035, ease: 'power2.inOut' }, S[1] + 0.07)
          .fromTo(hls[1], { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.035, ease: 'power2.inOut' }, S[1] + 0.098);
        K.spot(tl, ALL, ['nt-sel', 'nt-lh', 'nt-1', 'nt-2', 'nt-3', 'nt-4'], S[2], 0.45);

        // ---------- câmara ----------
        function camTo(target, at, dur) { tl.to(K.rig, Object.assign({}, target, { duration: dur || 0.06, ease: 'power2.inOut' }), at); }
        if (!M) {
            camTo(K.cam(956, 300, 1.45, true, dx(-0.05)), S[0] - 0.01);
            camTo(K.cam(420, 300, 1.25, true, dx(0.07)), S[1], 0.05); camTo(K.cam(420, 440, 1.25, true, dx(0.07)), S[1] + 0.12, 0.1);
            camTo(K.cam(956, 130, 1.7, true, dx(-0.05)), S[2], 0.05);
        } else {
            camTo(K.cam(956, 285, 1.05), S[0] - 0.01);
            camTo(K.cam(300, 330, 0.8), S[1], 0.04); camTo(K.cam(300, 500, 0.8), S[1] + 0.12, 0.1);
            camTo(K.cam(956, 120, 1.0), S[2]);
        }
        S.forEach(function (st, i) { K.step(tl, steps[i], st, E[i], i === 2); });

        // ---------- efeitos ----------
        var fx = K.fx(tl, { blend: 'source-over' });
        function hlEnds() { return [].map.call(hls, function (el) { var r = el.getBoundingClientRect(), s = K.stage.getBoundingClientRect(); return { x: r.right - s.left, y: r.top - s.top + r.height / 2, c: '#facc15' }; }); }
        fx.add({ type: 'dust', n: 70, speed: 90, colors: ['#8b5cf6', '#ec4899', '#a78bfa'] })
          .add({ type: 'burst', t0: 0.228, dt: 0.016, dur: 0.06, r: 64, m: 18, colors: NOTE_COL, pts: function () { return [0, 1, 2, 3].map(function (k) { var p = tagPt(k); p.c = NOTE_COL[k]; return p; }); } })
          .add({ type: 'emit', t0: T0, t1: T1, life: 0.07, n: 160, colors: ['#7c3aed', '#ec4899', '#f59e0b', '#3b82f6'], rect: function () { return K.rect('nt-plain'); } })
          .add({ type: 'burst', t0: S[1] + 0.1, dt: 0.028, dur: 0.045, r: 44, m: 14, colors: ['#facc15'], pts: hlEnds });

        // ---------- saída: do claro de volta ao escuro da página ----------
        tl.to([title, stepsOl, deco, decoF], { opacity: 0, duration: 0.05 }, 0.93)
          .to(view, { opacity: 0, scale: 0.94, duration: 0.07, ease: 'power2.in' }, 0.92)
          .fromTo(dim, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(85% at 50% 50%)', duration: 0.07, ease: 'power2.in' }, 0.93);
        return function () { K.dispose(); };
    }
    ZS.chapter('anotacoes', { desktop: function (r, h) { return build(r, h, false); }, mobile: function (r, h) { return build(r, h, true); } });
})();
