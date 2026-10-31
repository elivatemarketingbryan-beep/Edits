# Editor V3 prompts that worked

Replace the parts in {curly brackets}. Describe the real person exactly as they look in the frame. The prompts here say "man" and "he", so change those to fit.

## Chapter still: `gpt_image_2_5`, 16:9, real side frame as `image_references`

Edit this real photo. Keep the exact same man: same side profile, nose, lips, chin, {facial hair, glasses, hair, hat}, {clothes}, exact pose, exact framing and exact position in the frame. Do not redraw or beautify him. Change only the lighting and the background. Make it a real cinematic photograph: {LOOK}. Remove everything else: no door, no furniture, no lamps, no objects, no text. Shallow depth of field, subtle film grain, shot on a 35mm cinema camera, realistic, not CGI.

**Red LOOK:** he is strongly backlit so he reads as a near-black silhouette (colour #060b0e), his face and features barely visible in deep shadow, only a very faint deep red light spilling on the clothes and a thin soft rim along the hair and nose. Background: a seamless deep saturated blood red wall (colour #8c0000) with a soft glow a little brighter directly behind his head, falling into a heavy vignette that darkens to #4a0000 at the bottom and edges. Never orange, never pink.

**Blue LOOK:** he is strongly backlit so he reads as a near-black silhouette (colour #080a0c), his face and features barely visible in deep shadow, only a very faint deep blue light spilling on the clothes and a thin soft rim along the hair and nose. Background: a seamless deep saturated blue wall (colour #000174) with a soft glow brightest directly behind his head, falling into a heavy vignette that darkens to #000059 at the bottom and edges.

**Teal LOOK:** on a pale misty backdrop he is backlit and reads as a near-black silhouette (colour #090b0f), his face in deep shadow with only the faintest hint of the ear and neck, the clothes a very dark blue-teal shape with a soft fill of the backdrop colour. Background: a seamless pale sage green-grey wall (colour #c2cdc5 at the top and behind his head), falling softly into a muted blue-teal (colour #61888a) at the bottom and corners, with a soft vignette. Calm, quiet, foggy light.

## Silhouette clip: `kling_video_edit`, source clip as `video_references`, chapter still as `image_references`

This is the blue version. Swap the wall sentence and the rim colour for the chapter's colour. List whatever is really in the room under "Remove".

Match the look of the reference image exactly, while the man keeps every movement from the source video: mouth, lips, jaw, head and timing stay exactly as filmed, the mouth opens and closes as he speaks. Same man, same side profile, same framing. He is a completely near-black silhouette: face, {hat, glasses} and clothes are all the same near-black with no visible fabric, no logo, no skin, no light on him. Only a thin faint rim of blue along his outline. Behind him a seamless deep blue wall: a dim soft wash of saturated navy blue, a little brighter behind his head, falling into a dark vignette. Never cyan, never white, no bright halo, no bright circle. Remove {the door, furniture, lamps} and all objects. No text. Static camera. Subtle film grain, real 35mm cinema footage, not CGI.

Note: the reference's wall stays more evenly saturated into the corners than this result. Asking for a more even wash may bring it closer.
