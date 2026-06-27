/* ============================================================
   STRUCTURED BY AI — interaction layer
   Lenis (smooth scroll) + GSAP/ScrollTrigger (reveals, theme,
   marquee) + signature clip-path wipe-ups. Degrades gracefully
   when libs or motion are unavailable.
   ============================================================ */
(() => {
  const html = document.documentElement;
  html.classList.remove('no-js'); html.classList.add('js');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  const EASE = 'expo.out'; // mirrors cubic-bezier(0.65,0.05,0,1)

  if (reduced) html.classList.add('reduced');

  /* ---------- 1. background canvas ---------- */
  (function initBackground() {
    const canvas = document.getElementById('bg');
    if (!canvas || reduced || typeof window.SBAI_BG !== 'function') return;
    try {
      window.__bg = window.SBAI_BG(canvas, { color: '#d2ff00' });
      requestAnimationFrame(() => canvas.classList.add('is-ready'));
    } catch (e) { /* background is decorative; never block the page */ }
  })();

  /* ---------- 2. smooth scroll (Lenis) <-> GSAP ---------- */
  let lenis = null;
  if (hasLenis && !reduced) {
    lenis = new window.Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis; // exposed for debugging / programmatic scroll
    // feed scroll velocity into the flow-field so it accelerates as you scroll
    lenis.on('scroll', (e) => { if (window.__bg && window.__bg.setVelocity) window.__bg.setVelocity(e.velocity || 0); });
    if (hasGSAP && window.ScrollTrigger) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add((time) => lenis.raf(time * 1000));
      window.gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  /* in-page anchor links route through Lenis */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      const navH = (document.querySelector('.nav') || {}).offsetHeight || 72;
      if (lenis) lenis.scrollTo(target, { offset: -navH, duration: 1.2 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  if (!hasGSAP || reduced) { revealFallback(); initMarqueeCSS(); wireNav(); return; }

  const gsap = window.gsap;
  const ST = window.ScrollTrigger;
  gsap.registerPlugin(ST);

  /* ---------- 3. clip-path wipe-up reveals (the signature) ---------- */
  function reveal() {
    gsap.utils.toArray('[data-reveal], [data-reveal-stagger]').forEach((el) => {
      const stagger = el.hasAttribute('data-reveal-stagger');
      const targets = stagger ? el.children : [el];
      if (stagger) gsap.set(el, { opacity: 1 }); // parent shown; children carry the animation
      gsap.set(targets, { clipPath: 'inset(0 0 100% 0)', y: 80, opacity: 0 });
      gsap.to(targets, {
        clipPath: 'inset(0 0 -5% 0)', y: 0, opacity: 1,
        duration: 1.25, ease: EASE, stagger: stagger ? 0.11 : 0,
        scrollTrigger: { trigger: el, start: 'top 88%' },
      });
    });

    /* scroll-linked parallax — different layers drift at different rates */
    gsap.utils.toArray('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 10;
      gsap.to(el, {
        yPercent: -amt, ease: 'none',
        scrollTrigger: { trigger: el.closest('section') || el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    });
  }
  reveal();

  /* ---------- 4. per-section theme inversion (dark <-> cream) ---------- */
  function themeSwitch() {
    const body = document.body;
    document.querySelectorAll('[data-theme]').forEach((sec) => {
      const theme = sec.getAttribute('data-theme');
      ST.create({
        trigger: sec, start: 'top 50%', end: 'bottom 50%',
        onToggle: (self) => {
          if (self.isActive) {
            body.setAttribute('data-theme', theme);
            if (window.__bg && window.__bg.setTheme) window.__bg.setTheme(theme);
          }
        },
      });
    });
  }
  themeSwitch();

  /* ---------- 5. velocity-reactive infinite marquee ---------- */
  function marquee() {
    document.querySelectorAll('.marquee__track').forEach((track) => {
      // duplicate content for a seamless loop
      track.innerHTML += track.innerHTML;
      let x = 0, baseSpeed = 0.6, w = track.scrollWidth / 2, dir = -1;
      let rt; const recalc = () => { w = track.scrollWidth / 2; x = ((x % w) + w) % w; if (x > 0) x -= w; };
      window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(recalc, 150); });
      const vScroll = { v: 0 };
      if (lenis) lenis.on('scroll', (e) => { vScroll.v = e.velocity || 0; });
      gsap.ticker.add(() => {
        const boost = 1 + Math.min(Math.abs(vScroll.v) * 0.06, 6);
        x += dir * baseSpeed * boost;
        if (-x >= w) x += w; if (x > 0) x -= w;
        track.style.transform = `translate3d(${x}px,0,0)`;
        vScroll.v *= 0.9;
      });
    });
  }
  marquee();

  /* ---------- 6. magnetic primary buttons ---------- */
  if (window.matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('[data-magnetic]').forEach((btn) => {
      const strength = 0.3;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        gsap.to(btn, { x: (e.clientX - r.left - r.width / 2) * strength, y: (e.clientY - r.top - r.height / 2) * strength - 2, duration: 0.4, ease: 'power3.out' });
      });
      btn.addEventListener('mouseleave', () => gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1,0.4)' }));
    });
  }

  /* ---------- 7. hero load-in ---------- */
  window.addEventListener('load', () => ST.refresh());

  wireNav();

  /* ===================== helpers ===================== */
  function revealFallback() {
    document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach((el) => { el.style.opacity = 1; el.style.clipPath = 'none'; el.style.transform = 'none'; });
  }
  function initMarqueeCSS() {
    document.querySelectorAll('.marquee__track').forEach((track) => {
      track.innerHTML += track.innerHTML;
      track.style.animation = 'marquee-scroll 28s linear infinite';
    });
    const s = document.createElement('style');
    s.textContent = '@keyframes marquee-scroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}';
    document.head.appendChild(s);
  }

  let menuOpen = false;
  function wireNav() {
    const toggle = document.querySelector('.nav__toggle');
    const menu = document.querySelector('.nav__menu');
    if (!toggle || !menu) return;
    toggle.addEventListener('click', () => {
      menuOpen = !menuOpen;
      menu.classList.toggle('is-open', menuOpen);
      toggle.setAttribute('aria-expanded', String(menuOpen));
      if (lenis) menuOpen ? lenis.stop() : lenis.start();
    });
  }
  function closeMenu() {
    const menu = document.querySelector('.nav__menu');
    const toggle = document.querySelector('.nav__toggle');
    if (menu) menu.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    menuOpen = false;
    if (lenis) lenis.start();
  }
})();
