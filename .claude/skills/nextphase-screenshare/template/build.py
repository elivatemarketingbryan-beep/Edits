#!/usr/bin/env python3
"""build.py — generate one HyperFrames composition per segment from spec.py.

    python3 build.py            writes seg-NN-*/index.html (+ hyperframes.json)

The camera is a panel that TRAVELS between named rects. It never cuts.

  FULL      1920x1080  r0     the whole frame. Breathers and chapter openers (~16%).
  HALF      560x740    r28    camera on one side, a UI card on the other (~39%).
                              "HALF" picks the side from brand.json camera_side;
                              HALF_L / HALF_R force it.
  CORNER    300x300    r40    the measured share card, big UI doing the demo (~35%).
                              Bottom-right, or bottom-left when camera_side is "left".

Every state change is a TRAVEL on the solved ease. The geometry is exact:
60 + 1184 + 56 + 560 + 60 = 1920, and both half panels run y 60..800 so the
caption band (cap-top y=848) stays clear on every ground.

Owned here: the travel as a pure function of time (seek-exact); element
arrivals; captions never swapping mid-travel; the live dot ground, drawn every
frame from absolute time so segments join seamlessly.

Settings come from ./brand.json (a snapshot of the skill's brand file, taken
when this video was created): captions on/off and the camera side.
"""
import json, os, re, shutil, sys

from spec import SEGMENTS, BEATS

V = os.path.dirname(os.path.abspath(__file__))
FPS = 30
ENTER_F, EXIT_F, MARK_F, FADE_F = 7, 5, 6, 2

BRAND = {"captions": True, "camera_side": "swap"}
if os.path.exists(os.path.join(V, "brand.json")):
    BRAND.update(json.load(open(os.path.join(V, "brand.json"))))
SIDE = BRAND.get("camera_side", "swap")

CAM = {
    "FULL":     (0,    0,   1920, 1080, 0),
    "HALF_L":   (60,   60,  560,  740,  28),
    "HALF_R":   (1300, 60,  560,  740,  28),
    "CORNER_R": (1560, 720, 300,  300,  40),
    "CORNER_L": (60,   720, 300,  300,  40),
}
BOX = {"CORNER_R": "ss-safe", "CORNER_L": "ss-safe flip",
       "HALF_R": "ss-halfbox left", "HALF_L": "ss-halfbox right", "FULL": None}


def resolve_states(beats):
    """Turn HALF / CORNER into a concrete side. 'swap' alternates the half
    panel between beats (the measured reference sits ~48% left / 52% right)."""
    flip = False
    for b in beats:
        st = b["cam"]
        if st == "HALF":
            if SIDE == "left":
                st = "HALF_L"
            elif SIDE == "right":
                st = "HALF_R"
            else:
                st = "HALF_L" if flip else "HALF_R"
                flip = not flip
        elif st == "CORNER":
            st = "CORNER_L" if SIDE == "left" else "CORNER_R"
        b["state"] = st
    return beats


def travel_frames(a, b):
    """The measured 11/10 for the full<->corner share card is kept exactly;
    the longer moves get a few more frames because they cover more ground."""
    pair = {a.split("_")[0], b.split("_")[0]}
    if pair == {"FULL", "CORNER"}:
        return 11 if b.startswith("CORNER") else 10
    if a.startswith("HALF") and b.startswith("HALF"):
        return 14
    if "FULL" in pair:
        return 12
    return 11


def enter(eid, at, dur=None):
    """An element arriving. Sharp — it lands and settles, it never floats in."""
    return ('tl.fromTo("#%s",{opacity:0,scale:0.965,y:14},'
            '{opacity:1,scale:1,y:0,duration:%.4f,ease:"expo.out",'
            'transformOrigin:"50%% 50%%",immediateRender:false},%.4f);'
            % (eid, (dur or ENTER_F) / FPS, at))


