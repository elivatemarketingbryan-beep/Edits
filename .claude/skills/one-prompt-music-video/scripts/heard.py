"""Print what Whisper hears in one segment of the vocal stem (8 s windows) — use it to fix a lyric line's timing.
  ~/.one-prompt-mv/venv/bin/python heard.py <project>/data/vocals.wav <start_s> <end_s>
Then edit <project>/data/audio.json → lyrics[i].words[j].t (and lyrics[i].start/end) to the heard times.
"""
import sys
sys.path.insert(0, __import__('os').path.dirname(__file__))
from analyze import load_mono
from faster_whisper import WhisperModel
path, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
x, sr = load_mono(path, 16000)
m = WhisperModel('small.en', device='cpu', compute_type='int8')
t = a
while t < b:
    segs, _ = m.transcribe(x[int(t * sr):int(min(b, t + 8) * sr)], word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    print(' | '.join(f'{w.start + t:.2f} {w.word.strip()}' for s in segs for w in s.words) or f'{t:.1f}s: (nothing heard)')
    t += 6
