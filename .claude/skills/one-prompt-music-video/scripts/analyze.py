"""Analyse a song for the music-video engine → <project>/data/audio.json (+ song.wav / song.mp3 / vocals.wav).

  python analyze.py --song my_song.mp3 --lyrics LYRICS.md --project ~/music-videos/my-video [--bpm 100] [--no-demucs]

What it computes (all at 30 fps, all local, $0):
  1. song.wav (48 kHz) + song.mp3 for the live player
  2. vocal / instrumental stems with Demucs (htdemucs) — used for lip-sync and lyric timing
  3. beat grid (librosa), downbeats (4/4 phase with the strongest kicks), drum events: kick / snare / hat / perc
  4. per-frame envelopes (rms, low, mid, high, vocal, kick, snare, hat, perc), 32-band spectra of mix and vocal
  5. lip-sync vowel shapes from the vocal formants: open (F1), wide "ee" (F2 high), round "oo" (F2 low), sss
  6. lyric timing: Whisper word timestamps on the vocal stem (20 s chunks), then the written lyrics are aligned to
     the heard words (difflib), unmatched words interpolated. Writes data/lyrics_timing.txt to review by hand.
Run it with the skill's venv: ~/.one-prompt-mv/venv/bin/python
"""
import argparse, difflib, json, os, re, subprocess, sys, tempfile, shutil
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, stft

FPS = 30
STOP = set('a an the and or but i i\'m it it\'s is are was to of in on at for with you your me my we our they them he she his her this that so just now yeah oh no not be do don\'t'.split())


def run(cmd):
    print('$', ' '.join(cmd), flush=True)
    subprocess.run(cmd, check=True)