def build_segment(seg, beats, caps):
    name, s0, s1 = seg["name"], seg["t0"], seg["t1"]
    dur = round(s1 - s0, 4)
    cid = re.sub(r"[^a-z0-9]", "", name)
    body, tw, pre, track = [], [], [], 10

    body.append('<canvas id="live" class="ss-liveground" width="1920" height="1080"></canvas>')
    body.append(
        '<div id="camwrap" class="ss-cam" style="z-index:40">'
        '<video id="cam" class="clip" src="assets/cam.mp4" muted '
        'data-has-audio="false" data-start="0" data-duration="%.4f" '
        'data-media-start="%.4f" data-track-index="40"></video></div>'
        % (dur, s0))

    travels, prev = [], None
    for b in beats:
        st = b["state"]
        if prev is not None and st != prev:
            travels.append((round(b["t0"] - s0, 4), prev, st))
        prev = st
        if not b.get("make"):
            continue
        d0, d1 = b["t0"] - s0, b["t1"] - s0
        uid = "sc%d" % int(round(b["t0"] * 100))
        # a video INSIDE a clip needs composition-time data-start plus an id,
        # or it renders frozen on its first frame
        ctx = {"d0": d0, "dur": d1 - d0, "media": b.get("media_start", 0.0)}
        html, anims = b["make"](uid, ctx)
        track += 1
        box = b.get("box") or BOX[st]
        body.append(
            '<div id="%sw" class="clip" data-start="%.4f" data-duration="%.4f" '
            'data-track-index="%d" style="z-index:%d"><div class="ss-canvas">'
            '<div class="%s">%s</div></div></div>'
            % (uid, d0, d1 - d0, track, track, box, html))
        # The content arrives — unless this beat continues the one before it on
        # the same ground: the canvas under a travel is already built.
        if not b.get("built"):
            pre.append('tl.set("#%s",{opacity:0},0);' % uid)
            tw.append(enter(uid, d0 + b.get("in_at", 0.0)))
        # Enter slow, leave fast. Without an exit the outgoing card is simply
        # gone on the frame the next arrives, which reads as a dropped frame.
        if not b.get("noexit"):
            tw.append('tl.to("#%s",{opacity:0,scale:0.992,duration:%.4f,'
                      'ease:"power2.in"},%.4f);'
                      % (uid, EXIT_F / FPS, d1 - EXIT_F / FPS))
        for mid, kind, delay, extra in anims:
            if delay is None:
                continue
            at = d0 + delay
            if kind == "enter":
                pre.append('tl.set("#%s",{opacity:0},0);' % mid)
                tw.append(enter(mid, at))
            elif kind == "mark":
                tw.append('tl.fromTo("#%s",{scaleX:0},{scaleX:1,duration:%.4f,'
                          'ease:"power2.out",immediateRender:false},%.4f);'
                          % (mid, MARK_F / FPS, at))
            elif kind == "draw":
                tw.append('tl.fromTo("#%s ellipse",{strokeDashoffset:%s},'
                          '{strokeDashoffset:0,duration:%.4f,ease:"power2.out",'
                          'immediateRender:false},%.4f);'
                          % (mid, extra, (MARK_F + 2) / FPS, at))

    for i, c in enumerate(caps):
        cin, cout = c["in"] / FPS - s0, c["out"] / FPS - s0
        cls = "ss-cap" + ("" if c["ground"] == "canvas" else " ss-cap--footage")
        eid = "c%d" % i
        body.append(
            '<div id="%s" class="clip %s" data-start="%.4f" data-duration="%.4f" '
            'data-track-index="60" style="z-index:60">%s</div>'
            % (eid, cls, cin, cout - cin, c["text"]))
        tw.append('tl.fromTo("#%s",{opacity:0},{opacity:1,duration:%.4f,'
                  'ease:"none",immediateRender:false},%.4f);'
                  % (eid, FADE_F / FPS, cin))
        tw.append('tl.to("#%s",{opacity:0,duration:%.4f,ease:"none"},%.4f);'
                  % (eid, FADE_F / FPS, max(cin, cout - FADE_F / FPS)))

    start = beats[0]["state"] if beats else "FULL"
    tj = ",".join("{at:%.4f,d:%d/%d,a:%s,b:%s}"
                  % (t, travel_frames(a, b), FPS, list(CAM[a]), list(CAM[b]))
                  for t, a, b in travels)

    script = """
window.__timelines = window.__timelines || {};
function bez(t){
  // cubic-bezier(.42,0,.66,1) — SOLVED against the measured shrink widths
  // 1920 1912 1836 1691 1502 1283 1054 828 623 (RMS 0.0085). Every travel runs on it.
  var x=t,i,cx=1.26,bx=3*(0.66-0.42)-1.26,ax=1-1.26-bx;
  var cy=0,by=3,ay=1-3;
  for(i=0;i<8;i++){
    var fx=((ax*x+bx)*x+cx)*x-t, d=(3*ax*x+2*bx)*x+cx;
    if(Math.abs(fx)<1e-6||d===0) break;
    x=x-fx/d;
  }
  if(x<0)x=0; if(x>1)x=1;
  return ((ay*x+by)*x+cy)*x;
}
var START = __START__;
var TRAVELS = [__TRAVELS__];
var camWrap = document.getElementById('camwrap');
var camVid  = document.getElementById('cam');

/* One rect -> the clip that frames the panel, and the transform that does the
   object-fit:cover inside it. Two elements: on one, the clip rect would travel
   with the scale and the plate would leave the frame. */
function applyCam(R){   /* R = [x,y,w,h,radius] */
  var x=R[0], y=R[1], w=R[2], h=R[3], r=R[4];
  camWrap.style.clipPath = 'inset(' + y + 'px ' + (1920-x-w) + 'px ' +
                           (1080-y-h) + 'px ' + x + 'px round ' + r + 'px)';
  var k = Math.max(w/1920, h/1080);      /* cover: the larger ratio fills the box */
  var cx = x + w/2, cy = y + h/2;
  camVid.style.transformOrigin = '960px 540px';
  camVid.style.transform = 'translate(' + (cx-960) + 'px,' + (cy-540) +
                           'px) scale(' + k + ')';
}

/* The rect as a PURE FUNCTION of time, so every seeked frame is exact. */
function camAt(t){
  var R = START, i, j;
  for (i = 0; i < TRAVELS.length; i++){
    var tr = TRAVELS[i];
    if (t >= tr.at + tr.d) { R = tr.b; }
    else if (t > tr.at) {
      var u = bez((t - tr.at) / tr.d), o = [];
      for (j = 0; j < 5; j++) o.push(tr.a[j] + (tr.b[j] - tr.a[j]) * u);
      return o;
    } else return R;
  }
  return R;
}
applyCam(camAt(0));

/* THE LIVE GROUND — a pure function of absolute time. Bars of dots on the
   measured 12px pitch; each bar's top is a slowly drifting height field
   (three low-frequency sines, no sideways scroll) snapped to the row grid.
   The top dot is the cap: bigger and darker. Dots under it grow with depth.
   Keep the spatial frequencies low (0.04-0.16 rad/column): higher reads as
   jagged spikes instead of wide terraces. */
var LV = document.getElementById('live').getContext('2d');
var cs = getComputedStyle(document.documentElement);
var LV_ON  = (cs.getPropertyValue('--ss-live-on').trim() || '1') !== '0';
var LV_CAP = cs.getPropertyValue('--ss-live-cap').trim();
var LV_DOT = cs.getPropertyValue('--ss-live-dot').trim();
var LV_P = parseFloat(cs.getPropertyValue('--ss-live-pitch')) || 12;
var LV_TOP = parseFloat(cs.getPropertyValue('--ss-live-top')) || 41;
var LV_T0 = __T0__;
function drawGround(t){
  LV.clearRect(0, 0, 1920, 1080);
  if (!LV_ON) return;
  var T = t + LV_T0;
  var cols = Math.ceil(1920 / LV_P), rows = Math.ceil(1080 / LV_P), i, j;
  for (i = 0; i < cols; i++){
    var h = 3.6*Math.sin(i*0.075 + T*0.45) + 2.6*Math.sin(i*0.041 - T*0.31 + 1.7)
          + 1.2*Math.sin(i*0.16 + T*0.7 + 4.1);
    var top = Math.round(LV_TOP - h), x = i*LV_P + LV_P/2;
    for (j = top; j < rows; j++){
      var d = j - top, y = j*LV_P + LV_P/2;
      LV.fillStyle = d === 0 ? LV_CAP : LV_DOT;
      LV.beginPath();
      LV.arc(x, y, d === 0 ? 2.4 : 0.8 + 1.1*Math.min(d, 18)/18, 0, 6.2832);
      LV.fill();
    }
  }
}
drawGround(0);

var tl = gsap.timeline({paused:true});
var drv = {t:0};
tl.to(drv, {t:__DUR__, duration:__DUR__, ease:'none',
            onUpdate:function(){ applyCam(camAt(drv.t)); drawGround(drv.t); }}, 0);
__PRE__
__TW__
window.__timelines["__CID__"] = tl;
"""
    script = (script.replace("__START__", str(list(CAM[start])))
                    .replace("__TRAVELS__", tj)
                    .replace("__DUR__", "%.4f" % dur)
                    .replace("__T0__", "%.4f" % s0)
                    .replace("__PRE__", chr(10).join(pre))
                    .replace("__TW__", chr(10).join(tw))
                    .replace("__CID__", cid))

    html = ('<!doctype html>\n<html lang="en" data-resolution="landscape">\n'
            '<head>\n<meta charset="UTF-8"/>\n'
            '<meta name="viewport" content="width=1920, height=1080"/>\n'
            '<title>%s</title>\n'
            '<link rel="stylesheet" href="assets/tokens.css"/>\n'
            '<link rel="stylesheet" href="assets/ss.css"/>\n'
            '<script src="assets/vendor/gsap.min.js"></script>\n</head>\n<body>\n'
            '<!-- GENERATED by ../build.py from ../spec.py — edit those, not this. -->\n'
            '<div id="root" class="ss-frame ss-live" data-composition-id="%s" '
            'data-width="1920" data-height="1080" data-start="0" '
            'data-duration="%.4f">\n%s\n</div>\n<script>%s</script>\n</body>\n</html>\n'
            % (name, cid, dur, chr(10).join("  " + b for b in body), script))

    d = "%s/%s" % (V, name)
    os.makedirs(d, exist_ok=True)
    link = d + "/assets"
    # a segment folder is its own project root: HyperFrames rejects ../assets,
    # so each segment gets an assets symlink back to the shared folder
    if not os.path.islink(link):
        if os.path.exists(link):
            shutil.rmtree(link)
        os.symlink("../assets", link)
    open(d + "/index.html", "w").write(html)
    json.dump({"name": name, "width": 1920, "height": 1080, "fps": FPS,
               "duration": dur}, open(d + "/hyperframes.json", "w"), indent=2)
    return dur, len(caps), len(tw) + len(pre), len(travels)


