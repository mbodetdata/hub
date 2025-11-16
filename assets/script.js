/* ===========================================================================
   ABM — JS unifié (premium, moderne & épuré) — VERSION SEO/PERF
   =========================================================================== */
'use strict';

/* ========================= 0) Timing helpers ========================= */
const runIdle = (fn) => {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout: 1800 });
  else setTimeout(fn, 1);
};
const raf = (fn) => (window.requestAnimationFrame || ((f)=>setTimeout(f,16)))(fn);

/* ========================= 1) Utils légers ========================= */
const $   = (sel, scope=document) => scope.querySelector(sel);
const $$  = (sel, scope=document) => Array.from(scope.querySelectorAll(sel));
const on  = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const off = (el, ev, fn, opts) => el && el.removeEventListener(ev, fn, opts);
const mq  = (q) => window.matchMedia ? window.matchMedia(q) : { matches:false, addEventListener(){}, removeEventListener(){} };

const PREFERS_REDUCED = mq('(prefers-reduced-motion: reduce)').matches;

/* =================== 2) Navigation mobile (burger + ARIA) =================== */
(() => {
  const toggle = $('.nav-toggle');
  const panel  = $('#nav-collapsible');
  if (!toggle || !panel) return;

  const setState = (open) => {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'nav-collapsible');

  on(toggle, 'click', () => setState(!panel.classList.contains('open')), { passive:true });
  on(panel, 'click', (e) => { if (e.target.closest('a,button')) setState(false); }, { passive:true });

  const bp = mq('(min-width: 992px)');
  const onChange = () => { if (bp.matches) setState(false); };
  bp.addEventListener?.('change', onChange);
})();

/* ==================== 2.1) Header UX (shrink + active link) ==================== */
(() => {
  const header = document.querySelector('.site-header');
  if (!header) return;

  // Shrink on scroll
  const onScroll = () => {
    const sc = window.scrollY || document.documentElement.scrollTop;
    header.classList.toggle('is-scrolled', sc > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const navAllLinks = Array.from(header.querySelectorAll('a[data-nav]'));
  if (!navAllLinks.length) return;

  const navDesktopLinks = navAllLinks.filter(link => link.closest('.nav-desktop'));
  const navGroups = Object.create(null);
  const navMeta = Object.create(null);

  const normalizePath = (path) => {
    if (!path) return '/';
    const qIdx = path.indexOf('?');
    if (qIdx !== -1) path = path.slice(0, qIdx);
    if (!path.startsWith('/')) path = `/${path}`;
    path = path.replace(/\/{2,}/g, '/');
    if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
    return path;
  };

  navAllLinks.forEach((link) => {
    const key = link.dataset.nav;
    if (!key) return;
    if (!navGroups[key]) navGroups[key] = [];
    navGroups[key].push(link);
    try {
      const url = new URL(link.getAttribute('href'), window.location.origin);
      const path = normalizePath(url.pathname);
      const hash = url.hash ? url.hash.slice(1) : '';
      if (!navMeta[key]) navMeta[key] = [];
      navMeta[key].push({ path, hash });
    } catch {
      /* ignore malformed URLs */
    }
  });

  const applyAccent = (hot) => {
    const a = hot ? 'color-mix(in oklab, var(--brand) 75%, #fff 25%)' : 'var(--brand)';
    const b = hot ? 'color-mix(in oklab, var(--brand-2) 75%, #fff 25%)' : 'var(--brand-2)';
    header.style.setProperty('--accent-a', a);
    header.style.setProperty('--accent-b', b);
  };
  navDesktopLinks.forEach((link) => {
    link.addEventListener('mouseenter', () => applyAccent(true), { passive: true });
    link.addEventListener('mouseleave', () => applyAccent(false), { passive: true });
    link.addEventListener('focus', () => applyAccent(true), { passive: true });
    link.addEventListener('blur', () => applyAccent(false), { passive: true });
  });

  const clearActive = () => navAllLinks.forEach(link => link.classList.remove('is-active'));
  let currentKey = null;
  const setActiveNav = (key) => {
    if (!key || !navGroups[key]) {
      if (currentKey) {
        currentKey = null;
        clearActive();
      }
      return;
    }
    if (currentKey === key) return;
    clearActive();
    navGroups[key].forEach(link => link.classList.add('is-active'));
    currentKey = key;
  };

  const currentPath = normalizePath(window.location.pathname);
  const homeMeta = (navMeta.home || []).find(meta => !meta.hash);
  const basePath = homeMeta ? homeMeta.path : '/';
  const relativePath = (() => {
    if (basePath !== '/' && currentPath.startsWith(basePath)) {
      const trimmed = currentPath.slice(basePath.length) || '/';
      return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    }
    return currentPath;
  })();
  const pathKey = (() => {
    const segments = relativePath.split('/').filter(Boolean);
    if (navGroups.services && segments.some(seg => seg.startsWith('services-'))) return 'services';
    if (navGroups.blog && segments[0] === 'blog') return 'blog';
    if (navGroups.realisations && segments[0] === 'realisation') return 'realisations';
    if (navGroups.methodes && segments[0] === 'methodes') return 'methodes';
    if (navGroups.about && segments[0] === 'about-me') return 'about';

    for (const [key, metas] of Object.entries(navMeta)) {
      if (metas.some(meta => !meta.hash && meta.path === currentPath)) return key;
    }
    for (const [key, metas] of Object.entries(navMeta)) {
      if (metas.some(meta => !meta.hash && meta.path !== '/' && currentPath.startsWith(`${meta.path}/`))) return key;
    }
    if ((currentPath === '/' || relativePath === '/') && navGroups.home) return 'home';
    return null;
  })();

  let scrollKey = null;
  const updateActive = () => setActiveNav(scrollKey || pathKey || null);
  updateActive();

  const sectionConfig = Object.entries({
    certifications: 'certifications',
    methodes: 'methodes',
    services: 'services',
    contact: 'contact'
  }).map(([id, key]) => ({ id, key, el: document.getElementById(id) }))
    .filter(item => item.el && navGroups[item.key]);

  const sectionById = new Map(sectionConfig.map(({ id, key }) => [id, key]));

  const initialHash = (window.location.hash || '').slice(1);
  if (initialHash && sectionById.has(initialHash)) {
    scrollKey = sectionById.get(initialHash);
    updateActive();
  }

  if (sectionConfig.length) {
    if ('IntersectionObserver' in window) {
      const ratios = new Map(sectionConfig.map(({ id }) => [id, 0]));
      const pickBest = () => {
        let bestId = null;
        let best = 0;
        for (const { id } of sectionConfig) {
          const ratio = ratios.get(id) || 0;
          if (ratio > best) {
            best = ratio;
            bestId = id;
          }
        }
        if (best > 0.12 && bestId && sectionById.has(bestId)) {
          scrollKey = sectionById.get(bestId);
        } else if (bestId === null || best <= 0.12) {
          scrollKey = null;
        }
        updateActive();
      };
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        });
        pickBest();
      }, { root: null, threshold: [0, 0.2, 0.35, 0.5, 0.65, 0.8, 1], rootMargin: '-10% 0px -35% 0px' });

      sectionConfig.forEach(({ el }) => observer.observe(el));
    } else {
      const compute = () => {
        const vh = window.innerHeight || document.documentElement.clientHeight || 1;
        let bestId = null;
        let best = 0;
        sectionConfig.forEach(({ el, id }) => {
          const rect = el.getBoundingClientRect();
          const visible = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
          const ratio = Math.min(1, visible / Math.max(rect.height, 1));
          if (ratio > best) {
            best = ratio;
            bestId = id;
          }
        });
        if (best > 0.2 && bestId && sectionById.has(bestId)) {
          scrollKey = sectionById.get(bestId);
        } else {
          scrollKey = null;
        }
        updateActive();
      };
      compute();
      window.addEventListener('scroll', compute, { passive: true });
      window.addEventListener('resize', compute, { passive: true });
    }
  }

  window.addEventListener('hashchange', () => {
    const id = (window.location.hash || '').slice(1);
    scrollKey = id && sectionById.has(id) ? sectionById.get(id) : null;
    updateActive();
  }, { passive: true });
})();

