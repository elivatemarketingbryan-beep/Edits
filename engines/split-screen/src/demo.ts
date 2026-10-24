import type {EditPlan} from './types';

export const demoPlan: EditPlan = {
  version: 1, title: 'Make the idea visible', fps: 30, width: 1080, height: 1920,
  source: {path: 'demo/source.mp4', durationInFrames: 420, width: 1080, height: 1080, hasAudio: true},
  brand: {name: '', accent: '#777777', background: '#FFFFFF', surface: '#FFFFFF', text: '#111111', muted: '#777777'},
  edit: {cuts: [{startFrame: 0, endFrame: 420, reason: 'Original synthetic demo fixture; preserve the complete source.'}]},
  beats: [
    {id: 'hook', from: 0, durationInFrames: 90, layout: 'split', backdrop: 'soft', colors: {background: '#F9EDDC', surface: '#FFFBF3', accent: '#94BCEB', text: '#30354B', muted: '#898178'}, headline: 'Make the idea visible.', kicker: 'A better way to explain', visual: {type: 'custom', component: 'IdeaLens', props: {focus: 'The useful idea', context: 'Find the part that matters'}}, rationale: 'Warm paper, a blue magnifying glass, shadows, and an enlarged detail make a tactile inspection metaphor. The object determines this scene’s material and color.'},
    {id: 'meaning', from: 90, durationInFrames: 120, layout: 'graphic', backdrop: 'soft', colors: {background: '#16192F', surface: '#262B52', accent: '#9658C5', text: '#F6F1FF', muted: '#B3AEC7'}, headline: 'Many details. One clear idea.', kicker: 'Direct the attention', visual: {type: 'custom', component: 'SignalFocus', props: {label: 'Find the meaning'}}, rationale: 'The full-frame scene changes medium to a luminous signal diagram: fine paths converge against a dark violet field. This visual language belongs to the abstract relationship.'},
    {id: 'workflow', from: 210, durationInFrames: 120, layout: 'split', backdrop: 'plain', colors: {background: '#FFFFFF', surface: '#FFFFFF', accent: '#CBE87E', text: '#181B16', muted: '#777C70'}, headline: 'Let the story lead.', kicker: 'Every topic is different', visual: {type: 'steps', items: [{title: 'Keep what matters', detail: 'The speaker carries the story.'}, {title: 'Show the relationship', detail: 'Build a visual with a purpose.'}, {title: 'Give it room to land', detail: 'Let the viewer understand.'}]}, rationale: 'A restrained editorial list supports a short procedure: white space, clear type, and lime step markers. This is one suitable treatment for a process, not a universal scene template.'},
    {id: 'close', from: 330, durationInFrames: 90, layout: 'split', backdrop: 'plain', colors: {background: '#F3F0DD', surface: '#FDFBEA', accent: '#97B879', text: '#294F38', muted: '#81846C'}, headline: 'Give ideas room to grow.', kicker: 'A different visual language', visual: {type: 'custom', component: 'GrowthCycle', props: {label: 'Let the story take root'}}, rationale: 'A botanical cutaway replaces the technical diagram. Cream paper, natural greens, roots, and leaf forms explain growth through the subject’s own visual language.'}
  ],
  captions: [],
  notes: ['Original procedural fixture, not a member edit or a Jack Roberts reconstruction. Run npm run demo to generate test source media. Demo contains a quiet tone, not spoken narration.']
};
