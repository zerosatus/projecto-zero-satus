/* Zero Satus — desenha os canais oficiais a partir de js/social-config.js.
   Cada contentor [data-social-list="footer|close|dock"] é preenchido; [data-social-email] recebe o mailto.
   Redes sem URL ficam como "Em breve" (elemento sem ligação, não focável). O HTML já traz uma versão básica
   (email, Facebook, X) para quem não tem JavaScript. */
(function () {
    'use strict';
    var cfg = window.ZS_SOCIAL; if (!cfg || !cfg.networks) return;
    var X = '<svg class="zs-soc__svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>';
    /* Ícones em SVG embutido: não dependem do Font Awesome (CDN), que em redes lentas/bloqueadas deixava as redes sem ícone. */
    var ICON = {"facebook": "<svg class=\"zs-soc__svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M14 8.5V6.9c0-.7.2-1.2 1.2-1.2H17V2.2C16.7 2.2 15.6 2 14.4 2 11.8 2 10 3.6 10 6.4v2.1H7v3.8h3V22h4v-9.7h2.9l.5-3.8z\"/></svg>", "instagram": "<svg class=\"zs-soc__svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"/><circle cx=\"12\" cy=\"12\" r=\"4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linejoin=\"round\"/><circle cx=\"17.2\" cy=\"6.8\" r=\"1.2\"/></svg>", "tiktok": "<svg class=\"zs-soc__svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M16.6 2h-3.2v13.1a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .8.1V9a6.1 6.1 0 1 0 5.3 6V8.6a7.6 7.6 0 0 0 4.4 1.4V6.8a4.4 4.4 0 0 1-4.4-4.8z\"/></svg>", "youtube": "<svg class=\"zs-soc__svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path fill-rule=\"evenodd\" d=\"M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3z\"/></svg>", "pinterest": "<svg class=\"zs-soc__svg\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M12 2.2a9.8 9.8 0 0 0-3.6 18.9c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.300.6 1.300 1.400 0 .9-.5 2.100-.8 3.300-.2 1 .5 1.800 1.500 1.800 1.800 0 3.200-1.900 3.200-4.600 0-2.400-1.700-4.100-4.200-4.100-2.900 0-4.600 2.200-4.600 4.400 0 .9.300 1.800.8 2.300.1.1.1.2.1.3l-.3 1.100c0 .2-.1.2-.3.1-1.300-.6-2.100-2.500-2.100-4 0-3.300 2.400-6.300 6.900-6.300 3.600 0 6.400 2.600 6.400 6 0 3.600-2.300 6.500-5.400 6.500-1.100 0-2.100-.5-2.400-1.200l-.7 2.500c-.2.900-.9 2.100-1.300 2.800A9.800 9.800 0 1 0 12 2.200z\"/></svg>"};
    function safeUrl(u) { return /^https:\/\/[^\s"'<>]+$/i.test(u || '') ? u : ''; }

    function build(n, i) {
        var url = safeUrl(n.url), live = !!url, el = document.createElement(live ? 'a' : 'span');
        el.className = 'zs-soc zs-soc--' + n.id + (live ? '' : ' is-soon'); el.style.setProperty('--i', i);
        if (live) { el.href = url; el.target = '_blank'; el.rel = 'noopener noreferrer'; el.setAttribute('aria-label', n.label + ' (abre num novo separador)'); }
        else { el.setAttribute('role', 'img'); el.setAttribute('aria-label', n.label + ', em breve'); }
        var ic = document.createElement('span'); ic.className = 'zs-soc__i'; ic.setAttribute('aria-hidden', 'true');
        ic.innerHTML = n.id === 'x' ? X : (ICON[n.id] || X);
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
