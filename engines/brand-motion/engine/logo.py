"""Logo preparation (vectorize any PNG/JPG/SVG/WEBP) and the runtime Logo renderer.

prepare():  logo file -> <out>/logo.json + logo_clean.png + logo_parts.png (numbered components preview)
Logo:       draws the logo (vector layers, exact raster, outline draw-on, liquid fill, hero part moved/hidden)
"""
import json, math, os, sys
import numpy as np, cv2, skia
from PIL import Image
from core import *

MAX_SIDE = 1024

# ====================================================================== preparation
def _load_rgba(src):
    ext = os.path.splitext(src)[1].lower()
    if ext == '.svg':
        dom = skia.SVGDOM.MakeFromStream(skia.FILEStream.Make(src))
        sz = dom.containerSize()
        w, h = (sz.width(), sz.height()) if sz.width() > 0 else (1024, 1024)
        k = 2048 / max(w, h)
        surf = skia.Surface(int(w * k), int(h * k)); c = surf.getCanvas(); c.clear(skia.ColorTRANSPARENT)
        c.scale(k, k); dom.setContainerSize(skia.Size(w, h)); dom.render(c)
        return surf.makeImageSnapshot().toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)
    return np.array(Image.open(src).convert('RGBA'))

def _key_background(rgba, bg_hint=None):
    """If the image sits on an opaque, flat background (white square, app-store tile backdrop...), remove only the
    background that is CONNECTED TO THE BORDER. Same-coloured areas inside the mark (a white plane in a green tile)
    are kept. Returns (rgba, background_rgb or None)."""
    a = rgba[:, :, 3].astype(float)
    h, w = a.shape; b = max(2, int(min(h, w) * 0.02))
    border = np.concatenate([rgba[:b].reshape(-1, 4), rgba[-b:].reshape(-1, 4), rgba[:, :b].reshape(-1, 4), rgba[:, -b:].reshape(-1, 4)])
    if bg_hint is None:
        if np.mean(border[:, 3]) < 200:          # already transparent background
            return rgba, None
        bg = np.median(border[:, :3], axis=0)
        if np.mean(np.abs(border[:, :3] - bg)) > 14:   # border is busy (a photo, a gradient): keep as is
            return rgba, None
    else: bg = np.array(bg_hint, float)
    d = np.sqrt(((rgba[:, :, :3].astype(float) - bg) ** 2).sum(2))
    near = (d < 38).astype(np.uint8)
    # flood fill from every border pixel that is background-coloured
    n, lab = cv2.connectedComponents(near, connectivity=4)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    edge_labels = [k for k in edge_labels if near[lab == k].any()]
    outside = np.isin(lab, edge_labels)
    # soft edge: inside the flooded region alpha follows colour distance (anti-aliased rim), elsewhere opaque
    soft = np.clip((d - 18) / 40.0, 0, 1)
    alpha = np.where(outside, soft, 1.0)
    out = rgba.copy(); out[:, :, 3] = (np.minimum(alpha, a / 255.0) * 255).astype(np.uint8)
    # de-fringe: un-mix the background colour from semi-transparent rim pixels
    al = out[:, :, 3:4].astype(float) / 255.0
    rgb = out[:, :, :3].astype(float)
    fixed = np.where(al > 0.02, (rgb - bg * (1 - al)) / np.maximum(al, 0.02), rgb)
    out[:, :, :3] = np.clip(fixed, 0, 255).astype(np.uint8)
    return out, tuple(int(v) for v in bg)

def _crop(rgba, pad=0.03):
    a = rgba[:, :, 3] > 24
    ys, xs = np.where(a)
    if len(xs) == 0: raise ValueError('logo looks empty after background removal')
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    p = int(max(x1 - x0, y1 - y0) * pad)
    x0, y0 = max(0, x0 - p), max(0, y0 - p); x1, y1 = min(rgba.shape[1] - 1, x1 + p), min(rgba.shape[0] - 1, y1 + p)
    rgba = rgba[y0:y1 + 1, x0:x1 + 1]
    k = MAX_SIDE / max(rgba.shape[:2])
    im = Image.fromarray(rgba).resize((max(1, round(rgba.shape[1] * k)), max(1, round(rgba.shape[0] * k))), Image.LANCZOS)
    return np.array(im)

