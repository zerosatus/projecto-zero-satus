/* Mobile · Blog — três "páginas" de revista sobrepõem-se; as capas compõem-se de peças reais da app e deslizam em paralaxe. */
(function () {
    'use strict';
    ZM.chapter('blog', function (C) {
        var tl = C.tl, g = C.gsap;
        var posts = C.qa('.zm-post'), covers = C.qa('.zm-cover'), nums = C.qa('.zm-post__n'), count = C.q('.zm-count b'), proxy = { n: 0 };
        g.set(posts[1], { yPercent: 100 }); g.set(posts[2], { yPercent: 100 });
        var T = [[0.3, 0.44], [0.62, 0.76]];
        [1, 2].forEach(function (i) {
            var d = T[i - 1][1] - T[i - 1][0];
            tl.fromTo(posts[i], { yPercent: 100 }, { yPercent: 0, duration: d, ease: 'power2.inOut' }, T[i - 1][0]);
            tl.to(posts[i - 1], { scale: 0.94, duration: d, ease: 'power2.inOut', transformOrigin: '50% 0%' }, T[i - 1][0]);
            tl.to([].slice.call(posts[i - 1].querySelectorAll('.zm-cv')), { y: -40, duration: d, ease: 'none' }, T[i - 1][0]);
        });
        // as peças de cada capa entram em profundidade
        covers.forEach(function (cv, i) {
            var imgs = [].slice.call(cv.querySelectorAll('.zm-cv')), at = i === 0 ? 0.02 : T[i - 1][0] + 0.06;
            tl.fromTo(imgs, { y: 120, scale: 0.8, opacity: 0, z: -80 }, { y: 0, scale: 1, opacity: 1, z: 0, duration: 0.12, ease: 'power3.out', stagger: 0.03 }, at);
        });
        tl.fromTo(nums, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.1, stagger: 0.28 }, 0.02);
        tl.to(proxy, { n: 2, duration: 0.8, ease: 'none', onUpdate: function () { count.textContent = ('0' + (Math.round(proxy.n) + 1)).slice(-2); } }, 0.15);
        C.exit(0.9);
    });
})();
