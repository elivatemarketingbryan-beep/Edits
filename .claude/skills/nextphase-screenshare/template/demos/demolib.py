#!/usr/bin/env python3
"""demolib.py — the toolkit for PLAYED screen shares.

You don't record your screen. Each "open X, click Y, type Z" line in the
transcript becomes a REBUILT UI — only the parts being talked about — with a
scripted cursor, typing and clicks, rendered to an mp4 that goes into the edit
like a real screen recording. Real websites are CAPTURED (scripts/capture.js),
not rebuilt, and scrolled inside a rebuilt browser.

These pages are MEDIA, not the composition. They carry the app's own colours
the way a screenshot would, so the token rule does not apply inside them
(check-screenshare.sh exempts demos/ from the hex rule only — emojis and
placeholder copy are still checked).

Everything runs on ONE paused GSAP timeline, so it is seek-safe:

    mv(x, y, t, d)          cursor glides to (x,y) starting at t, over d seconds
    click(t, x, y)          press + ripple at (x,y)
    type(id, text, t, cps)  types text into #id from t at cps chars/sec; returns the end time
    show(sel, t) / hide(sel, t)
    on(sel, cls, t)         add a class at t (focus rings, selected rows)
    fadeIn(sel, t, d)

Every time is DEMO-LOCAL seconds = (word onset in assets/transcript-tight.json)
minus (the beat's t0 in spec.py). Things land ON the word.
"""
import json, os, shutil

D = os.path.dirname(os.path.abspath(__file__))          # <video>/demos
V = os.path.abspath(os.path.join(D, ".."))               # <video>
FPS = 30

