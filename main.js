/* ============================================================
   MARLIN — Moteur d'interactions partagé
   Nav, reveals, compteurs, filtres, compte à rebours
   + la traversée : un Moth qui parcourt le site au scroll
   ============================================================ */
(() => {
'use strict';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ============ PAGE FADE-IN ============ */
document.documentElement.classList.add('js');
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');
});
window.addEventListener('pageshow', () => {
  document.body.classList.add('page-loaded');
});

/* ============ LA TRAVERSÉE — Sherbrooke → Lac de Garde ============ */
/* Un Moth à foils longe la ligne de flottaison au bas de l'écran.
   Sa position = progression du scroll. Il monte sur ses foils
   quand on scrolle vite, et se repose sur sa coque à l'arrêt. */
const voyage = document.createElement('div');
voyage.className = 'voyage';
voyage.setAttribute('aria-hidden', 'true');
voyage.innerHTML = `
  <div class="voyage-line"></div>
  <span class="voyage-port start">Sherbrooke · 45.40° N</span>
  <span class="voyage-port end">Lac de Garde · 45.64° N</span>
  <span class="voyage-pct" id="voyage-pct">0%</span>
  <div class="voyage-wake" id="voyage-wake"></div>
  <div class="voyage-boat" id="voyage-boat">
    <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g id="voyage-hull">
        <!-- Voile -->
        <path d="M63 10 Q60 38 62 60 L104 52 Q88 24 66 10 Z" fill="#ff5c38" opacity="0.94"/>
        <path d="M66 22 L92 40" stroke="#d94422" stroke-width="1" opacity="0.6"/>
        <path d="M64 36 L98 47" stroke="#d94422" stroke-width="1" opacity="0.6"/>
        <!-- Mât -->
        <line x1="63" y1="8" x2="63" y2="64" stroke="#f2f7f9" stroke-width="2.4" stroke-linecap="round"/>
        <!-- Coque -->
        <path d="M30 64 Q58 57 78 59 Q98 60 112 64 Q92 72 60 71 Q40 70 30 64 Z" fill="#0b2434" stroke="#f2f7f9" stroke-width="2"/>
        <!-- Bras des ailes -->
        <line x1="40" y1="66" x2="22" y2="61" stroke="#f2f7f9" stroke-width="1.6" stroke-linecap="round"/>
        <line x1="100" y1="66" x2="120" y2="61" stroke="#f2f7f9" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g id="voyage-foils">
        <!-- Dérive + foil principal en T -->
        <line x1="66" y1="70" x2="66" y2="92" stroke="#f2f7f9" stroke-width="2"/>
        <path d="M48 92 Q66 87 84 92" stroke="#6fd3e0" stroke-width="2.6" stroke-linecap="round" fill="none"/>
        <!-- Safran + foil arrière -->
        <line x1="106" y1="68" x2="106" y2="86" stroke="#f2f7f9" stroke-width="1.7"/>
        <path d="M96 86 Q106 82.5 116 86" stroke="#6fd3e0" stroke-width="2" stroke-linecap="round" fill="none"/>
      </g>
    </svg>
  </div>`;
document.body.appendChild(voyage);

const boat = document.getElementById('voyage-boat');
const wake = document.getElementById('voyage-wake');
const pctEl = document.getElementById('voyage-pct');

let vProgress = 0, vShown = 0, vSpeed = 0, lastY = window.scrollY;

