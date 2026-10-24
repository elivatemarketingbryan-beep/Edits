"""One command: score + render + mux.   python make.py story.json -o final.mp4 [--draft] [--keep-audio]

Long renders: run in the background and poll the log, e.g.
  (cd <work folder> && nohup <PY> <SKILL_DIR>/engine/make.py story.json -o final.mp4 > make.log 2>&1 &)
  tail -n 3 <work folder>/make.log        # prints % done and time left; ends with "wrote final.mp4"
"""
import argparse, os, sys, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import audio, render

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('story'); ap.add_argument('-o', '--out', default='final.mp4')
    ap.add_argument('--draft', action='store_true'); ap.add_argument('--workers', type=int)
    ap.add_argument('--keep-audio', action='store_true', help='also keep the mixed audio as <out>_audio.wav')
    a = ap.parse_args()
    wav = os.path.splitext(a.out)[0] + '_audio.wav' if a.keep_audio else tempfile.mktemp(suffix='.wav')
    audio.build(a.story, wav)
    render.render(a.story, a.out, a.draft, a.workers, wav)
    if not a.keep_audio and os.path.exists(wav): os.remove(wav)
