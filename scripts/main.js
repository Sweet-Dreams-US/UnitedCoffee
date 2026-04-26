// ==========================================================================
// UNITED COFFEE — Site interactions
// ==========================================================================

(function() {
  'use strict';

  // ---------- Nav scroll state ----------
  const nav = document.getElementById('nav');
  const setNavState = () => {
    if (!nav) return;
    if (window.scrollY > 24) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', setNavState, { passive: true });
  setNavState();

  // ---------- Mobile nav toggle ----------
  const toggle = document.getElementById('navToggle');
  const links  = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      links.classList.toggle('open');
    });
    links.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        toggle.classList.remove('open');
        links.classList.remove('open');
      }
    });
  }

  // ---------- Reveal on scroll ----------
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---------- Animated counters ----------
  const counters = document.querySelectorAll('[data-counter]');
  if ('IntersectionObserver' in window && counters.length) {
    const ic = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseFloat(el.dataset.counter);
        const dur = parseInt(el.dataset.duration || '1600', 10);
        const suffix = el.dataset.suffix || '';
        const start = performance.now();
        const fmt = (n) => {
          if (target >= 1000) return Math.round(n).toLocaleString();
          if (Number.isInteger(target)) return Math.round(n).toString();
          return n.toFixed(1);
        };
        const tick = (now) => {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = fmt(target * eased) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        ic.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(c => ic.observe(c));
  }

  // ---------- Demo form submissions ----------
  document.querySelectorAll('form[data-demo]').forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const wrap = form.closest('.form-wrap') || form;
      const data = Object.fromEntries(new FormData(form));
      console.log('[United Coffee Demo] Form submission:', data);

      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

      const successEl = document.createElement('div');
      successEl.className = 'form-success show';

      const eyebrow = document.createElement('span');
      eyebrow.className = 'mono text-rosso';
      eyebrow.textContent = '— Grazie Mille —';
      successEl.appendChild(eyebrow);

      const heading = document.createElement('h3');
      heading.className = 'h-2 mt-4';
      heading.textContent = "Message received.";
      successEl.appendChild(heading);

      const lead = document.createElement('p');
      lead.className = 'lead mt-4';
      lead.textContent = "Tony or Marina will reach out shortly. In the meantime, the espresso machine is on.";
      successEl.appendChild(lead);

      wrap.appendChild(successEl);
    });
  });

  // ---------- Year stamp ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Hero nav class (light text on dark hero) ----------
  const heroEl = document.querySelector('.hero');
  if (heroEl && nav) {
    nav.classList.add('on-hero');
    const heroIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) nav.classList.add('on-hero');
        else nav.classList.remove('on-hero');
      });
    }, { threshold: 0, rootMargin: '-80px 0px 0px 0px' });
    heroIO.observe(heroEl);
  }

})();
