/* Capítulo 2 — Modo Foco
   Ecrã quase negro → o temporizador acende-se → a interface real organiza-se
   à volta → 4 passos em destaque (disciplina, bloco, foco, progresso) →
   o ambiente dissolve-se no resto da página.
   Tudo o que se mostra existe no produto (ver screenshot do Modo Foco). */
(function () {
    'use strict';

    var SHADOW0 = '0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(196,181,253,0.1), 0 0 0 rgba(245,158,11,0)';
    var SHADOW1 = '0 30px 80px -30px rgba(0,0,0,0.9), 0 0 0 1px rgba(245,185,74,0.75), 0 0 60px rgba(245,158,11,0.4)';
    var S = [0.30, 0.45, 0.60, 0.78], E = [0.45, 0.60, 0.78, 0.92];
    var MK = { 'f-disc3': 0.9, 'f-mode': 0.9, 's-total': 0.95, 'f-seq': 0.95 };      // escala mobile
    var RIGHT = ['f-sound', 's-sessions', 's-total', 'f-seq', 'f-log'];
    // centro vertical de cada peça da coluna direita (desktop), medido a partir do topo da pilha (428px)
    var RY = { 'f-sound': 13.5, 's-sessions': 86.5, 's-total': 191, 'f-seq': 287, 'f-log': 383 };

    function build(root, h, M) {
        var gsap = h.gsap, ST = h.ST;
        var stage = root.querySelector('.zs-stage'), world = root.querySelector('.zs-world');
        var ring = root.querySelector('.zs-ring'), arc = root.querySelector('.zs-ring__arc');
        var disc = root.querySelector('.zs-ring__disc'), inner = root.querySelector('.zs-ring__in');
        var pill = root.querySelector('.zs-ring__pill'), ctrl = root.querySelector('.zs-ring__ctrl');
        var title = root.querySelector('.zs-ftitle'), lead = title.querySelector('p');
        var steps = root.querySelectorAll('.zs-steps li');
        var ripples = [].slice.call(root.querySelectorAll('.zs-ripple'));
        var vig = root.querySelector('.zs-vig'), fbg = root.querySelector('.zs-fbg');
        var glowA = root.querySelector('.zs-fbg__a'), glowB = root.querySelector('.zs-fbg__b');
        var frags = {};
        [].forEach.call(root.querySelectorAll('.zs-frag'), function (el) { frags[el.dataset.id] = el; });
        var ids = Object.keys(frags);
        var L = { W: 0, H: 0, D: 300, k: 1, oy: 0, zc: 0 };

        function measure() {
            L.W = stage.clientWidth; L.H = stage.clientHeight;
            if (M) {
                L.D = Math.min(L.W * 0.6, 230); L.k = 1;
                L.oy = 185 + 0.68 * L.D - L.H / 2;
                L.zc = ((185 + 1.36 * L.D + 14) + (L.H - 160)) / 2 - L.H / 2;
            } else {
                L.D = Math.min(L.H * 0.41, L.W * 0.28);
                L.k = Math.min(1, L.W / 1440, (L.H - 330) / 522);
                L.oy = 55;
            }
            ring.style.setProperty('--d', L.D + 'px');
            var discY = L.oy - 1.4 * (L.D / 20);
            gsap.set(ring, { y: L.oy });
            ripples.forEach(function (r) {
                r.style.width = r.style.height = L.D + 'px';
                gsap.set(r, { xPercent: -50, yPercent: -50, y: discY });
            });
            ids.forEach(function (id) {
                var el = frags[id], k = M ? (MK[id] || 1) : L.k;
                el.style.width = (el.dataset.w * k) + 'px';
                el.style.setProperty('--r', (el.dataset.r * k) + 'px');
            });
        }
        measure();
        ST.addEventListener('refreshInit', measure);
        gsap.set(ring, { xPercent: -50, yPercent: -50 });
        gsap.set(ids.map(function (i) { return frags[i]; }), { xPercent: -50, yPercent: -50 });
        ids.forEach(function (id, i) {
            var f = frags[id].querySelector('.zs-frag__in');
            f.style.animation = 'none';
        });

        // posição final de cada peça (centro, relativa ao centro do palco)
        function fin(id) {
            var k = L.k, D = L.D;
            if (M) return { x: 0, y: L.zc + (id === 's-total' ? -46 : id === 'f-seq' ? 46 : 0) };
            var lx = -(D / 2 + 60 + 143.5 * k), rx = D / 2 + 60 + 135.5 * k;
            if (id === 'f-disc') return { x: lx, y: L.oy + (-262 + 172) * k };
            if (id === 'f-mode') return { x: lx, y: L.oy + (-262 + 344 + 16 + 82) * k };
            if (id === 'f-sound') return { x: rx + 70.5 * k, y: L.oy + (-214 + RY[id]) * k };
            return { x: rx, y: L.oy + (-214 + RY[id]) * k };
        }

        var tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true }
        });

        // ---------- 0–0.10  ignição: o anel desenha-se no escuro ----------
        gsap.set(ripples, { opacity: 0 });
        tl.fromTo(world, { scale: 0.9 }, { scale: 1, duration: 0.18, ease: 'power2.out' }, 0)
          .fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.07, ease: 'power2.out' }, 0.005)
          .fromTo(ring, { scale: 0.55, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.1, ease: 'power2.out' }, 0)
          .fromTo(arc, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.11, ease: 'power2.inOut' }, 0)
          .fromTo(inner, { opacity: 0 }, { opacity: 1, duration: 0.05 }, 0.07)
          .fromTo([pill, ctrl], { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.05, stagger: 0.015 }, 0.08)
          .fromTo(disc, { '--glow': 0.05 }, { '--glow': 0.35, duration: 0.1 }, 0.02);

        // ---------- 0.10–0.28  a interface real organiza-se à volta ----------
        if (!M) {
            var arrive = [['f-disc', 0.10, -1], ['f-mode', 0.14, -1], ['f-sound', 0.16, 1], ['s-sessions', 0.17, 1],
                          ['s-total', 0.19, 1], ['f-seq', 0.21, 1], ['f-log', 0.23, 1]];
            arrive.forEach(function (a) {
                var id = a[0], dir = a[2], el = frags[id];
                tl.fromTo(el,
                    { x: function () { return fin(id).x + dir * L.W * 0.6; }, y: function () { return fin(id).y; },
                      z: -400, rotationY: -dir * 55, scale: 0.8, opacity: 0 },
                    { x: function () { return fin(id).x; }, y: function () { return fin(id).y; },
                      z: 0, rotationY: 0, scale: 1, opacity: 1, duration: 0.13, ease: 'power3.out' }, a[1]);
                var g = el.querySelector('.zs-frag__gleam b');
                tl.fromTo(g, { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.1, ease: 'none' }, a[1] + 0.1);
            });
            gsap.set(frags['f-disc3'], { opacity: 0 });
        } else {
            ['f-disc', 'f-sound', 's-sessions', 'f-log'].forEach(function (id) { gsap.set(frags[id], { opacity: 0 }); });
        }

        // ---------- 0.30–0.92  quatro passos, cada um com o seu ambiente ----------
        var ringTo = [{ s: M ? 0.95 : 0.86, o: M ? 0.85 : 0.5, g: 0.35 }, { s: M ? 0.95 : 0.86, o: M ? 0.85 : 0.5, g: 0.35 },
                      { s: M ? 1.06 : 1.0, o: 1, g: 0.95 }, { s: M ? 0.92 : 0.9, o: M ? 0.75 : 0.6, g: 0.4 }];
        var vigTo = [0.3, 0.3, 0.88, 0.4];
        S.forEach(function (st, i) {
            tl.to(ring, { scale: ringTo[i].s, opacity: ringTo[i].o, duration: 0.05, ease: 'power2.inOut' }, st)
              .to(disc, { '--glow': ringTo[i].g, '--gs': i === 2 ? 1.25 : 1, duration: 0.05 }, st)
              .to(vig, { opacity: vigTo[i], duration: 0.06 }, st)
              .fromTo(steps[i], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.04, ease: 'power2.out' }, st + 0.005)
              .to(steps[i], { opacity: i === 3 ? 1 : 0, y: i === 3 ? 0 : -12, duration: 0.03 }, E[i] - 0.03);
        });
        tl.to(glowA, { opacity: 0.95, scale: 1.3, duration: 0.5 }, 0.3).to(glowB, { opacity: 0.2, duration: 0.5 }, 0.3);

        // ondas a partir do anel (passo 3: foco)
        ripples.forEach(function (r, i) {
            tl.fromTo(r, { scale: 0.95, opacity: 0.6 }, { scale: 2.4, opacity: 0, duration: 0.15, ease: 'power1.out', immediateRender: false }, 0.61 + i * 0.045);
        });

        if (!M) {
            // desktop: destaque âmbar na peça do passo; o resto recua
            var groups = [['f-disc'], ['f-mode'], [], RIGHT];
            ids.forEach(function (id) {
                if (id === 'f-disc3') return;
                var el = frags[id], box = el.querySelector('.zs-frag__in'), side = RIGHT.indexOf(id) >= 0 ? 1 : -1;
                S.forEach(function (st, i) {
                    var on = groups[i].indexOf(id) >= 0, ringStep = i === 2;
                    tl.to(el, {
                        scale: on ? 1.08 : (ringStep ? 0.92 : 0.96),
                        opacity: on ? 1 : (ringStep ? 0.14 : 0.3),
                        x: function () { return fin(id).x + (ringStep ? side * 36 : 0); },
                        duration: 0.05, ease: 'power2.inOut'
                    }, st);
                    tl.to(box, { boxShadow: on ? SHADOW1 : SHADOW0, duration: 0.05 }, st);
                });
            });
        } else {
            // mobile: um cartão de cada vez sobe de baixo para a zona sob o anel
            var seq = [['f-disc3', 0], ['f-mode', 1], ['s-total', 3], ['f-seq', 3]];
            tl.to(lead, { opacity: 0, duration: 0.03 }, 0.27);
            seq.forEach(function (q, n) {
                var id = q[0], i = q[1], el = frags[id];
                tl.fromTo(el,
                    { x: 0, y: function () { return fin(id).y + 300; }, rotationX: 30, z: -80, scale: 0.9, opacity: 0 },
                    { y: function () { return fin(id).y; }, rotationX: 0, z: 0, scale: 1, opacity: 1, duration: 0.05, ease: 'power3.out' }, S[i] + (id === 'f-seq' ? 0.025 : 0));
                if (i !== 3) tl.to(el, { y: function () { return fin(id).y - 70; }, opacity: 0, scale: 0.94, duration: 0.04, ease: 'power2.in' }, E[i] - 0.04);
                tl.fromTo(el.querySelector('.zs-frag__gleam b'), { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.06 }, S[i] + 0.045);
            });
        }

        // ---------- 0.92–1.0  o ambiente dissolve-se ----------
        tl.to([world, title, root.querySelector('.zs-steps')], { opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.93)
          .to(world, { scale: 1.45, duration: 0.08, ease: 'power2.in' }, 0.92)
          .to(fbg, { opacity: 0, duration: 0.08, ease: 'power1.in' }, 0.93)
          .fromTo(root.querySelector('.zs-lightup'), { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(85% at 50% 50%)', duration: 0.07, ease: 'power2.in' }, 0.93);

        return function () { ST.removeEventListener('refreshInit', measure); };
    }

    ZS.chapter('foco', {
        desktop: function (root, h) { return build(root, h, false); },
        mobile:  function (root, h) { return build(root, h, true); }
    });
})();