CSS = r"""
@import url(assets/fonts/fonts.css);
html,body{margin:0;padding:0;background:#fff;}
*{box-sizing:border-box;}
#root{position:relative;overflow:hidden;font-family:Inter,system-ui,sans-serif;
      -webkit-font-smoothing:antialiased;background:#fff;}
.abs{position:absolute;}
/* browser chrome */
.chrome{position:absolute;left:0;top:0;right:0;height:102px;background:#eceef1;
        border-bottom:1px solid #d7dade;}
.tab{position:absolute;left:84px;top:8px;height:38px;width:300px;background:#fff;
     border-radius:10px 10px 0 0;font-size:15px;color:#2b2f36;display:flex;
     align-items:center;padding:0 16px;gap:10px;font-weight:500;}
.tab .fav{width:16px;height:16px;border-radius:4px;background:#c9ccd2;flex:none;}
.dots{position:absolute;left:18px;top:21px;display:flex;gap:8px;}
.dots i{width:13px;height:13px;border-radius:50%;background:#c9ccd2;display:block;}
.toolbar{position:absolute;left:0;right:0;top:46px;height:56px;background:#fff;}
.navbtn{position:absolute;top:18px;width:20px;height:20px;border-radius:4px;
        border:2px solid #9aa0a8;border-width:0 0 2px 2px;transform:rotate(45deg) scale(.6);}
.addr{position:absolute;left:170px;top:9px;height:38px;right:150px;border-radius:19px;
      background:#f1f3f5;font-size:17px;color:#1f2329;display:flex;align-items:center;
      padding-left:44px;border:2px solid transparent;}
.addr .lock{position:absolute;left:18px;top:11px;width:12px;height:12px;
            border:2px solid #7b818a;border-radius:3px;}
.addr.focus{border-color:#1a73e8;background:#fff;}
.content{position:absolute;left:0;right:0;top:102px;bottom:0;overflow:hidden;}
.caret{display:inline-block;width:2px;height:1.05em;background:#1f2329;
       vertical-align:-0.15em;margin-left:1px;}
/* cursor */
#cur{position:absolute;left:0;top:0;width:30px;height:30px;z-index:99;
     transform-origin:0 0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));}
.ripple{position:absolute;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;
        background:rgba(26,115,232,.28);opacity:0;z-index:98;}
/* a generic AI app (rebuild the REAL product against current screenshots
   when the video names one — this is the neutral stand-in) */
.app{position:absolute;inset:0;background:#f7f7f8;}
.app-brand{position:absolute;left:32px;top:22px;font-size:19px;font-weight:600;color:#1f2329;}
.app-h{position:absolute;left:0;right:0;top:190px;text-align:center;font-size:46px;
       font-weight:600;letter-spacing:-.02em;color:#1f2329;}
.app-box{position:absolute;left:300px;top:292px;width:840px;height:160px;background:#fff;
         border:1px solid #e3e4e8;border-radius:20px;box-shadow:0 6px 24px rgba(20,20,40,.06);}
.app-box.focus{border-color:#b9bcc6;box-shadow:0 6px 28px rgba(20,20,40,.12);}
.app-in{position:absolute;left:26px;top:24px;right:26px;font-size:21px;color:#1f2329;line-height:1.4;}
.app-ph{color:#9a9ca5;}
.app-plus{position:absolute;left:22px;bottom:18px;width:40px;height:40px;border-radius:50%;
          border:1px solid #e3e4e8;color:#6b6e78;font-size:24px;text-align:center;line-height:37px;}
.app-send{position:absolute;right:20px;bottom:18px;width:42px;height:42px;border-radius:12px;background:#1f2329;}
.app-send:after{content:"";position:absolute;left:14px;top:16px;width:11px;height:11px;
          border:3px solid #fff;border-width:3px 0 0 3px;transform:rotate(45deg);}
.app-chips{position:absolute;left:300px;top:484px;width:840px;display:flex;gap:12px;justify-content:center;}
.app-chips span{padding:9px 16px;border-radius:18px;border:1px solid #e3e4e8;font-size:15px;
                color:#55585f;background:#fff;}
/* chat view */
.chat{position:absolute;inset:0;background:#fff;}
.bub{position:absolute;right:120px;top:40px;max-width:700px;background:#f0f1f3;border-radius:18px;
     padding:16px 22px;font-size:20px;color:#1f2329;}
.say{position:absolute;left:120px;top:150px;right:120px;font-size:20px;color:#2b2f36;line-height:1.55;list-style:none;padding:0;margin:0;}
.say li{margin:0 0 12px;}
/* editor (generic) */
.ed{position:absolute;inset:0;background:#1e1f22;color:#d4d4d4;}
.ed-title{position:absolute;left:0;right:0;top:0;height:40px;background:#2b2d31;
          font-size:14px;color:#9da2a8;text-align:center;line-height:40px;}
.ed-act{position:absolute;left:0;top:40px;bottom:28px;width:56px;background:#2b2d31;}
.ed-exp{position:absolute;left:56px;top:40px;bottom:28px;width:320px;background:#232428;
        border-right:1px solid #333539;}
.ed-exp h6{margin:0;padding:16px 20px 8px;font-size:12px;letter-spacing:.08em;color:#8b9097;font-weight:600;}
.row{position:absolute;left:0;right:0;height:32px;font-size:16px;line-height:32px;
     padding-left:28px;color:#cfd3d8;font-family:'JetBrains Mono',monospace;}
.row .ic{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:12px;
         background:#7a8089;vertical-align:0;}
.row .st{position:absolute;right:18px;top:0;font-size:14px;font-weight:700;}
.row .st.a{color:#73c991}.row .st.m{color:#e2c08d}
.row.sel{background:#37373d;}
.ed-tab{position:absolute;left:376px;top:40px;right:0;height:40px;background:#232428;
        border-bottom:1px solid #333539;}
.ed-tab span{position:absolute;left:0;top:0;height:40px;padding:0 22px;line-height:40px;
             background:#1e1f22;font-size:14px;color:#e6e6e6;font-family:'JetBrains Mono',monospace;}
.code{position:absolute;left:376px;top:80px;right:0;height:540px;padding:18px 26px;
      font-family:'JetBrains Mono',monospace;font-size:17px;line-height:1.65;white-space:pre;color:#d4d4d4;}
.code .k{color:#c586c0}.code .t{color:#569cd6}.code .s{color:#ce9178}.code .c{color:#6a9955}
.term{position:absolute;left:376px;right:0;top:620px;bottom:28px;background:#18191c;
      border-top:1px solid #333539;font-family:'JetBrains Mono',monospace;font-size:17px;
      padding:14px 26px;color:#d4d4d4;line-height:1.7;}
.term h6{margin:0 0 6px;font-size:12px;letter-spacing:.08em;color:#8b9097;font-family:Inter;}
.term .p{color:#e2c08d;}
.term .caret{background:#d4d4d4;}
.stat{position:absolute;left:0;right:0;bottom:0;height:28px;background:#2b2d31;
      font-size:13px;color:#b9bdc3;line-height:28px;padding:0 18px;}
.stat .cnt{position:absolute;right:18px;top:0;}
/* a deliberately bad page, MADE FOR THE VIDEO and labelled as such on screen */
.slop{position:absolute;inset:0;background:#0b0620;overflow:hidden;color:#fff;}
.slop-nav{position:absolute;left:0;right:0;top:0;height:70px;display:flex;align-items:center;
          padding:0 44px;gap:34px;font-size:15px;color:#c9c2ff;}
.slop-nav b{margin-right:auto;font-size:20px;color:#fff;letter-spacing:.02em;}
.slop h1{position:absolute;left:0;right:0;top:140px;margin:0;text-align:center;font-size:62px;font-weight:800;
         background:linear-gradient(90deg,#fff,#c4b5fd,#f0abfc);-webkit-background-clip:text;color:transparent;}
.slop p{position:absolute;left:0;right:0;top:234px;margin:0;text-align:center;font-size:21px;color:#a79fd6;}
.orb{position:absolute;left:50%;top:330px;width:380px;height:380px;margin-left:-190px;border-radius:50%;
     background:radial-gradient(circle at 32% 30%,#f0abfc,#a855f7 35%,#4c1d95 70%,#1e0b3b);
     box-shadow:0 0 140px 40px rgba(168,85,247,.45);}
.pane{position:absolute;top:0;bottom:0;overflow:hidden;}
.tag{position:absolute;top:84px;left:20px;z-index:5;padding:8px 14px;border-radius:10px;
     font-size:17px;font-weight:700;color:#fff;}
.tag.bad{background:#e5484d}.tag.good{background:#2f9e5b}
"""

