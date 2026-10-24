"""Render a storyboard to MP4 (parallel, motion-blurred), or render preview stills.

  python render.py story.json -o out.mp4                # final: 60fps, 4-sample motion blur
  python render.py story.json -o draft.mp4 --draft      # quick look: 30fps, no blur
  python render.py story.json --stills 0.5,2,4.2 -o sheet.png   # contact sheet of single frames
  python render.py story.json -o out.mp4 --audio score.wav       # mux audio at the end
"""
import argparse, os, subprocess, sys, time, tempfile, shutil
from multiprocessing import Pool
import numpy as np, skia
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import W, H
from timeline import load_story, Timeline, rel

_TL = None; _STORY = None
def _init(story_path):
    global _TL, _STORY
    _STORY = load_story(story_path); _TL = Timeline(_STORY)

def video_reader(story, t0, fps, n):
    base = story.get('base', {})
    if not base.get('video'): return None
    src = rel(story, base['video'])
    off = float(base.get('offset', 0.0))
    cmd = ['ffmpeg', '-loglevel', 'error', '-ss', f'{max(0, t0 + off):.4f}', '-i', src, '-frames:v', str(n),
           '-vf', f'fps={fps},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1',
           '-f', 'rawvideo', '-pix_fmt', 'rgba', '-']
    return subprocess.Popen(cmd, stdout=subprocess.PIPE)

def render_frame(surf, t, sub, shutter, fps, img):
    acc = None
    for k in range(sub):
        ts = t + ((k + 0.5) / sub - 0.5) * shutter / fps if sub > 1 else t
        c = surf.getCanvas(); c.resetMatrix(); c.restoreToCount(1)
        _TL.draw(c, max(0.0, ts), img)
        a = surf.makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)[:, :, :3]
        if acc is None: acc = a.astype(np.uint16)
        else: acc += a
    if sub > 1: acc = (acc + sub // 2) // sub
    return acc.astype(np.uint8)

def _segment(args):
    story_path, f0, f1, fps, sub, out, crf, preset = args
    if _TL is None: _init(story_path)
    surf = skia.Surface(W, H)
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
           '-c:v', 'libx264', '-preset', preset, '-crf', str(crf), '-pix_fmt', 'yuv420p', '-x264-params', 'aq-mode=3', out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    vr = video_reader(_STORY, f0 / fps, fps, f1 - f0)
    for i in range(f0, f1):
        img = None
        if vr is not None:
            buf = vr.stdout.read(W * H * 4)
            if len(buf) == W * H * 4:
                img = skia.Image.fromarray(np.frombuffer(buf, np.uint8).reshape(H, W, 4).copy(), colorType=skia.ColorType.kRGBA_8888_ColorType)
            else:
                img = getattr(_segment, 'last', None)
            _segment.last = img
        p.stdin.write(render_frame(surf, i / fps, sub, 0.55, fps, img).tobytes())
    p.stdin.close(); p.wait()
    if vr is not None: vr.stdout.close(); vr.wait()
    return out

def stills(story_path, times, out):
    _init(story_path)
    from PIL import Image, ImageDraw
    surf = skia.Surface(W, H); thumbs = []
    for t in times:
        img = None
        vr = video_reader(_STORY, t, 30, 1)
        if vr is not None:
            buf = vr.stdout.read(W * H * 4); vr.wait()
            if len(buf) == W * H * 4:
                img = skia.Image.fromarray(np.frombuffer(buf, np.uint8).reshape(H, W, 4).copy(), colorType=skia.ColorType.kRGBA_8888_ColorType)
        a = render_frame(surf, t, 1, 0, 60, img)
        thumbs.append(Image.fromarray(a).resize((270, 480), Image.LANCZOS))
    cols = min(6, len(thumbs)); rows = (len(thumbs) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * 276, rows * 506), (36, 36, 36)); d = ImageDraw.Draw(sheet)
    for i, im in enumerate(thumbs):
        x = (i % cols) * 276 + 3; y = (i // cols) * 506 + 3
        sheet.paste(im, (x, y)); d.text((x + 4, y + 484), f'{times[i]:.2f}s', fill=(255, 255, 255))
    sheet.save(out); print('wrote', out)

def render(story_path, out, draft=False, workers=None, audio=None, sub=None):
    story = load_story(story_path)
    dur = float(story['duration'])
    fps = 30 if draft else int(story.get('fps', 60))
    sub = sub or (1 if draft else int(story.get('motion_blur', 4)))
    crf, preset = (23, 'veryfast') if draft else (14, 'medium')
    n = int(round(dur * fps))
    workers = workers or max(1, (os.cpu_count() or 2))
    chunks = max(workers * 6, 8)
    tmp = tempfile.mkdtemp(prefix='bms_')
    bounds = [round(n * k / chunks) for k in range(chunks + 1)]
    jobs = [(story_path, bounds[k], bounds[k + 1], fps, sub, os.path.join(tmp, f'seg{k:03d}.mp4'), crf, preset) for k in range(chunks) if bounds[k + 1] > bounds[k]]
    t0 = time.time()
    print(f'rendering {n} frames at {fps}fps, {sub}x motion blur, {workers} workers (pid {os.getpid()}: kill it to cancel) ...', flush=True)
    with Pool(workers, initializer=_init, initargs=(story_path,)) as pool:
        for k, _ in enumerate(pool.imap_unordered(_segment, jobs)):
            el = time.time() - t0; eta = el / (k + 1) * (len(jobs) - k - 1)
            print(f'  {int(100 * (k + 1) / len(jobs))}% ({el:.0f}s elapsed, about {eta:.0f}s left)', flush=True)
    lst = os.path.join(tmp, 'list.txt')
    with open(lst, 'w') as f:
        for j in jobs: f.write(f"file '{j[5]}'\n")
    video_only = os.path.join(tmp, 'video.mp4')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', video_only], check=True)
    if audio and os.path.exists(audio):
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video_only, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k',
                        '-shortest', '-movflags', '+faststart', out], check=True)
    else:
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video_only, '-c', 'copy', '-movflags', '+faststart', out], check=True)
    shutil.rmtree(tmp, ignore_errors=True)
    print(f'wrote {out} in {time.time() - t0:.0f}s')

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('story'); ap.add_argument('-o', '--out', default='out.mp4')
    ap.add_argument('--draft', action='store_true'); ap.add_argument('--workers', type=int)
    ap.add_argument('--audio'); ap.add_argument('--stills'); ap.add_argument('--sub', type=int)
    a = ap.parse_args()
    if a.stills: stills(a.story, [float(x) for x in a.stills.split(',')], a.out)
    else: render(a.story, a.out, a.draft, a.workers, a.audio, a.sub)
