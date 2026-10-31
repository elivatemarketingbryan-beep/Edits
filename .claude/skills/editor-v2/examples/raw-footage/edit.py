#!/usr/bin/env python3
"""edit.py plan|sheet|preview|full: Editor V2 cut of "raw footage". The hook runs on the reel's own frames (hook.py), then the speaker's voice is the clock.
Times below are on the voice clock; OFFSET is where the speaker's voice starts in the video. Later lines overwrite earlier ones."""
import json, multiprocessing as mp, subprocess, sys, time
import numpy as np
from lib import *
import hook as hk
import endcard as ec
from hook import L_bw, L_room, L_hi, L_hineg, L_cold, L_cream, L_blue, L_bone, L_negg, L_rose, L_teal, L_thr, blur, rad

OFFSET = 0.0       # the voice starts with the video and runs over the hook
END_V = 47.2       # the voice ends at 44.13, the title holds after it
TOTAL = int(round((OFFSET + END_V) * FPS))
owner = {}         # output frame -> (drawer, local frame, finish)
RUSH = []          # voice-clock windows that carry the reel's click roll
CLICK = []         # (voice time, variant, gain)
QUIET = [(30.91, 38.5)]    # no automatic clicks here


def T(t):
    return int(round((t + OFFSET) * FPS))


def add(t0, t1, draw, finish=True):
    a, b = T(t0), T(t1)
    for n in range(a, b):
        owner[n] = (draw, n - a, finish)
    return b


def seqf(t0, items, finish=True):
    """shots laid one after the other, counted in frames"""
    n = T(t0)
    for fr, draw in items:
        for k in range(fr):
            owner[n + k] = (draw, k, finish)
        n += fr
    return n / FPS - OFFSET


def tv_of(n):
    return n / FPS - OFFSET


def talk(k, n):
    """the speaker talking. Always the full frame: no punch-ins, no push"""
    return take_bw(tv_of(n))


def freeze(tv, look=None):
    def d(k, n):
        a = take_bw(tv)
        return a if look is None else look(a, k, n)
    return d


def broll(name, look=L_room, off=0, push=.015):
    def d(k, n):
        a = seg(name).frame(off + k)
        return zoomed(look(a, k, n).astype(np.float32), 1 + push * k / FPS)
    return d


def colour(name, off=0):
    def d(k, n):
        return seg(name).frame(off + k)
    return d


def film(name, look=L_bw, off=0):
    def d(k, n):
        return look(seg(name).frame(off + k), k, n).astype(np.float32)
    return d


def picd(key, look):
    return hk.pic_look(key, look)


def white(k, n):
    return np.ones((H, W, 3), np.float32)


def black(k, n):
    return np.zeros((H, W, 3), np.float32)


def title(lines, neg_=False):
    a = text_frame(lines)
    a = 1 - a if neg_ else a
    def d(k, n):
        return a
    return d


def xmatch(name="era"):
    """the skull, moved so it sits on the speaker's head in this take"""
    a = cover(read_img(f"{XR}/{name}.png"))
    s = 1.15
    M = np.float32([[s, 0, W * .48 - s * W * .458], [0, s, H * .28 - s * H * .33]])
    a = cv2.warpAffine(a, M, (W, H), borderMode=cv2.BORDER_REPLICATE)
    b = cmap(bw(a, .05, .95, .4), BLUE)
    def d(k, n):
        return b
    return d


def replay(entries, fr):
    """pictures from the hook again"""
    return [(fr, (lambda key=e[1], look=e[2]: picd(key, look))()) for e in entries]


P1, P2 = hk.P1, hk.P2
LINEUP = [P1[i] for i in (0, 1, 3, 4, 7, 9, 12, 13, 14, 16, 18, 20, 21)]

# ---- the plan, line by line ----------------------------------------------------------------
# 0 to 9.24 is the hook, untouched (hook.py). Over it: "This is my raw footage ... I didn't look at the clip, and"
X = xmatch("era")
NG = lambda: (lambda k, n: neg(take_bw(tv_of(n))))

# "I don't even know how to use"  the old way
def cap(text, part=None):
    """talking, the caption huge and red on the wall behind the speaker, in the end title's style"""
    def d(k, n):
        tv = tv_of(n)
        return ec.behind(take_bw(tv), text, matte(int(src_time(tv) * 30)), part=part)
    return d


_on_film = {}


def over_film(draw, text):
    """the same caption on a shot with no one in it"""
    if (draw, text) not in _on_film:
        def d(k, n):
            m = ec.word_mask(text)[..., None]
            return draw(k, n) * (1 - m) + ec.RED * .96 * m
        _on_film[(draw, text)] = d
    return _on_film[(draw, text)]