/* =================== 4) Modals utilitaires (focus-trap & co) =================== */
const Modal = (() => {
  const FOCUSABLE = [
    'a[href]','area[href]','button:not([disabled])','input:not([disabled])',
    'select:not([disabled])','textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');
  const root = document.documentElement;

  const trap = (modal) => {
    const nodes = $$(FOCUSABLE, modal);
    if (!nodes.length) return () => {};
    const first = nodes[0], last = nodes[nodes.length - 1];
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    on(modal, 'keydown', onKey);
    return () => off(modal, 'keydown', onKey);
  };

  const lockScroll = () => {
    const anyOpen = Array.from(document.querySelectorAll('.modal')).some((m) => !m.hidden);
    root.classList.toggle('is-modal-open', anyOpen);
    document.body?.classList.toggle('is-modal-open', anyOpen);
  };

  const focusFirst = (modal) => {
    const target = modal.querySelector(FOCUSABLE) || modal;
    try { target.focus?.({ preventScroll: true }); }
    catch { target.focus?.(); }
  };

  const open = (modal) => {
    if (!modal) return;
    clearTimeout(modal._closeTimer);
    modal.hidden = false;
    modal.classList.add('is-visible');
    modal.classList.remove('is-active');
    modal._untrap = trap(modal);
    modal._restore = document.activeElement;
    requestAnimationFrame(() => modal.classList.add('is-active'));
    focusFirst(modal);
    lockScroll();
  };

  const close = (modal) => {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-active');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      modal.hidden = true;
      modal.classList.remove('is-visible');
      modal._untrap?.();
      const restore = modal._restore;
      if (restore && typeof restore.focus === 'function') {
        try { restore.focus({ preventScroll: true }); }
        catch { restore.focus(); }
      }
      modal._restore = null;
      lockScroll();
    };
    clearTimeout(modal._closeTimer);
    const anim = parseFloat(window.getComputedStyle(modal).getPropertyValue('--modal-anim-ms')) || 240;
    modal._closeTimer = window.setTimeout(finish, anim);
  };

  const bind = (modal) => {
    if (!modal) return;
    on(modal, 'click', (e) => {
      if (e.target === modal || e.target.classList?.contains('modal__overlay') || e.target.dataset.close === 'true') close(modal);
    });
    $$('.modal__close,[data-close]', modal).forEach((btn) => on(btn, 'click', () => close(modal), { passive: true }));
    on(document, 'keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(modal); });
  };

  return { open, close, bind };
})();

