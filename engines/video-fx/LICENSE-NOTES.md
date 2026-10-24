# License notes

This kit is shared with members of the AI Employee Lab community for their own video production.

It depends on third-party software, installed on your machine by `install.mjs`:

| Component | Used for | License |
|---|---|---|
| [Remotion](https://remotion.dev) | rendering the effects | Remotion License: free for individuals, non-profits and companies with up to 3 employees; larger companies need a company license from [remotion.pro](https://remotion.pro) |
| [Robust Video Matting](https://github.com/PeterL1n/RobustVideoMatting) (model weights, downloaded by the installer) | cutting the speaker out of the background | GPL-3.0 |
| [faster-whisper](https://github.com/SYSTRAN/faster-whisper) + Whisper weights | word-level transcripts | MIT |
| [ONNX Runtime](https://onnxruntime.ai), OpenCV, NumPy | running the matting model | MIT / Apache-2.0 / BSD |
| FFmpeg via `ffmpeg-static` | video encode/decode | GPL (static builds) |
| Inter, Instrument Serif, Bodoni Moda, Playfair Display, JetBrains Mono, Caveat, Archivo Black, Courier Prime (via Fontsource) | typography | SIL Open Font License |

Effects reference app UIs (chat apps, Reels, phone screens) as generic mockups. Don't use them to impersonate a real company's product in ads.