add(9.24, 9.51, cap("I DON'T"))
add(9.51, 9.75, cap("EVEN"))
add(9.75, 9.99, cap("KNOW"))
seqf(9.99, [(3, film("m_master2")), (3, film("m_picture")), (2, film("m_hand")), (2, film("m_finger2")), (3, film("m_sound2"))])
RUSH.append((9.99, 10.5))
for n_ in range(T(9.99), T(10.52)):
    if n_ in owner:
        tv_ = tv_of(n_)
        owner[n_] = (over_film(owner[n_][0], "HOW" if tv_ < 10.2 else "TO" if tv_ < 10.32 else "USE"),) + owner[n_][1:]
# "Premiere Pro."  no music yet
add(10.52, 11.05, cap("PREMIERE PRO", "PREMIERE"))
add(11.05, 11.76, cap("PREMIERE PRO"))

# "Everything that you see right now"  the song drops here
seqf(11.76, replay(LINEUP[:12], 2) + replay(P2[3:9] + P2[:1], 3))
RUSH.append((11.76, 13.5))
# "was made by this skill that I've built,"  the speaker, at work
add(13.48, 14.51, broll("type_face"))
add(14.51, 15.3, broll("type_hands"))
seqf(15.3, [(3, film("y_bars2")), (3, film("y_hands"))])
add(15.54, 16.32, broll("type_wide"))
# "and I called it"
add(16.32, 17.62, talk)
# "Editor V2."
add(17.62, 18.14, title(["EDITOR"]))
add(18.14, 19.21, title(["EDITOR V2"]))
seqf(18.14, [(1, white), (1, title(["EDITOR V2"], True)), (1, title(["EDITOR V2"]))])
CLICK += [(17.62, "a", .9), (18.14, "a", .9), (18.18, "c", .6), (18.22, "b", .6), (18.5, "b", .5)]

# "You give it your clips,"  the speaker's clips, untouched colour
seqf(19.21, [(6, colour("walkin", 18)), (5, colour("sit_c", 10)), (5, colour("type_b")), (5, colour("chin_d")), (3, colour("gesture_d", 10)), (4, colour("lookback", 20))], finish=False)
# "and it will bring outside clips"
add(20.3, 21.26, talk)
seqf(21.26, [(3, film("t_mass1")), (3, film("h_pour")), (3, film("x_xhand")), (3, film("y_sil2")), (2, film("e_big")), (3, film("p_reels")), (3, film("h_face"))])
RUSH.append((21.26, 22.05))
# "that will go with them."  each of the speaker's shots next to its outside match
seqf(22.07, [(9, broll("type_hands", off=10)), (6, film("y_hands2")), (9, broll("type_face", off=12)), (6, film("h_weld")), (8, broll("lookback_face", off=8)), (10, film("e_big2"))])

# "It will build a"
add(24.0, 24.38, talk)
# "fast picture montage"  "at the start"
seqf(24.38, replay(P1[:17], 2) + replay(P2[3:9] + P2[:3], 3))
RUSH.append((24.38, 26.8))
# "and every sound effect,"
add(26.8, 27.03, talk)
seqf(27.03, [(5, film("m_sound2")), (5, film("m_sound3"))])
add(27.43, 28.37, talk)
RUSH.append((26.8, 28.3))
# "and cut the whole thing together"
seqf(28.37, [(7, film("m_editor")), (5, film("m_finger")), (5, film("p_spin")), (5, film("h_line")), (5, film("h_cars")), (5, film("h_old")), (9, film("m_lens"))])
# "by itself."  nobody there
add(30.0, 31.13, broll("desk_empty"))

# "And the camera clicks that you hear are real sounds, not AI sounds."  no music, the clicks alone
add(31.13, 31.46, talk)
add(31.46, 31.9, film("x_cam3"))
add(31.9, 33.16, talk)
for t in (31.9, 32.18, 32.34, 32.62, 32.85):
    seqf(t, [(1, white), (3, freeze(t))])
    CLICK.append((t, "abcab"[int(t * 7) % 5], .8))
add(33.16, 34.31, talk)
CLICK += [(33.41, "a", .7), (33.65, "b", .6)]
seqf(34.31, [(2, X), (1, NG()), (3, X)])
add(34.55, 35.63, talk)
CLICK += [(34.31, "a", .8), (34.39, "c", .6)]

# "And I just want to let you know,"  hand on chin, the rest
add(35.63, 36.84, broll("chin_d"))
# "this is completely free."
add(36.84, 38.51, talk)
CLICK += [(36.84, "b", .5), (38.01, "a", .9)]
owner[T(38.01)] = (white, 0, True)

