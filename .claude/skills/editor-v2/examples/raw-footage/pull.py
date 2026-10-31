#!/usr/bin/env python3
"""pull.py: everything the edit needs from outside and from the B-roll, as ready 1920x1080 25 fps frames in ../work/seg/<name>/ and stills in ../online/img/."""
import json, os, subprocess, time, urllib.request, concurrent.futures as cf
R = os.environ.get("EDITOR_PROJECT") or os.getcwd()
os.chdir(R)
UA = {"User-Agent": "EditorV2/1.0 (personal video edit; contact " + os.environ.get("EDITOR_CONTACT", "not given") + ")"}  # Wikimedia asks for a contact: set EDITOR_CONTACT
HL = "zscale=tin=arib-std-b67:pin=bt2020:min=bt2020nc:rin=limited:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0:param=1.2,zscale=t=bt709:m=bt709:r=limited,format=yuv420p"
WIDE = (0, 0, 1, 1)
HANDS_A = (.27, .62, .32, .32)
FACE_A = (.50, .24, .36, .36)
KEYS_A = (.27, .66, .30, .30)
# name: clip, start, seconds, crop as fractions (x, y, w, h)
BROLL = {
    "desk_empty": ("a", 0.5, 1.8, WIDE), "keys_empty": ("a", 0.5, 1.8, KEYS_A), "walkin": ("a", 3.2, 3.0, WIDE),
    "type_wide": ("a", 40, 3.2, WIDE), "type_hands": ("a", 40, 3.2, HANDS_A), "type_face": ("a", 44, 3.2, FACE_A),
    "getup": ("a", 60.4, 4.5, WIDE), "think_b": ("b", 16.8, 2.6, WIDE), "think_b_face": ("b", 16.8, 2.6, (.48, .22, .36, .36)),
    "lookback": ("b", 84, 3.2, WIDE), "lookback_face": ("b", 84, 3.2, (.44, .26, .36, .36)), "type_b": ("b", 106, 2.6, WIDE),
    "sit_c": ("c", 2.6, 2.6, WIDE), "type_c": ("c", 43, 2.6, WIDE), "getup_c": ("c", 127, 4.2, WIDE),
    "chin_d": ("d", 88, 3.2, WIDE), "chin_d_face": ("d", 88, 3.2, (.56, .34, .34, .34)), "gesture_d": ("d", 49.4, 2.6, WIDE),
}
# name: film, centre second. A window of up to 3 s around it, stopped at the shot's own cuts
FILM = {
    "m_master2": ("moviola", 59.2), "m_picture": ("moviola", 67), "m_sound2": ("moviola", 302.6), "m_sound3": ("moviola", 312.6), "m_editor": ("moviola", 63), "m_editor2": ("moviola", 298.5),
    "x_cam3": ("inside", 196.6), "x_cam4": ("inside", 202), "x_xhand": ("inside", 209.2), "x_police": ("inside", 213.6), "b_x": ("brainfilm", 404),
    "t_mass1": ("tuesday", 819), "t_mass2": ("tuesday", 812.5), "t_face2": ("tuesday", 833), "t_street": ("tuesday", 804.6), "p_reels": ("projector", 692), "p_spin": ("projector", 673.5),
    "m_wide": ("moviola", 38), "m_wide2": ("moviola", 45), "m_hand": ("moviola", 134), "m_hand2": ("moviola", 141), "m_finger": ("moviola", 179), "m_finger2": ("moviola", 186),
    "m_master": ("moviola", 58), "m_motor": ("moviola", 64), "m_sound": ("moviola", 300), "m_phones": ("moviola", 307), "m_switch": ("moviola", 429), "m_lens": ("moviola", 51), "m_reel": ("moviola", 115),
    "h_face": ("masterhands", 91), "h_face2": ("masterhands", 114), "h_weld": ("masterhands", 136), "h_hands": ("masterhands", 159), "h_gauge": ("masterhands", 204), "h_flame": ("masterhands", 295),
    "h_smoke": ("masterhands", 341), "h_hat": ("masterhands", 454), "h_hand2": ("masterhands", 477), "h_pour": ("masterhands", 568), "h_spark": ("masterhands", 659), "h_crank": ("masterhands", 772),
    "h_hand3": ("masterhands", 795), "h_men": ("masterhands", 818), "h_old": ("masterhands", 1068), "h_wheel": ("masterhands", 1181), "h_line": ("masterhands", 1431), "h_old2": ("masterhands", 1613), "h_cars": ("masterhands", 1727), "h_road": ("masterhands", 1863),
    "t_crowd1": ("tuesday", 790), "t_crowd2": ("tuesday", 802), "t_crowd3": ("tuesday", 814), "t_faces": ("tuesday", 826), "t_crowd4": ("tuesday", 863), "t_key": ("tuesday", 960), "t_night": ("tuesday", 984),
    "x_room": ("inside", 34), "x_hand": ("inside", 205), "x_cam": ("inside", 194), "x_cam2": ("inside", 200), "x_shoe": ("inside", 410), "x_shoe2": ("inside", 416),
    "e_big": ("eyefilm", 18), "e_big2": ("eyefilm", 24), "e_woman": ("eyefilm", 33), "e_rays": ("eyefilm", 285), "e_iris": ("eyefilm", 579), "e_iris2": ("eyefilm", 587), "e_row": ("eyefilm", 669),
    "p_thread": ("projector", 113), "p_reel": ("projector", 670), "p_reel2": ("projector", 679), "p_reel3": ("projector", 688), "p_stare": ("projector", 462), "p_light": ("projector", 443), "p_men": ("projector", 47),
    "b_white": ("brainfilm", 51), "b_nerve": ("brainfilm", 59), "b_nerve2": ("brainfilm", 66), "b_diag": ("brainfilm", 81), "b_xeye": ("brainfilm", 397), "b_xear": ("brainfilm", 434), "b_white2": ("brainfilm", 492), "b_spiral": ("brainfilm", 360),
    "l_fluoro": ("heartfilm", 257), "l_fluoro2": ("heartfilm", 265), "l_chest": ("heartfilm", 406), "l_run": ("heartfilm", 562), "l_run2": ("heartfilm", 546), "l_stad": ("heartfilm", 538), "l_crowd": ("heartfilm", 530), "l_shake": ("heartfilm", 569),
    "y_sil": ("typing", 309), "y_sil2": ("typing", 321), "y_bars": ("typing", 676), "y_bars2": ("typing", 688), "y_hands": ("typing", 642), "y_hands2": ("typing", 665), "y_hands3": ("typing", 813), "y_hands4": ("typing", 836), "y_dark": ("typing", 160),
}
PICK = {"sheep": 1, "city0": ("city", 0), "city4": ("city", 4), "city7": ("city", 7), "city11": ("city", 11), "spine0": ("spine", 0), "spine9": ("spine", 9), "spine10": ("spine", 10), "skull0": ("skullxs", 0), "skull6": ("skullxs", 6),
        "hand2": ("hand", 2), "hand4": ("hand", 4), "hand10": ("hand", 10), "hand11": ("hand", 11), "ves2": ("vesalius", 2), "ves0": ("vesalius", 0), "muy": ("runner", 0)}


