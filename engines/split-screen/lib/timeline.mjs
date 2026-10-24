/** Pure timeline helpers. All plan times are integer frames; transcript times are seconds. */
export function outputDuration(cuts) {
  return cuts.reduce((sum, cut) => sum + cut.endFrame - cut.startFrame, 0);
}

export function locateSourceFrame(cuts, outputFrame) {
  let cursor = 0;
  for (const cut of cuts) {
    const duration = cut.endFrame - cut.startFrame;
    if (outputFrame >= cursor && outputFrame < cursor + duration) return cut.startFrame + outputFrame - cursor;
    cursor += duration;
  }
  return null;
}

/** Map a source interval into every retained occurrence. End frames are exclusive. */
export function mapSourceInterval(startFrame, endFrame, cuts) {
  let cursor = 0;
  const result = [];
  for (const cut of cuts) {
    const start = Math.max(startFrame, cut.startFrame);
    const end = Math.min(endFrame, cut.endFrame);
    if (end > start) result.push({startFrame: cursor + start - cut.startFrame, endFrame: cursor + end - cut.startFrame});
    cursor += cut.endFrame - cut.startFrame;
  }
  return result;
}

/** Keep real word timestamps when supplied. Phrase imports never fabricate word timing. */
export function mapTranscriptToCaptions(transcript, cuts, fps = 30, maxWords = 3) {
  const captions = [];
  const warnings = new Set();
  let cursor = 0;
  for (const cut of cuts) {
    for (const segment of transcript.segments) {
      const segStart = Math.round(segment.start * fps);
      const segEnd = Math.round(segment.end * fps);
      if (segEnd <= cut.startFrame || segStart >= cut.endFrame) continue;
      if (segment.words?.length) {
        if (segment.words.some(word => (word.start * fps < cut.startFrame && word.end * fps > cut.startFrame) || (word.start * fps < cut.endFrame && word.end * fps > cut.endFrame))) warnings.add('A cut crosses a spoken word. Review the edit point and move it to a speech boundary.');
        const words = segment.words.map(word => ({
          startFrame: Math.max(cut.startFrame, Math.round(word.start * fps)),
          endFrame: Math.min(cut.endFrame, Math.round(word.end * fps)),
          text: word.text.trim(),
        })).filter(word => word.endFrame > word.startFrame && word.text).map(word => ({
          ...word,
          startFrame: cursor + word.startFrame - cut.startFrame,
          endFrame: cursor + word.endFrame - cut.startFrame,
        }));
        for (let offset = 0; offset < words.length; offset += maxWords) {
          const group = words.slice(offset, offset + maxWords);
          captions.push({startFrame: group[0].startFrame, endFrame: group.at(-1).endFrame, text: group.map(w => w.text).join(' '), words: group});
        }
      } else {
        if (segStart < cut.startFrame || segEnd > cut.endFrame) warnings.add('A cut crosses a phrase-only transcript segment. Review the full phrase against the retained speech, or supply word timestamps.');
        captions.push({
          startFrame: cursor + Math.max(segStart, cut.startFrame) - cut.startFrame,
          endFrame: cursor + Math.min(segEnd, cut.endFrame) - cut.startFrame,
          text: segment.text.trim(),
        });
      }
    }
    cursor += cut.endFrame - cut.startFrame;
  }
  captions.sort((a, b) => a.startFrame - b.startFrame || a.endFrame - b.endFrame);
  return {captions: captions.filter(c => c.endFrame > c.startFrame && c.text), warnings: [...warnings]};
}
