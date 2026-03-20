/**
 * BM Data — JavaScript principal
 * Léger, sans dépendance externe
 */

(function () {
  'use strict';

  /* ─── Header scroll ─── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ─── Navigation mobile ─── */
  const navToggle  = document.querySelector('.nav-toggle');
  const siteNav    = document.querySelector('.site-nav');
  const navBackdrop = document.getElementById('nav-backdrop');
  let savedScrollY = 0;

  function openNav() {
    savedScrollY = window.scrollY;
    siteNav.classList.add('nav-open');
    navToggle.classList.add('active');
    navToggle.setAttribute('aria-expanded', 'true');
    // Fix scroll iOS Safari : position fixed + restauration scroll
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + savedScrollY + 'px';
    document.body.style.width = '100%';
    if (navBackdrop) navBackdrop.classList.add('active');
  }

  function closeNav() {
    siteNav.classList.remove('nav-open');
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    // Restaurer la position de scroll
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, savedScrollY);
    if (navBackdrop) navBackdrop.classList.remove('active');
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      siteNav.classList.contains('nav-open') ? closeNav() : openNav();
    });

    // Fermer en cliquant sur un lien
    siteNav.querySelectorAll('.nav-link, .nav-mobile-hub').forEach(link => {
      link.addEventListener('click', closeNav);
    });

    // Fermer via le backdrop
    if (navBackdrop) {
      navBackdrop.addEventListener('click', closeNav);
    }

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('nav-open')) {
        closeNav();
        navToggle.focus();
      }
    });
  }

  /* ─── Active nav link ─── */
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href && href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    } else if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    }
  });

  /* ─── FAQ Accordion ─── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // Fermer tous les autres
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });

      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ─── FAQ filtres par catégorie ─── */
  const faqFilters = document.querySelectorAll('.faq-filter');
  if (faqFilters.length > 0) {
    faqFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        const cat = filter.dataset.category;
        faqFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');

        document.querySelectorAll('.faq-section').forEach(section => {
          if (cat === 'all' || section.dataset.category === cat) {
            section.style.display = '';
          } else {
            section.style.display = 'none';
          }
        });
      });
    });
  }

  /* ─── Filtres Réalisations ─── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.realisation-card[data-category]');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        projectCards.forEach(card => {
          const match = filter === 'tous' || card.dataset.category === filter;
          card.style.display = match ? '' : 'none';
          card.style.opacity = match ? '1' : '0';
        });
      });
    });
  }

  /* ─── Fade-in au scroll (fallback sans motion) ─── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
  }

  /* ─── Formulaire contact ─── */
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = contactForm.querySelector('[type="submit"]');
      const successMsg = document.getElementById('form-success');
      const errorMsg   = document.getElementById('form-error');

      btn.disabled = true;
      btn.textContent = 'Envoi en cours…';

      // Formspree ou Netlify Forms
      const formData = new FormData(contactForm);
      const action = contactForm.getAttribute('action') || '#';

      try {
        if (action === '#') {
          // Demo : simuler succès
          await new Promise(r => setTimeout(r, 800));
          contactForm.style.display = 'none';
          if (successMsg) successMsg.style.display = 'block';
        } else {
          const res = await fetch(action, {
            method: 'POST',
            body: formData,
            headers: { 'Accept': 'application/json' }
          });
          if (res.ok) {
            contactForm.style.display = 'none';
            if (successMsg) successMsg.style.display = 'block';
          } else {
            throw new Error('Server error');
          }
        }
      } catch {
        btn.disabled = false;
        btn.textContent = 'Envoyer ma demande';
        if (errorMsg) errorMsg.style.display = 'block';
      }
    });
  }

  /* ─── Lien téléphone : tracking optionnel ─── */
  document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', () => {
      if (typeof gtag !== 'undefined') {
        gtag('event', 'click_phone', { event_category: 'cta' });
      }
    });
  });

  /* ─── Pré-remplissage formulaire depuis URL ─── */
  const params = new URLSearchParams(window.location.search);
  const serviceParam = params.get('service');
  const serviceSelect = document.getElementById('service');
  if (serviceParam && serviceSelect) {
    const options = serviceSelect.querySelectorAll('option');
    options.forEach(opt => {
      if (opt.value.toLowerCase().includes(serviceParam.replace(/-/g, ' '))) {
        opt.selected = true;
      }
    });
  }
  const auditParam = params.get('audit');
  if (auditParam === '1' && serviceSelect) {
    const options = serviceSelect.querySelectorAll('option');
    options.forEach(opt => {
      if (opt.value.toLowerCase().includes('audit')) {
        opt.selected = true;
      }
    });
  }

  /* ─── Révélation des sections au scroll ─── */
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {

    // Chaque enfant de .section-header apparaît en cascade : eyebrow → h2 → p
    document.querySelectorAll('.section-header').forEach(header => {
      Array.from(header.children).forEach((child, i) => {
        child.classList.add('fade-up');
        child.style.transitionDelay = (i * 0.14) + 's';
      });
    });

    // Blocs entiers qui se révèlent
    ['.cta-banner', '.featured-quote', '.process-steps', '.about-intro-layout', '.contact-layout']
      .forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (!el.classList.contains('fade-up')) el.classList.add('fade-up');
        });
      });

    // Stat items en cascade (desktop + mobile)
    document.querySelectorAll('.stats-grid .stat-item').forEach((item, i) => {
      item.classList.add('fade-up');
      item.style.transitionDelay = (i * 0.12) + 's';
    });

    // Observer unique pour tous les éléments fade-up (nouveaux + existants)
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -72px 0px', threshold: 0.1 });

    document.querySelectorAll('.fade-up').forEach(el => revealObserver.observe(el));
  }

  /* ─── Barre de progression au scroll ─── */
  const progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.prepend(progressBar);
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    progressBar.style.width = (scrolled * 100) + '%';
  }, { passive: true });

  /* ─── Orbes animés dans le hero ─── */
  const hero = document.querySelector('.hero');
  if (hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    [1, 2, 3].forEach(i => {
      const orb = document.createElement('div');
      orb.className = `hero-orb hero-orb-${i}`;
      orb.setAttribute('aria-hidden', 'true');
      hero.appendChild(orb);
    });

    /* Indicateur scroll (flèche bas) */
    const scrollHint = document.createElement('div');
    scrollHint.className = 'hero-scroll-hint';
    scrollHint.setAttribute('aria-hidden', 'true');
    scrollHint.innerHTML = '<div class="scroll-mouse"><div class="scroll-wheel"></div></div><span>Défiler</span>';
    hero.appendChild(scrollHint);
    /* Masquer au premier scroll */
    window.addEventListener('scroll', function hideHint() {
      if (window.scrollY > 80) {
        scrollHint.style.opacity = '0';
        window.removeEventListener('scroll', hideHint);
      }
    }, { passive: true });
  }

  /* ─── Compteur animé des statistiques ─── */
  function animateCounter(el) {
    const raw = el.textContent.trim();
    const match = raw.match(/([\d.]+)/);
    if (!match) return;
    const numStr = match[1];
    const target = parseFloat(numStr);
    const suffix = raw.replace(numStr, '');
    const isFloat = numStr.includes('.');
    const decimals = isFloat ? (numStr.split('.')[1] || '').length : 0;
    const duration = 1600;
    const startTime = performance.now();
    el.classList.add('counting');
    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = eased * target;
      el.textContent = (isFloat ? value.toFixed(decimals) : Math.round(value)) + suffix;
      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = raw;
        el.classList.remove('counting');
      }
    };
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const grid = entry.target.closest('.stats-grid');
          const idx = grid ? Array.from(grid.querySelectorAll('.stat-value')).indexOf(entry.target) : 0;
          setTimeout(() => animateCounter(entry.target), idx * 150);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('.stat-value').forEach(el => counterObserver.observe(el));
  }

  /* ─── Animations en cascade pour les grilles ─── */
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.problems-grid, .skills-grid').forEach(grid => {
      grid.querySelectorAll('.fade-up').forEach((card, i) => {
        card.style.transitionDelay = (i * 0.11) + 's';
      });
    });
    /* Grilles génériques 3 colonnes */
    document.querySelectorAll('.grid-3, .grid-auto').forEach(grid => {
      grid.querySelectorAll('.fade-up').forEach((card, i) => {
        if (!card.style.transitionDelay) {
          card.style.transitionDelay = (i * 0.1) + 's';
        }
      });
    });
  }

  /* ─── Cursor spotlight sur sections sombres ─── */
  if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const spotlight = document.createElement('div');
    spotlight.className = 'cursor-spotlight';
    spotlight.setAttribute('aria-hidden', 'true');
    document.body.appendChild(spotlight);
    let spotX = 0, spotY = 0, rafSpot;
    document.addEventListener('mousemove', (e) => {
      spotX = e.clientX;
      spotY = e.clientY;
      const darkEl = e.target.closest('.section--dark, .section--navy, .hero, .stats-band, .cta-banner');
      if (darkEl) {
        spotlight.classList.add('active');
      } else {
        spotlight.classList.remove('active');
      }
      if (!rafSpot) {
        rafSpot = requestAnimationFrame(() => {
          spotlight.style.left = spotX + 'px';
          spotlight.style.top  = spotY + 'px';
          rafSpot = null;
        });
      }
    }, { passive: true });
  }

  /* ─── Effet magnétique sur les boutons principaux ─── */
  if (window.innerWidth > 768 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.btn-gold, .btn-primary').forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.18;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.18;
        btn.style.transform = `translateY(-1px) translate(${x}px, ${y}px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ─── Effet tilt 3D sur les cards (desktop) ─── */
  if (window.innerWidth > 1024 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.service-card, .realisation-card, .testimonial-card').forEach(card => {
      card.style.transformStyle = 'preserve-3d';
      card.style.transition = 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease';
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientY - rect.top - rect.height / 2) / rect.height;
        const y = (e.clientX - rect.left - rect.width / 2) / rect.width;
        card.style.transform = `perspective(700px) rotateX(${-x * 5}deg) rotateY(${y * 5}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ─── Hub : partage du lien ─── */
  document.querySelectorAll('[data-share-hub]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.shareHub;
      const feedback = document.querySelector('.hub-share__feedback');
      const show = (msg) => {
        if (!feedback) return;
        feedback.textContent = msg;
        setTimeout(() => { feedback.textContent = ''; }, 2800);
      };
      if (navigator.share) {
        try { await navigator.share({ title: document.title, url }); } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(url);
          show('Lien copié dans le presse-papier !');
        } catch {
          show(url);
        }
      }
    });
  });

  /* ─── Hub : carousel ─── */
  document.querySelectorAll('[data-carousel]').forEach(carousel => {
    const track = carousel.querySelector('[data-carousel-track]');
    const prev  = carousel.querySelector('[data-carousel-prev]');
    const next  = carousel.querySelector('[data-carousel-next]');
    if (!track) return;
    const itemWidth = () => {
      const item = track.querySelector('.hub-featured__item');
      return item ? item.offsetWidth + 12 : 292;
    };
    if (prev) prev.addEventListener('click', () => track.scrollBy({ left: -itemWidth(), behavior: 'smooth' }));
    if (next) next.addEventListener('click', () => track.scrollBy({ left:  itemWidth(), behavior: 'smooth' }));
  });

})();
