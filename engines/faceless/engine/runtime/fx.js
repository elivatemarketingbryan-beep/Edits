/* Faceless engine motion runtime.
 * Loaded once by the root composition; every scene calls these helpers to add
 * tweens to its own paused timeline. All timings are measured from the
 * reference edit (see style/STYLE_BIBLE.md) and placed on the 30 fps frame grid.
 * No randomness, clocks or callbacks: every frame is a pure function of time. */
(function () {
  'use strict';
  var FPS = 30;
  var FX = (window.FX = {});
  gsap.registerPlugin(CustomEase);
  // House curves, fitted to the reference's per-frame measurements.
  CustomEase.create('hf-settle', '0.32,0.06,0,1');   // dark-scene zoom-out land (rmse 0.1 px)
  CustomEase.create('hf-push', '0.3,0,0,1');         // card-to-card push
  CustomEase.create('hf-cam', '0.2,0,0,1');          // camera moves inside a card: zoom, pan, scroll
  CustomEase.create('hf-cursor', '0.3,0.03,0.18,1'); // cursor glide

  FX.FPS = FPS;
  FX.T = function (f) { return f / FPS; };
  // Instant changes land half a frame early so they fire on frame f, not f+1.
  FX.S = function (f) { return Math.max(0, (f - 0.5) / FPS); };
  FX.snap = function (t) { return Math.round(t * FPS) / FPS; };

  function $(sel, root) { return typeof sel === 'string' ? (root || document).querySelector(sel) : sel; }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  FX.$ = $; FX.$$ = $$;

  // Rect of el relative to an ancestor, ignoring transforms (call before any tween runs).
  function rel(el, anc) {
    var x = 0, y = 0, n = el;
    while (n && n !== anc) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
    return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
  }
  FX.rel = rel;

  // Time at which an expo.out tween of length d reaches progress p (for piecewise sweeps).
  function expoAt(p, d) { p = Math.min(p, 0.999); return d * (-Math.log(1 - p) / Math.LN2) / 10; }

  /* ---------------- captions ---------------- */

  FX.word = function (tl, el, t, kind) {
    el = $(el);
    var f1 = 1 / FPS;
    switch (kind) {
      case 'accent':
        tl.fromTo(el, { opacity: 0, y: 7, x: -5, filter: 'blur(8px)' }, { opacity: 1, y: 0, x: 0, filter: 'blur(0px)', duration: 0.23, ease: 'power2.out' }, Math.max(0, t - f1));
        break;
      case 'stretch': // numbers, the promise verb, list heads: left edge pinned, width lands
        tl.fromTo(el, { opacity: 0.4, scaleX: 1.3, filter: 'blur(10px)', transformOrigin: '0% 50%' },
          { opacity: 1, scaleX: 1, filter: 'blur(0px)', duration: 0.24, ease: 'power3.out' }, Math.max(0, t - f1));
        break;
      case 'glitch':
        FX.glitch(tl, el, t);
        break;
      case 'ghost': // full-screen character layout: outline first, then fill
        tl.set(el, { opacity: 1 }, Math.max(0, t - 0.5 / FPS));
        tl.fromTo(el, { '--fill': 0, y: 3 }, { '--fill': 1, y: 0, duration: 0.1, ease: 'power2.out' }, t);
        break;
      case 'instant':
        tl.set(el, { opacity: 1 }, Math.max(0, t - 0.5 / FPS));
        break;
      case 'title': // the big name under a reveal card rises further
        tl.fromTo(el, { opacity: 0, y: 22, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.34, ease: 'expo.out' }, Math.max(0, t - f1));
        break;
      default: // .43/.65/.85/.93/.97/1 per frame, visible from the onset frame
        tl.fromTo(el, { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.19, ease: 'power3.out' }, Math.max(0, t - f1));
    }
  };

  // RGB-split slice glitch: 8 stepped frames, then clean. Opacity pattern measured on three words.
  // Per-frame values measured on the brand word (x1.5 for 1080 px).
  var GLITCH = [
    { o: 0.12, rgb: 0, sk: 0, dx: 0, s: [0, 0, 0], blur: 4 },
    { o: 1, rgb: 7, sk: 4, dx: 0, s: [-2, 8, -9] },
    { o: 0.78, rgb: 4, sk: -6, dx: 2, s: [-1, 7, -8] },
    { o: 0.25, rgb: 0, sk: 0, dx: 3, s: [3, 3, 3], blur: 3 },
    { o: 1, rgb: 0, sk: 3, dx: 0, s: [-10, -10, 6] },
    { o: 1, rgb: 0, sk: 1, dx: 3, s: [3, 3, 3] },
    { o: 1, rgb: 0, sk: 0, dx: 1, s: [0, 0, 0] },
    { o: 1, rgb: 0, sk: 0, dx: 0, s: [0, 0, 0] },
  ];
  FX.glitch = function (tl, el, t) {
    el = $(el);
    var f0 = Math.round(t * FPS) - 1;
    var slices = $$('.gl-s', el);
    GLITCH.forEach(function (g, i) {
      var at = FX.S(f0 + i);
      tl.set(el, {
        opacity: g.o, skewX: g.sk, x: g.dx,
        filter: g.blur ? 'blur(' + g.blur + 'px)' : 'blur(0px)',
        textShadow: g.rgb ? (-g.rgb) + 'px -2px rgba(70,130,235,.85), ' + g.rgb + 'px 3px rgba(225,110,120,.85)' : 'none',
      }, at);
      slices.forEach(function (s, k) { tl.set(s, { x: g.s[k] || 0, opacity: g.s[k] ? 1 : 0 }, at); });
    });
  };

  // Full-screen CTA lockup: setup verb stretches in, keyword flickers on, verb recedes.
  FX.ctaLockup = function (tl, verb, keyword, glow, t) {
    var f = Math.round(t * FPS);
    tl.set(verb, { opacity: 1 }, FX.S(f));
    tl.fromTo(verb, { scaleX: 1.17, transformOrigin: '30% 50%' }, { scaleX: 1, duration: 0.82, ease: 'circ.out' }, FX.S(f));
    var f0 = f + 9;
    tl.fromTo(keyword, { y: 20 }, { y: 0, duration: 0.2, ease: 'power2.out' }, FX.S(f0 + 1));
    // blurred ghost, ON + bloom, dim and blurred, ON, dim, ON, then a steady glow
    [[0.25, 6, 0.8], [1, 0, 1.55], [0.45, 4, 0.8], [1, 0, 1.1], [0.6, 0, 0.8], [1, 0, 1]].forEach(function (k, i) {
      tl.set(keyword, { opacity: k[0], filter: 'blur(' + k[1] + 'px) drop-shadow(0 3px 6px rgba(0,0,0,.45))' }, FX.S(f0 + i));
      if (glow) tl.set(glow, { opacity: Math.min(1, k[2] * 0.65) }, FX.S(f0 + i));
    });
    tl.to(verb, { opacity: 0.82, duration: 0.17, ease: 'none' }, FX.S(f0 + 1));
  };

  /* ---------------- headline + label box ---------------- */

  FX.headWord = function (tl, el, t) {
    tl.fromTo(el, { opacity: 0, filter: 'blur(9px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.39, ease: 'power2.out' }, t);
    tl.fromTo(el, { y: 44 }, { y: 0, duration: 0.36, ease: 'expo.out' }, t);
  };

  FX.boxWipe = function (tl, box, words, t, fast) {
    tl.fromTo(box, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: fast ? 0.3 : 0.72, ease: 'expo.out' }, t);
    words.forEach(function (w, i) {
      var at = t + (fast ? 0.13 : 0.14) + i * 0.1;
      tl.fromTo(w, { opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.27, ease: 'power3.out' }, at);
      tl.fromTo(w, { y: 33 }, { y: 0, duration: 0.34, ease: 'expo.out' }, at);
    });
  };

  /* ---------------- cards ---------------- */

  FX.cardIn = function (tl, el, t, from) {
    tl.fromTo(el, { opacity: 0, filter: 'blur(4px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.19, ease: 'sine.inOut' }, t);
    tl.fromTo(el, { scale: from || 0.905 }, { scale: 1, duration: 0.667, ease: 'power3.out' }, t + 0.04);
  };

  // Two light streaks orbiting the card border, clockwise, ~420 px/s, for the whole hold.
  // Two comets orbit every card border clockwise, one lap per 8.1 s whatever the card size.
  FX.beam = function (tl, rect, perimeter, t, dur, phase) {
    var L = 78, gap = perimeter / 2 - L, off = -(phase || 0) * perimeter;
    tl.set(rect, { strokeDasharray: L + ' ' + gap + ' ' + L + ' ' + gap }, 0);
    tl.fromTo(rect, { strokeDashoffset: off }, { strokeDashoffset: off - perimeter * dur / 8.1, duration: dur, ease: 'none' }, t);
  };

  // Whole-scene zoom-out land used by every dark/proof scene.
  FX.settle = function (tl, el, t) {
    tl.fromTo(el, { scale: 1.15 }, { scale: 1, duration: 1.183, ease: 'hf-settle' }, t);
    // motion blur while the move is fastest (+5..+11 frames)
    tl.fromTo(el, { filter: 'blur(0px)' }, { filter: 'blur(2.6px)', duration: 0.17, ease: 'power1.in' }, t + 0.1);
    tl.to(el, { filter: 'blur(0px)', duration: 0.2, ease: 'power1.out' }, t + 0.27);
  };

  // Horizontal carousel: outgoing and incoming cards move as one strip.
  // Card-to-card push: both cards ride one strip 106.5% of the frame apart.
  FX.swipe = function (tl, outEl, inEl, t, width) {
    var d = (width || 941) + 270;
    tl.fromTo(outEl, { x: 0 }, { x: -d, duration: 0.733, ease: 'hf-push' }, t);
    tl.fromTo(inEl, { x: d, opacity: 1 }, { x: 0, duration: 0.733, ease: 'hf-push' }, t);
    [outEl, inEl].forEach(function (e) {
      tl.fromTo(e, { filter: 'blur(0px)' }, { filter: 'blur(8px)', duration: 0.1, ease: 'power1.in' }, t + 0.07);
      tl.to(e, { filter: 'blur(0px)', duration: 0.2, ease: 'power2.out' }, t + 0.24);
    });
  };

  // Media swap inside a fixed frame: blur out, cut, blur in.
  FX.blurSwap = function (tl, a, b, t) {
    tl.to(a, { filter: 'blur(14px)', duration: 0.27, ease: 'power2.in' }, t - 0.27);
    tl.set(a, { opacity: 0 }, t);
    tl.fromTo(b, { opacity: 0 }, { opacity: 1, duration: 0.001 }, t);
    tl.fromTo(b, { filter: 'blur(14px)' }, { filter: 'blur(0px)', duration: 0.27, ease: 'power2.out' }, t);
  };

  // Accelerating drift + blur on the way out of a B-roll scene, before a hard cut.
  FX.exitDrift = function (tl, el, tEnd) {
    tl.to(el, { y: -90, duration: 0.77, ease: 'power3.in' }, tEnd - 0.77);
    tl.to(el, { filter: 'blur(12px)', duration: 0.17, ease: 'power2.in' }, tEnd - 0.17);
  };

  /* ---------------- in-card actions ---------------- */

  // Selection-blue sweep over a [[key|text]] span, word by word in reading order.
  FX.highlight = function (tl, span, t, dur) {
    var words = $$('.hlw', span);
    if (!words.length) words = [span];
    var lens = words.map(function (w) { return Math.max(1, w.textContent.length); });
    var total = lens.reduce(function (a, b) { return a + b; }, 0);
    dur = dur || Math.min(1.13, 0.4 + total * 0.0075);
    var acc = 0;
    words.forEach(function (w, i) {
      var a = acc / total, b = (acc + lens[i]) / total;
      acc += lens[i];
      var t0 = expoAt(a, dur), t1 = Math.max(t0 + 0.5 / FPS, expoAt(b, dur));
      tl.fromTo(w, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', duration: t1 - t0, ease: 'none' }, t + t0);
    });
  };

  // Rounded-rect ring that draws on clockwise around a target.
  FX.placeRing = function (ring, target, page, pad) {
    var r = rel(target, page); pad = pad == null ? 14 : pad;
    var w = r.w + pad * 2, h = r.h + pad * 2;
    ring.style.left = (r.x - pad) + 'px'; ring.style.top = (r.y - pad) + 'px';
    ring.style.width = w + 'px'; ring.style.height = h + 'px';
    ring.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var rr = ring.querySelector('rect');
    rr.setAttribute('width', w - 6); rr.setAttribute('height', h - 6);
    return 2 * (w + h);
  };
  FX.ring = function (tl, ring, target, page, t, out) {
    var len = FX.placeRing(ring, target, page);
    var rr = ring.querySelector('rect');
    tl.set(ring, { opacity: 1 }, t);
    tl.fromTo(rr, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.2, ease: 'power3.out' }, t);
    if (out) tl.to(ring, { opacity: 0, duration: 0.133, ease: 'none' }, out);
  };

  // macOS arrow glides to a target (with a slight arc) and optionally clicks.
  FX.cursorTo = function (tl, cur, target, page, t, opts) {
    opts = opts || {};
    var r = rel(target, page);
    var x = r.x + r.w * 0.62, y = r.y + r.h * 0.62;
    var d = opts.dur || 0.45;
    if (opts.first) {
      tl.fromTo(cur, { opacity: 0, x: x + 150, y: y + 168 }, { opacity: 1, duration: 0.13, ease: 'none' }, t);
      tl.to(cur, { x: x, y: y, duration: 0.56, ease: 'power4.out' }, t);
      d = 0.56;
    } else {
      // x and y on slightly different curves give the hand-drawn ~9% arc
      tl.to(cur, { x: x, duration: d, ease: 'hf-cursor' }, t);
      tl.to(cur, { y: y, duration: d, ease: 'power3.out' }, t);
    }
    if (opts.click) {
      tl.to(cur, { scale: 0.82, duration: 0.07, ease: 'power2.in' }, t + d - 0.02);
      tl.to(cur, { scale: 1, duration: 0.12, ease: 'power2.out' }, t + d + 0.05);
    }
    return t + d;
  };
  FX.cursorOut = function (tl, cur, t) { tl.to(cur, { opacity: 0, duration: 0.13, ease: 'none' }, t); };

  // Push into a target inside the page (window chrome stays put).
  FX.zoom = function (tl, page, target, viewport, t, scale) {
    var r = rel(target, page);
    var s = scale || 1.5;
    var vw = viewport.offsetWidth, vh = viewport.offsetHeight, pw = page.offsetWidth, ph = page.offsetHeight;
    var tx = vw / 2 - s * (r.x + r.w / 2), ty = vh * 0.42 - s * (r.y + r.h / 2);
    tx = Math.min(0, Math.max(vw - s * pw, tx));
    ty = Math.min(0, Math.max(Math.min(0, vh - s * ph), ty));
    tl.fromTo(page, { x: 0, y: 0, scale: 1, transformOrigin: '0px 0px' }, { x: tx, y: ty, scale: s, duration: 1.13, ease: 'hf-cam' }, t);
    tl.fromTo(page, { filter: 'blur(0px)' }, { filter: 'blur(3px)', duration: 0.08 }, t);
    tl.to(page, { filter: 'blur(0px)', duration: 0.2, ease: 'power2.out' }, t + 0.08);
  };

  FX.scroll = function (tl, page, t, by, current) {
    var y0 = current || 0;
    tl.fromTo(page, { y: y0 }, { y: y0 - by, duration: 0.93, ease: 'hf-cam' }, t);
    tl.fromTo(page, { filter: 'blur(0px)' }, { filter: 'blur(4px)', duration: 0.1, ease: 'power1.in' }, t);
    tl.to(page, { filter: 'blur(0px)', duration: 0.5, ease: 'power2.out' }, t + 0.1);
    return y0 - by;
  };

  // Number callout: launches from a source spot, odometer-rolls to the value, holds, exits.
  FX.counter = function (tl, pill, t, tOut, from) {
    var cols = $$('.odo-col', pill);
    var bg = pill.querySelector('.pop-bg');
    tl.set(pill, { opacity: 1 }, t);
    tl.fromTo(pill, { scale: 0.25, x: from ? from.dx : 0, y: from ? from.dy : -280 }, { scale: 1, x: 0, y: 0, duration: 0.85, ease: 'power4.out' }, t);
    if (bg) tl.fromTo(bg, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' }, t + 0.23);
    cols.forEach(function (c, i) {
      var target = Number(c.getAttribute('data-digit'));
      var spins = Number(c.getAttribute('data-spins') || 0);
      var h = c.firstElementChild.offsetHeight || 1;
      tl.fromTo(c, { y: 0 }, { y: -(spins * 10 + target) * h, duration: 0.43 + i * 0.03, ease: 'power3.out' }, t);
      tl.fromTo(c, { filter: 'blur(4px)' }, { filter: 'blur(0px)', duration: 0.4 + i * 0.03, ease: 'power2.in' }, t);
    });
    if (tOut) {
      tl.to(pill, { y: -9, duration: 0.07, ease: 'none' }, tOut + 0.07);
      tl.to(pill, { opacity: 0, duration: 0.233, ease: 'none' }, tOut);
    }
  };

  // Types the target's text out character by character (split once, at build time).
  FX.typeText = function (tl, el, t, dur) {
    if (!el.querySelector('.tc')) {
      var text = el.textContent; el.textContent = '';
      for (var i = 0; i < text.length; i++) { var c = document.createElement('span'); c.className = 'tc'; c.style.opacity = '0'; c.textContent = text[i]; el.appendChild(c); }
    }
    var chars = $$('.tc', el);
    dur = dur || Math.min(1.6, chars.length * 0.045);
    chars.forEach(function (c, i) { tl.set(c, { opacity: 1 }, t + (dur * i) / chars.length); });
  };

  // Measure only after fonts and images have laid out, then build and register.
  FX.ready = function (root, fn) {
    var imgs = $$('img', root).map(function (im) {
      return im.complete ? Promise.resolve() : new Promise(function (res) { im.addEventListener('load', res); im.addEventListener('error', res); });
    });
    var fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    return Promise.all([fonts].concat(imgs)).then(fn);
  };

  FX.fadeIn = function (tl, el, t, d) {
    tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: d || 0.1, ease: 'none' }, t);
  };

  /* ---------------- ambience ---------------- */

  // The dot grid creeps upward by about one cell per scene: barely noticed, never static.
  FX.drift = function (tl, el, t, dur) {
    if (!el) return;
    tl.fromTo(el, { backgroundPosition: '0px 0px' }, { backgroundPosition: '0px ' + (-Math.min(36, dur * 9)).toFixed(1) + 'px', duration: dur, ease: 'none' }, t);
  };
})();
