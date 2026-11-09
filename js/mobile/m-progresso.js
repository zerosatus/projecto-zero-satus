/* Mobile · Progresso — o Resumo semanal entra primeiro; os números de relance chegam depois pelos lados; o desempenho por
   disciplina enche as barras; o histórico fecha. Tudo em peças reais da app, na resolução da captura. */
(function () {
    'use strict';
    ZM.chapter('progresso', function (C) {
        var tl = C.tl, A = C.q('[data-id=prog-a]'), B = C.q('[data-id=prog-b]'), D = C.q('[data-id=prog-c]'), pg = C.qa('[data-id=prog-a] .zm-ping'), fill = B.querySelector('.zm-pfill');
        tl.to(C.q('.zm-copy'), { y: -64, opacity: 0, duration: 0.06, ease: 'power2.in' }, 0.12);
        C.storm(A, 0.14, 0.14, { heroAt: 0.02, part: 0.6, only: ['p-week', 'p-head', 'p-tabs'] });
        C.steps([0.2, 0.36, 0.54, 0.74], [0.36, 0.54, 0.74, 0.93], { keepCopy: true });
        C.ping(pg[0], 0.27, 0.37);
        C.storm(A, 0.36, 0.12, { part: 0.6, only: ['p-t1', 'p-t2', 'p-t3', 'p-t4', 'p-st'] });
        C.scatter(A, 0.5, 0.05);
        C.storm(B, 0.53, 0.1, { part: 0.6 });
        tl.fromTo(fill, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.07, ease: 'power3.out' }, 0.64);
        C.scatter(B, 0.71, 0.05);
        C.storm(D, 0.74, 0.1, { part: 0.6 });
        C.exit(0.92);
    });
})();