/* ========== 5) Formulaire (Formspree AJAX + modal “Merci”) ========== */
(() => {
  const form   = $('#contactForm');
  if (!form) return;

  const endpoint  = form.dataset.endpoint;
  const submitBtn = $('#contactSubmit');
  const statusEl  = $('#contactStatus');
  const modal     = $('#contact-modal');

  Modal.bind(modal);

  const setStatus = (msg, isError=false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.display = 'block';
    statusEl.setAttribute('role', 'status');
    statusEl.setAttribute('aria-live', isError ? 'assertive' : 'polite');
  };

  on(form, 'submit', async (e) => {
    e.preventDefault();
    if (!endpoint) { console.error('Formspree endpoint manquant'); return; }
    if (statusEl) statusEl.style.display = 'none';

    const fd = new FormData(form);
    if (!fd.get('_subject')) fd.set('_subject', `[Site] ${fd.get('subject') || 'Nouveau message'}`);

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Envoi…'; }

    try {
      const res = await fetch(endpoint, { method:'POST', headers:{ 'Accept':'application/json' }, body:fd });
      if (res.ok) { form.reset(); Modal.open(modal); }
      else { setStatus("Oups, l’envoi a échoué. Réessayez ou contactez-moi par email.", true); }
    } catch {
      setStatus("Erreur réseau. Vérifiez votre connexion et réessayez.", true);
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Envoyer'; }
    }
  });
})();

/* ====== 6) Carousel certifications (dots + centre) ====== */
(() => {
  const rail     = document.getElementById('certs-rail');
  const dotsWrap = document.querySelector('.certs-dots');
  if (!rail || !dotsWrap) return;
  if (rail.dataset.certsCarouselReady === '1') return;
  rail.dataset.certsCarouselReady = '1';

  const slides = Array.from(rail.querySelectorAll(':scope > li'));
  if (!slides.length) return;

  rail.setAttribute('tabindex', '0');
  rail.setAttribute('role', 'region');
  rail.setAttribute('aria-label', 'Certifications (carousel)');

  dotsWrap.replaceChildren();
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'certs-dot';
    b.setAttribute('aria-label', `Aller à la certification ${i + 1}`);
    dotsWrap.appendChild(b);
    return b;
  });

  const centerOffsetFor = (el) => el.offsetLeft - (rail.clientWidth - el.clientWidth) / 2;
  const scrollToSlide = (i) => rail.scrollTo({ left: centerOffsetFor(slides[i]), behavior: PREFERS_REDUCED ? 'auto' : 'smooth' });
  const setActive = (i) => dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));

  dots.forEach((b, i) => b.addEventListener('click', () => scrollToSlide(i), { passive: true }));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      let bestI = null, bestRatio = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = slides.indexOf(e.target);
        if (i > -1 && e.intersectionRatio > bestRatio) { bestRatio = e.intersectionRatio; bestI = i; }
      }
      if (bestI !== null) setActive(bestI);
    }, { root: rail, threshold: [0.5, 0.6, 0.7, 0.8] });
    slides.forEach(el => io.observe(el));
  } else {
    const onScroll = () => {
      const deltas = slides.map(el => Math.abs(centerOffsetFor(el) - rail.scrollLeft));
      setActive(deltas.indexOf(Math.min(...deltas)));
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
  }

  setActive(0);

  rail.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const cur  = dots.findIndex(d => d.classList.contains('is-active'));
    const next = e.key === 'ArrowRight' ? Math.min(cur + 1, slides.length - 1) : Math.max(cur - 1, 0);
    scrollToSlide(next);
  });

  let rid = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame?.(rid);
    rid = requestAnimationFrame(() => {
      const current = dots.findIndex(d => d.classList.contains('is-active'));
      scrollToSlide(current < 0 ? 0 : current);
    });
  }, { passive: true });
})();

/* ===== Certifications: limiter les tags + toggle "Afficher plus" ===== */
(() => {
  const lists = document.querySelectorAll('.cert-card .cert-tags');
  lists.forEach(ul => {
    const items = ul.querySelectorAll('.tag');
    if (items.length <= 5) return;
    ul.classList.add('is-collapsed');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tags-toggle';
    btn.textContent = 'Afficher plus';
    btn.addEventListener('click', () => {
      const collapsed = ul.classList.toggle('is-collapsed');
      btn.textContent = collapsed ? 'Afficher plus' : 'Afficher moins';
    });
    ul.after(btn);
  });
})();