CURSOR_SVG = ('<svg id="cur" viewBox="0 0 30 30"><path d="M3 2 L3 24 L9 18.5 L13 27 L16.6 25.4 '
              'L12.7 17 L20.5 17 Z" fill="#111" stroke="#fff" stroke-width="1.8" '
              'stroke-linejoin="round"/></svg>')

JS_LIB = r"""
var tl = gsap.timeline({paused:true});
var $ = function(s){return document.querySelector(s);};
function mv(x,y,t,d){tl.to('#cur',{x:x,y:y,duration:d||0.55,ease:'power2.inOut'},t);}
var _rp=0;
function click(t,x,y){
  tl.to('#cur',{scale:0.82,duration:0.06,ease:'none'},t);
  tl.to('#cur',{scale:1,duration:0.1,ease:'power1.out'},t+0.07);
  var r=document.createElement('div'); r.className='ripple'; r.id='rp'+(_rp++);
  r.style.left=x+'px'; r.style.top=y+'px'; $('#root').appendChild(r);
  tl.fromTo(r,{scale:0.3,opacity:0.9},{scale:1.3,opacity:0,duration:0.38,ease:'power1.out',immediateRender:false},t);
}
function type(id,text,t,cps){
  var el=document.getElementById(id), i;
  for(i=0;i<text.length;i++){
    var s=document.createElement('span'); s.textContent=text[i]; s.style.display='none';
    el.appendChild(s);
    tl.set(s,{display:'inline'},t+i/cps);
  }
  return t+text.length/cps;
}
function show(s,t){tl.set(s,{display:'block'},t);}
function hide(s,t){tl.set(s,{display:'none'},t);}
function on(s,cls,t){var el=document.querySelector(s); tl.set(s,{attr:{'class':el.className+' '+cls}},t);}
function fadeIn(s,t,d){tl.fromTo(s,{opacity:0,y:8},{opacity:1,y:0,duration:d||0.25,ease:'power2.out',immediateRender:false},t);}
"""


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            .replace('"', "&quot;"))


