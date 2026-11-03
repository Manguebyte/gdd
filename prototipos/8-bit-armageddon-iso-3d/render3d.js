// render3d.js — o mundo do Orbitfall Iso em 3D low-poly (Three.js, sem build).
//
// POR QUE: teste visual. As regras, o HUD e o save são os do game.js (uma cópia do Orbitfall Iso);
// só o desenho do mundo muda. Tudo é modelado por código: planeta facetado, discos voadores, Satellites,
// lasers e explosões. Nenhum sprite.
//
// ESTRATÉGIA: a simulação continua num plano 2D, o "chão" (x, y). Cada ponto do chão vira o ponto
// 3D (x, altura, −y), e a câmera ortográfica é calibrada para projetar esse plano exatamente como a
// função W(x, y) do Iso: 1 u no eixo x vira (+12, −6) px e no eixo y vira (−12, −6) px. Por isso o
// canvas 2D por cima (números de dano, setas dos setores) e o toque que escolhe o Spawn Sector no
// Invasion continuam funcionando sem mudança. O grid fica FLOOR_DROP px abaixo do plano de voo,
// como no Iso, e as sombras são de verdade: uma luz vinda de cima projeta cada coisa no chão logo
// embaixo dela, que é o que a sombra do Iso já mostrava (em qual Quadrant a coisa está).
//
// Este arquivo é um módulo, mas lê direto as variáveis globais do game.js (run, save, stat, VW, VH, P,
// clock, constantes): declarações "const/let" de scripts comuns ficam no escopo global compartilhado.

import * as THREE from 'three';

// ------------------------------------------------------------ câmera calibrada no Iso

const PX = ISO_K * Math.SQRT2;            // px de jogo por unidade, ao longo da direita da tela
const COS_EL = Math.sqrt(3) / 2;          // elevação de 30°: o chão aparece com metade da altura (2:1)
const FLOOR_Y = -FLOOR_DROP / (PX * COS_EL);   // altura 3D do grid (16 px abaixo do plano de voo)
const BG = 0x12103a;

// Eixos da tela no mundo 3D: R = direita, U = cima, B = de onde a câmera olha.
const AX_R = new THREE.Vector3(1, 0, 1).normalize();
const AX_U = new THREE.Vector3(Math.SQRT1_2 / 2, COS_EL, -Math.SQRT1_2 / 2);
const AX_B = new THREE.Vector3().crossVectors(AX_R, AX_U);

const glCanvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true });
renderer.setClearColor(BG);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 300);
camera.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(AX_R, AX_U, AX_B));
camera.position.copy(AX_B).multiplyScalar(80);

// Ponto do chão (x, y) na altura h → vetor 3D.
const G = (x, y, h = 0, v = new THREE.Vector3()) => v.set(x, h, -y);

// Grupos "deitados": dentro deles, (x, y, 0) já é o ponto (x, y) do chão. Servem para arcos e
// setores desenhados com as funções 2D do Three (CircleGeometry, RingGeometry, TorusGeometry).
function flatGroup(h) { const g = new THREE.Group(); g.rotation.x = -Math.PI / 2; g.position.y = h; scene.add(g); return g; }
const floorFlat = flatGroup(FLOOR_Y + 0.02);
const flightFlat = flatGroup(0);

// ------------------------------------------------------------ luzes

// Luz de cima à esquerda (GDD §6.2): dá o volume das facetas. Não faz sombra.
scene.add(new THREE.HemisphereLight(0xb8b8ff, 0x231a48, 0.9));
const key = new THREE.DirectionalLight(0xfff1dc, 1.8);
key.position.copy(AX_U).multiplyScalar(1.4).addScaledVector(AX_R, -1).addScaledVector(AX_B, 0.6).multiplyScalar(20);
scene.add(key);
// Luz a pino: só ela faz sombra, e a sombra cai bem embaixo de cada coisa, como a do Iso.
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.position.set(0, 40, 0);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
sun.shadow.bias = -0.0008;
sun.shadow.camera.updateProjectionMatrix();
scene.add(sun);

// ------------------------------------------------------------ materiais

const lit = (color, o = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.75, metalness: 0.05, ...o });
const glow = (color, o = {}) => new THREE.MeshBasicMaterial({ color, ...o });
const glass = (color, o = {}) => lit(color, { emissive: color, emissiveIntensity: 0.35, roughness: 0.25, ...o });
const shadowed = m => { m.traverse(o => { if (o.isMesh) o.castShadow = true; }); return m; };

