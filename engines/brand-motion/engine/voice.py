"""Voice tools.

  python voice.py transcribe <audio_or_video> -o words.json        # word-level timestamps (faster-whisper)
  python voice.py align words.json script.txt -o words.json        # fix the transcript's words to match the known script
  python voice.py probe <media>                                    # duration, has audio, resolution

Voiceovers are either the member's OWN RECORDING or an ELEVENLABS voice. No robotic computer voices.
  python voice.py setkey <ELEVENLABS_API_KEY>                      # saves the key once (skill folder, private file)
  python voice.py voices                                           # lists the voices in their ElevenLabs account
  python voice.py tts script.txt -o vo.wav --voice "<name or voice_id>" [--speed 1.0] [--style 0.35]

The key can also come from the ELEVENLABS_API_KEY environment variable. A voice from the ElevenLabs Voice Library
must be added to "My Voices" in their account first (or give its voice ID directly).
"""
import argparse, json, os, subprocess, sys, shutil, tempfile, urllib.request, urllib.error

def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=codec_type,width,height,r_frame_rate',
                        '-of', 'json', path], capture_output=True, text=True)
    d = json.loads(r.stdout or '{}')
    streams = d.get('streams', [])
    v = next((s for s in streams if s.get('codec_type') == 'video'), None)
    out = {'duration': float(d.get('format', {}).get('duration', 0) or 0), 'has_audio': any(s.get('codec_type') == 'audio' for s in streams)}
    if v: out.update(width=v.get('width'), height=v.get('height'), fps=v.get('r_frame_rate'))
    return out