def load_mono(path, sr_target=None):
    x, sr = sf.read(path, always_2d=True)
    x = x.mean(axis=1).astype(np.float32)
    if sr_target and sr != sr_target:
        from scipy.signal import resample_poly
        from math import gcd
        g = gcd(sr, sr_target); x = resample_poly(x, sr_target // g, sr // g).astype(np.float32); sr = sr_target
    return x, sr


# ---------------------------------------------------------------- stems
def separate(song_wav, data_dir, use_demucs=True):
    voc, inst = os.path.join(data_dir, 'vocals.wav'), os.path.join(data_dir, 'no_vocals.wav')
    if os.path.exists(voc) and os.path.exists(inst):
        print('stems: reusing', voc); return voc, inst
    if use_demucs:
        try:
            tmp = tempfile.mkdtemp(prefix='demucs-')
            dev = 'cpu'
            try:
                import torch
                if torch.backends.mps.is_available(): dev = 'mps'
                elif torch.cuda.is_available(): dev = 'cuda'
            except Exception: pass
            run([sys.executable, '-m', 'demucs', '--two-stems=vocals', '-n', 'htdemucs', '-d', dev, '-o', tmp, song_wav])
            base = os.path.splitext(os.path.basename(song_wav))[0]
            shutil.copy(os.path.join(tmp, 'htdemucs', base, 'vocals.wav'), voc)
            shutil.copy(os.path.join(tmp, 'htdemucs', base, 'no_vocals.wav'), inst)
            shutil.rmtree(tmp, ignore_errors=True)
            return voc, inst
        except Exception as e:
            print('WARNING demucs failed, using the full mix for vocals:', e)
    shutil.copy(song_wav, voc); shutil.copy(song_wav, inst)
    return voc, inst


# ---------------------------------------------------------------- rhythm
def rhythm(inst_path, bpm_hint):
    import librosa
    y, sr = librosa.load(inst_path, sr=22050, mono=True)
    _, yp = librosa.effects.hpss(y)
    hop = 256
    env = librosa.onset.onset_strength(y=yp, sr=sr, hop_length=hop)
    tempo, beats = librosa.beat.beat_track(onset_envelope=env, sr=sr, hop_length=hop, start_bpm=bpm_hint or 110, tightness=120 if bpm_hint else 100, units='time')
    tempo = float(np.atleast_1d(tempo)[0])

    def band_onsets(lo, hi, sig, wait_s, k):
        if lo <= 0: sos = butter(4, hi, btype='low', fs=sr, output='sos')
        elif hi >= sr / 2 - 1: sos = butter(4, lo, btype='high', fs=sr, output='sos')
        else: sos = butter(4, [lo, hi], btype='band', fs=sr, output='sos')
        f = sosfilt(sos, sig).astype(np.float32)
        e = librosa.onset.onset_strength(y=f, sr=sr, hop_length=hop, n_mels=32)
        e = e / (np.percentile(e, 99.5) + 1e-9)
        pk = librosa.util.peak_pick(e, pre_max=3, post_max=3, pre_avg=12, post_avg=12, delta=k, wait=int(wait_s * sr / hop))
        return [round(float(p * hop / sr), 3) for p in pk]

    kick = band_onsets(0, 140, yp, 0.18, 0.28)
    snare = band_onsets(180, 3500, yp, 0.12, 0.33)
    hat = band_onsets(7000, sr / 2, y, 0.07, 0.22)
    perc = [t for t in band_onsets(2500, 6500, yp, 0.1, 0.3) if all(abs(t - s) > 0.05 for s in snare[:]) ]
    # downbeat phase: the 4/4 phase whose beats carry the most kick energy
    kick_env = np.zeros(len(env)); [kick_env.__setitem__(min(len(env) - 1, int(t * sr / hop)), 1) for t in kick]
    kick_env = np.convolve(kick_env, np.ones(5), 'same')
    scores = []
    for p in range(4):
        idx = [min(len(env) - 1, int(b * sr / hop)) for b in beats[p::4]]
        scores.append(sum(kick_env[i] + env[i] * 0.2 for i in idx))
    phase = int(np.argmax(scores))
    downbeats = [round(float(b), 3) for b in beats[phase::4]]
    return {'bpm': round(tempo, 1), 'beats': [round(float(b), 3) for b in beats], 'downbeats': downbeats,
            'events': {'kick': kick, 'snare': snare, 'hat': hat, 'perc': perc}}


# ---------------------------------------------------------------- per-frame features (same as the ONE PROMPT build)
def features(mix, voc, sr, dur):
    NF = int(round(dur * FPS)); hop = sr / FPS

    def frames_rms(x, sos=None):
        if sos is not None: x = sosfilt(sos, x)
        out = np.zeros(NF, np.float32); win = int(hop * 1.5)
        for i in range(NF):
            c = int(i * hop); seg = x[max(0, c - win // 2): c + win // 2]
            out[i] = np.sqrt(np.mean(seg * seg)) if len(seg) else 0
        return out

    def norm(v, pct=99.0):
        return np.clip(v / (np.percentile(v, pct) + 1e-9), 0, 1)

    def smooth_ar(v, att=0.6, rel=0.12):
        o = np.zeros_like(v); s = 0.0
        for i, x in enumerate(v): s += (x - s) * (att if x > s else rel); o[i] = s
        return o

    bp = lambda lo, hi: butter(4, [lo, hi], btype='band', fs=sr, output='sos')
    env = dict(
        rms=norm(frames_rms(mix)), low=norm(frames_rms(mix, butter(4, 150, btype='low', fs=sr, output='sos'))),
        mid=norm(frames_rms(mix, bp(400, 2500))), high=norm(frames_rms(mix, butter(4, 6000, btype='high', fs=sr, output='sos'))))
    vocal = norm(frames_rms(voc), 98.5); vocal = np.where(vocal < 0.06, 0, vocal); env['vocal'] = vocal

    def band_spectrum(x, nb=32, lo=40, hi=14000):
        n = 2048
        f, _, Z = stft(x, fs=sr, nperseg=n, noverlap=n - int(hop), boundary=None, padded=False)
        mag = np.abs(Z); edges = np.geomspace(lo, hi, nb + 1)
        cols = np.clip(((np.arange(NF) * hop - n / 2) / int(hop)).round().astype(int), 0, mag.shape[1] - 1)
        out = np.zeros((NF, nb), np.float32)
        for b in range(nb):
            m = (f >= edges[b]) & (f < edges[b + 1])
            band = mag[m, :].mean(axis=0) if m.any() else mag[np.argmin(np.abs(f - edges[b])), :]
            out[:, b] = band[cols]
        out = 20 * np.log10(out + 1e-6)
        for b in range(nb):
            c = out[:, b]; lo_, hi_ = np.percentile(c, 20), np.percentile(c, 99.5)
            out[:, b] = np.clip((c - lo_) / (hi_ - lo_ + 1e-6), 0, 1)
        return out, f, mag, cols

    spec_mix, _, _, _ = band_spectrum(mix)
    spec_voc, fv, magv, colsv = band_spectrum(voc)
    be = lambda lo, hi: magv[(fv >= lo) & (fv < hi), :].sum(axis=0)[colsv]
    e_f1, e_lo, e_hi, e_sib, tot = be(250, 1000), be(700, 1300), be(1700, 3200), be(4500, 10000), be(80, 10000) + 1e-9
    voiced = vocal > 0.08
    if voiced.sum() < 10: voiced = vocal >= 0
    op = norm(np.sqrt(e_f1 / tot) * vocal, 97)
    ratio = np.log((e_hi + 1e-9) / (e_lo + 1e-9))
    r = (ratio - np.percentile(ratio[voiced], 10)) / (np.percentile(ratio[voiced], 90) - np.percentile(ratio[voiced], 10) + 1e-9)
    env['open'] = smooth_ar(op, 0.7, 0.35)
    env['wide'] = smooth_ar(np.clip(r, 0, 1) * (vocal > 0.05), 0.5, 0.3)
    env['round'] = smooth_ar(np.clip(1 - r, 0, 1) * (vocal > 0.05), 0.5, 0.3)
    env['sss'] = smooth_ar(norm(e_sib / tot, 97) * (vocal > 0.03), 0.8, 0.4)
    return env, spec_mix, spec_voc, NF


def drum_env(times, NF, decay):
    o = np.zeros(NF, np.float32)
    for t in times:
        i0 = int(round(t * FPS))
        for k in range(int(decay * FPS * 4)):
            if 0 <= i0 + k < NF: o[i0 + k] = max(o[i0 + k], np.exp(-k / (decay * FPS)))
    return o


# ---------------------------------------------------------------- lyrics
def parse_lyrics(path):
    lines, section = [], 'verse'
    if not path or not os.path.exists(path): return lines
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'```(.*?)```', txt, re.S)   # LYRICS.md with a fenced block
    if m: txt = m.group(1)
    for raw in txt.splitlines():
        s = raw.strip()
        if not s: continue
        sec = re.match(r'^\[(.+?)\]$', s)
        if sec: section = sec.group(1).strip().lower(); continue
        if s.startswith('#'): continue
        words = [w for w in re.split(r'\s+', s.replace('(', '').replace(')', '')) if w]
        if words: lines.append({'section': section, 'text': s, 'words': words})
    return lines


def norm_word(w):
    w = w.lower().replace('’', "'")
    w = re.sub(r"[^a-z0-9']", '', w)
    return re.sub(r'(.)\1+', r'\1', w)


def whisper_words(voc_path, dur, english=True):
    """Word timestamps on the vocal stem: 20 s chunks, then any long hole in the transcript where the vocal is
    clearly active is re-transcribed in short 8 s windows (dense music makes Whisper skip whole chunks)."""
    from faster_whisper import WhisperModel
    x, sr = load_mono(voc_path, 16000)
    model = WhisperModel('small.en' if english else 'small', device='cpu', compute_type='int8')

    def transcribe(t0, t1):
        a, b = int(t0 * sr), int(min(dur, t1) * sr)
        segs, _ = model.transcribe(x[a:b], word_timestamps=True, beam_size=5, condition_on_previous_text=False, vad_filter=False)
        return [{'w': w.word.strip(), 's': round(w.start + t0, 3), 'e': round(w.end + t0, 3), 'p': round(w.probability, 3)} for sg in segs for w in sg.words]

    def merge(base, extra):
        allw = sorted(base + extra, key=lambda w: w['s']); out = []
        for w in allw:
            if out and w['s'] < out[-1]['e'] - 0.05: continue
            out.append(w)
        return out

    words, t = [], 0.0
    while t < dur:
        words = merge(words, transcribe(t, t + 22.0)); t += 20.0
        print(f'  whisper {min(t, dur):.0f}/{dur:.0f}s', flush=True)
    # holes: > 6 s without words while the vocal stem is active
    hop = sr // 10
    rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2)) for i in range(0, len(x), hop)])
    active = rms > np.percentile(rms, 60) * 0.5
    edges = [0.0] + [w['s'] for w in words] + [dur]
    for a, b in zip(edges[:-1], edges[1:]):
        if b - a < 6: continue
        if active[int(a * 10):int(b * 10)].mean() < 0.3: continue
        print(f'  retry {a:.1f}-{b:.1f}s in short windows', flush=True)
        extra, w0 = [], a
        while w0 < b:
            extra += [w for w in transcribe(w0, w0 + 8.0) if a - 0.1 < w['s'] < b]; w0 += 6.0
        words = merge(words, extra)
    return words