// ------------------------------------------------------------ fundo: estrelas num plano atrás de tudo

function makeStars(n, size) {
  const pos = new Float32Array(n * 3), v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.copy(AX_B).multiplyScalar(-60).addScaledVector(AX_R, (Math.random() - 0.5) * 110).addScaledVector(AX_U, (Math.random() - 0.5) * 70);
    pos.set([v.x, v.y, v.z], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xdfe4ff, size, sizeAttenuation: false, transparent: true }));
  scene.add(p);
  return p;
}
const starsA = makeStars(500, 1.5), starsB = makeStars(160, 2.5);

// ------------------------------------------------------------ grid: tiles baixos que somem nas bordas

const TILE_COLORS = [0x17183c, 0x151638, 0x1a1c43];   // escuros: o grid é referência e não compete com os inimigos
const TILE_SPECIAL = 0x232962;   // ~6% dos tiles, como a variação rara do grid do Iso
{
  const n = GRID_CELLS, geo = new THREE.BoxGeometry(GRID_CELL * 0.93, 0.14, GRID_CELL * 0.93);
  const tiles = new THREE.InstancedMesh(geo, lit(0xffffff, { roughness: 0.95 }), 4 * n * n);
  const m = new THREE.Matrix4(), c = new THREE.Color(), bg = new THREE.Color(BG);
  let k = 0;
  for (let i = -n; i < n; i++) for (let j = -n; j < n; j++) {
    const ring = Math.max(Math.abs(i + 0.5), Math.abs(j + 0.5));
    const fade = ring < n - 3 ? 1 : Math.max(0.12, (n - ring) / 3.5);
    const h = (Math.random() - 0.5) * 0.05;
    m.makeTranslation((i + 0.5) * GRID_CELL, FLOOR_Y - 0.07 + h, -(j + 0.5) * GRID_CELL);
    tiles.setMatrixAt(k, m);
    c.setHex(Math.random() < 0.06 ? TILE_SPECIAL : TILE_COLORS[(Math.random() * 3) | 0]);
    tiles.setColorAt(k, c.lerp(bg, 1 - fade));
    k++;
  }
  tiles.receiveShadow = true;
  scene.add(tiles);
}

// Eixos dos Quadrants: linhas pontilhadas sobre as duas linhas centrais do grid.
{
  const L = GRID_CELLS * GRID_CELL;
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-L, 0, 0), new THREE.Vector3(L, 0, 0), new THREE.Vector3(0, -L, 0), new THREE.Vector3(0, L, 0)]);
  const axes = new THREE.LineSegments(g, new THREE.LineDashedMaterial({ color: 0xc8c8ff, dashSize: 0.12, gapSize: 0.13, transparent: true, opacity: 0.4 }));
  axes.computeLineDistances();
  axes.position.z = 0.01;
  floorFlat.add(axes);
}

// Preenchimento do Quadrant coberto: um quarto de círculo do tamanho do Attack Range, deitado no chão.
const quadFills = [0, 1, 2, 3].map(q => {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 24, q * Math.PI / 2, Math.PI / 2),
    glow(0xff9a3c, { transparent: true, opacity: 0.15, depthWrite: false }));
  mesh.position.z = 0.02;
  floorFlat.add(mesh);
  return mesh;
});

// ------------------------------------------------------------ planeta

// Paleta de cada Skin (GDD §6.2: cada Planet Core tem as suas cores). low = baixada (mar, lava),
// high = terra firme, top = picos/gelo; th = quanto do planeta é "alto".
const SKINS = {
  Terra_Classic:  { low: 0x2f6fd6, high: 0x4caf50, top: 0xf0f0f0, th: 0.05 },
  Terra_Ocean:    { low: 0x1b5fb8, high: 0x3cc0a8, top: 0xe6f7ff, th: 0.35 },
  Terra_Desert:   { low: 0x3a86c8, high: 0xd9a35a, top: 0xa8683a, th: -0.25 },
  Ice_Classic:    { low: 0x8fcdf5, high: 0xe9f6ff, top: 0xffffff, th: -0.1 },
  Ice_Aurora:     { low: 0x5fb8e0, high: 0xe4fbff, top: 0x7affc0, th: 0.0 },
  Ice_Crystal:    { low: 0xb4e2ff, high: 0xffffff, top: 0x9ab8ff, th: 0.1 },
  Magma_Classic:  { low: 0xff7a1a, high: 0x3e2018, top: 0xffd23a, th: -0.05 },
  Magma_Obsidian: { low: 0xff4a12, high: 0x1f1630, top: 0x3a2c52, th: -0.35 },
  Magma_Solar:    { low: 0xffb020, high: 0xff6a00, top: 0xfff07a, th: 0.1 },
};
// Ruído barato e fixo (soma de senos): o mesmo planeta sempre tem os mesmos continentes.
const noise = (x, y, z) => (Math.sin(x * 3.1 + 1.3) * Math.cos(y * 2.7 - 0.4) + Math.sin(z * 3.7 + y * 1.9) * 0.6 + Math.sin(x * 5.3 - z * 4.1) * 0.3) / 1.6;