def transcribe(path, out, model='small.en', language=None):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit('faster-whisper missing: pip install faster-whisper')
    wav = tempfile.mktemp(suffix='.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
    m = WhisperModel(model if not language or language == 'en' else model.replace('.en', ''), device='cpu', compute_type='int8')
    segs, info = m.transcribe(wav, word_timestamps=True, language=language, vad_filter=True)
    words, text = [], []
    for s in segs:
        text.append(s.text.strip())
        for w in (s.words or []):
            words.append({'word': w.word.strip(), 'start': round(w.start, 3), 'end': round(max(w.end, w.start + 0.1), 3)})
    os.remove(wav)
    res = {'text': ' '.join(text), 'words': words, 'duration': probe(path)['duration']}
    with open(out, 'w') as f: json.dump(res, f, indent=1)
    print(f'wrote {out}: {len(words)} words, {res["duration"]:.1f}s')
    print('TRANSCRIPT:', res['text'])
    print('Read it: any word that looks wrong (names, numbers, claims) must be fixed in the JSON before it becomes a caption.')
    return res

def align(words_path, script, out):
    """Replace transcript words with the script's words (exact spelling, brand names, '.app'), keeping timings.
    Words whisper merged, split or dropped get timings interpolated from their neighbours."""
    import difflib, re
    d = json.load(open(words_path)); words = d['words'] if isinstance(d, dict) else d
    text = open(script).read() if os.path.exists(script) else script
    target = text.split()
    norm = lambda w: re.sub(r"[^a-z0-9]", '', w.lower())
    a = [norm(w['word']) for w in words]; b = [norm(w) for w in target]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    out_words = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            for k in range(i2 - i1): out_words.append({'word': target[j1 + k], 'start': words[i1 + k]['start'], 'end': words[i1 + k]['end']})
        elif j2 > j1:   # replace / insert: spread the script words over the span the transcript used
            if i2 > i1: t0, t1 = words[i1]['start'], words[i2 - 1]['end']
            else:
                t0 = words[i1 - 1]['end'] if i1 > 0 else 0.0
                t1 = words[i1]['start'] if i1 < len(words) else t0 + 0.3 * (j2 - j1)
                if t1 - t0 < 0.12 * (j2 - j1): t1 = t0 + 0.25 * (j2 - j1)
            n = j2 - j1; step = (t1 - t0) / n
            for k in range(n): out_words.append({'word': target[j1 + k], 'start': round(t0 + k * step, 3), 'end': round(t0 + (k + 1) * step, 3)})
    for w in out_words:   # whisper sometimes gives zero-length words
        if w['end'] - w['start'] < 0.08: w['end'] = round(w['start'] + 0.12, 3)
    res = {'text': ' '.join(target), 'words': out_words, 'duration': d.get('duration') if isinstance(d, dict) else None}
    json.dump(res, open(out, 'w'), indent=1)
    changed = sum(1 for tag, *_ in sm.get_opcodes() if tag != 'equal')
    print(f'wrote {out}: {len(out_words)} words ({changed} corrected spans)')

def _to_wav(src, out):
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', '48000', out], check=True)

KEY_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.elevenlabs_key')
EL = 'https://api.elevenlabs.io/v1'

def el_key():
    k = os.environ.get('ELEVENLABS_API_KEY', '').strip()
    if not k and os.path.exists(KEY_FILE): k = open(KEY_FILE).read().strip()
    if not k:
        sys.exit('NO_ELEVENLABS_KEY: ask the member for their ElevenLabs API key (elevenlabs.io > Developers > API Keys, '
                 'needs Text to Speech and Voices read access), then run: voice.py setkey <key>. Or use their own recording.')
    return k

def setkey(key):
    with open(KEY_FILE, 'w') as f: f.write(key.strip())
    try: os.chmod(KEY_FILE, 0o600)
    except Exception: pass
    print('saved ElevenLabs key to', KEY_FILE)
    try: n = len(list_voices(quiet=True)); print(f'key works ({n} voices in the account)')
    except SystemExit as e:
        os.remove(KEY_FILE); print(e); print('key NOT saved; ask the member to double-check it'); sys.exit(1)

def _el(path, data=None, accept='application/json'):
    req = urllib.request.Request(EL + path, data=json.dumps(data).encode() if data is not None else None,
                                 headers={'xi-api-key': el_key(), 'Content-Type': 'application/json', 'Accept': accept})
    try:
        with urllib.request.urlopen(req, timeout=180) as r: return r.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', 'ignore')[:400]
        if e.code == 401: sys.exit(f'ElevenLabs rejected the key or the account is out of credits (401): {body}')
        if e.code == 404: sys.exit(f'ElevenLabs could not find that voice (404). Run voice.py voices to see the voices in the account: {body}')
        if e.code == 422: sys.exit(f'ElevenLabs refused the request (422): {body}')
        sys.exit(f'ElevenLabs error {e.code}: {body}')
    except urllib.error.URLError as e:
        sys.exit(f'Could not reach ElevenLabs ({e.reason}). Check the internet connection, or use their own recording.')

def list_voices(quiet=False):
    vs = json.loads(_el('/voices'))['voices']
    if not quiet:
        for v in sorted(vs, key=lambda v: (v.get('category') != 'cloned', v['name'].lower())):
            lab = v.get('labels') or {}
            desc = ', '.join(x for x in [lab.get('gender'), lab.get('accent'), lab.get('age'), lab.get('description') or lab.get('use_case')] if x)
            print(f"{v['name']:<28} {v['voice_id']}  [{v.get('category', '')}] {desc}")
    return vs

def resolve_voice(voice):
    if not voice: sys.exit('Pick a voice: --voice "<name or voice_id>" (voice.py voices lists them).')
    vs = list_voices(quiet=True)
    for v in vs:
        if voice == v['voice_id'] or voice.lower() == v['name'].lower(): return v['voice_id'], v['name']
    hits = [v for v in vs if voice.lower() in v['name'].lower()]
    if len(hits) == 1: return hits[0]['voice_id'], hits[0]['name']
    if len(voice) >= 18 and ' ' not in voice: return voice, voice          # a voice ID not in "My Voices" yet
    sys.exit(f'No voice named "{voice}" in this account. Options: ' + ', '.join(v['name'] for v in vs[:30]))

def tts(text, out, voice=None, speed=1.0, style=0.35, stability=0.45, model='eleven_multilingual_v2'):
    vid, vname = resolve_voice(voice)
    body = {'text': text.strip(), 'model_id': model,
            'voice_settings': {'stability': stability, 'similarity_boost': 0.8, 'style': style, 'use_speaker_boost': True,
                               'speed': max(0.7, min(1.2, speed))}}
    mp3 = tempfile.mktemp(suffix='.mp3')
    with open(mp3, 'wb') as f: f.write(_el(f'/text-to-speech/{vid}?output_format=mp3_44100_192', body, accept='audio/mpeg'))
    _to_wav(mp3, out); os.remove(mp3)
    print(f'wrote {out} with ElevenLabs voice "{vname}" ({probe(out)["duration"]:.1f}s)')
    return out

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest='cmd', required=True)
    a1 = sub.add_parser('transcribe'); a1.add_argument('src'); a1.add_argument('-o', '--out', default='words.json')
    a1.add_argument('--model', default='small.en', help='small.en (default, accurate), base.en (faster), medium.en (best)'); a1.add_argument('--language')
    a2 = sub.add_parser('tts'); a2.add_argument('text'); a2.add_argument('-o', '--out', default='vo.wav')
    a2.add_argument('--voice', required=True); a2.add_argument('--speed', type=float, default=1.0, help='0.7 to 1.2')
    a2.add_argument('--style', type=float, default=0.35, help='0 calm .. 1 very expressive'); a2.add_argument('--stability', type=float, default=0.45)
    a2.add_argument('--model', default='eleven_multilingual_v2')
    a5 = sub.add_parser('setkey'); a5.add_argument('key')
    sub.add_parser('voices')
    a3 = sub.add_parser('probe'); a3.add_argument('src')
    a4 = sub.add_parser('align'); a4.add_argument('words'); a4.add_argument('script'); a4.add_argument('-o', '--out')
    a = ap.parse_args()
    if a.cmd == 'transcribe': transcribe(a.src, a.out, a.model, a.language)
    elif a.cmd == 'tts': tts(a.text if not os.path.exists(a.text) else open(a.text).read(), a.out, a.voice, a.speed, a.style, a.stability, a.model)
    elif a.cmd == 'setkey': setkey(a.key)
    elif a.cmd == 'voices': list_voices()
    elif a.cmd == 'align': align(a.words, a.script, a.out or a.words)
    else: print(json.dumps(probe(a.src), indent=1))
