/* ============================================================
   MARLIN — Moteur d'interactions partagé
   Scroll, reveals, tilt 3D, compteurs, curseur, magnétisme
   ============================================================ */
(() => {
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ============ PAGE FADE-IN ============ */
document.documentElement.classList.add('js');
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
});

/* ============ SCROLL PROGRESS + NAV + BACK TO TOP ============ */
const nav = document.getElementById('nav');

const progress = document.createElement('div');
progress.className = 'scroll-progress';
document.body.appendChild(progress);

const backTop = document.createElement('button');
backTop.className = 'back-top';
backTop.setAttribute('aria-label', 'Retour en haut');
backTop.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12V2M7 2L2 7M7 2L12 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
document.body.appendChild(backTop);

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    if (nav) nav.classList.toggle('scrolled', y > 50);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    backTop.classList.toggle('show', y > 700);
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============ REVEALS + STAGGER AUTO ============ */
const STAGGER_CONTAINERS = [
  '.explore-grid', '.subsystems', '.team-grid', '.recruit-grid',
  '.objectives-grid', '.poles-grid', '.tiers', '.partner-showcase',
  '.defi-stats', '.neural-stats', '.galerie-grid', '.partners-real',
  '.sponsor-tier-grid', '.pcb-specs'
];
document.querySelectorAll(STAGGER_CONTAINERS.join(',')).forEach(grid => {
  [...grid.children].forEach((child, i) => {
    child.classList.add('stagger-item');
    child.style.setProperty('--si', i);
  });
  if (!grid.classList.contains('reveal')) grid.classList.add('reveal');
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ============ TITRES : explosion lettre par lettre ============ */
function splitTitle(el) {
  if (el.dataset.split || reduceMotion) return;
  el.dataset.split = '1';
  let idx = 0;
  (function walk(node) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement('span'); w.className = 'sw';
          [...part].forEach(ch => {
            const c = document.createElement('span'); c.className = 'sl';
            c.textContent = ch;
            c.style.setProperty('--li', idx++);
            w.appendChild(c);
          });
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1 && child.tagName !== 'BR') {
        walk(child);
      }
    });
  })(el);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('title-in')));
}
document.querySelectorAll('.hero h1, .page-hero h1').forEach(splitTitle);

/* ============ LABELS : effet décodage terminal ============ */
const SCRAMBLE_CHARS = '▖▗▘▝█/\\<>+=·01';
function scrambleIn(el) {
  const finalText = el.textContent;
  const len = finalText.length;
  const dur = Math.min(900, 350 + len * 28);
  const t0 = performance.now();
  (function tick(now) {
    const p = Math.min((now - t0) / dur, 1);
    const settled = Math.floor(p * len);
    let out = finalText.slice(0, settled);
    for (let i = settled; i < len; i++) {
      out += finalText[i] === ' ' ? ' ' : SCRAMBLE_CHARS[(Math.random() * SCRAMBLE_CHARS.length) | 0];
    }
    el.textContent = out;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = finalText;
  })(t0);
}
if (!reduceMotion) {
  const scrambleIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { scrambleIO.unobserve(e.target); scrambleIn(e.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.label, .countdown-title, .stl-overlay, .pcb-label-overlay').forEach(el => {
    if (!el.querySelector('*')) scrambleIO.observe(el); // texte simple uniquement
  });
}

/* ============ TRANSITIONS DE PAGE (rideau) ============ */
if (!reduceMotion) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute('href');
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    e.preventDefault();
    const wipe = document.createElement('div');
    wipe.className = 'page-wipe';
    wipe.innerHTML = '<span class="page-wipe-tag">MARLIN ▸ chargement</span>';
    document.body.appendChild(wipe);
    requestAnimationFrame(() => requestAnimationFrame(() => wipe.classList.add('in')));
    setTimeout(() => { location.href = url.href; }, 420);
  });
  // Retour via bfcache : nettoyer le rideau
  window.addEventListener('pageshow', () => {
    document.querySelectorAll('.page-wipe').forEach(w => w.remove());
    document.body.classList.add('page-loaded');
  });
}

/* ============ MARQUEE : duplication pour boucle infinie ============ */
const marqueeTrack = document.getElementById('marquee-track');
if (marqueeTrack) marqueeTrack.innerHTML += marqueeTrack.innerHTML;

