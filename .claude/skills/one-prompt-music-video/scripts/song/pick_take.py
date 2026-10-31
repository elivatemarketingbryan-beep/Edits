"""Rank song takes by how many lyric words are actually intelligible (local: Demucs vocal stem → Whisper).
  ~/.one-prompt-mv/venv/bin/python pick_take.py <project>/song/takes <project>/song/lyrics.txt
Prints a ranking + what Whisper heard; tell the user the top two, they listen and choose.
A take scoring ~0% usually has (almost) no sung vocal — re-roll with new seeds or a clearer caption.
"""
import difflib, glob, json, os, re, shutil, subprocess, sys, tempfile
from faster_whisper import WhisperModel

takes, lyr = sys.argv[1], open(sys.argv[2], encoding='utf-8').read()
norm = lambda w: re.sub(r'(.)\1+', r'\1', re.sub(r"[^a-z0-9']", '', w.lower()))
want = [norm(w) for line in lyr.splitlines() if not line.strip().startswith('[') for w in line.replace('(', ' ').replace(')', ' ').split() if norm(w)]


def vocal_stem(path, tmp):
    """Isolate the voice first: Whisper hears more words without the beat underneath."""
    dev = 'cpu'
    try:
        import torch
        dev = 'mps' if torch.backends.mps.is_available() else 'cuda' if torch.cuda.is_available() else 'cpu'
    except Exception:
        pass
    try:
        subprocess.run([sys.executable, '-m', 'demucs', '--two-stems=vocals', '-n', 'htdemucs', '-d', dev, '-o', tmp, path], check=True, capture_output=True)
        v = os.path.join(tmp, 'htdemucs', os.path.splitext(os.path.basename(path))[0], 'vocals.wav')
        return v if os.path.exists(v) else path
    except Exception:
        return path


m = WhisperModel('small.en', device='cpu', compute_type='int8')
rows, tmp = [], tempfile.mkdtemp(prefix='picktake-')
for f in sorted(glob.glob(os.path.join(takes, '*.wav'))):
    best = (0.0, '')
    for src in (vocal_stem(f, tmp), f):   # vocal stem first, full mix as a second opinion
        segs, _ = m.transcribe(src, beam_size=5, condition_on_previous_text=False)
        txt = ' '.join(s.text for s in segs)
        heard = [norm(w) for w in txt.split() if norm(w)]
        sm = difflib.SequenceMatcher(a=want, b=heard, autojunk=False)
        cov = sum(b.size for b in sm.get_matching_blocks()) / max(1, len(want))
        if cov >= best[0]: best = (cov, txt)
    rows.append((best[0], os.path.basename(f), best[1][:400]))
    print(f'{os.path.basename(f)}: {best[0]:.0%} of the lyrics intelligible', flush=True)
shutil.rmtree(tmp, ignore_errors=True)
rows.sort(reverse=True)
print('\nRANKING'); [print(f'  {c:.0%}  {n}') for c, n, _ in rows]
json.dump([{'take': n, 'coverage': round(c, 3), 'heard': h} for c, n, h in rows], open(os.path.join(takes, 'ranking.json'), 'w'), indent=1)
