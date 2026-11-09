/* Mobile · Modo Foco — o anel do temporizador entra primeiro, a rodar e a desenhar-se; depois os controlos reais voam de todos os
   lados e fixam-se à sua volta; cada passo realça um controlo; no fim o Estudo Online monta-se noutra cor. */
(function () {
    'use strict';
    ZM.chapter('foco', function (C) {
        var tl = C.tl, A = C.q('[data-id=foco-a]'), B = C.q('[data-id=foco-b]'), pg = C.qa('[data-id=foco-a] .zm-ping'), ring = C.piece(A, 'f-ring');
        ring.classList.add('zm-ring-mask');
        tl.fromTo(ring, { '--sw': '0%' }, { '--sw': '100%', duration: 0.1, ease: 'power1.inOut' }, 0.02);
        tl.to(C.q('.zm-copy'), { y: -64, opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.12);
        C.storm(A, 0.14, 0.2, { heroAt: 0.02, part: 0.6 });
        C.steps([0.36, 0.48, 0.6, 0.72, 0.84], [0.48, 0.6, 0.72, 0.84, 0.93], { keepCopy: true });
        C.ping(pg[0], 0.38, 0.47); C.ping(pg[1], 0.5, 0.59);
        C.pulse(ring, 0.61, 0.1, 1.07);
        C.pulse(C.pcs(A, { only: ['f-s1', 'f-s2', 'f-s3'] }), 0.73, 0.1, 1.08);
        C.scatter(A, 0.79, 0.06);
        tl.to(C.zm, { '--ga': 'rgba(245,158,11,0.38)', '--gb': 'rgba(251,146,60,0.22)', duration: 0.08 }, 0.8);
        C.storm(B, 0.82, 0.1, { heroAt: 0.8, part: 0.55 });
        C.exit(0.93);
    });
})();
