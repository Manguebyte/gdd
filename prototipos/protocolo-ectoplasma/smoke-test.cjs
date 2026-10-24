// Regressão dos fluxos reais no Chromium. Requer Playwright disponível em NODE_PATH.
// node prototipos/protocolo-ectoplasma/smoke-test.cjs
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '../..');
const output = process.env.ECTO_SCREENSHOTS;
const errors = [];
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(data);
  });
});
let browser;
async function screenshot(page, name) {
  if (!output) return;
  fs.mkdirSync(output, { recursive: true });
  await page.locator('#app').screenshot({ path: path.join(output, name + '.png') });
}
async function layout(page) {
  const violations = await page.evaluate(() => {
    const app = document.getElementById('app').getBoundingClientRect();
    return [...document.querySelectorAll('button')].filter(b => b.getClientRects().length && !b.closest('.archive-list')).flatMap(b => {
      const r = b.getBoundingClientRect();
      return r.left < app.left - 1 || r.right > app.right + 1 || r.top < app.top - 1 || r.bottom > app.bottom + 1 ? [b.textContent] : [];
    });
  });
  assert.deepEqual(violations, [], 'Todos os controles devem caber na área do jogo');
  const headerOverlap = await page.evaluate(() => {
    const screen = document.getElementById('screen');
    if (screen.classList.contains('hidden')) return [];
    const header = screen.querySelector('.terminal-head').getBoundingClientRect();
    return [...screen.children].filter(el => !el.classList.contains('terminal-head') && el.getBoundingClientRect().top < header.bottom - 1).map(el => el.className || el.tagName);
  });
  assert.deepEqual(headerOverlap, [], 'Conteúdo não deve sobrepor a marca do terminal');
}
async function start(page, stage = 0) {
  await page.evaluate(k => startImovel(BAIRROS[0], BAIRROS[0].imoveis[0], k), stage);
}
async function state(page) {
  return page.evaluate(() => ({ scene, paused, time: M.t, hp: M.op.hp, tank: M.tank, bag: M.bag, plasma: S.plasma, ghosts: M.ghosts.map(g => [g.x, g.y, g.p]), finishIn: M.finishIn }));
}
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // Teste offline: a interface precisa continuar legível sem Google Fonts.
  await context.route('https://**/*', route => route.abort());
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const url = `http://127.0.0.1:${server.address().port}/prototipos/protocolo-ectoplasma/index.html`;
  await page.goto(url);
  await page.locator('#start').waitFor();
  await layout(page); await screenshot(page, '01-abertura');
  await page.locator('#controls').click();
  assert.match(await page.locator('#screen').innerText(), /Procedimento de campo/);
  await page.keyboard.press('Escape');
  await page.locator('#start').click();
  await page.locator('[data-bairro="0"]').waitFor();
  await layout(page); await screenshot(page, '02-central');
  await page.locator('[data-bairro="0"]').click();
  await layout(page); await screenshot(page, '03-contratos');
  await page.locator('#shop').click();
  await layout(page); await screenshot(page, '04-equipamento');
  await page.keyboard.press('Escape');
  await page.locator('[data-im="acacias"]').click();
  await screenshot(page, '05-chegada');

  // Esc não deposita nem perde carga. Todos os valores de simulação devem parar.
  await page.evaluate(() => { M.bag = 101; });
  await page.keyboard.press('Escape');
  const pausedState = await state(page);
  await page.waitForTimeout(350);
  assert.deepEqual(await state(page), pausedState, 'Pausa deve congelar a simulação');
  await layout(page); await screenshot(page, '06-pausa');
  await page.locator('#evacuate').click();
  assert.match(await page.locator('#screen').innerText(), /◆ 50/);
  assert.match(await page.locator('#screen').innerText(), /◆ 51/);
  await page.locator('#cancel').click();
  assert.equal((await state(page)).bag, 101, 'Cancelar evacuação preserva a carga');
  await page.keyboard.press('Escape');
  await page.locator('#evacuate').click();
  await page.locator('#confirmEvac').click();
  assert.equal(await page.evaluate(() => S.plasma), pausedState.plasma + 50);
  assert.match(await page.locator('#screen').innerText(), /Abandonou o imóvel/);
  assert.equal(await page.evaluate(() => S.prog.acacias || 0), 0);

  // Foco e arquivo: nenhuma passagem de tempo durante leitura, texto escapado.
  await start(page, 1);
  await page.evaluate(() => { remember('Registro de teste <img src=x onerror=alert(1)>', 'note'); window.dispatchEvent(new Event('blur')); });
  assert.equal((await state(page)).paused, true);
  await page.locator('#archive').click();
  assert.equal(await page.locator('.archive-list img').count(), 0);
  await layout(page);
  await page.evaluate(() => {
    S.notes = S.notes.filter(t => !t.startsWith('Registro de teste'));
    S.records = S.records.filter(r => !r.text.startsWith('Registro de teste'));
    remember(NOTES.vila[0], 'note'); remember(MEMORIES.errante[0], 'memory');
    openArchive(openPause);
  });
  await screenshot(page, '07-arquivo');
  await page.keyboard.press('Escape');
  assert.match(await page.locator('#screen').innerText(), /Operação suspensa/);
  await page.keyboard.press('Escape');
  assert.equal((await state(page)).scene, 'mission');

  // Captura pela entrada normal: feixe sobre o fantasma, economia e memória reais.
  await start(page);
  await page.evaluate(() => {
    M.arrival = 0; M.op.x = 240; M.op.y = 240;
    const g = M.ghosts[0]; g.x = 240; g.y = 180; g.p = 1;
    mouse.x = g.x; mouse.y = g.y - g.size * .45; mouse.down = true;
  });
  await page.waitForFunction(() => M.bag === 40);
  await page.mouse.up();
  assert.equal(await page.evaluate(() => S.mem.length >= 1), true);
  assert.equal(await page.evaluate(() => S.records.some(r => r.kind === 'memory' && r.place.includes('Acácias'))), true);

  // Etapa concluída mantém progresso e permite retirar toda a carga.
  await page.evaluate(() => { M.ghosts = []; });
  await page.waitForFunction(() => M.cleared);
  await page.keyboard.press('Escape');
  await page.locator('#evacuate').click();
  assert.match(await page.locator('#screen').innerText(), /Carga protegida/);
  const beforeSafe = await page.evaluate(() => S.plasma);
  await page.locator('#confirmEvac').click();
  assert.equal(await page.evaluate(() => S.plasma), beforeSafe + 40);
  assert.equal(await page.evaluate(() => S.prog.acacias), 1);

  // Última captura: o prazo do recibo também pausa e paga apenas uma vez.
  await start(page, 2);
  await page.evaluate(() => { M.bag = 123; M.ghosts = []; });
  await page.waitForFunction(() => M.finishIn !== null);
  await page.keyboard.press('Escape');
  const finishing = await state(page);
  await page.waitForTimeout(1400);
  assert.deepEqual(await state(page), finishing, 'Relatório não pode encerrar missão pausada');
  await page.locator('#resume').click();
  await page.waitForFunction(() => S.clean.acacias === true);
  assert.equal(await page.evaluate(() => S.plasma), finishing.plasma + 183);
  assert.equal(await page.evaluate(() => S.prog.acacias), 3);
  await page.evaluate(() => finishImovel());
  assert.equal(await page.evaluate(() => S.plasma), finishing.plasma + 183);
  await layout(page); await screenshot(page, '08-relatorio');

  // Compra real persiste; tela pode ser percorrida só pelo teclado.
  await page.locator('#shop').click();
  const beforePurchase = await page.evaluate(() => ({ plasma: S.plasma, level: S.up.suck }));
  await page.locator('[data-up="suck"]').click();
  assert.equal(await page.evaluate(() => S.up.suck), beforePurchase.level + 1);
  assert.equal(await page.evaluate(() => S.plasma), beforePurchase.plasma - 40);
  assert.match(await page.locator('.screen-footer').innerText(), /melhoria instalada/);
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => $('screen').contains(document.activeElement)), true);

  // Save anterior, sem records: preserva progressão e revela registros antigos.
  await page.evaluate(() => localStorage.setItem(SAVE_KEY, JSON.stringify({ plasma: 500, intro: true, prog: { acacias: 1 }, clean: {}, up: { suck: 2 }, mem: ['Voz antiga'], notes: ['Bilhete antigo'], note: true })));
  await page.reload();
  await page.locator('#archiveBtn').waitFor();
  await page.locator('#archiveBtn').click();
  assert.match(await page.locator('.archive-list').innerText(), /Voz antiga/);
  assert.match(await page.locator('.archive-list').innerText(), /Bilhete antigo/);
  assert.match(await page.locator('.archive-list').innerText(), /Iracema/);
  assert.equal(await page.evaluate(() => S.plasma), 500);
  assert.equal(await page.evaluate(() => S.up.suck), 2);
  await page.keyboard.press('Escape');
  await page.locator('[data-bairro="0"]').click();
  assert.match(await page.locator('[data-im="acacias"]').innerText(), /Continuar: Térreo/);
  await page.locator('[data-im="acacias"]').click();
  await page.evaluate(() => { M.arrival = 0; });
  await screenshot(page, '09-casa-acacias');
  await page.evaluate(() => { M.ghosts = []; });
  await page.waitForFunction(() => M.cleared);
  await page.waitForTimeout(1600);
  await screenshot(page, '10-casa-liberada');
  await page.keyboard.press('Escape');
  for (const viewport of [{ width: 960, height: 540 }, { width: 1280, height: 720 }, { width: 800, height: 600 }]) {
    await page.setViewportSize(viewport);
    await layout(page);
  }

  // Final sem instruções internas e sem apagar progresso com um só clique.
  await page.evaluate(() => { paused = false; ending(); });
  await page.locator('#next').click();
  assert.doesNotMatch(await page.locator('#screen').innerText(), /§3\.2|em aberto|final alternativo/);
  await page.locator('#again').click();
  assert.equal(await page.evaluate(() => S.plasma), 500);
  await page.locator('#cancel').click();
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem(SAVE_KEY)).plasma), 500);
  // Som persiste entre carregamentos; há suporte a registros maiores que uma tela.
  await page.evaluate(() => { if (!SFX.isMuted()) SFX.toggleMute(); });
  await page.reload();
  await page.locator('#archiveBtn').waitFor();
  assert.equal(await page.evaluate(() => SFX.isMuted()), true);
  await page.evaluate(() => {
    S.notes.push(...Array.from({ length: 30 }, (_, i) => 'Documento de teste ' + i));
    openArchive(goMap, 'note');
  });
  assert.equal(await page.evaluate(() => { const list = document.querySelector('.archive-list'); return list.scrollHeight > list.clientHeight; }), true);
  await page.locator('.archive-list').focus();
  await page.keyboard.press('End');
  await page.waitForFunction(() => document.querySelector('.archive-list').scrollTop > 0);
  await layout(page);
  assert.deepEqual(errors, [], 'Sem exceções de JavaScript no navegador');
  console.log('PASS: menus, layout, pausa, foco, evacuação, captura, arquivo, relatório, compra, save legado e final.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  if (browser) await browser.close();
  server.close();
});
