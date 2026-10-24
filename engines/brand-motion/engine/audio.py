"""Original score + sound design, generated from the storyboard so every hit lands on the picture.

  python audio.py story.json -o mix.wav

story fields used:  duration, bpm, key ("F", "A", "C#"...), mood (bright | dark | chill | epic)
  audio: { "music": true | false | "path/to/track.mp3", "voice": "vo.wav", "voice_offset": 0,
           "use_video_audio": true, "music_gain": 1.0, "sfx_gain": 1.0, "voice_gain": 1.0 }
Scenes supply cues (sound events) and an energy level per section (0 calm, 1 light, 2 groove, 3 full, 'build').
"""
import argparse, json, math, os, subprocess, sys, tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SR = 48000
rng = np.random.RandomState(7)
NOTE = {'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11}

def midi_f(m): return 440.0 * 2 ** ((m - 69) / 12)
def name_midi(name):
    i = 2 if len(name) > 2 and name[1] in 'b#' else 1
    return 12 * (int(name[i:]) + 1) + NOTE[name[:i]]
def tt(d): return np.arange(max(1, int(d * SR))) / SR

def lp(x, fc, order=2): return signal.sosfilt(signal.butter(order, min(fc, SR * 0.45), 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return signal.sosfilt(signal.butter(order, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2): return signal.sosfilt(signal.butter(order, [lo, min(hi, SR * 0.45)], 'band', fs=SR, output='sos'), x)

def sweep_filter(x, f0, f1, kind='low', block=512, curve=2.0):
    out = np.zeros_like(x); zi = None; nb = int(np.ceil(len(x) / block))
    for b in range(nb):
        k = (b / max(nb - 1, 1)) ** curve; fc = f0 * (f1 / f0) ** k
        sos = signal.butter(2, min(fc, SR * 0.45), kind, fs=SR, output='sos')
        if zi is None: zi = signal.sosfilt_zi(sos) * 0
        seg = x[b * block:(b + 1) * block]; y, zi = signal.sosfilt(sos, seg, zi=zi)
        out[b * block:b * block + len(seg)] = y
    return out

def saw(f, t, ph=0.0): x = (f * t + ph) % 1.0; return 2 * x - 1
def noise(d): return rng.randn(len(tt(d)))

def supersaw(f, d, voices=5, detune=0.010):
    t = tt(d); out = np.zeros((len(t), 2))
    for v in range(voices):
        dt = 1 + detune * (v - (voices - 1) / 2) / ((voices - 1) / 2)
        s = saw(f * dt, t, rng.rand()); pan = (v / (voices - 1)) * 2 - 1
        out[:, 0] += s * np.cos((pan + 1) * np.pi / 4); out[:, 1] += s * np.sin((pan + 1) * np.pi / 4)
    return out / voices

# ====================================================================== mixer
class Mix:
    def __init__(self, dur):
        self.N = int(SR * dur)
        self.music = np.zeros((self.N, 2)); self.sfx = np.zeros((self.N, 2)); self.post = np.zeros((self.N, 2))
        self.rev = np.zeros((self.N, 2)); self.sc = np.ones(self.N)
    def add(self, sig, t0, g=1.0, pan=0.0, rev=0.0, duck=False, bus='sfx'):
        i0 = int(t0 * SR)
        if i0 >= self.N or g == 0: return
        if sig.ndim == 1:
            L = np.cos((pan + 1) * np.pi / 4); R = np.sin((pan + 1) * np.pi / 4)
            st = np.stack([sig * L * 1.414, sig * R * 1.414], 1)
        else: st = sig
        if i0 < 0: st = st[-i0:]; i0 = 0
        m = min(len(st), self.N - i0)
        s = st[:m] * g
        if duck: s = s * self.sc[i0:i0 + m, None]
        getattr(self, bus)[i0:i0 + m] += s
        if rev: self.rev[i0:i0 + m] += s * rev

# ====================================================================== instruments
def kick(g=1.0):
    t = tt(0.42); f = 46 + 110 * np.exp(-t * 32)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    click = hp(rng.randn(len(t)), 3000) * np.exp(-t * 180) * 0.25
    return np.tanh((body + click) * 1.6) * g
def hat(d=0.05, open_=False):
    t = tt(0.3 if open_ else d); return hp(rng.randn(len(t)), 7500) * np.exp(-t * (14 if open_ else 70))
def clap():
    t = tt(0.4); s = bp(rng.randn(len(t)), 900, 4500); e = np.zeros_like(t)
    for o in (0, 0.011, 0.022): e += (t >= o) * np.exp(-np.maximum(t - o, 0) * (180 if o < 0.02 else 18))
    return s * e
def snare():
    t = tt(0.18); return bp(rng.randn(len(t)), 1200, 7000) * np.exp(-t * 25) + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 30) * 0.6
def pluck(f, d=0.32, bright=4000):
    t = tt(d)
    s = saw(f, t) * 0.6 + np.sign(np.sin(2 * np.pi * f * 1.002 * t)) * 0.25 + np.sin(2 * np.pi * f * t) * 0.5
    return lp(s * np.exp(-t * 11), bright) * np.minimum(1, t * 400)
def bass(f, d):
    t = tt(d); s = np.sin(2 * np.pi * f * t) + 0.35 * lp(saw(f, t), 600)
    return np.tanh(s * np.minimum(1, t * 200) * np.minimum(1, (d - t) * 60) * 1.3)
def plink(f, d=0.6):
    t = tt(d); fm = np.sin(2 * np.pi * f * 3.5 * t) * 2.0 * np.exp(-t * 12)
    return np.sin(2 * np.pi * f * t + fm) * np.exp(-t * 6) * np.minimum(1, t * 800)
def bell(f, d=2.5):
    t = tt(d); fm = np.sin(2 * np.pi * f * 1.4 * t) * 1.6 * np.exp(-t * 2.5)
    return (np.sin(2 * np.pi * f * t + fm) * np.exp(-t * 1.8) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)) * np.minimum(1, t * 600)
def bloop(f0, f1, d=0.12):
    t = tt(d); f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.minimum(t / d, 1)) ** 0.6
def boom(f0=70, f1=28, d=1.6):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.8)
def whoosh(d, f0, f1, peak=0.5):
    y = sweep_filter(noise(d), f0, f1, 'low', curve=1.0); t = tt(d)
    e = np.where(t < d * peak, (t / (d * peak)) ** 2, np.exp(-(t - d * peak) / (d * (1 - peak) / 3)))
    return y * e