def align(lines, heard, dur, vocal=None):
    """Align written lyrics to Whisper's heard words. Strong anchors = runs of ≥3 matching words; short runs are
    kept only if they fall inside the time window allowed by the strong anchors around them. Unmatched words are
    spread over the frames where the vocal is actually active (not just linearly in time)."""
    if not lines:  # no lyrics given: use what Whisper heard, one line per ~6 words
        lines = []
        for i in range(0, len(heard), 6):
            ch = heard[i:i + 6]; lines.append({'section': 'verse', 'text': ' '.join(w['w'] for w in ch), 'words': [w['w'] for w in ch]})
    flat = [(li, wi, norm_word(w)) for li, L in enumerate(lines) for wi, w in enumerate(L['words'])]
    hw = [norm_word(w['w']) for w in heard]
    times = [None] * len(flat)
    blocks = [b for b in difflib.SequenceMatcher(a=[f[2] for f in flat], b=hw, autojunk=False).get_matching_blocks() if b.size]
    for blk in blocks:
        if blk.size >= 3:
            for k in range(blk.size): times[blk.a + k] = heard[blk.b + k]['s']
    strong = [i for i, t in enumerate(times) if t is not None]
    for blk in blocks:
        if blk.size >= 3: continue
        for k in range(blk.size):
            i, t = blk.a + k, heard[blk.b + k]['s']
            p = max([j for j in strong if j < i], default=None); n = min([j for j in strong if j > i], default=None)
            lo = times[p] if p is not None else 0.0; hi = times[n] if n is not None else dur
            # plausible window: within the anchors, and not absurdly far from a linear guess
            if lo < t < hi:
                guess = lo + (hi - lo) * ((i - (p if p is not None else -1)) / ((n if n is not None else len(flat)) - (p if p is not None else -1)))
                if abs(t - guess) < max(2.5, 0.35 * (hi - lo)): times[i] = t
    # fuzzy pass for near-misses inside gaps
    for i, (li, wi, w) in enumerate(flat):
        if times[i] is not None or len(w) < 3: continue
        prev = max([j for j in range(i) if times[j] is not None], default=None)
        nxt = min([j for j in range(i + 1, len(flat)) if times[j] is not None], default=None)
        lo = times[prev] if prev is not None else 0.0
        hi = times[nxt] if nxt is not None else dur
        cands = [h for h in heard if lo < h['s'] < hi]
        best = max(cands, key=lambda h: difflib.SequenceMatcher(a=w, b=norm_word(h['w'])).ratio(), default=None)
        if best and difflib.SequenceMatcher(a=w, b=norm_word(best['w'])).ratio() > 0.75: times[i] = best['s']
    last = -1.0
    for i in range(len(times)):
        if times[i] is not None and times[i] <= last: times[i] = None
        elif times[i] is not None: last = times[i]
    matched = sum(t is not None for t in times)
    # vocal-activity warp: cumulative "voiced" time, so gap words land where someone is singing
    if vocal is not None and len(vocal):
        act = (np.asarray(vocal) > 0.12).astype(float) + 0.02
        cum = np.concatenate([[0], np.cumsum(act)])  # per frame
        V = lambda t: np.interp(t * FPS, np.arange(len(cum)), cum)
        Vinv = lambda v: float(np.interp(v, cum, np.arange(len(cum)))) / FPS
    else:
        V = lambda t: t; Vinv = lambda v: v
    known = [i for i, t in enumerate(times) if t is not None]
    i = 0
    while i < len(times):
        if times[i] is not None: i += 1; continue
        j = i
        while j < len(times) and times[j] is None: j += 1
        a = times[i - 1] if i > 0 else 0.0
        b = times[j] if j < len(times) else dur
        va, vb, n = V(a), V(b), j - i
        for k in range(n):
            frac = (k + (1 if i > 0 else 0.5)) / (n + (1 if i > 0 else 0.5) + (0 if j < len(times) else -0.5))
            times[i + k] = min(b - 0.05, max(a + 0.05 if i > 0 else 0.0, Vinv(va + (vb - va) * frac)))
        i = j
    out = []
    for li, L in enumerate(lines):
        ws = [{'w': L['words'][wi], 't': round(float(times[k]), 2)} for k, (a2, wi, _) in enumerate(flat) if a2 == li]
        content = [w['w'] for w in ws if norm_word(w['w']) not in STOP] or [w['w'] for w in ws]
        key = max(content, key=lambda w: len(norm_word(w)))
        out.append({'section': L['section'], 'text': L['text'], 'start': ws[0]['t'], 'end': None, 'key': re.sub(r"[^\w.' ]", '', key), 'words': ws})
    for i, L in enumerate(out):
        nxt = out[i + 1]['start'] if i + 1 < len(out) else dur
        L['end'] = round(min(nxt, L['words'][-1]['t'] + 0.9), 2)
    return out, matched, len(flat)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--song', required=True); ap.add_argument('--lyrics'); ap.add_argument('--project', required=True)
    ap.add_argument('--bpm', type=float); ap.add_argument('--no-demucs', action='store_true'); ap.add_argument('--no-whisper', action='store_true')
    ap.add_argument('--language', default='en')
    a = ap.parse_args()
    data = os.path.join(os.path.expanduser(a.project), 'data'); os.makedirs(data, exist_ok=True)
    song_wav, song_mp3 = os.path.join(data, 'song.wav'), os.path.join(data, 'song.mp3')
    src = os.path.abspath(os.path.expanduser(a.song))
    if src != os.path.abspath(song_wav): run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src, '-ar', '48000', '-ac', '2', song_wav])
    if src != os.path.abspath(song_mp3): run(['ffmpeg', '-loglevel', 'error', '-y', '-i', song_wav, '-b:a', '256k', song_mp3])
    mix, sr = load_mono(song_wav); dur = round(len(mix) / sr, 3)
    print(f'song: {dur:.2f}s')
    voc_p, inst_p = separate(song_wav, data, not a.no_demucs)
    voc, _ = load_mono(voc_p, sr)
    if len(voc) < len(mix): voc = np.pad(voc, (0, len(mix) - len(voc)))
    print('rhythm…', flush=True); R = rhythm(inst_p, a.bpm)
    print(f"  bpm {R['bpm']} · {len(R['beats'])} beats · kick {len(R['events']['kick'])} snare {len(R['events']['snare'])} hat {len(R['events']['hat'])} perc {len(R['events']['perc'])}")
    print('features…', flush=True); env, spec_mix, spec_voc, NF = features(mix, voc[:len(mix)], sr, dur)
    for k, d in (('kick', 0.16), ('snare', 0.14), ('hat', 0.07), ('perc', 0.1)): env[k] = drum_env(R['events'][k], NF, d)
    lines = parse_lyrics(a.lyrics)
    if a.no_whisper: heard = []
    else:
        print('whisper (lyric timing)…', flush=True); heard = whisper_words(voc_p, dur, a.language.startswith('en'))
    json.dump(heard, open(os.path.join(data, 'whisper_words.json'), 'w'))
    lyr, matched, total = align(lines, heard, dur, env['vocal']) if (lines or heard) else ([], 0, 0)
    q = lambda v: [int(round(float(x) * 255)) for x in np.clip(v, 0, 1)]
    out = {'fps': FPS, 'duration': dur, 'nFrames': NF, 'bpm': R['bpm'], 'beats': R['beats'], 'downbeats': R['downbeats'],
           'events': R['events'], 'rolls': [], 'env': {k: q(v) for k, v in env.items()},
           'specMix': [q(r) for r in spec_mix], 'specVoc': [q(r) for r in spec_voc], 'lyrics': lyr}
    json.dump(out, open(os.path.join(data, 'audio.json'), 'w'), separators=(',', ':'))
    with open(os.path.join(data, 'lyrics_timing.txt'), 'w') as f:
        f.write(f'# {matched}/{total} lyric words matched to what Whisper heard; the rest are interpolated.\n')
        f.write('# Fix any wrong time in data/audio.json → lyrics[].words[].t (and the line start/end), or re-run with a cleaner vocal.\n')
        for L in lyr: f.write(f"{L['start']:7.2f}-{L['end']:7.2f} [{L['section']}] key={L['key']:<12} " + ' '.join(f"{w['w']}@{w['t']:.2f}" for w in L['words']) + '\n')
    print(f"wrote {os.path.join(data, 'audio.json')} · {dur:.1f}s · {NF} frames · lyrics {len(lyr)} lines, {matched}/{total} words matched")
    try:
        from PIL import Image, ImageDraw
        Wd, rowh, secs = 1800, 90, 15; rows = int(np.ceil(dur / secs))
        im = Image.new('RGB', (Wd, rows * rowh), (250, 248, 240)); d = ImageDraw.Draw(im)
        for rI in range(rows):
            y0 = rI * rowh
            for i in range(int(rI * secs * FPS), min(NF, int((rI + 1) * secs * FPS))):
                x = (i / FPS - rI * secs) / secs * Wd
                d.line([(x, y0 + rowh - 10), (x, y0 + rowh - 10 - env['vocal'][i] * 60)], fill=(40, 60, 140))
                d.line([(x, y0 + 10), (x, y0 + 10 + env['kick'][i] * 12)], fill=(220, 40, 60))
            for L in lyr:
                if rI * secs <= L['start'] < (rI + 1) * secs:
                    x = (L['start'] - rI * secs) / secs * Wd; d.line([(x, y0), (x, y0 + rowh)], fill=(0, 150, 0), width=2); d.text((x + 3, y0 + 40), L['text'][:28], fill=(0, 100, 0))
            for b in R['downbeats']:
                if rI * secs <= b < (rI + 1) * secs:
                    x = (b - rI * secs) / secs * Wd; d.line([(x, y0 + rowh - 8), (x, y0 + rowh)], fill=(0, 0, 0), width=3)
            d.text((4, y0 + 2), f'{rI * secs}s', fill=(0, 0, 0))
        rv = os.path.join(os.path.expanduser(a.project), 'review'); os.makedirs(rv, exist_ok=True)
        im.save(os.path.join(rv, 'audio_map.png')); print('wrote review/audio_map.png')
    except Exception as e:
        print('plot skipped:', e)


if __name__ == '__main__':
    main()
