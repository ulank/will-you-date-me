/* ============================================================
   Кездесуге шақыру
   ------------------------------------------------------------
   ӨЗГЕРТЕТІН ЖЕР: төмендегі CONFIG.
   ============================================================ */

const CONFIG = {
  // Кімді шақырамыз
  name: 'Жанерке',

  // Жауап осы Telegram-ботпен саған келеді (қалай алу керегі — README-де)
  telegram: {
    botToken: '',
    chatId: '8423217046',
  },
};

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
  if (screenAsk.hidden) return;
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
   2. Экрандар: сұрақ → түрі → нақтылау → күні/уақыты → нөмір → дайын
   ============================================================ */

// Кездесу түрлері. Жаңасын қосу үшін осы тізімге жол қосыңыз.
// options бос болса — қонақ өз нұсқасын мәтінмен жазады.
const DATE_TYPES = [
  { icon: '🍽️', label: 'Тамақ ішу', question: 'Қандай асхана ұнайды?',
    options: ['🥟 Қазақ', '🍖 Грузин', '🍣 Жапон', '🍝 Итальян', '🌶️ Корей', '🥙 Түрік', '🍚 Өзбек', '🤍 Сен таңда'] },
  { icon: '⛰️', label: 'Тауға шығу', question: 'Тауда не істейміз?',
    options: ['🥾 Жаяу серуен', '🚡 Аспалы жол', '🧺 Пикник', '🌅 Күн батуын көру'] },
  { icon: '🎬', label: 'Киноға бару', question: 'Қандай кино көреміз?',
    options: ['😂 Комедия', '💞 Романтика', '👻 Қорқынышты', '🦸 Экшн', '🧸 Мультфильм', '🤍 Сен таңда'] },
  { icon: '☕️', label: 'Кофе мен десерт', question: 'Не ішеміз?',
    options: ['☕️ Кофе', '🍵 Шай', '🍰 Десерт', '🍦 Балмұздақ'] },
  { icon: '🌳', label: 'Серуендеу', question: 'Қайда серуендейміз?',
    options: ['🌳 Саябақ', '🌆 Қала орталығы', '🌃 Түнгі қала', '🤍 Сен таңда'] },
  { icon: '✨', label: 'Өз нұсқам', question: 'Қайда барғың келеді?', options: [] },
];

const DAYS_AHEAD = 14;
const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
               '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];

const WEEKDAYS_SHORT = ['Жс', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сн'];
const WEEKDAYS = ['жексенбі', 'дүйсенбі', 'сейсенбі', 'сәрсенбі', 'бейсенбі', 'жұма', 'сенбі'];
const MONTHS = ['қаңтар', 'ақпан', 'наурыз', 'сәуір', 'мамыр', 'маусым',
                'шілде', 'тамыз', 'қыркүйек', 'қазан', 'қараша', 'желтоқсан'];

const stage        = document.querySelector('.stage');
const screenAsk    = document.getElementById('screen-ask');
const screenType   = document.getElementById('screen-type');
const screenDetail = document.getElementById('screen-detail');
const screenWhen   = document.getElementById('screen-when');
const screenPhone  = document.getElementById('screen-phone');
const screenYay    = document.getElementById('screen-yay');

const state = { type: null, detail: '', date: null, time: '', phone: '' };

document.getElementById('q-title').textContent = `${CONFIG.name}, менімен кездесуге барасың ба?`;
document.title = `${CONFIG.name}, менімен кездесуге барасың ба?`;

/* --- Экран ауыстыру --- */

let current = screenAsk;
let switching = false;
const trail = [];               // "Артқа" үшін өткен экрандар

function showScreen(next, back) {
  if (switching || next === current) return;
  switching = true;
  const prev = current;
  if (!back) trail.push(prev);
  prev.classList.remove('is-active');

  setTimeout(() => {
    prev.hidden = true;
    next.hidden = false;
    void next.offsetWidth;                       // reflow — transition іске қосылсын
    next.classList.add('is-active');
    stage.scrollTop = 0;
    current = next;
    switching = false;
  }, 380);
}

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (switching || !trail.length) return;
    showScreen(trail.pop(), true);
  });
});

function optionButton(text, onPick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'opt';
  btn.textContent = text;
  btn.addEventListener('click', onPick);
  return btn;
}

function select(list, picked) {
  list.querySelectorAll('.is-selected').forEach((el) => el.classList.remove('is-selected'));
  picked.classList.add('is-selected');
}

/* --- Сұрақ → түрі --- */

btnYes.addEventListener('click', () => showScreen(screenType));

const typeOptions = document.getElementById('type-options');
DATE_TYPES.forEach((type) => {
  const btn = optionButton(`${type.icon} ${type.label}`, () => {
    select(typeOptions, btn);
    if (state.type !== type) state.detail = '';
    state.type = type;
    renderDetail();
    showScreen(screenDetail);
  });
  typeOptions.appendChild(btn);
});

