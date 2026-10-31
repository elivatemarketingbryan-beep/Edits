"""Generate "ONE PROMPT" with ACE-Step 1.5 (local, free, MIT). Female vocal, melodic pop + melodic rap.

Run from the ACE-Step checkout so its venv and checkpoints resolve:
  cd tools/ACE-Step-1.5 && uv run python gen_song.py 7 19 31 53   (original one-off script; use scripts/song/make_song.sh instead)
"""

import os
import sys

from acestep.handler import AceStepHandler
from acestep.inference import GenerationConfig, GenerationParams, generate_music
from acestep.llm_inference import LLMHandler

ACE_ROOT = os.getcwd()
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "takes")
os.makedirs(OUT_DIR, exist_ok=True)

# Under 512 chars (the model's caption limit). The woman's voice comes first so it can't get lost.
CAPTION = (
    "Solo female vocalist only, a warm smooth confident young woman singing clear English. "
    "Melodic pop with melodic rap verses, 100 BPM. Verses are sung-rap, rhythmic and on key, "
    "never shouted. Soaring catchy emotional sung chorus with her own airy harmonies. Warm synth "
    "pads, soft plucked guitar, crisp trap hi-hats, deep 808, finger snaps, shimmering bells. "
    "Soft intro, rising pre-chorus, big anthemic chorus, heartfelt stripped-down bridge, gentle "
    "outro. No male vocals."
)

# "Clawd" is the sung spelling of Claude: the last song's chant came out as "Klon".
LYRICS = """[intro]
Late night, one prompt
Watch it come alive
(Come alive)

[verse]
Typed one line in the terminal, hit enter, let it ride
Opus five point five on the other side
No After Effects, no studio, no team
Just Clawd writing code, building every scene
Every shape is a line, every frame is a choice
Easing in, easing out, give the pixels a voice
I don't touch the timeline, I don't move a thing
It's on autopilot, baby, let it sing

[pre-chorus]
Tokens on the meter, but I'm feeling free
No credits, no crew, just Clawd and me

[chorus]
One prompt, and it moves
Opus five point five, yeah, it's breaking all the rules
One prompt, now it's real
Clawd made the motion, I just tell it how I feel
On autopilot, let it fly
One prompt, and the whole thing comes alive

[verse]
They said you need a course, a pack, a crazy fee
They said you need a sponsor, I said no, not me
One guy with a laptop and a crazy idea
Turned it into a skill, and it's sitting right here
Download it, install it, paste it, press go
Clawd does the rest, and it runs the whole show
Every loop is perfect, every beat lands right
From a single little prompt in the middle of the night

[pre-chorus]
Tokens on the meter, but the skill is free
No sponsor, no catch, just you and me

[chorus]
One prompt, and it moves
Opus five point five, yeah, it's breaking all the rules
One prompt, now it's real
Clawd made the motion, I just tell it how I feel
On autopilot, let it fly
One prompt, and the whole thing comes alive

[bridge]
Thank you for subbing, thank you for staying
Thank you for every comment you've been saying
One guy, no sponsors, nothing to sell
Just a free skill and a story to tell

[chorus]
One prompt, and it moves
Opus five point five, yeah, it's breaking all the rules
One prompt, now it's real
The skill is free, and that's the whole deal
On autopilot, let it fly
One prompt, and the whole thing comes alive

[outro]
One prompt
The skill is free
Thank you for subbing
Come alive
"""

SEEDS = [int(s) for s in sys.argv[1:]] or [7, 19, 31, 53]
DURATION = float(os.environ.get("SONG_DURATION", "165"))

dit = AceStepHandler()
status, ok = dit.initialize_service(
    project_root=ACE_ROOT,
    config_path="acestep-v15-turbo",
    device="auto",
    use_mlx_dit=False,  # one bf16 torch copy instead of torch fp32 + MLX copy (16 GB Mac)
)
print("DiT:", status)
if not ok:
    sys.exit(1)
# 16 GB Mac: decoding while the DiT is resident runs out of memory, so this pass
# only saves the VAE-ready latents; decode_latents.py turns them into audio in a
# fresh process that loads nothing but the small VAE.
import torch

dit.use_mlx_vae = False
dit.mlx_vae = None
CURRENT = {"seed": None}


def save_latents_instead_of_decoding(latents, *args, **kwargs):
    path = os.path.join(OUT_DIR, f"seed{CURRENT['seed']}.latents.pt")
    torch.save(latents.detach().float().cpu(), path)
    print(f"saved latents {tuple(latents.shape)} -> {path}", flush=True)
    return torch.zeros(latents.shape[0], 2, latents.shape[-1] * 1920)


dit.tiled_decode = save_latents_instead_of_decoding

lm = LLMHandler()
status, ok = lm.initialize(
    checkpoint_dir=os.path.join(ACE_ROOT, "checkpoints"),
    lm_model_path="acestep-5Hz-lm-0.6B",
    backend="mlx",
    device="auto",
)
print("LM:", status)
if not ok:
    sys.exit(1)

params = GenerationParams(
    task_type="text2music",
    caption=CAPTION,
    lyrics=LYRICS,
    vocal_language="en",
    bpm=100,
    timesignature="4",
    duration=DURATION,
    inference_steps=8,
    shift=3.0,
    use_cot_caption=False,   # keep "solo female vocalist" exactly as written
    use_cot_language=False,
)

for seed in SEEDS:
    CURRENT["seed"] = seed
    config = GenerationConfig(batch_size=1, seeds=[seed], use_random_seed=False, audio_format="wav")
    result = generate_music(dit, lm, params, config, save_dir=OUT_DIR)
    if not result.success:
        print(f"seed {seed}: FAILED {result.error}")
        continue
    for audio in result.audios:
        print(f"seed {seed}: {audio['path']} key={audio.get('key')}", flush=True)
