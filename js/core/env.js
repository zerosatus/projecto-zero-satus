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
    ZS.version = '20261121';          // muda a cada entrega: evita misturar ficheiros novos com cópias antigas em cache
    ZS.LOAD_TIMEOUT = 25000;          // um script que nunca responde não pode prender o arranque para sempre
    var pending = {};
    ZS.load = function (src) {
        if (pending[src]) return pending[src];          // nunca carregar (nem executar) o mesmo script duas vezes
        return (pending[src] = new Promise(function (resolve, reject) {
            var s = document.createElement('script'), done = false;
            var t = setTimeout(function () { if (done) return; done = true; delete pending[src]; reject(new Error('Tempo esgotado: ' + src)); }, ZS.LOAD_TIMEOUT);
            s.src = src + (src.indexOf('?') < 0 ? '?v=' + ZS.version : ''); s.async = false;
            s.onload = function () { if (done) return; done = true; clearTimeout(t); resolve(); };
            s.onerror = function () { if (done) return; done = true; clearTimeout(t); delete pending[src]; reject(new Error('Falhou: ' + src)); };
            document.head.appendChild(s);
        }));
    };
})(window);
