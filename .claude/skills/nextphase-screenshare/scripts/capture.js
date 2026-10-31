// capture.js — real website captures for played screen shares (CDP, 2x).
//
//   node <skill>/scripts/capture.js <outdir> <jobs.json>
//
// jobs.json is a list of jobs:
//   {"name":"site-tall","url":"https://example.com","mode":"tall","height":4200,"wait":8000}
//   {"name":"site-scroll","url":"https://example.com","mode":"scroll","seconds":6,"scrollTo":1400}
//   modes: "tall"   one full-page PNG (best: scroll it inside a rebuilt browser
//                   in demos/make_demos.py — frame-exact, unlike a live screencast)
//          "scroll" a screencast of an eased scroll, saved as numbered JPEG frames
//          "rec"    a screencast of the page sitting for `seconds`
//   optional: vw/vh (viewport, default 1440x900), js (run before capture),
//             x/y/w/h (crop of a tall capture, in PAGE coordinates)
//
// Captured at deviceScaleFactor 2 so UI text stays crisp when placed at 1x.
// It clicks common cookie "Accept" buttons (including ones inside a shadow
// root) and removes sticky banners — then LOOK at every PNG: login walls and
// scroll-reveal pages come back plausible-looking and blank.
const {spawn, execSync}=require('child_process'); const fs=require('fs');
const os=require('os'); const path=require('path');
function findChrome(){
  if (process.env.CHROME && fs.existsSync(process.env.CHROME)) return process.env.CHROME;
  try {
    const v = process.env.HF_VERSION || '0.8.145';
    const p = execSync(`npx -y hyperframes@${v} browser path`, {stdio:['ignore','pipe','ignore']})
                .toString().trim().split('\n').pop().trim();
    if (p && fs.existsSync(p)) return p;
  } catch(e){}
  const c = ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
             '/Applications/Chromium.app/Contents/MacOS/Chromium',
             '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
             '/usr/bin/chromium-browser',
             'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'];
  for (const x of c) if (fs.existsSync(x)) return x;
  throw new Error('No Chrome found. Run: npx hyperframes browser ensure  (or set CHROME=/path/to/chrome)');
}
const CHROME=findChrome();
const PORT=9336; const OUT=process.argv[2];
if(!OUT||!process.argv[3]){ console.error('usage: node capture.js <outdir> <jobs.json>'); process.exit(2); }
fs.mkdirSync(OUT,{recursive:true});
const JOBS=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function main(){
  const prof=fs.mkdtempSync(path.join(os.tmpdir(),'ss-capture-'));
  const ch=spawn(CHROME,[`--remote-debugging-port=${PORT}`,`--user-data-dir=${prof}`,
    '--headless=new','--hide-scrollbars','--disable-gpu','--window-size=1440,900',
    '--no-first-run','--no-default-browser-check','--autoplay-policy=no-user-gesture-required',
    'about:blank'],{stdio:'ignore'});
  await sleep(2500);
  let list;
  for(let i=0;i<30;i++){ try{ list=await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if(list.length)break; }catch(e){} await sleep(500); }
  const tgt=list.find(t=>t.type==='page');
  
  const ws=new WebSocket(tgt.webSocketDebuggerUrl);
  await new Promise(r=>ws.onopen=r);
  let id=0; const pend=new Map(); let onFrame=null;
  ws.onmessage=(ev0)=>{const d=JSON.parse(ev0.data);
    if(d.id&&pend.has(d.id)){pend.get(d.id)(d);pend.delete(d.id);}
    if(d.method==='Page.screencastFrame'&&onFrame) onFrame(d.params);
  };
  const send=(method,params={})=>new Promise(res=>{const i=++id;pend.set(i,res);ws.send(JSON.stringify({id:i,method,params}));});
  const ev=async e=>{const r=await send('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true});return r.result&&r.result.result?r.result.result.value:null;};

  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});

  for(const j of JOBS){
    console.log('->',j.name,j.mode);
    const VW=j.vw||1440, VH=j.vh||900;
    await send('Emulation.setDeviceMetricsOverride',{width:VW,height:VH,deviceScaleFactor:2,mobile:false});
    await send('Page.navigate',{url:j.url});
    await sleep(j.wait||7000);
    const H=await ev('document.body.scrollHeight');
    for(let y=0;y<H;y+=380){ await ev(`window.scrollTo(0,${y})`); await sleep(140); }
    await ev('window.scrollTo(0,0)'); await sleep(1200);
    const HIDE=`(()=>{let st=document.getElementById('__h');if(!st){st=document.createElement('style');st.id='__h';document.head.appendChild(st);}st.textContent='#siteNotice,#centralNotice,.cn-fundraising,.frb,.wmde-banner{display:none!important}';
      const pat=/^(accept all|tout accepter)$/i; let k=0;
      for(const el of document.querySelectorAll('*')){ if(el.children.length===0 && pat.test((el.textContent||'').trim())){ (el.closest('button,[role=button],a,div')||el).click(); k++; } }
      for(const el of document.querySelectorAll('*')){ const t=(el.textContent||''); if(/A smoother, more personalized experience|Une expérience plus fluide/.test(t)){ const s=getComputedStyle(el); if(s.position==='fixed'){ el.remove(); } } }
      document.querySelectorAll('*').forEach(h=>{ if(h.shadowRoot && /Accept all|Tout accepter/.test(h.shadowRoot.textContent||'')){ for(const b of h.shadowRoot.querySelectorAll('button')){ if(/^(Accept all|Tout accepter)$/.test((b.textContent||'').trim())){ b.click(); k++; } } } });
      document.body.style.overflow='visible'; document.documentElement.style.overflow='visible';
      return k;})()`;
    await ev(HIDE); await sleep(1500); await ev(HIDE);
    const CLICK=`(()=>{const pat=/^(accept all|accept all cookies|allow all|accept|agree|i accept|tout accepter|accepter|j'accepte|ok)$|accept all|tout accepter/i;for(const el of document.querySelectorAll('button,[role=button],a')){const t=(el.innerText||'').trim();if(pat.test(t)){el.click();return 1;}}return 0;})()`;
    for(let k=0;k<3;k++){ if(await ev(CLICK)) await sleep(1500); else break; }
    await ev(`(()=>{for(const el of document.querySelectorAll('div,section,aside')){const s=getComputedStyle(el);if((s.position==='fixed'||s.position==='sticky')&&el.getBoundingClientRect().height>120&&el.getBoundingClientRect().top>200)el.remove();}return 1;})()`);
    await ev(`(()=>{document.querySelectorAll('#centralNotice,.cn-fundraising,#siteNotice,.frb').forEach(e=>e.remove());return 1;})()`);
    if(j.js){ await ev(j.js); await sleep(1200); }
    if(j.probe){ console.log(await ev(j.probe)); }

    if(j.mode==='tall'){
      const h=Math.min(j.height||3600, H);
      await send('Emulation.setDeviceMetricsOverride',{width:VW,height:h,deviceScaleFactor:2,mobile:false});
      await sleep(2500);
      const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,
        clip:{x:j.x||0,y:j.y||0,width:j.w||VW,height:j.h||h,scale:1}});
      fs.writeFileSync(`${OUT}/${j.name}.png`,Buffer.from(r.result.data,'base64'));
      await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:2,mobile:false});
      console.log('   ok tall',(fs.statSync(`${OUT}/${j.name}.png`).size/1024|0)+'KB');
      continue;
    }

    // screencast: real motion, encoded straight to frames
    const dir=`${OUT}/${j.name}_frames`; fs.rmSync(dir,{recursive:true,force:true}); fs.mkdirSync(dir,{recursive:true});
    let n=0; const TS=[];
    onFrame=async p=>{
      TS.push(p.metadata.timestamp); fs.writeFileSync(`${dir}/f${String(n).padStart(4,'0')}.jpg`,Buffer.from(p.data,'base64'));
      n++;
      try{ await send('Page.screencastFrameAck',{sessionId:p.sessionId}); }catch(e){}
    };
    await send('Page.startScreencast',{format:'jpeg',quality:92,maxWidth:VW*2,maxHeight:VH*2,everyNthFrame:1});
    const secs=j.seconds||6;
    if(j.mode==='scroll'){
      await ev(HIDE); await sleep(300);
      const findY=async (txt,off)=>ev(`(()=>{for(const el of document.querySelectorAll('h1,h2,h3,figcaption,p,span,div')){ if(el.children.length<3 && (el.textContent||'').trim().startsWith(${JSON.stringify(txt||'')})){ return Math.round(el.getBoundingClientRect().top+scrollY-${off||0}); } } return null;})()`);
      let top=j.scrollFrom||0, bot=j.scrollTo||1400;
      if(j.toText){ const y=await findY(j.toText,j.toOff); console.log('   toText y',y); if(y!=null) bot=Math.max(0,y); }
      if(j.fromText){ const y=await findY(j.fromText,j.fromOff); if(y!=null) top=Math.max(0,y); }
      await ev(`window.scrollTo(0,${top})`); await sleep(1500); fs.writeFileSync(`${dir}/start.txt`,String(Date.now()/1000));
      const steps=secs*30;
      for(let i=0;i<=steps;i++){
        const t=i/steps, e=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;   // easeInOutQuad
        await ev(`window.scrollTo(0,${Math.round(top+(bot-top)*e)})`);
        await sleep(1000/30);
      }
    } else { await sleep(secs*1000); }
    await send('Page.stopScreencast'); onFrame=null; fs.writeFileSync(`${dir}/ts.json`,JSON.stringify(TS));
    await sleep(400);
    console.log('   ok',n,'frames ->',dir);
  }
  ws.close(); ch.kill();
}
main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);});
