#!/usr/bin/env python3
"""SFX library helper for AI video editors. Python 3 standard library only.

  python3 sfx.py moments
  python3 sfx.py find --moment cut [--n 3] [--seed VIDEO] [--history FILE] [--tone premium_tech] [--length-s 2] [--allow-credit] [--any-tier]
  python3 sfx.py find --category whooshes --use cut ...
  python3 sfx.py place SFX-0123 --at 12.4
  python3 sfx.py credits SFX-0123 SFX-0456
  python3 sfx.py record SFX-0123 SFX-0456 --history FILE [--video NAME]
  python3 sfx.py show SFX-0123

Output is JSON. Paths are absolute so the editor can use them directly.
"""
import argparse, json, os, random, sys, hashlib

HERE = os.path.dirname(os.path.abspath(__file__))

# moment -> categories searched in order, use cases that fit, duration window (ms), tones in order of preference
MOMENTS = {
    "cut":               dict(when="Hard cut, B-roll insert, new section", categories=["whooshes", "ui-motion", "reverses"], uses=["cut", "scene_transition"], max_ms=1500),
    "punch_in":          dict(when="Digital zoom / punch-in or zoom-out", categories=["whooshes", "reverses", "impacts"], uses=["punch_in", "zoom_out", "cut"], max_ms=1500),
    "whip_pan":          dict(when="Whip pan or fast swipe transition", categories=["whooshes", "ui-motion"], uses=["whip_pan", "cut", "scene_transition"], max_ms=1200),
    "glitch_transition": dict(when="Glitch / screen-tear transition, pattern interrupt", categories=["glitches"], uses=["glitch_transition", "pattern_interrupt"], max_ms=1500),
    "text_appear":       dict(when="Text, caption keyword, sticker or icon appears", categories=["pops-blips", "ui-clicks"], uses=["text_appear", "caption_emphasis", "sticker_slap"], max_ms=700),
    "list_item":         dict(when="Bullet points or list items stack in", categories=["pops-blips", "ui-clicks"], uses=["list_item", "text_appear"], max_ms=600),
    "stat_land":         dict(when="A stat or result lands on screen", categories=["notifications", "impacts", "pops-blips"], uses=["stat_land", "key_point", "success"], max_ms=2500, avoid_uses=["error", "warning", "error_screen"]),
    "number_count":      dict(when="Number counting up, % rolling (tick trains allowed)", categories=["counters-timers", "ui-clicks", "data-hud"], uses=["number_count", "countdown", "data_viz"]),
    "reveal_build":      dict(when="Build into a reveal (use --length-s for the build length)", categories=["risers", "reverses"], uses=["reveal", "hook_open", "beat_drop"]),
    "reveal_hit":        dict(when="The reveal / payoff lands", categories=["impacts", "stingers"], uses=["reveal", "key_point", "hook_open", "beat_drop"], max_ms=4000),
    "hook_hit":          dict(when="Hook first frame, the big statement", categories=["impacts", "stingers"], uses=["hook_open", "key_point", "beat_drop"], max_ms=4000),
    "screen_click":      dict(when="Cursor click or tap in a screen recording", categories=["ui-clicks"], uses=["screen_click", "button_press", "toggle"], max_ms=500, avoid_uses=["error", "warning", "error_screen"]),
    "typing":            dict(when="Typing a prompt, search or code (use --length-s)", categories=["typing"], uses=["typing"], max_ms=4500),
    "prompt_submit":     dict(when="Enter / submit after typing", categories=["typing", "ui-clicks"], uses=["prompt_submit", "button_press"], max_ms=400),
    "ai_processing":     dict(when="AI thinking, agent working, progress bar (loopable beds)", categories=["data-hud"], uses=["ai_processing", "loading_loop", "data_viz", "hud_overlay", "scan"]),
    "success":           dict(when="It worked, task complete, result appears", categories=["notifications"], uses=["success"], max_ms=2500, strict=True, avoid_uses=["error", "warning", "error_screen"]),
    "notification":      dict(when="New DM, email or sale notification pops", categories=["phone-device", "notifications"], uses=["notification", "success"], max_ms=2500, strict=True, avoid_uses=["error", "warning", "error_screen"]),
    "error":             dict(when="Error, denied, something broke", categories=["notifications", "glitches"], uses=["error", "warning", "error_screen"], max_ms=2500, strict=True, avoid_uses=["success"]),
    "screenshot":        dict(when="Screenshot, freeze-frame, snapshot card", categories=["camera"], uses=["screenshot", "photo_snap"], max_ms=2000),
    "phone_swipe":       dict(when="Phone mockup swipe, scroll, unlock", categories=["phone-device", "ui-motion"], uses=["phone_swipe", "scroll", "slide_in"], max_ms=1500),
    "slide_in":          dict(when="Panel, card or window slides in or out", categories=["ui-motion"], uses=["slide_in", "panel_open", "panel_close", "drag_drop"], max_ms=1500),
    "money":             dict(when="Revenue, pricing, money saved", categories=["money", "notifications"], uses=["money", "success"], max_ms=2500, strict=True, avoid_uses=["error", "warning", "error_screen"]),
    "logo_cta":          dict(when="Logo, title card, section header, end-card CTA", categories=["stingers", "impacts", "shimmers", "notifications"], uses=["logo_reveal", "title_card", "outro_cta", "section_header", "reveal"], max_ms=4000, avoid_uses=["error", "warning", "error_screen"]),
    "highlight_sweep":   dict(when="Highlighter or light sweep across text", categories=["shimmers", "ui-motion"], uses=["highlight_sweep", "reveal", "slide_in"], max_ms=2500),
    "tension_bed":       dict(when="Low tension or tech ambience under voice (loopable)", categories=["drones-beds", "data-hud"], uses=["tension_bed", "ambience_bed", "loading_loop"]),
    "power_up":          dict(when="Power up, unlock, upgrade, transformation", categories=["scifi-energy", "risers"], uses=["power_up", "transformation"]),
    "power_down":        dict(when="Power down, ending, wind down", categories=["scifi-energy", "reverses"], uses=["power_down"]),
}
TONE_ORDER = ["premium_tech", "neutral", "cinematic", "organic", "playful", "retro_game"]


