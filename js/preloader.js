/* ════════════════════════════════════════════════
   PRELOADER ENGINE
════════════════════════════════════════════════ */
(function () {
    'use strict';
  
    /* ── Helpers ── */
    const $ = id => document.getElementById(id);
    const rnd  = (a, b) => a + Math.random() * (b - a);
    const lerp = (a, b, t) => a + (b - a) * t;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
  
    /* ── Easing ── */
    function easeOutExpo(t)  { return t === 1 ? 1 : 1 - Math.pow(2, -10 * t); }
    function easeOutBack(t)  {
      const c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function easeInOutQuart(t) {
      return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
    }
  
    /* ── Canvas setup ── */
    const canvas = $('pl-canvas');
    const ctx    = canvas.getContext('2d');
    let W, H;
    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);
  
    /* ── Particles ── */
    const PARTICLE_COUNT = 55;
    const particles = [];
  
    function makeBeanPath(ctx, x, y, w, h, angle) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      const rx = w / 2, ry = h / 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.restore();
    }
  
    function spawnParticle(phase) {
      // phase 0 = swirl in from edges, 1 = calm float
      const fromEdge = Math.random() < 0.5;
      let x, y, vx, vy;
      if (fromEdge) {
        const side = Math.floor(Math.random() * 4);
        if (side === 0) { x = rnd(0, W); y = -30; }
        else if (side === 1) { x = W + 30; y = rnd(0, H); }
        else if (side === 2) { x = rnd(0, W); y = H + 30; }
        else { x = -30; y = rnd(0, H); }
        const cx = W / 2 + rnd(-60, 60), cy = H / 2 + rnd(-60, 60);
        const ang = Math.atan2(cy - y, cx - x) + rnd(-0.4, 0.4);
        const spd = rnd(0.6, 1.8);
        vx = Math.cos(ang) * spd;
        vy = Math.sin(ang) * spd;
      } else {
        x = rnd(0, W); y = rnd(0, H);
        vx = rnd(-0.4, 0.4);
        vy = rnd(-0.6, -0.15);
      }
  
      const size  = rnd(4, 13);
      const alpha = rnd(0.08, 0.38);
      const spin  = rnd(-0.04, 0.04);
      const angle = rnd(0, Math.PI * 2);
  
      // color: mix of espresso, cream, gold
      const palette = ['#3D2314','#5a3218','#7a4520','#B8860B','#c9a06a','#E8D4B8'];
      const color = palette[Math.floor(Math.random() * palette.length)];
  
      return { x, y, vx, vy, size, alpha, spin, angle, color,
               life: 0, maxLife: rnd(120, 300),
               wobble: rnd(0, Math.PI * 2), wobbleSpd: rnd(0.01, 0.03) };
    }
  
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push(spawnParticle(0));
    }
  
    function drawBeanParticle(p) {
      ctx.save();
      ctx.globalAlpha = p.alpha * (p.life < 20 ? p.life / 20 : p.life > p.maxLife - 20 ? (p.maxLife - p.life) / 20 : 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      const w = p.size * 1.7, h = p.size * 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // crease line
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 * 0.7);
      ctx.bezierCurveTo(0, 0, 0, 0, 0, h / 2 * 0.7);
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }
  
    /* ── Central glow ring ── */
    function drawGlowRing(progress) {
      const cx = W / 2, cy = H / 2;
      const r  = clamp(W, 300, 600) * 0.38 * easeOutExpo(clamp(progress, 0, 1));
      const g  = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r);
      g.addColorStop(0,   'rgba(184,134,11,0.08)');
      g.addColorStop(0.6, 'rgba(122,69,32,0.04)');
      g.addColorStop(1,   'rgba(26,13,6,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    }
  
    /* ── Orbital ring ── */
    function drawOrbitalRing(t) {
      const cx = W / 2, cy = H / 2;
      const r  = clamp(Math.min(W, H), 200, 480) * 0.28;
      const dash = 6, gap = 14;
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth   = 0.8;
      ctx.setLineDash([dash, gap]);
      ctx.lineDashOffset = -t * 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
  
      // second ring, opposite direction
      ctx.save();
      ctx.globalAlpha = 0.07;
      ctx.strokeStyle = '#E8D4B8';
      ctx.lineWidth   = 0.5;
      ctx.setLineDash([3, 20]);
      ctx.lineDashOffset = t * 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  
    /* ── Logo chars ── */
    const WORD1 = 'HAZAI';
    const WORD2 = 'KÁVÉ';
    const logoEl = $('pl-logo');
  
    // Build spans
    let charEls = [];
    function buildLogoChars() {
      logoEl.innerHTML = '';
      charEls = [];
      const words = [WORD1, ' ', WORD2];
      words.forEach((word, wi) => {
        if (word === ' ') {
          const sp = document.createElement('span');
          sp.style.width = '0.4em';
          sp.style.display = 'inline-block';
          logoEl.appendChild(sp);
          return;
        }
        [...word].forEach((ch, ci) => {
          const span = document.createElement('span');
          span.className = 'pl-char' + (wi === 2 ? ' accent' : '');
          span.textContent = ch;
          logoEl.appendChild(span);
          charEls.push({ el: span, delay: (wi * WORD1.length + ci) * 0.015, done: false });
        });
      });
    }
    buildLogoChars();
  
    /* ── Timeline (seconds) ── */
    // 0.0 – 0.5  : fade in particles + glow ring
    // 0.3 – 0.9  : bean animates in
    // 0.7 – 1.8  : chars fly in one by one
    // 1.9 – 2.5  : tagline fades in
    // 2.6 – 3.2  : progress bar fills
    // 3.4        : hide
  
    const TOTAL_MS = 3500;
    let startTime  = null;
    let frameId    = null;
    let globalT    = 0; // 0..1
  
    /* ── Bean animation state ── */
    const beanEl = $('pl-bean');
  
    /* ── Tagline ── */
    const tagEl  = $('pl-tagline');
  
    /* ── Progress bar ── */
    const barFill = $('pl-bar-fill');
    const pctEl   = $('pl-pct');
  
    function animateProp(el, prop, from, to, t, easing) {
      el.style[prop] = lerp(from, to, easing(clamp(t, 0, 1)));
    }
  
    /* ── Main loop ── */
    function tick(now) {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const T = clamp(elapsed / TOTAL_MS, 0, 1); // global 0-1
      globalT = T;
  
      /* clear */
      ctx.clearRect(0, 0, W, H);
  
      /* bg vignette */
      const vigW = W, vigH = H;
      const vig = ctx.createRadialGradient(vigW/2, vigH/2, 0, vigW/2, vigH/2, Math.hypot(vigW, vigH)/2);
      vig.addColorStop(0,   'rgba(26,13,6,0)');
      vig.addColorStop(0.7, 'rgba(10,5,2,0.15)');
      vig.addColorStop(1,   'rgba(4,2,1,0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, W, H);
  
      /* glow ring */
      drawGlowRing(easeOutExpo(clamp((T - 0) / 0.5, 0, 1)));
  
      /* orbital rings */
      drawOrbitalRing(elapsed);
  
      /* particles */
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.life++;
        p.angle  += p.spin;
        p.wobble += p.wobbleSpd;
        // slight swirl toward center early on
        if (T < 0.35) {
          const cx = W/2, cy = H/2;
          const dx = cx - p.x, dy = cy - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          p.vx += dx / dist * 0.018;
          p.vy += dy / dist * 0.018;
        }
        // drift
        p.x += p.vx + Math.sin(p.wobble) * 0.25;
        p.y += p.vy;
        // friction
        p.vx *= 0.995;
        p.vy *= 0.995;
  
        if (p.life >= p.maxLife) {
          particles[i] = spawnParticle(T < 0.35 ? 0 : 1);
          continue;
        }
        drawBeanParticle(p);
      }
  
      /* ── Bean ── */
      const beanT = clamp((T - 0.24) / 0.28, 0, 1);
      if (beanT > 0) {
        const e = easeOutBack(beanT);
        beanEl.style.opacity   = String(clamp(beanT * 3, 0, 1));
        beanEl.style.transform = `scale(${lerp(0.5, 1, e)}) rotate(${lerp(-25, 0, e)}deg)`;
      }
  
      /* ── Logo chars ── */
      const charStart = 0.22; // normalized
      charEls.forEach((c, i) => {
        const delay = charStart + c.delay;
        const dur   = 0.12;
        const ct    = clamp((T - delay) / dur, 0, 1);
        if (ct <= 0) return;
        const e = easeOutBack(ct);
        c.el.style.opacity   = String(clamp(ct * 4, 0, 1));
        c.el.style.transform = `translateY(${lerp(60, 0, e)}px) rotate(${lerp(8, 0, e)}deg)`;
      });
  
      /* ── Tagline ── */
      const tagT = clamp((T - 0.56) / 0.14, 0, 1);
      tagEl.style.opacity   = String(easeOutExpo(tagT));
      tagEl.style.transform = `translateY(${lerp(12, 0, tagT)}px)`;
  
      /* ── Progress bar ── */
      const barT  = clamp((T - 0.68) / 0.28, 0, 1);
      const pct   = Math.round(easeInOutQuart(barT) * 100);
      barFill.style.width = pct + '%';
      pctEl.textContent   = pct + '%';
  
      /* ── Exit ── */
      if (T >= 1) {
        cancelAnimationFrame(frameId);
        $('preloader').classList.add('hide');
        setTimeout(() => {
          const pl = $('preloader');
          if (pl) pl.remove();
        }, 950);
        return;
      }
  
      frameId = requestAnimationFrame(tick);
    }
  
    frameId = requestAnimationFrame(tick);
  
  })();