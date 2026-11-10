// Post a finished reel to Instagram with the official Graph API (Business or Creator account),
// and read a post's stats. Zero dependencies. Settings come from .env (see .env.example):
//   IG_USER_ID        the Instagram professional account id
//   IG_ACCESS_TOKEN   a long-lived token with instagram_business_content_publish + instagram_business_manage_insights
//                     (Instagram Login), or instagram_content_publish + instagram_manage_insights (Facebook Login)
//   IG_GRAPH_HOST     graph.instagram.com (Instagram Login, default) or graph.facebook.com (Facebook Login)
//   IG_API_VERSION    default v23.0
// Upload is resumable straight from this computer, so the video never needs a public URL.
import fs from 'node:fs';
import './env.mjs';

const cfg = () => ({
  token: process.env.IG_ACCESS_TOKEN,
  user: process.env.IG_USER_ID,
  host: process.env.IG_GRAPH_HOST || 'graph.instagram.com',
  version: process.env.IG_API_VERSION || 'v23.0',
});
export const igConfigured = () => !!(process.env.IG_ACCESS_TOKEN && process.env.IG_USER_ID);

async function graph(method, endpoint, params = {}) {
  const c = cfg();
  const url = new URL(`${c.host.includes('://') ? c.host : 'https://' + c.host}/${c.version}/${endpoint}`);   // a full URL = a local test server
  const all = { ...params, access_token: c.token };
  const opts = { method };
  if (method === 'GET') for (const [k, v] of Object.entries(all)) url.searchParams.set(k, v);
  else { opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }; opts.body = new URLSearchParams(all); }
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) throw new Error(body.error?.error_user_msg || body.error?.message || `Instagram answered ${res.status}`);
  return body;
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// onStep(text) reports progress for the page. Returns { id, permalink, timestamp }.
export async function publishReel(file, caption = '', onStep = () => {}) {
  if (!igConfigured()) throw new Error('Instagram is not set up yet. Add IG_USER_ID and IG_ACCESS_TOKEN to .env.');
  if (!fs.existsSync(file)) throw new Error('The reel file is missing from the job folder.');
  if (caption.length > 2200) throw new Error('Instagram captions max out at 2,200 characters. Shorten this one.');
  const c = cfg();

  onStep('Creating the post');
  const box = await graph('POST', `${c.user}/media`, { media_type: 'REELS', upload_type: 'resumable', caption });

  onStep('Uploading the video');
  const bytes = fs.readFileSync(file);
  const uri = box.uri || `https://rupload.facebook.com/ig-api-upload/${c.version}/${box.id}`;
  const up = await fetch(uri, { method: 'POST', headers: { Authorization: `OAuth ${c.token}`, offset: '0', file_size: String(bytes.length) }, body: bytes });
  const upBody = await up.json().catch(() => ({}));
  if (!up.ok || upBody.error || upBody.success === false) throw new Error(upBody.error?.message || upBody.debug_info?.message || `Upload failed (${up.status})`);

  onStep('Instagram is processing the video');
  for (let i = 0; ; i++) {
    const s = await graph('GET', box.id, { fields: 'status_code,status' });
    if (s.status_code === 'FINISHED') break;
    if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error(`Instagram couldn't process the video: ${s.status || s.status_code}`);
    if (i > 120) throw new Error('Instagram is still processing after 10 minutes. Try again later.');
    await wait(5000);
  }

  onStep('Publishing');
  const pub = await graph('POST', `${c.user}/media_publish`, { creation_id: box.id });
  const info = await graph('GET', pub.id, { fields: 'permalink,timestamp' }).catch(() => ({}));
  return { id: pub.id, permalink: info.permalink || null, timestamp: info.timestamp || new Date().toISOString() };
}

// The retention side of one post: how long people watch, how many swipe away in the first 3 seconds,
// plus views and the two "worth keeping" signals (shares, saves). Metrics Instagram won't give come back null.
//   avgWatchMs  ig_reels_avg_watch_time, milliseconds
//   skipRate    reels_skip_rate, % of views skipped in the first 3 seconds (Meta marks it estimated)
//   engagement  total_interactions (likes + saves + comments + shares, net of removals)
const METRICS = { views: 'views', avgWatchMs: 'ig_reels_avg_watch_time', skipRate: 'reels_skip_rate', likes: 'likes', comments: 'comments',
  shares: 'shares', saves: 'saved', engagement: 'total_interactions', reach: 'reach' };
const valueOf = (d) => d?.total_value?.value ?? d?.values?.[0]?.value ?? null;
export async function reelStats(mediaId) {
  const out = {};
  try {
    const { data = [] } = await graph('GET', `${mediaId}/insights`, { metric: Object.values(METRICS).join(',') });
    for (const [key, name] of Object.entries(METRICS)) out[key] = valueOf(data.find((d) => d.name === name));
  } catch {
    // One unsupported metric fails the whole call, so ask one by one.
    for (const [key, name] of Object.entries(METRICS)) {
      try { const { data = [] } = await graph('GET', `${mediaId}/insights`, { metric: name }); out[key] = valueOf(data[0]); }
      catch { out[key] = null; }
    }
  }
  if (out.engagement == null && [out.likes, out.comments, out.shares, out.saves].some((x) => x != null)) {
    out.engagement = (out.likes || 0) + (out.comments || 0) + (out.shares || 0) + (out.saves || 0);
  }
  return out;
}
