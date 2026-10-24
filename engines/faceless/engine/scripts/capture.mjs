#!/usr/bin/env node
// Screenshots a real web page into a video's assets, ready to drop into a card as
// { "kind": "image", "src": "assets/shots/<name>.png" }. Uses the same headless
// Chrome HyperFrames renders with, at the card's width so text stays crisp.
//
// Pages are captured zoomed in (1.6x by default), like the reference's screenshots, so their
// text stays readable on a phone. The PNG is always 941 px wide (the card's width).
//
// Usage: npm --prefix engine run capture -- <url> <video slug> [--name shot] [--zoom 1.6] [--height 2400] [--mobile] [--dark]

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
import { ROOT } from '../lib/tools.mjs';
import { resolveVideo } from './build.mjs';

function chromePath() {
  if (process.env.HYPERFRAMES_CHROME_PATH && fs.existsSync(process.env.HYPERFRAMES_CHROME_PATH)) return process.env.HYPERFRAMES_CHROME_PATH;
  const base = path.join(os.homedir(), '.cache', 'hyperframes', 'chrome');
  const stack = [base];
  while (stack.length) {
    const d = stack.pop();
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (/^chrome-headless-shell(\.exe)?$/.test(e.name)) return p;
    }
  }
  throw new Error('Render browser not found. Run: npm --prefix engine run setup');
}

export async function capture(url, dir, { name, width = 941, height = 2400, zoom = 1.6, mobile = false, dark = false } = {}) {
  if (!/^https?:\/\//.test(url)) url = 'https://' + url;
  const out = path.join(dir, 'assets', 'shots');
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `${name || new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-')}.png`);
  const browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ['--hide-scrollbars', '--no-first-run'] });
  try {
    const page = await browser.newPage();
    const w = mobile ? 430 : Math.round(width / zoom);   // CSS width of the page
    const scale = width / w;                               // device pixels per CSS pixel
    await page.setViewport({ width: w, height: Math.round(w * 1.8), deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile });
    if (mobile) await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1');
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: dark ? 'dark' : 'light' }]);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 }).catch(() => {});
    // Hide cookie banners and sticky popups that would cover the content.
    await page.evaluate(() => {
      const kill = /cookie|consent|gdpr|newsletter|subscribe|modal|popup|banner/i;
      document.querySelectorAll('body *').forEach(el => {
        const cs = getComputedStyle(el);
        if ((cs.position === 'fixed' || cs.position === 'sticky') && (kill.test(el.className + ' ' + el.id) || el.offsetHeight > innerHeight * 0.3)) el.style.display = 'none';
      });
    });
    await new Promise(r => setTimeout(r, 1200));
    const full = await page.evaluate(() => document.documentElement.scrollHeight);
    const clipH = Math.min(full, Math.round(height / scale));
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: clipH } });
    const title = await page.title();
    return { file, title, width, height: Math.round(clipH * scale) };
  } finally {
    await browser.close();
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const argv = process.argv.slice(2);
  const opt = k => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
  const [url, slug] = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.match(/^--(name|width|height|zoom)$/));
  if (!url || !slug) { console.error('usage: capture <url> <video slug> [--name shot] [--zoom 1.6] [--mobile] [--dark]'); process.exit(1); }
  try {
    const r = await capture(url, resolveVideo(slug), { name: opt('name'), width: Number(opt('width')) || 941, height: Number(opt('height')) || 2400, zoom: Number(opt('zoom')) || 1.6, mobile: argv.includes('--mobile'), dark: argv.includes('--dark') });
    console.log(`Saved ${path.relative(ROOT, r.file)} (${r.width}x${r.height}) "${r.title}"`);
    console.log(`Use in a card: { "kind": "image", "src": "assets/shots/${path.basename(r.file)}", "url": "${url.replace(/^https?:\/\//, '')}" }`);
    console.log('LOOK at it (Read the PNG) before using it: logins, paywalls or error pages make bad B-roll.');
  } catch (e) { console.error('Capture failed:', e.message); process.exit(1); }
}