def stills():
    os.makedirs("online/img", exist_ok=True)
    p1 = json.load(open("online/meta/pick.json"))
    p2 = json.load(open("online/meta/pick2.json"))
    p1["sheepk"] = p1["sheep"]
    credits = []
    items = [(k, *(("sheep", v) if isinstance(v, int) else v)) for k, v in PICK.items()]
    rows = [(k, p1[g][i]) for k, g, i in items] + [("fp0", p2["fp"][0]), ("fp1", p2["fp"][1])]
    for k, x in rows:
        ext = os.path.splitext(x["url"])[1].lower()
        f = f"online/img/{k}{ext}"
        credits.append(dict(key=k, title=x["title"], license=x["lic"], page=x["page"]))
        if os.path.exists(f):
            continue
        for tryn in range(6):
            try:
                # the 1600 px thumbnail is plenty for a 1080p frame and kinder to the servers
                u = x["thumb"].replace("/500px-", "/1920px-").replace("/1600px-", "/1920px-") if max(x["w"], x["h"]) > 1920 and x.get("thumb") else x["url"]
                b = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=60).read()
                ext2 = os.path.splitext(u.split("?")[0])[1].lower()
                f = f"online/img/{k}{ext2}"
                open(f, "wb").write(b)
                print("still", k, len(b) // 1024, "KB", flush=True)
                break
            except Exception as e:
                print("retry", k, e, flush=True)
                time.sleep(12 + tryn * 12)
        time.sleep(2.5)
    json.dump(credits, open("online/meta/credits_stills.json", "w"), indent=0)


def crop_vf(c):
    x, y, w, h = c
    return f"crop=iw*{w}:ih*{h}:iw*{x}:ih*{y},scale=1920:1080:flags=lanczos"


def pull_broll(name):
    n, s, d, c = BROLL[name]
    o = f"work/seg/{name}"
    if os.path.exists(o + "/done"):
        return
    os.makedirs(o, exist_ok=True)
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(s), "-t", str(d), "-i", f"raw/broll_{n}.mov", "-vf", f"{HL},{crop_vf(c)},fps=25", "-q:v", "2", f"{o}/%04d.jpg"], check=True)
    open(o + "/done", "w").write("x")
    print("broll", name, len(os.listdir(o)) - 1, flush=True)


def pull_film(name):
    film, c = FILM[name]
    o = f"work/seg/{name}"
    if os.path.exists(o + "/done"):
        return
    os.makedirs(o, exist_ok=True)
    a = max(0, c - 1.4)
    # 640x480 to 16:9: slight overscan to lose the frame edge, then a little sharpening
    subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-y", "-ss", str(a), "-t", "2.8", "-i", f"online/vid/{film}.mp4", "-vf", "crop=iw*0.94:ih*0.94*0.75:iw*0.03:ih*0.15,scale=1920:1080:flags=lanczos,unsharp=5:5:0.6,fps=25", "-q:v", "3", f"{o}/%04d.jpg"], check=True)
    open(o + "/done", "w").write("x")
    print("film", name, len(os.listdir(o)) - 1, flush=True)


stills()
with cf.ThreadPoolExecutor(4) as ex:
    list(ex.map(pull_film, FILM))
with cf.ThreadPoolExecutor(3) as ex:
    list(ex.map(pull_broll, BROLL))
print("ALL DONE")