def _quantize(rgba, max_colors):
    a = rgba[:, :, 3]
    solid = a > 160
    px = rgba[:, :, :3][solid].astype(np.float32)
    lab_all = cv2.cvtColor(rgba[:, :, :3], cv2.COLOR_RGB2LAB).astype(np.float32)
    lab = lab_all[solid]
    if len(px) > 60000:
        idx = np.random.RandomState(0).choice(len(px), 60000, replace=False); sample = lab[idx]
    else: sample = lab
    best = None
    K = max(1, min(max_colors, len(sample)))
    crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
    _, lbl, centers = cv2.kmeans(sample, K, None, crit, 4, cv2.KMEANS_PP_CENTERS)
    centers = centers.astype(float)
    # merge clusters that are perceptually close
    merged = True
    while merged and len(centers) > 1:
        merged = False
        for i in range(len(centers)):
            for j in range(i + 1, len(centers)):
                if np.linalg.norm(centers[i] - centers[j]) < 14:
                    centers = np.delete(centers, j, 0); merged = True; break
            if merged: break
    d = np.stack([np.linalg.norm(lab_all - cc, axis=2) for cc in centers], 2)
    labels = np.argmin(d, 2).astype(np.uint8)
    labels[a <= 110] = 255
    labels = cv2.medianBlur(labels, 5)
    # drop tiny clusters
    keep = []
    for k in range(len(centers)):
        frac = np.mean(labels == k)
        if frac > 0.002: keep.append(k)
    colors = []
    for k in keep:
        m = labels == k
        colors.append(tuple(int(v) for v in np.median(rgba[:, :, :3][m], axis=0)))
    return labels, keep, colors