def riser(d):
    t = tt(d); y = sweep_filter(noise(d), 200, 8000, 'low', curve=2.2)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 2 ** (3 * (t / d) ** 2)) / SR) * 0.3
    return (hp(y, 300) + tone) * (t / d) ** 2.5
def crash(d=2.4): t = tt(d); return hp(noise(d), 5000) * np.exp(-t * 1.9)
def tick(f=2400):
    t = tt(0.05); return np.sin(2 * np.pi * f * t) * np.exp(-t * 120) + hp(noise(0.05), 4000) * np.exp(-t * 300) * 0.4
def boing(f0, d=0.5):
    t = tt(d); f = f0 * (1 + 0.35 * np.exp(-t * 7) * np.sin(2 * np.pi * 14 * t)) * (1 + 0.5 * t)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * np.minimum(1, t * 500)
def stab(freqs, d=0.35, cut=3500):
    sig = np.zeros((len(tt(d)), 2))
    for f in freqs: sig += supersaw(f, d, 3, 0.008)
    t = tt(d); sig *= (np.exp(-t * 7) * np.minimum(1, t * 600))[:, None]
    sig[:, 0] = lp(sig[:, 0], cut); sig[:, 1] = lp(sig[:, 1], cut); return sig

# ====================================================================== cue -> sound
class SFX:
    def __init__(self, mix, transpose, gain=1.0):
        self.m = mix; self.tr = transpose; self.g = gain
    def f(self, note): return midi_f(name_midi(note) + self.tr)
    def play(self, t, name, kw):
        m = self.m; g = kw.get('g', 0.3) * self.g; pan = kw.get('pan', 0.0)
        bus = 'post' if kw.get('post') else 'sfx'
        A = lambda sig, gg=g, rev=0.3, p=pan, tt_=t: m.add(sig, tt_, gg, p, rev, bus=bus)
        if name == 'plink': A(plink(self.f(kw.get('note', 'C6')), kw.get('d', 0.6)), rev=0.6)
        elif name == 'bloop': A(bloop(kw.get('f0', 300), kw.get('f1', 900), kw.get('d', 0.12)), rev=0.5)
        elif name == 'boom': A(boom(kw.get('f0', 70), kw.get('f1', 28), kw.get('d', 1.6)), rev=0.0)
        elif name == 'whoosh': A(whoosh(kw.get('d', 0.4), kw.get('f0', 500), kw.get('f1', 7000), kw.get('peak', 0.5)), rev=0.3)
        elif name == 'whoosh_rev': A(whoosh(kw.get('d', 0.6), 400, 6000, 0.5)[::-1].copy(), rev=0.3)
        elif name == 'riser': A(riser(kw.get('d', 3.0)), rev=0.2)
        elif name == 'crash': A(crash(kw.get('d', 2.4)), rev=0.3)
        elif name == 'crash_rev': A(crash(kw.get('d', 0.5))[::-1].copy(), rev=0.0)
        elif name == 'tick': A(tick(kw.get('f', 2400)), rev=0.1)
        elif name == 'noise_hit': A(hp(noise(0.08), 1500) * np.exp(-tt(0.08) * 60), rev=0.1)
        elif name == 'kick': m.add(kick(0.75), t, 0.9 * self.g)
        elif name == 'splash': A(hp(noise(0.25), 2500) * np.exp(-tt(0.25) * 18), rev=0.2)
        elif name == 'boing': A(boing(kw.get('f', 220), kw.get('d', 0.6)), rev=0.3)
        elif name == 'stab': A(stab([self.f(n) for n in kw.get('notes', ['C5', 'E5', 'G5'])], kw.get('d', 0.35), kw.get('cut', 3500)), rev=0.3)
        elif name == 'pen':
            d = kw.get('d', 2.0); t_ = tt(d)
            A(bp(noise(d), 3000, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t_)) * np.sin(np.pi * t_ / d), rev=0.4)
        elif name == 'swish':
            d = kw.get('d', 1.0); t_ = tt(d); A(bp(noise(d), 1500, 6000) * np.sin(np.pi * t_ / d) ** 2, rev=0.2)
        elif name in ('plink_run', 'sparkle', 'pluck_run'):
            notes = ['F5', 'G5', 'A5', 'C6', 'D6', 'F6', 'G6', 'A6'] if name == 'plink_run' else ['C6', 'F6', 'A6', 'C7', 'E7']
            n = kw.get('n', 5); step = kw.get('step', 0.13 if name == 'sparkle' else 0.05)
            for i in range(n):
                sig = pluck(self.f(notes[i % len(notes)]), 0.2, 6000) if name == 'pluck_run' else plink(self.f(notes[i % len(notes)]), 0.5)
                m.add(sig, t + i * step, g, ((i % 5) - 2) / 3, 0.7, bus=bus)
        elif name == 'slide_whistle':
            t_ = tt(0.5); f = 1700 * 0.25 ** (t_ / 0.5); A(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t_ / 0.5), rev=0.4)
        elif name == 'squeeze': A(bp(noise(0.18), 600, 2400) * np.sin(np.pi * tt(0.18) / 0.18), rev=0.1)
        elif name == 'shimmer':
            for i, n in enumerate(['F5', 'A5', 'C6', 'E6', 'G6']): m.add(bell(self.f(n), 3.0), t + i * 0.04, g, (i - 2) * 0.3, 0.7, bus=bus)
        elif name == 'chime':
            for i, n in enumerate(['A6', 'C7']): m.add(bell(self.f(n), 1.6), t + i * 0.08, g, 0, 0.7, bus=bus)
        elif name == 'pop_sparkle':
            m.add(bloop(900, 2200, 0.04), t, g, 0, 0.6, bus=bus)
            for i, n in enumerate(['C7', 'E7', 'G7', 'C8', 'G7', 'E7']): m.add(plink(self.f(n), 0.4), t + 0.02 + i * 0.03, g * 0.06, (i - 3) / 3, 0.7, bus=bus)
        elif name == 'bloom':
            for i, n in enumerate(['F3', 'C4', 'A4', 'E5', 'G5', 'C6']): m.add(bell(self.f(n), 2.4), t + i * 0.03, g, (i - 3) * 0.25, 0.6, bus=bus)

