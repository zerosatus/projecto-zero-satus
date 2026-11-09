/* Mobile · Depoimentos — uma citação real de cada vez, ao ritmo do scroll. Constrói-se a partir das citações que já
   existem no HTML (sem inventar nenhuma). Sem JS ou com movimento reduzido fica a faixa original. */
(function () {
    'use strict';
    var html = document.documentElement;
    ZS.chapters.depoimentos = {
        mobile: function (root, h) {
            if (root.getAttribute('data-state') !== 'confirmed') return;
            var seen = {}, quotes = [].slice.call(root.querySelectorAll('.zs-quote')).filter(function (li) {
                if (li.getAttribute('aria-hidden') === 'true') return false;
                var k = li.dataset.name + '|' + li.querySelector('blockquote').textContent;
                return seen[k] ? false : (seen[k] = true);
            });
            if (!quotes.length) return;
            var gsap = h.gsap, N = quotes.length;
            var el = document.createElement('div');
            el.className = 'zm zm--depo zm-depo';
            el.innerHTML = '<div class="zm-bg" aria-hidden="true"></div><div class="zm-num" aria-hidden="true">“</div>' +
                '<div class="zm-copy"><span class="zm-kick">Depoimentos</span><h2 class="zm-h"><span class="zm-line"><span>Quem já usa o</span></span><span class="zm-line"><span><em>Zero Satus</em></span></span></h2></div>' +
                quotes.map(function (li) {
                    var t = document.createElement('div'); t.innerHTML = li.querySelector('blockquote').textContent.trim().split(/\s+/).map(function (w) { return '<span class="zm-w">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span>'; }).join(' ');
                    var n = document.createElement('b'); n.textContent = li.dataset.name; var r = document.createElement('span'); r.textContent = li.dataset.role;
                    return '<figure class="zm-q" style="margin:0"><span class="zm-q__mark" aria-hidden="true">“</span><blockquote>' + t.innerHTML + '</blockquote><footer>' + n.outerHTML + r.outerHTML + '</footer></figure>';
                }).join('') +
                '<div class="zm-dots" aria-hidden="true">' + quotes.map(function () { return '<i><b></b></i>'; }).join('') + '</div>';
            root.insertBefore(el, root.firstChild);
            root.style.setProperty('--dh', ((N + 1) * 80) + 'svh');
            html.classList.add('zm-depo-on');

            var qs = [].slice.call(el.querySelectorAll('.zm-q')), bars = [].slice.call(el.querySelectorAll('.zm-dots b'));
            var tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: 0.6 } });
            var u = 1 / (N + 0.2);
            var tints = ['rgba(139,92,246,0.34)', 'rgba(56,189,248,0.26)', 'rgba(236,72,153,0.26)', 'rgba(16,185,129,0.24)', 'rgba(245,158,11,0.24)', 'rgba(139,92,246,0.34)'];
            qs.forEach(function (q, i) {
                var t0 = i * u + 0.03, words = [].slice.call(q.querySelectorAll('.zm-w')), mark = q.querySelector('.zm-q__mark'), foot = q.querySelector('footer');
                tl.fromTo(q, { opacity: 0 }, { opacity: 1, duration: u * 0.08 }, t0);
                tl.fromTo(mark, { scale: 0.5, y: 30, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: u * 0.22, ease: 'power3.out' }, t0);
                tl.fromTo(words, { opacity: 0.14, y: 10 }, { opacity: 1, y: 0, duration: u * 0.5, ease: 'none', stagger: { each: (u * 0.45) / Math.max(1, words.length) } }, t0 + u * 0.06);
                tl.fromTo(foot, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: u * 0.15, ease: 'power2.out' }, t0 + u * 0.55);
                tl.to(el, { '--ga': tints[i % tints.length], duration: u * 0.3, ease: 'none' }, t0);
                if (i < N - 1) tl.to(q, { y: -40, opacity: 0, duration: u * 0.2, ease: 'power2.in' }, t0 + u * 0.78);
                tl.fromTo(bars[i], { scaleX: 0 }, { scaleX: 1, duration: u * 0.95, ease: 'none' }, t0);
            });
            return function () { html.classList.remove('zm-depo-on'); root.style.removeProperty('--dh'); el.remove(); };
        }
    };
})();
