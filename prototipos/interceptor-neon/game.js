// game.js — Interceptor Neon (protótipo). GDD: InterceptorNeon.md, Parte 1.
//
// POR QUE: o pilar do jogo é poder trocar de perspectiva a qualquer momento
// (de cima, perseguição, cabine) sem mudar as regras. Por isso o mundo é 3D
// de verdade por baixo, sempre: o avião tem posição, altitude e orientação
// (quaternion), e cada perspectiva é só uma pose de câmera diferente.
//
// ESTRATÉGIA:
// - Three.js via importmap (sem build). Tudo é modelado em código: cada objeto
//   é um preenchimento quase preto (esconde as linhas de trás) mais as arestas
//   acesas (LineSegments). Não há sprites nem texturas.
// - O "8-bit": a cena é desenhada num canvas com 1/PIX da resolução da tela e
//   ampliada pelo CSS sem suavizar. O brilho neon é um UnrealBloomPass na
//   mesma resolução baixa. O HUD é um canvas 2D do mesmo tamanho, com fonte
//   Press Start 2P a 8 px.
// - O voo é arcade: um modelo só para todos os aviões (jogador e IA). O modo
//   assistido converte "direção" em inclinação e arfagem alvo (é como o
//   jogador voa de cima e como a IA voa sempre); o modo manual gira o avião
//   direto (é como se voa na cabine, igual ao Ace Combat).
// - Missões são objetos com inicio/passo/objetivo; o resto (armas, IA,
//   câmera, HUD) é igual em todas.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

window.__IN_OK = true;

// ---------------------------------------------------------------------------
// Atalhos de desenvolvimento na URL: index.html#missao=2,cam=cabine,deus
// POR QUE: testar uma missão ou câmera sem passar pelo menu.
const FLAGS = Object.fromEntries(location.hash.slice(1).split(',').filter(Boolean)
  .map(s => { const [k, v] = s.split('='); return [k, v === undefined ? true : v]; }));

// ---------------------------------------------------------------------------
// Utilidades
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
const UP = new THREE.Vector3(0, 1, 0);
const wrapPi = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const suave = t => t * t * (3 - 2 * t);
// Gerador com semente (mulberry32): o mapa sai igual em toda partida.
function rng(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// Rumo de bússola (radianos: 0 = norte = -Z, +90° = leste = +X) de um vetor.
const rumoDe = v => Math.atan2(v.x, -v.z);

// Cores (hex). Cada cor quer dizer uma coisa no jogo inteiro.
const COR = {
  jogador: 0x22f0ff, hostil: 0xff2bd6, desconhecido: 0xffe23a, civil: 0x6dff7a,
  missilJ: 0xff9a2a, missilI: 0xff3b5c, bala: 0xfff3a0, flare: 0xfff0b0,
  montanha: 0x9d4dff, cidadeA: 0x22f0ff, cidadeB: 0xff2bd6, anel: 0x6dff7a,
};
const CSS = {
  hud: '#22f0ff', alerta: '#ff3b5c', hostil: '#ff2bd6', desconhecido: '#ffe23a',
  civil: '#6dff7a', jogador: '#22f0ff', fraco: '#3a7f99', anel: '#6dff7a',
};

// ---------------------------------------------------------------------------
// Save local
const SAVE_KEY = 'interceptor-neon-save-v1';
let save = { liberadas: 1, recordes: {}, inverterY: false, assist: { topo: true, persegue: false, cabine: false }, camera: 'persegue' };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) save = { ...save, ...s, assist: { ...save.assist, ...(s.assist || {}) } }; } catch { /* sem save */ }
const gravar = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* sem armazenamento */ } };

// ---------------------------------------------------------------------------
// Renderizador, cena e pós-processamento
const canvas = document.getElementById('cena');
const hud = document.getElementById('hud');
const g = hud.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05030c);
scene.fog = new THREE.Fog(0x0b0318, 3000, 17000);
const camera = new THREE.PerspectiveCamera(64, 16 / 9, 0.3, 70000);
scene.add(camera);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.75, 0.3, 0.18);
if (!FLAGS.sembrilho) composer.addPass(bloom);
composer.addPass(new OutputPass());

let PIX = 3, W = 640, H = 360;
function redimensionar() {
  // ~360 linhas na vertical em qualquer tela: o tamanho do pixel acompanha a janela.
  PIX = FLAGS.pix ? clamp(+FLAGS.pix, 1, 8) : Math.max(1, Math.round(innerHeight / 340));
  W = Math.ceil(innerWidth / PIX); H = Math.ceil(innerHeight / PIX);
  renderer.setSize(W, H, false);
  composer.setSize(W, H);
  hud.width = W; hud.height = H;
  camera.aspect = W / H; camera.updateProjectionMatrix();
}
addEventListener('resize', redimensionar);
redimensionar();

// Material de preenchimento: quase preto, empurrado para trás para as arestas
// ficarem por cima. É ele que esconde as linhas do outro lado do objeto.
const FILL = new THREE.MeshBasicMaterial({ color: 0x07040f, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
// Objeto neon: preenchimento + arestas acesas. limiar = ângulo mínimo (graus)
// entre faces para a aresta aparecer.
function neon(geo, cor, limiar = 20) {
  const grupo = new THREE.Group();
  grupo.add(new THREE.Mesh(geo, FILL));
  const mat = new THREE.LineBasicMaterial({ color: cor });
  grupo.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, limiar), mat));
  grupo.userData.mat = mat;
  return grupo;
}
// Geometria a partir de uma lista de triângulos [[x,y,z],[x,y,z],[x,y,z]].
function trisGeo(tris) {
  const a = new Float32Array(tris.length * 9);
  tris.forEach((t, i) => t.forEach((v, j) => { a[i * 9 + j * 3] = v[0]; a[i * 9 + j * 3 + 1] = v[1]; a[i * 9 + j * 3 + 2] = v[2]; }));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// Modelos de avião (low-poly, em código). Nariz em -Z, cima em +Y, direita em +X.
// POR QUE paramétrico: caça, bombardeiro e avião civil saem da mesma receita,
// mudando só as proporções; a silhueta diferente é o que o jogador lê.
function jato(o) {
  const L = o.len, h = o.h, w = o.w, T = [];
  const q = (a, b, c, d) => { T.push([a, b, c], [a, c, d]); };
  const z1 = -L * 0.18, z2 = L * 0.3;
  const N = [0, 0, -L / 2], E = [0, h * 0.3, L / 2];
  const a = [[0, h, z1], [w, 0, z1], [0, -h * 0.8, z1], [-w, 0, z1]];
  const b = [[0, h * 0.85, z2], [w * 0.8, 0, z2], [0, -h * 0.6, z2], [-w * 0.8, 0, z2]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    T.push([N, a[i], a[j]]); q(a[i], a[j], b[j], b[i]); T.push([b[i], b[j], E]);
  }
  const zf = o.wingZ - o.root / 2, zb = o.wingZ + o.root / 2, S = o.span / 2, dy = o.diedro || 0;
  for (const s of [1, -1]) {
    q([s * w * 0.9, 0, zf], [s * S, dy, zf + o.sweep], [s * S, dy, zf + o.sweep + o.tip], [s * w * 0.85, 0, zb]);
    if (o.stab) q([s * w * 0.7, 0, L * 0.32], [s * o.stab, 0, L * 0.42], [s * o.stab, 0, L * 0.48], [s * w * 0.6, 0, L * 0.46]);
  }
  const deriva = (x, inc) => q([x, h * 0.6, L * 0.2], [x + inc, h + o.finH, L * 0.4], [x + inc, h + o.finH, L * 0.48], [x, h * 0.5, L * 0.47]);
  if (o.duplo) { deriva(w * 0.45, w * 0.5); deriva(-w * 0.45, -w * 0.5); } else deriva(0, 0);
  if (o.cabine) {
    const c = [0, h * 1.7, -L * 0.22], f1 = [-w * 0.5, h * 0.7, -L * 0.33], f2 = [w * 0.5, h * 0.7, -L * 0.33];
    const t1 = [-w * 0.55, h * 0.8, -L * 0.1], t2 = [w * 0.55, h * 0.8, -L * 0.1];
    T.push([f1, f2, c], [c, t1, t2], [f1, c, t1], [f2, c, t2]);
  }
  // Motores em casulo sob as asas (bombardeiro e civil): tubo de 4 lados.
  for (const x of o.motores || []) {
    const r = o.motorR, y = -h * 0.2 - r * 1.6, z0 = o.wingZ - o.root * 0.7, z1m = z0 + r * 5;
    const p0 = [[x, y + r, z0], [x + r, y, z0], [x, y - r, z0], [x - r, y, z0]];
    const p1 = [[x, y + r, z1m], [x + r, y, z1m], [x, y - r, z1m], [x - r, y, z1m]];
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; q(p0[i], p0[j], p1[j], p1[i]); }
  }
  return trisGeo(T);
}
const GEO = {
  caca: jato({ len: 26, h: 1.6, w: 2, span: 22, root: 11, tip: 2, sweep: 8, wingZ: 2, duplo: true, finH: 5, stab: 6, cabine: true }),
  bombardeiro: jato({ len: 58, h: 3.4, w: 3.6, span: 76, root: 18, tip: 5, sweep: 22, wingZ: 0, finH: 11, stab: 14, motores: [12, -12, 22, -22], motorR: 1.6, diedro: -1 }),
  civil: jato({ len: 60, h: 3.6, w: 3.6, span: 58, root: 11, tip: 3.5, sweep: 9, wingZ: -2, finH: 12, stab: 11, motores: [10, -10], motorR: 2, diedro: 2 }),
};
GEO.jogador = GEO.caca;

// Atributos de voo (proposta, GDD §5). Velocidades em m/s (o HUD mostra km/h).
const TIPOS = {
  jogador: { hp: 100, vel: 190, velMin: 110, velMax: 310, rollRate: 3.0, pitchRate: 1.6, yawRate: 0.35, turnK: 0.95, maxBank: 1.25, raio: 13, cabine: [0, 2.4, -5.4] },
  caca: { hp: 60, vel: 190, velMin: 110, velMax: 300, rollRate: 2.6, pitchRate: 1.3, yawRate: 0.3, turnK: 0.78, maxBank: 1.2, raio: 13 },
  bombardeiro: { hp: 320, vel: 140, velMin: 110, velMax: 170, rollRate: 0.8, pitchRate: 0.4, yawRate: 0.1, turnK: 0.3, maxBank: 0.6, raio: 32 },
  civil: { hp: 200, vel: 150, velMin: 120, velMax: 180, rollRate: 0.8, pitchRate: 0.4, yawRate: 0.1, turnK: 0.3, maxBank: 0.5, raio: 30 },
};

