# Troubleshooting

Start with `node engine/fx.mjs doctor`. Each ✖ line prints its fix underneath.

| Problem | What to do |
|---|---|
| `Node ... is too old` | Install Node 20+ (LTS) from nodejs.org, then run the installer again. |
| `Couldn't find Python 3.9+` | macOS: run `xcode-select --install` or install Python from python.org. Windows: install from python.org with "Add python.exe to PATH" ticked. Run the installer again. |
| pip errors while installing packages | Run the installer again (network hiccups are common). On Intel Macs with old Python, install the latest Python from python.org first. |
| Mac says the installer "can't be opened" | Right-click `Install (Mac).command` → Open → Open. Or in Terminal: `cd` into the folder and run `node install.mjs`. |
| Render stops at "Waiting for root component to load" | Run `node engine/fx.mjs browser`, then render again. The render browser must live in `~/.claude-video-fx`, not inside Desktop or Documents. |
| Graphics show in front of me instead of behind | The cut-out struggled on this clip (very dark, backlit, or more than one person). Try a brighter stretch of the video. |
| Captions have the wrong words | Add `"fixes": {"cloud code": "Claude Code"}` to the effect config, or run `node engine/fx.mjs words "<video>" --vocab "Your Name, Your Brand"`. For better accuracy use `--whisper-model medium` (slower). |
| Render is slow | Use `--draft` while iterating, keep ranges under ~15 s, close heavy apps. The first render of a clip includes the one-time transcript and cut-out. |
| Moved the kit folder | Run `node install.mjs --skills` so the skills point at the new location. |
| Disk filling up | Cached clips live in `engine/jobs/` and default renders in `engine/out/`. Both are safe to delete. |
