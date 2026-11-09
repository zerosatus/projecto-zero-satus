/* Zero Satus — desenha os canais oficiais a partir de js/social-config.js.
   Cada contentor [data-social-list="footer|close|dock"] é preenchido; [data-social-email] recebe o mailto.
   Redes sem URL ficam como "Em breve" (elemento sem ligação, não focável). O HTML já traz uma versão básica
   (email, Facebook, X) para quem não tem JavaScript. */
(function () {
    'use strict';
    var cfg = window.ZS_SOCIAL; if (!cfg || !cfg.networks) return;
    var X = '<svg class="zs-soc__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
    var ICON = { facebook: 'fab fa-facebook-f', instagram: 'fab fa-instagram', tiktok: 'fab fa-tiktok', youtube: 'fab fa-youtube', pinterest: 'fab fa-pinterest-p' };
    function safeUrl(u) { return /^https:\/\/[^\s"'<>]+$/i.test(u || '') ? u : ''; }

    function build(n, i) {
        var url = safeUrl(n.url), live = !!url, el = document.createElement(live ? 'a' : 'span');
        el.className = 'zs-soc zs-soc--' + n.id + (live ? '' : ' is-soon'); el.style.setProperty('--i', i);
        if (live) { el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer'; el.setAttribute('aria-label', n.label + ' (abre num novo separador)'); }
        else { el.setAttribute('role', 'img'); el.setAttribute('aria-label', n.label + ', em breve'); }
        var ic = document.createElement('span'); ic.className = 'zs-soc__i'; ic.setAttribute('aria-hidden', 'true');
        if (n.id === 'x') ic.innerHTML = X; else { var f = document.createElement('i'); f.className = ICON[n.id] || 'fas fa-link'; ic.appendChild(f); }
        var t = document.createElement('span'); t.className = 'zs-soc__t'; t.textContent = n.label;
        el.appendChild(ic); el.appendChild(t);
        if (!live) { var s = document.createElement('em'); s.className = 'zs-soc__soon'; s.textContent = 'Em breve'; el.appendChild(s); }
        return el;
    }
    function render() {
        [].forEach.call(document.querySelectorAll('[data-social-list]'), function (box) {
            box.textContent = '';
            cfg.networks.forEach(function (n, i) { box.appendChild(build(n, i)); });
        });
        [].forEach.call(document.querySelectorAll('[data-social-email]'), function (a) {
            a.href = 'mailto:' + cfg.email; var t = a.querySelector('.t'); if (t) t.textContent = cfg.email;
        });
    }
    render();
})();
