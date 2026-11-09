/* Zero Satus — núcleo: consultas de mídia e carregador de scripts.
   Scripts clássicos (sem ES modules) para funcionar também em file:// */
(function (w) {
    'use strict';
    var ZS = (w.ZS = w.ZS || {});
    ZS.query = {
        desktop: '(min-width: 900px)',   // composição horizontal, em profundidade
        mobile:  '(max-width: 899px)',   // composição vertical própria
        reduce:  '(prefers-reduced-motion: reduce)',
        hover:   '(hover: hover) and (pointer: fine)'
    };
    ZS.load = function (src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src; s.async = false;
            s.onload = resolve;
            s.onerror = function () { reject(new Error('Falhou: ' + src)); };
            document.head.appendChild(s);
        });
    };
})(window);
