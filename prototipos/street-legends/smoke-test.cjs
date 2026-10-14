// Verifica o fluxo usando a física real do rally-core, com DOM/canvas simulados.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const gradient = { addColorStop() {} };
const ctx = new Proxy({}, { get: (o, k) => o[k] || (k.startsWith('create') ? () => gradient : () => {}), set: (o, k, v) => (o[k] = v, true) });
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, { classList: { add() {}, remove() {}, toggle() {} }, style: {}, getContext: () => ctx, querySelectorAll: () => [], querySelector: () => null, appendChild() {}, addEventListener() {}, focus() {}, select() {} });
  return elements.get(id);
}
const sandbox = { console, document: { getElementById: element, createElement: () => element(Math.random()), querySelectorAll: () => [] }, localStorage: { getItem: () => null, setItem() {} }, location: { hash: '' }, window: { devicePixelRatio: 1 }, innerWidth: 1280, innerHeight: 720, addEventListener() {}, requestAnimationFrame() {}, setTimeout, Math };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/../rally-core/rally-core.js', 'utf8'), sandbox);
vm.runInContext('RC.loadImages = async () => {}; RC.carSet = () => []; RC.pattern = () => null; RC.holdButton = () => {};', sandbox);
vm.runInContext(fs.readFileSync(__dirname + '/game.js', 'utf8'), sandbox);
setImmediate(() => {
  const run = code => vm.runInContext(code, sandbox);
  run('enterCity(); step(.016); frame(16);');
  assert.equal(run('roaming'), true);
  assert.equal(run('nearestEvent'), 0);
  assert.equal(run('police.length'), 0);
  assert.equal(run('world.buildings.every(b => [b.x,b.y,b.w,b.h].every(Number.isFinite))'), true);
  assert.equal(run('ROUTES.every(r => [r.start,...r.cps].every(p => { const [x,y] = at(p); return !world.blockers.some(b => b.w && x > b.x && x < b.x+b.w && y > b.y && y < b.y+b.h); }))'), true);
  run('enterEvent(); started = true; heatTime = 8; step(.016);');
  assert.equal(run('roaming'), false);
  assert.equal(run('police.length'), 1);
  run('startRace(1); started = true; police = []; heatTime = 0; spawnN = 0;');
  for (let lap = 1; lap <= 2; lap++) {
    for (let cp = 0; cp < 4; cp++) run('car.x = at(currentCp())[0]; car.y = at(currentCp())[1]; car.vx = car.vy = 0; sc.mouse.has = false; step(.016);');
    assert.equal(run('finished'), lap === 2);
    if (lap === 1) assert.equal(run('lap'), 2);
  }
  assert.equal(run('D.stats.races'), 1);
  run('spawnPolice(); const countBeforeReturn = police.length; act("menu"); frame(32);');
  assert.equal(run('roaming'), true);
  assert.equal(run('police.length === countBeforeReturn'), true);
  run('car.x = gx(0); car.y = gy(0); police.forEach(c => { c.x = gx(9); c.y = gy(7); }); escapeT = 9.99; step(.02);');
  assert.equal(run('police.length'), 0);
  run('showGarage(); step(.016);');
  assert.equal(run('sc.active'), false);
  run('RC.hideDialog(); sc.active = true; getCaught(); act("city"); frame(48);');
  assert.equal(run('caught'), false);
  assert.equal(run('roaming'), true);
  assert.equal(run('police.length'), 0);
  console.log('OK: exploração, largadas livres, checkpoints acessíveis, duas voltas, recompensa, perseguição após chegada, fuga, garagem e retorno após captura.');
});
