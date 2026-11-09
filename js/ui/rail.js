/* Indicador de capítulos: construído a partir de [data-rail="Nome"] — para acrescentar um capítulo
   basta dar-lhe esse atributo. Discreto, clicável, acessível. */
(function () {
    'use strict';
    var secs = [].slice.call(document.querySelectorAll('[data-rail]'));
    if (!secs.length) return;
    var nav = document.createElement('nav'); nav.className = 'zs-rail'; nav.setAttribute('aria-label', 'Capítulos');
    var links = secs.map(function (s) {
        var a = document.createElement('a'); a.href = '#' + s.id; a.innerHTML = '<span>' + s.dataset.rail + '</span>'; a.setAttribute('aria-label', s.dataset.rail);
        nav.appendChild(a); return a;
    });
    document.body.appendChild(nav);
    function update() {
        var mid = window.innerHeight * 0.45, best = 0;
        secs.forEach(function (s, i) { var r = s.getBoundingClientRect(); if (r.top <= mid) best = i; });
        links.forEach(function (a, i) { a.classList.toggle('is-active', i === best); if (i === best) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    window.addEventListener('scroll', update, { passive: true }); window.addEventListener('resize', update); update();
})();
