// Guerreiro da Masmorra 3D — a batalha do V2 desenhada em 3D, no estilo HD-2D.
//
// POR QUE: o V2 desenha a luta num canvas 2D, num corredor em pseudo-3D (a estrada é um
// trapézio de fatias, e "longe" é só desenhar mais alto e menor). Aqui a mesma luta vira uma
// cena Three.js: estrada e margens são chão 3D com texturas do PixelLab, o céu do V2 vira o
// fundo, e personagens e cenário são placas iluminadas, com sombra, bloom e tilt-shift.
//
// ESTRATÉGIA: o jogo continua inteiro em coordenadas de TELA (herói, monstros, botes, pulos,
// toques e a mira da pedrada usam x/y em pixels). Para não mexer em nada disso:
//   1. A câmera 3D é calibrada para que o chão projete exatamente o trapézio da estrada do V2
//      (a largura da estrada varia em linha reta com a altura na tela, então existe uma câmera
//      real com esse horizonte). Assim, cada ponto de tela abaixo do horizonte corresponde a um
//      ponto do chão 3D, e vice-versa.
//   2. Cada coisa que o V2 posiciona na tela (personagem, objeto da margem, item de cenário) vira
//      uma placa virada para a câmera, com os pés no ponto do chão sob os pés dela e o tamanho
//      calculado para ocupar os mesmos pixels. O pulo do herói é a exceção: os pés ficam no chão
//      e a subida na tela vira altura.
//   3. O boneco de cada personagem é desenhado pelo próprio drawActor do jogo (modo 'sprite') num
//      canvas próprio, que vira a textura da placa: animações, filtros de dano/morte/fúria e os
//      sheets de 8 direções continuam sendo os do V2. Barras, nomes, números e explosões são
//      desenhados por cima, no canvas 2D de sempre (#cv), que também recebe os toques.
// Este arquivo é um módulo: ele enxerga as variáveis globais do script do jogo (player, enemies,
// W, H, roadScroll, ctx...) pelo escopo global, e troca o ctx só durante o desenho de um boneco.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const ART = '../../Sprites/GuerreiroDaMasmorraV2-3D/';
const TEX = window.V2_3D_TEX || {};           // variações de estrada e margem por bioma (textures.js)
const FOV = 50, CAM_H = 3;                    // graus; altura da câmera (só define a escala do mundo)
const ROAD_COLS = 4, VERGE_COLS = 6;          // tiles na largura da estrada e em cada margem

const mainCtx = ctx;                          // o contexto 2D do #cv (barras, números)
const gl = new THREE.WebGLRenderer({ canvas: document.getElementById('cv3d'), antialias: true, powerPreference: 'high-performance' });
gl.shadowMap.enabled = true;
gl.shadowMap.type = THREE.PCFSoftShadowMap;
gl.toneMapping = THREE.ACESFilmicToneMapping;
gl.toneMappingExposure = 1.05;
gl.localClippingEnabled = true;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 400);

