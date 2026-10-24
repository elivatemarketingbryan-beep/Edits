#!/usr/bin/env python3
"""
.claude/skills/editing-handoff/scripts/build_fcpxml.py

Replay cutlist.json against the raw footage as an FCPXML timeline: one
`<clip>` per kept segment, all referencing the SAME source asset. That
is the whole point — every cut lands as an individually trimmable edit
point on the raw media, not a flattened render. Premiere Pro, Final Cut
Pro, and DaVinci Resolve all import FCPXML directly (File > Import).

CapCut Desktop's FCPXML import support varies by version and platform;
if "Import Project" doesn't accept this file, use the plain-text cut
sheet this script also writes as a manual fallback (place raw/<file> on
the timeline once, then trim to the printed timecodes).

usage: uv run .claude/skills/editing-handoff/scripts/build_fcpxml.py <job-name>
reads:  projects/<job>/cutlist.json
writes: projects/<job>/outputs/<job>.fcpxml
        projects/<job>/outputs/<job>-cutsheet.txt
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from fractions import Fraction
from pathlib import Path
from xml.sax.saxutils import escape

sys.path.insert(0, str(Path(__file__).resolve().parents[4] / "lib"))
import cutlist as cutlist_mod

REPO_ROOT = Path(__file__).resolve().parents[4]


def probe(path: Path) -> dict:
    def field(stream_select, entry):
        cmd = ["ffprobe", "-v", "error"]
        if stream_select is not None:
            cmd += ["-select_streams", stream_select]
        cmd += ["-show_entries", entry, "-of", "default=noprint_wrappers=1:nokey=1", str(path)]
        return subprocess.run(cmd, check=True, capture_output=True, text=True).stdout.strip().splitlines()

    w, h = field("v:0", "stream=width,height") or ["1920", "1080"]
    fr = field("v:0", "stream=r_frame_rate")[0]
    num, _, den = fr.partition("/")
    fps = Fraction(int(num), int(den) or 1)
    duration = float(field(None, "format=duration")[0])
    return {"width": w, "height": h, "fps": fps, "duration": duration}


def t2str(seconds: float, fps: Fraction) -> str:
    """Quantize a time to the nearest frame and express it as an exact
    FCPXML rational, e.g. '1001001/30000s' — never a lossy decimal."""
    frame_dur = 1 / fps  # Fraction, e.g. 1001/30000
    frames = round(seconds / float(frame_dur))
    exact = Fraction(frames) * frame_dur
    return f"{exact.numerator}/{exact.denominator}s"


def tc(seconds: float, fps: Fraction) -> str:
    fps_f = float(fps)
    total_frames = round(seconds * fps_f)
    hh = total_frames // int(fps_f * 3600)
    rem = total_frames % int(fps_f * 3600)
    mm = rem // int(fps_f * 60)
    rem = rem % int(fps_f * 60)
    ss = rem // int(round(fps_f))
    ff = rem % int(round(fps_f))
    return f"{hh:02d}:{mm:02d}:{ss:02d}:{ff:02d}"


def build_fcpxml(job: str, cl: dict, media_path: Path, info: dict) -> str:
    fps = info["fps"]
    frame_duration = f"{fps.denominator}/{fps.numerator}s"
    kept = cutlist_mod.kept_segments(cl)

    asset_uri = media_path.resolve().as_uri()
    asset_duration = t2str(info["duration"], fps)

    clips = []
    offset = 0.0
    for i, seg in enumerate(kept):
        dur = seg["end"] - seg["start"]
        clip_xml = (
            f'        <clip name="{escape(job)}-{i:03d}" offset="{t2str(offset, fps)}" '
            f'duration="{t2str(dur, fps)}" format="r1">\n'
            f'          <video ref="r2" offset="{t2str(offset, fps)}" '
            f'duration="{t2str(dur, fps)}" start="{t2str(seg["start"], fps)}"/>\n'
            f'          <audio ref="r2" offset="{t2str(offset, fps)}" '
            f'duration="{t2str(dur, fps)}" start="{t2str(seg["start"], fps)}"/>\n'
            f'        </clip>'
        )
        clips.append(clip_xml)
        offset += dur

    total_duration = t2str(offset, fps)

    return f'''<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="hf-pipeline-format" frameDuration="{frame_duration}" width="{info['width']}" height="{info['height']}"/>
    <asset id="r2" name="{escape(media_path.name)}" src="{escape(asset_uri)}" start="0s" duration="{asset_duration}" hasVideo="1" hasAudio="1" format="r1"/>
  </resources>
  <library>
    <event name="{escape(job)}">
      <project name="{escape(job)}-roughcut">
        <sequence format="r1" duration="{total_duration}">
          <spine>
{chr(10).join(clips)}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>
'''


def build_cutsheet(job: str, cl: dict, fps: Fraction) -> str:
    lines = [f"# {job} — cut sheet (fallback for apps that don't import FCPXML)",
             f"# source: {cl['source']}  fps: {float(fps):.3f}",
             "# Place raw/<file> on the timeline once, then trim to these in/out points.",
             ""]
    out_offset = 0.0
    for seg in cl["segments"]:
        tag = "KEEP" if seg["kept"] else f"drop ({seg['reason']})"
        lines.append(
            f"source {tc(seg['start'], fps)} - {tc(seg['end'], fps)}  ->  {tag}"
            + (f"   | timeline in {tc(out_offset, fps)}" if seg["kept"] else "")
        )
        if seg["kept"]:
            out_offset += seg["end"] - seg["start"]
    return "\n".join(lines) + "\n"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("job")
    args = ap.parse_args()

    job_dir = REPO_ROOT / "projects" / args.job
    cutlist_path = job_dir / "cutlist.json"
    if not cutlist_path.exists():
        raise SystemExit(f"missing {cutlist_path} — run the rough-cut skill first")

    cl = cutlist_mod.load_cutlist(str(cutlist_path))
    media_path = job_dir / cl["source"]
    if not media_path.exists():
        raise SystemExit(f"raw source not found: {media_path}")

    info = probe(media_path)
    fcpxml = build_fcpxml(args.job, cl, media_path, info)
    cutsheet = build_cutsheet(args.job, cl, info["fps"])

    out_dir = job_dir / "outputs"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{args.job}.fcpxml").write_text(fcpxml, encoding="utf-8")
    (out_dir / f"{args.job}-cutsheet.txt").write_text(cutsheet, encoding="utf-8")

    kept_n = len(cutlist_mod.kept_segments(cl))
    print(f"[build_fcpxml] wrote outputs/{args.job}.fcpxml ({kept_n} clips, all referencing raw/{media_path.name})")
    print(f"[build_fcpxml] wrote outputs/{args.job}-cutsheet.txt (manual fallback)")


if __name__ == "__main__":
    main()
