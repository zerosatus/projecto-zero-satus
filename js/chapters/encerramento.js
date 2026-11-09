/* Encerramento — as peças reais do início voltam em órbita, aceleram para o centro, explodem em luz
   e revelam o convite final. Efeitos de partículas (estrelas + convergência). */
(function () {
    'use strict';
    function build(root, h, M) {
        var gsap = h.gsap, ST = h.ST;
        var stage = root.querySelector('.zs-stage'), orbit = root.querySelector('.zs-orbit'), orb = root.querySelector('.zs-orb'), halo = root.querySelector('.zs-halo');
        var flash = root.querySelector('.zs-flash'), horizon = root.querySelector('.zs-horizon'), closeEl = root.querySelector('.zs-close'), rv = root.querySelectorAll('.zs-rv');
        var frags = [].slice.call(root.querySelectorAll('.zs-frag')), n = frags.length;
        var L = { W: 0, H: 0, kw: 1 }, P = { R: 1500, spin: 0, s: 0.35, a: 0 };
        var base = frags.map(function (_, i) { return i * 2 * Math.PI / n + 0.3; });

        function measure() {
            L.W = stage.clientWidth; L.H = stage.clientHeight;
            L.kw = M ? Math.max(0.55, Math.min(1, L.W / 460)) : Math.max(0.65, Math.min(1.1, L.W / 1440));
            frags.forEach(function (el) { el.style.width = (el.dataset.w * L.kw * (M ? 0.55 : 0.62)) + 'px'; el.style.setProperty('--r', (el.dataset.r * 0.6) + 'px'); });
            apply();
        }
        function apply() {
            frags.forEach(function (el, i) {
                var th = base[i] + P.spin, c = Math.cos(th), s = Math.sin(th), R = P.R * L.kw * (M ? 0.36 : 1);
                gsap.set(el, { xPercent: -50, yPercent: -50, x: s * R * 1.05, z: c * R - R * 0.35, y: (i % 2 ? 1 : -1) * (30 + 26 * Math.sin(base[i] * 3)) * Math.min(1, R / 500) + (M ? 40 : 0),
                    rotationY: -s * 22, rotationZ: (i % 3 - 1) * 3, scale: P.s * (0.8 + 0.2 * (c + 1) / 2) / 0.62, opacity: P.a * (0.3 + 0.7 * (c + 1) / 2) });
            });
        }
        var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.8, invalidateOnRefresh: true } });
        gsap.set(orbit, { rotationX: M ? 10 : 16 });
        measure(); ST.addEventListener('refreshInit', measure);
        gsap.set(rv, { opacity: 0, y: 34 }); closeEl.inert = true;

        // 1) as peças aparecem em órbita e fecham o círculo
        tl.fromTo(P, { R: 1500, spin: 0, s: 0.35, a: 0 }, { R: 560, spin: 1.2, s: 0.62, a: 1, duration: 0.36, ease: 'power2.out', onUpdate: apply }, 0.03)
          .fromTo(horizon, { opacity: 0.3, scaleY: 0.7 }, { opacity: 1, scaleY: 1, duration: 0.5 }, 0.1)
        // 2) aceleram para o centro
          .to(P, { R: 0, spin: 4.6, s: 0.08, duration: 0.24, ease: 'power3.in', onUpdate: apply }, 0.4)
          .fromTo(orb, { scale: 0.1, opacity: 0 }, { scale: 1.1, opacity: 1, duration: 0.2, ease: 'power2.in' }, 0.42)
          .to(P, { a: 0, duration: 0.03, onUpdate: apply }, 0.62)
        // 3) explosão de luz e anel
          .fromTo(flash, { opacity: 0 }, { opacity: 0.9, duration: 0.04, ease: 'power2.out' }, 0.6)
          .to(flash, { opacity: 0, duration: 0.14, ease: 'power2.in' }, 0.64)
          .to(orb, { scale: 2.8, opacity: 0, duration: 0.1, ease: 'power2.out' }, 0.62)
          .fromTo(halo, { scale: 0.25, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.14, ease: 'power3.out' }, 0.62)
          .to(halo, { rotation: 140, duration: 0.38, ease: 'none' }, 0.62)
        // 4) o convite final
          .fromTo(rv, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 0.06, ease: 'power3.out', stagger: 0.03 }, 0.68)
          .fromTo('.zs-cbg__a', { xPercent: -10 }, { xPercent: 20, duration: 1 }, 0);

        // efeitos: estrelas + convergência das peças
        var fx = ZS.fx(root.querySelector('.zs-fx'), stage, { mobile: M });
        function center() { var r = orb.getBoundingClientRect(), s = stage.getBoundingClientRect(); return [{ x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }]; }
        function pieces() { var s = stage.getBoundingClientRect(); return frags.map(function (el) { var r = el.getBoundingClientRect(); return { x: r.left - s.left + r.width / 2, y: r.top - s.top + r.height / 2 }; }); }
        fx.add({ type: 'dust', n: 120, speed: 60, colors: ['#ffffff', '#c4b5fd', '#f0abfc', '#93c5fd'] })
          .add({ type: 'flow', t0: 0.42, t1: 0.62, n: 240, colors: ['#c4b5fd', '#f0abfc', '#fff', '#67e8f9'], curve: 0.8, src: pieces, dst: center })
          .add({ type: 'burst', t0: 0.6, dt: 0, dur: 0.12, r: 230, m: 46, colors: ['#ffffff', '#c4b5fd', '#f0abfc', '#fbbf24'], pts: center });
        var rs = function () { fx.resize(); fx.draw(tl.progress()); }; ST.addEventListener('refresh', rs);
        tl.eventCallback('onUpdate', function () { var p = tl.progress(); fx.draw(p); closeEl.inert = p < 0.7; });
        return function () { ST.removeEventListener('refreshInit', measure); ST.removeEventListener('refresh', rs); closeEl.inert = false; };
    }
    ZS.chapter('encerramento', { desktop: function (r, h) { return build(r, h, false); }, mobile: function (r, h) { return build(r, h, true); } });
})();
