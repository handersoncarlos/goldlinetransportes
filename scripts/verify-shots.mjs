// Screenshots de verificação com Playwright (Chrome instalado no sistema).
// Uso: node scripts/verify-shots.mjs [url] [larguras separadas por vírgula] [--reduced] [--nojs] [--sections]
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const args = process.argv.slice(2);
const url = args.find((a) => a.startsWith('http')) || 'http://localhost:4173/';
const widths = (args.find((a) => /^\d+(,\d+)*$/.test(a)) || '360,390,768,1366,1920').split(',').map(Number);
const reduced = args.includes('--reduced');
const nojs = args.includes('--nojs');
const sections = args.includes('--sections');
const tag = reduced ? 'reduced' : nojs ? 'nojs' : 'normal';
const OUT = `_verificacao/${tag}`;
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const report = [];
for (const w of widths) {
  const ctx = await browser.newContext({
    viewport: { width: w, height: w < 768 ? 800 : 900 },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    javaScriptEnabled: !nojs,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  // Fecha o banner de cookies para não cobrir as capturas
  if (!nojs) await page.locator('[data-consent="denied"]').click({ timeout: 2000 }).catch(() => {});
  // Rola devagar até o fim para disparar as animações de entrada
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(3200);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1600);
  const info = await page.evaluate(() => {
    const h1 = document.querySelector('h1');
    const lh = h1 ? parseFloat(getComputedStyle(h1).lineHeight) : 0;
    // Elementos que ainda estão invisíveis após as animações
    const hidden = [...document.querySelectorAll('main *')].filter((el) => {
      const cs = getComputedStyle(el);
      return el.getClientRects().length && (cs.opacity === '0' || cs.visibility === 'hidden') && !el.closest('[hidden],.hp,.map__plane,.map__pulse,.map__route-mask,.faq__panel');
    }).map((el) => el.className || el.tagName).slice(0, 10);
    return {
      overflowX: document.documentElement.scrollWidth - innerWidth,
      h1Lines: h1 ? Math.round(h1.getBoundingClientRect().height / lh) : 0,
      h1Count: document.querySelectorAll('h1').length,
      hidden,
    };
  });
  report.push({ w, ...info, errors });
  await page.screenshot({ path: `${OUT}/full-${w}.png`, fullPage: true });
  if (sections) {
    const ids = await page.$$eval('main > section, footer', (els) => els.map((e, i) => e.id || `s${i}`));
    for (const [i, id] of ids.entries()) {
      const el = page.locator('main > section, footer').nth(i);
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await el.screenshot({ path: `${OUT}/${w}-${String(i).padStart(2, '0')}-${id}.png` }).catch(() => {});
    }
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
