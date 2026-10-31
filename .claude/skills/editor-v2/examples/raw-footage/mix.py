#!/usr/bin/env python3
"""mix.py: the sound. The hook bed from sfx/ under the voice, then the song 5.5 LU under the voice with its drop on a line, the click roll on the rushes,
single clicks on the other cuts, and a sweep and a boom on the big moments. Copy this and change DROP, the ramps and the big moments for your video."""
import json, os, re, subprocess, sys
import numpy as np
import soundfile as sf
R = os.environ.get("EDITOR_PROJECT") or os.getcwd()
os.chdir(R)
SR = 48000
SK = os.path.expanduser("~/.claude/skills/editor-v2")
SFX = f"{SK}/sfx"
plan = json.load(open("work/sound_plan.json"))
OFFSET, TOTAL = plan["offset"], plan["total"]


def ff(src, af=None, out=None, ss=None, to=None):
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y"] + (["-ss", str(ss)] if ss is not None else []) + (["-to", str(to)] if to is not None else []) + ["-i", src, "-vn", "-ar", str(SR), "-ac", "2"] + (["-af", af] if af else []) + ["-c:a", "pcm_f32le", out]
    subprocess.run(cmd, check=True)
    return sf.read(out, dtype="float32", always_2d=True)[0]


def lufs(x):
    sf.write("work/_m.wav", x, SR, subtype="FLOAT")
    o = subprocess.run(["ffmpeg", "-nostdin", "-i", "work/_m.wav", "-af", "loudnorm=print_format=summary", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"Input Integrated:\s+(-?[\d.]+)", o).group(1))


reel = ff(f"{SFX}/hook_bed.wav", out="work/reel48.wav")
boom = ff(f"{SFX}/boom_short.wav", out="work/boom.wav")
sweep = ff(f"{SFX}/sweep.wav", out="work/sweep.wav")
for x in (boom, sweep):
    f = int(.02 * SR)
    x[:f] *= np.linspace(0, 1, f)[:, None]
    x[-int(.1 * SR):] *= np.linspace(1, 0, int(.1 * SR))[:, None]
kit = {k: ff(f"{SFX}/shutter_{k}.wav", out=f"work/click_{k}.wav") for k in "abc"}
rollA = ff(f"{SFX}/roll_fast.wav", out="work/roll.wav")
rollB = rollA[int(.7 * SR):]

vo, _ = sf.read("work/voice.wav", dtype="float32")
voice = vo
sf.write("work/voice_final.wav", voice, SR, subtype="FLOAT")

SONG = os.environ.get("EDITOR_SONG") or f"{SK}/music/song.m4a"  # the song's drop is at 43.5 s and it repeats every 58 s
DROP = 11.76       # the song's drop lands on "Everything"; the hook's own audio carries the first 9 s
song_at = 43.5 - DROP
END_V = TOTAL - OFFSET
subprocess.run([sys.executable, f"{SK}/scripts/bed-mix.py", "--voice", "work/voice_final.wav", "--song", SONG, "--song-at", str(song_at), "--dur", str(END_V), "--under", "5.5",
                f"--ramp=-1,{DROP},-70,0.012", "--ramp", "30.91,38.51,-70,0.012", "--ramp", "46.88,50,-70,0.02", "--ramp", "44.2,46.9,3,0.05", "--voice-end", "44.2", "--out", "work/premix.wav"], check=True)
bed, _ = sf.read("work/premix_bed.wav", dtype="float32", always_2d=True)
# bed-mix levels the bed over the whole window, quiet parts included. Set it from where it actually plays with the voice
BU = 5.5
a_, b_ = int(DROP * SR), int(30.9 * SR)
vv = np.repeat(voice[:, None], 2, 1)
d_ = lufs(vv[a_:b_]) - BU - lufs(bed[a_:b_])
bed = bed * 10 ** (min(d_, 0) / 20)
print("bed trim %.1f dB" % min(d_, 0))

N = int(TOTAL * SR)
mix = np.zeros((N, 2), np.float32)


def put(sig, t, gain=1.0):
    a = int(t * SR)
    if a >= N:
        return
    b = min(N, a + len(sig))
    mix[a:b] += sig[:b - a] * gain


# the hook's audio sits under the voice
voice2 = np.repeat(voice[:, None], 2, 1)
HOOK_UNDER = 5.0
L_v = lufs(voice2[:int(9.3 * SR)])
L_reel = lufs(reel[:int(9.3 * SR)])
g_reel = 10 ** ((L_v - HOOK_UNDER - L_reel) / 20)
print(f"voice over the hook {L_v:.1f} LUFS, reel {L_reel:.1f} LUFS, reel gain {g_reel:.2f}")
put(reel, 0, g_reel)
put(voice2, OFFSET)
put(bed, OFFSET)

# rushes: the reel's own click roll
ROLL = .62
for i, (a, b) in enumerate(plan["rush"]):
    src = rollA if i % 2 == 0 else rollB
    want = int((b - a) * SR)
    s = np.concatenate([src] * (want // len(src) + 1))[:want].copy()
    f = int(.008 * SR)
    s[:f] *= np.linspace(0, 1, f)[:, None]
    s[-f:] *= np.linspace(1, 0, f)[:, None]
    put(s, OFFSET + a, ROLL)
# single clicks
CG = .55
for t, v, gain in plan["click"]:
    put(kit[v], OFFSET + t, CG * gain)
# the reel's sweep and boom on the big moments
for t, g_ in ((DROP, .9), (18.14, 1.0), (38.51, 1.0), (42.88, 1.0)):
    put(boom, OFFSET + t, g_)
put(sweep, OFFSET + 17.62 - .34, .55)
put(sweep, OFFSET + DROP - .34, .4)

L = lufs(mix)
mix *= 10 ** ((-14 - L) / 20)
print("mix %.1f LUFS before gain, peak after gain %.2f" % (L, np.abs(mix).max()))
sf.write("work/mix_pre.wav", mix, SR, subtype="FLOAT")
subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", "work/mix_pre.wav", "-af", "alimiter=limit=0.8:attack=1:release=30:level=disabled", "-ar", str(SR), "-c:a", "pcm_s24le", "work/mix.wav"], check=True)
o = subprocess.run(["ffmpeg", "-nostdin", "-i", "work/mix.wav", "-af", "loudnorm=print_format=summary", "-f", "null", "-"], capture_output=True, text=True).stderr
print(re.findall(r"Input (?:Integrated|True Peak|LRA):\s+\S+", o))
