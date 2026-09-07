/* ============================================================
   Кездесуге шақыру
   ------------------------------------------------------------
   ӨЗГЕРТЕТІН ЖЕР: төмендегі CONFIG.
   ============================================================ */

const CONFIG = {
  // Telegram/Instagram username (@-пен де, @-сыз да) немесе телефон нөмірі
  contact: 'ulankozhabekov',

  // 'telegram' | 'instagram' | 'phone' | 'none'
  contactType: 'instagram',
};

/* ---------- Контакт сілтемесі ---------- */

(function setupContact() {
  const link = document.getElementById('contact-link');
  const text = document.getElementById('contact-text');
  const icon = link.querySelector('.contact__icon');
  const raw = String(CONFIG.contact || '').trim();
  const handle = raw.replace(/^@/, '');

  text.textContent = CONFIG.contactType === 'phone' ? raw : '@' + handle;

  if (CONFIG.contactType === 'telegram') {
    link.href = 'https://t.me/' + encodeURIComponent(handle);
    icon.textContent = '✈️';
  } else if (CONFIG.contactType === 'instagram') {
    link.href = 'https://www.instagram.com/' + encodeURIComponent(handle);
    icon.textContent = '📷';
  } else if (CONFIG.contactType === 'phone') {
    link.href = 'tel:' + raw.replace(/[^\d+]/g, '');
    link.removeAttribute('target');
    icon.textContent = '📞';
  } else {
    link.removeAttribute('href');
    link.removeAttribute('target');
    icon.textContent = '💌';
  }
})();


// Гифканы ауыстыру: index.html ішіндегі <img class="gif"> src-ін өзгертіңіз.
// Интернет болмаса немесе сілтеме өлсе — сурет орны бос қалмай, жасырылады.
document.querySelectorAll('.gif').forEach((img) => {
  img.addEventListener('error', () => img.classList.add('is-hidden'));
  if (img.complete && img.naturalWidth === 0) img.classList.add('is-hidden');
});

/* ============================================================
   1. Қашатын "Жоқ" батырмасы — ТЕК ойын алаңының ішінде
   ============================================================ */

const arena  = document.getElementById('arena');
const row    = arena.querySelector('.arena__row');   // координаттар осыған қатысты
const btnNo  = document.getElementById('btn-no');
const btnYes = document.getElementById('btn-yes');

const PAD = 8;            // алаң шетінен қалдыратын бос орын
const NEAR_MOUSE = 75;    // тінтуір неше px жақындағанда қашады
const NEAR_TOUCH = 70;    // саусақ неше px жақындағанда қашады

let loose = false;
let originX = 0, originY = 0;   // absolute режимдегі бастапқы нүкте (алаң координаты)
let curX = 0, curY = 0;
let lastEscape = 0;

/** Алаңның ішкі шекаралары (батырманың сол/жоғарғы бұрышы үшін) */
function bounds() {
  const bw = btnNo.offsetWidth;
  const bh = btnNo.offsetHeight;
  return {
    minX: PAD,
    minY: PAD,
    maxX: Math.max(PAD, row.clientWidth  - bw - PAD),
    maxY: Math.max(PAD, row.clientHeight - bh - PAD),
    bw, bh,
  };
}

/** Батырманы бір рет алаңға "босату" — дәл тұрған орнында, секірмей */
function makeLoose() {
  if (loose) return;
  const r = btnNo.getBoundingClientRect();
  const a = row.getBoundingClientRect();

  // "Иә" батырмасы жылжымауы үшін орнына көрінбейтін орын қалдырамыз
  const ghost = document.createElement('span');
  ghost.className = 'btn-ghost';
  ghost.style.width = r.width + 'px';
  ghost.style.height = r.height + 'px';
  ghost.setAttribute('aria-hidden', 'true');
  btnNo.parentNode.insertBefore(ghost, btnNo);

  originX = curX = r.left - a.left;
  originY = curY = r.top - a.top;

  btnNo.style.width = r.width + 'px';
  btnNo.style.height = r.height + 'px';
  btnNo.style.left = originX + 'px';
  btnNo.style.top = originY + 'px';
  btnNo.classList.add('is-loose');
  loose = true;
}

