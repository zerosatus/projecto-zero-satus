/* Depoimentos: pausar/retomar o movimento e abrir cada citação em destaque (rato, toque e teclado) */
(function () {
    'use strict';
    var band = document.getElementById('testimonials'); if (!band) return;
    var btn = band.querySelector('.zs-band__pause'), dlg = document.getElementById('zsQuoteDlg');
    if (btn) btn.addEventListener('click', function () {
        var p = band.classList.toggle('is-paused');
        btn.setAttribute('aria-pressed', p ? 'true' : 'false');
        btn.setAttribute('aria-label', p ? 'Retomar o movimento dos depoimentos' : 'Pausar o movimento dos depoimentos');
        btn.querySelector('span').textContent = p ? 'Retomar' : 'Pausar';
        btn.querySelector('i').className = p ? 'fas fa-play' : 'fas fa-pause';
    });
    function open(li) {
        if (!dlg) return;
        dlg.querySelector('blockquote').textContent = li.querySelector('blockquote').textContent;
        dlg.querySelector('.zs-qdlg__who').textContent = li.dataset.name + ' · ' + li.dataset.role;
        if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    }
    band.addEventListener('click', function (e) { var li = e.target.closest('.zs-quote'); if (li && li.getAttribute('aria-hidden') !== 'true') open(li); });
    band.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('zs-quote')) { e.preventDefault(); open(e.target); } });
    if (dlg) dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
})();
