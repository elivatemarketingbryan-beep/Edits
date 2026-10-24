#!/usr/bin/env python3
"""Optional, local word-timestamp transcription. No cloud service or API key."""
import argparse
import json
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--audio', required=True)
parser.add_argument('--output', required=True)
parser.add_argument('--model', default='small')
parser.add_argument('--language')
parser.add_argument('--overwrite', action='store_true')
args = parser.parse_args()
target = Path(args.output)
if target.exists() and not args.overwrite:
    parser.error(f'Output already exists: {target}. Use --overwrite to replace it.')
try:
    from faster_whisper import WhisperModel
except ImportError:
    parser.exit(1, 'Install optional local transcription from the project root: python3 -m pip install -r requirements-transcription.txt\n')

print('Loading local Whisper model. The first use downloads model weights; audio stays on this computer.', flush=True)
model = WhisperModel(args.model, device='cpu', compute_type='int8')


def load_audio(path):
    """Decode PCM WAV without PyAV; newer av releases break faster-whisper's decoder."""
    if not path.lower().endswith('.wav'):
        return path
    import wave
    import numpy as np
    try:
        with wave.open(path, 'rb') as wav:
            rate, channels, width = wav.getframerate(), wav.getnchannels(), wav.getsampwidth()
            raw = wav.readframes(wav.getnframes())
    except wave.Error:
        return path
    if width != 2:
        return path
    samples = np.frombuffer(raw, dtype='<i2').astype(np.float32) / 32768.0
    if channels > 1:
        samples = samples.reshape(-1, channels).mean(axis=1)
    if rate != 16000:
        positions = np.arange(0, len(samples), rate / 16000)
        samples = np.interp(positions, np.arange(len(samples)), samples).astype(np.float32)
    return samples


segments, info = model.transcribe(load_audio(args.audio), language=args.language, word_timestamps=True, vad_filter=True)
result = []
for segment in segments:
    words = [{'start': word.start, 'end': word.end, 'text': word.word.strip()} for word in (segment.words or []) if word.end > word.start and word.word.strip()]
    text = segment.text.strip()
    if not text or segment.end <= segment.start:
        continue
    item = {'start': segment.start, 'end': segment.end, 'text': text}
    if words:
        item['words'] = words
    result.append(item)
    print(f'{segment.start:7.2f}s {text}', flush=True)
if not result:
    parser.exit(1, 'No speech was detected. Review the audio before adding captions.\n')
target.write_text(json.dumps({'version': 1, 'language': info.language, 'segments': result}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Wrote {target}. Review names, terminology and timing before publishing.')
