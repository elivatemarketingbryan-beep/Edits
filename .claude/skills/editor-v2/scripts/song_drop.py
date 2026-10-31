#!/usr/bin/env python3
"""song_drop.py <song>: where the song's biggest energy jumps are, to place a drop on a line. Check the result by looking at the numbers it prints."""
import subprocess, sys
import numpy as np

SR = 8000
raw = subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-i', sys.argv[1], '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True, check=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = SR // 20
n = len(x) // hop
env = 10 * np.log10(np.mean(x[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-9)
k = 20  # one second either side
jump = np.array([env[i:i + k].mean() - env[i - k:i].mean() if k <= i < n - k else 0.0 for i in range(n)])
print(f'{n / 20:.1f} s long. Biggest jumps:')
picked = []
for i in np.argsort(-jump):
    if all(abs(i - j) > 40 for j in picked):
        picked.append(i)
        print(f'  {i / 20:7.2f} s   +{jump[i]:.1f} dB')
    if len(picked) == 5:
        break