def _contours(mask, eps=0.7):
    """mask (bool) -> list of (outer, [holes]) polygons at original scale, traced at 2x for smooth edges."""
    m = cv2.GaussianBlur(mask.astype(np.float32), (0, 0), 0.9)
    m = cv2.resize(m, (mask.shape[1] * 2, mask.shape[0] * 2), interpolation=cv2.INTER_CUBIC)
    m = (m > 0.5).astype(np.uint8)
    cs, hier = cv2.findContours(m, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    out = []
    if hier is None: return out
    hier = hier[0]
    for i, h in enumerate(hier):
        if h[3] != -1: continue                       # not an outer contour
        if cv2.contourArea(cs[i]) < 40: continue
        outer = cv2.approxPolyDP(cs[i], eps, True)[:, 0, :] / 2.0
        holes = []
        ch = h[2]
        while ch != -1:
            if cv2.contourArea(cs[ch]) >= 40:
                holes.append(cv2.approxPolyDP(cs[ch], eps, True)[:, 0, :] / 2.0)
            ch = hier[ch][0]
        out.append((outer, holes))
    return out

def _fill_holes(mask):
    m = mask.astype(np.uint8)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    f = np.zeros_like(m); cv2.drawContours(f, cs, -1, 1, -1)
    return f.astype(bool)

def _poly_area(p):
    x, y = p[:, 0], p[:, 1]; return 0.5 * abs(np.dot(x, np.roll(y, 1)) - np.dot(y, np.roll(x, 1)))

def _crop_pair(rgba, raster, pad=0.03):
    """crop the vector source and the exact raster with the same box (the vector's)."""
    a = rgba[:, :, 3] > 24
    ys, xs = np.where(a)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    p = int(max(x1 - x0, y1 - y0) * pad)
    box = (max(0, x0 - p), max(0, y0 - p), min(rgba.shape[1] - 1, x1 + p), min(rgba.shape[0] - 1, y1 + p))
    out = []
    for im in (rgba, raster):
        cr = im[box[1]:box[3] + 1, box[0]:box[2] + 1]
        k = MAX_SIDE / max(cr.shape[:2])
        out.append(np.array(Image.fromarray(cr).resize((max(1, round(cr.shape[1] * k)), max(1, round(cr.shape[0] * k))), Image.LANCZOS)))
    return out

def prepare(src, out_dir, max_colors=4, background=None, raster_src=None, min_part=0.004, keep_tile=False):
    """raster_src: optional original artwork (same framing as src) whose exact pixels are used for the final
    resolve, e.g. when src is a clean hand-traced SVG of a logo that has glows/gradients.
    keep_tile: keep the raster's square background (only when the video's field is that same colour)."""
    os.makedirs(out_dir, exist_ok=True)
    rgba = _load_rgba(src)
    rgba, bg = _key_background(rgba, hex2rgb(background) if background else None)
    if raster_src:
        r = _load_rgba(raster_src)
        r_keyed, rbg = (r, None) if keep_tile else _key_background(r, hex2rgb(background) if background else None)
        bg = bg or rbg
        r_keyed = np.array(Image.fromarray(r_keyed).resize((rgba.shape[1], rgba.shape[0]), Image.LANCZOS))
        rgba, raster = _crop_pair(rgba, r_keyed)
    else:
        rgba = _crop(rgba); raster = rgba
    if background: bg = hex2rgb(background)
    h, w = rgba.shape[:2]
    Image.fromarray(raster).save(os.path.join(out_dir, 'logo_clean.png'))
    labels, keep, colors = _quantize(rgba, max_colors)
    alpha = rgba[:, :, 3] > 110
    sil = alpha.copy()
    sil_filled = _fill_holes(sil)

    layer_masks = [(labels == k) for k in keep]
    filled = [_fill_holes(m) for m in layer_masks]
    order = sorted(range(len(keep)), key=lambda i: -filled[i].sum())   # biggest silhouette drawn first
    layers, comps = [], []
    for rank, i in enumerate(order):
        m = layer_masks[i].copy()
        # cover seams: extend this layer under any layer drawn above it that sits inside its silhouette
        for j in order[rank + 1:]:
            m |= layer_masks[j] & filled[i]
        polys = _contours(m)
        layers.append({'color': rgb2hex(colors[i]), 'area': int(layer_masks[i].sum()),
                       'polys': [[o.round(2).tolist(), [hh.round(2).tolist() for hh in hs]] for o, hs in polys]})
        li = len(layers) - 1
        for pi, (o, hs) in enumerate(_contours(layer_masks[i])):
            a_ = _poly_area(o) - sum(_poly_area(hh) for hh in hs)
            x0, y0 = o.min(0); x1, y1 = o.max(0)
            comps.append({'kind': 'shape', 'layer': li, 'color': rgb2hex(colors[i]), 'outer': o.round(2).tolist(),
                          'holes': [hh.round(2).tolist() for hh in hs], 'bbox': [float(x0), float(y0), float(x1), float(y1)], 'area': float(a_)})
    # transparent holes in the whole mark (shapes cut out of the logo, e.g. a person inside a flask)
    hole_mask = sil_filled & ~sil
    for o, hs in _contours(hole_mask):
        x0, y0 = o.min(0); x1, y1 = o.max(0)
        ring = cv2.dilate(np.zeros((h, w), np.uint8), None)
        hm = np.zeros((h, w), np.uint8); cv2.fillPoly(hm, [o.astype(np.int32)], 1)
        ring = cv2.dilate(hm, np.ones((9, 9), np.uint8)) & (1 - hm)
        lab_ring = labels[ring.astype(bool)]
        lab_ring = lab_ring[lab_ring != 255]
        enc = None
        if len(lab_ring):
            vals, cnts = np.unique(lab_ring, return_counts=True)
            k = vals[np.argmax(cnts)]
            if k in keep: enc = order.index(keep.index(k))
        comps.append({'kind': 'hole', 'layer': enc, 'color': rgb2hex(bg) if bg else None, 'outer': o.round(2).tolist(), 'holes': [],
                      'bbox': [float(x0), float(y0), float(x1), float(y1)], 'area': float(_poly_area(o))})
    total0 = float(sil_filled.sum())
    comps = [c_ for c_ in comps if c_['area'] >= min_part * total0]
    comps.sort(key=lambda c_: -c_['area'])
    for k, c_ in enumerate(comps): c_['id'] = k
    total = float(sil_filled.sum())
    hero = _suggest_hero(comps, total, w, h)
    data = {'source': os.path.abspath(src), 'size': [w, h], 'background': rgb2hex(bg) if bg else None,
            'layers': layers, 'components': comps, 'hero': hero,
            'palette': [l['color'] for l in layers]}
    with open(os.path.join(out_dir, 'logo.json'), 'w') as f: json.dump(data, f)
    _parts_preview(data, rgba, os.path.join(out_dir, 'logo_parts.png'))
    return data

def _suggest_hero(comps, total, w, h):
    """Pick the most 'character-like' part: a big cut-out (a person in a flask), a part in its own colour
    (the orange dot of a wordmark), or a compact shape that is not the whole mark. Small holes (letter counters) lose."""
    from collections import Counter
    best, score = None, 0
    shape_cols = Counter(c_['color'] for c_ in comps if c_['kind'] == 'shape')
    big_col = max(((c_['color'], c_['area']) for c_ in comps if c_['kind'] == 'shape'), key=lambda x: x[1], default=(None, 0))[0]
    for c_ in comps:
        frac = c_['area'] / max(total, 1)
        if frac < 0.008 or frac > 0.55: continue
        x0, y0, x1, y1 = c_['bbox']
        bw, bh = x1 - x0, y1 - y0
        compact = c_['area'] / max(bw * bh, 1)
        cx, cy = (x0 + x1) / 2 / w, (y0 + y1) / 2 / h
        central = 1 - min(1, math.hypot(cx - 0.5, cy - 0.5) * 1.6)
        if c_['kind'] == 'hole': kind_w = 1.6 if frac >= 0.06 else 0.35
        elif c_['color'] != big_col and shape_cols[c_['color']] <= 2: kind_w = 2.2      # a part in its own accent colour
        else: kind_w = 1.0
        s = kind_w * (0.5 + compact) * (0.5 + 0.6 * central) * (1 - abs(frac - 0.18)) * (0.6 if frac < 0.03 else 1.0)
        if s > score: best, score = c_['id'], s
    return best

def _parts_preview(data, rgba, out):
    w, h = data['size']
    S = 2
    surf = skia.Surface(w * S + 40, h * S + 40); c = surf.getCanvas(); c.clear(col((236, 236, 236)))
    # checker
    for yy in range(0, h * S + 40, 40):
        for xx in range(0, w * S + 40, 40):
            if (xx // 40 + yy // 40) % 2: c.drawRect(skia.Rect.MakeXYWH(xx, yy, 40, 40), paint((214, 214, 214)))
    c.translate(20, 20); c.scale(S, S)
    lg = Logo.from_data(data, None)
    lg._draw_layers(c, hide=None, hole_fill=None)
    pal = [(230, 40, 70), (20, 140, 255), (20, 180, 90), (255, 140, 0), (160, 60, 220), (0, 170, 170)]
    placed = []
    for c_ in data['components'][:24]:
        pth = lg._comp_path(c_)
        pc = pal[c_['id'] % len(pal)]
        c.drawPath(pth, paint(pc, 0.95, stroke=2.2 / S * 2))
        x0, y0, x1, y1 = c_['bbox']
        f = font('inter', 30 / S * 1.2)
        lab = f"{c_['id']}{'h' if c_['kind'] == 'hole' else ''}{'*' if c_['id'] == data['hero'] else ''}"
        tw = f.measureText(lab)
        lx, ly = (x0 + x1) / 2, (y0 + y1) / 2
        while any(abs(lx - px) < tw + 16 and abs(ly - py) < 34 for px, py in placed): ly += 36
        placed.append((lx, ly))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(lx - tw / 2 - 6, ly - 16, tw + 12, 30), 8, 8), paint(pc))
        c.drawString(lab, lx - tw / 2, ly + 8, f, paint(WHITE))
    surf.makeImageSnapshot().save(out, skia.kPNG)