function moveTo(x, y) {
  const b = bounds();
  curX = Math.min(Math.max(x, b.minX), b.maxX);   // шекарадан шықпайды
  curY = Math.min(Math.max(y, b.minY), b.maxY);
  btnNo.style.transform = `translate(${curX - originX}px, ${curY - originY}px)`;
}

/** Алаң ішінен курсордан алыс кездейсоқ орын табу */
function pickSpot(px, py) {
  const b = bounds();
  const yes = btnYes.getBoundingClientRect();
  const a = row.getBoundingClientRect();
  const yesX = yes.left - a.left, yesY = yes.top - a.top;

  // Алаң кішкентай болса, талап та кішірейеді
  const minJump = Math.max(60, Math.min(b.maxX - b.minX, b.maxY - b.minY) * 0.8);

  let best = null, bestDist = -1;

  for (let i = 0; i < 40; i++) {
    const x = b.minX + Math.random() * (b.maxX - b.minX);
    const y = b.minY + Math.random() * (b.maxY - b.minY);

    // "Иә" батырмасын жауып қалмасын
    if (x < yesX + yes.width + 10 && x + b.bw > yesX - 10 &&
        y < yesY + yes.height + 10 && y + b.bh > yesY - 10) continue;

    const d = Math.hypot(x + b.bw / 2 - px, y + b.bh / 2 - py);
    if (d >= minJump) return { x, y };
    if (d > bestDist) { bestDist = d; best = { x, y }; }
  }
  return best || { x: b.minX, y: b.minY };
}

/** px, py — алаңға қатысты координаттар */
function escape(px, py) {
  const now = performance.now();
  if (now - lastEscape < 150) return;
  lastEscape = now;

  makeLoose();
  const spot = pickSpot(px, py);
  moveTo(spot.x, spot.y);

  if (navigator.vibrate) { try { navigator.vibrate(10); } catch (e) {} }
}

/** Клиент координатын алаң координатына аудару */
function toLocal(clientX, clientY) {
  const a = row.getBoundingClientRect();
  return { x: clientX - a.left, y: clientY - a.top };
}

/** Нүктеден батырмаға дейінгі қашықтық (клиент координатында) */
function distanceToBtn(clientX, clientY) {
  const r = btnNo.getBoundingClientRect();
  const dx = Math.max(r.left - clientX, 0, clientX - r.right);
  const dy = Math.max(r.top - clientY, 0, clientY - r.bottom);
  return Math.hypot(dx, dy);
}

function tryEscape(clientX, clientY, threshold) {
  if (distanceToBtn(clientX, clientY) >= threshold) return;
  const p = toLocal(clientX, clientY);
  escape(p.x, p.y);
}

/* --- Desktop: тінтуір жақындағанда --- */
window.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;          // тачты бөлек өңдейміз
  tryEscape(e.clientX, e.clientY, NEAR_MOUSE);
}, { passive: true });

btnNo.addEventListener('mouseenter', (e) => tryEscape(e.clientX, e.clientY, Infinity));

btnNo.addEventListener('focus', () => {
  const r = btnNo.getBoundingClientRect();
  tryEscape(r.left + r.width / 2, r.top + r.height / 2, Infinity);
});

/* --- Mobile: саусақ жақындағанда (тек кликке емес) --- */
function handleTouch(e) {
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  if (t) tryEscape(t.clientX, t.clientY, NEAR_TOUCH);
}
document.addEventListener('touchstart', handleTouch, { passive: true });
document.addEventListener('touchmove',  handleTouch, { passive: true });

// Батырманың өзіне тисе — клик мүлде тумасын
btnNo.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleTouch(e);
}, { passive: false });

// Стилус / hover қолдайтын құрылғылар
btnNo.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  tryEscape(e.clientX, e.clientY, Infinity);
});

// Соңғы сақтандырғыш
btnNo.addEventListener('click', (e) => {
  e.preventDefault();
  const r = btnNo.getBoundingClientRect();
  tryEscape(r.left + r.width / 2, r.top + r.height / 2, Infinity);
});

// Алаң өлшемі өзгергенде батырма шекара ішінде қалады
function reclamp() { if (loose) moveTo(curX, curY); }
window.addEventListener('resize', reclamp);
window.addEventListener('orientationchange', () => setTimeout(reclamp, 250));

/* ============================================================
   2. Экран ауысуы
   ============================================================ */

