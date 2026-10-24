const finite = value => typeof value === 'number' && Number.isFinite(value);

// Some editors export absolute start + duration instead of start + end.
// Never round imported seconds here; output-frame quantization happens later.
const endTime = item => item?.end !== undefined ? item.end : finite(item?.start) && finite(item?.duration) ? item.start + item.duration : undefined;
const wordText = word => String(word?.text ?? word?.word ?? '').trim();

function readTime(value) {
  const parts = value.trim().replace(',', '.').split(':').map(Number);
  if (parts.length < 2 || parts.length > 3 || parts.some(v => !Number.isFinite(v))) throw new Error(`Invalid subtitle time: ${value}`);
  return parts.reduce((result, part) => result * 60 + part, 0);
}

export function parseSubtitles(content) {
  const blocks = content.replace(/^\uFEFF/, '').replace(/\r/g, '').trim().split(/\n\s*\n/);
  const segments = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    const timeIndex = lines.findIndex(line => line.includes('-->'));
    if (timeIndex < 0) continue;
    const [start, end] = lines[timeIndex].split('-->').map(v => v.trim().split(/\s/)[0]);
    const text = lines.slice(timeIndex + 1).join(' ').replace(/<[^>]*>/g, '').trim();
    if (text) segments.push({start: readTime(start), end: readTime(end), text});
  }
  if (!segments.length) throw new Error('No subtitle cues found. Expected an SRT or VTT file with timestamp lines.');
  return normalizeTranscript({segments});
}

export function normalizeTranscript(input) {
  if (!input || typeof input !== 'object') throw new Error('Transcript must be a JSON object or segment array.');
  let raw = Array.isArray(input) ? input : input.segments;
  if (Array.isArray(raw) && Array.isArray(input.words)) raw = raw.map(segment => segment && !segment.words?.length ? {...segment, words: input.words.filter(word => word?.start >= segment.start - 0.05 && endTime(word) <= endTime(segment) + 0.05)} : segment);
  if (!raw && Array.isArray(input.words) && input.words.length) raw = [{start: input.words[0]?.start, end: endTime(input.words.at(-1)), text: input.text || input.words.map(wordText).join(' '), words: input.words}];
  if (!Array.isArray(raw) || !raw.length) throw new Error('Transcript requires a nonempty segments array (or words array).');
  const segments = raw.map((segment, i) => {
    if (!segment || typeof segment !== 'object') throw new Error(`Transcript segment ${i + 1} must be an object.`);
    const start = segment.start;
    const end = endTime(segment);
    if (segment.words !== undefined && !Array.isArray(segment.words)) throw new Error(`Transcript segment ${i + 1} words must be an array.`);
    const text = String(segment.text ?? segment.words?.map(wordText).join(' ') ?? '').trim();
    if (!finite(start) || !finite(end) || start < 0 || end <= start || !text) throw new Error(`Transcript segment ${i + 1} needs nonempty text and valid start/end seconds.`);
    const result = {start, end, text};
    if (segment.words?.length) {
      result.words = segment.words.map((word, j) => {
        if (!word || typeof word !== 'object') throw new Error(`Invalid word ${j + 1} in segment ${i + 1}.`);
        const item = {start: word.start, end: endTime(word), text: wordText(word)};
        if (!finite(item.start) || !finite(item.end) || item.start < start - 0.05 || item.end > end + 0.05 || item.end <= item.start || !item.text) throw new Error(`Invalid word ${j + 1} in segment ${i + 1}. Word timing must fit the segment.`);
        return item;
      });
      for (let j = 1; j < result.words.length; j++) {
        if (result.words[j].start < result.words[j - 1].end - 0.001) throw new Error(`Overlapping word timestamps in segment ${i + 1}. Correct the transcript before import.`);
      }
    }
    return result;
  });
  segments.sort((a, b) => a.start - b.start);
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].start < segments[i - 1].end - 0.001) throw new Error(`Overlapping transcript segments near ${segments[i].start}s. Resolve simultaneous speakers before import.`);
  }
  return {version: 1, timing: segments.every(s => s.words?.length) ? 'word' : segments.some(s => s.words?.length) ? 'mixed' : 'phrase', ...(input.language ? {language: input.language} : {}), segments};
}
