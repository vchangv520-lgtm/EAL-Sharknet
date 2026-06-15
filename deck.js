/* =================================================================
   BEYOND THE NET — deck engine
   -----------------------------------------------------------------
   codex: this engine is DONE. You should not need to touch it.
   To add behaviour to a slide, use these data-attributes in the HTML:

     data-reveal             fade/slide an element in when its slide opens
     data-delay="240"        custom stagger offset in ms (optional)
     data-count="676"        count up to a number when the slide opens
       data-suffix="+"  data-prefix="$"  data-dec="1"  data-dur="1400"
     data-grow="42%"         grow a bar/segment to this height/width
     <div class="waffle" data-total="100" data-fill="11">  ratio grid

   Navigation: ← → ↑ ↓ Space PageUp/Dn Home End, click arrows, swipe,
   and URL hash (#3) for deep links. All handled below.
   ================================================================= */
(() => {
  'use strict';

  const slides  = [...document.querySelectorAll('.slide')];
  const barFill = document.querySelector('.hud__bar span');
  const counter = document.getElementById('count');
  const total   = slides.length;
  let index = 0;

  const pad = (n) => String(n).padStart(2, '0');
  const clamp = (i) => Math.max(0, Math.min(total - 1, i));

  /* ---------- core: activate a slide ---------- */
  function activate(i, push = true) {
    i = clamp(i);
    index = i;
    slides.forEach((s, n) => {
      s.classList.toggle('is-active', n === i);
      s.classList.toggle('is-prev', n < i);
    });
    barFill.style.width = (total > 1 ? (i / (total - 1)) * 100 : 100) + '%';
    counter.innerHTML = pad(i + 1) + '&nbsp;/&nbsp;' + pad(total);
    if (push && location.hash !== '#' + (i + 1)) {
      history.replaceState(null, '', '#' + (i + 1));
    }
    play(slides[i]);
  }

  /* ---------- per-slide entrance choreography ---------- */
  function play(slide) {
    // 1. staggered reveals
    const items = [...slide.querySelectorAll('[data-reveal]')];
    items.forEach((el) => el.classList.remove('in'));
    items.forEach((el, n) => {
      const delay = el.dataset.delay ? +el.dataset.delay : n * 90;
      setTimeout(() => el.classList.add('in'), 90 + delay);
    });

    // 2. count-up numbers
    slide.querySelectorAll('[data-count]').forEach((el) => countUp(el));

    // 3. grow bars / segments (double-rAF so the 0% baseline paints first)
    slide.querySelectorAll('[data-grow]').forEach((el) => {
      el.style.setProperty('--grow', '0%');
      requestAnimationFrame(() =>
        requestAnimationFrame(() => el.style.setProperty('--grow', el.dataset.grow))
      );
    });

    // 4. waffle counting animation (cells pop in one-by-one, tallies tick up)
    slide.querySelectorAll('.waffle').forEach((w) => playWaffle(w));
  }

  /* ---------- waffle: sequential fill + live count ---------- */
  function playWaffle(w) {
    const cells = [...w.querySelectorAll('.waffle__cell')];
    const fill = +w.dataset.fill || 0;
    const wrap = w.closest('.waffle-wrap');
    const goodEl = wrap && wrap.querySelector('[data-tally="good"]');
    const badEl = wrap && wrap.querySelector('[data-tally="bad"]');
    let good = 0, bad = 0, t = 480;

    cells.forEach((c) => c.classList.remove('is-on'));
    if (goodEl) { goodEl.textContent = '0'; goodEl.parentElement.classList.remove('pulse'); }
    if (badEl)  { badEl.textContent = '0';  badEl.parentElement.classList.remove('pulse'); }

    cells.forEach((c, i) => {
      const isGood = c.classList.contains('is-fill');
      // count the target sharks slowly (you can follow along), then flood the rest
      t += i < fill ? 78 : 15;
      setTimeout(() => {
        c.classList.add('is-on');
        if (isGood && goodEl) {
          goodEl.textContent = ++good;
          if (good === fill) goodEl.parentElement.classList.add('pulse');
        } else if (!isGood && badEl) {
          badEl.textContent = ++bad;
        }
      }, t);
    });
  }

  /* ---------- count-up with easeOutCubic ---------- */
  function countUp(el) {
    const target = parseFloat(el.dataset.count) || 0;
    const dur = +el.dataset.dur || 1400;
    const dec = +el.dataset.dec || 0;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const fmt = (v) =>
      prefix +
      v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
      suffix;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = fmt(target * eased);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(target);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- build waffle grids once on load ---------- */
  function buildWaffles() {
    document.querySelectorAll('.waffle').forEach((w) => {
      const cells = +w.dataset.total || 100;
      const fill = +w.dataset.fill || 0;
      const frag = document.createDocumentFragment();
      for (let n = 0; n < cells; n++) {
        const c = document.createElement('span');
        c.className = 'waffle__cell' + (n < fill ? ' is-fill' : '');
        frag.appendChild(c);
      }
      w.appendChild(frag);
    });
  }

  /* ---------- ambient bubbles ---------- */
  function spawnBubbles() {
    const host = document.getElementById('bubbles');
    if (!host) return;
    const COUNT = 16;
    for (let n = 0; n < COUNT; n++) {
      const b = document.createElement('span');
      const size = 4 + Math.random() * 12;
      b.className = 'bubble';
      b.style.left = Math.random() * 100 + '%';
      b.style.width = b.style.height = size + 'px';
      b.style.animationDuration = 9 + Math.random() * 12 + 's';
      b.style.animationDelay = -Math.random() * 18 + 's';
      b.style.opacity = 0.15 + Math.random() * 0.35;
      host.appendChild(b);
    }
  }

  /* ---------- navigation ---------- */
  const next = () => activate(index + 1);
  const prev = () => activate(index - 1);

  document.getElementById('next').addEventListener('click', next);
  document.getElementById('prev').addEventListener('click', prev);

  window.addEventListener('keydown', (e) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === 'Home') activate(0);
    else if (e.key === 'End') activate(total - 1);
  });

  // touch swipe
  let tx = 0, ty = 0;
  const deck = document.getElementById('deck');
  deck.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - tx;
    const dy = e.changedTouches[0].clientY - ty;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) dx < 0 ? next() : prev();
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const n = parseInt(location.hash.slice(1), 10);
    if (!isNaN(n)) activate(n - 1, false);
  });

  /* ---------- boot ---------- */
  buildWaffles();
  spawnBubbles();
  const startHash = parseInt(location.hash.slice(1), 10);
  activate(!isNaN(startHash) ? startHash - 1 : 0, false);
})();