const screenAsk = document.getElementById('screen-ask');
const screenYay = document.getElementById('screen-yay');

btnYes.addEventListener('click', () => {
  if (screenAsk.dataset.done) return;
  screenAsk.dataset.done = '1';

  screenAsk.classList.remove('is-active');

  setTimeout(() => {
    screenAsk.hidden = true;
    screenYay.hidden = false;
    void screenYay.offsetWidth;                  // reflow — transition іске қосылсын
    screenYay.classList.add('is-active');
    startFireworks();
  }, 380);
});

/* ============================================================
   3. Фейерверк (canvas)
   ============================================================ */

const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ақ фонда көрінуі үшін қанық түстер (алтын / қызыл / көк — дәстүрлі палитра)
const COLORS = ['#e94d58', '#c1272d', '#e8752a', '#a83279', '#5b3fa8'];

let particles = [];
let rockets = [];
let running = false;
let rafId = 0;
let nextBurst = 0;

const vw = () => (window.visualViewport ? window.visualViewport.width  : window.innerWidth);
const vh = () => (window.visualViewport ? window.visualViewport.height : window.innerHeight);

function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = vw(), h = vh();
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', () => { if (running) resizeCanvas(); });

function launchRocket() {
  const w = vw(), h = vh();
  rockets.push({
    x: w * (0.3 + Math.random() * 0.4),
    y: h + 10,
    tx: w * (0.15 + Math.random() * 0.7),
    ty: h * (0.12 + Math.random() * 0.32),
    color: COLORS[(Math.random() * COLORS.length) | 0],
    px: 0, py: 0,
    speed: 0.055 + Math.random() * 0.025,
    t: 0,
  });
}

function explode(x, y, color) {
  const count = 50 + ((Math.random() * 28) | 0);
  const base = 2.4 + Math.random() * 1.6;
  const alt = COLORS[(Math.random() * COLORS.length) | 0];

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.12;
    const speed = base * (0.55 + Math.random() * 0.7);
    particles.push({
      x, y, px: x, py: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() < 0.3 ? alt : color,
      life: 1,
      decay: 0.0085 + Math.random() * 0.012,
      size: 1.7 + Math.random() * 1.6,
    });
  }
  if (particles.length > 1200) particles.splice(0, particles.length - 1200);
}

function frame(now) {
  const w = vw(), h = vh();
  ctx.clearRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'source-over';   // ақ фонда 'lighter' көрінбейді
  ctx.lineCap = 'round';

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    r.px = r.x; r.py = r.y;
    r.t = Math.min(1, r.t + r.speed);
    const e = 1 - Math.pow(1 - r.t, 2);
    r.x += (r.tx - r.x) * 0.12;
    r.y = h + 10 + (r.ty - h - 10) * e;

    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(r.px, r.py);
    ctx.lineTo(r.x, r.y);
    ctx.stroke();

    if (r.t >= 1) { explode(r.x, r.y, r.color); rockets.splice(i, 1); }
  }

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.px = p.x; p.py = p.y;
    p.vx *= 0.982;
    p.vy = p.vy * 0.982 + 0.042;                 // ауырлық күші
    p.x += p.vx;
    p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0 || p.y > h + 40) { particles.splice(i, 1); continue; }

    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size;
    ctx.beginPath();
    ctx.moveTo(p.px, p.py);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  if (running && now > nextBurst) {
    launchRocket();
    if (Math.random() < 0.4) setTimeout(launchRocket, 180);
    nextBurst = now + 600 + Math.random() * 900;
  }

  if (running || particles.length || rockets.length) {
    rafId = requestAnimationFrame(frame);
  } else {
    ctx.clearRect(0, 0, w, h);
    rafId = 0;
  }
}

function startFireworks() {
  if (reduceMotion) return;
  resizeCanvas();
  canvas.classList.add('is-on');
  running = true;
  nextBurst = 0;

  launchRocket();
  setTimeout(launchRocket, 260);
  setTimeout(launchRocket, 520);

  if (!rafId) rafId = requestAnimationFrame(frame);

  // ~14 секундтан кейін тынышталады
  setTimeout(() => {
    running = false;
    setTimeout(() => canvas.classList.remove('is-on'), 2500);
  }, 14000);
}
