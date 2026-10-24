#!/usr/bin/env python3
"""Build a member ZIP from a curated allowlist, never from the whole workspace."""
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
DEST = ROOT / 'dist' / ('Split-Screen-Editor-v' + VERSION + '.zip')
PREFIX = 'Split-Screen-Editor/'
TOP_FILES = ['README.md', 'START_HERE.md', 'CHATGPT_INSTRUCTIONS.md', 'AGENTS.md',
             'LICENSE', 'THIRD_PARTY.md', '.gitignore', 'package.json', 'package-lock.json', 'tsconfig.json', 'requirements-transcription.txt']
SOURCE_DIRS = ['src', 'lib', 'scripts', 'tests', 'docs', 'prompts', 'research']
CURATED = ['corpus/index.json', 'corpus/README.md', 'corpus/annotation.schema.json',
           'examples/demo/plan.json', 'examples/demo/preview.mp4', 'examples/demo/contact-sheet.jpg',
           'examples/demo/README.md', 'public/demo/source.mp4',
           'public/assets/mirofish/github-invertocat-black.svg',
           'public/assets/mirofish/mirofish-screenshot-1.png',
           'public/assets/mirofish/mirofish-screenshot-2.png',
           'public/assets/mirofish/mirofish-logo.jpeg',
           'public/assets/mirofish/LICENSE-MiroFish.txt',
           'public/assets/mirofish/README.md']
paths = [ROOT / p for p in TOP_FILES]
for folder in SOURCE_DIRS:
    paths.extend(p for p in (ROOT / folder).rglob('*') if p.is_file() and p.suffix in {'.md', '.json', '.ts', '.tsx', '.js', '.mjs', '.py'})
paths.extend(ROOT / p for p in CURATED if (ROOT / p).exists())
paths.extend(p for folder in ['corpus/annotations', 'corpus/examples'] for p in (ROOT / folder).glob('*.json'))
for file in paths:
    if file.is_symlink() or ROOT not in file.resolve().parents:
        raise SystemExit('Refusing to package an external file: ' + str(file))
    if not file.is_file():
        raise SystemExit('Missing required release file: ' + str(file))
DEST.parent.mkdir(exist_ok=True)
manifest = []
with zipfile.ZipFile(DEST, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(set(paths)):
        name = file.relative_to(ROOT).as_posix()
        data = file.read_bytes()
        archive.writestr(PREFIX + name, data)
        manifest.append({'file': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    archive.writestr(PREFIX + 'corpus/edit-history.jsonl', '')
    archive.writestr(PREFIX + 'inputs/PUT_YOUR_VIDEO_HERE.txt', 'Put your own raw or cut video in this folder.\nOpen the project in your coding-capable AI environment and read START_HERE.md.\n')
    archive.writestr(PREFIX + 'RELEASE-MANIFEST.json', json.dumps({'version': VERSION, 'files': manifest}, indent=2) + '\n')
with zipfile.ZipFile(DEST) as archive:
    bad = archive.testzip()
    if bad:
        raise SystemExit('ZIP verification failed: ' + bad)
print(str(DEST))
print(str(len(manifest)) + ' curated files; ' + str(round(DEST.stat().st_size / 1024 / 1024, 2)) + ' MB; ZIP integrity verified.')