// ---------------------------------------------------------------------------
// Céu (gradiente + sol listrado de fliperama), estrelas e chão em grade.
const ceu = new THREE.Mesh(new THREE.SphereGeometry(40000, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { sol: { value: new THREE.Vector3(0.3, 0.1, -1).normalize() } },
  vertexShader: `varying vec3 vD;
    void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
  fragmentShader: `uniform vec3 sol; varying vec3 vD;
    void main(){
      vec3 d = normalize(vD);
      vec3 topo = vec3(0.002, 0.001, 0.012), hor = vec3(0.07, 0.004, 0.08);
      vec3 c = mix(hor, topo, smoothstep(0.0, 0.5, d.y));
      c = mix(c, vec3(0.03, 0.0, 0.06), smoothstep(0.0, -0.15, d.y));
      float s = dot(d, sol);
      float disco = smoothstep(0.986, 0.988, s);
      float rel = (d.y - sol.y) / 0.16;
      float listra = rel < 0.0 ? step(0.35 + rel * 0.3, fract(rel * 9.0)) : 1.0;
      vec3 corSol = mix(vec3(1.0, 0.15, 0.55), vec3(1.0, 0.8, 0.2), smoothstep(-1.0, 1.0, rel));
      c = mix(c, corSol * 0.55, disco * listra * step(0.0, d.y));
      c += vec3(0.25, 0.02, 0.18) * pow(max(s, 0.0), 30.0) * 0.3;
      gl_FragColor = vec4(c, 1.0);
    }`,
}));
ceu.renderOrder = -2; ceu.frustumCulled = false;
scene.add(ceu);
{
  const r = rng(99), n = 700, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const az = r() * Math.PI * 2, el = Math.asin(0.05 + r() * 0.95), R = 30000;
    a[i * 3] = Math.cos(el) * Math.sin(az) * R; a[i * 3 + 1] = Math.sin(el) * R; a[i * 3 + 2] = Math.cos(el) * Math.cos(az) * R;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
  var estrelas = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xbfd8ff, size: 1, sizeAttenuation: false, fog: false }));
  estrelas.renderOrder = -1; estrelas.frustumCulled = false;
  scene.add(estrelas);
}
// Chão: plano enorme que segue a câmera; a grade é calculada no shader pela
// posição no mundo, então fica parada mesmo com o plano andando.
const chao = new THREE.Mesh(new THREE.PlaneGeometry(90000, 90000), new THREE.ShaderMaterial({
  fog: false,
  uniforms: { corFog: { value: new THREE.Color(0x0b0318) }, fogFar: { value: 17000 } },
  vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `varying vec3 vW; uniform vec3 corFog; uniform float fogFar;
    float grade(vec2 p, float s){
      vec2 q = p / s; vec2 fw = fwidth(q);
      vec2 g = abs(fract(q - 0.5) - 0.5) / fw;
      float l = 1.0 - min(min(g.x, g.y), 1.0);
      return l * (1.0 - smoothstep(0.2, 0.6, max(fw.x, fw.y)));
    }
    void main(){
      float d = distance(cameraPosition.xz, vW.xz);
      vec3 c = vec3(0.012, 0.0, 0.035);
      c += vec3(0.02, 0.1, 0.3) * grade(vW.xz, 250.0) * 0.5;
      c += vec3(0.5, 0.08, 0.6) * grade(vW.xz, 2000.0);
      c = mix(c, corFog, smoothstep(1500.0, fogFar, d));
      gl_FragColor = vec4(c, 1.0);
    }`,
}));
chao.rotation.x = -Math.PI / 2; chao.position.y = -1; chao.renderOrder = -1;
scene.add(chao);

// ---------------------------------------------------------------------------
// Terreno: montanhas (cones facetados) e a cidade no centro (0,0).
const MONTANHAS = [];
const PREDIOS = [];
// Anéis da missão de reconhecimento: as montanhas aleatórias não nascem perto.
const ANEIS = [[0, 900, 1400], [500, 650, -1200], [1900, 420, -3300], [1300, 900, -5800], [-1500, 1500, -5600], [-2900, 800, -2600], [-1200, 500, -300]];
function montanhaGeo(r, h, rand) {
  const geo = new THREE.ConeGeometry(r, h, 7, 3, true);
  const pos = geo.attributes.position, cache = new Map();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const k = `${x.toFixed(1)},${y.toFixed(1)},${z.toFixed(1)}`;
    let j = cache.get(k);
    if (!j) {
      const fixo = y > h / 2 - 1 || y < -h / 2 + 1;
      j = fixo ? [0, 0, 0] : [(rand() - 0.5) * r * 0.2, (rand() - 0.5) * h * 0.12, (rand() - 0.5) * r * 0.2];
      cache.set(k, j);
    }
    pos.setXYZ(i, x + j[0], y + j[1], z + j[2]);
  }
  geo.translate(0, h / 2, 0);
  geo.computeVertexNormals();
  return geo;
}
{
  const r = rng(7);
  // Duas montanhas fixas fazem o "cânion" do 3º anel.
  const lista = [[1900 - 1100, -3300, 900, 1500], [1900 + 1100, -3300, 900, 1400]];
  let tent = 0;
  while (lista.length < 48 && tent++ < 2000) {
    const x = (r() - 0.5) * 30000, z = (r() - 0.5) * 30000, rr = 400 + r() * 800, hh = 500 + r() * 1400;
    if (Math.hypot(x, z) < 2600 + rr) continue;
    if (Math.hypot(x, z - 3200) < 1600 + rr) continue;
    if (ANEIS.some(a => Math.hypot(x - a[0], z - a[2]) < 1300 + rr)) continue;
    lista.push([x, z, rr, hh]);
  }
  const geos = [];
  for (const [x, z, rr, hh] of lista) {
    MONTANHAS.push({ x, z, r: rr, h: hh });
    const geo = montanhaGeo(rr, hh, r); geo.translate(x, 0, z); geos.push(geo);
  }
  scene.add(neon(mergeGeometries(geos), COR.montanha, 8));
  // Cidade: prédios em caixa, em duas cores.
  const ga = [], gb = [];
  let n = 0; tent = 0;
  while (n < 70 && tent++ < 3000) {
    const x = (r() - 0.5) * 1800, z = (r() - 0.5) * 1800;
    if (Math.hypot(x, z) > 900) continue;
    const w = 40 + r() * 80, d = 40 + r() * 80, h = 40 + Math.pow(r(), 2) * 340 * (1 - Math.hypot(x, z) / 1100);
    if (PREDIOS.some(b => Math.abs(b.x - x) < (b.w + w) / 2 + 10 && Math.abs(b.z - z) < (b.d + d) / 2 + 10)) continue;
    PREDIOS.push({ x, z, w, d, h });
    const geo = new THREE.BoxGeometry(w, h, d); geo.translate(x, h / 2, z);
    (n % 3 === 0 ? gb : ga).push(geo); n++;
  }
  scene.add(neon(mergeGeometries(ga), COR.cidadeA, 30));
  scene.add(neon(mergeGeometries(gb), COR.cidadeB, 30));
}
function terreno(x, z) {
  let h = 0;
  for (const m of MONTANHAS) {
    const dx = x - m.x, dz = z - m.z, d2 = dx * dx + dz * dz;
    if (d2 < m.r * m.r) { const v = m.h * (1 - Math.sqrt(d2) / m.r); if (v > h) h = v; }
  }
  return h;
}
const bateuPredio = p => PREDIOS.some(b => Math.abs(p.x - b.x) < b.w / 2 && Math.abs(p.z - b.z) < b.d / 2 && p.y < b.h);

// ---------------------------------------------------------------------------
// Aviões
const AVIOES = [];
const corEquipe = e => COR[e];
class Aviao {
  constructor(tipo, equipe, pos, rumoGraus, extra = {}) {
    this.tipo = tipo; this.t = { ...TIPOS[tipo], ...extra };
    this.equipe = equipe; this.hp = this.t.hp; this.vivo = true;
    this.pos = pos.clone();
    this.q = new THREE.Quaternion().setFromAxisAngle(UP, -rumoGraus * D2R);
    this.vel = this.t.vel;
    this.ctrl = { x: 0, y: 0, yaw: 0, thr: 0, assist: true };
    this.obj = neon(GEO[tipo], corEquipe(equipe));
    // Chama do motor: três riscos laranja atrás, crescem com o acelerador.
    const L = GEO[tipo] === GEO.caca ? 13 : 29;
    const cg = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.7, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0.7, 0, 0), new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 0.6, 0), new THREE.Vector3(0, 0, 1)]);
    this.chama = new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: COR.missilJ }));
    this.chama.position.z = L; this.obj.add(this.chama);
    scene.add(this.obj);
    // Linha de queda (só na câmera de cima): do avião até o chão, com uma cruz.
    const qg = new THREE.BufferGeometry(); qg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(18), 3));
    this.queda = new THREE.LineSegments(qg, new THREE.LineBasicMaterial({ color: corEquipe(equipe), transparent: true, opacity: 0.45 }));
    this.queda.frustumCulled = false; scene.add(this.queda);
    this.misseis = extra.misseis || 0; this.flares = 0;
    this.cdArma = 0; this.cdMissil = 4 + Math.random() * 4; this.travaIA = 0; this.ameaca = 0; this.lado = 1;
    this.rajada = 0; this.flash = 0; this.id = 0; this.sinal = 0;
    this.ia = extra.ia || null;
    AVIOES.push(this);
  }
  get fwd() { return new THREE.Vector3(0, 0, -1).applyQuaternion(this.q); }
  get dir() { return new THREE.Vector3(1, 0, 0).applyQuaternion(this.q); }
  get cima() { return new THREE.Vector3(0, 1, 0).applyQuaternion(this.q); }
  get velVec() { return this.fwd.multiplyScalar(this.vel); }
  setEquipe(e) { this.equipe = e; this.obj.userData.mat.color.setHex(corEquipe(e)); this.queda.material.color.setHex(corEquipe(e)); }
  remover() { scene.remove(this.obj); scene.remove(this.queda); }
}

const _Q = new THREE.Quaternion(), _h = new THREE.Vector3();
// Um passo de voo. c = { x, y, yaw, thr, assist } com eixos em [-1, 1].
function voar(a, c, dt) {
  const t = a.t;
  let f = a.fwd; const r = a.dir, u = a.cima;
  const pitch = Math.asin(clamp(f.y, -1, 1));
  const bank = Math.atan2(-r.y, u.y); // positivo = asa direita para baixo
  if (c.assist) {
    // Assistido: o comando é a inclinação e a arfagem desejadas; o avião
    // corrige sozinho até lá (e nivela as asas quando o comando solta).
    const tb = c.x * t.maxBank, tp = c.y * 0.7;
    const dr = clamp((tb - bank) * 4, -t.rollRate, t.rollRate) * dt;
    _Q.setFromAxisAngle(f, dr); a.q.premultiply(_Q);
    _h.crossVectors(f, UP);
    if (_h.lengthSq() > 1e-4) {
      _h.normalize();
      const dp = clamp((tp - pitch) * 2.5, -t.pitchRate, t.pitchRate) * dt;
      _Q.setFromAxisAngle(_h, dp); a.q.premultiply(_Q);
    }
  } else {
    // Manual: gira o avião no próprio eixo, como um manche.
    _Q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), c.y * t.pitchRate * dt); a.q.multiply(_Q);
    _Q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -c.x * t.rollRate * dt); a.q.multiply(_Q);
  }
  _Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -c.yaw * t.yawRate * dt); a.q.multiply(_Q);
  // Curva por inclinação: avião inclinado faz a curva (sustentação de lado).
  _Q.setFromAxisAngle(UP, -Math.sin(bank) * t.turnK * Math.max(0, Math.cos(pitch)) * dt);
  a.q.premultiply(_Q).normalize();
  f = a.fwd;
  const alvo = c.thr > 0 ? t.velMax : c.thr < 0 ? t.velMin : t.vel;
  a.vel += (alvo - a.vel) * 0.7 * dt - 9.8 * 2 * f.y * dt;
  a.vel = clamp(a.vel, t.velMin * 0.8, t.velMax * 1.2);
  a.pos.addScaledVector(f, a.vel * dt);
}

// Converte uma direção desejada (mundo) em comando assistido. Usado pela IA.
function guiar(a, d) {
  const e = wrapPi(rumoDe(d) - rumoDe(a.fwd));
  a.ctrl.x = clamp(e * 2, -1, 1);
  a.ctrl.y = clamp(Math.asin(clamp(d.y, -1, 1)), -0.7, 0.7) / 0.7;
  a.ctrl.assist = true; a.ctrl.yaw = 0;
}

// ---------------------------------------------------------------------------
// Estado do jogo
const jogo = { estado: 'menu', idx: 0, missao: null, M: null, fimEm: 0, resultado: null };
let jogador = null;
let alvoSel = null;
const trava = { t: 0, ok: false };
const OBJS = []; // objetos de missão (anéis) para limpar
let radioFila = [], centro = { texto: '', t: 0, cor: CSS.hud }, dano = 0, tremor = 0;
function radio(texto, quem = 'TORRE') { radioFila.push({ texto: `${quem}: ${texto}`, t: 6 }); if (radioFila.length > 3) radioFila.shift(); SOM.bip(1400, 0.05, 0.04); }
function aviso(texto, cor = CSS.hud, t = 2) { centro = { texto, t, cor }; }

// ---------------------------------------------------------------------------
// Armas: balas (um LineSegments só para todas), mísseis com rastro e flares.
const BALAS = [];
const MAXB = 800;
const balaGeo = new THREE.BufferGeometry();
balaGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAXB * 6), 3));
balaGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAXB * 6), 3));
const balaLinhas = new THREE.LineSegments(balaGeo, new THREE.LineBasicMaterial({ vertexColors: true }));
balaLinhas.frustumCulled = false; scene.add(balaLinhas);
const corBalaJ = new THREE.Color(COR.bala), corBalaI = new THREE.Color(COR.missilI);
function atirar(dono, pos, dir, dano) {
  if (BALAS.length >= MAXB) return;
  const v = dir.clone().multiplyScalar(1000).add(dono.velVec);
  BALAS.push({ p: pos.clone(), v, vida: 1.3, dono, dano });
}
const _s = new THREE.Vector3(), _d = new THREE.Vector3();
// Distância do ponto c ao segmento a→b (bala rápida não atravessa o alvo entre quadros).
function distSeg(a, b, c) {
  _d.subVectors(b, a); const l2 = _d.lengthSq();
  const t = l2 ? clamp(_s.subVectors(c, a).dot(_d) / l2, 0, 1) : 0;
  return _s.copy(a).addScaledVector(_d, t).distanceTo(c);
}
function atualizarBalas(dt) {
  const pos = balaGeo.attributes.position.array, col = balaGeo.attributes.color.array;
  let n = 0;
  for (let i = BALAS.length - 1; i >= 0; i--) {
    const b = BALAS[i];
    const ant = b.p.clone();
    b.p.addScaledVector(b.v, dt); b.vida -= dt;
    let fim = b.vida <= 0 || b.p.y < terreno(b.p.x, b.p.z);
    if (!fim) {
      for (const a of AVIOES) {
        if (!a.vivo || a === b.dono) continue;
        if (b.dono !== jogador && a !== jogador) continue; // IA só acerta o jogador
        const raio = a.t.raio + (b.dono === jogador ? 4 : 0);
        if (distSeg(ant, b.p, a.pos) < raio) {
          ferir(a, b.dano, b.dono); fim = true;
          if (b.dono === jogador) jogo.M.acertos++;
          faisca(b.p, b.dono === jogador ? COR.bala : COR.missilI, 6);
          break;
        }
      }
    }
    if (fim) { BALAS.splice(i, 1); continue; }
    if (n < MAXB) {
      const k = n * 6, cor = b.dono === jogador ? corBalaJ : corBalaI;
      pos[k] = b.p.x; pos[k + 1] = b.p.y; pos[k + 2] = b.p.z;
      pos[k + 3] = b.p.x - b.v.x * 0.025; pos[k + 4] = b.p.y - b.v.y * 0.025; pos[k + 5] = b.p.z - b.v.z * 0.025;
      col[k] = col[k + 3] = cor.r; col[k + 1] = col[k + 4] = cor.g; col[k + 2] = col[k + 5] = cor.b;
      n++;
    }
  }
  balaGeo.setDrawRange(0, n * 2);
  balaGeo.attributes.position.needsUpdate = true; balaGeo.attributes.color.needsUpdate = true;
}

const MISSEIS = [];
const missilGeo = new THREE.OctahedronGeometry(2.2, 0);
class Missil {
  constructor(dono, alvo) {
    this.dono = dono; this.alvo = alvo;
    const lado = (dono.lado = -dono.lado) * 3;
    this.p = dono.pos.clone().addScaledVector(dono.dir, lado).addScaledVector(dono.cima, -1.5);
    this.dir = dono.fwd; this.vel = dono.vel + 40;
    this.vida = dono === jogador ? 9 : 7;
    this.curva = dono === jogador ? 2.0 : 1.1; this.velMax = dono === jogador ? 460 : 400;
    this.avisou = false;
    const cor = dono === jogador ? COR.missilJ : COR.missilI;
    this.obj = new THREE.LineSegments(new THREE.EdgesGeometry(missilGeo), new THREE.LineBasicMaterial({ color: cor }));
    this.n = 40; this.rastro = new Float32Array(this.n * 3);
    for (let i = 0; i < this.n; i++) this.rastro.set([this.p.x, this.p.y, this.p.z], i * 3);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(this.rastro, 3));
    this.linha = new THREE.Line(rg, new THREE.LineBasicMaterial({ color: cor, transparent: true, opacity: 0.6 }));
    this.linha.frustumCulled = false;
    scene.add(this.obj, this.linha);
    MISSEIS.push(this);
    SOM.missil(this.p);
  }
  remover() { scene.remove(this.obj, this.linha); }
}
function atualizarMisseis(dt) {
  for (let i = MISSEIS.length - 1; i >= 0; i--) {
    const m = MISSEIS[i];
    m.vida -= dt; m.vel = Math.min(m.velMax, m.vel + 160 * dt);
    const alvo = m.alvo;
    if (alvo && (alvo.vivo === false || (alvo.flare && alvo.vida <= 0))) m.alvo = null;
    if (m.alvo) {
      const des = m.alvo.pos.clone().sub(m.p); const dist = des.length(); des.divideScalar(dist || 1);
      const ang = Math.acos(clamp(m.dir.dot(des), -1, 1));
      if (ang > 1.4) m.alvo = null; // passou do alvo: perde a trava
      else if (ang > 1e-4) { m.dir.lerp(des, Math.min(1, m.curva * dt / ang)).normalize(); }
      // A IA tenta fugir de alguns mísseis do jogador (curva brusca).
      if (m.alvo && m.alvo.ia && !m.avisou && dist < 1600) { m.avisou = true; if (Math.random() < 0.5) { m.alvo.ameaca = 2.5; m.alvo.lado = Math.random() < 0.5 ? 1 : -1; } }
    }
    const ant = m.p.clone();
    m.p.addScaledVector(m.dir, m.vel * dt);
    let fim = m.vida <= 0 || m.p.y < terreno(m.p.x, m.p.z);
    if (!fim && m.alvo && !m.alvo.flare && distSeg(ant, m.p, m.alvo.pos) < m.alvo.t.raio + 8) {
      ferir(m.alvo, m.dono === jogador ? 70 : 45, m.dono); fim = true;
      explosao(m.p, 14, m.dono === jogador ? COR.missilJ : COR.missilI);
    } else if (!fim && m.alvo && m.alvo.flare && m.p.distanceTo(m.alvo.pos) < 20) fim = true;
    if (fim) {
      if (m.vida <= 0 || m.alvo?.flare) explosao(m.p, 6, 0x888888);
      m.remover(); MISSEIS.splice(i, 1); continue;
    }
    m.obj.position.copy(m.p); m.obj.rotation.y += dt * 9;
    m.rastro.copyWithin(3, 0, (m.n - 1) * 3); m.rastro[0] = m.p.x; m.rastro[1] = m.p.y; m.rastro[2] = m.p.z;
    m.linha.geometry.attributes.position.needsUpdate = true;
  }
}

const FLARES = [];
const flareGeo = new THREE.BufferGeometry();
flareGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(300 * 3), 3));
const flarePts = new THREE.Points(flareGeo, new THREE.PointsMaterial({ color: COR.flare, size: 3, sizeAttenuation: false }));
flarePts.frustumCulled = false; scene.add(flarePts);
function soltarFlares() {
  if (!jogador.vivo || jogador.flares <= 0 || jogador.cdFlare > 0) return;
  jogador.flares--; jogador.cdFlare = 1.2;
  const novos = [];
  for (const s of [-1, 1]) {
    const v = jogador.velVec.multiplyScalar(0.4).addScaledVector(jogador.dir, s * 60).addScaledVector(jogador.cima, -30);
    const f = { flare: true, pos: jogador.pos.clone(), v, vida: 3.5 }; FLARES.push(f); novos.push(f);
  }
  // Cada míssil inimigo perto tem 75% de chance de ir atrás do flare.
  for (const m of MISSEIS) if (m.alvo === jogador && m.p.distanceTo(jogador.pos) < 2500 && Math.random() < 0.75) m.alvo = novos[0];
  SOM.ruido(0.3, 3000, 0.08);
}
function atualizarFlares(dt) {
  const a = flareGeo.attributes.position.array; let n = 0;
  for (let i = FLARES.length - 1; i >= 0; i--) {
    const f = FLARES[i]; f.vida -= dt; f.v.y -= 30 * dt; f.v.multiplyScalar(1 - 0.6 * dt); f.pos.addScaledVector(f.v, dt);
    if (f.vida <= 0) { FLARES.splice(i, 1); continue; }
    if (n < 300) { a.set([f.pos.x, f.pos.y, f.pos.z], n * 3); n++; }
  }
  flareGeo.setDrawRange(0, n); flareGeo.attributes.position.needsUpdate = true;
}

// Explosões: icosaedro de arame crescendo e apagando + faíscas.
const EXPLOSOES = [];
const icoGeo = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1, 1));
function explosao(p, escala, cor) {
  const mat = new THREE.LineBasicMaterial({ color: cor, transparent: true });
  const obj = new THREE.LineSegments(icoGeo, mat); obj.position.copy(p);
  const n = Math.floor(Math.min(60, 12 + escala * 2)), a = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) { a.set([p.x, p.y, p.z], i * 3); v.push(new THREE.Vector3().randomDirection().multiplyScalar(escala * (2 + Math.random() * 4))); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(a, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffe0a0, size: 2, sizeAttenuation: false, transparent: true }));
  pts.frustumCulled = false;
  scene.add(obj, pts);
  EXPLOSOES.push({ obj, pts, v, t: 0, dur: 0.6 + escala * 0.03, escala });
  if (escala > 8) SOM.boom(p, escala / 20);
}
function faisca(p, cor, escala) { explosao(p, escala * 0.4, cor); }
function atualizarExplosoes(dt) {
  for (let i = EXPLOSOES.length - 1; i >= 0; i--) {
    const e = EXPLOSOES[i]; e.t += dt; const k = e.t / e.dur;
    if (k >= 1.6) { scene.remove(e.obj, e.pts); e.obj.material.dispose(); e.pts.geometry.dispose(); EXPLOSOES.splice(i, 1); continue; }
    e.obj.scale.setScalar(e.escala * (0.4 + k * 2.2)); e.obj.material.opacity = Math.max(0, 1 - k); e.obj.rotation.x += dt * 2;
    const a = e.pts.geometry.attributes.position.array;
    e.v.forEach((v, j) => { a[j * 3] += v.x * dt; a[j * 3 + 1] += v.y * dt; a[j * 3 + 2] += v.z * dt; v.y -= 20 * dt; });
    e.pts.geometry.attributes.position.needsUpdate = true; e.pts.material.opacity = Math.max(0, 1 - k / 1.6);
  }
}

function ferir(a, v, de) {
  if (!a.vivo) return;
  if (a === jogador && FLAGS.deus) return;
  a.hp -= v; a.flash = 0.08;
  if (a === jogador) { dano = 0.5; tremor = 0.4; SOM.ruido(0.15, 900, 0.2); }
  jogo.missao?.aoDano?.(jogo.M, a, de);
  if (a.hp <= 0) destruir(a, de);
}
function destruir(a, de) {
  if (!a.vivo) return;
  a.vivo = false; a.remover();
  explosao(a.pos, a.t.raio * 1.4, a.equipe === 'jogador' ? COR.jogador : COR.missilJ);
  if (a === jogador) {
    const solo = de === 'solo';
    concluir(false, solo ? 'Você bateu no chão.' : 'Seu caça foi abatido.');
    return;
  }
  if (de === jogador || de === 'solo') { if (a.equipe === 'hostil') { jogo.M.abates++; aviso(de === 'solo' ? 'INIMIGO CAIU' : 'ABATIDO', CSS.hostil); } }
  jogo.missao?.aoAbate?.(jogo.M, a, de);
}

// ---------------------------------------------------------------------------
// IA. Modos: 'rota' (vai até um ponto), 'formacao' (segue um líder),
// 'caca' (persegue o jogador), 'balanca' (balança as asas: sinal de "entendido").
function ia(a, dt) {
  const I = a.ia, c = a.ctrl;
  let dest = null; let thr = 0;
  if (I.modo === 'rota') {
    dest = I.ponto.clone().sub(a.pos).normalize(); thr = I.thr || 0;
  } else if (I.modo === 'balanca') {
    I.t = (I.t || 0) + dt;
    c.x = Math.sin(I.t * 6) * 0.9; c.y = 0; c.thr = 0; c.assist = true;
    if (I.t > 2.5) { a.ia = I.depois; }
    return;
  } else if (I.modo === 'formacao') {
    const L = I.lider;
    if (!L.vivo) { a.ia = { modo: 'caca' }; return; }
    const slot = I.off.clone().applyQuaternion(L.q).add(L.pos);
    const adiante = slot.clone().addScaledVector(L.fwd, 200);
    dest = adiante.sub(a.pos).normalize();
    const atras = slot.sub(a.pos).dot(L.fwd);
    thr = atras > 25 ? 1 : atras < -25 ? -1 : 0;
  } else if (I.modo === 'caca') {
    const P = jogador;
    if (a.ameaca > 0) {
      // Curva brusca para fugir do míssil.
      a.ameaca -= dt;
      c.x = a.lado; c.y = a.pos.y < terreno(a.pos.x, a.pos.z) + 500 ? 0.8 : 0.3; c.thr = 1; c.assist = true; c.yaw = 0;
      return;
    }
    if (!P.vivo) { dest = a.fwd; dest.y = 0; dest.normalize(); }
    else {
      const rel = P.pos.clone().sub(a.pos), dist = rel.length();
      const mira = P.pos.clone().addScaledVector(P.velVec, Math.min(1.5, dist / 900));
      dest = mira.sub(a.pos).normalize();
      thr = dist > 1200 ? 1 : dist < 350 ? -1 : 0;
      const ang = Math.acos(clamp(a.fwd.dot(rel.divideScalar(dist)), -1, 1));
      // Canhão: rajadas curtas quando o jogador está bem na frente.
      a.cdArma -= dt;
      if (dist < 900 && ang < 0.09 && a.cdArma <= 0) {
        atirar(a, a.pos.clone().addScaledVector(a.fwd, 14), a.fwd.add(new THREE.Vector3().randomDirection().multiplyScalar(0.012)).normalize(), 3);
        a.rajada++; a.cdArma = a.rajada % 6 === 0 ? 1.2 : 0.07;
        if (a.rajada % 3 === 0) SOM.tiro(a.pos);
      }
      // Míssil: trava por 1,5 s com o jogador num cone de 20°.
      a.cdMissil -= dt;
      if (a.misseis > 0 && dist < 2800 && ang < 0.35) a.travaIA += dt; else a.travaIA = Math.max(0, a.travaIA - dt);
      if (a.travaIA > 1.5 && a.cdMissil <= 0 && a.misseis > 0) {
        new Missil(a, P); a.misseis--; a.cdMissil = 9 + Math.random() * 5; a.travaIA = 0;
      }
    }
  }
  // Desvio do terreno e teto, para todos os modos.
  const px = a.pos.x + a.fwd.x * a.vel * 4, pz = a.pos.z + a.fwd.z * a.vel * 4;
  const solo = Math.max(terreno(a.pos.x, a.pos.z), terreno(px, pz));
  if (a.pos.y < solo + 450) { dest.y = Math.max(dest.y, 0.6); dest.normalize(); }
  if (a.pos.y > 6000) { dest.y = Math.min(dest.y, -0.2); dest.normalize(); }
  guiar(a, dest); c.thr = thr;
}

function atualizarAviao(a, dt) {
  if (!a.vivo) return;
  if (a !== jogador) ia(a, dt);
  voar(a, a.ctrl, dt);
  if (a.pos.y < terreno(a.pos.x, a.pos.z) + 2 || bateuPredio(a.pos)) { destruir(a, 'solo'); return; }
  if (a.pos.y > 7500) a.pos.y = 7500;
  a.obj.position.copy(a.pos); a.obj.quaternion.copy(a.q);
  a.flash -= dt;
  a.obj.userData.mat.color.setHex(a.flash > 0 ? 0xffffff : corEquipe(a.equipe));
  a.chama.scale.set(1, 1, (a.ctrl.thr > 0 ? 9 : a.ctrl.thr < 0 ? 2 : 4.5) * (0.8 + Math.random() * 0.4));
  const q = a.queda.geometry.attributes.position.array, gy = terreno(a.pos.x, a.pos.z) + 1;
  q.set([a.pos.x, a.pos.y, a.pos.z, a.pos.x, gy, a.pos.z,
    a.pos.x - 25, gy, a.pos.z, a.pos.x + 25, gy, a.pos.z,
    a.pos.x, gy, a.pos.z - 25, a.pos.x, gy, a.pos.z + 25]);
  a.queda.geometry.attributes.position.needsUpdate = true;
  // Só desenha se o avião está abaixo da câmera (acima dela a linha cruzaria a tela).
  a.queda.visible = cam.modo === 'topo' && a.pos.y < camera.position.y - 60;
}

// ---------------------------------------------------------------------------
// Entrada: teclado + controle (Gamepad API, mapeamento padrão).
const teclas = new Set();
const bloquear = ['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
addEventListener('keydown', e => {
  SOM.init();
  if (jogo.estado === 'voo' && bloquear.includes(e.code)) e.preventDefault();
  if (!e.repeat) aoApertar(e.code);
  teclas.add(e.code);
});
addEventListener('keyup', e => teclas.delete(e.code));
addEventListener('blur', () => teclas.clear());
addEventListener('pointerdown', () => SOM.init());
const tem = (...cs) => cs.some(c => teclas.has(c));

function aoApertar(code) {
  if (jogo.estado === 'voo') {
    if (code === 'Escape' || code === 'KeyP') return pausar();
    if (!jogador?.vivo || jogo.fimEm) return;
    if (code === 'KeyV') trocarCamera(MODOS[(MODOS.indexOf(cam.modo) + 1) % MODOS.length]);
    if (code === 'Digit1') trocarCamera('topo');
    if (code === 'Digit2') trocarCamera('persegue');
    if (code === 'Digit3') trocarCamera('cabine');
    if (code === 'KeyT') { save.assist[cam.modo] = !save.assist[cam.modo]; gravar(); aviso(save.assist[cam.modo] ? 'VOO ASSISTIDO' : 'VOO MANUAL'); }
    if (code === 'Tab') proximoAlvo();
    if (code === 'KeyF' || code === 'KeyK') dispararMissil();
    if (code === 'KeyC') soltarFlares();
  } else if (jogo.estado === 'pausa' && (code === 'Escape' || code === 'KeyP')) continuar();
}

let gpAntes = [];
const gp = { x: 0, y: 0, yaw: 0, thr: 0, arma: false };
function lerControle() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const p = [...pads].find(Boolean);
  gp.x = gp.y = gp.yaw = gp.thr = 0; gp.arma = false;
  if (!p) return;
  const zm = v => Math.abs(v) < 0.15 ? 0 : v;
  gp.x = zm(p.axes[0] || 0); gp.y = -zm(p.axes[1] || 0); gp.yaw = zm(p.axes[2] || 0);
  const b = i => p.buttons[i]?.pressed;
  gp.thr = (p.buttons[7]?.value || 0) - (p.buttons[6]?.value || 0);
  gp.arma = b(0);
  const apertou = i => b(i) && !gpAntes[i];
  if (apertou(9)) aoApertar('Escape');
  if (jogo.estado === 'voo') {
    if (apertou(1)) aoApertar('KeyF');
    if (apertou(2)) aoApertar('KeyC');
    if (apertou(3)) aoApertar('KeyV');
    if (apertou(4) || apertou(5)) aoApertar('Tab');
    if (apertou(8)) aoApertar('KeyT');
  }
  gpAntes = p.buttons.map(x => x.pressed);
}

const entrada = { x: 0, y: 0, yaw: 0 };
function controlesJogador(dt) {
  if (!jogador.vivo) return;
  const inv = save.inverterY ? -1 : 1;
  const alvoX = clamp((tem('KeyD', 'ArrowRight') ? 1 : 0) - (tem('KeyA', 'ArrowLeft') ? 1 : 0) + gp.x, -1, 1);
  const alvoY = clamp(((tem('KeyW', 'ArrowUp') ? 1 : 0) - (tem('KeyS', 'ArrowDown') ? 1 : 0) + gp.y) * inv, -1, 1);
  const alvoYaw = clamp((tem('KeyE') ? 1 : 0) - (tem('KeyQ') ? 1 : 0) + gp.yaw, -1, 1);
  // Teclado é tudo-ou-nada: a rampa deixa o comando suave.
  const k = 1 - Math.exp(-8 * dt);
  entrada.x = lerp(entrada.x, alvoX, k); entrada.y = lerp(entrada.y, alvoY, k); entrada.yaw = lerp(entrada.yaw, alvoYaw, k);
  const c = jogador.ctrl;
  c.x = entrada.x; c.y = entrada.y; c.yaw = entrada.yaw;
  c.thr = tem('ShiftLeft', 'ShiftRight') ? 1 : tem('KeyZ') ? -1 : gp.thr > 0.3 ? 1 : gp.thr < -0.3 ? -1 : 0;
  c.assist = save.assist[cam.modo];
}

function armasJogador(dt) {
  if (!jogador.vivo) return;
  jogador.cdArma -= dt; jogador.cdMissil -= dt; jogador.cdFlare = (jogador.cdFlare || 0) - dt;
  if ((tem('Space', 'KeyJ') || gp.arma) && jogador.cdArma <= 0 && !jogo.fimEm) {
    jogador.cdArma = 1 / 16;
    const lado = (jogador.lado = -jogador.lado) * 1.5;
    const p = jogador.pos.clone().addScaledVector(jogador.fwd, 14).addScaledVector(jogador.dir, lado);
    atirar(jogador, p, jogador.fwd.add(new THREE.Vector3().randomDirection().multiplyScalar(0.004)).normalize(), 6);
    jogo.M.tiros++;
    if (jogo.M.tiros % 2 === 0) SOM.tiro();
  }
}

// Regra de engajamento: só se trava míssil em alvo HOSTIL. Desconhecido e
// civil precisam ser identificados antes (GDD §6).
const podeTravar = a => a && a.vivo && a.equipe === 'hostil';
function proximoAlvo() {
  const lista = AVIOES.filter(a => a !== jogador && a.vivo).sort((a, b) => a.pos.distanceTo(jogador.pos) - b.pos.distanceTo(jogador.pos));
  if (!lista.length) { alvoSel = null; return; }
  const i = lista.indexOf(alvoSel);
  alvoSel = lista[(i + 1) % lista.length]; trava.t = 0; trava.ok = false;
  SOM.bip(700, 0.04, 0.04);
}
function atualizarTrava(dt) {
  if (!alvoSel || !alvoSel.vivo) {
    // Escolhe sozinho o mais perto, dando preferência a hostis.
    const vivos = AVIOES.filter(a => a !== jogador && a.vivo);
    vivos.sort((a, b) => (a.equipe !== 'hostil') - (b.equipe !== 'hostil') || a.pos.distanceTo(jogador.pos) - b.pos.distanceTo(jogador.pos));
    alvoSel = vivos[0] || null; trava.t = 0; trava.ok = false;
  }
  if (!jogador.vivo || !podeTravar(alvoSel)) { trava.t = 0; trava.ok = false; return; }
  const rel = alvoSel.pos.clone().sub(jogador.pos), dist = rel.length();
  const ang = Math.acos(clamp(jogador.fwd.dot(rel.divideScalar(dist)), -1, 1));
  if (dist < 3200 && ang < 25 * D2R) trava.t = Math.min(1, trava.t + dt / 0.9);
  else trava.t = Math.max(0, trava.t - dt * 2);
  const antes = trava.ok; trava.ok = trava.t >= 1;
  if (trava.ok && !antes) SOM.bip(1500, 0.08, 0.05);
}
function dispararMissil() {
  if (!jogador.vivo || jogador.cdMissil > 0) return;
  if (jogador.misseis <= 0) { aviso('SEM MÍSSEIS', CSS.alerta, 1); return; }
  if (alvoSel && alvoSel.vivo && !podeTravar(alvoSel) && alvoSel.pos.distanceTo(jogador.pos) < 4000) {
    aviso('ARMAS RESTRITAS: IDENTIFIQUE', CSS.desconhecido, 1.5); return;
  }
  new Missil(jogador, trava.ok ? alvoSel : null);
  jogador.misseis--; jogador.cdMissil = 0.45;
}

// ---------------------------------------------------------------------------
// Câmera: três perspectivas, com transição suave entre elas.
const MODOS = ['topo', 'persegue', 'cabine'];
const NOME_CAM = { topo: 'DE CIMA', persegue: 'PERSEGUIÇÃO', cabine: 'CABINE' };
const cam = { modo: MODOS.includes(FLAGS.cam) ? FLAGS.cam : (FLAGS.cam === 'caca' ? 'persegue' : save.camera), t: 1, deRel: new THREE.Vector3(), deQ: new THREE.Quaternion(), deFov: 64, upTopo: new THREE.Vector3(0, 0, -1), qPers: new THREE.Quaternion() };
const FOV = { topo: 50, persegue: 64, cabine: 72 };
const pose = { pos: new THREE.Vector3(), q: new THREE.Quaternion(), fov: 64 };
const _m = new THREE.Matrix4();
function trocarCamera(modo) {
  if (modo === cam.modo) return;
  // Guarda a pose atual relativa ao avião: a transição anda junto com ele.
  cam.deRel.copy(camera.position).sub(jogador.pos); cam.deQ.copy(camera.quaternion); cam.deFov = camera.fov;
  cam.modo = modo; cam.t = 0;
  save.camera = modo; gravar();
  if (modo === 'persegue') cam.qPers.copy(jogador.q);
  aviso(`CÂMERA: ${NOME_CAM[modo]}`, CSS.hud, 1.2);
  SOM.bip(500, 0.05, 0.04);
}
function calcularPose(modo, dt) {
  const p = jogador.pos;
  if (modo === 'topo') {
    const fH = jogador.fwd; fH.y = 0;
    if (fH.lengthSq() > 1e-4) { fH.normalize(); cam.upTopo.lerp(fH, 1 - Math.exp(-3 * dt)).normalize(); }
    const alvo = p.clone().addScaledVector(cam.upTopo, 140);
    pose.pos.copy(alvo).y += 520;
    _m.lookAt(pose.pos, alvo, cam.upTopo); pose.q.setFromRotationMatrix(_m);
  } else if (modo === 'persegue') {
    // Atrás e acima; a rotação segue a do avião com atraso (sente a curva).
    cam.qPers.slerp(jogador.q, 1 - Math.exp(-6 * dt));
    pose.q.copy(cam.qPers);
    pose.pos.set(0, 11, 62).applyQuaternion(cam.qPers).add(p);
  } else {
    pose.q.copy(jogador.q);
    pose.pos.set(...jogador.t.cabine).applyQuaternion(jogador.q).add(p);
  }
  pose.fov = FOV[modo];
}
function atualizarCamera(dt) {
  if (!jogador.vivo) return; // fica olhando a explosão
  calcularPose(cam.modo, dt);
  if (cam.t < 1) {
    cam.t = Math.min(1, cam.t + dt / 0.6);
    const e = suave(cam.t);
    camera.position.copy(cam.deRel).add(jogador.pos).lerp(pose.pos, e);
    camera.quaternion.slerpQuaternions(cam.deQ, pose.q, e);
    camera.fov = lerp(cam.deFov, pose.fov, e);
  } else {
    camera.position.copy(pose.pos); camera.quaternion.copy(pose.q); camera.fov = pose.fov;
  }
  if (tremor > 0) { tremor -= dt; camera.position.add(new THREE.Vector3().randomDirection().multiplyScalar(tremor * 1.5)); }
  camera.updateProjectionMatrix();
  // Na cabine o próprio avião some (a câmera está dentro dele) e aparece o painel.
  const dentro = cam.modo === 'cabine' && cam.t > 0.5;
  jogador.obj.visible = !dentro;
  painel.visible = cam.modo === 'cabine' && cam.t > 0.7;
  // Neblina acompanha a altura na câmera de cima (o chão fica longe).
  const extra = cam.modo === 'topo' ? Math.max(0, camera.position.y - 1000) : 0;
  scene.fog.near = 3000 + extra; scene.fog.far = 17000 + extra;
}

// Painel da cabine: arame do canopi e do painel, preso à câmera.
const painel = new THREE.Group();
{
  const mat = new THREE.LineBasicMaterial({ color: 0x1fb8c8, fog: false });
  const linhas = (pts) => { const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))); return new THREE.LineSegments(geo, mat); };
  // Canopi: dois montantes e o arco de cima.
  const arco = [];
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * i / 12; arco.push([Math.cos(a) * 1.05, -0.45 + Math.sin(a) * 1.25, -1.25 - Math.sin(a) * 0.2]);
  }
  const segs = [];
  for (let i = 0; i < arco.length - 1; i++) segs.push(arco[i], arco[i + 1]);
  segs.push([-1.05, -0.45, -1.25], [-1.6, -0.45, -0.6], [1.05, -0.45, -1.25], [1.6, -0.45, -0.6]);
  segs.push([-1.05, -0.45, -1.25], [-1.8, 0.9, -0.5], [1.05, -0.45, -1.25], [1.8, 0.9, -0.5]);
  painel.add(linhas(segs));
  // Painel: caixa escura (esconde o chão) com três telas.
  const caixa = new THREE.BoxGeometry(2.4, 0.6, 0.6); caixa.translate(0, -0.78, -1.15);
  const pn = neon(caixa, 0x1fb8c8, 20); pn.children[1].material.fog = false; painel.add(pn);
  const telas = [];
  for (const x of [-0.6, 0, 0.6]) {
    const w = 0.22, y = -0.62, z = -0.84;
    telas.push([x - w, y, z], [x + w, y, z], [x + w, y, z], [x + w, y - 0.22, z], [x + w, y - 0.22, z], [x - w, y - 0.22, z], [x - w, y - 0.22, z], [x - w, y, z]);
  }
  painel.add(linhas(telas));
  painel.visible = false;
  camera.add(painel);
}

// ---------------------------------------------------------------------------
// Anéis (missão de reconhecimento)
function criarAnel(p, olharPara) {
  const grupo = new THREE.Group();
  const mat = new THREE.LineBasicMaterial({ color: COR.anel });
  for (const r of [50, 42]) {
    const pts = []; for (let i = 0; i <= 32; i++) { const a = i / 32 * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0)); }
    grupo.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
  }
  grupo.position.copy(p); grupo.lookAt(olharPara);
  grupo.userData.mat = mat;
  scene.add(grupo); OBJS.push(grupo);
  return grupo;
}

// ---------------------------------------------------------------------------
// Identificação visual (GDD §6): de perto (< 700 m), com o alvo no centro da
// tela, e só nas câmeras de perseguição e cabine. Cabine identifica mais rápido.
const _cf = new THREE.Vector3();
function noCentro(a) {
  camera.getWorldDirection(_cf);
  if (_cf.dot(a.pos.clone().sub(camera.position)) <= 0) return false;
  const n = a.pos.clone().project(camera);
  return Math.abs(n.x) < 0.5 && Math.abs(n.y) < 0.5;
}
function identificar(a, dt) {
  const d = a.pos.distanceTo(jogador.pos);
  if (d < 700 && cam.modo === 'topo') jogo.M.dica = 'De cima não dá para ver o avião. Troque para perseguição ou cabine (V) para identificar.';
  else if (d < 700 && !noCentro(a)) jogo.M.dica = 'Ponha o contato no centro da tela para identificar.';
  else if (d >= 700) jogo.M.dica = `Chegue a menos de 700 m do contato (está a ${(d / 1000).toFixed(1)} km).`;
  else jogo.M.dica = cam.modo === 'cabine' ? 'Identificando...' : 'Identificando... (na cabine é mais rápido)';
  if (cam.modo !== 'topo' && d < 700 && noCentro(a)) a.id += dt / (cam.modo === 'cabine' ? 2 : 3.5);
  else a.id = Math.max(0, a.id - dt * 0.15);
  return a.id >= 1;
}

// ---------------------------------------------------------------------------
// Missões. Cada uma: nome, briefing, inicio(M), passo(M, dt), objetivo(M)
// → { texto, barra? }, e ganchos opcionais aoDano/aoAbate.
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const MISSOES = [
  {
    nome: 'Voo de reconhecimento',
    briefing: 'Primeiro voo na região. Passe pelos 7 anéis verdes: por cima da cidade, por um cânion entre montanhas e de volta. Troque de câmera quando quiser com V: de cima, perseguição ou cabine.',
    inicio(M) {
      jogador.misseis = 0;
      M.aneis = ANEIS.map((p, i) => criarAnel(V(...p), V(...(ANEIS[i + 1] || ANEIS[i - 1]))));
      M.i = 0;
      radio('Interceptor, siga os anéis. Use W/S para subir e descer e A/D para virar.');
    },
    passo(M) {
      M.aneis.forEach((a, i) => a.userData.mat.color.setHex(i === M.i ? COR.anel : i < M.i ? 0x1a3320 : 0x2c6a35));
      const a = M.aneis[M.i];
      if (a && jogador.pos.distanceTo(a.position) < 55) {
        M.i++; SOM.bip(1200, 0.1, 0.06); aviso(`ANEL ${M.i}/${M.aneis.length}`, CSS.anel, 1);
        if (M.i === 1) radio('Bom. Aperte V para trocar a câmera: de cima, perseguição e cabine.');
        if (M.i === 2) radio('O próximo é baixo, no cânion. Z freia, Shift acelera.');
        if (M.i === 4) radio('T liga e desliga o voo assistido. Na cabine o padrão é manual: A/D gira o avião.');
        if (M.i === M.aneis.length) concluir(true, 'Reconhecimento completo.');
      }
    },
    objetivo(M) { return { texto: `Passe pelos anéis ${M.i}/${M.aneis.length}` }; },
    marcas(M) { const a = M.aneis[M.i]; return a ? [{ pos: a.position, cor: CSS.anel, rotulo: 'ANEL' }] : []; },
  },
  {
    nome: 'Contato desconhecido',
    briefing: 'Um avião entrou no espaço aéreo sem plano de voo e não responde ao rádio. Intercepte, identifique de perto e, se for civil, voe ao lado dele para sinalizar que siga você. Não abra fogo sem identificar.',
    inicio(M) {
      jogador.misseis = 8;
      M.civil = new Aviao('civil', 'desconhecido', V(-7000, 3000, -8000), 90, { ia: { modo: 'rota', ponto: V(30000, 3000, -8000) } });
      M.fase = 'interceptar'; M.sinal = 0;
      radio('Contato desconhecido a noroeste, 3 000 m de altitude. Intercepte.');
    },
    passo(M, dt) {
      const c = M.civil; if (!c.vivo) return;
      const d = c.pos.distanceTo(jogador.pos);
      if (M.fase === 'interceptar' && d < 1500) { M.fase = 'identificar'; radio('Contato à vista. Identifique visualmente.'); }
      if (M.fase === 'identificar' && identificar(c, dt)) {
        M.fase = 'sinalizar'; c.setEquipe('civil'); aviso('IDENTIFICADO: CIVIL', CSS.civil, 2.5); M.dica = '';
        radio('É um avião de passageiros, voo 2207, rádio mudo. Voe ao lado dele para sinalizar.');
      }
      if (M.fase === 'sinalizar') {
        // Ao lado: 25 a 180 m para a direita ou esquerda, quase na mesma altura e linha.
        const rel = jogador.pos.clone().sub(c.pos).applyQuaternion(c.q.clone().invert());
        const ok = Math.abs(rel.x) > 25 && Math.abs(rel.x) < 180 && Math.abs(rel.z) < 130 && Math.abs(rel.y) < 70 && Math.abs(jogador.vel - c.vel) < 60;
        M.sinal = ok ? M.sinal + dt / 4 : Math.max(0, M.sinal - dt * 0.3);
        const dv = jogador.vel - c.vel;
        M.dica = ok ? 'Mantenha a posição...'
          : rel.z < -130 ? 'Você passou à frente dele: freie (Z).'
          : rel.z > 130 ? 'Você está atrás dele: acelere (Shift).'
          : dv > 60 ? 'Rápido demais: freie (Z).' : dv < -60 ? 'Devagar demais: acelere (Shift).'
          : 'Fique ao lado dele, na mesma altura.';
        if (M.sinal >= 1) {
          M.fase = 'escoltar'; M.t2 = 0; M.dica = '';
          c.ia = { modo: 'balanca', depois: { modo: 'rota', ponto: V(0, 1800, 0) } };
          radio('Ele balançou as asas: entendeu. Está voltando para a base.', 'PILOTO');
        }
      }
      if (M.fase === 'escoltar') { M.t2 += dt; if (M.t2 > 6) concluir(true, 'O voo 2207 está a caminho do aeroporto.'); }
      if (M.fase !== 'escoltar' && c.pos.x > 15500) concluir(false, 'O contato saiu do espaço aéreo sem ser identificado.');
    },
    aoDano(M, a, de) { if (a === M.civil && de === jogador) concluir(false, 'Você atirou num avião de passageiros.'); },
    objetivo(M) {
      if (M.fase === 'interceptar') return { texto: 'Intercepte o contato desconhecido' };
      if (M.fase === 'identificar') return { texto: 'Identifique o contato', barra: { rotulo: 'ID', v: M.civil.id } };
      if (M.fase === 'sinalizar') return { texto: 'Voe ao lado do avião civil', barra: { rotulo: 'SINAL', v: M.sinal } };
      return { texto: 'Escolte o voo 2207' };
    },
  },
  {
    nome: 'Bombardeiro',
    briefing: 'Um contato grande vem de nordeste direto para a cidade, com dois aviões colados nele. Identifique antes de atirar. Se for hostil, derrube o bombardeiro antes que ele chegue à cidade.',
    inicio(M) {
      jogador.misseis = 16; jogador.q.setFromAxisAngle(UP, -45 * D2R);
      M.bomb = new Aviao('bombardeiro', 'desconhecido', V(10000, 2600, -10000), 225, { ia: { modo: 'rota', ponto: V(0, 2600, 0) } });
      const off = [V(-90, 10, 70), V(90, 10, 70)];
      M.esc = off.map(o => new Aviao('caca', 'desconhecido', o.clone().applyQuaternion(M.bomb.q).add(M.bomb.pos), 225, { misseis: 2, ia: { modo: 'formacao', lider: M.bomb, off: o } }));
      M.fase = 'identificar';
      radio('Contato grande a nordeste, rumo à cidade. Intercepte e identifique.');
    },
    passo(M, dt) {
      const b = M.bomb;
      if (M.fase === 'identificar' && b.vivo && identificar(b, dt)) M.fase = 'revelar';
      if (M.fase === 'revelar') {
        M.fase = 'derrubar'; M.dica = '';
        b.setEquipe('hostil'); M.esc.forEach(e => { if (e.vivo) { e.setEquipe('hostil'); e.ia = { modo: 'caca' }; } });
        aviso('HOSTIL: BOMBARDEIRO', CSS.hostil, 2.5);
        radio('Bombardeiro armado! Armas liberadas. Derrube antes da cidade.');
        alvoSel = b;
      }
      if (b.vivo && Math.hypot(b.pos.x, b.pos.z) < 900) {
        for (let i = 0; i < 6; i++) explosao(V((Math.random() - 0.5) * 900, 50, (Math.random() - 0.5) * 900), 40, COR.missilI);
        b.ia = { modo: 'rota', ponto: V(-20000, 2600, 20000) };
        concluir(false, 'O bombardeiro atingiu a cidade.');
      }
    },
    aoAbate(M, a) { if (a === M.bomb) concluir(true, 'Bombardeiro derrubado longe da cidade.'); },
    objetivo(M) {
      const dist = M.bomb.vivo ? (Math.hypot(M.bomb.pos.x, M.bomb.pos.z) / 1000).toFixed(1) : '0';
      if (M.fase === 'identificar') return { texto: `Identifique o contato · cidade a ${dist} km dele`, barra: { rotulo: 'ID', v: M.bomb.id } };
      return { texto: `Derrube o bombardeiro · cidade a ${dist} km dele` };
    },
    marcas() { return [{ pos: V(0, 200, 0), cor: CSS.jogador, rotulo: 'CIDADE' }]; },
  },
  {
    nome: 'Batalha aérea',
    briefing: 'Caças inimigos em duas ondas: três pelo norte, depois quatro pelo leste. Eles têm mísseis: quando o alarme tocar, faça uma curva fechada e solte flares (C).',
    inicio(M) {
      jogador.misseis = 24; jogador.flares = 40;
      M.onda = 1; M.inimigos = [];
      const v = x => M.inimigos.push(x);
      for (const x of [-1500, 0, 1500]) v(new Aviao('caca', 'hostil', V(x, 2500, -7000), 180, { misseis: 2, ia: { modo: 'caca' } }));
      radio('Três caças hostis ao norte. Armas liberadas.');
    },
    passo(M) {
      if (M.inimigos.every(a => !a.vivo)) {
        if (M.onda === 1) {
          M.onda = 2;
          const p = jogador.pos;
          for (const z of [-1800, -600, 600, 1800]) M.inimigos.push(new Aviao('caca', 'hostil', V(p.x + 8000, 3000, p.z + z), 270, { misseis: 2, ia: { modo: 'caca' } }));
          radio('Segunda onda: quatro caças a leste!');
        } else concluir(true, 'Céu limpo.');
      }
    },
    objetivo(M) { const n = M.inimigos.filter(a => a.vivo).length; return { texto: `Onda ${M.onda}/2 · inimigos restantes: ${n}` }; },
  },
];

// ---------------------------------------------------------------------------
// Fluxo: menu → briefing → voo → fim.
const $ = id => document.getElementById(id);
const telas = ['menu', 'briefing', 'pausa', 'fim'];
function mostrar(t) { telas.forEach(x => $(x).classList.toggle('oculto', x !== t)); }
function montarMenu() {
  const lista = $('lista'); lista.innerHTML = '';
  MISSOES.forEach((m, i) => {
    const b = document.createElement('button');
    const livre = i < save.liberadas || FLAGS.tudo;
    const rec = save.recordes[i];
    b.innerHTML = `<span>${i + 1}. ${m.nome}</span><small>${livre ? (rec ? `${rec.toFixed(1)} s` : '') : 'bloqueada'}</small>`;
    b.disabled = !livre;
    b.onclick = () => abrirBriefing(i);
    lista.appendChild(b);
  });
  $('btnInv').textContent = `Inverter subir/descer: ${save.inverterY ? 'sim' : 'não'}`;
}
$('btnInv').onclick = () => { save.inverterY = !save.inverterY; gravar(); montarMenu(); };
function abrirBriefing(i) {
  jogo.idx = i; $('bTitulo').textContent = `${i + 1}. ${MISSOES[i].nome}`; $('bTexto').textContent = MISSOES[i].briefing;
  mostrar('briefing'); $('bIniciar').focus();
}
$('bIniciar').onclick = () => iniciarMissao(jogo.idx);
$('bVoltar').onclick = () => { mostrar('menu'); };
$('pContinuar').onclick = () => continuar();
$('pReiniciar').onclick = () => iniciarMissao(jogo.idx);
$('pMenu').onclick = () => irMenu();

function limparMundo() {
  for (const a of AVIOES) a.remover(); AVIOES.length = 0;
  for (const m of MISSEIS) m.remover(); MISSEIS.length = 0;
  BALAS.length = 0; FLARES.length = 0;
  for (const e of EXPLOSOES) scene.remove(e.obj, e.pts); EXPLOSOES.length = 0;
  for (const o of OBJS) scene.remove(o); OBJS.length = 0;
  alvoSel = null; trava.t = 0; trava.ok = false; radioFila = []; centro.t = 0; dano = 0;
}
function iniciarMissao(i) {
  SOM.init();
  limparMundo();
  jogo.idx = i; jogo.missao = MISSOES[i]; jogo.fimEm = 0; jogo.resultado = null;
  jogo.M = { t: 0, abates: 0, tiros: 0, acertos: 0, dica: '' };
  jogador = new Aviao('jogador', 'jogador', V(0, 1400, 3200), 0);
  jogador.flares = 30; jogador.cdFlare = 0;
  jogo.missao.inicio(jogo.M);
  jogo.estado = 'voo'; mostrar(null);
  cam.t = 1; cam.qPers.copy(jogador.q); cam.upTopo.set(0, 0, -1).applyQuaternion(jogador.q);
  calcularPose(cam.modo, 0.016); camera.position.copy(pose.pos); camera.quaternion.copy(pose.q);
  aviso(jogo.missao.nome.toUpperCase(), CSS.hud, 2.5);
}
function concluir(ok, motivo) {
  if (jogo.fimEm) return;
  jogo.fimEm = ok ? 2 : 2.5; jogo.resultado = { ok, motivo, tempo: jogo.M.t };
  aviso(ok ? 'MISSÃO CUMPRIDA' : 'MISSÃO FALHOU', ok ? CSS.civil : CSS.alerta, 3);
  if (ok) {
    save.liberadas = Math.max(save.liberadas, jogo.idx + 2);
    const r = save.recordes[jogo.idx]; if (!r || jogo.M.t < r) save.recordes[jogo.idx] = jogo.M.t;
    gravar();
  }
}
function mostrarFim() {
  jogo.estado = 'fim';
  const r = jogo.resultado, M = jogo.M;
  $('fTitulo').textContent = r.ok ? 'MISSÃO CUMPRIDA' : 'MISSÃO FALHOU';
  $('fTitulo').style.color = r.ok ? 'var(--verde)' : '#ff3b5c';
  const prec = M.tiros ? Math.round(M.acertos / M.tiros * 100) : 0;
  $('fTexto').textContent = `${r.motivo}\n\nTempo: ${r.tempo.toFixed(1)} s · Abates: ${M.abates} · Pontaria do canhão: ${prec}%`;
  const bs = $('fBotoes'); bs.innerHTML = '';
  const botao = (t, f) => { const b = document.createElement('button'); b.textContent = t; b.onclick = f; bs.appendChild(b); return b; };
  let primeiro;
  if (r.ok && jogo.idx + 1 < MISSOES.length) primeiro = botao('Próxima missão', () => abrirBriefing(jogo.idx + 1));
  const rep = botao('Repetir', () => iniciarMissao(jogo.idx)); primeiro = primeiro || rep;
  botao('Menu', irMenu);
  mostrar('fim'); primeiro.focus();
}
function pausar() { jogo.estado = 'pausa'; mostrar('pausa'); $('pContinuar').focus(); SOM.motor(false); }
function continuar() { jogo.estado = 'voo'; mostrar(null); }
function irMenu() { limparMundo(); jogador = null; jogo.estado = 'menu'; montarMenu(); mostrar('menu'); }

// Área de operação: ±16 km. Fora dela, 10 s para voltar.
function limites(dt) {
  const fora = Math.abs(jogador.pos.x) > 16000 || Math.abs(jogador.pos.z) > 16000;
  jogo.M.fora = fora ? (jogo.M.fora || 10) - dt : 0;
  if (fora && jogo.M.fora <= 0) concluir(false, 'Você abandonou a área de operação.');
}

// ---------------------------------------------------------------------------
// HUD (canvas 2D em baixa resolução, fonte de 8 px).
const FONTE = '8px "Press Start 2P", monospace';
document.fonts?.load(FONTE).catch(() => {});
// A fonte não tem algumas maiúsculas acentuadas: tira o acento só delas.
const semAcento = s => s.replace(/[ÁÀÂÃÉÊÍÓÔÕÚ]/g, c => c.normalize('NFD')[0]);
function txt(s, x, y, cor = CSS.hud, al = 'left') { s = semAcento(s); g.fillStyle = cor; g.textAlign = al; g.fillText(s, Math.round(x), Math.round(y)); }
function quebrar(s, larg) {
  const palavras = s.split(' '), linhas = []; let l = '';
  for (const p of palavras) { const t = l ? l + ' ' + p : p; if (g.measureText(t).width > larg && l) { linhas.push(l); l = p; } else l = t; }
  if (l) linhas.push(l); return linhas;
}
const _pv = new THREE.Vector3();
function projetar(v) {
  camera.getWorldDirection(_cf);
  const frente = _cf.dot(_pv.copy(v).sub(camera.position)) > 0;
  _pv.copy(v).project(camera);
  let nx = _pv.x, ny = _pv.y;
  if (!frente) { nx = -nx; ny = -ny; }
  return { x: (nx + 1) / 2 * W, y: (1 - ny) / 2 * H, frente, nx, ny };
}
function caixa(x, y, r, cor) { g.strokeStyle = cor; g.strokeRect(Math.round(x - r) + 0.5, Math.round(y - r) + 0.5, r * 2, r * 2); }
function seta(x, y, ang, cor) {
  g.fillStyle = cor; g.beginPath();
  g.moveTo(x + Math.cos(ang) * 7, y + Math.sin(ang) * 7);
  g.lineTo(x + Math.cos(ang + 2.5) * 6, y + Math.sin(ang + 2.5) * 6);
  g.lineTo(x + Math.cos(ang - 2.5) * 6, y + Math.sin(ang - 2.5) * 6);
  g.fill();
}
const corDe = a => CSS[a.equipe] || CSS.hud;
const nomeDe = a => a.equipe === 'hostil' ? (a.tipo === 'bombardeiro' ? 'BOMB' : 'HOSTIL') : a.equipe === 'civil' ? 'CIVIL' : 'DESC';
function marcaFora(p, cor, rotulo) {
  // Seta na borda da tela apontando para algo fora dela.
  let ang = Math.atan2(-(p.ny), p.nx);
  if (!p.frente && Math.abs(p.nx) < 0.01 && Math.abs(p.ny) < 0.01) ang = Math.PI / 2;
  const mx = W / 2 - 16, my = H / 2 - 16;
  const k = Math.min(mx / Math.abs(Math.cos(ang) || 1e-6), my / Math.abs(Math.sin(ang) || 1e-6));
  const x = W / 2 + Math.cos(ang) * k, y = H / 2 + Math.sin(ang) * k;
  seta(x, y, ang, cor);
  if (rotulo) txt(rotulo, x - Math.cos(ang) * 14, y - Math.sin(ang) * 14 - 4, cor, 'center');
}

function desenharHUD(dt) {
  g.clearRect(0, 0, W, H);
  g.font = FONTE; g.textBaseline = 'top'; g.lineWidth = 1;
  if (jogo.estado === 'menu' || !jogador) return;
  const M = jogo.M, P = jogador;
  const f = P.fwd;

  // Escada de arfagem (só na cabine): linhas a cada 10°, projetadas no mundo,
  // então giram sozinhas com a rolagem do avião.
  if (cam.modo === 'cabine' && P.vivo) {
    const hd = rumoDe(f);
    for (let a = -60; a <= 60; a += 10) {
      const ar = a * D2R;
      const pts = [-1, 1].map(s => { const az = hd + s * (a === 0 ? 0.16 : 0.07); return projetar(camera.position.clone().add(V(Math.sin(az) * Math.cos(ar), Math.sin(ar), -Math.cos(az) * Math.cos(ar)).multiplyScalar(1000))); });
      if (!pts[0].frente || !pts[1].frente) continue;
      const [p0, p1] = pts;
      if (Math.min(p0.y, p1.y) < -20 || Math.max(p0.y, p1.y) > H + 20) continue;
      g.strokeStyle = a === 0 ? CSS.civil : 'rgba(109,255,122,0.7)';
      g.setLineDash(a < 0 ? [3, 3] : []);
      g.beginPath();
      const mx = lerp(p0.x, p1.x, 0.35), my = lerp(p0.y, p1.y, 0.35), nx = lerp(p0.x, p1.x, 0.65), ny = lerp(p0.y, p1.y, 0.65);
      g.moveTo(p0.x, p0.y); g.lineTo(mx, my); g.moveTo(nx, ny); g.lineTo(p1.x, p1.y); g.stroke();
      g.setLineDash([]);
      if (a !== 0) txt(String(Math.abs(a)), p1.x + 4, p1.y - 4, 'rgba(109,255,122,0.8)');
    }
  }

  // Retícula do canhão: 600 m à frente do nariz.
  if (P.vivo) {
    const r = projetar(P.pos.clone().addScaledVector(f, 600));
    if (r.frente) { g.strokeStyle = CSS.hud; g.beginPath(); g.arc(Math.round(r.x) + 0.5, Math.round(r.y) + 0.5, 6, 0, Math.PI * 2); g.moveTo(r.x - 10, r.y); g.lineTo(r.x - 3, r.y); g.moveTo(r.x + 3, r.y); g.lineTo(r.x + 10, r.y); g.stroke(); }
  }

  // Marcadores dos aviões.
  for (const a of AVIOES) {
    if (a === P || !a.vivo) continue;
    const p = projetar(a.pos), cor = corDe(a), sel = a === alvoSel;
    const dist = a.pos.distanceTo(P.pos);
    const naTela = p.frente && p.x > 0 && p.x < W && p.y > 0 && p.y < H;
    if (naTela) {
      caixa(p.x, p.y, sel ? 9 : 5, cor);
      if (sel) {
        txt(nomeDe(a), p.x, p.y + 12, cor, 'center');
        txt(`${(dist / 1000).toFixed(1)}km`, p.x, p.y + 22, cor, 'center');
        if (cam.modo === 'topo') { const dz = a.pos.y - P.pos.y; txt(`${dz >= 0 ? '+' : '-'}${Math.abs(Math.round(dz))}`, p.x + 12, p.y - 4, cor); }
        if (a.equipe === 'desconhecido' && a.id > 0) { g.fillStyle = cor; g.fillRect(Math.round(p.x - 10), Math.round(p.y - 14), Math.round(20 * Math.min(1, a.id)), 2); }
      }
    } else if (sel) marcaFora(p, cor, nomeDe(a));
  }
  // Marcas da missão (anel, cidade...).
  for (const m of jogo.missao.marcas?.(M) || []) {
    const p = projetar(m.pos);
    if (p.frente && p.x > 0 && p.x < W && p.y > 0 && p.y < H) {
      g.strokeStyle = m.cor; g.beginPath(); g.moveTo(p.x, p.y - 7); g.lineTo(p.x + 7, p.y); g.lineTo(p.x, p.y + 7); g.lineTo(p.x - 7, p.y); g.closePath(); g.stroke();
      txt(`${m.rotulo} ${(m.pos.distanceTo(P.pos) / 1000).toFixed(1)}km`, p.x, p.y + 10, m.cor, 'center');
    } else marcaFora(p, m.cor, m.rotulo);
  }

  // Trava de míssil: o círculo anda do nariz até o alvo.
  if (P.vivo && podeTravar(alvoSel) && trava.t > 0) {
    const pa = projetar(alvoSel.pos), pn = projetar(P.pos.clone().addScaledVector(f, 600));
    if (pa.frente) {
      const x = lerp(pn.x, pa.x, trava.t), y = lerp(pn.y, pa.y, trava.t);
      g.strokeStyle = trava.ok ? CSS.alerta : CSS.desconhecido;
      g.beginPath(); g.arc(Math.round(x) + 0.5, Math.round(y) + 0.5, trava.ok ? 12 : 16 - trava.t * 4, 0, Math.PI * 2); g.stroke();
      if (trava.ok) txt('TRAVADO', x, y + 16, CSS.alerta, 'center');
    }
  }

  // Velocidade, altitude, rumo.
  const kmh = Math.round(P.vel * 3.6), alt = Math.round(P.pos.y);
  const bx = Math.round(W * 0.2), by = Math.round(H / 2 - 6);
  g.strokeStyle = CSS.hud;
  g.strokeRect(bx - 34.5, by - 3.5, 52, 15); txt(`${kmh}`, bx + 14, by + 1, CSS.hud, 'right'); txt('KM/H', bx - 30, by + 16, CSS.fraco);
  const ax = Math.round(W * 0.8);
  g.strokeRect(ax - 17.5, by - 3.5, 52, 15); txt(`${alt}`, ax + 30, by + 1, CSS.hud, 'right'); txt('ALT M', ax - 14, by + 16, CSS.fraco);
  const solo = P.pos.y - terreno(P.pos.x, P.pos.z);
  if (P.vivo && solo < 250 && f.y < -0.05 && Math.floor(performance.now() / 250) % 2) txt('SUBA! SUBA!', W / 2, H * 0.62, CSS.alerta, 'center');
  const rumo = ((Math.round(rumoDe(f) / D2R) % 360) + 360) % 360;
  txt(String(rumo).padStart(3, '0'), W / 2, 6, CSS.hud, 'center');
  g.strokeStyle = CSS.fraco; g.beginPath();
  for (let d = -30; d <= 30; d += 10) { const x = Math.round(W / 2 + (d - (((rumoDe(f) / D2R) % 10) + 10) % 10) * 2) + 0.5; g.moveTo(x, 16); g.lineTo(x, 19); }
  g.stroke();

  // Objetivo e dica.
  const ob = jogo.missao.objetivo(M);
  txt(ob.texto, 8, 26, CSS.desconhecido);
  let oy = 36;
  if (ob.barra) {
    txt(ob.barra.rotulo, 8, oy, CSS.desconhecido);
    g.strokeStyle = CSS.desconhecido; g.strokeRect(48.5, oy - 0.5, 80, 8);
    g.fillStyle = CSS.desconhecido; g.fillRect(50, oy + 1, Math.round(77 * clamp(ob.barra.v, 0, 1)), 5);
    oy += 12;
  }
  if (M.dica) quebrar(M.dica, Math.min(W * 0.45, 300)).forEach((l, i) => txt(l, 8, oy + i * 10, '#9fb8d0'));
  if (M.fora > 0) txt(`VOLTE À ÁREA DE OPERAÇÃO: ${Math.ceil(M.fora)}`, W / 2, H * 0.3, CSS.alerta, 'center');
  txt(`${Math.floor(M.t / 60)}:${String(Math.floor(M.t % 60)).padStart(2, '0')}`, W - 8, 26, CSS.hud, 'right');

  // Estado do avião, câmera e armas (canto inferior esquerdo).
  const ly = H - 46;
  txt('CASCO', 8, ly, CSS.hud);
  g.strokeStyle = CSS.hud; g.strokeRect(56.5, ly - 0.5, 62, 8);
  g.fillStyle = P.hp > 35 ? CSS.civil : CSS.alerta; g.fillRect(58, ly + 1, Math.round(59 * Math.max(0, P.hp) / P.t.hp), 5);
  txt(`MSL ${P.misseis}  FLR ${P.flares}`, 8, ly + 12, CSS.hud);
  txt(`${NOME_CAM[cam.modo]} [V] · ${save.assist[cam.modo] ? 'ASSIST' : 'MANUAL'} [T]`, 8, ly + 24, CSS.fraco);

  // Radar (canto inferior direito): a frente do avião é para cima.
  const R = 34, cx = W - R - 8, cy = H - R - 8, alc = 6000;
  g.fillStyle = 'rgba(5,3,12,0.6)'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = CSS.fraco; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.arc(cx, cy, R / 2, 0, Math.PI * 2); g.stroke();
  const h = rumoDe(f), fH = V(Math.sin(h), 0, -Math.cos(h)), rH = V(Math.cos(h), 0, Math.sin(h));
  const blip = (pos, cor, tam = 2) => {
    const rel = pos.clone().sub(P.pos); let x = rel.dot(rH) / alc * R, y = -rel.dot(fH) / alc * R;
    const d = Math.hypot(x, y); if (d > R - 2) { x *= (R - 2) / d; y *= (R - 2) / d; }
    g.fillStyle = cor; g.fillRect(Math.round(cx + x - tam / 2), Math.round(cy + y - tam / 2), tam, tam);
  };
  blip(V(0, 0, 0), CSS.jogador, 3);
  for (const m of jogo.missao.marcas?.(M) || []) blip(m.pos, m.cor, 3);
  for (const a of AVIOES) if (a !== P && a.vivo) blip(a.pos, corDe(a), a === alvoSel ? 4 : 2);
  for (const m of MISSEIS) if (m.alvo === P) blip(m.p, CSS.alerta, 2);
  g.fillStyle = CSS.hud; g.fillRect(cx - 1, cy - 2, 2, 4);

  // Alarme de míssil.
  const ameaca = MISSEIS.some(m => m.alvo === P);
  const travado = AVIOES.some(a => a.vivo && a.travaIA > 0.4);
  if (ameaca && Math.floor(performance.now() / 200) % 2) txt('MÍSSIL! SOLTE FLARES [C]', W / 2, H * 0.24, CSS.alerta, 'center');
  else if (travado && !ameaca) txt('ALERTA: TRAVA INIMIGA', W / 2, H * 0.24, CSS.desconhecido, 'center');

  // Aviso no centro e rádio.
  if (centro.t > 0) { centro.t -= dt; txt(centro.texto, W / 2, H * 0.34, centro.cor, 'center'); }
  let ry = H - 62;
  for (let i = radioFila.length - 1; i >= 0; i--) {
    const r = radioFila[i]; r.t -= dt;
    if (r.t <= 0) { radioFila.splice(i, 1); continue; }
    const linhas = quebrar(r.texto, Math.min(W * 0.5, 340));
    for (let j = linhas.length - 1; j >= 0; j--) { txt(linhas[j], W / 2, ry, '#d8f8ff', 'center'); ry -= 10; }
    ry -= 2;
  }
  // Dano: borda vermelha.
  if (dano > 0) { dano -= dt; g.strokeStyle = `rgba(255,59,92,${dano * 1.6})`; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4); g.lineWidth = 1; }
  // Som de alarme e trava.
  SOM.alarmes(dt, ameaca, travado, trava);
}

// ---------------------------------------------------------------------------
// Som (Web Audio, tudo sintetizado).
const SOM = {
  ctx: null,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const c = this.ctx;
    this.mestre = c.createGain(); this.mestre.gain.value = 0.5; this.mestre.connect(c.destination);
    const buf = c.createBuffer(1, c.sampleRate, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    this.buf = buf;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), gn = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; fl.type = 'lowpass'; gn.gain.value = 0;
    o1.connect(fl); o2.connect(fl); fl.connect(gn); gn.connect(this.mestre); o1.start(); o2.start();
    this.m = { o1, o2, fl, gn };
    this.tA = 0; this.tT = 0;
  },
  motor(ativo, vel = 0, thr = 0) {
    if (!this.ctx) return; const t = this.ctx.currentTime, m = this.m;
    m.gn.gain.setTargetAtTime(ativo ? 0.035 + (thr > 0 ? 0.02 : 0) : 0, t, 0.1);
    m.o1.frequency.setTargetAtTime(40 + vel * 0.15, t, 0.2); m.o2.frequency.setTargetAtTime(40.7 + vel * 0.15, t, 0.2);
    m.fl.frequency.setTargetAtTime(250 + vel * 1.5 + (thr > 0 ? 500 : 0), t, 0.2);
  },
  vol(pos) { if (!pos) return 1; const d = pos.distanceTo(camera.position); return clamp(1 - d / 5000, 0, 1); },
  ruido(dur, freq, vol, tipo = 'bandpass', freq2) {
    const c = this.ctx; if (!c || vol <= 0.001) return;
    const s = c.createBufferSource(); s.buffer = this.buf;
    const f = c.createBiquadFilter(); f.type = tipo; f.frequency.value = freq;
    if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, c.currentTime + dur);
    const gn = c.createGain(); gn.gain.setValueAtTime(vol, c.currentTime); gn.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    s.connect(f); f.connect(gn); gn.connect(this.mestre); s.start(); s.stop(c.currentTime + dur);
  },
  bip(freq, dur, vol = 0.05, tipo = 'square') {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(), gn = c.createGain(); o.type = tipo; o.frequency.value = freq;
    gn.gain.setValueAtTime(vol, c.currentTime); gn.gain.setValueAtTime(0.0001, c.currentTime + dur);
    o.connect(gn); gn.connect(this.mestre); o.start(); o.stop(c.currentTime + dur + 0.01);
  },
  tiro(pos) { this.ruido(0.07, 1600, 0.1 * this.vol(pos)); },
  missil(pos) { this.ruido(0.9, 500, 0.22 * this.vol(pos), 'bandpass', 2400); },
  boom(pos, gr = 1) { this.ruido(0.6 + gr, 500, 0.6 * Math.min(1, gr + 0.3) * this.vol(pos), 'lowpass', 50); },
  alarmes(dt, ameaca, travado, tr) {
    if (!this.ctx || jogo.estado !== 'voo') return;
    this.tA -= dt; this.tT -= dt;
    if (ameaca && this.tA <= 0) { this.bip(this.alt ? 900 : 650, 0.12, 0.05); this.alt = !this.alt; this.tA = 0.16; }
    else if (travado && this.tA <= 0) { this.bip(500, 0.08, 0.03); this.tA = 0.5; }
    if (tr.t > 0 && !tr.ok && this.tT <= 0) { this.bip(1000, 0.03, 0.03); this.tT = 0.18; }
    else if (tr.ok && this.tT <= 0) { this.bip(1400, 0.05, 0.035); this.tT = 0.07; }
  },
};

// ---------------------------------------------------------------------------
// Laço principal
function atualizar(dt) {
  const M = jogo.M; M.t += jogo.fimEm ? 0 : dt;
  controlesJogador(dt);
  for (const a of [...AVIOES]) atualizarAviao(a, dt);
  armasJogador(dt);
  atualizarBalas(dt); atualizarMisseis(dt); atualizarFlares(dt); atualizarExplosoes(dt);
  atualizarTrava(dt);
  if (!jogo.fimEm) { jogo.missao.passo(M, dt); if (jogador.vivo) limites(dt); }
  else { jogo.fimEm -= dt; if (jogo.fimEm <= 0) { jogo.fimEm = 0.0001; mostrarFim(); } }
  atualizarCamera(dt);
  SOM.motor(jogador.vivo, jogador.vel, jogador.ctrl.thr);
}
// Menu: a câmera dá voltas lentas em torno da cidade.
let angMenu = 0;
function cameraMenu(dt) {
  angMenu += dt * 0.06;
  camera.position.set(Math.sin(angMenu) * 3800, 1100, Math.cos(angMenu) * 3800);
  camera.fov = 60; camera.updateProjectionMatrix();
  camera.lookAt(0, 250, 0);
  scene.fog.near = 3000; scene.fog.far = 17000;
  painel.visible = false;
}
let ultimo = performance.now();
function quadro(agora) {
  requestAnimationFrame(quadro);
  const dt = Math.min(0.05, (agora - ultimo) / 1000); ultimo = agora;
  lerControle();
  if (jogo.estado === 'voo') atualizar(dt);
  else if (jogo.estado === 'menu' || jogo.estado === 'briefing') cameraMenu(dt);
  if (jogo.estado !== 'voo') SOM.motor(false);
  ceu.position.copy(camera.position); estrelas.position.copy(camera.position);
  chao.position.x = camera.position.x; chao.position.z = camera.position.z;
  camera.updateMatrixWorld();
  composer.render();
  desenharHUD(dt);
}

// Depuração no console.
window.InterceptorNeon = { jogo, AVIOES, MISSEIS, cam, trava, get jogador() { return jogador; }, get alvo() { return alvoSel; }, set alvo(a) { alvoSel = a; }, iniciarMissao, trocarCamera, ferir };

montarMenu();
if (FLAGS.missao) iniciarMissao(clamp((+FLAGS.missao || 1) - 1, 0, MISSOES.length - 1));
else mostrar('menu');
requestAnimationFrame(quadro);
