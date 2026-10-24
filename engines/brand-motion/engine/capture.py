"""Capture a website as a tall mobile screenshot for the 'showcase' scene, and pull brand colours from it.

  python capture.py https://example.com -o site.png [--desktop] [--height 5000]

Needs Playwright:  pip install playwright && python -m playwright install chromium
If that is not possible, ask the member for a full-page phone screenshot instead (iPhone: screenshot -> 'Full Page').
"""
import argparse, json, sys

def capture(url, out, desktop=False, height=5000):
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit('playwright missing: pip install playwright && python -m playwright install chromium  (or provide a screenshot)')
    with sync_playwright() as p:
        b = p.chromium.launch()
        if desktop: ctx = b.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
        else:
            dev = dict(p.devices['iPhone 13']); dev['device_scale_factor'] = 2
            ctx = b.new_context(**dev)
        pg = ctx.new_page()
        pg.goto(url, wait_until='networkidle', timeout=45000)
        pg.wait_for_timeout(1200)
        # dismiss the most common cookie banners so they do not cover the hero
        for sel in ['button:has-text("Accept")', 'button:has-text("Accept all")', 'button:has-text("Got it")', 'button:has-text("I agree")']:
            try:
                el = pg.locator(sel).first
                if el.is_visible(timeout=300): el.click(timeout=800); pg.wait_for_timeout(400)
            except Exception: pass
        # scroll through so lazy images load
        total = pg.evaluate('document.body.scrollHeight')
        for y in range(0, min(total, height), 600):
            pg.evaluate(f'window.scrollTo(0, {y})'); pg.wait_for_timeout(120)
        pg.evaluate('window.scrollTo(0, 0)'); pg.wait_for_timeout(500)
        info = pg.evaluate('''() => {
            const cs = el => el ? getComputedStyle(el) : null;
            const body = cs(document.body);
            const btn = document.querySelector('a[class*="btn"], button, a[class*="button"]');
            const h1 = document.querySelector('h1');
            const meta = document.querySelector('meta[name="theme-color"]');
            return {title: document.title, bg: body && body.backgroundColor, text: body && body.color,
                    button_bg: btn && cs(btn).backgroundColor, button_text: btn && cs(btn).color,
                    h1: h1 && h1.innerText.slice(0, 120), h1_font: h1 && cs(h1).fontFamily, theme_color: meta && meta.content,
                    description: (document.querySelector('meta[name="description"]') || {}).content || ''};
        }''')
        total = pg.evaluate('document.body.scrollHeight')
        pg.screenshot(path=out, full_page=True, clip={'x': 0, 'y': 0, 'width': pg.viewport_size['width'], 'height': min(total, height)})
        b.close()
    print(json.dumps(info, indent=1)); print('wrote', out)
    return info

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('url'); ap.add_argument('-o', '--out', default='site.png')
    ap.add_argument('--desktop', action='store_true'); ap.add_argument('--height', type=int, default=4000)
    a = ap.parse_args(); capture(a.url, a.out, a.desktop, a.height)
