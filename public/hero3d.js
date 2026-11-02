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

/* Monta o cristal procedural. Devolve o grupo e uma função de animação. */
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
    color: 0x34297a, emissive: 0x0a0720, roughness: 0.22, metalness: 0.2, flatShading: true,
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
  const coreGeo = keep(new THREE.OctahedronGeometry(0.17, 0));
  const core = new THREE.Mesh(coreGeo, keep(new THREE.MeshBasicMaterial({ color: 0xc4fff3 })));
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
    { r: 1.4, y: 0.7, a: 0.4, s: 0.22, sp: 0.3, seed: 11 },
    { r: 1.55, y: -0.25, a: 2.6, s: 0.17, sp: 0.24, seed: 23 },
    { r: 1.3, y: -0.95, a: 4.4, s: 0.12, sp: 0.36, seed: 31 },
  ].map((d) => {
    const m = new THREE.Mesh(keep(crystalGeometry({ sides: 5, r: 0.5, top: 1.1, shoulder: 0.35, waist: -0.4, bottom: -0.9, jitter: 0.16, seed: d.seed })), shardMat);
    m.scale.setScalar(d.s);
    m.rotation.set(d.seed * 0.3, d.seed, d.seed * 0.7);
    group.add(m);
    return { m, ...d };
  });

  // poeira no facho da lanterna
  const N = 46, rand = rng(99);
  const dust = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { dust[i * 3] = (rand() - 0.5) * 4.2; dust[i * 3 + 1] = (rand() - 0.5) * 3.4; dust[i * 3 + 2] = (rand() - 0.5) * 2.4 + 0.6; }
  const dustGeo = keep(new THREE.BufferGeometry());
  dustGeo.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  const motes = new THREE.Points(dustGeo, keep(new THREE.PointsMaterial({ color: 0xffe2b2, size: 0.022, transparent: true, opacity: 0.5, depthWrite: false })));

  const tris = countTris(group);

  const animate = (t) => {
    group.position.y = Math.sin(t * 0.9) * 0.06;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.6);
    glowMat.opacity = 0.5 + pulse * 0.25;
    coreLight.intensity = 2.6 + pulse * 1.2;
    core.rotation.y = t * 0.6;
    shards.forEach((d) => {
      const a = d.a + t * d.sp;
      d.m.position.set(Math.cos(a) * d.r, d.y + Math.sin(t * 0.8 + d.seed) * 0.08, Math.sin(a) * d.r);
      d.m.rotation.y += 0.004;
      d.m.rotation.x += 0.002;
    });
    for (let i = 0; i < N; i++) {
      let y = dust[i * 3 + 1] + 0.0016;
      if (y > 1.7) y = -1.7;
      dust[i * 3 + 1] = y;
    }
    dustGeo.attributes.position.needsUpdate = true;
  };

  const dispose = () => disposables.forEach((d) => d.dispose && d.dispose());
  return { group, motes, animate, dispose, tris };
}

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

