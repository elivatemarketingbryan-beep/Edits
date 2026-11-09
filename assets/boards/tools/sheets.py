"""Screenshot every board mid-way through its animation and tile them into contact sheets for checking by eye.
Usage: python sheets.py <boards folder> <work folder> [name filter]"""
import concurrent.futures as cf
import glob
import os
import subprocess
import sys

B, W = sys.argv[1:3]
only = sys.argv[3].split(',') if len(sys.argv) > 3 else None
CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
SEEK = "<script>addEventListener('load',()=>setTimeout(()=>{document.getAnimations().forEach(a=>{a.pause();a.currentTime=5500})},400))</script>"
os.makedirs(W + '/shots', exist_ok=True)
fs = sorted(f for f in glob.glob(B + '/*.html') if not f.endswith('index.html') and (not only or os.path.basename(f)[:-5] in only))


def shot(f):
    n = os.path.basename(f)[:-5]
    h = open(f, encoding='utf8').read().replace('</body>', SEEK + '</body>')
    tmp = os.path.join(B, f'_shot_{n}.html')
    open(tmp, 'w', encoding='utf8').write(h)
    png = os.path.abspath(f'{W}/shots/{n}.png')
    prof = os.path.abspath(f'{W}/prof/{n}')
    try:
        subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=1920,1080', f'--user-data-dir={prof}', '--virtual-time-budget=3000', f'--screenshot={png}', 'file:///' + os.path.abspath(tmp).replace('\\', '/')],
                       capture_output=True, timeout=45, stdin=subprocess.DEVNULL)
    except subprocess.TimeoutExpired:
        print('timeout', n)
    os.remove(tmp)
    return n


with cf.ThreadPoolExecutor(4) as ex:
    done = list(ex.map(shot, fs))
names = [n for n in done if os.path.exists(f'{W}/shots/{n}.png')]
print(len(names), 'shots')
PER = 12
for s in range(0, len(names), PER):
    group = names[s:s + PER]
    args = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-nostdin']
    for n in group:
        args += ['-i', f'{W}/shots/{n}.png']
    fc = ''.join(f'[{i}:v]scale=480:270,drawtext=text=\'{n}\':x=8:y=250:fontsize=14:fontcolor=yellow:box=1:boxcolor=black[v{i}];' for i, n in enumerate(group))
    layout = '|'.join(f'{(i % 4) * 480}_{(i // 4) * 270}' for i in range(len(group)))
    fc += ''.join(f'[v{i}]' for i in range(len(group))) + f'xstack=inputs={len(group)}:layout={layout}:fill=black[o]'
    r = subprocess.run(args + ['-filter_complex', fc, '-map', '[o]', '-frames:v', '1', '-q:v', '3', f'{W}/sheet{s // PER + 1}.jpg'], capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-300:])
print('sheets', (len(names) + PER - 1) // PER)
