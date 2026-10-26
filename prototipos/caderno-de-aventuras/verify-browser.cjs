// Verificação no navegador: abre o protótipo, joga um pouco e tira screenshots.
// Rode com uma instalação local do Playwright (ou a do runtime do Codex):
//   node prototipos/caderno-de-aventuras/verify-browser.cjs
// Os screenshots vão para prototipos/caderno-de-aventuras/_preview/ (fora do git).
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const os = require('node:os');
let playwright;
try { playwright = require('playwright'); } catch {
  playwright = require(path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
}
const root = path.resolve(__dirname, '../..');
const preview = path.join(__dirname, '_preview');
fs.mkdirSync(preview, { recursive: true });
const server = http.createServer((req, res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0]));
  if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const file = target.endsWith(path.sep) ? path.join(target, 'index.html') : target;
  try {
    res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' })[path.extname(file)] || 'application/octet-stream');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404).end(); }
});
const shot = (page, name) => page.screenshot({ path: path.join(preview, name + '.png') });

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/prototipos/caderno-de-aventuras/index.html`;
  const browser = await playwright.chromium.launch({ channel: 'msedge', headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });

    await page.goto(base + '?novo');
    await page.waitForSelector('#b-new');
    await page.waitForTimeout(2800);
    await shot(page, '01-capa');
    await page.fill('#nome', 'Abraão');
    await page.click('#b-new');
    await page.waitForTimeout(2600);
    await shot(page, '02-inicio');

    // Anda um pouco: tenta ir para a direita e para baixo.
    for (const key of ['ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowDown', 'ArrowRight', 'ArrowRight']) {
      if (await page.locator('#overlay').isVisible()) {
        const btn = page.locator('#acts button').last();
        if (await btn.count()) await btn.click(); else await page.locator('.actions button').last().click();
        await page.waitForTimeout(300);
      }
      await page.keyboard.down(key); await page.waitForTimeout(150); await page.keyboard.up(key);
      await page.waitForTimeout(350);
    }
    await page.waitForTimeout(1500);
    await shot(page, '03-andou');

    // Luta direta pelo atalho de desenvolvimento.
    await page.goto(base + '?novo&seed=7&luta=orc&nivel=4');
    await page.waitForSelector('#acts button');
    await page.waitForTimeout(1200);
    await shot(page, '04-luta');
    await page.locator('#acts button').first().click();
    await page.waitForTimeout(2600);
    await shot(page, '05-luta-dados');
    for (let k = 0; k < 30; k++) {
      const b = page.locator('#acts button:not([disabled])').first();
      if (!(await page.locator('#overlay').isVisible())) break;
      if (await b.count()) await b.click();
      await page.waitForTimeout(400);
    }

    // Mapa todo revelado, visto de longe.
    await page.goto(base + '?novo&seed=7&revelar');
    await page.waitForTimeout(2500);
    await page.keyboard.press('m');
    await page.waitForTimeout(1800);
    await shot(page, '06-mapa-todo');
    await page.keyboard.press('m');
    await page.waitForTimeout(1500);
    await shot(page, '07-mapa-perto');

    // Mochila, depois sai e volta para a vila inicial para abrir a loja.
    await page.keyboard.press('b');
    await page.waitForTimeout(600);
    await shot(page, '08-mochila');
    await page.locator('button[data-act="close"]').click();
    await page.goto(base + '?novo&seed=7&ouro=500');
    await page.waitForTimeout(2000);
    for (const [go, back] of [['ArrowUp', 'ArrowDown'], ['ArrowDown', 'ArrowUp'], ['ArrowLeft', 'ArrowRight'], ['ArrowRight', 'ArrowLeft']]) {
      const before = await page.evaluate(() => window.Caderno.state.P.x + ',' + window.Caderno.state.P.y);
      await page.keyboard.down(go); await page.waitForTimeout(120); await page.keyboard.up(go);
      await page.waitForTimeout(400);
      if (await page.locator('#overlay').isVisible()) { await page.locator('.actions button').last().click(); await page.waitForTimeout(300); }
      const after = await page.evaluate(() => window.Caderno.state.P.x + ',' + window.Caderno.state.P.y);
      if (after === before) continue;
      await page.keyboard.down(back); await page.waitForTimeout(120); await page.keyboard.up(back);
      await page.waitForTimeout(600);
      break;
    }
    await page.waitForTimeout(400);
    await shot(page, '08b-vila');
    const buy = page.locator('button[data-act="buy:espada_ferro"]');
    if (await buy.count()) { await buy.click(); await page.waitForTimeout(300); }
    await shot(page, '08c-vila-comprou');
    console.log('arma depois da compra:', await page.evaluate(() => window.Caderno.state.P.equip.arma));

    // Celular em pé.
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    phone.on('pageerror', e => errors.push('phone: ' + e.message));
    await phone.goto(base + '?novo&seed=7');
    await phone.waitForTimeout(2600);
    await shot(phone, '09-celular');
    await phone.goto(base + '?novo&seed=7&luta=goblin');
    await phone.waitForTimeout(1500);
    await phone.locator('#acts button').first().click();
    await phone.waitForTimeout(2500);
    await shot(phone, '10-celular-luta');
  } finally {
    await browser.close();
    server.close();
  }
  console.log(errors.length ? 'ERROS:\n' + errors.join('\n') : 'sem erros');
})();