/* ================== 7) Microsoft Booking (inline + CTA) ================== */
(() => {
  const boot = () => {
    const meta = document.querySelector('meta[name="cal:link"]');
    const bookingUrl = (meta?.getAttribute('content') || '').trim();
    if (!bookingUrl) return;

    const ensureFrame = (container) => {
      if (!container) return null;
      const frame = container.querySelector('iframe');
      if (!frame) return null;
      container.classList.add('is-loading');
      container.classList.remove('is-ready');
      const skeleton = container.querySelector('.calendly-skeleton');
      const finish = () => {
        container.classList.add('is-ready');
        container.classList.remove('is-loading');
        skeleton?.classList.add('is-hidden');
      };
      if (!frame.dataset.bookingInit) {
        frame.dataset.bookingInit = '1';
        frame.addEventListener('load', finish, { once: true });
      }
      if (frame.getAttribute('src') !== bookingUrl) frame.setAttribute('src', bookingUrl);
      window.setTimeout(finish, 3200);
      return frame;
    };

    const ensureBookingModal = () => {
      let modal = document.getElementById('calendly-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'calendly-modal';
        modal.className = 'modal modal--booking';
        modal.hidden = true;
        modal.classList.remove('is-visible', 'is-active');
        modal.innerHTML = `
  <div class="modal__dialog booking-modal" role="dialog" aria-modal="true" aria-labelledby="calendlyTitle" aria-describedby="calendlySubtitle">
    <div class="booking-modal__glow" aria-hidden="true"></div>
    <header class="booking-modal__header">
      <div class="booking-modal__titles">
        <h3 id="calendlyTitle">Planifiez votre rendez-vous</h3>
        <p id="calendlySubtitle">Choisissez un cr&eacute;neau de 30&nbsp;minutes pour &eacute;changer avec un expert Power&nbsp;BI &amp; Talend.</p>
      </div>
      <button class="modal__close booking-modal__close" type="button" aria-label="Fermer">
        <span aria-hidden="true">&times;</span>
      </button>
    </header>
    <div class="booking-modal__content">
      <section class="booking-modal__agenda" aria-labelledby="calendlyAgendaTitle">
        <h4 id="calendlyAgendaTitle">D&eacute;roul&eacute; (30&nbsp;min)</h4>
        <ul>
          <li>Pr&eacute;sentation rapide de votre contexte</li>
          <li>Identification de vos enjeux et objectifs</li>
          <li>&Eacute;change sur les solutions possibles</li>
          <li>Prochaines &eacute;tapes &eacute;ventuelles</li>
        </ul>
        <p class="booking-modal__agenda-note">La r&eacute;union se fera en visio avec lien automatique dans l&rsquo;invitation (pensez &agrave; v&eacute;rifier vos spams).</p>
      </section>
      <div class="booking-modal__frame">
        <div id="calendly-inline" class="calendly-inline booking-modal__iframe" data-booking-url="">
          <div class="calendly-skeleton booking-modal__skeleton" aria-hidden="true">
            <div class="booking-modal__loader" role="presentation">
              <span class="booking-modal__dot"></span>
              <span class="booking-modal__dot"></span>
              <span class="booking-modal__dot"></span>
            </div>
            <p>Chargement de votre espace de r&eacute;servation&hellip;</p>
          </div>
          <iframe title="R&eacute;server un cr&eacute;neau" loading="lazy" allowtransparency="true"></iframe>
        </div>
      </div>
    </div>
  </div>`;
        document.body.appendChild(modal);
      } else {
        modal.classList.add('modal--booking');
      }

      const container = modal.querySelector('#calendly-inline');
      if (container) {
        container.classList.add('booking-modal__iframe');
        if (bookingUrl) container.setAttribute('data-booking-url', bookingUrl);
        container.querySelector('.calendly-skeleton')?.classList.add('booking-modal__skeleton');
      }
      const iframe = container?.querySelector('iframe');
      if (iframe) {
        if (!iframe.dataset.bookingSrc && iframe.getAttribute('src')) iframe.dataset.bookingSrc = iframe.getAttribute('src');
        iframe.removeAttribute('src');
        iframe.setAttribute('title', 'R&eacute;server un cr&eacute;neau');
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('allowtransparency', 'true');
      }
      if (modal && !modal.dataset.bound) {
        Modal.bind(modal);
        modal.dataset.bound = '1';
      }
      return { modal, container };
    };

    const inlineContainer = document.getElementById('calendly-inline-embed');
    const actionsRow = document.querySelector('.contact-hub .actions--center');
    const mqDesk = window.matchMedia ? window.matchMedia('(min-width: 992px)') : { matches: false, addEventListener(){}, removeEventListener(){} };

    const toggleActions = () => {
      if (!actionsRow) return;
      const hidden = !!mqDesk.matches;
      actionsRow.style.display = hidden ? 'none' : '';
      actionsRow.setAttribute('aria-hidden', hidden ? 'true' : 'false');
    };

    toggleActions();
    mqDesk.addEventListener?.('change', (event) => {
      toggleActions();
      if (event.matches) ensureFrame(inlineContainer);
    });

    if (mqDesk.matches) ensureFrame(inlineContainer);

    const { modal, container: modalContainer } = ensureBookingModal();

    const openBooking = (event) => {
      event?.preventDefault();
      if (modal && modalContainer) {
        ensureFrame(modalContainer);
        modal.classList.add('is-opening');
        Modal.open(modal);
        window.setTimeout(() => modal.classList.remove('is-opening'), 420);
      } else {
        const win = window.open(bookingUrl, '_blank');
        if (win) win.opener = null;
      }
    };

    document.querySelectorAll('[data-booking-open]').forEach((btn) => {
      if (btn.dataset.bookingBound) return;
      btn.dataset.bookingBound = '1';
      btn.setAttribute('aria-haspopup', 'dialog');
      btn.setAttribute('aria-controls', 'calendly-modal');
      btn.addEventListener('click', openBooking);
    });

    if (!document.querySelector('.booking-float-cta')) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'booking-float-cta';
      btn.setAttribute('aria-label', 'Prendre rendez-vous');
      btn.setAttribute('data-booking-open', 'floating');
      btn.innerHTML = `
        <span class="cal-ico" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="2"></rect>
            <path d="M8 3v4M16 3v4M3 10h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
          </svg>
        </span>
        <span class="cal-label">
          <strong>Prendre rendez-vous</strong>
          <small>30&nbsp;min offertes</small>
        </span>`;
      btn.addEventListener('click', openBooking);
      btn.dataset.bookingBound = '1';
      document.body.appendChild(btn);
    }

    if (!document.getElementById('booking-float-cta-style')) {
      const st = document.createElement('style');
      st.id = 'booking-float-cta-style';
      st.textContent = `
        .booking-float-cta{ position:fixed; right:14px; bottom:14px; z-index:9999;
          display:inline-flex; align-items:center; gap:.55rem; padding:.75rem 1.05rem;
          border-radius:999px; border:0; background:linear-gradient(135deg,
            color-mix(in oklab, var(--brand) 74%, transparent),
            color-mix(in oklab, var(--brand-2) 58%, transparent));
          color:#fff; font-weight:700; letter-spacing:.01em;
          box-shadow:0 14px 32px color-mix(in oklab, var(--brand) 36%, transparent);
          cursor:pointer; transition:transform .22s ease, box-shadow .22s ease; }
        .booking-float-cta .cal-label{ display:flex; flex-direction:column; align-items:flex-start; line-height:1.1; }
        .booking-float-cta .cal-label strong{ font-size:.9rem; font-weight:800; }
        .booking-float-cta .cal-label small{ font-size:.68rem; opacity:.78; }
        .booking-float-cta:hover{ transform:translateY(-2px); box-shadow:0 20px 44px color-mix(in oklab, var(--brand) 42%, transparent); }
        .booking-float-cta:focus-visible{ outline:none; box-shadow:0 0 0 4px color-mix(in oklab, #fff 75%, transparent), 0 0 0 8px color-mix(in oklab, var(--brand) 48%, transparent); }
        .booking-float-cta .cal-ico{ display:grid; place-items:center; width:34px; height:34px; border-radius:12px;
          background: color-mix(in oklab, rgba(255,255,255,.85) 24%, transparent);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        @media (max-width:540px){ .booking-float-cta{ right:11px; bottom:11px; padding:.68rem .95rem; }
          .booking-float-cta .cal-label strong{ font-size:.86rem; }
          .booking-float-cta .cal-label small{ display:none; } }
      `;
      document.head.appendChild(st);
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();


/* ================== 8) Copy to clipboard (contacts) ================== */
(() => {
  const rows = $$('.contact-row');
  if (!rows.length) return;

  const resolveText = (row) => {
    const btn  = row.querySelector('.ci-copy-btn');
    if (!btn) return null;
    const explicit = btn.getAttribute('data-copy');
    if (explicit && explicit.trim()) return explicit.trim();
    const link = row.querySelector('.contact-item[href]');
    if (link) {
      const href = (link.getAttribute('href') || '').trim();
      if (/^mailto:/i.test(href)) return decodeURIComponent(href.replace(/^mailto:/i,'')).replace(/\?.*$/,'');
      if (/^tel:/i.test(href))    return href.replace(/^tel:/i,'');
    }
    const strong = row.querySelector('.ci-body strong');
    return strong?.textContent?.trim() || null;
  };

  const copyText = async (txt) => {
    if (!txt) throw new Error('Nothing to copy');
    try { await navigator.clipboard.writeText(txt); return true; }
    catch {
      const ta = document.createElement('textarea');
      ta.value = txt; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.opacity='0'; document.body.appendChild(ta);
      ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch {}
      document.body.removeChild(ta); return ok;
    }
  };

  rows.forEach(row => {
    const btn = row.querySelector('.ci-copy-btn'); if (!btn) return;
    const announcer = (() => {
      let live = row.querySelector('.sr-only[role="status"]');
      if (!live) { live = document.createElement('span'); live.className='sr-only'; live.setAttribute('role','status'); live.setAttribute('aria-live','polite'); row.appendChild(live); }
      return (msg) => { live.textContent = msg; };
    })();

    on(btn, 'click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      const value = btn.getAttribute('data-copy')?.trim() || resolveText(row);
      if (!value) return;
      const prev = btn.innerHTML;
      try {
        const ok = await copyText(value);
        btn.classList.add('is-copied');
        btn.setAttribute('aria-label', ok ? 'Copié !' : 'Échec de la copie');
        btn.innerHTML = ok ? '✓' : '!';
        announcer(ok ? 'Copié dans le presse-papier' : 'La copie a échoué');
      } finally {
        setTimeout(() => {
          btn.classList.remove('is-copied'); btn.innerHTML = prev; btn.setAttribute('aria-label', 'Copier');
        }, 1200);
      }
    }, { passive:false });
  });
})();

/* ================== 9) Fallback logos certifications ================== */
(() => {
  document.querySelectorAll('.cert-logo').forEach(img => {
    img.addEventListener('error', () => {
      const wrap = img.closest('.cert-badge'); if (!wrap) return;
      wrap.innerHTML = `
        <svg class="cert-ph" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
          <defs><linearGradient id="gradABM" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="currentColor" stop-opacity=".25"/><stop offset="1" stop-color="currentColor" stop-opacity=".55"/>
          </linearGradient></defs>
          <rect x="0.5" y="0.5" width="55" height="55" rx="12" fill="url(#gradABM)" stroke="currentColor" opacity=".5"/>
          <g transform="translate(0,1)"><path d="M20 28h16M28 20v16" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".9"/></g>
        </svg>`;
    }, { once: true });
  });
})();

/* ================== 10) Modal Projet (home) ================== */
(() => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;
  Modal.bind(modal);

  const titleEl    = document.getElementById('project-title');
  const clientEl   = document.getElementById('project-client');
  const abstractEl = document.getElementById('project-abstract');
  const ctxEl      = document.getElementById('project-contexte');
  const missionsEl = document.getElementById('project-missions');
  const benefEl    = document.getElementById('project-benefices');
  const stackEl    = document.getElementById('project-stack');
  const linkEl     = document.getElementById('project-link');

  // Abbrify helper: inject <abbr> for common technical terms
  const abbrs = [
    { re: /\bPower\s?BI\b/gi, html: '<abbr title="Business Intelligence">Power BI</abbr>' },
    { re: /\bCI\s*\/\s*CD\b/gi, html: '<abbr title="Continuous Integration / Continuous Deployment">CI/CD</abbr>' },
    { re: /\bETL\b/gi, html: '<abbr title="Extract-Transform-Load">ETL</abbr>' },
    { re: /\bAPI\b/gi, html: '<abbr title="Application Programming Interface">API</abbr>' },
    { re: /\bNoSQL\b/gi, html: '<abbr title="Not Only SQL">NoSQL</abbr>' },
    { re: /\bSQL\b/gi, html: '<abbr title="Structured Query Language">SQL</abbr>' },
    { re: /\bDAX\b/gi, html: '<abbr title="Data Analysis Expressions">DAX</abbr>' },
    { re: /\bKPI\b/gi, html: '<abbr title="Key Performance Indicator">KPI</abbr>' },
    { re: /\bSLA\b/gi, html: '<abbr title="Service Level Agreement">SLA</abbr>' },
    { re: /\bWMS\b/gi, html: '<abbr title="Warehouse Management System">WMS</abbr>' },
    { re: /\bTMS\b/gi, html: '<abbr title="Transport Management System">TMS</abbr>' },
    { re: /\bSSO\b/gi, html: '<abbr title="Single Sign-On">SSO</abbr>' },
    { re: /\bRLS\b/gi, html: '<abbr title="Row-Level Security">RLS</abbr>' },
    { re: /\bSaaS\b/gi, html: '<abbr title="Software as a Service">SaaS</abbr>' }
  ];
  const abbrify = (s) => {
    if (!s) return '';
    let out = String(s);
    // Ensure longer terms first to avoid partial overlaps
    abbrs.forEach(({ re, html }) => { out = out.replace(re, html); });
    return out;
  };

  // --- conversions robustes ---
  const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (value == null) return [];
    if (typeof value === 'string') {
      const s = value.trim();
      if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return [];
      if (s.startsWith('[') || s.startsWith('{')) {
        try {
          const parsed = JSON.parse(s);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && typeof parsed === 'object') return Object.values(parsed);
        } catch {}
      }
      const SEP = ['•', '|', ';'].find(sep => s.includes(sep));
      if (SEP) return s.split(SEP).map(t => t.trim()).filter(Boolean);
      return [s];
    }
    try { return JSON.parse(String(value)); } catch { return []; }
  };
  const renderList = (ul, data) => {
    ul.innerHTML = '';
    toArray(data).forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = abbrify(item);
      ul.appendChild(li);
    });
  };

  function fill(card){
    titleEl.innerHTML      = abbrify(card.dataset.title || '');
    clientEl.textContent   = card.dataset.client ? `Client : ${card.dataset.client}` : '';
    abstractEl.innerHTML   = abbrify(card.dataset.abstract || '');
    ctxEl.innerHTML        = abbrify(card.dataset.contexte || '');
    renderList(missionsEl,  card.dataset.missions);
    renderList(benefEl,     card.dataset.benefices);
    renderList(stackEl,     card.dataset.stack);
    if (linkEl) {
      if (card.dataset.link) { linkEl.href = card.dataset.link; linkEl.setAttribute('aria-label', `Ouvrir ${card.dataset.title}`); }
      else { linkEl.removeAttribute('href'); }
    }
  }

  // Ouverture depuis les cartes
  document.querySelectorAll('.project-card').forEach(card => {
    const open = (e) => { e?.preventDefault?.(); fill(card); Modal.open(modal); };
    card.querySelector('.open-project')?.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { open(e); } });
    card.addEventListener('click', e => {
      if (e.target.closest('a, .open-project')) return;
      open(e);
    });
  });
})();

