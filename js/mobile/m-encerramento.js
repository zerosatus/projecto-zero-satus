/* Mobile · Contacto — três ecrãs da app abrem-se em leque; o convite final sobe num painel. */
(function () {
    'use strict';
    ZM.chapter('encerramento', function (C) {
        var tl = C.tl, W = C.W;
        var l = C.q('[data-id=c-l]'), r = C.q('[data-id=c-r]'), m = C.q('[data-id=c-m]'), dock = C.q('.zm-dock');
        C.rise(m, 0.0, 0.2, { y: function () { return C.H() * 0.55; }, rotationZ: 0, scale: 0.9, opacity: 0 }, { y: 0, scale: 1, opacity: 1 });
        C.rise(l, 0.04, 0.22, { y: function () { return C.H() * 0.55; }, x: 0, rotationZ: 0, opacity: 0 }, { y: 0, x: function () { return -W() * 0.3; }, rotationZ: -13, opacity: 1 });
        C.rise(r, 0.06, 0.22, { y: function () { return C.H() * 0.55; }, x: 0, rotationZ: 0, opacity: 0 }, { y: 0, x: function () { return W() * 0.3; }, rotationZ: 13, opacity: 1 });
        C.rise(dock, 0.22, 0.14, { y: function () { return dock.offsetHeight + 40; }, opacity: 0 }, { y: 0, opacity: 1 });
        C.rise(C.qa('.zm-dock .zs-soc'), 0.3, 0.07, { y: 22, scale: 0.7, opacity: 0 }, { y: 0, scale: 1, opacity: 1, stagger: 0.025 });
        tl.to([l, m, r], { y: -34, duration: 0.6, ease: 'none' }, 0.3);
    });
})();
