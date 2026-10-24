"""Suggest brand.json colour roles from a prepared logo (and optional extra hex colours from a website).

  python suggest_brand.py <logo_dir> [--extra "#0A84FF,#111111"] [--name "Brand"] -o brand.json
  --extra takes ONE comma-separated list (e.g. every colour capture.py printed for the website).

Roles:  bg      the dominant field colour of the video (usually the brand's signature colour)
        primary the logo / liquid / hero colour drawn ON bg (must read on bg)
        ink     dark text colour      paper  light text colour      accent  a second pop colour
Review the result: if the brand is known for a colour, make it bg.
"""
import argparse, json, os, sys, colorsys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from core import hex2rgb, rgb2hex, contrast, luminance, mix

def sat(c):
    h, l, s = colorsys.rgb_to_hls(*[v / 255 for v in c]); return s * (1 - abs(2 * l - 1))

def suggest(logo_dir, extra=(), name=''):
    d = json.load(open(os.path.join(logo_dir, 'logo.json')))
    pal = [hex2rgb(h) for h in d['palette']] + [hex2rgb(h) for h in extra]
    tile = hex2rgb(d['background']) if d.get('background') else None
    cands = pal + ([tile] if tile else [])
    colorful = sorted([c for c in cands if sat(c) > 0.25], key=lambda c: -sat(c))
    neutrals = [c for c in cands if sat(c) <= 0.25]
    darkest = min(cands, key=luminance) if cands else (20, 20, 20)
    ink = darkest if luminance(darkest) < 0.06 else (18, 18, 20)
    paper = (255, 255, 255)
    for c in neutrals:
        if luminance(c) > 0.85: paper = c
    main = hex2rgb(d['palette'][0])           # the logo's biggest colour (its body / tile)
    hero_c = None
    if d.get('hero') is not None:
        hp = next((c for c in d['components'] if c['id'] == d['hero']), None)
        if hp and hp['kind'] == 'shape': hero_c = hex2rgb(hp['color'])
    ok = lambda c: contrast(c, main) >= 1.25 and (hero_c is None or contrast(c, hero_c) >= 1.4)
    logo_cols = [hex2rgb(h) for h in d['palette']]
    # bg: the signature colour, but never the logo's own body colour (the logo would vanish on it)
    if tile and sat(tile) > 0.25 and ok(tile): bg = tile
    else:
        options = [c for c in colorful if ok(c)]
        site_dark = [hex2rgb(h) for h in extra if luminance(hex2rgb(h)) < 0.08 and ok(hex2rgb(h))]
        if options: bg = options[0]
        elif site_dark: bg = site_dark[0]
        else: bg = ink if contrast(ink, main) >= contrast(paper, main) else paper
    # primary: the logo colour (any of them) that reads best on bg, so the hero/liquid stay on brand
    primary = max(logo_cols, key=lambda c: contrast(c, bg))
    if contrast(primary, bg) < 1.3: primary = paper if contrast(paper, bg) >= contrast(ink, bg) else ink
    others = [c for c in colorful if c not in (bg, primary) and contrast(c, bg) > 1.3]
    accent = others[0] if others else mix(bg, paper if luminance(bg) < 0.4 else ink, 0.25)
    notes = []
    if hero_c is not None and colorful and colorful[0] == hero_c and bg != hero_c:
        notes.append(f"{rgb2hex(hero_c)} is the hero part's own colour, so it was not used as bg (the character would vanish)")
    elif colorful and bg != colorful[0]:
        notes.append(f"the logo's body colour {rgb2hex(main)} was not used as bg because the logo would disappear on it; "
                     f"if you want the video on that colour, scenes that show the full logo get a contrasting plate automatically")
    out = {'name': name, 'logo': os.path.relpath(logo_dir), 'hero': d.get('hero'),
           'colors': {k: rgb2hex(v) for k, v in dict(bg=bg, primary=primary, ink=ink, paper=paper, accent=accent).items()},
           'fonts': {'display': 'unbounded', 'text': 'space-grotesk-medium', 'label': 'space-grotesk'}}
    report = {k: round(contrast(hex2rgb(out['colors'][k]), bg), 2) for k in ('primary', 'ink', 'paper', 'accent')}
    return out, report, notes

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('logo_dir'); ap.add_argument('--extra', default=''); ap.add_argument('--name', default='')
    ap.add_argument('-o', '--out', default='brand.json')
    a = ap.parse_args()
    out, rep, notes = suggest(a.logo_dir, [x.strip() for x in a.extra.split(',') if x.strip()], a.name)
    json.dump(out, open(a.out, 'w'), indent=1)
    print(json.dumps(out, indent=1)); print('contrast vs bg:', rep, '(text needs 3+, big shapes 1.3+)')
    for n in notes: print('note:', n)
