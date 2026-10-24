# Start editing

This folder is an AI-directed video workshop. You provide footage; your assistant studies it, designs an edit, writes original motion graphics, and renders an MP4 with Remotion. The graphics are React/SVG animation. No AI video generation is used.

## Set up once

1. Unzip the entire project into a folder on your computer.
2. Open that folder as a **local project** in the ChatGPT desktop app and use Codex, or start Codex CLI inside the folder. Make this folder the primary project folder so its `AGENTS.md` is discovered.
3. Put your raw or already-cut video in `inputs/`. You can also attach it if your assistant can save the attachment into the project.
4. Paste the message below. The assistant will check the runtime and install the project's pinned packages when needed.

```text
Read AGENTS.md and start editing my video in inputs/.
Create a polished vertical short with original, content-specific motion graphics.
Use the actual speech for captions and keep my meaning intact.
Make the creative decisions, render a draft, review it, fix issues, and export the final MP4.
```

Optional additions: desired duration, audience, brand colors, a transcript, and any section you must keep. You do not need to supply a storyboard.

## What the assistant needs

The runtime needs Node.js 22 or newer, npm, writable project files, and a working browser renderer. FFmpeg/FFprobe are supplied through this project's npm dependencies. Initial setup also needs downloads for packages and Remotion's browser. The assistant runs the included doctor before promising an export.

An ordinary ChatGPT Project upload supplies context; uploading these files alone does not install or execute this editor. Use a local project for the simplest setup. A cloud environment is usable only if it can extract the full project, run its dependencies, access the footage, and complete the same runtime checks. See [runtime setup](docs/RUNTIME.md).

## What you receive

- A final vertical MP4 in the `renders/` folder.
- Editable plans in `jobs/<your-job>/` and any original scene code in `src/custom/`.
- A storyboard and a short review record describing the checks actually completed.

The kit can transcribe locally with optional `faster-whisper`, or import an SRT, VTT, or timed JSON transcript. If neither path is available, your assistant will request a transcript while it inspects the footage and prepares the visual direction. The project does not invent speech or pretend a render happened.

## Revise naturally

```text
Make the first five seconds more direct. Simplify the process explanation.
Use fewer words on screen and keep the presenter larger during the closing line.
Render the revised version and check the captions again.
```

Keep the project folder after each edit: it contains the editable work and your style history. For community distribution, share a clean kit rather than a folder containing members' private footage. See [sharing the kit](docs/SHARING.md).

The setup distinction follows OpenAI's [Projects and chats](https://learn.chatgpt.com/docs/projects) and [Quickstart](https://learn.chatgpt.com/docs/quickstart), checked October 7, 2026.
