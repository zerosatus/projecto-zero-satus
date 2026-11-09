/* Mobile · Anotações — duas notas chegam e pairam sobre o título; depois o cabeçalho e a pesquisa descem e as notas assentam
   no caderno digital; no fim os Documentos entram por categorias. */
(function () {
    'use strict';
    ZM.chapter('anotacoes', function (C) {
        var tl = C.tl, A = C.q('[data-id=notas-a]'), B = C.q('[data-id=notas-b]'), pg = C.qa('[data-id=notas-a] .zm-ping');
        C.storm(A, 0.16, 0.18, { heroAt: 0.02, part: 0.6 });
        tl.to(C.q('.zm-copy'), { y: -64, opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.14);
        C.steps([0.34, 0.54, 0.74], [0.54, 0.74, 0.93], { keepCopy: true });
        C.pulse(C.pcs(A, { only: ['n-1', 'n-2'] }), 0.37, 0.12, 1.05);
        C.ping(pg[0], 0.56, 0.68);
        C.scatter(A, 0.7, 0.06);
        C.storm(B, 0.74, 0.14, { part: 0.55 });
        C.exit(0.92);
    });
})();
