# Third-party components

Dependencies are installed from the pinned `package-lock.json`; their license notices are supplied with their packages. The distribution does not include `node_modules`. Four official editorial assets are bundled for the MiroFish scenes: the GitHub mark, two app screenshots, and the MiroFish logo, with their [source and usage record](public/assets/mirofish/README.md) and the upstream MiroFish license.

| Component | Role | Upstream terms |
| --- | --- | --- |
| Remotion | React preview and video rendering | [Remotion license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md) |
| React / React DOM | Component runtime | [MIT](https://github.com/facebook/react/blob/main/LICENSE) |
| Inter | Locally bundled font through @fontsource/inter | [SIL Open Font License](https://github.com/rsms/inter/blob/master/LICENSE.txt) |
| FFmpeg / FFprobe static packages | Source conversion, inspection, audio, encoding | [ffmpeg-static](https://github.com/eugeneware/ffmpeg-static), [ffprobe-static](https://github.com/joshwnj/ffprobe-static); binary build terms apply |
| faster-whisper (optional, installed separately) | Local speech transcription | [MIT and upstream model notes](https://github.com/SYSTRAN/faster-whisper) |

The five Instagram references are links and independently written observations. The member package contains none of the creator's source video, audio, screenshots, logos, or transcripts. All bundled demo media is original procedural output created by this project.

The MiroFish screenshot and GitHub mark remain their respective owners' assets. They are separate from the original procedural demo and the editor's own code license.
