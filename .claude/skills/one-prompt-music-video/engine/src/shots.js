// THE SHOT LIST — single source of truth for timing + intent. Replace the starter shot with the real storyboard
// (see the skill's references/storyboard.md). Each scene file does `export default { ...shot('V04'), init, draw }`.
// group = folder under src/scenes/ (one builder owns one group). hud: 'ink' (dark HUD text, bright scenes) | 'paper' (light HUD text, dark scenes) | 'none'.

// Palette "worlds" — one per song section. These are the ONE PROMPT worlds; restyle them for your song.
export const WORLDS = {
  intro: { name: 'NIGHT TERMINAL', pal: ['#0A0D1C', '#141A35', '#FF6A1F', '#FF8A3D', '#FFFBF4'], note: 'dark navy-black + glowing orange' },
  verse1: { name: 'PAPER STUDIO', pal: ['#F4EDE0', '#E9DFCC', '#1F2A55', '#E8343F', '#FF6A1F'], note: 'cream paper, navy ink, red, orange' },
  pre1: { name: 'SKY BUILD', pal: ['#6EC3F0', '#2E8BE0', '#FFFFFF', '#FFD23F', '#1F2A55'], note: 'sky blue, white, sun yellow' },
  chorus1: { name: 'SUNBURST POP', pal: ['#FF3E8A', '#FF7A1A', '#FFE14D', '#7B2FF7', '#FFFBF4'], note: 'max bright pink/orange/yellow' },
  verse2: { name: 'INTERNET BRUTALISM', pal: ['#FFFFFF', '#2B2BFF', '#FF2A2A', '#C3C3C3', '#0E0E12'], note: 'white, electric blue, error red, Win95 grey' },
  pre2: { name: 'GOLD RUSH', pal: ['#FFC300', '#E0A100', '#FFF4D6', '#111111', '#FF6A1F'], note: 'gold, cream, black' },
  chorus2: { name: 'CHROME VOXEL NEON', pal: ['#B79CFF', '#3EF0FF', '#7CFFC4', '#DDE3EE', '#1A1240'], note: 'lilac, cyan, mint, chrome' },
  bridge: { name: 'WARM THANK-YOU', pal: ['#FFB38A', '#FF8FB1', '#FFB000', '#C9B6FF', '#FFF4EA'], note: 'sunset peach, pink, gold' },
  final: { name: 'ALL WORLDS COLLIDE', pal: ['#FF3E8A', '#3EF0FF', '#FFC300', '#2B2BFF', '#7CFFC4', '#FF6A1F'], note: 'every palette, swap per beat' },
  outro: { name: 'SUNRISE', pal: ['#FF9E5E', '#FFD23F', '#8FD3FF', '#FFFBF4', '#1F2A55'], note: 'dawn orange → sky blue' },
};

const S = (id, group, world, start, end, lyric, title, tech, cat, hud, desc) => ({ id, group, world, start, end, lyric, title, tech, cat, hud, desc });

export const SHOTS = [
  S('S01', 'start', 'chorus1', 0, 9999, '(whole song)', 'Starter: CURSOR sings your song', 'STARTER SCENE', 'ENGINE CHECK', 'ink',
    'Proves the pipeline: CURSOR dances on the beat and lip-syncs the vocal while the current lyric line slams in word by word. Replace with the real storyboard.'),
];

export const shot = (id) => { const s = SHOTS.find((x) => x.id === id); if (!s) throw new Error('no shot ' + id); return s; };
