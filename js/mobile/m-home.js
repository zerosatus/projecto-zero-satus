/* Mobile · Home — o Dashboard real estilhaça-se numa "tempestade" de peças em torno do título e reorganiza-se, peça a peça,
   no ecrã Início completo (resolução nativa), que o scroll depois percorre. */
(function () {
    'use strict';
    ZM.chapter('abertura', function (C) {
        var tl = C.tl, g = C.gsap, asm = C.q('[data-id=home-asm]'), copy = C.q('.zm-copy');
        g.from(C.qa('.zm-copy .zm-line > span'), { yPercent: 115, duration: 0.95, stagger: 0.12, ease: 'power3.out', delay: 0.15 });
        g.from(C.qa('.zm-kick, .zm-lead, .zm-cta'), { y: 26, opacity: 0, duration: 0.8, stagger: 0.14, delay: 0.55, ease: 'power3.out' });
        g.fromTo(asm, { opacity: 0 }, { opacity: 1, duration: 1.2, delay: 0.5, ease: 'power2.out' });  // a tempestade surge ao carregar
        tl.to(copy, { y: -64, opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.09);
        C.storm(asm, 0.1, 0.27, { keep: true, part: 0.6 });
        C.steps([0.3, 0.52, 0.74], [0.52, 0.74, 0.93], { keepCopy: true });
        tl.to(asm, { y: function () { return -Math.max(0, asm.offsetHeight - (C.H() - asm.offsetTop) + 56); }, duration: 0.54, ease: 'none' }, 0.36);
        C.exit(0.92);
    });
})();
