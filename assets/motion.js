/* Scroll motion for Loomline, built on GSAP + ScrollTrigger + SplitText.
   Content is visible by default; every effect is added only when motion is allowed. */
(function () {
  'use strict';
  var video = document.getElementById('reelVideo');
  var soundBtn = document.getElementById('reelSound');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- reel playback (works with or without GSAP) ---------- */
  if (video) {
    if (reduce) {
      // no autoplay for reduced motion: show the poster and native controls
      video.controls = true; video.removeAttribute('loop');
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () { video.controls = true; }); }
          else video.pause();
        });
      }, { threshold: 0.35 }).observe(video);
    }
    if (soundBtn) soundBtn.addEventListener('click', function () {
      var on = video.muted;
      video.muted = !on;
      if (on && video.paused) video.play();
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.textContent = on ? 'Turn sound off' : 'Turn sound on';
    });
  }

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, window.SplitText);

  var EASE_OUT = 'power3.out';
  var mm = gsap.matchMedia();

  mm.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 900px)' }, function (ctx) {
    if (!ctx.conditions.motion) return;
    var desktop = ctx.conditions.desktop;

    /* section headings: lines rise from behind a mask, once, then the split is reverted */
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function () {
      if (!window.SplitText) return;
      gsap.utils.toArray('[data-reveal]').forEach(function (h) {
        var split = new SplitText(h, { type: 'lines', linesClass: 'split-line', mask: 'lines' });
        gsap.from(split.lines, {
          yPercent: 105, duration: 0.9, ease: 'power4.out', stagger: 0.1,
          scrollTrigger: { trigger: h, start: 'top 85%', end: 'top 40%', toggleActions: 'play none none none' },
          onComplete: function () { split.revert(); }
        });
      });
      ScrollTrigger.refresh();
    });

    /* offer rows, steps and promises: one batch each, staggered */
    [['.row', 40], ['.steps li', 36], ['.ticks li', 18], ['.acc details', 16]].forEach(function (cfg) {
      gsap.set(cfg[0], { opacity: 0, y: cfg[1] });
      var show = function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.09, overwrite: true }); };
      // onLeave/onEnterBack cover jumping past a section with a nav link, so nothing stays hidden
      ScrollTrigger.batch(cfg[0], { start: 'top 88%', once: true, onEnter: show, onLeave: show, onEnterBack: show });
    });

    /* process step numbers count up as the row enters */
    gsap.utils.toArray('.steps__n').forEach(function (n) {
      var target = parseInt(n.textContent, 10) || 1, o = { v: 0 };
      gsap.to(o, { v: target, duration: 0.8, ease: 'power2.out', snap: { v: 1 },
        onUpdate: function () { n.textContent = String(Math.max(1, Math.round(o.v))); },
        scrollTrigger: { trigger: n, start: 'top 88%', end: 'top 60%', toggleActions: 'play none none none' } });
    });

    /* the reel: phone tilts back and settles flat as you scroll in */
    var phone = document.getElementById('reelPhone');
    if (phone) {
      if (desktop) {
        gsap.fromTo(phone, { rotateX: 22, rotateY: -14, scale: 0.84, y: 60 }, {
          rotateX: 0, rotateY: 0, scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: '#reel', start: 'top top', end: '+=700', scrub: 1, pin: true, anticipatePin: 1 }
        });
        gsap.from('.reel__copy > *', { opacity: 0, x: -30, duration: 0.8, ease: EASE_OUT, stagger: 0.12,
          scrollTrigger: { trigger: '#reel', start: 'top 70%', end: 'top 30%', toggleActions: 'play none none none' } });
      } else {
        gsap.fromTo(phone, { rotateX: 16, scale: 0.9 }, { rotateX: 0, scale: 1, ease: 'none',
          scrollTrigger: { trigger: phone, start: 'top 95%', end: 'top 35%', scrub: 1 } });
      }
    }

    /* concept demos: gentle parallax at different depths (desktop only) */
    if (desktop) {
      gsap.utils.toArray('.frame').forEach(function (f, i) {
        gsap.fromTo(f, { y: 40 + i * 30 }, { y: -20 - i * 20, ease: 'none',
          scrollTrigger: { trigger: '.frames', start: 'top bottom', end: 'bottom top', scrub: 1 } });
      });
    }

    /* contact form lifts in */
    gsap.from('.form', { y: 50, opacity: 0, duration: 0.9, ease: EASE_OUT,
      scrollTrigger: { trigger: '.contact', start: 'top 75%', end: 'top 40%', toggleActions: 'play none none none' } });
  });

  /* pins add scroll height, so redraw the page thread after every refresh */
  ScrollTrigger.addEventListener('refresh', function () { if (window.__threadLayout) window.__threadLayout(); });
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