/* ============ COMPTEURS ANIMÉS [data-count] ============ */
const fmt = new Intl.NumberFormat('fr-CA');
const counterIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    counterIO.unobserve(entry.target);
    const el = entry.target;
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split('.')[1] || '').length;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = prefix + fmt.format(target) + suffix; return; }
    const dur = 1600;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const val = target * eased;
      el.textContent = prefix + fmt.format(parseFloat(val.toFixed(decimals))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}, { threshold: 0.6 });
document.querySelectorAll('[data-count]').forEach(el => counterIO.observe(el));

/* ============ TILT 3D + LUEUR SUIVEUSE (cartes) ============ */
const TILT_SELECTOR = [
  '.explore-card', '.subsys-card', '.recruit-card', '.objective-card',
  '.pole-card', '.tier-card', '.neural-stat', '.stat', '.journal-card',
  '.partner-item'
].join(',');

if (finePointer && !reduceMotion) {
  document.querySelectorAll(TILT_SELECTOR).forEach(card => {
    card.classList.add('glow-card');
    let raf = null;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', (px * 100) + '%');
        card.style.setProperty('--my', (py * 100) + '%');
        const rx = (0.5 - py) * 6;
        const ry = (px - 0.5) * 6;
        card.style.transform = `perspective(800px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-4px)`;
        card.style.transition = 'transform 0.08s ease-out, border-color 0.3s, box-shadow 0.3s';
        raf = null;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      card.style.transition = '';
    });
  });
}

/* ============ BOUTONS MAGNÉTIQUES ============ */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      btn.style.transform = `translate(${dx * 0.15}px, ${dy * 0.25}px)`;
    });
    btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
  });
}

/* ============ CURSEUR LUMINEUX ============ */
if (finePointer && !reduceMotion) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  document.body.append(glow, ring);

  let mx = -200, my = -200, rx = -200, ry = -200;
  window.addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    glow.style.transform = `translate(${mx}px, ${my}px)`;
    const t = e.target.closest('a, button, .galerie-item, input, textarea');
    ring.classList.toggle('on-link', !!t);
  }, { passive: true });

  (function followRing() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(followRing);
  })();

  document.addEventListener('mouseleave', () => { ring.style.opacity = 0; glow.style.opacity = 0; });
  document.addEventListener('mouseenter', () => { ring.style.opacity = ''; glow.style.opacity = ''; });
}

/* ============ PARALLAXE DOUCE (héros) ============ */
const pageHero = document.querySelector('.page-hero .container, .hero-inner');
if (pageHero && !reduceMotion) {
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      pageHero.style.transform = `translateY(${y * 0.18}px)`;
      pageHero.style.opacity = Math.max(1 - y / (window.innerHeight * 0.9), 0);
    }
  }, { passive: true });
}

/* ============ NAV ACTIVE AUTO ============ */
const here = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === here) a.classList.add('active');
});

/* ============ ANCRES DOUCES ============ */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); }
  });
});

/* ============ HAMBURGER ============ */
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileNav.classList.toggle('open');
    document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : '';
  });
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* ============ LANG TOGGLE ============ */
const langBtn = document.getElementById('lang-toggle');
if (langBtn) {
  let isEN = false;
  langBtn.addEventListener('click', () => {
    isEN = !isEN;
    langBtn.textContent = isEN ? 'EN / FR' : 'FR / EN';
    document.documentElement.lang = isEN ? 'en' : 'fr';
  });
}

/* ============ FILTRES (journal + galerie) ============ */
function bindFilter(btnSel, itemSel, dataKey) {
  const btns = document.querySelectorAll(btnSel);
  const items = document.querySelectorAll(itemSel);
  if (!btns.length) return;
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      items.forEach(item => {
        const show = filter === 'all' || item.dataset[dataKey] === filter;
        item.classList.toggle('filtered-out', !show);
      });
    });
  });
}
bindFilter('.filter-btn', '.journal-entry', 'category');
bindFilter('.galerie-tab', '.galerie-item', 'type');

/* ============ FORMULAIRE CONTACT → MAILTO ============ */
const cform = document.getElementById('contact-form');
if (cform) {
  cform.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('cf-name').value;
    const email = document.getElementById('cf-email').value;
    const subject = document.getElementById('cf-subject').value || 'Message depuis le site MARLIN';
    const message = document.getElementById('cf-message').value;
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href = `mailto:marlin@usherbrooke.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

})();
