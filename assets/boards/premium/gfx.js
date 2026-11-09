// Shared motion helpers (STYLE-GUIDE motion rules: ease-out entrances ~0.6s, ~0.25s blur-out exits,
// staggers in frames). Every graphic sets T0 = its start on the output timeline and passes absolute
// output seconds, so times read straight off the transcript.
const F = 1 / 30;
function gfx(id, T0, dur) {
  const tl = gsap.timeline({ paused: true });
  const at = (t) => Math.max(0, t - T0);
  const api = {
    tl, at, dur,
    // card or element rises in
    in(sel, t, o = {}) { tl.fromTo(sel, { autoAlpha: 0, y: o.y ?? 28, scale: o.scale ?? 0.98, filter: "blur(8px)" },
      { autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", duration: o.d ?? 0.6, ease: "power3.out", stagger: o.stagger ?? 0 }, at(t)); return api; },
    // everything leaves fast with a blur
    out(sel, t, o = {}) { tl.to(sel, { autoAlpha: 0, y: o.y ?? -12, filter: "blur(10px)", duration: o.d ?? 0.25, ease: "power2.in" }, at(t)); return api; },
    // list row lights up (check / number fills accent)
    light(sel, t, color = "#8b5cf6") {
      tl.fromTo(`${sel} .dot`, { backgroundColor: "rgba(0,0,0,0)", borderColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0)", scale: 0.8 },
        { backgroundColor: color, borderColor: color, color: "#ffffff", scale: 1, duration: 0.22, ease: "back.out(2)" }, at(t));
      tl.fromTo(`${sel} .txt`, { opacity: 0.5 }, { opacity: 1, duration: 0.2 }, at(t)); return api; },
    // full-screen stage enters with a purple panel sweep, leaves the same way
    stageIn(t) { tl.set(".wipe", { xPercent: -100 }, 0); tl.fromTo(".wipe", { xPercent: -100 }, { xPercent: 0, duration: 0.32, ease: "power3.in" }, at(t));
      tl.set(".stage", { autoAlpha: 1 }, at(t) + 0.32);
      tl.to(".wipe", { xPercent: 100, duration: 0.36, ease: "power3.out" }, at(t) + 0.34); return api; },
    stageOut(t) { tl.fromTo(".wipe", { xPercent: -100 }, { xPercent: 0, duration: 0.3, ease: "power3.in", immediateRender: false }, at(t));
      tl.set(".stage", { autoAlpha: 0 }, at(t) + 0.3);
      tl.to(".wipe", { xPercent: 100, duration: 0.34, ease: "power3.out" }, at(t) + 0.32); return api; },
    count(sel, from, to, t, d, fmt = (v) => Math.round(v)) {
      const o = { v: from }, el = document.querySelector(sel);
      el.textContent = fmt(from);
      tl.to(o, { v: to, duration: d, ease: "power2.out", onUpdate: () => (el.textContent = fmt(o.v)) }, at(t)); return api; },
    done() { window.__timelines[id] = tl; },
  };
  return api;
}
