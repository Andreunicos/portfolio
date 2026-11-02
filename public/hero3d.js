/* ============================================================
   Hero 3D: cristal procedural (ou o .glb do CONFIG.heroModel)
   iluminado por uma "lanterna" que segue o cursor.
   Carregado por main.js com import() depois que a página termina de carregar.
   ============================================================ */
import * as THREE from "three";

const TAU = Math.PI * 2;
const PITCH_MIN = -0.32;
const PITCH_MAX = 0.42;
const REST_PITCH = 0.1;
const AUTO_SPEED = 0.22; // rad/s quando ninguém está mexendo
const IDLE_MS = 2600;

/* Gerador pseudoaleatório com semente: o cristal sai sempre igual (e igual ao pôster) */
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Cristal facetado: ponta, anel superior, anel inferior, base. Faces planas, sem índice. */
function crystalGeometry({ sides = 6, r = 0.6, top = 1.3, shoulder = 0.5, waist = -0.6, bottom = -1.05, jitter = 0.1, seed = 1 } = {}) {
  const rand = rng(seed);
  const ring = (y, rad, off) => {
    const pts = [];
    for (let i = 0; i < sides; i++) {
      const a = off + (i / sides) * TAU + (rand() - 0.5) * 0.25;
      const rr = rad * (1 + (rand() - 0.5) * 2 * jitter);
      pts.push(new THREE.Vector3(Math.cos(a) * rr, y + (rand() - 0.5) * jitter * 0.8, Math.sin(a) * rr));
    }
    return pts;
  };
  const apex = new THREE.Vector3((rand() - 0.5) * 0.12, top, (rand() - 0.5) * 0.12);
  const foot = new THREE.Vector3((rand() - 0.5) * 0.08, bottom, (rand() - 0.5) * 0.08);
  const up = ring(shoulder, r, rand());
  const lo = ring(waist, r * 0.86, up.length ? Math.atan2(up[0].z, up[0].x) + 0.12 : 0);
  const pos = [];
  const center = new THREE.Vector3(0, (top + bottom) / 2, 0);
  const tri = (a, b, c) => {
    // garante a normal para fora (o cristal é convexo em relação ao eixo)
    const n = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const mid = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3).sub(center);
    mid.y *= 0.35;
    if (n.dot(mid) < 0) [b, c] = [c, b];
    pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z);
  };
  for (let i = 0; i < sides; i++) {
    const j = (i + 1) % sides;
    tri(apex, up[i], up[j]);
    tri(up[i], lo[i], lo[j]);
    tri(up[i], lo[j], up[j]);
    tri(foot, lo[j], lo[i]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.55)");
  g.addColorStop(0.45, "rgba(255,255,255,0.12)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* Monta o cristal procedural. Devolve o grupo, os estilhaços e uma função de animação. */
function buildCrystal() {
  const group = new THREE.Group();
  const disposables = [];
  const keep = (o) => (disposables.push(o), o);

  // casca de vidro escuro com verniz: os reflexos da lanterna "acendem" as facetas
  const shell = keep(new THREE.MeshPhysicalMaterial({
    color: 0x0d4a45, emissive: 0x021714, roughness: 0.42, metalness: 0.1, flatShading: true,
    clearcoat: 0.65, clearcoatRoughness: 0.16, transparent: true, opacity: 0.76,
  }));
  const shardMat = keep(new THREE.MeshStandardMaterial({
    color: 0x34297a, emissive: 0x120c3a, roughness: 0.22, metalness: 0.2, flatShading: true,
  }));
  const edgeMat = keep(new THREE.LineBasicMaterial({ color: 0xb4fff2, transparent: true, opacity: 0.2, depthWrite: false }));

  // drusa: um cristal principal e dois menores saindo da mesma base
  const cluster = new THREE.Group();
  cluster.rotation.z = 0.07;
  [
    { seed: 7, r: 0.5, top: 1.55, shoulder: 0.78, waist: -0.62, bottom: -1.02, pos: [0, 0, 0], rot: [0, 0, 0], s: 1 },
    { seed: 13, r: 0.5, top: 1.35, shoulder: 0.55, waist: -0.55, bottom: -0.95, pos: [-0.46, -0.6, 0.12], rot: [0.18, 0.4, 0.62], s: 0.52 },
    { seed: 19, r: 0.5, top: 1.3, shoulder: 0.5, waist: -0.5, bottom: -0.9, pos: [0.42, -0.72, -0.14], rot: [-0.2, 1.1, -0.66], s: 0.4 },
  ].forEach((c) => {
    const geo = keep(crystalGeometry(c));
    const m = new THREE.Mesh(geo, shell);
    m.position.set(...c.pos); m.rotation.set(...c.rot); m.scale.setScalar(c.s);
    m.renderOrder = 2;
    const edges = new THREE.LineSegments(keep(new THREE.EdgesGeometry(geo, 1)), edgeMat);
    edges.renderOrder = 3;
    m.add(edges);
    cluster.add(m);
  });
  group.add(cluster);

  // núcleo brilhante (atravessa a casca com um brilho aditivo)
  const core = new THREE.Mesh(keep(new THREE.OctahedronGeometry(0.17, 0)), keep(new THREE.MeshBasicMaterial({ color: 0xc4fff3 })));
  core.scale.set(1, 2.3, 1);
  core.position.y = 0.12;
  core.renderOrder = 1;
  cluster.add(core);
  const glowMat = keep(new THREE.SpriteMaterial({
    map: keep(glowTexture()), color: 0x2cf5c0, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, depthTest: false, opacity: 0.9,
  }));
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(1.5, 2.7, 1);
  glow.position.copy(core.position);
  glow.renderOrder = 4;
  cluster.add(glow);
  const coreLight = new THREE.PointLight(0x2cf5c0, 3.2, 4, 2);
  coreLight.position.copy(core.position);
  group.add(coreLight);

  // fragmentos que orbitam o cristal (os "estilhaços" da lenda)
  const shards = [
    { r: 1.4, y: 0.7, a: 0.4, s: 0.22, sp: 0.3, seed: 11, color: 0x2cf5c0 },
    { r: 1.55, y: -0.25, a: 2.6, s: 0.17, sp: 0.24, seed: 23, color: 0x8b5cf6 },
    { r: 1.3, y: -0.95, a: 4.4, s: 0.12, sp: 0.36, seed: 31, color: 0x2cf5c0 },
  ].map((d) => {
    const m = new THREE.Mesh(keep(crystalGeometry({ sides: 5, r: 0.5, top: 1.1, shoulder: 0.35, waist: -0.4, bottom: -0.9, jitter: 0.16, seed: d.seed })), shardMat);
    m.scale.setScalar(d.s);
    m.rotation.set(d.seed * 0.3, d.seed, d.seed * 0.7);
    group.add(m);
    return { m, ...d };
  });

  const tris = countTris(group);
  let gather = 1, flash = 0, boost = 0;

  // t: tempo da cena; orbitT: tempo das órbitas (para no modo reduzido)
  const animate = (t, orbitT, still) => {
    group.position.y = still ? 0 : Math.sin(t * 0.9) * 0.06;
    const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * 1.6);
    const k = 1 + flash * 0.8 + boost * 0.5;
    glowMat.opacity = Math.min(1, (0.5 + pulse * 0.25) * (0.8 + 0.2 * k));
    glow.scale.set(1.5 * (1 + flash * 0.45 + boost * 0.2), 2.7 * (1 + flash * 0.3 + boost * 0.15), 1);
    coreLight.intensity = (2.6 + pulse * 1.2) * k;
    core.rotation.y = still ? 0.4 : t * 0.6;
    const g = 1 - Math.pow(1 - gather, 3); // reunião dos estilhaços na abertura
    shards.forEach((d) => {
      const a = d.a + orbitT * d.sp + (1 - g) * 1.6;
      const r = d.r * (1 + (1 - g) * 0.9);
      d.m.position.set(Math.cos(a) * r, d.y * (0.6 + 0.4 * g) + (still ? 0 : Math.sin(t * 0.8 + d.seed) * 0.08), Math.sin(a) * r);
      d.m.scale.setScalar(d.s * Math.min(1, g * 1.4));
      if (!still) { d.m.rotation.y += 0.004; d.m.rotation.x += 0.002; }
    });
  };

  const dispose = () => disposables.forEach((d) => d.dispose && d.dispose());
  return {
    group, shards, animate, dispose, tris, core,
    set gather(v) { gather = v; }, get gather() { return gather; },
    set flash(v) { flash = v; }, get flash() { return flash; },
    set boost(v) { boost = v; },
  };
}

/* Poeira que só aparece de verdade dentro do facho da lanterna */
function buildDust(max = 160) {
  const rand = rng(99);
  const pos = new Float32Array(max * 3), seed = new Float32Array(max);
  for (let i = 0; i < max; i++) {
    pos[i * 3] = (rand() - 0.5) * 5.2; pos[i * 3 + 1] = (rand() - 0.5) * 3.8; pos[i * 3 + 2] = (rand() - 0.5) * 3 + 0.8;
    seed[i] = rand();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uLamp: { value: new THREE.Vector3() }, uDir: { value: new THREE.Vector3(0, 0, -1) }, uTime: { value: 0 }, uPx: { value: 3 } },
    vertexShader: `
      uniform vec3 uLamp; uniform vec3 uDir; uniform float uTime; uniform float uPx;
      attribute float aSeed; varying float vA;
      void main() {
        vec3 p = position;
        p.y = mod(p.y + 1.9 + uTime * (0.05 + aSeed * 0.05), 3.8) - 1.9;   // sobe devagar e recomeça
        p.x += sin(uTime * 0.4 + aSeed * 40.0) * 0.06;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float c = dot(normalize(p - uLamp), uDir);
        float cone = smoothstep(0.88, 0.985, c);                            // dentro do facho
        float tw = 0.55 + 0.45 * sin(uTime * 2.3 + aSeed * 31.0);
        vA = (0.05 + cone * 0.95) * tw;
        gl_PointSize = uPx * (0.7 + cone * 1.1) * (6.0 / -mv.z);
      }`,
    fragmentShader: `
      varying float vA;
      void main() {
        float r = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.05, r) * vA;
        gl_FragColor = vec4(vec3(1.0, 0.9, 0.74) * a, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, mat, geo, max };
}

/* Cone de luz volumétrica da lanterna (borda suave, some com a distância) */
function buildShaft() {
  const geo = new THREE.ConeGeometry(1, 1, 40, 1, true);
  geo.translate(0, -0.5, 0); // ápice na origem, abrindo para -Y
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uI: { value: 0.1 } },
    vertexShader: `
      varying float vT; varying vec3 vN; varying vec3 vV;
      void main() {
        vT = -position.y;
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uI; varying float vT; varying vec3 vN; varying vec3 vV;
      void main() {
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.0);
        float fall = (1.0 - vT) * smoothstep(0.0, 0.18, vT);
        float a = edge * fall * uI;
        gl_FragColor = vec4(vec3(1.0, 0.88, 0.68) * a, a);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.renderOrder = 5;
  return { mesh, mat, geo };
}

/* Rastro em fita para cada estilhaço (sempre virado para a câmera) */
function buildTrail(color, n = 22) {
  const pos = new Float32Array(n * 2 * 3), alpha = new Float32Array(n * 2);
  const idx = [];
  for (let i = 0; i < n; i++) {
    alpha[i * 2] = alpha[i * 2 + 1] = Math.pow(1 - i / (n - 1), 1.6);
    if (i < n - 1) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aA", new THREE.BufferAttribute(alpha, 1));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uC: { value: new THREE.Color(color) }, uO: { value: 0.32 } },
    vertexShader: `attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 uC; uniform float uO; varying float vA; void main(){ float a = vA * uO; gl_FragColor = vec4(uC * a, a); }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  const hist = Array.from({ length: n }, () => new THREE.Vector3());
  let primed = false;
  const tmp = new THREE.Vector3(), side = new THREE.Vector3(), view = new THREE.Vector3();
  const update = (head, camPos, width) => {
    if (!primed) { hist.forEach((v) => v.copy(head)); primed = true; }
    for (let i = n - 1; i > 0; i--) hist[i].copy(hist[i - 1]);
    hist[0].copy(head);
    for (let i = 0; i < n; i++) {
      const p = hist[i], q = hist[Math.min(n - 1, i + 1)], o = hist[Math.max(0, i - 1)];
      tmp.subVectors(o, q);
      if (tmp.lengthSq() < 1e-8) tmp.set(1, 0, 0);
      view.subVectors(camPos, p);
      side.crossVectors(tmp, view).normalize().multiplyScalar(width * (1 - i / n));
      pos.set([p.x + side.x, p.y + side.y, p.z + side.z, p.x - side.x, p.y - side.y, p.z - side.z], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
  const reset = () => { primed = false; };
  return { mesh, mat, geo, update, reset };
}

/* Explosão de estilhaços + anel de choque (clique/toque/Enter) */
function buildBurst(count = 44) {
  const geo = new THREE.TetrahedronGeometry(0.055, 0);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  mesh.frustumCulled = false;
  mesh.visible = false;
  const cA = new THREE.Color(0x7dffe0), cB = new THREE.Color(0xa98bff), tmpC = new THREE.Color();
  for (let i = 0; i < count; i++) mesh.setColorAt(i, tmpC.copy(i % 3 ? cA : cB));
  const P = Array.from({ length: count }, () => ({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), life: 0 }));
  // onda de choque: anel suave (gaussiano) que afina enquanto cresce
  const ringGeo = new THREE.PlaneGeometry(2, 2);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
    uniforms: { uP: { value: 0 }, uO: { value: 0 }, uC: { value: new THREE.Color(0x8dffe6) } },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      varying vec2 vUv; uniform float uP; uniform float uO; uniform vec3 uC;
      void main() {
        float r = length(vUv * 2.0 - 1.0);
        float R = 0.12 + uP * 0.84, wd = mix(0.08, 0.012, uP);
        float band = exp(-pow((r - R) / wd, 2.0));
        float echo = exp(-pow((r - R * 0.7) / (wd * 2.2), 2.0)) * 0.3;
        float a = (band + echo) * uO * (1.0 - uP);
        gl_FragColor = vec4(mix(uC, vec3(1.0), band * 0.35) * a, a);
      }`,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.renderOrder = 6;
  ring.scale.setScalar(1.9);
  ring.visible = false;
  const ring2 = new THREE.Object3D(); // mantido por compatibilidade
  let age = 9;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  const fire = (rand) => {
    age = 0;
    P.forEach((o) => {
      const u = rand() * 2 - 1, th = rand() * Math.PI * 2, sp = 1.6 + rand() * 2.6;
      const s = Math.sqrt(1 - u * u);
      o.v.set(s * Math.cos(th) * sp, u * sp * 0.8 + 0.3, s * Math.sin(th) * sp * 0.6 + 0.6);
      o.p.set(0, 0.12, 0).addScaledVector(o.v, 0.06);
      o.r.set(rand() * 6, rand() * 6, rand() * 6);
      o.w.set(rand() * 8 - 4, rand() * 8 - 4, rand() * 8 - 4);
      o.life = 0.55 + rand() * 0.55;
    });
    mesh.visible = ring.visible = true;
  };
  const update = (dt, camQuat) => {
    if (age > 1.3) { mesh.visible = ring.visible = false; return false; }
    age += dt;
    const drag = Math.exp(-dt * 2.8);
    P.forEach((o, i) => {
      const k = Math.max(0, 1 - age / o.life);
      o.v.multiplyScalar(drag); o.v.y -= dt * 0.6;
      o.p.addScaledVector(o.v, dt);
      o.r.x += o.w.x * dt; o.r.y += o.w.y * dt; o.r.z += o.w.z * dt;
      q.setFromEuler(o.r);
      const s = k * (0.6 + 0.8 * k);
      m4.compose(o.p, q, sc.set(s, s, s));
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    ring.quaternion.copy(camQuat);
    ringMat.uniforms.uP.value = 1 - Math.pow(1 - Math.min(1, age / 0.8), 3);
    ringMat.uniforms.uO.value = age < 0.8 ? 0.8 : 0;
    return true;
  };
  return { mesh, ring, ring2, fire, update, get age() { return age; },
    dispose() { geo.dispose(); mat.dispose(); ringGeo.dispose(); ringMat.dispose(); } };
}

/* Passe final: aberração cromática radial sutil + alpha correto para o canvas transparente */
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uCA: { value: 0.0035 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uCA; varying vec2 vUv;
    void main() {
      vec2 c = vUv - 0.5;
      vec2 off = c * uCA * (0.4 + dot(c, c) * 4.0);
      vec4 base = texture2D(tDiffuse, vUv);
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, base.g, texture2D(tDiffuse, vUv - off).b);
      // borda suave: o brilho nunca encosta na borda do canvas (sem "caixa" visível)
      float edge = smoothstep(0.5, 0.3, max(abs(c.x), abs(c.y))) * smoothstep(0.62, 0.38, length(c));
      col *= edge;
      float a = clamp(max(base.a * edge, max(col.r, max(col.g, col.b))), 0.0, 1.0);
      gl_FragColor = vec4(min(col, vec3(a)), a);
    }`,
};

/* Níveis de qualidade (o "auto" desce um nível se os quadros ficarem lentos) */
const TIERS = {
  full: { postfx: true, ca: true, shaft: true, trails: true, dust: 150, dpr: 2, bloomScale: 0.5 },
  medium: { postfx: true, ca: false, shaft: true, trails: true, dust: 90, dpr: 1.25, bloomScale: 0.35 },
  low: { postfx: false, ca: false, shaft: false, trails: false, dust: 40, dpr: 1, bloomScale: 0 },
};
const TIER_ORDER = ["full", "medium", "low"];

/* Conta triângulos de um objeto qualquer (para o letreiro "N triângulos") */
function countTris(root) {
  let n = 0;
  root.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    n += (g.index ? g.index.count : g.attributes.position.count) / 3;
  });
  return Math.round(n);
}

function disposeTree(root) {
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    mats.forEach((m) => {
      Object.values(m).forEach((v) => { if (v && v.isTexture) v.dispose(); });
      m.dispose();
    });
  });
}

export async function startHero({ view, hero, gl = null, hint, hintText, meta, lantern, model, modelAlt, poster = false, mode = "full", intro = false, postfx = true, tier: forcedTier = null }) {
  const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 820;
  const deviceDpr = coarse ? 1.5 : 2;
  let fxMode = mode === "reduced" ? "reduced" : "full";
  const targetTier = forcedTier || (coarse ? "medium" : "full");
  // começa no nível barato e mede ~1,2 s escondido atrás do pôster; só liga o pós-processamento se o aparelho aguentar
  let probing = !forcedTier && !poster && mode !== "reduced";
  let tierName = probing ? "low" : targetTier;
  let tier = TIERS[tierName];
  let probeStart = 0, upgrading = false;
  const probeFt = [];
  const usePostfx = () => postfx && tier.postfx;

  // usa o contexto já criado pelo main.js (um só contexto WebGL por página)
  const canvas = gl ? gl.canvas : document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl ? gl.context : undefined, antialias: true, alpha: true, powerPreference: "default", preserveDrawingBuffer: poster });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const dpr = () => Math.min(devicePixelRatio || 1, deviceDpr, tier.dpr);
  renderer.setPixelRatio(dpr());

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  const CAM = new THREE.Vector3(0, 0.28, 7.1);
  camera.position.copy(CAM);
  camera.lookAt(0, 0, 0);

  // Luzes: quase escuro, contraluz violeta e a lanterna quente que segue o cursor
  scene.add(new THREE.HemisphereLight(0x262a52, 0x030304, 0.22));
  const rim = new THREE.DirectionalLight(0x8b5cf6, 2.2);
  rim.position.set(-3, 2.5, -4);
  scene.add(rim);
  let lampBase = 170;
  const lamp = new THREE.SpotLight(0xffe2b0, lampBase, 16, 0.42, 0.7, 1.6);
  lamp.position.set(-2, 2, 5);
  scene.add(lamp);
  scene.add(lamp.target);
  const fill = new THREE.PointLight(0xffe2b0, 2.5, 12, 2);
  scene.add(fill);

  const pivot = new THREE.Group(); // gira com o arraste
  scene.add(pivot);
  let crystal = buildCrystal();
  pivot.add(crystal.group);
  let content = crystal.group;
  let usingModel = false;
  let tris = crystal.tris;
  if (meta) meta.textContent = `Modelo low poly, ${tris} triângulos`;

  // VFX da cena
  const dust = buildDust(TIERS.full.dust);
  scene.add(dust.points);
  const shaft = buildShaft();
  scene.add(shaft.mesh);
  let trails = crystal.shards.map((d) => { const tr = buildTrail(d.color); scene.add(tr.mesh); return tr; });
  const burst = buildBurst();
  scene.add(burst.mesh, burst.ring, burst.ring2);
  const rand = rng(2026);

  // pós-processamento (carregado só quando o nível usa)
  let composer = null, bloom = null, finalPass = null;
  const setupPostfx = async () => {
    if (composer || !usePostfx()) return;
    const P = await import("three/addons/postprocessing/postfx.js");
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    composer = new P.EffectComposer(renderer, rt);
    const rp = new P.RenderPass(scene, camera);
    rp.clearAlpha = 0;
    composer.addPass(rp);
    bloom = new P.UnrealBloomPass(new THREE.Vector2(256, 256), 0.9, 0.55, 0.7);
    // o bloom soma cor, mas não pode somar alpha (o blur dele escreve alpha 1 e deixaria o fundo preto)
    const bm = bloom.blendMaterial;
    bm.blending = THREE.CustomBlending;
    bm.blendEquation = THREE.AddEquation;
    bm.blendSrc = THREE.OneFactor; bm.blendDst = THREE.OneFactor;
    bm.blendSrcAlpha = THREE.ZeroFactor; bm.blendDstAlpha = THREE.OneFactor;
    composer.addPass(bloom);
    composer.addPass(new P.OutputPass());
    finalPass = new P.ShaderPass(FinalShader);
    composer.addPass(finalPass);
    sizeComposer();
  };
  const sizeComposer = () => {
    if (!composer || !w) return;
    composer.setPixelRatio(dpr());
    composer.setSize(w, h);
    bloom.resolution.set(Math.round(w * dpr() * tier.bloomScale), Math.round(h * dpr() * tier.bloomScale));
  };
  const applyTier = () => {
    dust.geo.setDrawRange(0, tier.dust);
    shaft.mesh.visible = tier.shaft;
    trails.forEach((tr) => { tr.mesh.visible = tier.trails && fxMode === "full"; tr.reset(); });
    renderer.setPixelRatio(dpr());
    if (w) renderer.setSize(w, h, false);
    if (finalPass) finalPass.uniforms.uCA.value = tier.ca ? 0.0035 : 0;
    sizeComposer();
    needsFrame = true;
  };

  /* ---------- tamanho ---------- */
  let w = 0, h = 0, stageOff = { x: 0, y: 0 };
  const resize = () => {
    const r = view.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    stageOff = { x: r.left - hr.left, y: r.top - hr.top };
    const nw = view.clientWidth, nh = view.clientHeight; // sem o transform do encaixe
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    renderer.setPixelRatio(dpr());
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    sizeComposer();
    needsFrame = true;
  };

  /* ---------- órbita com inércia ---------- */
  let yaw = 0.35, pitch = REST_PITCH, vYaw = 0, vPitch = 0;
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, lastInput = -1e9, pid = null, axis = null, sx = 0, sy = 0, downT = 0, moved = 0;
  let lastBurst = -1e9;

  const doBurst = () => {
    const now = performance.now();
    if (fxMode !== "full" || now - lastBurst < 500) return; // no máximo 2 por segundo (sem "flashes")
    lastBurst = now;
    burst.fire(rand);
    if (crystal && crystal.flash !== undefined) crystal.flash = 1;
    vYaw += 2.2;
    wake();
  };

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pid = e.pointerId; sx = lastX = e.clientX; sy = lastY = e.clientY; lastT = downT = performance.now(); moved = 0;
    axis = e.pointerType === "mouse" ? "free" : null; // no toque, decide pelo primeiro movimento
    vYaw = vPitch = 0;
    if (axis) begin(e);
  };
  const begin = (e) => {
    dragging = true;
    view.classList.add("is-dragging");
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
  };
  const onMove = (e) => {
    if (e.pointerId !== pid) return;
    moved = Math.max(moved, Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy));
    if (!axis) {
      const dx = Math.abs(e.clientX - sx), dy = Math.abs(e.clientY - sy);
      if (dx + dy < 6) return;
      if (dy > dx) { pid = null; return; } // gesto vertical: deixa a página rolar
      axis = "yaw";
      begin(e);
    }
    if (!dragging) return;
    const now = performance.now();
    const dt = Math.max(1, now - lastT) / 1000;
    const dx = (e.clientX - lastX) / Math.max(200, w);
    const dy = axis === "free" ? (e.clientY - lastY) / Math.max(200, h) : 0;
    yaw += dx * 4.2;
    pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch + dy * 2.6));
    vYaw = Math.max(-7, Math.min(7, (dx * 4.2) / dt)); // limita o "arremesso"
    vPitch = Math.max(-3, Math.min(3, (dy * 2.6) / dt));
    lastX = e.clientX; lastY = e.clientY; lastT = now; lastInput = now;
    if (e.cancelable && axis === "yaw") e.preventDefault();
    wake();
  };
  const onUp = (e) => {
    if (e.pointerId !== pid) return;
    pid = null;
    const tap = moved < 6 && performance.now() - downT < 350;
    if (dragging) {
      dragging = false;
      view.classList.remove("is-dragging");
      if (performance.now() - lastT > 80) vYaw = vPitch = 0; // soltou parado: sem arremesso
      lastInput = performance.now();
    }
    if (tap && e.type === "pointerup") doBurst();
    wake();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("lostpointercapture", (e) => { if (e.pointerId === pid) onUp(e); });

  // teclado: setas giram, Enter/Espaço dispara a explosão
  const onKey = (e) => {
    const step = e.shiftKey ? 0.5 : 0.2;
    if (e.key === "ArrowLeft") vYaw = Math.max(-7, vYaw - step * 6);
    else if (e.key === "ArrowRight") vYaw = Math.min(7, vYaw + step * 6);
    else if (e.key === "ArrowUp") pitch = Math.max(PITCH_MIN, pitch - step);
    else if (e.key === "ArrowDown") pitch = Math.min(PITCH_MAX, pitch + step);
    else if (e.key === "Home") { yaw = 0.35; pitch = REST_PITCH; vYaw = 0; }
    else if ((e.key === "Enter" || e.key === " ") && fxMode === "full") doBurst();
    else return;
    e.preventDefault();
    lastInput = performance.now();
    wake();
  };

  /* ---------- rolagem: pulso do núcleo e encaixe ---------- */
  let scrollBoost = 0, lastSY = scrollY;
  const onScroll = () => {
    const d = Math.abs(scrollY - lastSY); lastSY = scrollY;
    scrollBoost = Math.min(1, scrollBoost + d / 900);
    if (fxMode === "full") wake();
  };
  addEventListener("scroll", onScroll, { passive: true });

  /* ---------- loop de render ---------- */
  let raf = 0, visible = true, paused = false, last = 0, t = 0, orbitT = 0, needsFrame = true, firstFrame = false, dead = false;
  let modelPending = !!model; // com .glb configurado, o canvas só aparece quando ele carregar (ou falhar)
  let revealT = -1; // momento em que o canvas apareceu (para a reunião dos estilhaços)
  const lampPos = new THREE.Vector3(-2, 2, 5), lampGoal = new THREE.Vector3(), lampDir = new THREE.Vector3(), camDir = new THREE.Vector3();
  const camGoal = new THREE.Vector3().copy(CAM);
  // medição de quadros para a qualidade automática
  const ft = [];
  let warm = 0, autoTier = !forcedTier && !poster, throttled = false, probeResult = null;

  const aimLamp = (k) => {
    // posição da lanterna relativa ao centro do palco, em "larguras de palco"
    let dx = -0.16, dy = -0.2;
    if (lantern && lantern.ready && w) {
      dx = (lantern.x - stageOff.x - w / 2) / w;
      dy = (lantern.y - stageOff.y - h / 2) / h;
    }
    // abertura: a luz entra varrendo da esquerda
    if (revealT >= 0 && intro && fxMode === "full") {
      const e = Math.min(1, (performance.now() - revealT) / 1300);
      const ee = 1 - Math.pow(1 - e, 3);
      dx = -1.3 + (dx + 1.3) * ee;
    }
    dx = Math.max(-1.3, Math.min(1.3, dx));
    dy = Math.max(-1.1, Math.min(1.1, dy));
    lampGoal.set(dx * 5.2, -dy * 4.2 + 0.4, 4.6 - Math.hypot(dx, dy) * 1.2);
    lampPos.lerp(lampGoal, k);
    lamp.position.copy(lampPos);
    lamp.intensity = lampBase * (0.72 + 0.28 * Math.min(1, Math.hypot(dx, dy) / 0.6)); // de frente ofusca: suaviza
    fill.position.set(lampPos.x * 0.6, lampPos.y * 0.6, 3);
    lamp.target.position.set(0, 0.1, 0);
    // facho volumétrico e poeira seguem a lanterna
    lampDir.subVectors(lamp.target.position, lampPos);
    const len = lampDir.length();
    lampDir.normalize();
    shaft.mesh.position.copy(lampPos);
    shaft.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), lampDir);
    const L = len * 1.35, R = L * Math.tan(0.42) * 0.9;
    shaft.mesh.scale.set(R, L, R);
    const side = 1 - Math.abs(lampDir.dot(camDir.subVectors(lamp.target.position, camera.position).normalize()));
    shaft.mat.uniforms.uI.value = (0.06 + 0.06 * Math.min(1, Math.hypot(dx, dy))) * Math.pow(Math.min(1, side * 3), 1.5);
    dust.mat.uniforms.uLamp.value.copy(lampPos);
    dust.mat.uniforms.uDir.value.copy(lampDir);
  };

  const render = () => {
    if (composer && usePostfx()) {
      if (bloom) bloom.strength = 0.85 + (crystal && crystal.flash ? crystal.flash * 0.35 : 0) + scrollBoost * 0.2;
      composer.render();
    } else renderer.render(scene, camera);
  };

  const frame = (now) => {
    raf = 0;
    if (dead) return;
    const rawDt = (now - (last || now)) / 1000;
    const dt = Math.min(0.05, rawDt);
    last = now;
    const full = fxMode === "full" && !throttled;
    if (full) { t += dt; orbitT += dt; }

    // qualidade automática: depois de 1,5 s, se a média de ~2 s passar de 24 ms por quadro, desce um nível.
    // Se nem o nível baixo aguentar (> 40 ms), o 3D para de animar sozinho e só redesenha quando alguém mexe.
    if (autoTier && full && rawDt > 0 && rawDt < 1) {
      if (!warm) warm = now;
      if (now - warm > 1500) {
        ft.push(rawDt * 1000);
        const sum = ft.reduce((a, b) => a + b, 0);
        if (ft.length >= 60 || sum > 2000) {
          const avg = sum / ft.length;
          ft.length = 0;
          const i = TIER_ORDER.indexOf(tierName);
          if (avg > 24 && i < TIER_ORDER.length - 1) { tierName = TIER_ORDER[i + 1]; tier = TIERS[tierName]; applyTier(); warm = now; }
          else if (avg > 40 && tierName === "low") { throttled = true; autoTier = false; }
        }
      }
    }
    if (!dragging) {
      // inércia, e depois de um tempo parado volta a girar sozinho (só no modo completo)
      const decay = Math.exp(-dt * 3.2);
      vYaw *= decay; vPitch *= decay;
      yaw += vYaw * dt;
      pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch + vPitch * dt));
      if (full && now - lastInput > IDLE_MS) {
        const ease = Math.min(1, (now - lastInput - IDLE_MS) / 1500);
        yaw += AUTO_SPEED * (1 + scrollBoost * 2) * ease * dt;
        pitch += (REST_PITCH - pitch) * (1 - Math.exp(-dt * 0.8));
      }
    }
    pivot.rotation.set(pitch, yaw, 0);

    // câmera com parallax do ponteiro (modo completo)
    if (full && lantern && lantern.ready) camGoal.set(CAM.x + lantern.nx * 0.42, CAM.y - lantern.ny * 0.22, CAM.z);
    else camGoal.copy(CAM);
    camera.position.lerp(camGoal, 1 - Math.exp(-dt * 3));
    camera.lookAt(0, 0, 0);

    if (crystal) {
      if (crystal.flash !== undefined) {
        crystal.flash = Math.max(0, crystal.flash - dt * 2.4);
        if (revealT >= 0) crystal.gather = intro && full ? Math.min(1, (now - revealT) / 1300) : Math.min(1, (now - revealT) / 600);
        crystal.boost = scrollBoost;
      }
      crystal.animate(t, orbitT, !full);
    }
    scrollBoost *= Math.exp(-dt * 2.5);
    dust.mat.uniforms.uTime.value = t;
    dust.mat.uniforms.uPx.value = 2.4 * renderer.getPixelRatio();
    aimLamp(1 - Math.exp(-dt * 8));
    if (trails.length && tier.trails && full && crystal && crystal.shards) {
      const fade = crystal.gather === undefined ? 1 : Math.max(0, (crystal.gather - 0.6) / 0.4);
      crystal.shards.forEach((d, i) => {
        const tr = trails[i];
        d.m.getWorldPosition(tmpV);
        // o rastro só aparece quando o estilhaço corre (arremesso, explosão); parado na órbita fica invisível
        const speed = tr.last ? tmpV.distanceTo(tr.last) / Math.max(dt, 0.008) : 0;
        tr.last = (tr.last || new THREE.Vector3()).copy(tmpV);
        tr.vis = (tr.vis || 0) + (Math.min(1, Math.max(0, (speed - 0.6) / 1.8)) - (tr.vis || 0)) * 0.15;
        tr.mat.uniforms.uO.value = 0.4 * fade * tr.vis;
        tr.update(tmpV, camera.position, d.s * 0.12);
      });
    }
    const bursting = burst.update(dt, camera.quaternion);
    render();
    needsFrame = false;

    if (probing && !upgrading) {
      if (!probeStart) probeStart = now;
      else if (rawDt > 0 && rawDt < 1) probeFt.push(rawDt * 1000);
      const el = now - probeStart;
      if ((el > 1200 && probeFt.length >= 8) || el > 4000) {
        const avg = probeFt.length ? probeFt.reduce((a, b) => a + b, 0) / probeFt.length : 99;
        probeResult = Math.round(avg * 10) / 10;
        if (avg < 20 && targetTier !== "low") {
          upgrading = true;
          const go = () => {
            tierName = targetTier; tier = TIERS[tierName]; applyTier();
            setupPostfx().catch(() => { composer = null; }).finally(() => {
              if (finalPass) finalPass.uniforms.uCA.value = tier.ca ? 0.0035 : 0;
              probing = false; upgrading = false; warm = 0; wake();
            });
          };
          "requestIdleCallback" in window ? requestIdleCallback(go, { timeout: 800 }) : setTimeout(go, 50);
        } else {
          probing = false;
          if (avg > 34) { throttled = true; autoTier = false; }
        }
      }
    }
    if (!firstFrame && !modelPending && !probing) {
      firstFrame = true;
      revealT = performance.now();
      if (intro && full) setTimeout(() => { if (crystal && crystal.flash !== undefined) { crystal.flash = 0.5; burst.fire(rand); } }, 1150);
      view.appendChild(canvas);
      requestAnimationFrame(() => view.classList.add("is-live"));
      activateUi();
    }
    // modo reduzido: só desenha enquanto algo está mudando (arraste, inércia, explosão)
    const settling = dragging || Math.abs(vYaw) > 0.002 || Math.abs(vPitch) > 0.002 || bursting || (revealT >= 0 && now - revealT < 700);
    if (upgrading) return; // retoma quando o pós-processamento estiver pronto
    if (visible && !paused && !document.hidden && (full || settling || needsFrame || probing)) raf = requestAnimationFrame(frame);
  };
  const tmpV = new THREE.Vector3();
  const wake = () => { if (!raf && !dead && visible && !paused && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };

  let baseLabel = view.getAttribute("aria-label") || "Modelo 3D";
  let uiActive = false;
  const applyLabel = () => {
    if (!uiActive) return;
    const extra = fxMode === "full" ? " Clique ou aperte Enter para liberar uma onda de energia." : "";
    view.setAttribute("aria-label", `${baseLabel}. Modelo 3D interativo: arraste ou use as setas do teclado para girar.${extra}`);
  };
  const activateUi = () => {
    view.tabIndex = 0;
    uiActive = true;
    applyLabel();
    view.addEventListener("keydown", onKey);
    if (hint) {
      if (hintText) hintText.textContent = matchMedia("(pointer: coarse)").matches ? "Arraste para o lado ou toque" : "Arraste para girar, clique para energizar";
      if (fxMode !== "full" && hintText) hintText.textContent = "Arraste para girar";
      hint.hidden = false;
    }
  };

  /* ---------- pausa fora da tela / aba escondida / cristal já encaixado no HUD ---------- */
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) wake(); }, { threshold: 0.01 });
  io.observe(view);
  const onVis = () => { if (!document.hidden) wake(); };
  document.addEventListener("visibilitychange", onVis);
  const ro = new ResizeObserver(() => { resize(); wake(); });
  ro.observe(view);
  ro.observe(hero); // a posição do palco muda quando as fontes carregam

  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    view.classList.remove("is-live"); // volta para o pôster
    cancelAnimationFrame(raf); raf = 0; dead = true;
  });

  resize();
  applyTier();
  aimLamp(1); // começa com a luz no mesmo lugar do pôster, para o fade não "pular"
  try { await setupPostfx(); } catch (err) { console.warn("Pós-processamento indisponível:", err); composer = null; }
  if (finalPass) finalPass.uniforms.uCA.value = tier.ca ? 0.0035 : 0;

  if (poster) {
    // modo usado só para gerar a imagem estática (assets/hero-crystal-*.webp): sem estilhaços, sem poeira
    t = 0; yaw = 0.35; pitch = REST_PITCH;
    pivot.rotation.set(pitch, yaw, 0);
    crystal.gather = 0;
    crystal.animate(0, 0, false);
    crystal.shards.forEach((d) => (d.m.visible = false));
    dust.points.visible = false; shaft.mesh.visible = false; trails.forEach((tr) => (tr.mesh.visible = false));
    lampPos.set(0, 0, 0); aimLamp(1);
    render();
    view.appendChild(canvas);
    view.classList.add("is-live");
    return { canvas, renderer };
  }

  // compila os shaders em paralelo (KHR_parallel_shader_compile) antes do 1º quadro, para não travar a página
  if (renderer.extensions.has("KHR_parallel_shader_compile")) renderer.compileAsync(scene, camera).catch(() => {}).then(wake);
  else wake();

  /* ---------- modelo .glb do artista ---------- */
  if (model) {
    loadModel(model)
      .catch((err) => console.warn("Não foi possível carregar o modelo 3D, mantendo o cristal:", err))
      .finally(() => { modelPending = false; wake(); });
  }

  async function loadModel(url) {
    const [{ GLTFLoader }, { RoomEnvironment }] = await Promise.all([
      import("three/addons/loaders/GLTFLoader.js"),
      import("three/addons/environments/RoomEnvironment.js"),
    ]);
    const gltf = await new GLTFLoader().loadAsync(url);
    const obj = gltf.scene || (gltf.scenes && gltf.scenes[0]);
    if (!obj) throw new Error("arquivo sem cena");

    // centraliza e ajusta a escala pela caixa envolvente
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = 2.5 / (Math.max(size.x, size.y, size.z) || 1);
    obj.position.sub(center);
    const holder = new THREE.Group();
    holder.add(obj);
    holder.scale.setScalar(s);

    // ambiente suave para texturas PBR, sem perder o clima escuro
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = env;
    scene.environmentIntensity = 0.3;
    // texturas PBR estouram com a lanterna do cristal: luz um pouco mais contida
    lampBase = 75;
    fill.intensity = 1.2;
    obj.traverse((o) => {
      if (o.isMesh && o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { if (m.map) m.map.anisotropy = 4; });
    });

    // troca o cristal pelo modelo e libera a memória do cristal (os rastros eram dos estilhaços)
    pivot.remove(content);
    crystal.dispose();
    trails.forEach((tr) => { scene.remove(tr.mesh); tr.geo.dispose(); tr.mat.dispose(); });
    trails = [];
    content = holder;
    pivot.add(holder);
    let flash = 0;
    crystal = {
      animate: (time, o, still) => { holder.position.y = still ? 0 : Math.sin(time * 0.9) * 0.04; },
      dispose: () => disposeTree(holder), group: holder,
      get flash() { return flash; }, set flash(v) { flash = v; }, set gather(v) {}, set boost(v) {},
    };
    tris = countTris(holder);
    usingModel = true;
    if (meta) meta.textContent = `Modelo 3D, ${tris.toLocaleString("pt-BR")} triângulos`;
    if (modelAlt) { baseLabel = modelAlt; applyLabel(); }
    wake();
  }

  return {
    // estado atual (útil para depurar no console: document.querySelector('#stage-view').hero3d.state())
    state: () => ({ yaw, pitch, tris, live: firstFrame && !dead, model: usingModel, mode: fxMode, tier: tierName, throttled, probe: probeResult, postfx: !!(composer && usePostfx()), running: !!raf }),
    setMode(m) {
      fxMode = m === "reduced" ? "reduced" : "full";
      trails.forEach((tr) => { tr.mesh.visible = tier.trails && fxMode === "full"; tr.reset(); });
      applyLabel();
      if (hint && hintText) hintText.textContent = fxMode === "full" ? (matchMedia("(pointer: coarse)").matches ? "Arraste para o lado ou toque" : "Arraste para girar, clique para energizar") : "Arraste para girar";
      needsFrame = true;
      wake();
    },
    async setTier(name) {
      if (!TIERS[name]) return;
      tierName = name; tier = TIERS[name]; autoTier = false; throttled = false;
      applyTier();
      await setupPostfx();
      if (finalPass) finalPass.uniforms.uCA.value = tier.ca ? 0.0035 : 0;
      wake();
    },
    burst: doBurst,
    setPaused(v) { paused = !!v; if (!paused) wake(); },
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("scroll", onScroll);
      if (crystal) crystal.dispose();
      burst.dispose();
      if (composer) composer.dispose();
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
      canvas.remove();
      view.classList.remove("is-live");
    },
  };
}
