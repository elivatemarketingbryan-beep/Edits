#!/usr/bin/env python3
"""make_demos.py — the played screen shares for THIS video.

    python3 demos/make_demos.py            writes demos/<name>/ projects
    bash ../render-demos.sh                (or the skill's scripts/render-demos.sh)
                                           renders each to assets/broll/<name>.mp4

One function per demo. Each demo is a rebuilt UI with only the parts being
talked about, a scripted cursor, typing and clicks (helpers in demolib.py).
Every time is DEMO-LOCAL seconds: (word onset in transcript-tight.json) minus
(the beat's t0 in spec.py). Land things ON the word.

The examples below are generic stand-ins. For a real video:
  * rebuild the product the creator names against CURRENT screenshots of it
    (or use a real capture) — never invent features it does not have
  * real websites are captured with scripts/capture.js, then scrolled inside
    the rebuilt browser (see d3_page)
  * a "bad" example is one you make yourself and label on screen as made for
    this video — never hold up a real company's work as the bad one
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from demolib import page, chrome, app_home, esc, js_str, ADDR, BOX, SEND

# ── EXAMPLE 1 · open a site, type a prompt, get an answer ───────────────────
OPEN = {
    "dur": 13.0,
    "tab": "New Tab", "url": "your-app.com", "app": "Your App",
    "prompt": "Plan a 10 minute video about my niche",
    "url_cps": 13, "prompt_cps": 16,          # typing speed, characters per second
    "answer": ["1. The hook: one surprising number",
               "2. Three mistakes people make",
               "3. The fix, shown step by step"],
}


def d1_open():
    o = OPEN
    say = "".join('<li id="li%d" style="display:none">%s</li>' % (i, esc(s))
                  for i, s in enumerate(o["answer"]))
    body = (chrome(esc(o["tab"]), '<span id="url"></span><i class="caret" id="ucar" style="display:none"></i>')
            + '<div class="content"><div id="blank" class="abs" style="inset:0;background:#fff"></div>'
            + '<div id="load" class="abs" style="left:0;top:0;height:3px;width:100%;background:#1a73e8;'
              'transform-origin:0 0;transform:scaleX(0)"></div>'
            + '<div id="pg" style="display:none">' + app_home("q1", brand=o["app"]) + '</div>'
            + '<div id="chat" class="chat" style="display:none"><div class="bub">%s</div>'
              '<ul class="say">%s</ul></div></div>' % (esc(o["prompt"]), say))
    js = f"""