# "So if you want the"  they run, the music is back
add(38.51, 39.6, film("l_crowd"))
# "Editor V2,"
add(39.6, 40.15, title(["EDITOR V2"], True))
# "just watch the video,"
add(40.15, 40.66, talk)
seqf(40.66, [(16, film("e_big2")), (8, film("e_row")), (10, film("e_iris"))])
# "you'll get the full skill directly."  they get up and walk out, and the title is on the wall behind them
# the title lands on "skill" while they are still in the room, so they stand in front of it
OFF, POP, STEP = 21, 55, 88
t_pop = 41.52 + (POP - OFF) / FPS
t_step = 41.52 + (STEP - OFF) / FPS
add(41.52, t_pop, lambda k, n: ec.walk(OFF + k, False))
add(t_pop, t_step, lambda k, n: ec.walk(POP + k))
seqf(t_step, [(len(ec.EXIT_DX), lambda k, n: ec.walk_off(k, STEP))])
add(t_step + len(ec.EXIT_DX) / FPS, 46.9, ec.end_hold)
CLICK += [(round(t_pop, 3), "a", 1.0), (46.9, "a", .7)]
# the clicks slow down exactly as the reel's do
t = 41.6
for g, v in zip((0, .245, .24, .24, .28, .4, .36, .24), "abaabaab"):
    t += g
    CLICK.append((round(t, 3), v, .75))
QUIET.append((41.52, END_V))


def rushed(tv):
    return any(a <= tv < b for a, b in RUSH)


def quiet(tv):
    return any(a <= tv < b for a, b in QUIET)


def auto_clicks():
    """every cut outside a rush gets one click"""
    out, prev = [], None
    for n in range(hk.TOTAL, TOTAL):
        d = owner.get(n, (None, 0, True))
        if prev is not None and d[0] is not prev and d[1] == 0:
            tv = tv_of(n)
            if not rushed(tv) and not quiet(tv) and not any(abs(tv - c[0]) < .06 for c in CLICK):
                out.append((round(tv, 3), "abc"[n % 3], .6))
        prev = d[0]
    return out


def frame(n):
    if n < hk.TOTAL:
        a = hk.hook_frame(n)
        return grain(vignette(a, .2), n, .022)
    o = owner.get(n)
    if o is None:
        return np.zeros((H, W, 3), np.float32)
    d, k, fin = o
    a = d(k, n).astype(np.float32)
    return grain(vignette(a), n) if fin else a


def to8(a):
    return (np.clip(a, 0, 1) * 255 + .5).astype(np.uint8)


def work(n):
    return to8(frame(n)).tobytes()


def render(a, b, out):
    p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15",
                          "-pix_fmt", "yuv420p", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-movflags", "+faststart", out], stdin=subprocess.PIPE)
    t0 = time.time()
    # spawn, not fork: OpenCV's threads hang forked workers on macOS
    with mp.get_context("spawn").Pool(7) as pool:
        for i, b_ in enumerate(pool.imap(work, range(a, b), chunksize=4)):
            p.stdin.write(b_)
            if i % 150 == 0:
                print(f"frame {a + i}/{b}  {time.time() - t0:.0f} s", flush=True)
    p.stdin.close()
    p.wait()


def plan():
    cl = sorted(CLICK + auto_clicks())
    json.dump(dict(click=cl, rush=RUSH, offset=OFFSET, total=TOTAL / FPS), open(f"{R}/work/sound_plan.json", "w"), indent=0)
    cuts = []
    prev = None
    for n in range(hk.TOTAL, TOTAL):
        d = owner.get(n, (None, 0, True))
        if prev is not None and d[0] is not prev:
            cuts.append(n / FPS)
        prev = d[0]
    c = np.array(cuts)
    dur = TOTAL / FPS - OFFSET
    print(f"after the hook: {len(c)} cuts in {dur:.1f} s = {len(c) / dur:.1f}/s; {len(cl)} single clicks; rush windows {RUSH}")
    per = [int(((c >= s) & (c < s + 1)).sum()) for s in range(int(OFFSET), int(TOTAL / FPS) + 1)]
    print("cuts per second:", per)
    print("frames with no owner:", [tv_of(n) for n in range(hk.TOTAL, T(44.85)) if n not in owner][:10])


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "plan":
        plan()
    elif cmd == "sheet":
        fs = [int(x) for x in sys.argv[2].split(",")]
        S, C = 384, 8
        rows = (len(fs) + C - 1) // C
        sh = np.zeros((rows * 216, C * S, 3), np.uint8)
        for i, n in enumerate(fs):
            t = cv2.resize(to8(frame(n)), (S, 216), interpolation=cv2.INTER_AREA).copy()
            cv2.putText(t, f"{tv_of(n):.2f}", (4, 16), cv2.FONT_HERSHEY_SIMPLEX, .5, (255, 255, 0), 1)
            sh[(i // C) * 216:(i // C) * 216 + 216, (i % C) * S:(i % C) * S + S] = t
        cv2.imwrite(f"{R}/work/edit_sheet.jpg", sh[..., ::-1], [cv2.IMWRITE_JPEG_QUALITY, 88])
    elif cmd == "preview":
        plan()
        render(0, int(float(sys.argv[2]) * FPS), f"{R}/work/preview.mp4")
    elif cmd == "full":
        plan()
        render(0, TOTAL, f"{R}/out/picture.mp4")
