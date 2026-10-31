"""Generate song takes with ACE-Step 1.5 (local, free, MIT). Run INSIDE the ACE-Step checkout with its uv env:

  cd ~/.one-prompt-mv/ACE-Step-1.5 && uv run python <SKILL>/scripts/song/gen_song.py \
      --caption caption.txt --lyrics lyrics.txt --bpm 100 --duration 165 --out <project>/song/takes --seeds 7 19 31 53

Writes <out>/seed<N>.latents.pt per take (decode them with decode_latents.py in a fresh process — that split keeps
a 16 GB Mac from running out of memory). Captions must stay under 512 characters.
"""
import argparse, os, platform, sys

ap = argparse.ArgumentParser()
ap.add_argument('--caption', required=True); ap.add_argument('--lyrics', required=True)
ap.add_argument('--bpm', type=int, default=100); ap.add_argument('--duration', type=float, default=150)
ap.add_argument('--out', required=True); ap.add_argument('--seeds', type=int, nargs='+', default=[7, 19, 31, 53])
ap.add_argument('--language', default='en'); ap.add_argument('--lm', default='acestep-5Hz-lm-0.6B')
a = ap.parse_args()

from acestep.handler import AceStepHandler
from acestep.inference import GenerationConfig, GenerationParams, generate_music
from acestep.llm_inference import LLMHandler
import torch

ACE_ROOT = os.getcwd()
os.makedirs(a.out, exist_ok=True)
CAPTION = open(a.caption, encoding='utf-8').read().strip()
LYRICS = open(a.lyrics, encoding='utf-8').read().strip()
if len(CAPTION) > 512: sys.exit(f'caption is {len(CAPTION)} chars; keep it under 512')
IS_MAC = platform.system() == 'Darwin' and platform.machine() == 'arm64'

dit = AceStepHandler()
status, ok = dit.initialize_service(project_root=ACE_ROOT, config_path='acestep-v15-turbo', device='auto', use_mlx_dit=False)
print('DiT:', status, flush=True)
if not ok: sys.exit(1)
dit.use_mlx_vae = False; dit.mlx_vae = None
CURRENT = {'seed': None}

def save_latents_instead_of_decoding(latents, *args, **kwargs):
    path = os.path.join(a.out, f"seed{CURRENT['seed']}.latents.pt")
    torch.save(latents.detach().float().cpu(), path)
    print(f'saved latents {tuple(latents.shape)} -> {path}', flush=True)
    return torch.zeros(latents.shape[0], 2, latents.shape[-1] * 1920)

dit.tiled_decode = save_latents_instead_of_decoding
lm = LLMHandler()
status, ok = lm.initialize(checkpoint_dir=os.path.join(ACE_ROOT, 'checkpoints'), lm_model_path=a.lm, backend='mlx' if IS_MAC else 'pt', device='auto')
print('LM:', status, flush=True)
if not ok: sys.exit(1)

params = GenerationParams(task_type='text2music', caption=CAPTION, lyrics=LYRICS, vocal_language=a.language, bpm=a.bpm,
                          timesignature='4', duration=a.duration, inference_steps=8, shift=3.0,
                          use_cot_caption=False, use_cot_language=False)  # keep the caption exactly as written
for seed in a.seeds:
    CURRENT['seed'] = seed
    cfg = GenerationConfig(batch_size=1, seeds=[seed], use_random_seed=False, audio_format='wav')
    r = generate_music(dit, lm, params, cfg, save_dir=a.out)
    print(f'seed {seed}: ' + ('ok' if r.success else f'FAILED {r.error}'), flush=True)
