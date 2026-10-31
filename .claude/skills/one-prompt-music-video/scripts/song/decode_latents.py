"""Decode ACE-Step latents (<dir>/*.latents.pt) to 48 kHz WAV with only the VAE in memory.
  cd ~/.one-prompt-mv/ACE-Step-1.5 && uv run python <SKILL>/scripts/song/decode_latents.py <takes_dir>
"""
import glob, os, sys, wave
import numpy as np
import torch
from diffusers.models import AutoencoderOobleck

TAKES = sys.argv[1]
CHUNK, OVERLAP, HOP = 128, 16, 1920
torch.set_num_threads(os.cpu_count() or 8)
vae = AutoencoderOobleck.from_pretrained('checkpoints/vae').float().eval()

@torch.inference_mode()
def decode(lat):
    frames, out, start = lat.shape[-1], [], 0
    while start < frames:
        a = max(0, start - OVERLAP); b = min(frames, start + CHUNK + OVERLAP)
        wav = vae.decode(lat[:, :, a:b]).sample
        k0 = (start - a) * HOP; k1 = k0 + (min(start + CHUNK, frames) - start) * HOP
        out.append(wav[:, :, k0:k1]); start += CHUNK
    return torch.cat(out, dim=-1)

for path in sorted(glob.glob(os.path.join(TAKES, '*.latents.pt'))):
    wav_path = path.replace('.latents.pt', '.wav')
    if os.path.exists(wav_path): continue
    wav = decode(torch.load(path))[0].clamp(-1, 1).numpy()
    peak = float(np.abs(wav).max()) or 1.0
    pcm = (wav / max(peak, 1e-6) * 0.89 * 32767).astype(np.int16).T
    with wave.open(wav_path, 'wb') as w:
        w.setnchannels(pcm.shape[1]); w.setsampwidth(2); w.setframerate(48000); w.writeframes(pcm.tobytes())
    print(f'{os.path.basename(wav_path)}: {pcm.shape[0] / 48000:.2f}s', flush=True)