const planetGroup = new THREE.Group();
scene.add(planetGroup);
const planetCache = {};
function planetMesh(core, skin) {
  const id = `${core}_${skin}`;
  if (planetCache[id]) return planetCache[id];
  const pal = SKINS[id] || SKINS.Terra_Classic;
  const geo = new THREE.IcosahedronGeometry(PLANET_R, 3);   // não indexada: cada face tem os 3 vértices dela
  const pos = geo.attributes.position, v = new THREE.Vector3();
  const nv = [];
  // Relevo: o "alto" sobe um pouco. Mesmo ruído para o mesmo ponto, então as faces continuam coladas.
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    const n = noise(v.x, v.y, v.z);
    nv.push(n);
    v.multiplyScalar(PLANET_R * (1 + Math.max(0, n - pal.th) * 0.09));
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  const colors = new Float32Array(pos.count * 3), c = new THREE.Color();
  for (let f = 0; f < pos.count; f += 3) {
    const n = (nv[f] + nv[f + 1] + nv[f + 2]) / 3;
    const y = Math.abs(pos.getY(f) + pos.getY(f + 1) + pos.getY(f + 2)) / 3;
    c.setHex(n < pal.th ? pal.low : n > pal.th + 0.45 || y > 0.88 ? pal.top : pal.high);
    for (let k = 0; k < 3; k++) colors.set([c.r, c.g, c.b], (f + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, lit(0xffffff, { vertexColors: true, roughness: 0.8 }));
  mesh.castShadow = true;
  mesh.rotation.z = 0.35;   // eixo inclinado: fica mais "planeta"
  planetCache[id] = mesh;
  return mesh;
}

// Energy Shield: bolha facetada em volta do planeta; mais forte com mais cargas.
const shieldMat = glass(0x6fd0ff, { transparent: true, opacity: 0.18, depthWrite: false });
const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(1.45, 1), shieldMat);
const shieldEdges = new THREE.LineSegments(new THREE.EdgesGeometry(shield.geometry), new THREE.LineBasicMaterial({ color: 0xaee8ff, transparent: true, opacity: 0.5 }));
shield.add(shieldEdges);
scene.add(shield);

// ------------------------------------------------------------ pools (um objeto 3D por coisa viva)

// POR QUE: criar e destruir meshes a cada frame é caro. Cada pool guarda os objetos já criados e,
// a cada frame, mostra só os primeiros que forem usados.
function pool(make) {
  const items = [];
  let used = 0;
  return {
    begin() { used = 0; },
    get() {
      if (used >= items.length) { const o = make(); items.push(o); scene.add(o); }
      const o = items[used++]; o.visible = true; return o;
    },
    end() { for (let i = used; i < items.length; i++) items[i].visible = false; },
  };
}

// ------------------------------------------------------------ Satellites (cinza, luz laranja)

const SAT_BODY = new THREE.BoxGeometry(0.26, 0.22, 0.26), SAT_PANEL = new THREE.BoxGeometry(0.34, 0.03, 0.2);
const SAT_DISH = new THREE.ConeGeometry(0.1, 0.12, 6), SAT_LIGHT = new THREE.OctahedronGeometry(0.05);
const satMat = lit(0x9a9ca6, { metalness: 0.5, roughness: 0.45 }), panelMat = lit(0x3d4a72, { metalness: 0.3, roughness: 0.4 });
const sats = pool(() => {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(SAT_BODY, satMat));
  for (const sx of [-1, 1]) { const p = new THREE.Mesh(SAT_PANEL, panelMat); p.position.x = sx * 0.31; g.add(p); }
  const dish = new THREE.Mesh(SAT_DISH, satMat); dish.rotation.x = Math.PI / 2; dish.position.z = 0.18; g.add(dish);
  const light = new THREE.Mesh(SAT_LIGHT, glow(0xff9a3c)); light.position.y = 0.15; g.add(light);
  g.userData.light = light;
  return shadowed(g);
});