tl.set('#cur',{{x:1180,y:640}},0);
mv({ADDR[0]},{ADDR[1]},0.25,0.6);
click(0.9,{ADDR[0]},{ADDR[1]});
on('#addr','focus',0.95); tl.set('#ucar',{{display:'inline-block'}},0.95);
var e=type('url',{js_str(o["url"])},1.15,{o.get("url_cps", 13)});
click(e+0.2,{ADDR[0]},{ADDR[1]});
tl.to('#load',{{scaleX:1,duration:0.45,ease:'power1.inOut'}},e+0.25);
tl.set('#load',{{opacity:0}},e+0.72);
tl.set('#tabt',{{textContent:{js_str(o["app"])}}},e+0.6);
tl.set('#addr',{{attr:{{'class':'addr'}}}},e+0.6); hide('#ucar',e+0.6);
show('#pg',e+0.62); tl.fromTo('#pg',{{opacity:0}},{{opacity:1,duration:0.2,immediateRender:false}},e+0.62);
mv({BOX[0]},{BOX[1]},e+1.2,0.6);
click(e+1.85,{BOX[0]},{BOX[1]});
on('#box','focus',e+1.9); tl.set('#car',{{display:'inline-block'}},e+1.9); hide('#ph',e+2.0);
var e2=type('q1',{js_str(o["prompt"])},e+2.0,{o.get("prompt_cps", 16)});
mv({SEND[0]},{SEND[1]},e2+0.05,0.45);
click(e2+0.6,{SEND[0]},{SEND[1]});
hide('#pg',e2+0.8); show('#chat',e2+0.8);
"""
    for i in range(len(o["answer"])):
        js += "show('#li%d',e2+%.2f); fadeIn('#li%d',e2+%.2f,0.25);\n" % (i, 1.3 + 0.7 * i, i, 1.3 + 0.7 * i)
    js += "mv(700,520,e2+1.2,0.9);\n"
    page("d1-open", 1440, 900, o["dur"], body, js)


# ── EXAMPLE 2 · files appear in an editor, each on its spoken word ──────────
FILES = [  # (demo-local t, filename, status A|M, code html)
    (1.2, "index.html", "M", '<span class="t">&lt;h1&gt;</span>Hello<span class="t">&lt;/h1&gt;</span>'),
    (2.4, "privacy.html", "A", '<span class="t">&lt;h1&gt;</span>Privacy Policy<span class="t">&lt;/h1&gt;</span>'),
    (3.6, "robots.txt", "A", 'User-agent: *\nAllow: /'),
]


def d2_editor(dur=6.0, project="my-site", prompt="Add everything this site is missing."):
    rows = ['<div class="row sel" id="r_index" style="top:40px"><span class="ic"></span>index.html'
            '<span class="st m" id="m_index" style="display:none">M</span></div>']
    codes = ['<div class="code" id="c0"></div>']
    js = ["tl.set('#cur',{x:1200,y:800},0);",
          "var e=type('tp',%s,0.3,20);" % js_str(prompt)]
    y, seen = 72, {"index.html"}
    for i, (t, f, st, code) in enumerate(FILES):
        cid = "c%d" % (i + 1)
        codes.append('<div class="code" id="%s" style="display:none">%s</div>' % (cid, code))
        if f not in seen:
            rid = "r%d" % i
            rows.append('<div class="row" id="%s" style="top:%dpx;display:none"><span class="ic"></span>'
                        '%s<span class="st a">A</span></div>' % (rid, y, esc(f)))
            js.append("show('#%s',%s); fadeIn('#%s',%s,0.22);" % (rid, t, rid, t))
            sel = "#" + rid; y += 32; seen.add(f)
        else:
            sel = "#r_index"; js.append("show('#m_index',%s);" % t)
        js.append("tl.set('.row',{attr:{'class':'row'}},%s); tl.set('%s',{attr:{'class':'row sel'}},%s);" % (t, sel, t))
        js.append("hide('.code',%s); show('#%s',%s); tl.set('#tabn',{textContent:%s},%s);" % (t, cid, t, js_str(f), t))
    body = ('<div class="ed"><div class="ed-title">%s</div><div class="ed-act"></div>'
            '<div class="ed-exp"><h6>EXPLORER</h6>%s</div>'
            '<div class="ed-tab"><span id="tabn">index.html</span></div>%s'
            '<div class="term"><h6>ASSISTANT</h6><span class="p">&gt; </span><span id="tp"></span>'
            '<i class="caret"></i></div><div class="stat">main</div></div>'
            % (esc(project), "".join(rows), "".join(codes)))
    page("d2-editor", 1440, 900, dur, body, "\n".join(js))


# ── EXAMPLE 3 · a REAL site, captured tall, scrolled in a rebuilt browser ───
# Needs assets/captures/<name>.png from scripts/capture.js (mode "tall").
def d3_page(capture="site-tall.png", tab="Example", url="example.com", dur=4.5, scroll=-1100):
    body = (chrome(esc(tab), esc(url))
            + '<div class="content"><img id="pg" src="assets/%s" '
              'style="position:absolute;left:0;top:0;width:1800px"></div>' % capture)
    js = f"""
tl.set('#cur',{{x:1300,y:560}},0);
tl.to('#pg',{{y:{scroll},duration:{dur - 1.0:.2f},ease:'power1.inOut'}},0.5);
mv(1150,470,0.4,1.2); mv(1240,520,2.2,1.4);
"""
    page("d3-page", 1800, 780, dur, body, js, images=[capture])


if __name__ == "__main__":
    d1_open()
    d2_editor()
    if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                                   "assets", "captures", "site-tall.png")):
        d3_page()