/* ================== 11) Carousel (réalisations) — dots + autoplay ================== */
(() => {
  const carousels = document.querySelectorAll('[data-carousel]');
  if (!carousels.length) return;

  carousels.forEach(root => {
    const track = root.querySelector('.carousel__track');
    const slides = Array.from(track.querySelectorAll('.carousel__slide'));
    const prev  = root.querySelector('.carousel__btn.prev');
    const next  = root.querySelector('.carousel__btn.next');
    const dotsWrap = root.querySelector('.carousel__dots');
    const itemLabel = root.dataset.carouselLabel || 'la diapositive';
    if (!slides.length) return;

    // Offsets simples (alignement au début) pour robustesse et atteinte des extrémités
    let offsets = [];
    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const computeOffsets = () => {
      const m = maxScroll();
      offsets = slides.map(s => Math.min(s.offsetLeft, m));
      if (offsets.length) offsets[offsets.length - 1] = m; // dernier slide = fin atteignable
    };
    const closestIndex = () => {
      const x = track.scrollLeft; let best = 0, bestDist = 1e9;
      offsets.forEach((off, i) => { const d = Math.abs(off - x); if (d < bestDist){ best = i; bestDist = d; } });
      return best;
    };
    const scrollToIndex = (i, smooth=true) => {
      let target = i;
      let wrap = false;
      if (i < 0) { target = slides.length - 1; wrap = true; }
      else if (i >= slides.length) { target = 0; wrap = true; }
      const left = offsets[target] ?? 0;
      const behavior = (smooth && !PREFERS_REDUCED && !wrap) ? 'smooth' : 'auto';
      track.scrollTo({ left, behavior });
      setTimeout(updateUI, behavior === 'smooth' ? 300 : 0);
      restartAutoplay();
    };
    const updateArrows = () => { prev.disabled = false; next.disabled = false; };

    const dots = slides.map((_, i) => {
      const b = document.createElement('button');
      b.type='button'; b.className='carousel__dot';
      b.setAttribute('aria-label', `Aller à ${itemLabel} ${i+1}`);
      b.addEventListener('click', () => scrollToIndex(i));
      dotsWrap.appendChild(b); return b;
    });
    const updateDots = (i=closestIndex()) => dots.forEach((d,k)=>d.classList.toggle('is-active', k===i));
    const updateUI = () => { const i = closestIndex(); updateArrows(i); updateDots(i); };

    const AUTOPLAY_MS = 5000; let timer=null;
    const startAutoplay = () => { if (!timer) timer = setInterval(() => { let i = closestIndex()+1; if (i>=slides.length) i=0; scrollToIndex(i); }, AUTOPLAY_MS); };
    const stopAutoplay  = () => { clearInterval(timer); timer=null; };
    const restartAutoplay = () => { stopAutoplay(); startAutoplay(); };

    root.addEventListener('pointerenter', stopAutoplay);
    root.addEventListener('pointerleave', startAutoplay);
    root.addEventListener('focusin', stopAutoplay);
    root.addEventListener('focusout', startAutoplay);

    const atStart = () => track.scrollLeft <= 3;
    const atEnd   = () => track.scrollLeft >= maxScroll() - 3;

    // Navigation: toujours relative et bouclée (wrap assuré par scrollToIndex)
    prev.addEventListener('click', () => {
      scrollToIndex(closestIndex() - 1);
    });
    next.addEventListener('click', () => {
      // Si on est vraiment au bout, forcer le wrap vers le premier
      if (atEnd()) scrollToIndex(slides.length);
      else scrollToIndex(closestIndex() + 1);
    });
    track.addEventListener('scroll', () => { raf(updateUI); });
    window.addEventListener('resize', () => { computeOffsets(); updateUI(); });

    // Calcul initial des positions puis forcer l'ancrage au premier slide
    computeOffsets();
    // S'assure que le carrousel démarre sur la première réalisation
    scrollToIndex(0, false);
    updateUI();
    startAutoplay();
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAutoplay(); else startAutoplay(); });
  });
})();