# ====================================================================== runtime
def _smooth_contour(p, poly, corner_deg=48):
    """Add a closed polygon to path p as smooth curves (quadratics through edge midpoints),
    keeping sharp corners sharp. This removes the pixel stair-steps of a traced bitmap."""
    pts = np.asarray(poly, float)
    n = len(pts)
    if n < 3: return
    if n < 5:
        p.moveTo(*pts[0]); [p.lineTo(*q) for q in pts[1:]]; p.close(); return
    prev = np.roll(pts, 1, 0); nxt = np.roll(pts, -1, 0)
    v1 = pts - prev; v2 = nxt - pts
    a1 = np.arctan2(v1[:, 1], v1[:, 0]); a2 = np.arctan2(v2[:, 1], v2[:, 0])
    turn = np.degrees(np.abs((a2 - a1 + np.pi) % (2 * np.pi) - np.pi))
    corner = turn > corner_deg
    mids = (pts + nxt) / 2
    # start at a corner if there is one (keeps it exact), else at a midpoint
    start = int(np.argmax(corner)) if corner.any() else 0
    order = [(start + k) % n for k in range(n)]
    if corner[start]: p.moveTo(*pts[start])
    else: p.moveTo(*mids[(start - 1) % n])
    for k in order:
        if corner[k]:
            p.lineTo(*pts[k])
            p.lineTo(*mids[k])
        else:
            p.quadTo(pts[k][0], pts[k][1], mids[k][0], mids[k][1])
    p.close()

