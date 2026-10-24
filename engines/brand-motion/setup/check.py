"""Prints READY or what is missing. Run with the skill's python: <skill>/.venv/bin/python setup/check.py"""
import importlib, shutil, sys, os
missing = []
for mod, pipname in [('skia', 'skia-python'), ('numpy', 'numpy'), ('scipy', 'scipy'), ('PIL', 'pillow'), ('cv2', 'opencv-python-headless')]:
    try: importlib.import_module(mod)
    except Exception: missing.append(pipname)
opt = []
try: importlib.import_module('faster_whisper')
except Exception: opt.append('faster-whisper (captions from audio)')
try: importlib.import_module('playwright')
except Exception: opt.append('playwright (website screenshots)')
if not shutil.which('ffmpeg'): missing.append('ffmpeg (system)')
print('python', sys.version.split()[0], '| cpus', os.cpu_count())
if missing: print('MISSING:', ', '.join(missing)); print('Run: bash setup/install.sh'); sys.exit(1)
print('optional not installed:', ', '.join(opt) if opt else 'none')
print('READY')
