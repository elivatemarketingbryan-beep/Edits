# Editing pack assets (user-supplied)

Source: the user's "ULTIMATE Editing Pack" (Downloads/ULTIMATE Editing Pack-20260901T180354Z-1-001.zip; an extracted copy is at OneDrive/Desktop/Claude FIles/video-editor-client/video-editor/assets/ULTIMATE Editing Pack). Converted 2026-10-17 for the renderer:
- markup/*.webm: from "Circles, Squares, and Lines/*.mov" (qtrle ARGB 1920x1080 at 23.976 fps), converted to VP9 with alpha, 960 wide, 30 fps.
- burn/burn1–3.mp4: FILMBURN_HARD_001–003. burn4–5.mp4: FILMBURN_HARDSCRATCH_001–002. Cover-cropped to 1080x1920 at 30 fps.
- grain/grain35.mp4: DylanJohn_35mmGrain.mov, looped to 8 s, 1080x1920.
- logos/*.png: "PNGs/" copied as-is. emoji/*.png: "Emojis/" copied as-is.
Use through src/custom/pack/packKit.tsx (Markup, Burn, Grain, Logo, Emoji).