def skill_dir():
    try:
        return json.load(open(os.path.join(V, "kit.json")))["skill"]
    except Exception:
        return os.path.expanduser("~/.claude/skills/nextphase-screenshare")


def write_sfx_cues():
    """One quiet transient per layout change, nothing else (sound-design.md §2).
    Cue times are FILE STARTS, so each is pre-rolled by its sound's peak
    offset (sfx/peaks.json) to land the peak on the first frame of the travel."""
    path = os.path.join(V, "sfx-cues.txt")
    if not BRAND.get("sfx", True):
        open(path, "w").write("# sound effects OFF in brand.json — voice only\n")
        return 0
    try:
        peaks = json.load(open(os.path.join(skill_dir(), "sfx", "peaks.json")))
    except Exception:
        peaks = {}
    gain = {"share-on": 0.126, "share-off": 0.10, "swap": 0.08}
    lines = ["# sfx-cues.txt — GENERATED by build.py. One transient per layout change.",
             "# <file start s>  <sound>  <linear gain>   (pre-rolled by each sound's peak offset)"]
    prev, n = None, 0
    for b in BEATS:
        st = b["state"]
        if prev is not None and st != prev:
            snd = ("share-off" if st == "FULL" else
                   "share-on" if prev == "FULL" else "swap")
            t = max(0.0, b["t0"] - peaks.get(snd, 0.03))
            lines.append("%9.3f  %-10s %.3f" % (t, snd, gain[snd]))
            n += 1
        prev = st
    open(path, "w").write("\n".join(lines) + "\n")
    return n


