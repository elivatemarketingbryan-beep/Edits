"""Editor V3 sound, a worked example. Copy it and move the moments to your timeline.

In this style music and effects sit 3.5 to 8.6 dB under the voice for the whole video.
Picture is copied, so a new mix takes seconds. Usage: mix.py [picture.mp4] [out.mp4]
The voice is work/voice.wav. Set EDITOR_SONG to use another song.
"""
import os, re, subprocess, sys
import numpy as np
os.chdir(os.path.dirname(os.path.abspath(__file__)))
PIC = sys.argv[1] if len(sys.argv) > 1 else 'work/out/picture.mp4'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'work/out/final.mp4'
HOME = os.path.expanduser('~/.claude/skills/editor-v3')
SK = f'{HOME}/sfx'
SR, TOTAL = 48000, 69.60
N = int(SR * TOTAL)
STEMS = 'work/out/stems'
os.makedirs(STEMS, exist_ok=True)


def load(path, ss=None, to=None, af=None):
    cmd = ['ffmpeg', '-nostdin', '-v', 'error']
    if ss is not None:
        cmd += ['-ss', str(ss)]
    if to is not None:
        cmd += ['-to', str(to)]
    cmd += ['-i', path]
    if af:
        cmd += ['-af', af]
    cmd += ['-ar', str(SR), '-ac', '2', '-f', 's16le', '-']
    r = subprocess.run(cmd, capture_output=True, check=True)
    return (np.frombuffer(r.stdout, dtype=np.int16).astype(np.float32) / 32768).reshape(-1, 2)


def save(path, x):
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', '-c:a', 'pcm_s16le', path],
                   input=(np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes(), check=True)


