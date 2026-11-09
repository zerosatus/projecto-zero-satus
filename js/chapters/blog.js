/* Blog — revista digital. Cada artigo é uma "página": a anterior vira como numa revista
   (rotação 3D com sombra) e revela a seguinte; as interfaces reais flutuam em parallax. */
(function () {
    'use strict';
    function build(root, h, M) {
        var gsap = h.gsap;
        var stage = root.querySelector('.zs-stage'), mag = root.querySelector('.zs-mag'), bar = root.querySelector('.zs-mag__bar');
        var pages = [].slice.call(root.querySelectorAll('.zs-page')), all = root.querySelector('.zs-mag__all');
        var revealIn = root.querySelector('.zs-reveal-in'), wipeOut = root.querySelector('.zs-wipe-out'), count = root.querySelector('.zs-mag__count b');
        var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } });

        // entrada: uma onda de papel (círculo) vem do centro e acende a revista
        tl.fromTo(revealIn, { clipPath: 'circle(0% at 50% 50%)', opacity: 1 }, { clipPath: 'circle(85% at 50% 50%)', duration: 0.07, ease: 'power2.in' }, 0)
          .to(revealIn, { opacity: 0, duration: 0.03 }, 0.075)
          .fromTo([mag, bar], { opacity: 0 }, { opacity: 1, duration: 0.03 }, 0.07);
        // letras gigantes e títulos entram com a onda
        pages.forEach(function (pg, i) {
            var num = pg.querySelector('.zs-page__num'), tx = pg.querySelectorAll('.zs-page__kicker, .zs-page__title, .zs-page__text p, .zs-page__link');
            var frs = pg.querySelectorAll('.zs-pf');
            if (i === 0) {
                tl.fromTo(num, { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 0.07, ease: 'power3.out' }, 0.07)
                  .fromTo(tx, { y: 44, opacity: 0 }, { y: 0, opacity: 1, duration: 0.06, ease: 'power3.out', stagger: 0.012 }, 0.085)
                  .fromTo(frs, { y: 90, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.09, ease: 'back.out(1.3)', stagger: 0.012 }, 0.09);
            }
            // parallax das interfaces dentro de cada página
            var a = i === 0 ? 0.16 : (i === 1 ? 0.38 : 0.7), b = i === 0 ? 0.34 : (i === 1 ? 0.68 : 0.93);
            [].forEach.call(frs, function (el, k) {
                tl.fromTo(el, { yPercent: 4 + k * 2 }, { yPercent: -6 - k * 3, duration: b - a, ease: 'none' }, a);
            });
        });

        // viragem das páginas
        var flips = [[0.31, 0.41], [0.63, 0.73]];
        flips.forEach(function (f, i) {
            var pg = pages[i], shade = pg.querySelector('.zs-page__shade');
            tl.to(pg, { rotationY: -112, duration: f[1] - f[0], ease: 'power2.inOut' }, f[0])
              .fromTo(shade, { opacity: 0 }, { opacity: 0.85, duration: (f[1] - f[0]) * 0.7, ease: 'power1.in' }, f[0])
              .set(pg, { autoAlpha: 0 }, f[1]);
            // a página seguinte "respira" ao ser revelada
            var next = pages[i + 1], ntx = next.querySelectorAll('.zs-page__title, .zs-page__num');
            tl.fromTo(ntx, { y: 40 }, { y: 0, duration: 0.09, ease: 'power3.out' }, f[0] + 0.03);
        });
        tl.fromTo(all, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.04 }, 0.77);

        // contador 01/02/03
        tl.eventCallback('onUpdate', function () {
            var p = tl.progress(), n = p < 0.36 ? '01' : p < 0.68 ? '02' : '03';
            if (count && count.textContent !== n) count.textContent = n;
        });

        // saída: onda escura para o ambiente dos depoimentos
        tl.fromTo(wipeOut, { clipPath: 'circle(0% at 50% 50%)' }, { clipPath: 'circle(85% at 50% 50%)', duration: 0.07, ease: 'power2.in' }, 0.93);
        return function () { pages.forEach(function (p) { p.style.visibility = ''; }); };
    }
    ZS.chapter('blog', { desktop: function (r, h) { return build(r, h, false); }, mobile: function (r, h) { return build(r, h, true); } });
})();
