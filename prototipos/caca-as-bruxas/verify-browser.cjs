// Run with the bundled Codex runtime's Playwright or a local Playwright install.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
let playwright;
try { playwright = require('playwright'); } catch {
  playwright = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const root = path.resolve(__dirname, '../..');
const preview = path.join(root, 'Sprites/CacaAsBruxas/_preview');
fs.mkdirSync(preview, { recursive: true });
const server = http.createServer((request, response) => {
  const target = path.resolve(root, '.' + decodeURIComponent(request.url.split('?')[0]));
  if (!target.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  const file = target.endsWith(path.sep) ? path.join(target, 'index.html') : target;
  const ext = path.extname(file);
  try {
    response.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' })[ext] || 'application/octet-stream');
    response.end(fs.readFileSync(file));
  } catch { response.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await playwright.chromium.launch({ channel: 'msedge', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`); });
    const url = `http://127.0.0.1:${server.address().port}/prototipos/caca-as-bruxas/index.html`;
    await page.goto(url);
    await page.waitForFunction(() => !!window.WitchGame);
    await page.screenshot({ path: path.join(preview, 'browser-title.png') });
    await page.locator('#play-btn').click();
    const intro = page.locator('#dialog-actions button');
    if (await intro.count()) await intro.first().click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(preview, 'browser-game.png') });
    const before = await page.evaluate(() => window.WitchGame.getState());
    await page.keyboard.down('d'); await page.waitForTimeout(650); await page.keyboard.up('d');
    await page.keyboard.press('Space'); await page.keyboard.press('j');
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => window.WitchGame.getState());
    if (after.player.x <= before.player.x) throw new Error('Keyboard movement did not advance the player');
    if (!Object.values(after.assets).every(Boolean)) throw new Error('A game sprite failed to load');
    console.log(JSON.stringify({ errors, playerMoved: after.player.x > before.player.x, assetsLoaded: Object.keys(after.assets).length, started: after.active, paused: after.paused }));
    await page.screenshot({ path: path.join(root, 'prototipos/thumbs/caca-as-bruxas.jpg'), type: 'jpeg', quality: 85 });
    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await mobile.goto(url);
    await mobile.locator('#play-btn').click();
    if (await mobile.locator('#dialog-actions button').count()) await mobile.locator('#dialog-actions button').first().click();
    await mobile.waitForTimeout(300);
    const aspect = await mobile.locator('#game').evaluate(canvas => ({ source: canvas.width / canvas.height, displayed: canvas.clientWidth / canvas.clientHeight }));
    if (Math.abs(aspect.source - aspect.displayed) > .015) throw new Error('Mobile canvas is stretched');
    await mobile.screenshot({ path: path.join(preview, 'browser-mobile.png') });
    if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