def main():
    resolve_states(BEATS)
    cap_path = V + "/assets/captions.json"
    caps = json.load(open(cap_path)) if (BRAND.get("captions", True)
                                         and os.path.exists(cap_path)) else []
    if not BRAND.get("captions", True):
        print("captions OFF (brand.json)")

    def beat_at(t):
        for b in BEATS:
            if b["t0"] - 1e-9 <= t < b["t1"]:
                return b
        return BEATS[-1]

    # a caption never swaps mid-travel: truncate the one running into a travel,
    # delay the one starting inside it
    wins, prev = [], None
    for b in BEATS:
        if prev is not None and b["state"] != prev:
            wins.append((b["t0"], b["t0"] + (travel_frames(prev, b["state"]) + 2) / FPS))
        prev = b["state"]

    kept, trimmed, delayed = [], 0, 0
    for c in caps:
        cin, cout = c["in"] / FPS, c["out"] / FPS
        for a, z in wins:
            if cin < a < cout:
                cout = a; trimmed += 1
            if a <= cin < z:
                cin = z; delayed += 1
        if cout - cin < 8 / FPS:
            continue
        c = dict(c); c["in"], c["out"] = round(cin * FPS), round(cout * FPS)
        c["ground"] = ("camera" if beat_at(c["in"] / FPS + 1e-6)["state"] == "FULL"
                       else "canvas")
        kept.append(c)
    if caps:
        print("captions %d -> %d  (%d truncated at a travel, %d delayed past one)"
              % (len(caps), len(kept), trimmed, delayed))

    # the layout mix, against the measured targets
    share = {}
    for b in BEATS:
        k = b["state"].split("_")[0]
        if b.get("box") == "ss-bleedsafe":
            k = "PAGE"
        share[k] = share.get(k, 0) + (b["t1"] - b["t0"])
    tot = sum(share.values())
    target = {"FULL": "14-18", "HALF": "36-42", "CORNER": "32-38", "PAGE": "~10 with no-cam"}
    print("layout mix (target): " + "   ".join(
        "%s %.0f%% (%s)" % (k, 100 * v / tot, target.get(k, "?"))
        for k, v in sorted(share.items(), key=lambda x: -x[1])))
    changes = sum(1 for i in range(1, len(BEATS)) if BEATS[i]["state"] != BEATS[i - 1]["state"])
    if changes:
        print("layout changes %d -> one every %.1fs (target 7-9s)" % (changes, tot / changes))

    total, ntr = 0.0, 0
    for seg in SEGMENTS:
        bs = [b for b in BEATS if seg["t0"] - 1e-6 <= b["t0"] < seg["t1"] - 1e-6]
        cs = [c for c in kept if seg["t0"] - 1e-6 <= c["in"] / FPS < seg["t1"] - 1e-6]
        for c in cs:
            c["out"] = min(c["out"], round(seg["t1"] * FPS))
        cs = [c for c in cs if c["out"] - c["in"] >= 6]
        d, nc, nt, tr = build_segment(seg, bs, cs)
        total += d; ntr += tr
        print("  %-22s %7.3fs  %2d beats  %3d caps  %3d tweens  %2d travels"
              % (seg["name"], d, len(bs), nc, nt, tr))
    print("total %.3fs   %d camera travels" % (total, ntr))
    print("sfx-cues.txt: %d cue(s)" % write_sfx_cues())


if __name__ == "__main__":
    main()