// ===== Réalisations (rail + dots) — copie adaptée des certifications =====
(() => {
  const rail     = document.getElementById('works-rail');
  const dotsWrap = document.querySelector('.works-dots');
  if (!rail || !dotsWrap) return;

  // idempotence
  if (rail.dataset.worksCarouselReady === '1') return;
  rail.dataset.worksCarouselReady = '1';

  // slides = <li> directs
  const slides = Array.from(rail.querySelectorAll(':scope > li'));
  if (!slides.length) return;

  // a11y zone
  rail.setAttribute('tabindex', '0');
  rail.setAttribute('role', 'region');
  rail.setAttribute('aria-label', 'Réalisations (carousel)');

  // dots = 1:1
  dotsWrap.replaceChildren();
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'works-dot';
    b.setAttribute('aria-label', `Aller à la réalisation ${i + 1}`);
    dotsWrap.appendChild(b);
    return b;
  });

  const PREFERS_REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const centerOffsetFor = (el) => el.offsetLeft - (rail.clientWidth - el.clientWidth) / 2;
  const scrollToSlide   = (i) => {
    const el = slides[i];
    rail.scrollTo({ left: centerOffsetFor(el), behavior: PREFERS_REDUCED ? 'auto' : 'smooth' });
  };
  const setActive = (i) => dots.forEach((d, idx) => d.classList.toggle('is-active', idx === i));

  dots.forEach((b, i) => b.addEventListener('click', () => scrollToSlide(i), { passive: true }));

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      let bestI = null, bestRatio = 0;
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const i = slides.indexOf(e.target);
        if (i > -1 && e.intersectionRatio > bestRatio) { bestRatio = e.intersectionRatio; bestI = i; }
      }
      if (bestI !== null) setActive(bestI);
    }, { root: rail, threshold: [0.5, 0.6, 0.7, 0.8] });
    slides.forEach(el => io.observe(el));
  } else {
    const onScroll = () => {
      const deltas = slides.map(el => Math.abs(centerOffsetFor(el) - rail.scrollLeft));
      setActive(deltas.indexOf(Math.min(...deltas)));
    };
    rail.addEventListener('scroll', onScroll, { passive: true });
  }

  setActive(0);

  rail.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const cur  = dots.findIndex(d => d.classList.contains('is-active'));
    const next = e.key === 'ArrowRight' ? Math.min(cur + 1, slides.length - 1) : Math.max(cur - 1, 0);
    scrollToSlide(next);
  });

  let rid = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame?.(rid);
    rid = requestAnimationFrame(() => {
      const current = dots.findIndex(d => d.classList.contains('is-active'));
      scrollToSlide(current < 0 ? 0 : current);
    });
  }, { passive: true });
})();

