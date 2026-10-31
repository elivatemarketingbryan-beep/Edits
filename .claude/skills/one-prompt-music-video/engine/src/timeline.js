// Assembles every shot's scene module. Each scene is imported on its own so one broken file (e.g. a builder's
// work in progress) degrades to a red error card for that shot instead of breaking the whole video.
import { SHOTS } from './shots.js';
import { placeholder } from './scenes/_placeholder.js';
import { W, H } from './core/lib.js';
import { A } from './core/audio.js';

export let DURATION = 165; // replaced by the song length from data/audio.json
export const SCENES = [];

export async function loadTimeline() {
  if (A.data && A.data.duration) DURATION = A.data.duration;
  const mods = await Promise.all(SHOTS.map(async (S) => {
    try {
      const m = await import(`./scenes/${S.group}/${S.id}.js`);
      return m.default;
    } catch (e) {
      console.error('import', S.id, e);
      const msg = String((e && e.message) || e);
      return { ...S, importError: msg, draw(ctx, t, s) { placeholder(ctx, t, s, S); ctx.fillStyle = 'rgba(160,0,0,0.85)'; ctx.fillRect(0, H - 160, W, 90); ctx.fillStyle = '#fff'; ctx.font = '28px monospace'; ctx.fillText(('IMPORT ERROR ' + S.id + ': ' + msg).slice(0, 120), 40, H - 110); } };
    }
  }));
  SCENES.length = 0;
  SCENES.push(...mods.sort((a, b) => a.start - b.start));
  return SCENES;
}