def _poly_path(outer, holes=()):
    p = skia.Path(); p.setFillType(skia.PathFillType.kEvenOdd)
    for poly in [outer] + list(holes):
        _smooth_contour(p, poly)
    return p

class Logo:
    """Draws the brand mark. Placement: centre (cx, cy) on screen and `size` = longest side in px."""
    def __init__(self, logo_dir):
        with open(os.path.join(logo_dir, 'logo.json')) as f: data = json.load(f)
        self._init(data, os.path.join(logo_dir, 'logo_clean.png'))

    @classmethod
    def from_data(cls, data, raster_path):
        o = cls.__new__(cls); o._init(data, raster_path); return o

    def _init(self, data, raster_path):
        self.data = data
        self.w, self.h = data['size']
        self.bg = to_rgb(data['background']) if data.get('background') else None
        self.layers = []
        for l in data['layers']:
            p = skia.Path()
            for outer, holes in l['polys']:
                p.addPath(_poly_path(outer, holes))
            p.setFillType(skia.PathFillType.kEvenOdd)
            self.layers.append({'color': to_rgb(l['color']), 'path': p})
        self.comps = data['components']
        self.set_hero(data.get('hero'))
        self.raster = None; self.raster_opaque = False
        if raster_path and os.path.exists(raster_path):
            self.raster = skia.Image.MakeFromEncoded(skia.Data.MakeFromFileName(raster_path))
            arr = self.raster.toarray(colorType=skia.ColorType.kRGBA_8888_ColorType)
            if arr[:, :, 3].min() > 250:      # opaque tile: fade its edges so it melts into a same-colour background
                hh, ww = arr.shape[:2]; m = max(hh, ww) * 0.15
                yy, xx = np.mgrid[0:hh, 0:ww]
                d = np.minimum(np.minimum(xx, ww - 1 - xx), np.minimum(yy, hh - 1 - yy))
                a = np.clip(d / m, 0, 1); a = a * a * (3 - 2 * a)
                arr = arr.copy(); arr[:, :, 3] = (a * 255).astype(np.uint8)
                arr[:, :, :3] = (arr[:, :, :3] * a[:, :, None]).astype(np.uint8)   # premultiplied
                self.raster = skia.Image.fromarray(arr, colorType=skia.ColorType.kRGBA_8888_ColorType, alphaType=skia.AlphaType.kPremul_AlphaType)
                self.raster_opaque = True
        sil = skia.Path()
        for l in self.layers:
            sil = skia.Op(sil, l['path'], skia.PathOp.kUnion_PathOp) or sil
        self.silhouette = sil
        self.outline = sil
        if self.hero_path is not None and self.hero['kind'] == 'hole':
            self.outline = skia.Op(sil, self._fat(self.hero_path), skia.PathOp.kUnion_PathOp) or sil
        # every contour of every layer (outer edges, inner shapes, cut-outs): used by trace mode 'all'
        self.all_contours = skia.Path()
        for l in self.layers: self.all_contours.addPath(l['path'])
        self._outline_len = None

    # ------------------------------------------------------------ hero
    def set_hero(self, hero_id):
        """hero_id: a part id, a list of part ids (a character made of several pieces), or None (no hero part)."""
        self.hero = None; self.hero_path = None; self.hero_parts = []
        if hero_id is None: return
        ids = [int(i) for i in (hero_id if isinstance(hero_id, (list, tuple)) else [hero_id])]
        parts = [c_ for c_ in self.comps if c_['id'] in ids]
        if not parts: return
        self.hero_parts = parts
        path = skia.Path()
        for c_ in parts: path = skia.Op(path, self._comp_path(c_), skia.PathOp.kUnion_PathOp) or path
        self.hero_path = path
        shapes = [c_ for c_ in parts if c_['kind'] == 'shape']
        main = max(shapes, key=lambda c_: c_['area']) if shapes else max(parts, key=lambda c_: c_['area'])
        x0 = min(c_['bbox'][0] for c_ in parts); y0 = min(c_['bbox'][1] for c_ in parts)
        x1 = max(c_['bbox'][2] for c_ in parts); y1 = max(c_['bbox'][3] for c_ in parts)
        self.hero = {'kind': 'shape' if shapes else 'hole', 'color': main['color'], 'layer': main['layer'], 'bbox': [x0, y0, x1, y1]}
        self.hero_center = ((x0 + x1) / 2, (y0 + y1) / 2)
        self.hero_bottom = y1
        self.hero_size = max(x1 - x0, y1 - y0)

    def _under_color(self, part):
        """colour visible underneath a part when it leaves: the enclosing layer for holes, else the layer below it."""
        if part['kind'] == 'hole':
            return self.layers[part['layer'] if part['layer'] is not None else 0]['color']
        cx = (part['bbox'][0] + part['bbox'][2]) / 2; cy = (part['bbox'][1] + part['bbox'][3]) / 2
        for li in range(part['layer'] - 1, -1, -1):
            if self.layers[li]['path'].contains(cx, cy): return self.layers[li]['color']
        return None

    def _comp_path(self, c_):
        return _poly_path(c_['outer'], c_.get('holes', []))

    def hero_color(self, hole_fill):
        if self.hero is None: return WHITE
        if self.hero['kind'] == 'hole': return hole_fill or self.bg or WHITE
        return to_rgb(self.hero['color'])

    # ------------------------------------------------------------ placement
    def scale(self, size): return size / max(self.w, self.h)

    def _place(self, c, cx, cy, size, rot=0.0, sx=1.0, sy=1.0, anchor='center'):
        s = self.scale(size)
        c.translate(cx, cy); c.rotate(rot); c.scale(s * sx, s * sy)
        if anchor == 'bottom': c.translate(-self.w / 2, -self.h)
        else: c.translate(-self.w / 2, -self.h / 2)

    def to_screen(self, cx, cy, size, x, y):
        s = self.scale(size); return cx + (x - self.w / 2) * s, cy + (y - self.h / 2) * s

    # ------------------------------------------------------------ drawing
    def _draw_layers(self, c, hide=None, hole_fill=None, mono=None, a=1.0):
        parts = self.hero_parts if hide is not None else []
        for li, l in enumerate(self.layers):
            pth = l['path']
            for p_ in parts:
                if p_['kind'] == 'shape' and p_['layer'] == li:
                    pth = skia.Op(pth, self._comp_path(p_), skia.PathOp.kDifference_PathOp) or pth
            c.drawPath(pth, paint(mono or l['color'], a))
        for p_ in parts:
            if p_['kind'] == 'hole':
                c.drawPath(self._comp_path(p_), paint(mono or self._under_color(p_), a))

    def _fat(self, path, k=0.012):
        fat = skia.Path(); sp = skia.Paint(AntiAlias=True); sp.setStyle(skia.Paint.kStrokeAndFill_Style)
        sp.setStrokeWidth(self.w * k); sp.getFillPath(path, fat); return fat

    def draw(self, c, cx, cy, size, a=1.0, rot=0.0, sx=1.0, sy=1.0, anchor='center', mono=None,
             raster=0.0, hide_hero=False, hero_xf=None, hole_fill=None, halo=0.0, halo_rgb=WHITE,
             glow=0.0, glow_rgb=WHITE, sweep=-1.0):
        """hero_xf: dict(dx, dy, sx, sy, rot, color) in logo units, draws the hero part displaced.
        raster: 0..1 crossfade to the exact original pixels (use at the final resolve)."""
        if a <= 0: return
        layer = a < 0.999
        if layer: c.saveLayerAlpha(None, int(a * 255))
        c.save(); self._place(c, cx, cy, size, rot, sx, sy, anchor)
        if halo > 0:
            c.drawPath(self.outline, paint(halo_rgb, 0.55 * halo, blur=self.w * 0.03))
            c.drawPath(self.outline, paint(halo_rgb, 0.3 * halo, blur=self.w * 0.08))
        hide = self.hero if (hide_hero or hero_xf is not None) else None
        if raster < 1:
            self._draw_layers(c, hide=hide, mono=mono)
        if raster > 0 and self.raster is not None:
            loose = [p_ for p_ in self.hero_parts if self._under_color(p_) is None] if hide is not None else []
            if loose:
                c.save()
                for p_ in loose: c.clipPath(self._fat(self._comp_path(p_)), skia.ClipOp.kDifference, True)
            c.drawImageRect(self.raster, skia.Rect.MakeWH(self.w, self.h), skia.SamplingOptions(skia.FilterMode.kLinear, skia.MipmapMode.kLinear), paint(WHITE, raster))
            if loose: c.restore()
            if hide is not None:
                for p_ in self.hero_parts:
                    uc = self._under_color(p_)
                    if uc is not None:
                        c.save(); c.clipPath(self.silhouette if p_['kind'] == 'shape' else self.outline, skia.ClipOp.kIntersect, True)
                        c.drawPath(self._fat(self._comp_path(p_)), paint(uc, raster)); c.restore()
        if glow > 0:
            c.save(); c.clipPath(self.silhouette, skia.ClipOp.kIntersect, True)
            c.drawCircle(self.w / 2, self.h * 1.02, self.w * 0.55, paint(shader=radial(self.w / 2, self.h * 1.02, self.w * 0.55, [(0, glow_rgb, 0.55 * glow), (1, glow_rgb, 0)])))
            c.restore()
        if hero_xf is not None and self.hero_path is not None:
            hx, hy = self.hero_center
            c.save()
            c.translate(hx + hero_xf.get('dx', 0), hy + hero_xf.get('dy', 0)); c.rotate(hero_xf.get('rot', 0))
            c.scale(hero_xf.get('sx', 1), hero_xf.get('sy', 1)); c.translate(-hx, -hy)
            self._paint_hero(c, hero_xf.get('color') or mono, hole_fill, hero_xf.get('a', 1.0))
            c.restore()
        if sweep >= 0:
            c.save(); c.clipPath(self.outline, skia.ClipOp.kIntersect, True)
            x = lerp(-0.2 * self.w, 1.2 * self.w, sweep); c.rotate(18, x, self.h / 2)
            c.drawRect(skia.Rect.MakeLTRB(x - self.w * 0.09, -self.h, x + self.w * 0.09, self.h * 2),
                       paint(shader=linear((x - self.w * 0.09, 0), (x + self.w * 0.09, 0), [(0, WHITE, 0), (0.5, WHITE, 0.42), (1, WHITE, 0)])))
            c.restore()
        c.restore()
        if layer: c.restore()

    def _paint_hero(self, c, color, hole_fill, a):
        """hero in one colour (color given) or in its own colours, part by part (color None)."""
        if color is not None or len(self.hero_parts) <= 1:
            c.drawPath(self.hero_path, paint(color or self.hero_color(hole_fill), a)); return
        for p_ in sorted(self.hero_parts, key=lambda q: -q['area']):
            pc = (hole_fill or self.bg or WHITE) if p_['kind'] == 'hole' else to_rgb(p_['color'])
            c.drawPath(self._comp_path(p_), paint(pc, a))

    def draw_hero(self, c, x, y, size, color, rot=0.0, sx=1.0, sy=1.0, a=1.0, anchor='center', hero_size=None):
        """Draw only the hero part. size = the logo size it belongs to (keeps proportions); or pass hero_size
        to set the hero's own longest side in px. anchor 'bottom' puts (x, y) at the hero's feet."""
        if self.hero_path is None: return self.draw(c, x, y, hero_size or size, a=a, rot=rot, sx=sx, sy=sy, mono=color)
        s = (hero_size / self.hero_size) if hero_size else self.scale(size)
        hx, hy = self.hero_center
        c.save(); c.translate(x, y); c.rotate(rot); c.scale(s * sx, s * sy)
        c.translate(-hx, -(self.hero_bottom if anchor == 'bottom' else hy))
        self._paint_hero(c, color, None, a); c.restore()

    def outline_length(self):
        if self._outline_len is None:
            pm = skia.PathMeasure(self.outline, False); L = 0.0
            while True:
                L += pm.getLength()
                if not pm.nextContour(): break
            self._outline_len = L
        return self._outline_len

    def draw_trace(self, c, cx, cy, size, p, rgb=WHITE, stroke_px=10, tips=True, which='outline'):
        """Pen draws the logo's contours from their top in both directions, p in 0..1.
        which: 'outline' (the outer silhouette, plus a cut-out hero) or 'all' (every inner shape too)."""
        if p <= 0: return
        s = self.scale(size)
        c.save(); self._place(c, cx, cy, size)
        pm = skia.PathMeasure(self.all_contours if which == 'all' else self.outline, False)
        sw = stroke_px / s
        tips_xy = []
        while True:
            L = pm.getLength()
            if L > 1:
                # start each contour at its top-most point and grow in both directions
                best, by = 0.0, 1e9
                for k in range(120):
                    pos, _ = pm.getPosTan(L * k / 120)
                    if pos.fY < by - 0.5 or (abs(pos.fY - by) <= 0.5 and abs(pos.fX - self.w / 2) < abs(best_x - self.w / 2)):
                        by, best, best_x = pos.fY, L * k / 120, pos.fX
                    if k == 0: best_x = pos.fX
                half = L / 2 * clamp(p)
                seg = skia.Path()
                def piece(u, v):
                    q = skia.Path()
                    if v - u > 0.01 and pm.getSegment(u, v, q, True): seg.addPath(q)
                for a0, a1 in ((best, best + half), (best - half, best)):
                    a0m = a0 % L; a1m = a0m + (a1 - a0)
                    if a1m <= L: piece(a0m, a1m)
                    else: piece(a0m, L - 0.001); piece(0, a1m - L)
                c.drawPath(seg, paint(rgb, stroke=sw))
                if 0 < p < 1:
                    for d in (best + half, best - half):
                        pos, _ = pm.getPosTan(d % L); tips_xy.append((pos.fX, pos.fY))
            if not pm.nextContour(): break
        if tips:
            for (x, y) in tips_xy[:12]:
                soft_light(c, x, y, sw * 3.2, WHITE, 0.75); c.drawCircle(x, y, sw * 0.75, paint(WHITE))
        c.restore()

    def draw_fill(self, c, cx, cy, size, level, t, rgb=WHITE, amp=0.02, bubbles=0.0, bubble_rgb=None, inner=None):
        """Liquid rising inside the logo silhouette. level 0 = empty, 1 = full."""
        if level <= 0: return
        c.save(); self._place(c, cx, cy, size)
        c.clipPath(self.outline, skia.ClipOp.kIntersect, True)
        y_lvl = self.h * (1.03 - 1.08 * clamp(level, 0, 1.2))
        A = self.h * amp
        p = skia.Path(); p.moveTo(-10, self.h + 10)
        n = 40
        for i in range(n + 1):
            x = -10 + (self.w + 20) * i / n
            y = y_lvl + A * (math.sin(x / self.w * 9 + t * 5.2) * 0.6 + math.sin(x / self.w * 21 - t * 7.9) * 0.4)
            p.lineTo(x, y)
        p.lineTo(self.w + 10, self.h + 10); p.close()
        c.drawPath(p, paint(rgb))
        if bubbles > 0:
            c.clipPath(p, skia.ClipOp.kIntersect, True)
            R = rand_table(11, 120)
            for i in range(int(120 * min(1, bubbles))):
                r = R[i]; life = 1.0 + r[2] * 1.3
                age = (t + r[1] * 10) % life
                y = self.h - age * self.h * (0.5 + 0.5 * r[3])
                x = r[4] * self.w + math.sin(age * 4 + r[6] * 6) * self.w * 0.012
                c.drawCircle(x, y, self.w * (0.005 + 0.012 * r[7]) * min(1, age * 4), paint(bubble_rgb or mix(rgb, BLACK, 0.12), 0.8))
        c.restore()

    def draw_silhouette(self, c, cx, cy, size, rgb, a=1.0, blur=None, rot=0.0, sx=1.0, sy=1.0):
        c.save(); self._place(c, cx, cy, size, rot, sx, sy)
        c.drawPath(self.outline, paint(rgb, a, blur=(blur / self.scale(size)) if blur else None)); c.restore()

if __name__ == '__main__':
    import argparse
    ap = argparse.ArgumentParser(description='Vectorize a logo for brand-motion-studio')
    ap.add_argument('src'); ap.add_argument('out_dir')
    ap.add_argument('--colors', type=int, default=4)
    ap.add_argument('--background', help='force the background colour that gets keyed out (hex)')
    ap.add_argument('--raster', help='original artwork to show at the final resolve (same framing as src)')
    ap.add_argument('--keep-tile', action='store_true', help='keep the raster\'s square background')
    a = ap.parse_args()
    d = prepare(a.src, a.out_dir, a.colors, a.background, a.raster, keep_tile=a.keep_tile)
    print(json.dumps({'size': d['size'], 'background': d['background'], 'palette': d['palette'], 'hero': d['hero'],
                      'components': [{k: c_[k] for k in ('id', 'kind', 'color', 'area', 'bbox')} for c_ in d['components'][:20]]}, indent=1))
    print('wrote', os.path.join(a.out_dir, 'logo_parts.png'), '(look at it to confirm the hero part)')