// ---- pós-processamento HD-2D: bloom, tilt-shift (borrão em cima e embaixo) e vinheta
const composer = new EffectComposer(gl);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.5, 0.55, 0.8);
composer.addPass(bloom);
const tiltShift = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, res: { value: new THREE.Vector2(1, 1) }, focus: { value: 0.47 }, band: { value: 0.27 }, amount: { value: 2.0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float focus, band, amount; varying vec2 vUv;
    void main(){
      float d = max(0.0, abs(vUv.y - focus) - band) / (0.5 - band);
      float r = d * d * amount;
      vec4 c = vec4(0.0); float wsum = 0.0;
      for (int i = -4; i <= 4; i++) for (int j = -2; j <= 2; j++) {
        float w = 1.0 - abs(float(i)) / 5.0;
        c += texture2D(tDiffuse, vUv + vec2(float(j) * 1.5, float(i)) * r / res) * w; wsum += w;
      }
      c /= wsum;
      vec2 q = vUv - 0.5; float vig = 1.0 - dot(q, q) * 0.8;
      gl_FragColor = vec4(c.rgb * vig, 1.0);
    }`,
});
composer.addPass(tiltShift);
composer.addPass(new OutputPass());

// ---- luzes: céu e chão do bioma, luar de cima à esquerda (com sombra) e luz quente no miolo da luta
const hemi = new THREE.HemisphereLight(0x8a90c0, 0x2a2140, 1.25);
scene.add(hemi);
const moon = new THREE.DirectionalLight(0xc8d4ff, 1.5);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.bias = -0.0006;
moon.shadow.radius = 3;
scene.add(moon, moon.target);
const warm = new THREE.PointLight(0xffc488, 9, 7, 1.4);
scene.add(warm);
scene.fog = new THREE.Fog(0x000000, 6, 16);

// ---- céu: o drawSky do V2 desenhado num canvas que vira o fundo da cena
const skyCanvas = document.createElement('canvas');
const skyCtx = skyCanvas.getContext('2d');
const skyTex = new THREE.CanvasTexture(skyCanvas);
skyTex.colorSpace = THREE.SRGBColorSpace;
scene.background = skyTex;

// ---- texturas
const loader = new THREE.TextureLoader();
const TEXC = {};
function pixelTex(t) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.anisotropy = gl.capabilities.getMaxAnisotropy();
  return t;
}
// Os tiles do PixelLab vêm com 1 px de contorno escuro na borda: corta esse pixel de cada lado,
// senão aparece uma grade entre todos os tiles do chão.
function fileTex(path) {
  if (TEXC[path]) return TEXC[path];
  const t = pixelTex(loader.load(ART + path + '.png'));
  t.repeat.set(62 / 64, 62 / 64); t.offset.set(1 / 64, 1 / 64);
  return (TEXC[path] = t);
}
// Recorte de uma folha já carregada pelo jogo (DECOR_IMGS): uma textura por recorte.
const CROPC = new Map();
function cropTex(img, sx, sy, sw, sh) {
  const key = `${img.src}|${sx}|${sy}|${sw}|${sh}`;
  let t = CROPC.get(key);
  if (t) return t;
  t = new THREE.Texture(img);
  t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
  t.repeat.set(sw / img.width, sh / img.height);
  t.offset.set(sx / img.width, 1 - (sy + sh) / img.height);
  t.needsUpdate = true;
  CROPC.set(key, t);
  return t;
}
const blobTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,0.8)'); r.addColorStop(0.55, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
})();

// ---- calibração: câmera e chão que reproduzem a estrada do V2
const ray = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2(), hit = new THREE.Vector3(), tmp = new THREE.Vector3();
const camUp = new THREE.Vector3();
let calW = 0, calH = 0, focalPx = 1;
let road = { w: 1, zFar: -9, zNear: -2, tile: 0.25 };

// Ponto do chão (y = 0) sob um ponto da tela, em px do #cv. Acima do horizonte não há chão: null.
function groundAt(px, py) {
  ndc.set(px / W * 2 - 1, -(py / H * 2 - 1));
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(groundPlane, hit) ? hit.clone() : null;
}
// Quantas unidades do mundo cabem em 1 px da tela a uma dada posição (para a placa ocupar os mesmos pixels).
function worldPerPx(p) {
  tmp.copy(p).applyMatrix4(camera.matrixWorldInverse);
  return -tmp.z / focalPx;
}

function calibrate() {
  calW = W; calH = H;
  const g = roadGeom();
  // A largura da estrada no V2 é linear na altura da tela: ela chega a zero na linha do horizonte.
  const slope = (g.wBot - g.wTop) / (g.yBot - g.yTop);
  const yHorizon = g.yTop - g.wTop / slope;
  const ndcH = 1 - 2 * yHorizon / H;
  const half = THREE.MathUtils.degToRad(FOV / 2);
  camera.fov = FOV; camera.aspect = W / H; camera.near = 0.1; camera.far = 400;
  camera.position.set(0, CAM_H, 0);
  camera.rotation.set(-Math.atan(ndcH * Math.tan(half)), 0, 0);   // olha para baixo até o horizonte ficar no lugar
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  focalPx = (H / 2) / Math.tan(half);
  camUp.set(0, 1, 0).applyQuaternion(camera.quaternion);
  const far = groundAt(W / 2, g.yTop), near = groundAt(W / 2, H * 1.08);
  const L = groundAt(W / 2 - g.wBot / 2, g.yBot), R = groundAt(W / 2 + g.wBot / 2, g.yBot);
  road = { w: R.x - L.x, zFar: far.z, zNear: near.z, tile: (R.x - L.x) / ROAD_COLS };
  buildGround();
  // Luar vindo de cima, do lado da câmera, à esquerda; a sombra cobre o corredor inteiro.
  const mid = (road.zFar + road.zNear) / 2;
  moon.position.set(-4, 9, mid + 6); moon.target.position.set(0, 0, mid);
  const sc = moon.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 30; sc.updateProjectionMatrix();
  const w0 = groundAt(W / 2, g.yTop + (g.yBot - g.yTop) * 0.62);
  warm.position.set(0, 1.6, w0 ? w0.z : mid);
  scene.fog.near = Math.abs(road.zFar) * 0.55; scene.fog.far = Math.abs(road.zFar) * 1.6;
  skyCanvas.width = Math.max(1, Math.round(W)); skyCanvas.height = Math.max(1, Math.round(H));
}

// ---- chão: tiles da estrada e das margens. A marcha (roadScroll) desliza os tiles para a câmera.
const groundGroup = new THREE.Group(); scene.add(groundGroup);
let tiles = [];          // { mesh, col, kind: 'road' | 'verge' }
let tileRows = 0;
const tileGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
const edgeMat = new THREE.MeshStandardMaterial({ color: 0x07060c, roughness: 1, transparent: true, opacity: 0.55 });
let edges = [];
function buildGround() {
  groundGroup.clear(); tiles = []; edges = [];
  tileRows = Math.ceil((road.zNear - road.zFar) / road.tile) + 2;
  const clip = [new THREE.Plane(new THREE.Vector3(0, 0, 1), -road.zFar)];   // corta o que passaria do fim do corredor
  roadMats.forEach(m => { m.clippingPlanes = clip; });
  vergeMats.forEach(m => { m.clippingPlanes = clip; });
  for (let r = 0; r < tileRows; r++) {
    for (let c = -VERGE_COLS; c < ROAD_COLS + VERGE_COLS; c++) {
      const kind = c >= 0 && c < ROAD_COLS ? 'road' : 'verge';
      const m = new THREE.Mesh(tileGeo, kind === 'road' ? roadMats[0] : vergeMats[0]);
      m.scale.set(road.tile, 1, road.tile); m.receiveShadow = true;
      groundGroup.add(m); tiles.push({ mesh: m, col: c, row: r, kind });
    }
  }
  // Sombra fina na divisa estrada/margem (o V2 também desenha essa linha).
  for (const sgn of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.PlaneGeometry(0.05, road.zNear - road.zFar + 2).rotateX(-Math.PI / 2), edgeMat);
    e.position.set(sgn * road.w / 2, 0.004, (road.zNear + road.zFar) / 2 + 1); groundGroup.add(e); edges.push(e);
  }
}
let roadMats = [new THREE.MeshStandardMaterial({ color: 0x6d6a62, roughness: 0.95 })];
let vergeMats = [new THREE.MeshStandardMaterial({ color: 0x24301c, roughness: 1 })];
let biomeKey = '';
function applyBiome() {
  if (battleBiome === biomeKey) return;
  biomeKey = battleBiome;
  const set = TEX[battleBiome] || TEX.castelo;
  const dir = TEX[battleBiome] ? battleBiome : 'castelo';
  const clip = roadMats[0].clippingPlanes;
  if (set) {
    roadMats = set.road.map(i => new THREE.MeshStandardMaterial({ map: fileTex(`${dir}/road-${String(i).padStart(2, '0')}`), roughness: 0.95, clippingPlanes: clip }));
    vergeMats = set.verge.map(i => new THREE.MeshStandardMaterial({ map: fileTex(`${dir}/verge-${String(i).padStart(2, '0')}`), roughness: 1, clippingPlanes: clip }));
  }
  const sk = SKIES[battleBiome] || SKIES.castelo;
  hemi.color.set(sk.haze).lerp(new THREE.Color(0xb8c0e0), 0.45);
  hemi.groundColor.set(sk.verge[0]);
  scene.fog.color.set(sk.bot);
  moon.color.set(sk.body.col).lerp(new THREE.Color(0xc8d4ff), 0.5);
}
function updateGround() {
  const span = road.zNear - road.zFar;
  const travel = roadScroll * span / 8;                 // 1 de roadScroll = 1 das 8 fileiras da estrada do V2
  const base = Math.floor(travel / road.tile), frac = travel / road.tile - base;
  for (const t of tiles) {
    const z = road.zFar + (t.row - 1 + frac) * road.tile;
    const x = -road.w / 2 + (t.col + 0.5) * road.tile;
    t.mesh.position.set(x, 0, z);
    const h = cellHash(t.col + 50, t.row - base);
    const mats = t.kind === 'road' ? roadMats : vergeMats;
    t.mesh.material = mats[(h >>> 4) % mats.length];
  }
}

// ---- placas (cenário, objetos das margens e personagens)
function makeBoard(map) {
  const mat = new THREE.MeshLambertMaterial({ map, transparent: true, alphaTest: 0.06, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.5 });
  scene.add(mesh);
  return mesh;
}
function setBoardMap(mesh, map) {
  if (mesh.material.map === map) return;
  mesh.material.map = map; mesh.material.needsUpdate = true;
  mesh.customDepthMaterial.map = map; mesh.customDepthMaterial.needsUpdate = true;
}
// Põe a placa com a base (pés) no ponto do chão sob (footX, footY) da tela, ocupando wPx × hPx.
// lift = px de tela acima do chão (pulo). Devolve o ponto do chão, ou null se ficou acima do horizonte.
function placeBoard(mesh, footX, footY, wPx, hPx, opts = {}) {
  const G = groundAt(footX, footY);
  if (!G) { mesh.visible = false; return null; }
  const k = worldPerPx(G);
  mesh.visible = true;
  mesh.quaternion.copy(camera.quaternion);
  mesh.scale.set(wPx * k * (opts.mirror ? -1 : 1), hPx * k, 1);
  mesh.position.copy(G).addScaledVector(camUp, (hPx * (opts.anchor ?? 0.5) + (opts.lift || 0)) * k);
  mesh.material.opacity = opts.alpha ?? 1;
  return G;
}
class Pool {
  constructor() { this.items = []; this.used = 0; }
  next() { if (this.used >= this.items.length) this.items.push(makeBoard(null)); return this.items[this.used++]; }
  finish() { for (let i = this.used; i < this.items.length; i++) this.items[i].visible = false; this.used = 0; }
}
const sceneryPool = new Pool(), sidePool = new Pool();

// Itens de cenário do V2 (construções, árvores, pedras): x/y/w em fração da tela, y = centro.
function updateScenery() {
  for (const s of scenery) {
    const img = DECOR_IMGS[s.src];
    if (!img || !img.naturalWidth) continue;
    const sw = s.sw || img.width, sh = s.sh || img.height;
    const w = W * s.w, h = w * sh / sw;
    const x = s.mirror ? mirrorX(W * s.x) : W * s.x;
    const b = sceneryPool.next();
    setBoardMap(b, cropTex(img, s.sx || 0, s.sy || 0, sw, sh));
    // Construções e árvores do fundo ficam bem longe: sem névoa, senão somem no céu.
    if (b.material.fog === !!s.bg) { b.material.fog = !s.bg; b.material.needsUpdate = true; }
    placeBoard(b, x, H * s.y + h / 2, w, h, { alpha: s.alpha, mirror: s.mirror });
  }
  sceneryPool.finish();
}
// Objetos das margens: mesma conta do drawSideProps do V2 (postos que andam com roadScroll).
function updateSideProps() {
  const list = sideProps;
  if (list && list.length) {
    const { yTop, yBot, wTop, wBot } = roadGeom();
    const frac = ((roadScroll % 1) + 1) % 1, base = Math.floor(roadScroll);
    for (let i = -1; i <= SIDE_ROWS; i++) {
      const t = (i + frac) / SIDE_ROWS;
      if (t <= 0.02 || t > 1.04) continue;
      for (const sgn of [-1, 1]) {
        const h = cellHash((i - base) * 2 + (sgn > 0 ? 1 : 0), 31);
        if (h % 10 < 3) continue;
        const key = list[(h >>> 3) % list.length], spr = SPR[key];
        const img = spr && DECOR_IMGS[spr[0]];
        if (!img || !img.naturalWidth) continue;
        const [, sx, sy, sw, sh] = spr;
        const e = roadEase(t);
        const y = yTop + (yBot - yTop) * e;
        const rw = wTop + (wBot - wTop) * e;
        const w = W * (SIDE_W[key] || 0.2) * (rw / wBot) * (0.82 + ((h >>> 9) % 36) / 100);
        const hgt = w * sh / sw;
        const cx = W / 2 + sgn * (rw / 2 + w * 0.34);
        const b = sidePool.next();
        setBoardMap(b, cropTex(img, sx, sy, sw, sh));
        placeBoard(b, cx, y, w, hgt, { anchor: 0.5, mirror: !!(h & 1) });
      }
    }
  }
  sidePool.finish();
}

// Personagens: o drawActor do V2 desenha o boneco num canvas próprio, que vira a textura da placa.
const actorViews = new Map();
function actorView(a) {
  let v = actorViews.get(a);
  if (v) return v;
  const canvas = document.createElement('canvas');
  v = { canvas, c2d: canvas.getContext('2d'), tex: null, size: 0, board: makeBoard(null),
        blob: new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })) };
  v.board.castShadow = true;
  scene.add(v.blob);
  actorViews.set(a, v);
  return v;
}
function updateActors(list, t) {
  for (const [a, v] of actorViews) if (!list.includes(a)) { scene.remove(v.board, v.blob); v.board.material.dispose(); if (v.tex) v.tex.dispose(); actorViews.delete(a); }
  for (const a of list) {
    const v = actorView(a);
    const s = a.size * depthK(a.y);                      // tamanho na tela, como o drawActor calcula
    const C = Math.max(64, Math.ceil(s * 2.6 / 32) * 32); // canvas com folga; tamanho em degraus para não recriar a textura a cada quadro
    if (C !== v.size) {
      v.size = C; v.canvas.width = v.canvas.height = C;
      if (v.tex) v.tex.dispose();
      v.tex = new THREE.CanvasTexture(v.canvas);
      v.tex.colorSpace = THREE.SRGBColorSpace; v.tex.magFilter = THREE.NearestFilter; v.tex.minFilter = THREE.LinearFilter; v.tex.generateMipmaps = false;
      setBoardMap(v.board, v.tex);
    }
    const c = v.c2d;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, C, C); c.imageSmoothingEnabled = false;
    c.translate(C / 2 - a.x, C / 2 - a.y);               // o drawActor faz translate(a.x, a.y): o boneco cai no centro
    ctx = c;
    try { drawActor(a, t, 'sprite'); } finally { ctx = mainCtx; }
    v.tex.needsUpdate = true;
    // Pés: 0,30 × tamanho abaixo do centro (onde o V2 desenha a sombra). No pulo, os pés ficam no chão e a subida vira altura.
    const jumping = a === player && a.anim === 'jump8';
    const footY = (jumping ? a.homeY : a.y) + 0.30 * s;
    const lift = jumping ? Math.max(0, a.homeY - a.y) : 0;
    // anchor: o centro do canvas (onde está o boneco) fica 0,30 × s acima dos pés
    const G = placeBoard(v.board, a.x, footY, C, C, { anchor: 0.30 * s / C, lift });
    v.blob.visible = !!G && !a.dead;
    if (G) {
      const k = worldPerPx(G), r = s * 0.62 * k * Math.max(0.45, 1 - lift / (s * 1.2));
      v.blob.position.set(G.x, 0.008, G.z); v.blob.scale.set(r, 1, r * 0.75);
      v.blob.material.opacity = 0.55 * a.alpha;
    }
  }
}

// ---- quadro
function draw(t) {
  if (W !== calW || H !== calH) { resize(); calibrate(); }
  applyBiome();
  // céu (o drawSky do V2 num canvas próprio)
  ctx = skyCtx;
  try {
    const sk = SKIES[battleBiome] || SKIES.castelo;
    skyCtx.setTransform(1, 0, 0, 1, 0, 0);
    skyCtx.fillStyle = sk.bot; skyCtx.fillRect(0, 0, W, H);
    drawSky(t || 0);
  } finally { ctx = mainCtx; }
  skyTex.needsUpdate = true;

  updateGround();
  updateScenery();
  updateSideProps();
  const actors = [...enemies, player].filter(a => a && !a.gone);
  updateActors(actors, t);
  warm.intensity = 9 * (1 + Math.sin(t * 0.004) * 0.04);
  composer.render();

  // camada 2D por cima: barras, nomes, marcadores, explosões, pedrada, números
  ctx.clearRect(0, 0, W, H);
  updateBossBar();
  actors.sort((a, b) => a.y - b.y).forEach(a => drawActor(a, t, 'hud'));
  drawOverlay(t);
}
function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  gl.setPixelRatio(dpr); gl.setSize(W, H, false);
  composer.setPixelRatio(dpr); composer.setSize(W, H);
  tiltShift.uniforms.res.value.set(W * dpr, H * dpr);
}

window.R3D = { ready: true, draw };