// ===== Patch robustesse pour le modal projet (évite "forEach of null") =====
(() => {
  const modal = document.getElementById('project-modal');
  if (!modal) return;

  const titleEl    = document.getElementById('project-title');
  const clientEl   = document.getElementById('project-client');
  const abstractEl = document.getElementById('project-abstract');
  const ctxEl      = document.getElementById('project-contexte');
  const missionsEl = document.getElementById('project-missions');
  const benefEl    = document.getElementById('project-benefices');
  const stackEl    = document.getElementById('project-stack');
  const linkEl     = document.getElementById('project-link');

  // remplace la version précédente : si ce n’est pas un array -> []
  const safeParse = (str, fallback = []) => {
    try {
      const v = JSON.parse(str);
      return Array.isArray(v) ? v : fallback;
    } catch { return fallback; }
  };
  const renderList = (ul, arr) => { ul.innerHTML = ''; arr.forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); }); };

  function fill(card){
    titleEl.textContent    = card.dataset.title || '';
    clientEl.textContent   = card.dataset.client ? `Client : ${card.dataset.client}` : '';
    abstractEl.textContent = card.dataset.abstract || '';
    ctxEl.textContent      = card.dataset.contexte || '';
    renderList(missionsEl, safeParse(card.dataset.missions));
    renderList(benefEl,    safeParse(card.dataset.benefices));
    renderList(stackEl,    safeParse(card.dataset.stack));
    if (linkEl) {
      if (card.dataset.link) { linkEl.href = card.dataset.link; linkEl.setAttribute('aria-label', `Ouvrir ${card.dataset.title}`); }
      else { linkEl.removeAttribute('href'); }
    }
  }

  document.querySelectorAll('.project-card').forEach(card => {
    const open = (e) => { e?.preventDefault?.(); fill(card); Modal.open(modal); };
    card.querySelector('.open-project')?.addEventListener('click', open);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { open(e); } });
    card.addEventListener('click', e => { if (!e.target.closest('a, .open-project')) open(e); });
  });
})();