def js_str(s):
    return json.dumps(str(s))


def page(name, w, h, dur, body, js, images=()):
    """Write demos/<name>/ as its own HyperFrames project.

    images: filenames in assets/captures/ (real page captures from
    scripts/capture.js) that this demo shows; they are copied in."""
    d = os.path.join(D, name)
    a = os.path.join(d, "assets")
    os.makedirs(a, exist_ok=True)
    for sub in ("fonts", "vendor"):
        if not os.path.exists(os.path.join(a, sub)):
            shutil.copytree(os.path.join(V, "assets", sub), os.path.join(a, sub))
    for img in images:
        src = os.path.join(V, "assets", "captures", img)
        if not os.path.exists(src):
            raise SystemExit("demo %s needs assets/captures/%s — capture it first "
                             "(scripts/capture.js)" % (name, img))
        shutil.copy(src, os.path.join(a, img))
    cid = name.replace("-", "")
    html = f"""<!doctype html>
<html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width={w}, height={h}"/>
<title>{name}</title>
<style>{CSS}</style>
<script src="assets/vendor/gsap.min.js"></script>
</head><body>
<!-- GENERATED by demos/make_demos.py -->
<div id="root" data-composition-id="{cid}" data-width="{w}" data-height="{h}"
     data-start="0" data-duration="{dur:.4f}" style="width:{w}px;height:{h}px">
{body}
{CURSOR_SVG}
</div>
<script>
{JS_LIB}
{js}
tl.set({{}},{{}},{dur:.4f});
window.__timelines = window.__timelines || {{}};
window.__timelines["{cid}"] = tl;
</script></body></html>
"""
    open(os.path.join(d, "index.html"), "w").write(html)
    json.dump({"name": name, "width": w, "height": h, "fps": FPS, "duration": dur},
              open(os.path.join(d, "hyperframes.json"), "w"), indent=2)
    print(f"  {name:22} {w}x{h}  {dur:.2f}s")


def chrome(tab, addr_html, addr_id="addr"):
    return (f'<div class="chrome"><div class="dots"><i></i><i></i><i></i></div>'
            f'<div class="tab"><span class="fav"></span><span id="tabt">{tab}</span></div>'
            f'<div class="toolbar"><div class="navbtn" style="left:34px"></div>'
            f'<div class="navbtn" style="left:78px;transform:rotate(225deg) scale(.6)"></div>'
            f'<div class="addr" id="{addr_id}"><span class="lock"></span>{addr_html}</div>'
            f'</div></div>')


def app_home(inp_id, brand="Your App", heading="What should we make?",
             placeholder="Describe what you want…", chips=("Plan", "Write", "Build", "Research")):
    ph = f'<span class="app-ph" id="ph">{esc(placeholder)}</span>' if placeholder else ""
    chip_html = "".join(f"<span>{esc(c)}</span>" for c in chips)
    return (f'<div class="app" id="home"><div class="app-brand">{esc(brand)}</div>'
            f'<div class="app-h">{esc(heading)}</div>'
            f'<div class="app-box" id="box"><div class="app-in"><span id="{inp_id}"></span>'
            f'<i class="caret" id="car" style="display:none"></i>{ph}</div>'
            f'<div class="app-plus">+</div><div class="app-send"></div></div>'
            f'<div class="app-chips">{chip_html}</div></div>')


# absolute page coords inside a 1440x900 browser (content starts at y=102)
ADDR = (330, 75)
BOX = (620, 102 + 330)
SEND = (300 + 840 - 41, 102 + 292 + 160 - 39)
