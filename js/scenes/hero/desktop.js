/* Cena 1 — Hero (desktop)
   1) Entrada: o mockup sobe e o brilho acende (só transform/opacity).
   2) Scroll: a secção fica fixa ~1 viewport; o texto sai e o mockup
      endireita, centra-se e cresce. Scroll nativo, sem hijack. */
ZS.scene('hero', function (gsap, ScrollTrigger) {
    var root = document.querySelector('.zs-hero');
    if (!root) return;

    gsap.matchMedia().add(ZS.query.scrolly, function () {
        var device = root.querySelector('.zs-hero__device');
        var frame  = root.querySelector('.zs-device');
        var copy   = root.querySelector('.zs-hero__copy');
        var glow   = root.querySelector('.zs-hero__glow--main');
        var intro  = root.querySelectorAll('.zs-hero__lead, .zs-hero__actions, .zs-hero__stats');
        if (!device || !frame || !copy) return;

        // Mesmo estado inicial que o CSS (sem salto)
        gsap.set(frame, { transformPerspective: 1600, rotateY: -9, rotateX: 4, transformOrigin: '30% 50%' });

        // 1) Entrada única — o H1 não é escondido (protege o LCP)
        gsap.timeline({ defaults: { ease: 'power3.out' } })
            .from(frame, { y: 70, duration: 1.3 }, 0)
            .from(glow,  { opacity: 0, scale: 0.8, duration: 1.8 }, 0)
            .from(intro, { y: 16, opacity: 0, duration: 0.9, stagger: 0.1 }, 0.3);

        // 2) Scroll
        var tl = gsap.timeline({
            defaults: { ease: 'none' },
            scrollTrigger: {
                trigger: root, start: 'top top', end: '+=100%',
                pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true
            }
        });
        tl.to(copy,  { y: -40, opacity: 0, duration: 0.45, ease: 'power1.in' }, 0)
          .to(device, {
              x: function () { return root.clientWidth / 2 - (device.offsetLeft + device.offsetWidth / 2); },
              scale: 1.2, duration: 1
          }, 0)
          .to(frame, { rotateY: 0, rotateX: 0, duration: 1 }, 0)
          .to(glow,  { scale: 1.25, opacity: 1, duration: 1 }, 0);

    });
});
