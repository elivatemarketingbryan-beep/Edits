#!/usr/bin/env python3
"""transcribe.py <audio or video> [--from S --to S] [--model small] [--language en] [--out work/take_tx.json]

Word timings with faster-whisper, on your own computer, free. voicecut.py reads the same format.
Run it on the whole take first, then again on each kept section with --from and --to: a pass over a whole file
can hide a line said twice, and it invents endings over music.
"""
import argparse, json, os, subprocess, tempfile
from faster_whisper import WhisperModel

ap = argparse.ArgumentParser()
ap.add_argument('src')
ap.add_argument('--from', dest='a', type=float, default=0.0)
ap.add_argument('--to', dest='b', type=float)
ap.add_argument('--model', default='small')
ap.add_argument('--language')
ap.add_argument('--out')
args = ap.parse_args()

with tempfile.TemporaryDirectory() as d:
    wav = f'{d}/a.wav'
    cmd = ['ffmpeg', '-nostdin', '-v', 'error', '-y', '-ss', str(args.a)]
    if args.b is not None:
        cmd += ['-to', str(args.b)]
    subprocess.run(cmd + ['-i', args.src, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
    model = WhisperModel(args.model, device='cpu', compute_type='int8')
    parts, _ = model.transcribe(wav, language=args.language, word_timestamps=True, vad_filter=False, condition_on_previous_text=False)
    segments = []
    for p in parts:
        words = [dict(word=w.word, start=round(w.start + args.a, 3), end=round(w.end + args.a, 3)) for w in (p.words or [])]
        segments.append(dict(start=round(p.start + args.a, 3), end=round(p.end + args.a, 3), text=p.text.strip(), words=words))
        print(f'{p.start + args.a:7.2f} {p.end + args.a:7.2f}  {p.text.strip()}', flush=True)

if args.out:
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    json.dump(dict(segments=segments), open(args.out, 'w'), indent=0)
    print('wrote', args.out)
