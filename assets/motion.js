/* Loomline motion layer: Lenis smooth scroll + GSAP (ScrollTrigger, SplitText).
   Content is readable without this file. Every effect runs only when motion is allowed. */
(function () {
  'use strict';
  var root = document.documentElement;
  var video = document.getElementById('reelVideo');
  var soundBtn = document.getElementById('reelSound');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var showHero = function () { var t = document.querySelector('.hero__title'); if (t) t.style.visibility = 'visible'; };

  /* ---------- reel playback (independent of GSAP) ---------- */
  if (video) {
    if (reduce) { video.controls = true; video.removeAttribute('loop'); }
    else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () { video.controls = true; }); }
          else video.pause();
        });
      }, { threshold: 0.35 }).observe(video);
    }
    if (soundBtn) soundBtn.addEventListener('click', function () {
      var on = video.muted; video.muted = !on; if (on && video.paused) video.play();
      soundBtn.setAttribute('aria-pressed', String(on)); soundBtn.textContent = on ? 'Turn sound off' : 'Turn sound on';
    });
  }

  if (!window.gsap || !window.ScrollTrigger || reduce) { showHero(); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);

  var EASE = 'power3.out', EASE_STRONG = 'power4.out';
  var q = function (s, c) { return (c || document).querySelector(s); };
  var qa = function (s, c) { return gsap.utils.toArray(s, c); };
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  /* ---------- smooth scroll ---------- */
  var lenis = null;
  if (window.Lenis && finePointer) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, anchors: { offset: -72 } });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- hero: characters rise in, then the hero drifts away as you scroll ---------- */
  fontsReady.then(function () {
    var spans = qa('.hero__line > span');
    if (!window.SplitText || !spans.length) { showHero(); return; }
    var splits = spans.map(function (s) { return new SplitText(s, { type: 'words,chars' }); });
    var chars = splits.reduce(function (a, s) { return a.concat(s.chars); }, []);
    gsap.set('.hero__title', { visibility: 'visible' });
    gsap.from(chars, {
      yPercent: 115, rotate: 7, opacity: 0, duration: 1.05, ease: EASE_STRONG,
      stagger: { each: 0.022, from: 'start' }, delay: 0.25,
      onComplete: function () { splits.forEach(function (s) { s.revert(); }); }
    });
  });
  gsap.to('.hero__inner', { yPercent: -18, scale: 0.94, opacity: 0, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('#weave', { yPercent: 22, ease: 'none',
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  var mm = gsap.matchMedia();
  mm.add({ desktop: '(min-width: 900px)', mobile: '(max-width: 899px)' }, function (ctx) {
    var desktop = ctx.conditions.desktop;

    /* section headings: words rise from behind a line mask */
    fontsReady.then(function () {
      if (!window.SplitText) return;
      qa('[data-reveal]').forEach(function (h) {
        var split = new SplitText(h, { type: 'lines,words', mask: 'lines' });
        gsap.from(split.words, {
          yPercent: 110, rotate: 4, duration: 0.95, ease: EASE_STRONG, stagger: 0.045,
          scrollTrigger: { trigger: h, start: 'top 86%', end: 'top 40%', toggleActions: 'play none none none' },
          onComplete: function () { split.revert(); }
        });
      });

      /* manifesto: each word lights up as it passes through the viewport */
      var m = q('[data-scrub-words]');
      if (m) {
        var ms = new SplitText(m, { type: 'words' });
        gsap.fromTo(ms.words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.12,
          scrollTrigger: { trigger: m, start: 'top 78%', end: 'bottom 42%', scrub: true } });
      }
      ScrollTrigger.refresh();
    });

    /* reel: phone tilts back and settles flat while pinned */
    var phone = q('#reelPhone');
    if (phone) {
      if (desktop) {
        gsap.fromTo(phone, { rotateX: 24, rotateY: -16, scale: 0.82, y: 70 }, { rotateX: 0, rotateY: 0, scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: '#reel', start: 'top top', end: '+=700', scrub: 1, pin: true, anticipatePin: 1 } });
        gsap.from('.reel__copy > *', { opacity: 0, x: -36, duration: 0.8, ease: EASE, stagger: 0.12,
          scrollTrigger: { trigger: '#reel', start: 'top 70%', toggleActions: 'play none none none' } });
      } else {
        gsap.fromTo(phone, { rotateX: 16, scale: 0.9 }, { rotateX: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: phone, start: 'top 95%', end: 'top 35%', scrub: 1 } });
      }
    }

    /* services: horizontal pinned scroll on desktop, stacked reveals on mobile; line art draws itself */
    var vp = q('.panels-viewport'), track = q('.panels'), panels = qa('.panel');
    panels.forEach(function (p) { gsap.set(qa('.draw', p), { strokeDasharray: 1, strokeDashoffset: 1 }); });
    var draw = function (p) { gsap.to(qa('.draw', p), { strokeDashoffset: 0, duration: 1.3, ease: 'power2.inOut', stagger: 0.07, overwrite: true }); };
    if (desktop && vp && track) {
      vp.classList.add('is-horizontal');
      var distance = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var slide = gsap.to(track, { x: function () { return -distance(); }, ease: 'none',
        scrollTrigger: { trigger: vp, start: 'top top', end: function () { return '+=' + distance(); }, pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true } });
      ScrollTrigger.create({ trigger: vp, start: 'top 60%', once: true, onEnter: function () { draw(panels[0]); } });
      panels.slice(1).forEach(function (p) {
        ScrollTrigger.create({ trigger: p, containerAnimation: slide, start: 'left 70%', once: true, onEnter: function () { draw(p); } });
      });
      ctx.add(function () { return function () { vp.classList.remove('is-horizontal'); gsap.set(track, { clearProps: 'transform' }); }; });
    } else {
      panels.forEach(function (p) {
        gsap.from(p, { y: 50, opacity: 0, duration: 0.8, ease: EASE,
          scrollTrigger: { trigger: p, start: 'top 85%', once: true, onEnter: function () { draw(p); } } });
      });
    }

    /* concept demos: cards swing in, screens wipe open, then drift at different depths */
    gsap.from('.frame', { rotateY: desktop ? 22 : 0, rotateX: 8, y: 90, opacity: 0, duration: 1.1, ease: EASE_STRONG, stagger: 0.14,
      scrollTrigger: { trigger: '.frames', start: 'top 82%', toggleActions: 'play none none none' } });
    gsap.from('.frame__screen', { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'power3.inOut', stagger: 0.14, delay: 0.25,
      scrollTrigger: { trigger: '.frames', start: 'top 82%', toggleActions: 'play none none none' } });
    if (desktop) {
      qa('.frame').forEach(function (f, i) {
        gsap.fromTo(f, { yPercent: 6 + i * 4 }, { yPercent: -4 - i * 3, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: '.frames', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
    }

    /* lists: batched staggers; covers jumping past with a nav link */
    [['.steps li', 40], ['.ticks li', 20], ['.acc details', 18]].forEach(function (cfg) {
      gsap.set(cfg[0], { opacity: 0, y: cfg[1] });
      var show = function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.75, ease: EASE, stagger: 0.09, overwrite: true }); };
      ScrollTrigger.batch(cfg[0], { start: 'top 88%', once: true, onEnter: show, onLeave: show, onEnterBack: show });
    });

    /* process: a teal thread draws across the steps and lights each number */
    var rail = q('.steps__rail span'), steps = qa('.steps li');
    if (rail && window.innerWidth >= 1000) {
      var lit = function (p) { steps.forEach(function (li, i) { li.classList.toggle('is-lit', p >= (i + 0.15) / steps.length); }); };
      gsap.to(rail, { scaleX: 1, ease: 'none',
        scrollTrigger: { trigger: '.steps-wrap', start: 'top 72%', end: 'top 30%', scrub: 1, onUpdate: function (self) { lit(self.progress); } } });
    } else {
      steps.forEach(function (li) { ScrollTrigger.create({ trigger: li, start: 'top 75%', once: true, onEnter: function () { li.classList.add('is-lit'); } }); });
    }

    /* contact: the light section opens as a growing circle */
    gsap.fromTo('.contact', { clipPath: 'circle(8% at 50% 0%)' }, { clipPath: 'circle(150% at 50% 0%)', ease: 'none',
      scrollTrigger: { trigger: '.contact', start: 'top bottom', end: 'top 20%', scrub: true } });
    gsap.from('.form', { y: 60, opacity: 0, duration: 0.9, ease: EASE,
      scrollTrigger: { trigger: '.contact', start: 'top 55%', toggleActions: 'play none none none' } });
  });

  /* ---------- marquee: always moving, speeds up and flips with scroll velocity ---------- */
  var mtrack = q('.marquee__track');
  if (mtrack) {
    var loop = gsap.to(mtrack, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });
    ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top',
      onUpdate: function (self) {
        var speed = Math.min(6, 1 + Math.abs(self.getVelocity()) / 250);
        gsap.to(loop, { timeScale: self.direction * speed, duration: 0.2, overwrite: true });
        gsap.to(loop, { timeScale: self.direction, duration: 1.1, delay: 0.25, ease: 'power2.out', overwrite: false });
      } });
  }

  /* ---------- cursor ring ---------- */
  if (finePointer) {
    var ring = document.createElement('div'); ring.className = 'cursor'; ring.setAttribute('aria-hidden', 'true'); document.body.appendChild(ring);
    var xTo = gsap.quickTo(ring, 'x', { duration: 0.35, ease: 'power3.out' });
    var yTo = gsap.quickTo(ring, 'y', { duration: 0.35, ease: 'power3.out' });
    var sTo = gsap.quickTo(ring, 'scale', { duration: 0.3, ease: 'power3.out' });
    window.addEventListener('pointermove', function (e) { xTo(e.clientX); yTo(e.clientY); ring.classList.add('is-on'); }, { passive: true });
    document.addEventListener('pointerleave', function () { ring.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var hit = e.target.closest && e.target.closest('a, button, summary, .chip, .frame, input, textarea');
      ring.classList.toggle('is-link', !!hit); sTo(hit ? 1.7 : 1);
    });
  }

  /* pins change page height: redraw the left-hand thread after each refresh */
  ScrollTrigger.addEventListener('refresh', function () { if (window.__threadLayout) window.__threadLayout(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
