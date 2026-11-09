/* Zero Satus — kit de câmara para capítulos com interface montada.
   A composição vive em píxeis do ecrã real; só a câmara (.zs-rig) muda de escala/posição.
   Interfaces grandes: a janela ocupa quase todo o palco e a câmara aproxima-se das zonas-chave. */
(function (w) {
    'use strict';
    var ZS = (w.ZS = w.ZS || {});
    var SH0 = '0 24px 60px -24px rgba(0,0,0,0.8), 0 0 0 1px rgba(196,181,253,0.1), 0 0 0 rgba(168,85,247,0)';
    var SH1 = '0 24px 60px -24px rgba(0,0,0,0.8), 0 0 0 1px rgba(216,200,255,0.85), 0 0 46px rgba(168,85,247,0.6)';

    ZS.kit = function (root, h, M, cw, ch) {
        var gsap = h.gsap, ST = h.ST;
        var stage = root.querySelector('.zs-stage'), view = root.querySelector('.zs-view'), rig = root.querySelector('.zs-rig');
        var K = { M: M, cw: cw, ch: ch, rig: rig, stage: stage, SH0: SH0, SH1: SH1, fit: 1 };
        K.measure = function () {
            K.vw = view.clientWidth; K.vh = view.clientHeight;
            K.fit = M ? (K.vw - 12) / cw : Math.min(K.vw * 0.95 / cw, K.vh * 0.94 / ch);
            gsap.set(rig, { scale: K.fit, x: 0, y: 0, transformOrigin: '50% 50%' });
        };
        K.measure();
        ST.addEventListener('refreshInit', K.measure);
        // câmara: centra (px,py) da composição à escala s (rel = relativa ao ajuste); dx/dy deslocam o enquadramento
        K.cam = function (px, py, s, rel, dx, dy) {
            function sc() { return rel ? K.fit * s : s; }
            function v(d) { return typeof d === 'function' ? d() : (d || 0); }
            return { scale: sc, x: function () { return -(px - cw / 2) * sc() + v(dx); }, y: function () { return -(py - ch / 2) * sc() + v(dy); } };
        };
        K.home = function (dy) { return { scale: function () { return K.fit; }, x: 0, y: dy || 0 }; };
        K.f = function (id) { return root.querySelector('.zs-frag[data-id="' + id + '"]'); };
        // posição (relativa ao palco) de um ponto de uma peça — usada pelos efeitos
        K.anchor = function (id, fx, fy, color) {
            var r = K.f(id).getBoundingClientRect(), s = stage.getBoundingClientRect();
            return { x: r.left - s.left + r.width * fx, y: r.top - s.top + r.height * fy, c: color };
        };
        K.rect = function (id) { var r = K.f(id).getBoundingClientRect(), s = stage.getBoundingClientRect(); return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height }; };
        K.spot = function (tl, all, on, st, dim) {
            all.forEach(function (id) {
                var el = K.f(id), isOn = on.indexOf(id) >= 0;
                tl.to(el, { opacity: isOn ? 1 : (dim === undefined ? 0.3 : dim), scale: isOn ? 1.03 : 0.985, duration: 0.04, ease: 'power2.inOut' }, st);
                tl.to(el.querySelector('.zs-frag__in'), { boxShadow: isOn ? SH1 : SH0, duration: 0.04 }, st);
            });
        };
        K.step = function (tl, li, st, en, keep) {
            tl.fromTo(li, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.035, ease: 'power2.out' }, st + 0.005)
              .to(li, { opacity: keep ? 1 : 0, y: keep ? 0 : -10, duration: 0.03 }, en - 0.03);
        };
        // efeitos de partículas ligados ao progresso da timeline
        K.fx = function (tl, opts) {
            var canvas = root.querySelector('.zs-fx'), fx = ZS.fx(canvas, stage, Object.assign({ mobile: M }, opts || {}));
            var rs = function () { fx.resize(); fx.draw(tl.progress()); };
            ST.addEventListener('refresh', rs);
            tl.eventCallback('onUpdate', function () { fx.draw(tl.progress()); });
            K._offFx = function () { ST.removeEventListener('refresh', rs); };
            return fx;
        };
        K.dispose = function () { ST.removeEventListener('refreshInit', K.measure); if (K._offFx) K._offFx(); };
        return K;
    };
})(window);