/* --- Нақтылау --- */

const detailOptions = document.getElementById('detail-options');
const detailCustom  = document.getElementById('detail-custom');
const detailInput   = document.getElementById('detail-input');

function renderDetail() {
  const type = state.type;
  const custom = !type.options.length;
  document.getElementById('d-title').textContent = type.question;
  document.getElementById('d-subtitle').textContent = custom ? 'Өз ойыңды жаз' : 'Біреуін таңда';

  detailOptions.hidden = custom;
  detailCustom.hidden = !custom;
  detailOptions.textContent = '';
  if (custom) { detailInput.value = state.detail; return; }

  type.options.forEach((label) => {
    const btn = optionButton(label, () => {
      select(detailOptions, btn);
      state.detail = label;
      showScreen(screenWhen);
    });
    if (label === state.detail) btn.classList.add('is-selected');
    detailOptions.appendChild(btn);
  });
}

detailCustom.addEventListener('submit', (e) => {
  e.preventDefault();
  const value = detailInput.value.trim();
  if (!value) { detailInput.focus(); return; }
  state.detail = value;
  showScreen(screenWhen);
});

/* --- Күні мен уақыты --- */

const dayList  = document.getElementById('day-list');
const timeList = document.getElementById('time-list');
const btnWhen  = document.getElementById('btn-when');

const isToday = (date) => date.toDateString() === new Date().toDateString();

// Бүгінге өтіп кеткен (немесе 1 сағаттан аз қалған) уақытты таңдауға болмайды
function timeAvailable(date, time) {
  return !isToday(date) || parseInt(time, 10) > new Date().getHours() + 1;
}

function refreshTimes() {
  timeList.querySelectorAll('.chip').forEach((chip) => {
    chip.disabled = Boolean(state.date) && !timeAvailable(state.date, chip.textContent);
    if (chip.disabled && chip.textContent === state.time) {
      chip.classList.remove('is-selected');
      state.time = '';
    }
  });
  btnWhen.disabled = !(state.date && state.time);
}

for (let i = 0; i < DAYS_AHEAD; i++) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + i);
  if (!TIMES.some((time) => timeAvailable(date, time))) continue;   // бүгін кеш болса

  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip chip--day';
  chip.innerHTML = `<span>${WEEKDAYS_SHORT[date.getDay()]}</span>` +
                   `<strong>${date.getDate()}</strong>` +
                   `<span>${MONTHS[date.getMonth()].slice(0, 3)}</span>`;
  chip.setAttribute('aria-label', formatDate(date));
  chip.addEventListener('click', () => {
    select(dayList, chip);
    state.date = date;
    refreshTimes();
  });
  dayList.appendChild(chip);
}

TIMES.forEach((time) => {
  const chip = document.createElement('button');
  chip.type = 'button';
  chip.className = 'chip';
  chip.textContent = time;
  chip.addEventListener('click', () => {
    select(timeList, chip);
    state.time = time;
    refreshTimes();
  });
  timeList.appendChild(chip);
});

function formatDate(date) {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}, ${WEEKDAYS[date.getDay()]}`;
}

btnWhen.addEventListener('click', () => showScreen(screenPhone));

/* --- Нөмір → Telegram --- */

const phoneForm  = document.getElementById('phone-form');
const phoneInput = document.getElementById('phone-input');
const phoneError = document.getElementById('phone-error');
const btnSend    = document.getElementById('btn-send');

phoneInput.addEventListener('input', () => { phoneError.hidden = true; });

async function sendToTelegram(text) {
  const { botToken, chatId } = CONFIG.telegram;
  if (!botToken || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      body: new URLSearchParams({ chat_id: chatId, text }),
    });
    const data = await res.json();
    return Boolean(data.ok);
  } catch (e) {
    return false;
  }
}

phoneForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (btnSend.disabled) return;

  const phone = phoneInput.value.trim();
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 15) {
    phoneError.textContent = 'Нөмірді толық жазшы';
    phoneError.hidden = false;
    phoneInput.focus();
    return;
  }
  state.phone = phone;

  const what = `${state.type.icon} ${state.type.label} — ${state.detail}`;
  const when = `📅 ${formatDate(state.date)}, ${state.time}`;

  btnSend.disabled = true;
  btnSend.textContent = 'Жіберілуде…';
  const sent = await sendToTelegram(
    `💌 ${CONFIG.name} кездесуге келісті!\n\n${what}\n${when}\n📞 ${state.phone}`
  );
  btnSend.disabled = false;
  btnSend.textContent = 'Жіберу';

  if (!sent) {
    phoneError.textContent = 'Жіберілмей қалды. Интернетті тексеріп, қайта басып көрші';
    phoneError.hidden = false;
    return;
  }

  document.getElementById('summary').textContent = `${what}\n${when}`;

  trail.length = 0;
  showScreen(screenYay);
  setTimeout(startFireworks, 380);
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