def load():
    with open(os.path.join(HERE, "index.json")) as f:
        return json.load(f)


def out(obj):
    print(json.dumps(obj, indent=1, ensure_ascii=False))


def read_history(path):
    if not path or not os.path.exists(path): return []
    try:
        with open(path) as f: return json.load(f)
    except Exception:
        return []


def related(s, by_id):
    ids = {s["id"]}
    for k in ("duplicate_of", "dry_wet_of", "derived_from"):
        if s.get(k): ids.add(s[k])
    return ids


def find(args):
    idx = load(); S = idx["sounds"]; by_id = {s["id"]: s for s in S}
    if args.moment:
        if args.moment not in MOMENTS:
            out(dict(error=f"unknown moment '{args.moment}'", moments=sorted(MOMENTS))); return 2
        m = MOMENTS[args.moment]
        cats, uses, max_ms = m["categories"], m["uses"], m.get("max_ms")
    else:
        cats = [args.category] if args.category else sorted({s["category"] for s in S})
        uses, max_ms = ([args.use] if args.use else []), None
    if args.max_ms: max_ms = args.max_ms
    hist = read_history(args.history)
    used = set(); fam_count = {}
    for h in hist[-60:]:
        s = by_id.get(h.get("id"))
        if s:
            used |= related(s, by_id)
            fam_count[s["variant_family"]] = fam_count.get(s["variant_family"], 0) + 1
    avoid = set(args.avoid.split(",")) if args.avoid else set()
    tone_pref = [args.tone] + [t for t in TONE_ORDER if t != args.tone] if args.tone else TONE_ORDER
    bad_uses = set(MOMENTS[args.moment].get("avoid_uses", [])) if args.moment else set()
    cands = []
    for rank, cat in enumerate(cats):
        pool_c = []
        for s in S:
            if s["category"] != cat: continue
            if s["attribution_required"] and not args.allow_credit: continue
            if not args.any_tier and s["tier"] != "core": continue
            if s.get("duplicate_of"): continue
            if s["id"] in used or s["id"] in avoid: continue
            if max_ms and s["duration_ms"] > max_ms and not s["loopable"]: continue
            if bad_uses & set(s["use_cases"]): continue
            pool_c.append(s)
        # inside a category, only sounds tagged for this moment count when any exist
        if uses:
            matched = [s for s in pool_c if any(u in s["use_cases"] for u in uses)]
            pool_c = matched if matched else ([] if args.moment and MOMENTS[args.moment].get("strict") else pool_c)
        if args.length_s:
            t = args.length_s * 1000
            near = [s for s in pool_c if 0.6 * t <= s["duration_ms"] <= 1.4 * t]
            if near: pool_c = near
        for s in pool_c:
            score = 10 - rank * 4
            if uses and not any(u in s["use_cases"] for u in uses): score -= 4
            score += max(0, 3 - tone_pref.index(s["tone_palette"])) if s["tone_palette"] in tone_pref else 0
            score += (s.get("quality") or 3) - 3
            if args.length_s:
                target = args.length_s * 1000
                score -= min(6, abs(s["duration_ms"] - target) / max(target, 1) * 6)
            if args.intensity: score -= abs((s.get("intensity") or 3) - args.intensity)
            score -= 2 * fam_count.get(s["variant_family"], 0)
            if args.moment in ("ai_processing", "tension_bed") and s["loopable"]: score += 2
            cands.append((score, s))
    if not cands and not args.any_tier:
        args.any_tier = True
        return find(args)
    if not cands:
        out(dict(moment=args.moment, no_match=True, advice="No fitting sound in this library. Leave this moment silent; do not synthesize or download a sound.")); return 0
    cands.sort(key=lambda t: -t[0])
    top = cands[0][0]
    pool = [c for c in cands if c[0] >= top - 4][: max(args.n * 4, 8)]
    seed = int(hashlib.sha256(f"{args.seed or ''}|{args.moment or args.category}".encode()).hexdigest()[:12], 16)
    rnd = random.Random(seed)
    weights = [1.6 ** (sc - top) for sc, _ in pool]
    picks, fams = [], set()
    while pool and len(picks) < args.n:
        i = rnd.choices(range(len(pool)), weights=weights)[0]
        sc, s = pool.pop(i); weights.pop(i)
        if s["variant_family"] in fams and len(pool) >= args.n - len(picks): continue
        fams.add(s["variant_family"]); picks.append(s)
    out(dict(moment=args.moment, results=[summary(s) for s in picks]))
    return 0