// ------------------------------------------------------------ inimigos (lavanda e roxo, sem azul)

// Disco voador: perfil girado (LatheGeometry) com poucos lados, para ficar facetado.
const lathe = pts => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 9);
const SAUCER = lathe([[0, -0.3], [0.55, -0.22], [1, 0], [0.6, 0.14], [0, 0.16]]);
const DOME = new THREE.SphereGeometry(0.45, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2);
const LIGHT = new THREE.OctahedronGeometry(0.1);
const GUNNER_BARREL = new THREE.CylinderGeometry(0.1, 0.13, 0.9, 6);
const SCOUT = new THREE.ConeGeometry(0.7, 1.9, 3);
const SWARMER = new THREE.OctahedronGeometry(1);
const BRUTE = new THREE.DodecahedronGeometry(0.85);
const SPIKE = new THREE.ConeGeometry(0.22, 0.55, 4);
const RING = new THREE.TorusGeometry(1.05, 0.08, 4, 18);

const ENEMY_COLORS = {
  grunt: [0x9d7bd8, 0x7f5fc4], scout: [0xb48cff], gunner: [0x6c4aa8], swarmer: [0xc9a0ff],
  brute: [0x5a3a8a, 0x6a3f86, 0x4f3a7e, 0x744a92], mothership: [0x4b3478],
};

function makeEnemy(type) {
  const g = new THREE.Group(), hull = lit(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0 });
  const body = new THREE.Group();   // a parte que gira; o grupo de fora aponta para onde a nave vai
  g.add(body);
  g.userData = { hull, body, type };
  if (type === 'grunt' || type === 'gunner' || type === 'mothership') {
    body.add(new THREE.Mesh(SAUCER, hull));
    const dome = new THREE.Mesh(DOME, glass(type === 'gunner' ? 0xff7ad8 : type === 'mothership' ? 0xb57cf0 : 0xd6a8ff, { emissiveIntensity: 0.2 })); dome.position.y = 0.1; body.add(dome);
    const n = type === 'mothership' ? 8 : 4;
    for (let i = 0; i < n; i++) {
      const l = new THREE.Mesh(LIGHT, glow(type === 'mothership' ? 0xff6ad5 : 0xf2d8ff));
      l.position.set(Math.cos(i / n * Math.PI * 2) * 0.78, 0.02, Math.sin(i / n * Math.PI * 2) * 0.78);
      body.add(l);
    }
    if (type === 'mothership') {
      const ring = new THREE.Mesh(RING, lit(0x2e2050, { metalness: 0.4 })); ring.rotation.x = Math.PI / 2; ring.position.y = -0.05; body.add(ring);
      dome.scale.setScalar(1.25);
    }
    if (type === 'gunner') {
      const barrel = new THREE.Mesh(GUNNER_BARREL, lit(0x3a2860)); barrel.rotation.z = -Math.PI / 2; barrel.position.set(0.75, -0.05, 0);
      g.add(barrel);   // no grupo de fora: aponta sempre para o planeta
    }
  } else if (type === 'scout') {
    const m = new THREE.Mesh(SCOUT, hull); m.rotation.z = -Math.PI / 2; m.scale.set(0.4, 1, 1);   // achatado na vertical body.add(m);
    const l = new THREE.Mesh(LIGHT, glow(0xff9cf0)); l.position.x = -0.85; body.add(l);
  } else if (type === 'swarmer') {
    body.add(new THREE.Mesh(SWARMER, hull));
  } else if (type === 'brute') {
    body.add(new THREE.Mesh(BRUTE, hull));
    for (let i = 0; i < 5; i++) {
      const s = new THREE.Mesh(SPIKE, lit(0x2c1f48));
      const a = i / 5 * Math.PI * 2;
      s.position.set(Math.cos(a) * 0.8, 0.1, Math.sin(a) * 0.8);
      s.lookAt(s.position.clone().multiplyScalar(2)); s.rotateX(Math.PI / 2);
      body.add(s);
    }
    const eye = new THREE.Mesh(LIGHT, glow(0xff5ad2)); eye.scale.setScalar(1.6); eye.position.set(0.75, 0.15, 0); g.add(eye);
  }
  return shadowed(g);
}
const enemyPools = Object.fromEntries(['grunt', 'scout', 'gunner', 'swarmer', 'brute', 'mothership'].map(t => [t, pool(() => makeEnemy(t))]));

