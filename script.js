// ============================================================
// Zero Satus — script principal da landing page
// Correção: o ficheiro anterior assumia #mobileMenuBtn / #mobileNav
// sem verificar; como o HTML não os tinha, o script falhava a meio
// e o resto (animações, resize, fallback da logo) nunca corria.
// Agora tudo é protegido contra elementos em falta.
// ============================================================

const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNav = document.getElementById('mobileNav');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setMobileMenu(open) {
    if (!mobileNav || !mobileMenuBtn) return;
    mobileNav.classList.toggle('active', open);
    mobileMenuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    mobileMenuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-times', open);
        icon.classList.toggle('fa-bars', !open);
    }
}

// Smooth scroll para links internos
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return; // links "#" do rodapé: sem comportamento
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
            setMobileMenu(false);
        }
    });
});

// Header: transparente sobre o hero, vidro depois de sair da primeira vista
(function () {
    const header = document.querySelector('header');
    if (!header) return;
    const apply = () => header.classList.toggle('is-scrolled', window.scrollY > 40);
    window.addEventListener('scroll', apply, { passive: true });
    apply();
})();

// Mobile menu
if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setMobileMenu(!mobileNav.classList.contains('active'));
    });

    document.addEventListener('click', (e) => {
        if (mobileNav.classList.contains('active') &&
            !mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            setMobileMenu(false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav.classList.contains('active')) {
            setMobileMenu(false);
            mobileMenuBtn.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024) setMobileMenu(false);
    });
}

// Animação de entrada dos cartões (secções ainda não redesenhadas)
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card, .module-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease-out';
        observer.observe(el);
    });
}

// Fallback da logo: usa o ícone local e nunca entra em ciclo
// (antes, se o fallback também falhasse, o onerror repetia-se sem fim)
document.querySelectorAll('.logo-icon img').forEach(img => {
    img.onerror = function () {
        this.onerror = null;
        this.src = 'imagem/favicon.png';
    };
});