# ====================================================================== music
PROGS = {   # scale degrees (0 = tonic) and chord size; 8-bar loops
    'bright': ('major', [(0, 4), (0, 5), (5, 5), (3, 4), (4, 4), (5, 4), (3, 4), (4, 4)]),
    'dark':   ('minor', [(0, 4), (5, 4), (2, 4), (6, 4), (3, 4), (5, 4), (6, 4), (4, 3)]),
    'chill':  ('major', [(0, 4), (2, 4), (5, 4), (3, 4), (0, 4), (2, 4), (3, 4), (4, 4)]),
    'epic':   ('minor', [(0, 3), (5, 3), (2, 3), (6, 3), (0, 3), (5, 3), (2, 3), (6, 3)]),
}
SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10]}

def chord(root_midi, scale, deg, size):
    sc = SCALES[scale]
    out = []
    for k in range(size):
        d = deg + 2 * k; out.append(root_midi + sc[d % 7] + 12 * (d // 7))
    while out[0] > root_midi + 9: out = [n - 12 for n in out]
    return out

def energy_at(sections, t):
    e = 0
    for s0, s1, en in sections:
        if s0 <= t < s1: e = en
    return e

def build_music(mix, story, sections, root, scale, prog, kicks_extra):
    bpm = float(story.get('bpm', 120)); beat = 60 / bpm; bar = 4 * beat
    dur = mix.N / SR; nbars = int(math.ceil(dur / bar))
    mood = story.get('mood', 'bright')
    def E(t): return energy_at(sections, t)
    def lvl(t):
        e = E(t); return 2.5 if e == 'build' else float(e)
    # kicks first so the sidechain is ready
    kicks = set(round(k, 3) for k in kicks_extra)
    t = 0.0
    while t < dur - 1e-6:
        e = E(t); bi = round(t / beat) % 4
        if e in (2, 3): kicks.add(round(t, 3))
        t += beat
    for k in sorted(kicks):
        mix.add(kick(0.95 if lvl(k) >= 2.5 else 0.75), k, 0.9, bus='music')
        i0 = int(k * SR); L = int(0.3 * SR); n = max(0, min(L, mix.N - i0))
        dk = 1 - 0.72 * np.exp(-np.arange(L) / SR * 9) * (1 - np.exp(-np.arange(L) / SR * 400))
        mix.sc[i0:i0 + n] = np.minimum(mix.sc[i0:i0 + n], dk[:n])
    for b in range(nbars):
        t0 = b * bar
        deg, size = prog[b % len(prog)]
        notes = chord(root, scale, deg, size)
        L = lvl(t0)
        # pad
        d = bar * 1.3
        sig = np.zeros((len(tt(d)), 2))
        for nn in notes: sig += supersaw(midi_f(nn), d, 5, 0.010)
        t_ = tt(d); a = 1.4 if b == 0 else 0.35
        env = np.minimum(1, t_ / a) * np.clip((d - t_) / (bar * 0.35), 0, 1)
        sig *= env[:, None]
        cut = 700 + 500 * L + (900 if E(t0) == 'build' else 0)
        sig[:, 0] = lp(sig[:, 0], cut); sig[:, 1] = lp(sig[:, 1], cut)
        mix.add(sig, t0, 0.10 + 0.015 * L, rev=0.35, duck=L >= 2, bus='music')
        # bass
        r = root - 12 + SCALES[scale][deg % 7]
        for q in range(8):
            tq = t0 + q * beat / 2; Lq = lvl(tq); Eq = E(tq)
            if tq >= dur: break
            if Eq == 'build':
                if q == 0: mix.add(bass(midi_f(r), bar) * np.exp(-tt(bar) * 0.8), tq, 0.08, bus='music')
            elif Lq >= 2:
                if q % 2 == 1: mix.add(bass(midi_f(r), beat / 2 * 0.9), tq, 0.40, duck=True, bus='music')
                elif Lq >= 3: mix.add(bass(midi_f(r - 12), beat / 2 * 0.8), tq + 0.02, 0.18, bus='music')
            elif Lq >= 1 and q % 2 == 0:
                mix.add(bass(midi_f(r), beat * 0.85), tq, 0.26, bus='music')
        # arp
        order = [0, 1, 2, 3, 2, 1, 3, 2]
        steps = 8 if L < 2.5 else 16
        for q in range(steps):
            tq = t0 + q * bar / steps; Lq = lvl(tq)
            if tq >= dur or Lq < 1: continue
            if mood == 'chill' and q % 2: continue
            nn = notes[order[q % 8] % len(notes)] + (24 if Lq >= 2.5 else 12)
            mix.add(pluck(midi_f(nn), bright=3800 + 800 * Lq), tq, 0.055 + 0.01 * Lq, pan=0.5 * math.sin(q * 1.3), rev=0.35, duck=True, bus='music')
        # drums
        for q in range(8):
            tq = t0 + q * beat / 2; Eq = E(tq)
            if tq >= dur: break
            if Eq in (2, 3):
                mix.add(hat(open_=(Eq == 3 and q % 4 == 2)), tq, 0.12 if q % 2 else 0.065, pan=0.25 * (1 if q % 2 else -1), bus='music')
                if q in (2, 6): mix.add(clap(), tq, 0.42 if Eq == 3 else 0.32, rev=0.28, bus='music')
    # snare rolls on build sections
    for s0, s1, en in sections:
        if en != 'build': continue
        t = s0; inh = s1 - 0.5
        while t < inh:
            k = (t - s0) / max(inh - s0, 0.1)
            step = beat / 2 if k < 0.55 else (beat / 4 if k < 0.85 else beat / 8)
            mix.add(snare(), t, 0.08 + 0.32 * k, rev=0.2, bus='music'); t += step

# ====================================================================== io helpers
def load_audio(path, offset=0.0, dur=None):
    tmp = tempfile.mktemp(suffix='.wav')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error']
    if offset > 0: cmd += ['-ss', str(offset)]
    cmd += ['-i', path, '-vn', '-ac', '2', '-ar', str(SR)]
    if dur: cmd += ['-t', str(dur)]
    cmd += ['-c:a', 'pcm_s16le', tmp]
    r = subprocess.run(cmd)
    if r.returncode != 0 or not os.path.exists(tmp): return None
    sr, x = wavfile.read(tmp); os.remove(tmp)
    x = x.astype(np.float64) / 32768.0
    return x if x.ndim == 2 else np.stack([x, x], 1)

def envelope(x, win=0.08):
    m = np.abs(x).mean(1)
    k = int(win * SR); e = np.convolve(m, np.ones(k) / k, mode='same')
    return e / (e.max() + 1e-9)

def build(story_path, out):
    from timeline import load_story, Timeline, rel
    story = load_story(story_path); tl = Timeline(story)
    dur = float(story['duration'])
    cfg = story.get('audio', {})
    key = story.get('key', 'F'); mood = story.get('mood', 'bright')
    scale, prog = PROGS.get(mood, PROGS['bright'])
    root = 48 + NOTE[key]
    if root > 55: root -= 12
    transpose = NOTE[key] - NOTE['F']
    if transpose > 6: transpose -= 12
    mix = Mix(dur)
    cues = tl.cues()
    music_cfg = cfg.get('music', True)
    if music_cfg is True:
        kicks = [t for t, n, kw in cues if n == 'kick']
        build_music(mix, story, tl.sections(), root, scale, prog, kicks)
    elif isinstance(music_cfg, str):
        trk = load_audio(rel(story, music_cfg), float(cfg.get('music_offset', 0)), dur)
        if trk is not None: mix.music[:len(trk)] += trk[:mix.N] * 0.6
    sfx = SFX(mix, transpose, float(cfg.get('sfx_gain', 1.0)))
    for t, n, kw in cues:
        if n == 'kick' and music_cfg is True: continue
        sfx.play(t, n, kw)
    # inhale before a drop: everything but 'post' sounds dips
    g = np.ones(mix.N)
    for s in tl.main:
        if s.energy == 'build' and s.p('inhale', 0.5) > 0:
            a, b = int((s.end - s.p('inhale', 0.5)) * SR), int(s.end * SR); r = int(0.03 * SR)
            g[a:b] = 0.12; g[max(0, a - r):a] = np.linspace(1, 0.12, a - max(0, a - r))
    # reverb
    def ir(d=2.4, decay=2.6):
        t = tt(d); L = lp(rng.randn(len(t)) * np.exp(-t * decay), 6000); R = lp(rng.randn(len(t)) * np.exp(-t * decay), 6000)
        pre = np.zeros(int(0.018 * SR)); L = np.concatenate([pre, L]); R = np.concatenate([pre, R])
        return L / np.sqrt(np.sum(L ** 2)), R / np.sqrt(np.sum(R ** 2))
    irL, irR = ir()
    wet = np.stack([hp(signal.fftconvolve(mix.rev[:, 0], irL)[:mix.N], 180), hp(signal.fftconvolve(mix.rev[:, 1], irR)[:mix.N], 180)], 1)
    music = mix.music * float(cfg.get('music_gain', 1.0))
    sfx_bus = mix.sfx + wet * 0.55
    # voice: a voiceover file, or the base video's own sound
    voice = None
    vpath = cfg.get('voice')
    if vpath: voice = load_audio(rel(story, vpath), 0, None)
    elif story.get('base', {}).get('video') and cfg.get('use_video_audio', True):
        voice = load_audio(rel(story, story['base']['video']), float(story['base'].get('offset', 0)), dur)
    vbus = np.zeros((mix.N, 2))
    if voice is not None:
        o = int(float(cfg.get('voice_offset', 0)) * SR); n = max(0, min(len(voice), mix.N - o))
        v = voice[:n]
        v = np.stack([hp(v[:, 0], 80), hp(v[:, 1], 80)], 1)
        vr = np.sqrt(np.mean(v ** 2)) + 1e-9
        vbus[o:o + n] = v * (10 ** (-15 / 20) / vr) * float(cfg.get('voice_gain', 1.0))
        env = envelope(vbus)
        duck = 1 - 0.55 * np.clip(env * 3, 0, 1)
        duck = signal.lfilter([0.002], [1, -0.998], duck)
        music = music * 0.26 * duck[:, None]
        sfx_bus = sfx_bus * 0.5
    bed = (music + sfx_bus) * g[:, None] + mix.post
    if voice is not None:
        speech = envelope(vbus) > 0.15
        if speech.any():
            snr = 10 * np.log10(np.mean(vbus[speech] ** 2) / (np.mean(bed[speech] ** 2) + 1e-12))
            print(f'voice clarity: voice sits {snr:.1f} dB above music+sfx while speaking (aim for 8-14; raise voice_gain or lower music_gain/sfx_gain if under 8)')
    out_mix = bed + vbus
    out_mix = np.stack([hp(out_mix[:, 0], 28), hp(out_mix[:, 1], 28)], 1)
    rms = np.sqrt(signal.lfilter([0.002], [1, -0.998], np.mean(out_mix ** 2, 1)) + 1e-9)
    gain = np.where(rms > 0.18, (0.18 / rms) ** 0.45, 1.0); gain = signal.lfilter([0.01], [1, -0.99], gain)
    out_mix *= gain[:, None]
    rm = np.sqrt(np.mean(out_mix ** 2)) + 1e-9
    out_mix *= 10 ** (-15.5 / 20) / rm
    out_mix = np.tanh(out_mix * 1.25) / 1.25
    fi = int(0.02 * SR); out_mix[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(max(0, dur - 0.8) * SR); out_mix[fo:] *= np.linspace(1, 0, mix.N - fo)[:, None] ** 1.5
    out_mix = out_mix / (np.max(np.abs(out_mix)) + 1e-9) * 0.93
    wavfile.write(out, SR, (out_mix * 32767).astype(np.int16))
    print('wrote', out, f'({len(cues)} sound cues)')

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('story'); ap.add_argument('-o', '--out', default='mix.wav')
    a = ap.parse_args(); build(a.story, a.out)