// ------------------------------------------------------------ projéteis, Reflector, laser, efeitos

const SHOT = new THREE.SphereGeometry(1, 6, 4), TRAIL = new THREE.CylinderGeometry(1, 0.2, 1, 5);
const SHOT_COLORS = { shot: 0xffaa3c, refl: 0x8fd8ff, bolt: 0xff5ad2 };
const shots = pool(() => {
  const g = new THREE.Group(), mat = glow(0xffffff), trailMat = glow(0xffffff, { transparent: true, opacity: 0.45, depthWrite: false });
  const head = new THREE.Mesh(SHOT, mat), trail = new THREE.Mesh(TRAIL, trailMat);
  g.add(head, trail);
  g.userData = { head, trail, mat, trailMat };
  return g;
});
const UP = new THREE.Vector3(0, 1, 0), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpD = new THREE.Vector3();

// Reflector: arco de 40° na órbita de 2,5 u, no plano de voo, com um módulo azul no meio.
const reflector = new THREE.Group();
{
  const arc = new THREE.Mesh(new THREE.TorusGeometry(REFLECT_R, 0.07, 4, 14, REFLECT_HALF_ARC * 2 * DEG), glow(0x8fd8ff));
  arc.rotation.z = -REFLECT_HALF_ARC * DEG;
  const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), glass(0x8fd8ff));
  node.position.x = REFLECT_R;
  reflector.add(arc, node);
  reflector.userData.node = node;
  flightFlat.add(reflector);
}

