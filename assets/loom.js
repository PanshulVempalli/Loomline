/* Loomline: a working loom drawn on canvas.
   Heddles lift alternate warp threads, the shuttle carries a coloured weft through the shed,
   the reed beats each row into the cloth, and the finished cloth is a picture of a website.
   Desktop: scrubbed by scroll (pinned). Mobile: plays when in view. Reduced motion: finished frame. */
(function () {
  'use strict';
  var canvas = document.getElementById('loomCanvas');
  if (!canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var stages = Array.prototype.slice.call(document.querySelectorAll('.loom__stages li'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var W = 640, H = 720;

  /* ---------- the picture woven into the cloth (48 x 26 cells) ---------- */
  var COLS = 48, ROWS = 26;
  var PAL = ['#2A2766', '#14B8A6', '#FB7185', '#F4F4FB', '#0D0B26', '#0F766E', '#99F6E4'];
  var pic = [];
  for (var r = 0; r < ROWS; r++) { pic.push([]); for (var c = 0; c < COLS; c++) pic[r].push(3); }
  var fill = function (r0, r1, c0, c1, v) { for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) pic[r][c] = v; };
  fill(0, 2, 0, 47, 4);                       // browser bar
  [2, 4, 6].forEach(function (c) { pic[1][c] = 2; });
  fill(1, 1, 10, 30, 5);                      // address bar
  fill(0, 25, 0, 0, 5); fill(0, 25, 47, 47, 5); fill(25, 25, 0, 47, 5); // frame
  fill(4, 5, 3, 9, 1);                        // logo
  fill(4, 4, 30, 33, 5); fill(4, 4, 36, 39, 5); fill(4, 4, 42, 45, 5); // nav links
  fill(8, 9, 3, 23, 4); fill(11, 12, 3, 18, 4); // headline
  fill(14, 14, 3, 21, 6);                     // paragraph
  fill(16, 17, 3, 10, 2);                     // button
  fill(7, 17, 27, 44, 1);                     // hero image
  fill(10, 13, 31, 40, 6); fill(11, 12, 33, 38, 5); // image detail
  [[3, 14], [18, 29], [33, 44]].forEach(function (cc) { fill(20, 23, cc[0], cc[1], 6); pic[21][cc[0] + 2] = 2; pic[21][cc[0] + 3] = 2; });

  /* ---------- geometry ---------- */
  var X0 = 80, PITCH = 10, N = COLS, X1 = X0 + (N - 1) * PITCH;
  var BEAM_Y = 72, HEDDLE_Y = 250, SHED = 22, SHUTTLE_Y = 352, FELL = 430, CELL = 10, REED_REST = 384;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var smooth = function (p) { p = clamp(p, 0, 1); return p * p * (3 - 2 * p); };
  var inOut = function (p) { p = clamp(p, 0, 1); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };

  function setup() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function gear(x, y, r, teeth, angle, color) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle);
    ctx.beginPath();
    for (var i = 0; i < teeth * 2; i++) {
      var a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r + 6;
      var a2 = a + Math.PI / (teeth * 2);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); ctx.lineTo(Math.cos(a2) * rr, Math.sin(a2) * rr);
    }
    ctx.closePath(); ctx.fillStyle = '#1E1B4B'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.stroke();
    for (var s = 0; s < 4; s++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(r * 0.38, 0); ctx.lineTo(r * 0.85, 0); ctx.stroke(); }
    ctx.restore();
  }

  function cell(x, y, v, over) {
    ctx.fillStyle = PAL[v]; ctx.fillRect(x - PITCH / 2 + 0.5, y + 0.5, PITCH - 1, CELL - 1);
    ctx.fillStyle = over ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.16)';   // over/under sheen
    ctx.fillRect(x - PITCH / 2 + 0.5, y + 0.5, PITCH - 1, (CELL - 1) / 2);
  }

  /* p: 0..1 overall progress, t: seconds (idle motion) */
  function draw(p, t) {
    var picks = p * ROWS, done = Math.min(ROWS, Math.floor(picks)), frac = done >= ROWS ? 1 : picks - done;
    var openAmt = done >= ROWS ? 0 : smooth(frac / 0.14) * (1 - smooth((frac - 0.82) / 0.18));
    var travel = inOut((frac - 0.14) / 0.64);
    var beat = frac > 0.8 ? Math.sin(clamp((frac - 0.8) / 0.2, 0, 1) * Math.PI) : 0;
    var settle = smooth((frac - 0.86) / 0.14);            // new row slides into the cloth
    var dir = done % 2 === 0 ? 1 : -1;
    var liftOdd = done % 2 === 0;
    var shuttleX = dir > 0 ? 30 + travel * (W - 60) : W - 30 - travel * (W - 60);

    ctx.clearRect(0, 0, W, H);

    // frame
    ctx.strokeStyle = '#2F2B70'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(34, 40); ctx.lineTo(34, 712); ctx.moveTo(W - 34, 40); ctx.lineTo(W - 34, 712); ctx.moveTo(34, 40); ctx.lineTo(W - 34, 40); ctx.stroke();

    // gears turn with the work, plus a slow idle spin
    var spin = picks * 0.9 + t * 0.35;
    gear(34, 72, 22, 10, spin, '#14B8A6');
    gear(34, 120, 14, 8, -spin * 1.55, '#5EEAD4');
    gear(W - 34, 700, 22, 10, -spin, '#14B8A6');

    // warp beam (top roller) with turning stripes
    ctx.fillStyle = '#1E1B4B'; ctx.beginPath(); ctx.roundRect(60, BEAM_Y - 16, W - 120, 30, 15); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.roundRect(60, BEAM_Y - 16, W - 120, 30, 15); ctx.clip();
    ctx.strokeStyle = 'rgba(94,234,212,0.25)'; ctx.lineWidth = 2;
    for (var k = -2; k < 30; k++) { var sx = 60 + ((k * 22 + spin * 14) % 660); ctx.beginPath(); ctx.moveTo(sx, BEAM_Y - 16); ctx.lineTo(sx - 12, BEAM_Y + 14); ctx.stroke(); }
    ctx.restore();

    // harness bars (move opposite each other)
    var offA = liftOdd ? -SHED * openAmt : SHED * openAmt, offB = -offA;
    [[HEDDLE_Y - 26 + offA, '#5EEAD4'], [HEDDLE_Y + 26 + offB, '#14B8A6']].forEach(function (h) {
      ctx.fillStyle = '#1E1B4B'; ctx.fillRect(48, h[0] - 4, W - 96, 8); ctx.strokeStyle = h[1]; ctx.lineWidth = 1.5; ctx.strokeRect(48, h[0] - 4, W - 96, 8);
    });

    // warp threads: two passes so the shuttle passes "through" the shed
    var warp = function (lifted) {
      ctx.lineWidth = 1.3;
      for (var i = 0; i < N; i++) {
        var odd = i % 2 === 1, up = odd === liftOdd;
        if (up !== lifted) continue;
        var x = X0 + i * PITCH, shimmer = Math.sin(t * 2 + i * 0.6) * 0.4;
        var hy = HEDDLE_Y + (up ? -SHED : SHED) * openAmt;
        ctx.strokeStyle = up ? 'rgba(153,246,228,0.95)' : 'rgba(94,234,212,0.55)';
        ctx.beginPath(); ctx.moveTo(x, BEAM_Y + 14); ctx.lineTo(x + shimmer, hy); ctx.lineTo(x, FELL); ctx.stroke();
        ctx.fillStyle = '#0D0B26'; ctx.beginPath(); ctx.arc(x + shimmer, hy, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = up ? '#99F6E4' : '#14B8A6'; ctx.lineWidth = 1; ctx.stroke(); ctx.lineWidth = 1.3;
      }
    };

    // woven cloth below the fell line (picture is woven bottom row first, so it ends upright)
    var shift = done < ROWS ? settle * CELL : 0;
    ctx.save(); ctx.beginPath(); ctx.rect(X0 - PITCH / 2, FELL, X1 - X0 + PITCH, 270); ctx.clip();
    for (var k2 = 0; k2 < done; k2++) {
      var prow = ROWS - 1 - k2, y = FELL + (done - 1 - k2) * CELL + shift;
      for (var c2 = 0; c2 < COLS; c2++) cell(X0 + c2 * PITCH, y, pic[prow][c2], (c2 + k2) % 2 === 0);
    }
    ctx.restore();

    warp(false);

    // the row being woven: weft laid behind the shuttle, then beaten to the fell
    if (done < ROWS) {
      var prowNow = ROWS - 1 - done;
      var rowY = SHUTTLE_Y + (FELL - CELL - SHUTTLE_Y) * smooth((frac - 0.8) / 0.12) + shift * 0;
      var rowYfinal = frac > 0.86 ? FELL - CELL + settle * CELL : rowY;
      for (var c3 = 0; c3 < COLS; c3++) {
        var cx = X0 + c3 * PITCH;
        var laid = dir > 0 ? cx <= shuttleX : cx >= shuttleX;
        if (laid || frac > 0.78) cell(cx, rowYfinal - CELL / 2 + 5, pic[prowNow][c3], (c3 + done) % 2 === 0);
      }
      // weft thread from the selvage to the shuttle
      if (frac > 0.12 && frac < 0.8) {
        ctx.strokeStyle = PAL[pic[prowNow][dir > 0 ? 0 : COLS - 1]] === '#F4F4FB' ? '#FB7185' : '#FB7185';
        ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(dir > 0 ? X0 - 6 : X1 + 6, SHUTTLE_Y + 5); ctx.lineTo(shuttleX, SHUTTLE_Y + 5); ctx.stroke();
      }
      // shuttle
      if (frac > 0.1 && frac < 0.82) {
        ctx.save(); ctx.translate(shuttleX, SHUTTLE_Y + 5);
        if (dir < 0) ctx.scale(-1, 1);
        ctx.shadowColor = 'rgba(251,113,133,0.8)'; ctx.shadowBlur = 16;
        ctx.fillStyle = '#FB7185'; ctx.beginPath();
        ctx.moveTo(-40, 0); ctx.quadraticCurveTo(-20, -9, 0, -9); ctx.lineTo(20, -9); ctx.quadraticCurveTo(36, -8, 44, 0);
        ctx.quadraticCurveTo(36, 8, 20, 9); ctx.lineTo(0, 9); ctx.quadraticCurveTo(-20, 9, -40, 0); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#0D0B26'; ctx.beginPath(); ctx.roundRect(-14, -4.5, 28, 9, 4); ctx.fill();
        ctx.fillStyle = '#F4F4FB'; ctx.fillRect(-10, -2, 20, 4);
        ctx.restore();
      }
    }

    warp(true);

    // reed / beater swings to the fell line at the end of each pick
    var reedY = REED_REST + (FELL - 6 - REED_REST) * beat;
    ctx.fillStyle = '#1E1B4B'; ctx.fillRect(48, reedY - 18, W - 96, 6);
    ctx.strokeStyle = '#14B8A6'; ctx.lineWidth = 1.5; ctx.strokeRect(48, reedY - 18, W - 96, 6);
    ctx.strokeStyle = 'rgba(94,234,212,0.6)'; ctx.lineWidth = 1;
    for (var i2 = 0; i2 <= N; i2++) { var tx = X0 - PITCH / 2 + i2 * PITCH; ctx.beginPath(); ctx.moveTo(tx, reedY - 12); ctx.lineTo(tx, reedY); ctx.stroke(); }
    if (beat > 0.6) { ctx.fillStyle = 'rgba(251,113,133,' + ((beat - 0.6) * 1.5).toFixed(2) + ')'; ctx.fillRect(X0 - 6, FELL - 2, X1 - X0 + 12, 3); }

    // cloth beam
    ctx.fillStyle = '#1E1B4B'; ctx.beginPath(); ctx.roundRect(60, 700, W - 120, 22, 11); ctx.fill();

    // stages
    stages.forEach(function (li, i) { li.classList.toggle('is-on', p >= (i + 0.35) / stages.length || p >= 0.999); });
  }

  setup();
  window.addEventListener('resize', setup);

  if (reduce) { draw(1, 0); return; }

  var progress = 0, visible = false, t0 = performance.now(), raf = 0;
  var loop = function (now) {
    raf = 0; if (!visible) return;
    draw(progress, (now - t0) / 1000);
    raf = requestAnimationFrame(loop);
  };
  var start = function () { if (!raf) raf = requestAnimationFrame(loop); };
  if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; if (visible) start(); }, { rootMargin: '200px' }).observe(canvas);
  else { visible = true; start(); }

  var desktop = window.matchMedia('(min-width: 900px)').matches;
  if (window.gsap && window.ScrollTrigger && desktop) {
    gsap.registerPlugin(ScrollTrigger);
    var proxy = { p: 0 };
    gsap.to(proxy, { p: 1, ease: 'none', onUpdate: function () { progress = proxy.p; },
      scrollTrigger: { trigger: '#loom', start: 'top top', end: '+=2200', pin: true, scrub: 1, anticipatePin: 1 } });
  } else {
    // mobile: weave on its own while in view, hold the finished cloth, then start again
    var auto = function (now) {
      var cyc = ((now - t0) / 1000) % 16;
      progress = Math.min(1, cyc / 13);
      requestAnimationFrame(auto);
    };
    requestAnimationFrame(auto);
  }
})();
