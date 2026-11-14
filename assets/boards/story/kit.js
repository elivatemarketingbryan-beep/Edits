// Story kit: a faceless jointed figure and the moves to act out a story (styles/REFERENCES.md, "Moonshot Motion").
// Elivate look: white figure on the Ink stage, purple structure, gold only on the goal or result.
//
// Contact: whenever the figure is on the ground, its height is solved, not guessed. The kit works out the lowest point of
// the body (feet, knees, hip, back, head) from the joint angles 60 times a second and sets the height so that point rests
// exactly on the surface under it. Those heights are baked into the timeline as keyframes, so it stays seek-safe.
// Jumps check their arc against the scene's surface, so the body clears every step edge.
// Facing right. Positive rotation swings a hanging limb backward (left).
const STORY = {
  css: `
  .sfig{position:absolute;left:0;top:0;width:0;height:0}
  .sfig .hips{position:absolute;left:0;top:-70px;width:0;height:0}
  .sfig .thigh{position:absolute;left:-7.5px;top:-7.5px;width:15px;height:51px;border-radius:8px;background:#fff;transform-origin:7.5px 7.5px}
  .sfig .shin{position:absolute;left:0;top:36px;width:15px;height:41.5px;border-radius:8px;background:#fff;transform-origin:7.5px 7.5px}
  .sfig .leg.R .thigh,.sfig .leg.R .shin,.sfig .arm.R .upper,.sfig .arm.R .fore{background:#cfc8e6}
  .sfig .torso{position:absolute;left:-13px;top:-64px;width:26px;height:70px;border-radius:13px;background:#fff;transform-origin:13px 64px}
  .sfig .head{position:absolute;left:-10px;top:-71px;width:46px;height:46px;border-radius:50%;background:#fff;transform-origin:23px 50px}
  .sfig .arm{position:absolute;left:7px;top:4px;width:0;height:0}
  .sfig .upper{position:absolute;left:0;top:0;width:12px;height:44px;border-radius:6px;background:#fff;transform-origin:6px 6px}
  .sfig .fore{position:absolute;left:0;top:32px;width:12px;height:40px;border-radius:6px;background:#fff;transform-origin:6px 6px}
  .sfig .dust{position:absolute;left:0;top:0}
  .sfig .mk{position:absolute;left:50%;width:0;height:0}
  .sfig .dust i{position:absolute;width:22px;height:22px;margin:-11px;border-radius:50%;background:rgba(196,181,253,.55);opacity:0}`,

  figure(id) {
    // .mk: invisible points at joint ends, used to measure contact (studio/story-contact.mjs)
    const leg = (s) => `<div class="leg ${s}"><div class="thigh"><b class="mk" data-r="7.5" style="top:43.5px"></b><div class="shin"><b class="mk" data-r="7.5" style="top:41.5px"></b></div></div></div>`;
    const arm = (s) => `<div class="arm ${s}"><div class="upper"><b class="mk" data-r="6" style="top:38px"></b><div class="fore"><b class="mk" data-r="6" style="top:40px"></b></div></div></div>`;
    return `<div id="${id}" class="sfig"><div class="dust"><i></i><i></i><i></i><i></i></div><div class="hips">${leg('R')}${leg('L')}
      <div class="torso"><b class="mk" data-r="13" style="top:64px"></b><b class="mk" data-r="13" style="top:6px"></b>${arm('R')}<div class="head"><b class="mk" data-r="23" style="top:23px"></b></div>${arm('L')}</div></div></div>`;
  },

  J: { tor: '.torso', head: '.head', thL: '.leg.L .thigh', shL: '.leg.L .shin', thR: '.leg.R .thigh', shR: '.leg.R .shin',
       uaL: '.arm.L .upper', faL: '.arm.L .fore', uaR: '.arm.R .upper', faR: '.arm.R .fore' },
  P: {
    stand:  { tor: 3, head: 0, thL: -5, shL: 5, thR: 5, shR: 3, uaL: 10, faL: -14, uaR: -8, faR: -16 },
    crouch: { tor: 22, head: -10, thL: -62, shL: 88, thR: -48, shR: 80, uaL: 58, faL: -24, uaR: 46, faR: -26 },
    launch: { tor: 5, head: 4, thL: 14, shL: 4, thR: 22, shR: 12, uaL: -152, faL: -8, uaR: -138, faR: -14 },
    tuck:   { tor: 10, head: 0, thL: -72, shL: 102, thR: -48, shR: 92, uaL: -64, faL: -48, uaR: -52, faR: -44 },
    reach:  { tor: 4, head: 0, thL: -24, shL: 26, thR: -6, shR: 30, uaL: -40, faL: -30, uaR: -30, faR: -34 },
    land:   { tor: 24, head: -12, thL: -58, shL: 84, thR: -46, shR: 78, uaL: -38, faL: -36, uaR: -28, faR: -40 },
    hit:    { tor: -32, head: -26, thL: -36, shL: 30, thR: 12, shR: 22, uaL: -168, faL: 24, uaR: 158, faR: -22 },
    flail:  { tor: -18, head: 16, thL: -80, shL: 40, thR: 30, shR: 60, uaL: -100, faL: -60, uaR: 120, faR: 50 },
    lie:    { tor: 0, head: 8, thL: -14, shL: 10, thR: 10, shR: 6, uaL: -20, faL: -10, uaR: 30, faR: 10 },
    sit:    { tor: 30, head: -6, thL: -84, shL: 92, thR: -70, shR: 96, uaL: 30, faL: -40, uaR: 20, faR: -50 },
    look:   { tor: -6, head: -22, thL: -5, shL: 5, thR: 5, shR: 3, uaL: 14, faL: -20, uaR: -4, faR: -18 },
    cheer:  { tor: -4, head: -14, thL: -8, shL: 6, thR: 8, shR: 4, uaL: -128, faL: -14, uaR: 128, faR: 14 },
  },

  // ---- body geometry (matches the CSS) ----
  // points relative to the hip, each with its radius: the outline that can touch the ground
  outline(p, r) {
    const s = Math.sin, c = Math.cos, d = Math.PI / 180;
    const down = (a) => [-s(a * d), c(a * d)], up = (a) => [s(a * d), -c(a * d)];
    const pts = [[0, 0, 7.5]];
    for (const k of ['L', 'R']) {
      const [ax, ay] = down(p['th' + k]), knee = [36 * ax, 36 * ay];
      const [bx, by] = down(p['th' + k] + p['sh' + k]), foot = [knee[0] + 34 * bx, knee[1] + 34 * by];
      pts.push([...knee, 7.5], [...foot, 7.5]);
    }
    const [ux, uy] = up(p.tor), chest = [58 * ux, 58 * uy], head = [112 * ux, 112 * uy];
    pts.push([...chest, 13], [...head, 23]);
    for (const k of ['L', 'R']) {
      const a = p.tor + p['ua' + k], [ex, ey] = down(a), elbow = [chest[0] + 32 * ex, chest[1] + 32 * ey];
      const [hx, hy] = down(a + p['fa' + k]), hand = [elbow[0] + 34 * hx, elbow[1] + 34 * hy];
      pts.push([...elbow, 6], [...hand, 6]);
    }
    const rr = r * d;   // the whole body turns about the hip
    return pts.map(([x, y, rad]) => [x * c(rr) - y * s(rr), x * s(rr) + y * c(rr), rad]);
  },
  // how far below the root line the lowest point of the body reaches
  lowest(p, r) { return Math.max(...STORY.outline(p, r).map(([, y, rad]) => y + rad)) - 70; },
  // the root y that rests the body's lowest point exactly on the surface at x
  rest(F, p, r, x) { return STORY.st[F].floor(x) - STORY.lowest(p, r); },

  st: {},
  init(tl, F, t, x, floor, pose = 'stand') {
    const p = { ...STORY.P[pose] };
    STORY.st[F] = { p, r: 0, x, floor };
    tl.set(F, { x, y: floor(x) - STORY.lowest(p, 0), rotation: 0, transformOrigin: '0px -70px' }, t);
    for (const [k, v] of Object.entries(p)) tl.set(`${F} ${STORY.J[k]}`, { rotation: v }, t);
  },

  // move limbs only (the body is in the air, or carried by another tween)
  limbs(tl, F, t, name, d = 0.2, ease = 'power2.out') {
    const to = { ...STORY.st[F].p, ...(typeof name === 'string' ? STORY.P[name] : name) };
    for (const [k, v] of Object.entries(to)) tl.to(`${F} ${STORY.J[k]}`, { rotation: v, duration: d, ease }, t);
    STORY.st[F].p = to;
  },

  // a grounded change of pose: limbs, turn and x tween together, and the height is solved every 1/60 s so the body stays on the surface
  pose(tl, F, t, name, d = 0.2, ease = 'power2.out', move = {}) {
    const st = STORY.st[F], from = { ...st.p }, to = { ...from, ...(typeof name === 'string' ? STORY.P[name] : name) };
    const r0 = st.r, r1 = move.r ?? r0, x0 = st.x, x1 = move.x ?? x0, E = gsap.parseEase(ease);
    const n = Math.max(2, Math.round(d * 60)), keys = [];
    for (let i = 1; i <= n; i++) {
      const e = E(i / n), q = {};
      for (const k in to) q[k] = from[k] + (to[k] - from[k]) * e;
      keys.push({ y: STORY.rest(F, q, r0 + (r1 - r0) * e, x0 + (x1 - x0) * e), duration: d / n, ease: 'none' });
    }
    tl.set(F, { y: STORY.rest(F, from, r0, x0) }, t);
    tl.to(F, { keyframes: keys }, t);
    if (x1 !== x0) tl.to(F, { x: x1, duration: d, ease }, t);
    if (r1 !== r0) tl.to(F, { rotation: r1, duration: d, ease, transformOrigin: '0px -70px' }, t);
    for (const [k, v] of Object.entries(to)) if (v !== from[k]) tl.to(`${F} ${STORY.J[k]}`, { rotation: v, duration: d, ease }, t);
    Object.assign(st, { p: to, r: r1, x: x1 });
  },

  dust(tl, F, t) {
    tl.fromTo(`${F} .dust i`, { x: 0, y: -6, scale: 0.3, opacity: 0.7 },
      { x: (i) => [-46, -22, 24, 48][i], y: (i) => [-14, -24, -22, -12][i], scale: 1.2, opacity: 0, duration: 0.45, ease: 'power2.out' }, t);
  },

  // a jump to x. It lands at the surface height there, and the arc is raised until the tucked body clears
  // every surface it passes over by 18 px.
  hop(tl, F, t, x, fromLand = false) {
    const st = STORY.st[F];
    let s = t;
    if (!fromLand) { STORY.pose(tl, F, s, 'crouch', 0.14, 'power2.out'); s += 0.14; }
    const x0 = st.x, y0 = STORY.rest(F, st.p, st.r, x0), y1 = STORY.rest(F, STORY.P.reach, 0, x);
    const tuckLow = STORY.lowest(STORY.P.tuck, 0), base = Math.min(y0, y1);
    let peak = base - 80;
    for (let i = 1; i < 20; i++) {
      const u = i / 20, xi = x0 + (x - x0) * u, need = st.floor(xi) - tuckLow - 18;   // the highest root y that still clears here
      const k = 4 * u * (1 - u);                                                      // share of the lift at this point of the arc
      const linear = y0 + (y1 - y0) * u;
      if (linear + (peak - base) * k > need) peak = base + (need - linear) / k;
    }
    STORY.limbs(tl, F, s, 'launch', 0.09, 'power3.out');
    const air = 0.44;
    tl.to(F, { x, duration: air, ease: 'none' }, s);
    tl.to(F, { y: peak, duration: air / 2, ease: 'power2.out' }, s);
    tl.to(F, { y: y1, duration: air / 2, ease: 'power2.in' }, s + air / 2);
    tl.to(`${F} .torso`, { scaleY: 1.07, duration: 0.09, ease: 'power2.out' }, s);
    STORY.limbs(tl, F, s + 0.1, 'tuck', 0.16, 'power2.out');
    STORY.limbs(tl, F, s + air - 0.12, 'reach', 0.1, 'power1.in');
    st.x = x;
    const land = s + air;   // touches down in the reach pose, then sinks into the landing with the height solved
    STORY.pose(tl, F, land, 'land', 0.09, 'power3.out');
    tl.to(`${F} .torso`, { scaleY: 0.9, duration: 0.07, ease: 'power3.out' }, land);
    tl.to(`${F} .torso`, { scaleY: 1, duration: 0.28, ease: 'back.out(2.2)' }, land + 0.08);
    STORY.dust(tl, F, land);
    return land;
  },
  settle(tl, F, t) { STORY.pose(tl, F, t, 'stand', 0.34, 'back.out(1.5)'); },

  // jumps to each x in turn; each landing is the next wind-up
  climb(tl, F, t, xs, gap = 0.1) {
    let land = STORY.hop(tl, F, t, xs[0]);
    for (let i = 1; i < xs.length; i++) land = STORY.hop(tl, F, land + gap, xs[i], true);
    STORY.settle(tl, F, land + 0.1);
    return land;
  },

  // knocked back to x: recoil, flail, land on its back on the surface, go loose, struggle up
  knockdown(tl, F, t, x, world) {
    const st = STORY.st[F];
    const x0 = st.x, y0 = STORY.rest(F, st.p, st.r, x0);
    STORY.limbs(tl, F, t, 'hit', 0.07, 'power4.out');
    tl.to(F, { x: x0 - 34, duration: 0.12, ease: 'power3.out' }, t);
    tl.to(F, { rotation: -22, duration: 0.12, ease: 'power3.out', transformOrigin: '0px -70px' }, t);
    STORY.limbs(tl, F, t + 0.12, 'flail', 0.18, 'sine.inOut');
    STORY.limbs(tl, F, t + 0.3, 'hit', 0.16, 'sine.inOut');
    STORY.limbs(tl, F, t + 0.46, 'flail', 0.16, 'sine.inOut');
    const fall = 0.62, xl = x + 40;
    const yl = STORY.rest(F, STORY.P.flail, -96, xl);      // the moment it touches down, on its back
    tl.to(F, { x: xl, duration: fall, ease: 'power1.out' }, t + 0.12);
    tl.to(F, { y: Math.min(y0, yl) - 60, duration: fall * 0.35, ease: 'power2.out' }, t + 0.12);
    tl.to(F, { y: yl, duration: fall * 0.65, ease: 'power2.in' }, t + 0.12 + fall * 0.35);
    tl.to(F, { rotation: -96, duration: fall, ease: 'power2.in', transformOrigin: '0px -70px' }, t + 0.12);
    Object.assign(st, { x: xl, r: -96 });
    const ground = t + 0.12 + fall;
    STORY.pose(tl, F, ground, 'lie', 0.22, 'power3.out', { r: -88 });   // limbs drop loose, height follows them
    STORY.dust(tl, F, ground);
    if (world) STORY.shake(tl, world, ground);
    const up = ground + 0.32;   // roll to sitting, to a crouch, to standing: always on the surface
    STORY.pose(tl, F, up, 'sit', 0.3, 'power2.inOut', { r: -30, x: x + 14 });
    STORY.pose(tl, F, up + 0.3, 'crouch', 0.26, 'power2.out', { r: 0, x });
    STORY.pose(tl, F, up + 0.56, 'stand', 0.34, 'back.out(1.6)');
    tl.to(`${F} .head`, { rotation: 10, duration: 0.12, yoyo: true, repeat: 3, ease: 'sine.inOut' }, up + 0.6);   // shakes it off
    return up + 0.78;
  },

  shake(tl, sel, t, a = 9) {
    tl.to(sel, { keyframes: [{ x: `+=${a}`, duration: 0.04 }, { x: `-=${a * 1.8}`, duration: 0.05 }, { x: `+=${a * 1.3}`, duration: 0.05 }, { x: `-=${a * 0.5}`, duration: 0.05 }], ease: 'none' }, t);
  },

  cheer(tl, F, t) {
    const st = STORY.st[F];
    STORY.pose(tl, F, t, 'crouch', 0.1, 'power2.out');
    const y0 = STORY.rest(F, st.p, st.r, st.x);
    STORY.limbs(tl, F, t + 0.1, 'cheer', 0.2, 'back.out(2)');
    const y1 = STORY.rest(F, st.p, st.r, st.x);
    tl.to(F, { y: y0 - 50, duration: 0.2, ease: 'power2.out' }, t + 0.1);
    tl.to(F, { y: y1, duration: 0.2, ease: 'power2.in' }, t + 0.3);
    STORY.pose(tl, F, t + 0.5, { thL: -58, shL: 84, thR: -46, shR: 78, tor: 10 }, 0.08, 'power3.out');
    STORY.pose(tl, F, t + 0.58, { thL: -8, shL: 6, thR: 8, shR: 4, tor: -4 }, 0.3, 'back.out(1.6)');
    STORY.dust(tl, F, t + 0.5);
  },

  // a flying label: speeds up, smears, and stops dead on contact
  fly(tl, sel, t, from, to, d = 0.42) {
    tl.fromTo(sel, { x: from[0], y: from[1], rotation: 0, opacity: 1, scaleX: 1 }, { x: to[0], y: to[1], duration: d, ease: 'power3.in' }, t);
    tl.fromTo(`${sel} .trail`, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 0.55, duration: d, ease: 'power3.in' }, t);
    tl.to(`${sel} .trail`, { opacity: 0, duration: 0.08 }, t + d);
    tl.to(sel, { scaleX: 0.82, duration: 0.05, yoyo: true, repeat: 1, ease: 'power2.out', transformOrigin: '0% 50%' }, t + d);
  },
  drop(tl, sel, t, to, spin = -160) {
    tl.to(sel, { x: to[0], duration: 0.6, ease: 'power1.out' }, t);
    tl.to(sel, { y: to[1], duration: 0.6, ease: 'power2.in' }, t);
    tl.to(sel, { rotation: spin, duration: 0.6, ease: 'power1.in' }, t);
    tl.to(sel, { opacity: 0, duration: 0.2 }, t + 0.42);
  },
  sparks(tl, sel, t) {
    tl.fromTo(`${sel} line`, { scale: 0.2, opacity: 1, transformOrigin: '0 0' }, { scale: 1.4, opacity: 0, duration: 0.32, ease: 'power3.out' }, t);
    tl.fromTo(sel, { opacity: 1 }, { opacity: 1, duration: 0.01 }, t);
  },

  line(tl, t, sel, prev) {
    if (prev) tl.to(prev, { autoAlpha: 0, y: -14, duration: 0.25, ease: 'power2.in' }, t - 0.3);
    tl.fromTo(sel, { autoAlpha: 0, y: 18, filter: 'blur(6px)' }, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power3.out' }, t);
  },
};