// Laser da Mothership: cilindro do disco até o planeta (ou até o Reflector, quando ele bloqueia).
const BEAM = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
const beams = pool(() => {
  const g = new THREE.Group();
  const core = new THREE.Mesh(BEAM, glow(0xffffff, { transparent: true }));
  const halo = new THREE.Mesh(BEAM, glow(0xff4fb8, { transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending }));
  const hit = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), glow(0xffb0e8, { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  g.add(core, halo, hit);
  g.userData = { core, halo, hit };
  return g;
});

// Explosões: bola facetada que cresce e esfria, mais lascas voando.
const BLAST = new THREE.IcosahedronGeometry(1, 0), CHIP = new THREE.TetrahedronGeometry(1);
const FX_SIZE = { expSmall: 0.55, expBig: 0.95, expMother: 2.3, shieldPop: 1.6 };
const HOT = new THREE.Color(0xfff2a0), WARM = new THREE.Color(0xff7a2a), COLD = new THREE.Color(0x5a2040), ICE = new THREE.Color(0xaee8ff);
const blasts = pool(() => {
  const g = new THREE.Group(), mat = glow(0xffffff, { transparent: true, depthWrite: false });
  const ball = new THREE.Mesh(BLAST, mat);
  g.add(ball);
  const chips = [];
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(CHIP, glow(0xffc070, { transparent: true }));
    const a = i / 7 * Math.PI * 2;
    c.userData.dir = new THREE.Vector3(Math.cos(a), (i % 3 - 1) * 0.5, Math.sin(a)).normalize();
    chips.push(c); g.add(c);
  }
  g.userData = { ball, mat, chips };
  return g;
});
const rings = pool(() => {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 24), glow(0xbee6ff, { transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
});

// ------------------------------------------------------------ desenho de um frame

let lastW = 0, lastH = 0, lastP = 0;
function fitRenderer() {
  if (VW === lastW && VH === lastH && P === lastP) return;
  lastW = VW; lastH = VH; lastP = P;
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(VW * P, VH * P);
}

const flash = (mat, on) => { mat.emissiveIntensity = on && !save.settings.reduceFlashes ? 0.9 : 0; };

function draw(ox, oy, z) {
  fitRenderer();
  // O centro do mundo (0, 0, 0) cai no pixel (ox, oy), com zoom z: o mesmo enquadramento do Iso.
  const k = PX * z;
  Object.assign(camera, { left: -ox / k, right: (VW - ox) / k, top: oy / k, bottom: -(VH - oy) / k });
  camera.updateProjectionMatrix();
  starsB.material.opacity = 0.55 + 0.45 * Math.sin(clock * 2.3);
  starsA.material.opacity = 0.75 + 0.25 * Math.sin(clock * 1.3 + 1);

  const live = !!run, playing = live && !run.over;
  for (const p of Object.values(enemyPools)) p.begin();
  sats.begin(); shots.begin(); beams.begin(); blasts.begin(); rings.begin();

  // Planeta (gira uma volta a cada 8 s, como o sprite de 32 frames a 4 fps)
  planetGroup.visible = live;
  if (live) {
    const mesh = planetMesh(run.core, run.skin);
    if (mesh.parent !== planetGroup) { planetGroup.clear(); planetGroup.add(mesh); }
    mesh.rotation.y = run.time * Math.PI * 2 / 8;
    flash(mesh.material, run.planetFlash > 0);
    mesh.material.emissive.setHex(0xffffff);
  }
  shield.visible = playing && run.shieldCharges > 0;
  if (shield.visible) {
    const c = Math.min(3, run.shieldCharges);
    shieldMat.opacity = 0.1 + 0.06 * c;
    shieldEdges.material.opacity = 0.25 + 0.15 * c;
    shield.rotation.y = clock * 0.4; shield.rotation.x = clock * 0.17;
    shieldMat.emissiveIntensity = run.shieldFlash > 0 && !save.settings.reduceFlashes ? 1.5 : 0.35;
  }

  // Quadrants cobertos (somem com "Mostrar Quadrants" desligado, como no Iso)
  const R = live ? stat('attackRange') : 0;
  const occupied = live ? new Set(run.sats.map(s => s.q)) : new Set();
  quadFills.forEach((m, q) => {
    m.visible = playing && save.settings.quadrants && occupied.has(q);
    if (!m.visible) return;
    m.scale.setScalar(R);
    const f = save.settings.reduceFlashes ? run.quadFlash[q] * 0.3 : run.quadFlash[q];
    m.material.opacity = 0.16 + 0.12 * f;
  });

  if (live) {
    // Satellites: painéis na tangente da órbita, antena para fora.
    if (playing) for (const s of run.sats) {
      if (s.x === undefined) continue;
      const g = sats.get();
      G(s.x, s.y, 0, g.position);
      g.rotation.y = Math.atan2(s.y, s.x) + Math.PI / 2;
      g.userData.light.visible = Math.floor(clock * 2) % 2 === 0;
    }

    // Inimigos
    for (const e of run.enemies) {
      const p = enemyPools[e.type]; if (!p) continue;
      const g = p.get(), u = g.userData;
      G(e.x, e.y, Math.sin(e.t * 3 + e.r * 7) * 0.05, g.position);
      g.scale.setScalar(e.r);
      const cols = ENEMY_COLORS[e.type];
      u.hull.color.setHex(cols[(e.variant || 0) % cols.length]);
      flash(u.hull, e.flash > 0);
      // Direção: para onde a nave andou desde o último frame; parada, olha para o planeta.
      if (e._px !== undefined && Math.hypot(e.x - e._px, e.y - e._py) > 1e-4) e._hd = Math.atan2(e.y - e._py, e.x - e._px);
      e._px = e.x; e._py = e.y;
      const toPlanet = Math.atan2(-e.y, -e.x);
      const heading = e.type === 'gunner' || e.type === 'brute' || e.type === 'mothership' || e._hd === undefined ? toPlanet : e._hd;
      g.rotation.set(0, heading, 0);
      if (e.type === 'swarmer') { u.body.rotation.set(e.t * 3, e.t * 2, 0); }
      else if (e.type === 'scout') { u.body.rotation.set(Math.sin(e.t * 6) * 0.35, 0, 0); }
      else if (e.type === 'brute') { u.body.rotation.set(0, e.t * 0.6, 0); }
      else { u.body.rotation.set(0, e.t * (e.type === 'mothership' ? 0.8 : 2.2), Math.sin(e.t * 2) * 0.08); }

      // Laser da Mothership
      if (e.type === 'mothership' && (e.warnT > 0 || e.beamT > 0)) {
        const warn = e.warnT > 0, d = Math.hypot(e.x, e.y) || 1;
        G(e.x, e.y, 0, tmpA);
        if (!warn && e.blocked) G(Math.cos(e.ang) * REFLECT_R, Math.sin(e.ang) * REFLECT_R, 0, tmpB);
        else G(e.x / d * PLANET_R * 1.05, e.y / d * PLANET_R * 1.05, 0, tmpB);
        const b = beams.get(), bu = b.userData;
        tmpD.subVectors(tmpB, tmpA);
        const len = tmpD.length();
        b.position.copy(tmpA).addScaledVector(tmpD, 0.5);
        b.quaternion.setFromUnitVectors(UP, tmpD.normalize());
        const pulse = warn ? (Math.floor(clock * 6) % 2 ? 0.9 : 0.25) : 0.85 + 0.15 * Math.sin(clock * 40);
        bu.core.scale.set(warn ? 0.03 : 0.09, len, warn ? 0.03 : 0.09);
        bu.core.material.color.setHex(warn ? 0xff5a8a : 0xffffff);
        bu.core.material.opacity = pulse;
        bu.halo.scale.set(warn ? 0.07 : 0.24 * pulse, len, warn ? 0.07 : 0.24 * pulse);
        bu.halo.material.opacity = warn ? 0.25 * pulse : 0.5;
        bu.hit.visible = !warn;
        bu.hit.position.set(0, len / 2, 0);
        bu.hit.scale.setScalar(0.25 + 0.08 * Math.sin(clock * 30));
        bu.hit.rotation.set(clock * 5, clock * 3, 0);
      }
    }

    // Projéteis dos Satellites, tiros refletidos e Gunner Bolts, com rastro na direção do movimento
    const drawShot = (o, kind, r) => {
      const g = shots.get(), u = g.userData;
      G(o.x, o.y, 0, g.position);
      u.mat.color.setHex(SHOT_COLORS[kind]); u.trailMat.color.setHex(SHOT_COLORS[kind]);
      u.head.scale.setScalar(r);
      tmpD.set(o.x - o.px, 0, -(o.y - o.py));
      if (tmpD.lengthSq() < 1e-8) { u.trail.visible = false; return; }
      u.trail.visible = true;
      tmpD.normalize();
      u.trail.quaternion.setFromUnitVectors(UP, tmpD);
      u.trail.scale.set(r * 0.8, 0.45, r * 0.8);
      u.trail.position.copy(tmpD).multiplyScalar(-0.22);
    };
    for (const p of run.projectiles) drawShot(p, p.refl ? 'refl' : 'shot', 0.07);
    for (const b of run.bolts) drawShot(b, 'bolt', 0.09);

    // Reflector
    reflector.visible = playing && stat('reflect') > 0;
    if (reflector.visible) {
      reflector.rotation.z = run.refAng * DEG;
      reflector.userData.node.rotation.set(clock * 2, clock * 3, 0);
    }

    // Explosões e anéis
    for (const f of run.fx) {
      const kf = Math.min(1, f.t / f.dur);
      if (f.ring) {
        const m = rings.get();
        G(f.x, f.y, 0, m.position);
        m.scale.setScalar(Math.max(0.1, f.r * (0.4 + kf)));
        m.material.opacity = 1 - kf;
        continue;
      }
      const g = blasts.get(), u = g.userData, size = FX_SIZE[f.img] || 0.6, ice = f.img === 'shieldPop';
      G(f.x, f.y, 0, g.position);
      u.ball.scale.setScalar(size * (0.35 + 0.75 * Math.sqrt(kf)));
      u.ball.rotation.set(kf * 3, kf * 2, 0);
      if (ice) u.mat.color.copy(ICE); else if (kf < 0.4) u.mat.color.copy(HOT).lerp(WARM, kf / 0.4); else u.mat.color.copy(WARM).lerp(COLD, (kf - 0.4) / 0.6);
      u.mat.opacity = 1 - kf * kf;
      for (const c of u.chips) {
        c.visible = !ice;
        c.position.copy(c.userData.dir).multiplyScalar(size * 1.6 * kf);
        c.scale.setScalar(size * 0.14 * (1 - kf));
        c.rotation.set(kf * 9, kf * 7, 0);
        c.material.opacity = 1 - kf;
      }
    }
  } else reflector.visible = false;

  for (const p of Object.values(enemyPools)) p.end();
  sats.end(); shots.end(); beams.end(); blasts.end(); rings.end();
  renderer.render(scene, camera);
}

window.R3D = { ready: true, draw };