def lufs(x, a=0.0, b=None):
    tmp = f'{STEMS}/_m.wav'
    save(tmp, x[int(a * SR):int((b or TOTAL) * SR)])
    e = subprocess.run(['ffmpeg', '-nostdin', '-hide_banner', '-i', tmp, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[0-9.]+) LUFS', e)[-1])


def db(g):
    return 10 ** (g / 20)


def put(buf, x, t, gain=0.0, trim=None, fin=0.0, fout=0.0):
    """Lay a sound on a track at time t."""
    if trim:
        x = x[:int(trim * SR)]
    x = x.copy() * db(gain)
    if fin > 0:
        k = min(int(fin * SR), len(x))
        x[:k] *= np.linspace(0, 1, k)[:, None]
    if fout > 0:
        k = min(int(fout * SR), len(x))
        x[-k:] *= np.linspace(1, 0, k)[:, None]
    i = int(t * SR)
    if i < 0:
        x = x[-i:]
        i = 0
    e = min(N, i + len(x))
    if e > i:
        buf[i:e] += x[:e - i]


S = {'real_' + n: load(f'{SK}/{n}.wav') for n in ['ticks_a', 'ticks_b', 'ticks_c', 'click', 'hit', 'cut', 'typing',
                                                  'glitch', 'burn_in', 'burn_out', 'riser', 'swell', 'boom', 'whoosh']}
SH = [load(f'{SK}/shutter_{c}.wav') for c in 'abc']

# ---- voice: compressed, then at the same loudness as his
v = load('work/voice.wav', af='acompressor=threshold=-24dB:ratio=2.2:attack=8:release=120:makeup=1')
voice = np.zeros((N, 2), np.float32)
put(voice, v, 0)
voice *= db(-15.0 - lufs(voice))

# ---- music: the song in the kit, unless EDITOR_SONG names another. It repeats every 58 s with a drop at 43.5 s.
# 5.5 LU under the voice, not ducked, out under the punchlines, the drop slams on the next line.
BED = os.environ.get('EDITOR_SONG') or f'{HOME}/music/song.m4a'
DROP_IN_SONG, DROP_AT = 43.5 + 58.0, 53.32      # the drop lands on "No."
t0 = DROP_IN_SONG - DROP_AT
music = np.zeros((N, 2), np.float32)
put(music, load(BED, ss=t0, to=t0 + TOTAL + 1), 0, fin=0.12)
env = np.ones(N, np.float32)


def ramp(a, b, va, vb):
    i, j = int(a * SR), int(b * SR)
    env[i:j] = np.linspace(va, vb, max(j - i, 1))


ramp(31.02, 31.12, 1, 0)                        # out for "Wait, what's happening?": the swell carries it
env[int(31.12 * SR):int(33.70 * SR)] = 0        # and stays out through the film burn
ramp(33.70, 33.78, 0, 1)
ramp(48.85, 49.25, 1, 0)                        # out for "lucky?" and the bass hit
env[int(49.25 * SR):int(DROP_AT * SR)] = 0      # back in full on the drop
ramp(67.6, 69.55, 1, 0)
# Two lines where the song's own notes sit close to the words: a small dip, not a duck
for a_, b_, g_ in [(41.95, 43.85, 0.75), (46.25, 48.75, 0.60)]:
    i_, j_ = int(a_ * SR), int(b_ * SR)
    k_ = int(0.12 * SR)
    env[i_:j_] *= g_
    env[i_ - k_:i_] *= np.linspace(1, g_, k_)
    env[j_:j_ + k_] *= np.linspace(g_, 1, k_)
env[int(69.55 * SR):] = 0
music *= env[:, None]
on = (0.5, 31.0)
music *= db(-20.5 - lufs(music, *on))           # 5.5 LU under the voice
for n_, a_, b_ in [('red', 0.5, 31.0), ('blue', 34.0, 48.8), ('teal', 53.4, 66.2)]:
    print(f'song in {n_}: {lufs(music, a_, b_):.1f} LUFS')

# ---- effects, on the moments he uses them
fx = np.zeros((N, 2), np.float32)
L = 4.0  # above his levels: these must read on a laptop
put(fx, S['real_cut'], 0.0, -3)                    # the video opens on a hit
put(fx, S['real_riser'][int(0.75 * SR):], 4.02, -5 + L)  # head pushes through the frame
put(fx, S['real_click'], 4.80, L)                  # Publish
put(fx, SH[0], 4.85, -4)
put(fx, S['real_ticks_a'], 4.98, L)                # count to 20,000
put(fx, S['real_cut'], 7.92, L)                    # first desk cut
put(fx, S['real_hit'], 10.47, -8)                  # EDITOR V1 pops
put(fx, S['real_riser'], 13.16, L)                 # riser into the head window
put(fx, S['real_ticks_b'], 16.20, L)               # count to 70,000
put(fx, S['real_cut'], 20.83, L)                   # desk cut
put(fx, S['real_hit'], 26.92, -5)                  # $0 pops
put(fx, S['real_ticks_c'], 28.62, L)               # count to 132,000
put(fx, S['real_swell'], 31.03, -2)                # bass swell under "what's happening"
put(fx, S['real_burn_in'], 32.72, L)               # film burn, then total silence
put(fx, S['real_burn_out'], 33.60, L)              # out of the black
put(fx, S['real_hit'], 36.40, -6)                  # EVEN BETTER pops
put(fx, S['real_typing'], 37.82, L, trim=2.62, fout=0.05)   # SPENT 1,000 CREDITS
put(fx, S['real_hit'], 40.44, -3)                  # blue pictures hit
put(fx, S['real_glitch'], 40.45, L, trim=1.55, fout=0.05)
put(fx, S['real_cut'], 44.68, -2)                  # blue desk shot
put(fx, S['real_typing'], 49.00, L, trim=1.98, fout=0.05)   # OR WERE THOSE VIEWS
put(fx, S['real_boom'], 51.04 - 0.62, 0, trim=2.84, fout=0.7)  # the hit lands as the screen goes black
put(fx, S['real_whoosh'], 52.98, L)                # into teal
put(fx, S['real_hit'], 57.85, -8)                  # Editor V2 burst
for k in range(14):
    put(fx, SH[k % 3], 57.85 + k / 12.5, -5)
put(fx, S['real_cut'], 58.96, -3)                  # back to the silhouette
put(fx, S['real_typing'], 60.48, L - 2, trim=0.74, fout=0.03)   # EDITOR V3 types
put(fx, S['real_whoosh'], 66.28, L - 1)            # the camera pans off
# Total silence in the black of the film burn: nothing but the tail of the burn
fx[int(32.98 * SR):int(33.60 * SR)] = 0



fx[int(32.98 * SR):int(33.60 * SR)] = 0
save(f'{STEMS}/voice.wav', voice)
save(f'{STEMS}/music.wav', music)
save(f'{STEMS}/fx.wav', fx)
mix = voice + music + fx
master = db(-14.0 - lufs(mix))
save('work/out/_mix.wav', mix * master)
print(f'voice {lufs(voice):.1f}, bed {lufs(music + fx):.1f}, mix {lufs(mix):.1f}, master gain {20 * np.log10(master):.1f} dB')
for a, b, l in [(0, 32.7, 'red'), (34, 48.8, 'blue'), (54, 66.2, 'teal')]:
    print(f'{l:5s} voice {lufs(voice, a, b):6.1f}  music+fx {lufs(music + fx, a, b):6.1f}  gap {lufs(voice, a, b) - lufs(music + fx, a, b):4.1f} dB')
if os.path.exists(PIC):
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', PIC, '-i', 'work/out/_mix.wav', '-filter_complex', '[1:a]alimiter=limit=0.89:level=disabled[a]',
                    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', OUT], check=True)
    print(OUT, round(os.path.getsize(OUT) / 1e6), 'MB')