function voyageFrame(now) {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  vProgress = max > 60 ? Math.min(window.scrollY / max, 1) : 0;

  // Vitesse de scroll lissée → gîte et vol sur foils
  const dy = window.scrollY - lastY;
  lastY = window.scrollY;
  vSpeed += (Math.min(Math.abs(dy), 60) - vSpeed) * 0.08;

  // Position lissée le long de la route
  vShown += (vProgress - vShown) * 0.1;

  const travel = window.innerWidth - boat.offsetWidth - 16;
  const x = 8 + vShown * Math.max(travel, 0);
  const foiling = Math.min(vSpeed / 22, 1);           // 0 = posé, 1 = plein vol
  const lift = foiling * 14;                          // la coque sort de l'eau
  const heel = foiling * -5;                          // légère assiette cabrée
  const bob = reduceMotion ? 0 : Math.sin(now / 650) * (1 - foiling) * 2.2;

  boat.style.transform =
    `translateX(${x.toFixed(1)}px) translateY(${(bob - lift).toFixed(1)}px) rotate(${heel.toFixed(2)}deg)`;

  wake.style.opacity = (foiling * 0.85).toFixed(2);
  wake.style.transform = `translateX(${(x - 58).toFixed(1)}px)`;

  if (pctEl) pctEl.textContent = Math.round(vProgress * 100) + '%';

  requestAnimationFrame(voyageFrame);
}
if (reduceMotion) {
  // Position statique mise à jour au scroll, sans animation continue
  const staticUpdate = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 60 ? Math.min(window.scrollY / max, 1) : 0;
    const travel = window.innerWidth - boat.offsetWidth - 16;
    boat.style.transform = `translateX(${(8 + p * Math.max(travel, 0)).toFixed(1)}px)`;
    if (pctEl) pctEl.textContent = Math.round(p * 100) + '%';
  };
  window.addEventListener('scroll', staticUpdate, { passive: true });
  staticUpdate();
} else {
  requestAnimationFrame(voyageFrame);
}

/* ============ LIGNES DE PROFONDEUR (transitions de sections) ============ */
/* Chaque frontière de section affiche la profondeur atteinte, façon
   relevé bathymétrique : la page « plonge » à mesure qu'on descend. */
document.querySelectorAll('section + section').forEach(s => {
  const d = document.createElement('div');
  d.className = 'waterline';
  d.setAttribute('aria-hidden', 'true');
  s.parentNode.insertBefore(d, s);
});

function updateDepths() {
  document.querySelectorAll('.waterline').forEach(w => {
    const top = w.getBoundingClientRect().top + window.scrollY;
    const depth = Math.max(2, Math.round(top / 55));
    w.dataset.depth = 'PROF. ' + String(depth).padStart(4, '0') + ' M';
  });
}
updateDepths();
window.addEventListener('load', updateDepths);
let depthResizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(depthResizeTimer);
  depthResizeTimer = setTimeout(updateDepths, 200);
});

/* ============ NAV + RETOUR EN HAUT ============ */
const nav = document.getElementById('nav');

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
    if (nav) nav.classList.toggle('scrolled', y > 40);
    backTop.classList.toggle('show', y > 700);
    ticking = false;
  });
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ============ REVEALS + STAGGER AUTO ============ */
const STAGGER_CONTAINERS = [
  '.subsystems', '.team-grid', '.recruit-grid', '.pillars',
  '.defi-stats', '.neural-stats', '.galerie-grid', '.tiers',
  '.sponsor-tier-grid', '.pcb-specs', '.flight-phases', '.explore-list'
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

/* ============ COMPTE À REBOURS SUMOTH ============ */
const cdDays = document.getElementById('cd-days');
if (cdDays) {
  const COMP_DATE = new Date('2027-07-15T09:00:00+02:00'); // Lac de Garde, Italie
  const cdH = document.getElementById('cd-hours');
  const cdM = document.getElementById('cd-mins');
  const cdS = document.getElementById('cd-secs');
  const updateCountdown = () => {
    let diff = COMP_DATE - new Date();
    if (diff < 0) diff = 0;
    cdDays.textContent = String(Math.floor(diff / 86400000)).padStart(3, '0');
    cdH.textContent = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
    cdM.textContent = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
    cdS.textContent = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
  };
  updateCountdown();
  setInterval(updateCountdown, 1000);
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
    const body = `${message}\n\n${name} (${email})`;
    window.location.href = `mailto:marlin@usherbrooke.ca?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });
}

})();
