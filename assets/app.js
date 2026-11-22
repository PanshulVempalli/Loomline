(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile nav ---------- */
  (function () {
    var btn = $('.bar__toggle'), nav = $('#nav');
    if (!btn || !nav) return;
    function set(open) { nav.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Close' : 'Menu'; }
    btn.addEventListener('click', function () { set(!nav.classList.contains('is-open')); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  })();

  /* ---------- hero: woven thread field ---------- */
  (function () {
    window.__heroQuiet = true; // threads still part around the cursor; no coral trail across the headline
    var cv = $('#weave'); if (!cv) return;
    var hero = cv.parentElement, ctx = cv.getContext('2d');
    var W = 0, H = 0, threads = [], gap = 12, grad = null;
    var head = { x: 0, y: 0 }, trail = [], TRAIL = 72;
    var ptr = { x: 0, y: 0, on: false };
    var t0 = performance.now(), raf = 0, visible = true;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), r = cv.getBoundingClientRect();
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gap = W < 700 ? 17 : 12;
      var n = Math.max(8, Math.floor(W / gap)), step = W / n;
      threads = [];
      for (var i = 0; i < n; i++) threads.push({ i: i, x: (i + 0.5) * step, phase: Math.random() * 6.283, delay: (i / n) * 0.9 + Math.random() * 0.15 });
      grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(20,184,166,0.62)');
      grad.addColorStop(0.55, 'rgba(110,108,210,0.30)');
      grad.addColorStop(1, 'rgba(30,27,75,0.10)');
      head.x = W * 0.68; head.y = H * 0.4; trail = [];
    }

    function xAt(th, y, s) {
      var off = Math.sin(y * 0.011 + th.phase + s * 0.55) * 2.4;
      var dx = th.x - head.x, dy = y - head.y;
      var infl = Math.exp(-(dx * dx + dy * dy) / (2 * 150 * 150));
      off += (dx >= 0 ? 1 : -1) * Math.min(1, Math.abs(dx) / 30 + 0.2) * infl * 30;
      return th.x + off;
    }

    function frame(now, still) {
      var s = still ? 10 : (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      var tx, ty;
      if (ptr.on) { tx = ptr.x; ty = ptr.y; }
      else { tx = W * 0.66 + Math.cos(s * 0.45) * W * 0.2; ty = H * 0.4 + Math.sin(s * 0.7) * H * 0.18; }
      var ease = still ? 1 : 0.075;
      head.x += (tx - head.x) * ease; head.y += (ty - head.y) * ease;

      ctx.lineWidth = 1.2; ctx.strokeStyle = grad; ctx.lineCap = 'round';
      for (var i = 0; i < threads.length; i++) {
        var th = threads[i];
        var p = clamp((s - th.delay) / 1.1, 0, 1); p = 1 - Math.pow(1 - p, 3);
        if (p <= 0) continue;
        var lim = H * p;
        ctx.beginPath();
        for (var y = 0; y <= lim; y += 14) { var x = xAt(th, y, s); if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.stroke();
      }

      if (s > 0.9 && !window.__heroQuiet) {
        var a = clamp((s - 0.9) / 0.8, 0, 1);
        trail.push({ x: head.x, y: head.y });
        if (trail.length > TRAIL) trail.shift();
        for (var j = 1; j < trail.length; j++) {
          var k = j / trail.length;
          ctx.beginPath();
          ctx.moveTo(trail[j - 1].x, trail[j - 1].y); ctx.lineTo(trail[j].x, trail[j].y);
          ctx.strokeStyle = 'rgba(251,113,133,' + (k * 0.95 * a).toFixed(3) + ')';
          ctx.lineWidth = 0.6 + 4.6 * k; ctx.stroke();
        }
        /* over/under: every other warp thread crosses back over the weft near its head */
        ctx.strokeStyle = 'rgba(94,234,212,' + (0.9 * a).toFixed(3) + ')'; ctx.lineWidth = 1.7;
        for (var m = Math.max(0, trail.length - 40); m < trail.length; m += 2) {
          var pt = trail[m], base = Math.floor(pt.x / (W / threads.length));
          for (var d = 0; d <= 1; d++) {
            var th2 = threads[base + d]; if (!th2 || th2.i % 2) continue;
            var x1 = xAt(th2, pt.y - 9, s), x2 = xAt(th2, pt.y + 9, s);
            if (Math.abs(x1 - pt.x) < 3) { ctx.beginPath(); ctx.moveTo(x1, pt.y - 9); ctx.lineTo(x2, pt.y + 9); ctx.stroke(); }
          }
        }
        ctx.save();
        ctx.shadowColor = '#FB7185'; ctx.shadowBlur = 20; ctx.fillStyle = 'rgba(251,113,133,' + a.toFixed(3) + ')';
        ctx.beginPath(); ctx.arc(head.x, head.y, 5.5, 0, 6.283); ctx.fill(); ctx.restore();
      }
    }

    function loop(now) { if (visible) frame(now, false); raf = requestAnimationFrame(loop); }

    size();
    if (reduced) {
      head.x = W * 0.66; head.y = H * 0.4;
      for (var q = 0; q < TRAIL; q++) { var kk = q / TRAIL; trail.push({ x: W * 0.66 - (TRAIL - q) * 6, y: H * 0.4 + Math.sin(q * 0.2) * 24 }); }
      frame(0, true);
    } else {
      raf = requestAnimationFrame(loop);
      hero.addEventListener('pointermove', function (e) { var r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; });
      hero.addEventListener('pointerleave', function () { ptr.on = false; });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0 }).observe(hero);
    }
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { size(); if (reduced) frame(0, true); }, 150); });
  })();

  /* ---------- scroll thread through the page ---------- */
  (function () {
    var svg = $('#thread'), main = $('#main'); if (!svg || !main) return;
    var sections = $$('[data-node]'), contact = $('#contact');
    var base = $('.thread__base', svg), draw = $('.thread__draw', svg), head = $('.thread__head', svg), g = $('.thread__nodes', svg);
    var ns = 'http://www.w3.org/2000/svg', nodes = [], len = 1, y0 = 0, y1 = 1, mTop = 0, ticking = false;

    function layout() {
      var mr = main.getBoundingClientRect(); mTop = mr.top + window.scrollY;
      svg.setAttribute('viewBox', '0 0 ' + mr.width + ' ' + mr.height);
      var wr = sections[0].querySelector('.wrap').getBoundingClientRect();
      var x = Math.max(14, wr.left - 22);
      g.innerHTML = ''; nodes = [];
      var pts = sections.map(function (s, i) {
        var a = s.querySelector('[data-anchor]'), r = a.getBoundingClientRect();
        var y = r.top + window.scrollY - mTop + Math.min(22, r.height / 2);
        return { x: x + (i % 2 ? 7 : 0), y: y };
      });
      var endY = contact.getBoundingClientRect().top + window.scrollY - mTop;
      pts.push({ x: x, y: endY });
      var d = 'M' + pts[0].x + ' ' + pts[0].y;
      for (var i = 1; i < pts.length; i++) {
        var a = pts[i - 1], b = pts[i], mid = (a.y + b.y) / 2;
        d += ' C' + a.x + ' ' + mid + ' ' + b.x + ' ' + mid + ' ' + b.x + ' ' + b.y;
      }
      base.setAttribute('d', d); draw.setAttribute('d', d);
      len = draw.getTotalLength(); draw.style.strokeDasharray = len;
      y0 = pts[0].y; y1 = endY;
      for (var n = 0; n < pts.length - 1; n++) {
        var c = document.createElementNS(ns, 'circle');
        c.setAttribute('class', 'thread__node'); c.setAttribute('cx', pts[n].x); c.setAttribute('cy', pts[n].y); c.setAttribute('r', 7);
        g.appendChild(c); nodes.push({ el: c, y: pts[n].y });
      }
      update();
    }

    function update() {
      ticking = false;
      var p = reduced ? 1 : clamp((window.scrollY + window.innerHeight * 0.6 - mTop - y0) / (y1 - y0), 0, 1);
      draw.style.strokeDashoffset = len * (1 - p);
      var pt = draw.getPointAtLength(len * p); head.setAttribute('cx', pt.x); head.setAttribute('cy', pt.y);
      head.style.display = (p <= 0 || p >= 1) && !reduced ? 'none' : (reduced ? 'none' : '');
      var py = y0 + (y1 - y0) * p;
      nodes.forEach(function (n) { n.el.classList.toggle('is-on', reduced || py >= n.y - 4); });
    }

    layout();
    window.__threadLayout = layout;
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
    if (!reduced) window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  })();

  /* ---------- scripted assistant demo ---------- */
  (function () {
    var log = $('#chatLog'), card = $('#leadCard'), name = $('#chatName'), replay = $('#chatReplay'); if (!log) return;
    var S = {
      plumber: { biz: 'Northgate Plumbing', lines: [
        ['bot', "Hi, I'm the Northgate assistant, an AI. Tell me what's wrong and I'll pass the details to the team."],
        ['me', 'My kitchen tap is dripping badly.'],
        ['bot', "Thanks. What's your postcode, and can it wait a few days or is it urgent?"],
        ['me', 'N7. It can wait.'],
        ['bot', "Got it. I've sent this to the team. They reply during working hours, or you can call the number on this page."]],
        card: [['Job', 'Dripping kitchen tap'], ['Area', 'N7'], ['Urgency', 'Can wait a few days'], ['Status', 'Sent to the team']] },
      salon: { biz: 'Studio Fern Hair', lines: [
        ['bot', "Hi, I'm the Studio Fern assistant, an AI. I can answer questions about services and request a booking for you."],
        ['me', 'How long does a cut and colour take?'],
        ['bot', 'On the demo menu a cut and colour takes about 2 hours 30 minutes. Want me to request a slot?'],
        ['me', 'Yes, Saturday morning please.'],
        ['bot', "I've asked the team for Saturday morning. They'll confirm by message, so nothing is booked until they do."]],
        card: [['Service', 'Cut and colour'], ['Preferred time', 'Saturday morning'], ['Status', 'Waiting for the team to confirm']] },
      clinic: { biz: 'Elmfield Physio', lines: [
        ['bot', "Hi, I'm the Elmfield assistant, an AI. I can help you request an appointment. I can't give medical advice."],
        ['me', 'My knee hurts when I run. What should I do?'],
        ['bot', "I can't advise on that, but a physiotherapist can. I can request a first appointment for you. Which days suit you?"],
        ['me', 'Weekday evenings.'],
        ['bot', "Noted. I've passed that to reception, who will reply to confirm."]],
        card: [['Request', 'First appointment'], ['Preference', 'Weekday evenings'], ['Note', 'No medical advice given'], ['Status', 'Sent to reception']] }
    };
    var current = 'plumber', run = 0;
    var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

    function bubble(who) { var d = document.createElement('div'); d.className = 'msg msg--' + who; log.appendChild(d); return d; }
    function showCard(sc) {
      card.innerHTML = '<h4>Passed to the team</h4><dl>' + sc.card.map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('') + '</dl>';
      card.hidden = false;
    }
    async function play(key) {
      var id = ++run, sc = S[key]; current = key;
      name.textContent = sc.biz; log.innerHTML = ''; card.hidden = true; card.innerHTML = '';
      if (reduced) { sc.lines.forEach(function (l) { bubble(l[0]).textContent = l[1]; }); showCard(sc); return; }
      for (var i = 0; i < sc.lines.length; i++) {
        var l = sc.lines[i]; if (id !== run) return;
        if (l[0] === 'me') { await wait(700); if (id !== run) return; bubble('me').textContent = l[1]; continue; }
        var b = bubble('bot'); b.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
        await wait(650); if (id !== run) return;
        b.textContent = '';
        for (var c = 1; c <= l[1].length; c++) { if (id !== run) return; b.textContent = l[1].slice(0, c); await wait(14); }
        await wait(250);
      }
      if (id === run) showCard(sc);
    }

    var chips = $$('.chip');
    chips.forEach(function (c) { c.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === c)); }); play(c.getAttribute('data-scenario'));
    }); });
    replay.addEventListener('click', function () { play(current); });

    /* start when the demo scrolls into view */
    var started = false;
    function go() { if (!started) { started = true; play(current); } }
    if ('IntersectionObserver' in window && !reduced) new IntersectionObserver(function (en, ob) { if (en[0].isIntersecting) { go(); ob.disconnect(); } }, { threshold: 0.35 }).observe($('#chat'));
    else go();
  })();

  /* ---------- concept frames: tilt toward the pointer ---------- */
  (function () {
    if (reduced || !finePointer) return;
    $$('.frame').forEach(function (f) {
      f.addEventListener('pointermove', function (e) {
        var r = f.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        f.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg'); f.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg');
        f.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); f.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
      });
      f.addEventListener('pointerleave', function () { f.style.setProperty('--rx', '0deg'); f.style.setProperty('--ry', '0deg'); });
    });
  })();

  /* ---------- magnetic buttons ---------- */
  (function () {
    if (reduced || !finePointer) return;
    $$('.btn--magnet').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = 'translate(' + (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + 'px,' + (((e.clientY - r.top) / r.height - 0.5) * 8).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  })();

  /* ---------- audit form ---------- */
  (function () {
    var form = $('#auditForm'), status = $('#formStatus'); if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.className = 'form__status'; status.textContent = '';
      var bad = $$('[required]', form).filter(function (el) { var ok = el.type === 'checkbox' ? el.checked : el.checkValidity() && el.value.trim() !== ''; el.classList.toggle('is-bad', !ok); return !ok; });
      if (bad.length) { status.className = 'form__status is-err'; status.textContent = 'Please complete the highlighted fields.'; bad[0].focus(); return; }
      var btn = $('button[type=submit]', form); btn.disabled = true; btn.textContent = 'Sending';
      fetch(form.getAttribute('action') || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
        .then(function (r) {
          if (!r.ok) throw new Error('bad status');
          form.reset(); status.className = 'form__status is-ok'; status.textContent = 'Thanks. Your audit request is in, and we will reply by email.';
        })
        .catch(function () { status.className = 'form__status is-err'; status.textContent = 'That did not send. Please check your connection and try again in a moment.'; })
        .finally(function () { btn.disabled = false; btn.textContent = 'Send my audit request'; });
    });
  })();
})();