export function startHero({ view, hero, gl = null, hint, hintText, meta, lantern, model, modelAlt, poster = false }) {
  const coarse = matchMedia("(pointer: coarse)").matches || innerWidth < 820;
  const dprCap = coarse ? 1.5 : 2;

  // usa o contexto já criado pelo main.js (um só contexto WebGL por página)
  const canvas = gl ? gl.canvas : document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, context: gl ? gl.context : undefined, antialias: true, alpha: true, powerPreference: "default", preserveDrawingBuffer: poster });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  camera.position.set(0, 0.28, 7.1);
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
  scene.add(crystal.motes);
  let content = crystal.group;
  let usingModel = false;
  let tris = crystal.tris;
  if (meta) meta.textContent = `Modelo low poly, ${tris} triângulos`;

  /* ---------- tamanho ---------- */
  let w = 0, h = 0, stageOff = { x: 0, y: 0 };
  const resize = () => {
    const r = view.getBoundingClientRect();
    const hr = hero.getBoundingClientRect();
    stageOff = { x: r.left - hr.left, y: r.top - hr.top };
    if (r.width === w && r.height === h) return;
    w = r.width; h = r.height;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsFrame = true;
  };

  /* ---------- órbita com inércia ---------- */
  let yaw = 0.35, pitch = REST_PITCH, vYaw = 0, vPitch = 0;
  let dragging = false, lastX = 0, lastY = 0, lastT = 0, lastInput = -1e9, pid = null, axis = null, sx = 0, sy = 0;

  const onDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    pid = e.pointerId; sx = lastX = e.clientX; sy = lastY = e.clientY; lastT = performance.now();
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
    if (!dragging) return;
    dragging = false;
    view.classList.remove("is-dragging");
    if (performance.now() - lastT > 80) vYaw = vPitch = 0; // soltou parado: sem arremesso
    lastInput = performance.now();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("lostpointercapture", onUp);

  // teclado: setas giram quando o palco está em foco
  const onKey = (e) => {
    const step = e.shiftKey ? 0.5 : 0.2;
    if (e.key === "ArrowLeft") vYaw = Math.max(-7, vYaw - step * 6);
    else if (e.key === "ArrowRight") vYaw = Math.min(7, vYaw + step * 6);
    else if (e.key === "ArrowUp") pitch = Math.max(PITCH_MIN, pitch - step);
    else if (e.key === "ArrowDown") pitch = Math.min(PITCH_MAX, pitch + step);
    else if (e.key === "Home") { yaw = 0.35; pitch = REST_PITCH; vYaw = 0; }
    else return;
    e.preventDefault();
    lastInput = performance.now();
    wake();
  };

  /* ---------- loop de render ---------- */
  let raf = 0, visible = true, last = 0, t = 0, needsFrame = true, firstFrame = false, dead = false;
  let modelPending = !!model; // com .glb configurado, o canvas só aparece quando ele carregar (ou falhar)
  const lampPos = new THREE.Vector3(-2, 2, 5), lampGoal = new THREE.Vector3();

  const aimLamp = (k) => {
    // posição da lanterna relativa ao centro do palco, em "larguras de palco"
    let dx = -0.16, dy = -0.2;
    if (lantern && lantern.ready && w) {
      dx = (lantern.x - stageOff.x - w / 2) / w;
      dy = (lantern.y - stageOff.y - h / 2) / h;
    }
    dx = Math.max(-1.3, Math.min(1.3, dx));
    dy = Math.max(-1.1, Math.min(1.1, dy));
    lampGoal.set(dx * 5.2, -dy * 4.2 + 0.4, 4.6 - Math.hypot(dx, dy) * 1.2);
    lampPos.lerp(lampGoal, k);
    lamp.position.copy(lampPos);
    lamp.intensity = lampBase * (0.72 + 0.28 * Math.min(1, Math.hypot(dx, dy) / 0.6)); // de frente ofusca: suaviza
    fill.position.set(lampPos.x * 0.6, lampPos.y * 0.6, 3);
    lamp.target.position.set(0, 0.1, 0);
  };

  const frame = (now) => {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    t += dt;

    if (!dragging) {
      // inércia, e depois de um tempo parado volta a girar sozinho
      const decay = Math.exp(-dt * 3.2);
      vYaw *= decay; vPitch *= decay;
      yaw += vYaw * dt;
      pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch + vPitch * dt));
      const idle = now - lastInput > IDLE_MS;
      if (idle) {
        const ease = Math.min(1, (now - lastInput - IDLE_MS) / 1500);
        yaw += AUTO_SPEED * ease * dt;
        pitch += (REST_PITCH - pitch) * (1 - Math.exp(-dt * 0.8));
      }
    }
    pivot.rotation.set(pitch, yaw, 0);
    crystal && crystal.animate(t);
    aimLamp(1 - Math.exp(-dt * 8));
    renderer.render(scene, camera);

    if (!firstFrame && !modelPending) {
      firstFrame = true;
      view.appendChild(canvas);
      requestAnimationFrame(() => view.classList.add("is-live"));
      activateUi();
    }
    if (visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const wake = () => { if (!raf && !dead && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };

  let baseLabel = view.getAttribute("aria-label") || "Modelo 3D";
  let uiActive = false;
  const applyLabel = () => {
    if (uiActive) view.setAttribute("aria-label", `${baseLabel}. Modelo 3D interativo: arraste ou use as setas do teclado para girar.`);
  };
  const activateUi = () => {
    view.tabIndex = 0;
    uiActive = true;
    applyLabel();
    view.addEventListener("keydown", onKey);
    if (hint) {
      if (hintText && matchMedia("(pointer: coarse)").matches) hintText.textContent = "Arraste para o lado para girar";
      hint.hidden = false;
    }
  };

  /* ---------- pausa fora da tela / aba escondida ---------- */
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
  aimLamp(1); // começa com a luz no mesmo lugar do pôster, para o fade não "pular"

  if (poster) {
    // modo usado só para gerar a imagem estática (assets/hero-crystal-*.webp)
    t = 0; yaw = 0.35; pitch = REST_PITCH;
    pivot.rotation.set(pitch, yaw, 0);
    crystal.animate(0);
    lampPos.set(0, 0, 0); aimLamp(1);
    renderer.render(scene, camera);
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

    // troca o cristal pelo modelo e libera a memória do cristal
    pivot.remove(content);
    scene.remove(crystal.motes);
    crystal.dispose();
    crystal = null;
    content = holder;
    pivot.add(holder);
    const idle = (time) => { holder.position.y = Math.sin(time * 0.9) * 0.04; };
    crystal = { animate: idle, dispose: () => disposeTree(holder), group: holder, motes: new THREE.Object3D() };
    tris = countTris(holder);
    usingModel = true;
    if (meta) meta.textContent = `Modelo 3D, ${tris.toLocaleString("pt-BR")} triângulos`;
    if (modelAlt) { baseLabel = modelAlt; applyLabel(); }
    wake();
  }

  return {
    // estado atual (útil para depurar no console: document.querySelector('#stage-view').hero3d.state())
    state: () => ({ yaw, pitch, tris, live: firstFrame && !dead, model: usingModel }),
    dispose() {
      dead = true;
      cancelAnimationFrame(raf);
      io.disconnect(); ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      if (crystal) crystal.dispose();
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
      canvas.remove();
      view.classList.remove("is-live");
    },
  };
}