/* ==================== 15) Services animations & tracking ==================== */
(() => {
  const trackEvent = (name, detail = {}) => {
    const payload = { event: name, ...detail };
    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(payload);
    }
    if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      try {
        window.goatcounter.count({
          path: `${location.pathname}#${name}`,
          title: document.title,
          event: true
        });
      } catch (err) {
        console.warn('GoatCounter track failed', err);
      }
    }
    document.dispatchEvent(new CustomEvent('bmdata:track', { detail: payload }));
  };

  const extractDataset = (el) => {
    const payload = {};
    for (const [key, value] of Object.entries(el.dataset)) {
      if (!value || key === 'trackClick') continue;
      payload[key] = value;
    }
    return payload;
  };

  $$('[data-track-click]').forEach((el) => {
    if (el.dataset.trackBound === '1') return;
    el.dataset.trackBound = '1';
    const name = el.dataset.trackClick;
    if (!name) return;
    el.addEventListener('click', () => {
      trackEvent(name, { type: 'click', ...extractDataset(el) });
    }, { passive: true });
  });

  const servicesSection = document.querySelector('[data-section="services"]');
  if (servicesSection) {
    let viewed = false;
    const markView = () => {
      if (viewed) return;
      viewed = true;
      trackEvent('services_section_view', { type: 'scroll' });
    };
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
            markView();
            observer.disconnect();
            break;
          }
        }
      }, { threshold: [0.2, 0.35, 0.6] });
      observer.observe(servicesSection);
    } else {
      const onScroll = () => {
        const rect = servicesSection.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        if (rect.top <= vh * 0.65 && rect.bottom >= vh * 0.35) {
          markView();
          window.removeEventListener('scroll', onScroll);
        }
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  const animated = $$('[data-anim]');
  if (animated.length) {
    if ('IntersectionObserver' in window && !PREFERS_REDUCED) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      }, { threshold: 0.2, rootMargin: '0px 0px -10% 0px' });
      animated.forEach((el) => io.observe(el));
    } else {
      animated.forEach((el) => el.classList.add('is-visible'));
    }
  }
})();

/* ==================== 6) Article UX helpers ==================== */
(() => {
  const shareBtn = document.querySelector('[data-share]');
  const feedback = document.querySelector('[data-share-feedback]');
  let hideTimer = null;

  const showFeedback = (message) => {
    if (!feedback) return;
    feedback.textContent = message;
    feedback.classList.add('is-visible');
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => feedback.classList.remove('is-visible'), 2400);
  };

  if (shareBtn) {
    const shareData = {
      title: shareBtn.dataset.shareTitle || document.title,
      url: shareBtn.dataset.shareUrl || window.location.href
    };

    shareBtn.addEventListener('click', async () => {
      try {
        if (navigator.share) {
          await navigator.share(shareData);
          showFeedback('Merci pour le partage !');
          return;
        }
      } catch (err) {
        /* fallback to clipboard */
      }

      try {
        await navigator.clipboard.writeText(shareData.url);
        showFeedback('Lien copié dans le presse-papier');
      } catch (err) {
        showFeedback(`Copiez le lien : ${shareData.url}`);
      }
    });
  }

  const progressBar = document.querySelector('[data-reading-progress]');
  const article = document.querySelector('.post-body');
  if (!progressBar || !article) return;

  const container = progressBar.closest('.reading-progress');
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  let ticking = false;

  const update = () => {
    ticking = false;
    const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    const top = article.getBoundingClientRect().top + scrollY;
    const height = article.offsetHeight;
    const total = Math.max(height - window.innerHeight, 1);
    const ratio = clamp((scrollY - top) / total, 0, 1);
    const width = `${Math.round(ratio * 100)}%`;
    progressBar.style.width = width;
    progressBar.style.setProperty('--progress', width);
    container?.classList.toggle('is-active', ratio > 0.02);
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    raf(update);
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
})();
