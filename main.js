// Quita clase no-js
document.documentElement.classList.remove('no-js');

// ========= TEMA (Azul=círculo, Negro=cuadrado, Blanco=rombo) =========
const THEME_KEY = 'jc-theme';
const THEMES = ['theme-blue', 'theme-black', 'theme-white'];
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

function getSavedTheme(){ const t = localStorage.getItem(THEME_KEY); return THEMES.includes(t) ? t : 'theme-blue'; }
function applyTheme(themeClass){ THEMES.forEach(t => html.classList.remove(t)); html.classList.add(themeClass); }
function nextTheme(current){ const i = THEMES.indexOf(current); return THEMES[(i + 1) % THEMES.length]; }

let currentTheme = getSavedTheme();
applyTheme(currentTheme);
themeToggle?.addEventListener('click', () => { currentTheme = nextTheme(currentTheme); applyTheme(currentTheme); localStorage.setItem(THEME_KEY, currentTheme); });

// ========= MENÚ OFF-CANVAS (izquierda) =========
const menuBtn   = document.getElementById('menuBtn');
const offcanvas = document.getElementById('offcanvas');
const closeMenu = document.getElementById('closeMenu');
const overlay   = document.getElementById('overlay');

function openMenu(){
  offcanvas.classList.add('open');
  overlay.hidden = false;
  menuBtn.setAttribute('aria-expanded','true');
  offcanvas.setAttribute('aria-hidden','false');
  document.body.style.overflow='hidden';
  const firstLink = offcanvas.querySelector('a'); firstLink && firstLink.focus();
}
function closeMenuFn(){
  offcanvas.classList.remove('open');
  overlay.hidden = true;
  menuBtn.setAttribute('aria-expanded','false');
  offcanvas.setAttribute('aria-hidden','true');
  document.body.style.overflow='';
  menuBtn.focus();
}
menuBtn?.addEventListener('click', openMenu);
closeMenu?.addEventListener('click', closeMenuFn);
overlay?.addEventListener('click', closeMenuFn);
document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && offcanvas.classList.contains('open')) closeMenuFn(); });
document.querySelectorAll('.offcanvas-nav .nav-link').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id?.startsWith('#')) {
      e.preventDefault();
      closeMenuFn();
      const el = document.querySelector(id);
      if (el) { el.scrollIntoView({ behavior:'smooth', block:'start' }); history.pushState(null,'',id); }
    }
  });
});

// ========= UTILIDADES =========
const yearEl = document.getElementById('year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

// Imagen de portada (opcional por JS)
// const hero = document.querySelector('.hero');
// if (hero) hero.style.setProperty('--hero-bg', "url('img/portada.jpg')");

// ========= CARRUSEL 1-ITEM (Educación/Certificados) =========
(function(){
  const viewport = document.querySelector('#educacion .carousel-viewport');
  const track    = document.querySelector('#educacion .carousel-track');
  const items    = Array.from(document.querySelectorAll('#educacion .carousel-item'));
  const btnPrev  = document.querySelector('#educacion .carousel-btn.prev');
  const btnNext  = document.querySelector('#educacion .carousel-btn.next');
  if (!viewport || !track || items.length === 0) return;

  let index = 0;

  function update(){
    const x = -index * 100;
    track.style.transform = `translateX(${x}%)`;
    btnPrev?.toggleAttribute('disabled', index === 0);
    btnNext?.toggleAttribute('disabled', index === items.length - 1);
  }
  function go(i){
    index = Math.max(0, Math.min(items.length - 1, i));
    update();
  }

  btnPrev?.addEventListener('click', () => go(index - 1));
  btnNext?.addEventListener('click', () => go(index + 1));

  // Teclado
  viewport.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  go(index - 1);
    if (e.key === 'ArrowRight') go(index + 1);
  });

  // Swipe / drag
  let startX=0, currentX=0, dragging=false;
  const threshold = 40;

  function onStart(x){ dragging = true; startX = x; currentX = x; }
  function onMove(x){
    if(!dragging) return;
    currentX = x;
    const dx = currentX - startX;
    const pct = (dx / viewport.clientWidth) * 100;
    track.style.transform = `translateX(${(-index*100) + pct}%)`;
  }
  function onEnd(){
    if(!dragging) return;
    const dx = currentX - startX;
    if (Math.abs(dx) > threshold){
      if (dx < 0) go(index + 1); else go(index - 1);
    } else {
      update();
    }
    dragging = false;
  }

  viewport.addEventListener('mousedown', (e)=> onStart(e.pageX));
  viewport.addEventListener('mousemove', (e)=> onMove(e.pageX));
  viewport.addEventListener('mouseup', onEnd);
  viewport.addEventListener('mouseleave', onEnd);
  viewport.addEventListener('touchstart', (e)=> onStart(e.touches[0].clientX), {passive:true});
  viewport.addEventListener('touchmove',  (e)=> onMove(e.touches[0].clientX), {passive:true});
  viewport.addEventListener('touchend', onEnd);

  update();
})();

// ========= REVEAL / DISOLVER =========
const revealEls = document.querySelectorAll('.reveal, .job, .about-photo, .about-text, .edu-block, .courses-block, .contact-form, .hero, .skill-card');
const thresholds = Array.from({length: 21}, (_, i) => i / 20);

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const ratio = Math.max(0, Math.min(1, entry.intersectionRatio));
    entry.target.style.setProperty('--reveal', ratio.toFixed(2));
    if (ratio > 0.6) entry.target.classList.add('visible');
  });
}, { root: null, rootMargin: '0px 0px -10% 0px', threshold: thresholds });

revealEls.forEach(el => io.observe(el));

// ========= ENVÍO DE CONTACTO (Formspree o mailto) =========
(function(){
  const form = document.getElementById('contactForm');
  const statusEl = document.getElementById('formStatus');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusEl.textContent = 'Enviando...';

    const endpoint = form.getAttribute('action') || '';
    // Si no reemplazaste el endpoint, avisamos:
    if (endpoint.includes('REEMPLAZA_ID')) {
      statusEl.textContent = '⚠️ Configurá el endpoint de Formspree en el atributo action del formulario.';
      return;
    }

    try {
      const formData = new FormData(form);
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData
      });
      if (resp.ok) {
        form.reset();
        statusEl.textContent = '✅ ¡Gracias! Tu mensaje fue enviado.';
      } else {
        statusEl.textContent = '❌ No se pudo enviar. Probá de nuevo en unos minutos.';
      }
    } catch (err) {
      statusEl.textContent = '❌ Error de conexión. Verificá tu red e intentá nuevamente.';
    }
  });
})();