def summary(s):
    r = dict(id=s["id"], name=s["fx_name"], category=s["category"], tier=s["tier"], file=os.path.join(HERE, s["file"]),
             description=s["description"], duration_ms=s["duration_ms"], sync_point_ms=s["sync_point_ms"], loopable=s["loopable"],
             clip_gain_db=s["clip_gain_db"], highpass_hz=s["suggested_highpass_hz"], tone=s["tone_palette"], family=s["variant_family"])
    if s.get("event_onsets_ms"): r["event_onsets_ms"] = s["event_onsets_ms"][:40]
    if s["attribution_required"]: r["credit_line"] = s["credit_line"]
    return r


def place(args):
    by_id = {s["id"]: s for s in load()["sounds"]}
    s = by_id.get(args.id)
    if not s: out(dict(error=f"unknown id {args.id}")); return 2
    start = args.at - s["sync_point_ms"] / 1000
    trim = max(0.0, -start)
    out(dict(id=s["id"], file=os.path.join(HERE, s["file"]), event_at_s=args.at, start_s=round(max(0.0, start), 3), trim_front_s=round(trim, 3),
             clip_gain_db=s["clip_gain_db"], highpass_hz=s["suggested_highpass_hz"], duration_s=round(s["duration_ms"] / 1000, 3),
             loopable=s["loopable"], credit_line=s["credit_line"]))
    return 0


def credits(args):
    by_id = {s["id"]: s for s in load()["sounds"]}
    lines = sorted({by_id[i]["credit_line"] for i in args.ids if i in by_id and by_id[i]["credit_line"]})
    out(dict(caption_credits=("Sound effects: " + "; ".join(lines)) if lines else None, credit_required=bool(lines)))
    return 0


def record(args):
    hist = read_history(args.history)
    hist += [dict(id=i, video=args.video) for i in args.ids]
    with open(args.history, "w") as f: json.dump(hist[-500:], f, indent=0)
    out(dict(recorded=args.ids, history=args.history, entries=len(hist)))
    return 0


def show(args):
    by_id = {s["id"]: s for s in load()["sounds"]}
    out([by_id.get(i, dict(id=i, error="unknown id")) for i in args.ids])
    return 0


def main():
    p = argparse.ArgumentParser(description="SFX library helper")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("moments")
    f = sub.add_parser("find")
    f.add_argument("--moment"); f.add_argument("--category"); f.add_argument("--use")
    f.add_argument("--n", type=int, default=3); f.add_argument("--seed"); f.add_argument("--history")
    f.add_argument("--tone"); f.add_argument("--length-s", type=float); f.add_argument("--intensity", type=int)
    f.add_argument("--max-ms", type=float); f.add_argument("--avoid")
    f.add_argument("--allow-credit", action="store_true"); f.add_argument("--any-tier", action="store_true")
    pl = sub.add_parser("place"); pl.add_argument("id"); pl.add_argument("--at", type=float, required=True)
    c = sub.add_parser("credits"); c.add_argument("ids", nargs="+")
    r = sub.add_parser("record"); r.add_argument("ids", nargs="+"); r.add_argument("--history", required=True); r.add_argument("--video")
    sh = sub.add_parser("show"); sh.add_argument("ids", nargs="+")
    a = p.parse_args()
    if a.cmd == "moments":
        out({k: dict(when=v["when"], categories=v["categories"]) for k, v in MOMENTS.items()}); return 0
    return {"find": find, "place": place, "credits": credits, "record": record, "show": show}[a.cmd](a)


if __name__ == "__main__":
    sys.exit(main())
