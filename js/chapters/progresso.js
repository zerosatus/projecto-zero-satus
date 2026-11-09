/* Capítulo 4 — Progresso (desktop)
   O Dashboard real é desmontado em peças: o gráfico semanal ergue-se do fundo e as barras reais
   crescem uma a uma (a de hoje acende-se) → o total da semana chega pela direita → o gráfico recua
   e o Desempenho por Disciplina avança, com cada barra a encher na cor da sua disciplina →
   por fim os números de relance (melhor dia, disciplinas, dias seguidos).
   Só se mostra o que existe no Dashboard. Não há relações inventadas entre cartões:
   "17h 25min" (tempo total da semana) e "9h 50min" (rascunho semanal) aparecem cada um no seu cartão.
   Mobile: ver js/mobile/m-progresso.js (cena própria, com o telemóvel Android). */
(function () {
    'use strict';
    var S = [0.18, 0.38, 0.58, 0.78], E = [0.38, 0.58, 0.78, 0.93];
    var ALL = ['p-chart', 'p-total', 'p-perf'];

    function build(root, h) {
        var gsap = h.gsap;
        var K = ZS.kit(root, h, false, 1100, 700), f = K.f;
        var title = root.querySelector('.zs-ftitle'), stepsOl = root.querySelector('.zs-steps'), steps = root.querySelectorAll('.zs-steps li');
        var view = root.querySelector('.zs-view'), bars = view.querySelectorAll('.zs-pbar'), fills = view.querySelectorAll('.zs-pfill');
        var scan = view.querySelector('.zs-pscan'), ping = view.querySelector('.zs-ping'), pbg = root.querySelector('.zs-pbg');
        var bgA = root.querySelector('.zs-pbg__a'), bgB = root.querySelector('.zs-pbg__b');
        var head = f('p-head');
        function dx(k) { return function () { return K.vw * (k === undefined ? 0.07 : k); }; }

        var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } });

        // ---------- entrada: título, e o gráfico semanal ergue-se do fundo ----------
        tl.fromTo(title, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.05, ease: 'power2.out' }, 0.01)
          .to(title, { y: -30, opacity: 0, duration: 0.05, ease: 'power2.in' }, 0.15)
          .fromTo(f('p-chart'), { z: -420, rotationX: 28, y: 90, scale: 0.9, opacity: 0 }, { z: 0, rotationX: 0, y: 0, scale: 1, opacity: 1, duration: 0.13, ease: 'power3.out' }, 0.02)
          .fromTo(head, { y: -18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.06, ease: 'power2.out' }, 0.08)
          .to(bgA, { scale: 1.45, duration: 1 }, 0)
          .to(bgB, { opacity: 1, duration: 0.12 }, S[2] - 0.03).to(bgB, { opacity: 0.35, duration: 0.1 }, S[3]);
        tl.fromTo(stepsOl, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.03, ease: 'power2.out' }, S[0] - 0.012);

        // ---------- passo 1: as barras reais crescem, dia a dia ----------
        [].forEach.call(bars, function (b, i) {
            tl.fromTo(b, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.055, ease: 'power3.out' }, S[0] + 0.012 + i * 0.02);
        });
        tl.fromTo(scan, { left: '2%', opacity: 0 }, { left: '98%', opacity: 1, duration: 0.17, ease: 'none' }, S[0] + 0.005)
          .to(scan, { opacity: 0, duration: 0.02 }, S[0] + 0.175)
          .fromTo(ping, { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.03, ease: 'back.out(2)' }, 0.34)
          .to(ping, { opacity: 0, duration: 0.02 }, E[0] - 0.02);
        K.spot(tl, ALL, ['p-chart'], S[0], 1);

        // ---------- passo 2: o total da semana chega pela direita ----------
        tl.fromTo(f('p-total'), { x: 300, z: -520, rotationY: -40, scale: 0.8, opacity: 0 }, { x: 0, z: 0, rotationY: 0, scale: 1, opacity: 1, duration: 0.09, ease: 'back.out(1.25)' }, S[1] - 0.012);
        tl.fromTo(f('p-total').querySelector('.zs-frag__gleam b'), { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.07 }, S[1] + 0.05);
        K.spot(tl, ALL, ['p-total'], S[1] + 0.02, 0.35);
        tl.to(head, { opacity: 0.35, duration: 0.04 }, S[1] + 0.02);

        // ---------- passo 3: o gráfico recua, o desempenho por disciplina avança ----------
        tl.fromTo(f('p-perf'), { y: 150, z: 380, rotationX: -14, scale: 0.92, opacity: 0 }, { y: 0, z: 0, rotationX: 0, scale: 1, opacity: 1, duration: 0.09, ease: 'power3.out' }, S[2] - 0.02);
        tl.to(f('p-chart'), { z: -260, duration: 0.07, ease: 'power2.inOut' }, S[2] - 0.01)
          .to(f('p-total'), { z: -140, duration: 0.07, ease: 'power2.inOut' }, S[2] - 0.01);
        K.spot(tl, ALL, ['p-perf'], S[2] + 0.005, 0.12);
        tl.to(head, { opacity: 0.12, duration: 0.04 }, S[2] + 0.005);
        [].forEach.call(fills, function (el, i) {
            tl.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.05, ease: 'power3.out' }, S[2] + 0.022 + i * 0.026);
        });
        tl.fromTo(f('p-perf').querySelector('.zs-frag__gleam b'), { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.07 }, S[2] + 0.015);

        // ---------- passo 4: os números de relance ----------
        tl.to([f('p-chart'), f('p-total'), f('p-perf'), head], { opacity: 0, scale: 0.9, duration: 0.05, ease: 'power2.in' }, S[3] - 0.015);
        ['p-best', 'p-tile6', 'p-streak'].forEach(function (id, i) {
            tl.fromTo(f(id), { y: 130, z: -320, rotationX: 26, scale: 0.85, opacity: 0 }, { y: 0, z: 0, rotationX: 0, scale: 1, opacity: 1, duration: 0.07, ease: 'power3.out' }, S[3] - 0.005 + i * 0.03);
            tl.fromTo(f(id).querySelector('.zs-frag__gleam b'), { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.06 }, S[3] + 0.05 + i * 0.03);
        });

        // ---------- câmara ----------
        function camTo(target, at, dur) { tl.to(K.rig, Object.assign({}, target, { duration: dur || 0.06, ease: 'power2.inOut' }), at); }
        camTo(K.cam(550, 165, 1.18, true, dx()), S[0] - 0.015);
        camTo(K.cam(900, 420, 1.6, true, dx(0.08)), S[1] - 0.01, 0.07);
        camTo(K.cam(385, 500, 1.3, true, dx(0.12)), S[2] - 0.015, 0.07);
        camTo(K.cam(480, 405, 1.5, true, dx(0.09)), S[3] - 0.01, 0.07);
        S.forEach(function (st, i) { K.step(tl, steps[i], st, E[i], i === 3); });

        // ---------- saída: dissolve para o escuro (o Blog entra a seguir) ----------
        tl.to([title, stepsOl], { opacity: 0, duration: 0.05 }, 0.94)
          .to(view, { opacity: 0, scale: 0.94, duration: 0.06, ease: 'power2.in' }, 0.935)
          .to(pbg, { opacity: 0, duration: 0.06 }, 0.94);

        return function () { K.dispose(); };
    }
    ZS.chapter('progresso', { desktop: function (r, h) { return build(r, h); } });
})();
