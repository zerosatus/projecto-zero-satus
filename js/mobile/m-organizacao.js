/* Mobile · Organização — as semanas do calendário entram alternadamente pelos lados e formam o mês; os dias marcados acendem-se;
   o evento do dia ganha protagonismo; por fim o calendário afasta-se e o horário semanal monta-se linha a linha. */
(function () {
    'use strict';
    ZM.chapter('organizacao', function (C) {
        var tl = C.tl, A = C.q('[data-id=org-a]'), B = C.q('[data-id=org-b]'), pg = C.qa('[data-id=org-a] .zm-ping');
        tl.to(C.q('.zm-copy'), { y: -64, opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.08);
        C.storm(A, 0.1, 0.2, { part: 0.55 });
        C.steps([0.26, 0.44, 0.6, 0.78], [0.44, 0.6, 0.78, 0.93], { keepCopy: true });
        C.ping(pg[0], 0.31, 0.42); C.ping(pg[1], 0.46, 0.58); C.ping(pg[2], 0.48, 0.58);
        var ev = C.piece(A, 'o-ev'), rest = C.pcs(A, { skip: ['o-ev'] });
        tl.to(rest, { opacity: 0.18, duration: 0.05 }, 0.6).to(ev, { scale: 1.1, z: 90, y: -90, duration: 0.07, ease: 'power2.out' }, 0.6)
          .to(ev, { scale: 1, z: 0, y: 0, duration: 0.05 }, 0.72).to(rest, { opacity: 1, duration: 0.03 }, 0.72);
        C.scatter(A, 0.72, 0.06);
        C.storm(B, 0.75, 0.12, { part: 0.5 });
        C.exit(0.93);
    });
})();
