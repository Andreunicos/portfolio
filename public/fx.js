/* ============================================================
   Efeitos do modo completo (carregado por main.js depois do "load").
   Cada parte pode ser desligada no CONFIG do main.js. stop() desfaz tudo
   quando a pessoa troca para "Efeitos: Reduzido".
   ============================================================ */

// mesmos tempos e curvas do CSS (--t-fast, --t-med, --ease-out...)
const T = { fast: 180, med: 420, slow: 900, wipeIn: 230, wipeOut: 320 };
const easeOut = (t) => 1 - Math.pow(1 - t, 4);
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

let ctx = null;
let running = false;
let cleanups = [];
let lenis = null;
const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); cleanups.push(() => target.removeEventListener(type, fn, opts)); };

// CSS da fase 3 usado só aqui (portal, tela VHS do House of Photh, cor dos rótulos do cursor)
const CSS = `.fx-portal { position: fixed; left: 0; top: 0; z-index: 95; image-rendering: pixelated; -webkit-tap-highlight-color: transparent; pointer-events: auto; cursor: progress; } .fx-vhs .hero-shot { position: relative; } .fx-vhs .hero-shot::before, .fx-vhs .hero-shot::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity var(--t-med) var(--ease-out); } .fx-vhs .hero-shot::before { z-index: 2; mix-blend-mode: screen; background: repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0 1px, transparent 1px 3px), url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.1' numOctaves='1' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.6 -.6'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)'/%3E%3C/svg%3E") 0 0 / 120px 120px; } .fx-vhs .hero-shot::after { z-index: 2; background: linear-gradient(180deg, transparent 0, rgba(220, 230, 255, 0.1) 46%, rgba(255, 255, 255, 0.18) 50%, transparent 56%) 0 -40% / 100% 30% no-repeat; } .fx-vhs:hover .hero-shot::before { opacity: 0.4; animation: vhs-noise 0.5s steps(1) infinite; } .fx-vhs:hover .hero-shot::after { opacity: 1; animation: vhs-track 2.8s linear infinite; } .fx-vhs .hero-shot img { transition: filter var(--t-med); } .fx-vhs:hover .hero-shot img { filter: saturate(0.7) contrast(1.12) brightness(0.92); animation: vhs-jitter 3.2s steps(1) infinite; } @keyframes vhs-noise { 0% { background-position: 0 0, 0 0; } 33% { background-position: 0 1px, -40px 22px; } 66% { background-position: 0 2px, 31px -17px; } } @keyframes vhs-track { from { background-position: 0 -40%; } to { background-position: 0 140%; } } @keyframes vhs-jitter { 0%, 100% { translate: 0 0; } 61% { translate: -2px 0; } 63% { translate: 1px 0; } 65% { translate: 0 0; } } .fx-label { background: var(--lc, var(--accent)); transition: opacity var(--t-fast), scale var(--t-fast) var(--ease-snap), background-color var(--t-fast); }`;
let styleEl = null;

export function start(c) {
  if (running) return;
  running = true;
  ctx = c;
  if (!styleEl) { styleEl = document.createElement("style"); styleEl.textContent = CSS; document.head.appendChild(styleEl); }
  const C = ctx.CONFIG;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  overlay.init(fine);
  if (C.smooth && fine) startLenis();
  if (C.scrollFx) { headings(); parallaxMedia(); marquee(); dock(); }
  if (C.cardFx) { gallery(fine); if (fine) { tilt(); cardVfx(); } }
  if (C.gameFx && fine) gameFx();
  if (C.cursor && fine) cursor();
  hudBursts();
  if (C.portal) portal();
  else if (C.wipe) anchors();
}

export function stop() {
  if (!running) return;
  running = false;
  cleanups.splice(0).reverse().forEach((f) => { try { f(); } catch (e) { /* segue */ } });
  if (lenis) { lenis.destroy(); lenis = null; }
  overlay.destroy();
}

// cor do acompanhante do cursor em cada forma/seção (o rótulo usa a mesma cor)
const CUR = { crystal: "#8dffe6", ring: "#d9dde4", loupe: "#ffe3b8", cross: "#c6b5ff", cube: "#2cf5c0", seal: "#ffd27a", mail: "#eceef2" };
// seção (id) -> forma
const SECTION_SHAPE = { hero: "crystal", sobre: "ring", galeria: "loupe", jogos: "cross", assets: "cube", certificados: "seal", contato: "mail" };

/* ------------------------------------------------------------
   Camada 2D de partículas (uma só, por cima da página, sem eventos)
   ------------------------------------------------------------ */
const overlay = (() => {
  let cv = null, g = null, W = 0, H = 0, DPR = 1, raf = 0, max = 220;
  const P = [];
  const emitters = new Set();
  let cursor = null; // { x, y, gx, gy, on }
  const resize = () => {
    DPR = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  };
  const loop = (now) => {
    raf = 0;
    if (!cv) return;
    const dt = Math.min(0.05, (now - (loop.last || now)) / 1000);
    loop.last = now;
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    g.clearRect(0, 0, W, H);
    emitters.forEach((em) => em.tick(dt, now));
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i];
      p.t += dt;
      if (p.t >= p.life) { P.splice(i, 1); continue; }
      const k = p.t / p.life;
      if (p.tx !== undefined) {
        // vai até um alvo (voxels que se montam, blocos da pilha) e fica lá até apagar
        const e = easeOut(Math.min(1, p.t / p.travel));
        p.x = p.sx + (p.tx - p.sx) * e; p.y = p.sy + (p.ty - p.sy) * e; p.rot = p.rot0 * (1 - e);
      } else {
        if (p.kind === "drip" && p.t < p.hang) p.vy = 0; // gota de slime "pendurada" antes de escorrer
        p.vx *= Math.exp(-dt * p.drag); p.vy *= Math.exp(-dt * p.drag);
        p.vy += (p.kind === "drip" && p.t < p.hang ? 0 : p.grav) * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      }
      draw(p, k, now);
    }
    if (cursor && cursor.on) drawCursor(dt);
    if (P.length || emitters.size || (cursor && cursor.on && cursor.moving)) raf = requestAnimationFrame(loop);
    else loop.last = 0;
  };
  const kick = () => { if (cv && !raf) raf = requestAnimationFrame(loop); };
  const star = (x, y, r, rot, color, a) => {
    g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; g.fillStyle = color;
    g.beginPath();
    g.moveTo(0, -r); g.lineTo(r * 0.22, -r * 0.22); g.lineTo(r, 0); g.lineTo(r * 0.22, r * 0.22);
    g.lineTo(0, r); g.lineTo(-r * 0.22, r * 0.22); g.lineTo(-r, 0); g.lineTo(-r * 0.22, -r * 0.22);
    g.closePath(); g.fill(); g.restore();
  };
  const draw = (p, k, now) => {
    const a = p.a * (1 - k);
    if (p.kind === "shard") {
      g.globalCompositeOperation = "lighter";
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.globalAlpha = a; g.fillStyle = p.color;
      const s = p.size * (1 - k * 0.5);
      g.beginPath(); g.moveTo(0, -s * 1.5); g.lineTo(s * 0.7, 0); g.lineTo(0, s * 1.5); g.lineTo(-s * 0.7, 0); g.closePath(); g.fill(); g.restore();
    } else if (p.kind === "glint") {
      g.globalCompositeOperation = "lighter";
      star(p.x, p.y, p.size * (1 - k * 0.6), p.rot, p.color, a);
    } else if (p.kind === "ember") {
      g.globalCompositeOperation = "lighter";
      const fl = 0.65 + 0.35 * Math.sin(now / 45 + p.seed * 20);
      g.globalAlpha = a * fl;
      g.fillStyle = k < 0.4 ? "#ffd27a" : k < 0.75 ? "#ff8a3d" : "#c2361f";
      g.beginPath(); g.arc(p.x + Math.sin(p.t * 6 + p.seed * 9) * 3, p.y, p.size * (1 - k * 0.5), 0, Math.PI * 2); g.fill();
    } else if (p.kind === "pixel") {
      // 1-bit: aceso ou apagado, alinhado a uma grade de 3px
      g.globalCompositeOperation = "source-over";
      const onPx = Math.sin(p.t * 14 + p.seed * 7) > -0.2 && k < 0.9;
      if (onPx) { g.globalAlpha = 1; g.fillStyle = "#f4f4f4"; g.fillRect(Math.round(p.x / 3) * 3, Math.round(p.y / 3) * 3, p.size, p.size); }
    } else if (p.kind === "voxel") {
      // cubinho isométrico de 3 faces
      g.globalCompositeOperation = "source-over";
      const s = p.size, h = s * 0.5, w = s * 0.866, fade = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      g.save(); g.translate(Math.round(p.x), Math.round(p.y)); g.rotate(p.rot); g.globalAlpha = Math.min(1, p.t * 6) * fade;
      const face = (c, pts) => { g.fillStyle = c; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
      face(p.c[0], [[0, -h], [w, -h / 2], [0, 0], [-w, -h / 2]]);
      face(p.c[1], [[-w, -h / 2], [0, 0], [0, h], [-w, h / 2]]);
      face(p.c[2], [[w, -h / 2], [0, 0], [0, h], [w, h / 2]]);
      g.restore();
    } else if (p.kind === "drip") {
      // gota de slime: cresce pendurada, depois escorre esticando
      g.globalCompositeOperation = "source-over";
      const grow = Math.min(1, p.t / p.hang), r = p.size * (0.35 + 0.65 * grow);
      const tail = p.t < p.hang ? r * (0.6 + grow) : r + Math.min(26, p.vy * 0.08);
      g.globalAlpha = 0.9 * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1);
      g.fillStyle = p.color;
      g.beginPath();
      g.moveTo(p.x, p.y - tail);
      g.quadraticCurveTo(p.x + r * 0.95, p.y - r * 0.4, p.x + r, p.y);
      g.arc(p.x, p.y, r, 0, Math.PI);
      g.quadraticCurveTo(p.x - r * 0.95, p.y - r * 0.4, p.x, p.y - tail);
      g.fill();
      if (p.t < p.hang) { g.fillRect(p.x - r * 0.35, p.y0, r * 0.7, p.y - p.y0); }
      g.fillStyle = "rgba(255,255,255,0.55)"; g.fillRect(Math.round(p.x - r * 0.45), Math.round(p.y - r * 0.4), Math.max(1, r * 0.3), Math.max(1, r * 0.3));
    } else if (p.kind === "bubble") {
      g.globalCompositeOperation = "lighter";
      g.globalAlpha = 0.7 * (1 - k);
      g.strokeStyle = p.color; g.lineWidth = 1.2;
      g.beginPath(); g.arc(p.x + Math.sin(p.t * 5 + p.seed * 6) * 3, p.y, p.size * (0.6 + k * 0.6), 0, Math.PI * 2); g.stroke();
    } else if (p.kind === "block") {
      // bloco da pilha (Big Stack): desliza de lado e encaixa
      g.globalCompositeOperation = "source-over";
      g.globalAlpha = p.a * (k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1);
      g.fillStyle = p.color; g.fillRect(Math.round(p.x - p.w / 2), Math.round(p.y), Math.round(p.w), p.size);
      g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(Math.round(p.x - p.w / 2), Math.round(p.y + p.size - 2), Math.round(p.w), 2);
    } else if (p.kind === "ripple") {
      // onda na lagoa (Capivaras): elipse achatada que abre e some
      // traço escuro por baixo + claro por cima: lê bem sobre as capturas coloridas
      g.globalCompositeOperation = "source-over";
      const e = easeOut(k), rx = 3 + e * p.size;
      g.globalAlpha = 0.9 * (1 - e);
      g.lineWidth = 3; g.strokeStyle = "rgba(4,18,13,0.45)";
      g.beginPath(); g.ellipse(p.x, p.y, rx, rx * 0.32, 0, 0, Math.PI * 2); g.stroke();
      g.lineWidth = 1.4; g.strokeStyle = p.color; g.stroke();
      if (e > 0.25) { g.globalAlpha = 0.6 * (1 - e); g.beginPath(); g.ellipse(p.x, p.y, rx * 0.55, rx * 0.55 * 0.32, 0, 0, Math.PI * 2); g.stroke(); }
    } else if (p.kind === "leaf") {
      g.globalCompositeOperation = "source-over";
      g.save(); g.translate(p.x + Math.sin(p.t * 2.2 + p.seed * 9) * 10, p.y); g.rotate(p.rot + Math.sin(p.t * 2.2) * 0.6);
      g.globalAlpha = 0.85 * (k > 0.7 ? 1 - (k - 0.7) / 0.3 : Math.min(1, p.t * 3));
      g.fillStyle = p.color; g.beginPath(); g.ellipse(0, 0, p.size, p.size * 0.42, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    } else if (p.kind === "ring") {
      g.globalCompositeOperation = "lighter";
      const e = easeOut(k);
      g.globalAlpha = p.a * (1 - e);
      g.strokeStyle = p.color; g.lineWidth = 1.5;
      g.beginPath(); g.arc(p.x, p.y, 4 + e * p.size, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
  };
  // formas do acompanhante do cursor (fase 3: uma por seção). x, y = centro; s = escala; a = opacidade
  const line = (pts, close) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); g.stroke(); };
  const SHAPES = {
    crystal(x, y, s, a, c) {
      const r = (c.hot ? 9 : 6) * s;
      star(x, y, r, c.rot, CUR.crystal, 0.95 * a);
      star(x, y, r * 0.45, -c.rot, "#ffffff", 0.9 * a);
    },
    ring(x, y, s, a, c) { // Sobre: discreto, quase o cursor normal
      g.globalAlpha = 0.8 * a; g.strokeStyle = CUR.ring; g.lineWidth = 1.2;
      g.beginPath(); g.arc(x, y, (c.hot ? 6 : 4.5) * s, 0, Math.PI * 2); g.stroke();
      g.fillStyle = CUR.ring; g.fillRect(x - 0.75, y - 0.75, 1.5, 1.5);
    },
    loupe(x, y, s, a, c) { // Galeria: lupa
      const r = (c.hot ? 6 : 5) * s;
      g.globalAlpha = a; g.strokeStyle = CUR.loupe; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
      line([[x + r * 0.72, y + r * 0.72], [x + r * 1.7, y + r * 1.7]]);
      if (c.hot) { line([[x - r * 0.45, y], [x + r * 0.45, y]]); line([[x, y - r * 0.45], [x, y + r * 0.45]]); }
    },
    cross(x, y, s, a, c) { // Jogos: mira que "trava" em cima de botão
      const r = (c.hot ? 4 : 6) * s, t = 3.2 * s;
      g.globalAlpha = a; g.strokeStyle = CUR.cross; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
      line([[x - r - t, y], [x - r + 1.5, y]]); line([[x + r - 1.5, y], [x + r + t, y]]);
      line([[x, y - r - t], [x, y - r + 1.5]]); line([[x, y + r - 1.5], [x, y + r + t]]);
      g.fillStyle = CUR.cross; g.fillRect(x - 1, y - 1, 2, 2);
    },
    cube(x, y, s, a, c) { // Assets: cubo isométrico
      const h = (c.hot ? 7 : 5.5) * s, w = h * 0.866;
      g.globalAlpha = 0.22 * a; g.fillStyle = CUR.cube;
      g.beginPath(); g.moveTo(x, y - h); g.lineTo(x + w, y - h / 2); g.lineTo(x, y); g.lineTo(x - w, y - h / 2); g.closePath(); g.fill();
      g.globalAlpha = a; g.strokeStyle = CUR.cube; g.lineWidth = 1.3;
      line([[x, y - h], [x + w, y - h / 2], [x + w, y + h / 2], [x, y + h], [x - w, y + h / 2], [x - w, y - h / 2]], true);
      line([[x - w, y - h / 2], [x, y], [x + w, y - h / 2]]); line([[x, y], [x, y + h]]);
    },
    seal(x, y, s, a, c) { // Formação: selo de 8 pontas girando devagar
      const R = (c.hot ? 7.5 : 6) * s, r = R * 0.72;
      g.globalAlpha = a; g.strokeStyle = CUR.seal; g.lineWidth = 1.3;
      const pts = [];
      for (let i = 0; i < 16; i++) { const ang = c.rot * 0.5 + (i / 16) * Math.PI * 2, rr = i % 2 ? r : R; pts.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr]); }
      line(pts, true);
      g.fillStyle = CUR.seal; g.beginPath(); g.arc(x, y, 1.6 * s, 0, Math.PI * 2); g.fill();
    },
    mail(x, y, s, a, c) { // Contato: envelope (a aba abre em cima de botão)
      const w = 7 * s, h = 5 * s;
      g.globalAlpha = a; g.strokeStyle = CUR.mail; g.lineWidth = 1.3;
      g.strokeRect(x - w, y - h, w * 2, h * 2);
      line(c.hot ? [[x - w, y - h], [x, y - h * 2.1], [x + w, y - h]] : [[x - w, y - h], [x, y + h * 0.15], [x + w, y - h]]);
    },
  };
  const drawCursor = (dt) => {
    const c = cursor;
    const k = 1 - Math.exp(-dt * 22);
    c.gx += (c.x - c.gx) * k; c.gy += (c.y - c.gy) * k;
    c.rot += dt * 1.6;
    // troca de forma: a antiga encolhe e some, a nova cresce (150 ms)
    c.m = Math.min(1, c.m + dt / 0.15);
    const e = easeOut(c.m), x = c.gx + 13, y = c.gy + 15;
    // o cristal soma luz; as outras formas ganham um halo escuro para ler bem sobre botões claros
    const drawShape = (name, sc, al) => {
      if (name === "crystal") { g.globalCompositeOperation = "lighter"; g.shadowBlur = 0; }
      else { g.globalCompositeOperation = "source-over"; g.shadowColor = "rgba(4,8,12,0.75)"; g.shadowBlur = 3; }
      (SHAPES[name] || SHAPES.crystal)(x, y, sc, al, c);
    };
    if (c.m < 1 && c.from && SHAPES[c.from]) drawShape(c.from, 1 - 0.45 * e, 1 - e);
    drawShape(c.shape, 0.55 + 0.45 * e, e);
    g.shadowBlur = 0; g.globalAlpha = 1;
    c.moving = Math.abs(c.x - c.gx) + Math.abs(c.y - c.gy) > 0.3 || c.m < 1;
    g.globalCompositeOperation = "source-over";
  };
  return {
    init(fine) {
      if (cv) return;
      max = fine ? 220 : 80;
      cv = document.createElement("canvas");
      cv.className = "fx-canvas";
      cv.setAttribute("aria-hidden", "true");
      document.body.appendChild(cv);
      g = cv.getContext("2d");
      resize();
      addEventListener("resize", resize);
    },
    destroy() {
      if (!cv) return;
      cancelAnimationFrame(raf); raf = 0;
      removeEventListener("resize", resize);
      cv.remove(); cv = null; g = null;
      P.length = 0; emitters.clear(); cursor = null;
    },
    emit(kind, x, y, o = {}) {
      if (!cv || P.length >= max) return;
      P.push({
        kind, x, y, vx: o.vx || 0, vy: o.vy || 0, life: o.life || 0.6, t: 0, size: o.size || 3, rot: o.rot || 0, vr: o.vr || 0,
        drag: o.drag ?? 2.5, grav: o.grav || 0, color: o.color || "#8dffe6", a: o.a ?? 1, seed: Math.random(),
        ...(o.extra || {}),
      });
      kick();
    },
    burst(x, y, n = 14, colors = ["#8dffe6", "#a98bff", "#ffffff"]) {
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + Math.random() * 0.4, sp = 90 + Math.random() * 150;
        this.emit("shard", x, y, { vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, life: 0.55 + Math.random() * 0.35, size: 2 + Math.random() * 2.2, rot: ang, vr: (Math.random() - 0.5) * 10, drag: 4, color: colors[i % colors.length] });
      }
      this.emit("ring", x, y, { life: 0.6, size: 26, color: "#8dffe6", a: 0.9 });
    },
    addEmitter(em) { emitters.add(em); kick(); },
    removeEmitter(em) { emitters.delete(em); },
    setCursor(c) { cursor = c; kick(); },
    kick,
  };
})();

/* ------------------------------------------------------------
   Rolagem suave (só computador com mouse)
   ------------------------------------------------------------ */
async function startLenis() {
  try {
    const { default: Lenis } = await import("lenis");
    if (!running) return;
    lenis = new Lenis({ autoRaf: true, lerp: 0.11, smoothWheel: true, anchors: false, stopInertiaOnNavigate: true });
  } catch (err) { console.warn("Rolagem suave indisponível:", err); }
}

/* ------------------------------------------------------------
   Títulos das seções: palavras dissolvem em pontilhado ao entrar na tela
   ------------------------------------------------------------ */
function headings() {
  const list = [...document.querySelectorAll("main section h2")].filter((h) => h.getBoundingClientRect().top > innerHeight * 0.9 && !h.children.length);
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const h = en.target;
    io.unobserve(h);
    h.classList.remove("pending");
    h.classList.add("go");
  }), { threshold: 0.35 });
  list.forEach((h) => {
    if (!h.dataset.split) {
      h.dataset.split = "1";
      const words = h.textContent.trim().split(/\s+/);
      h.innerHTML = words.map((w, i) => `<span class="w" style="--i:${i}">${w.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</span>`).join(" ");
    }
    h.classList.add("fx-words", "pending");
    io.observe(h);
  });
  cleanups.push(() => { io.disconnect(); list.forEach((h) => h.classList.remove("fx-words", "pending", "go")); });
}

/* ------------------------------------------------------------
   Parallax das imagens dos projetos (só transform)
   ------------------------------------------------------------ */
function parallaxMedia() {
  const items = [...document.querySelectorAll(".project")];
  const vis = new Set();
  items.forEach((el) => el.classList.add("fx-par"));
  const io = new IntersectionObserver((es) => es.forEach((en) => (en.isIntersecting ? vis.add(en.target) : vis.delete(en.target))));
  items.forEach((el) => io.observe(el));
  let ticking = false;
  const update = () => {
    ticking = false;
    vis.forEach((el) => {
      const r = el.getBoundingClientRect();
      const k = clamp((r.top + r.height / 2 - innerHeight / 2) / innerHeight, -1, 1);
      el.style.setProperty("--sp", (k * -26).toFixed(1) + "px");
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  on(window, "scroll", onScroll, { passive: true });
  update();
  cleanups.push(() => { io.disconnect(); items.forEach((el) => { el.classList.remove("fx-par"); el.style.removeProperty("--sp"); }); });
}

/* ------------------------------------------------------------
   Faixa de ferramentas: inclina com a velocidade da rolagem, pausa fora da tela
   ------------------------------------------------------------ */
function marquee() {
  const mq = document.querySelector(".marquee");
  const track = document.getElementById("mq-track");
  if (!mq || !track) return;
  const io = new IntersectionObserver(([en]) => mq.classList.toggle("paused", !en.isIntersecting));
  io.observe(mq);
  let lastY = scrollY, skew = 0, raf = 0;
  const tick = () => {
    raf = 0;
    const v = scrollY - lastY; lastY = scrollY;
    skew += (clamp(-v * 0.35, -9, 9) - skew) * 0.18;
    track.style.setProperty("--skew", skew.toFixed(2) + "deg");
    if (Math.abs(skew) > 0.05 || v !== 0) raf = requestAnimationFrame(tick);
    else track.style.setProperty("--skew", "0deg");
  };
  on(window, "scroll", () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
  cleanups.push(() => { io.disconnect(); cancelAnimationFrame(raf); track.style.removeProperty("--skew"); mq.classList.remove("paused"); });
}

/* ------------------------------------------------------------
   Encaixe: ao rolar, o cristal encolhe e voa para o topo do HUD (telas largas)
   ------------------------------------------------------------ */
function dock() {
  const stage = document.getElementById("hero-stage");
  const copy = document.querySelector(".hero-copy");
  const hero = ctx.heroEl;
  const rail = document.getElementById("xp");
  if (!stage || !hero || !copy) return;
  let geo = null, ticking = false, docked = false;
  const measure = () => {
    const prev = stage.style.transform;
    stage.style.transform = "none";
    const r = stage.getBoundingClientRect();
    stage.style.transform = prev;
    const wide = innerWidth >= 1300 && rail && !rail.hidden;
    let tx = innerWidth - 36, ty = 90;
    if (wide) { const x = rail.getBoundingClientRect(); tx = x.left + x.width / 2; ty = x.top - 18; }
    geo = { cx: r.left + r.width / 2, cy: r.top + r.height / 2 + scrollY, w: r.width, wide, tx, ty, hh: hero.offsetHeight };
  };
  const update = () => {
    ticking = false;
    if (!geo) measure();
    const y = scrollY;
    const p = clamp(y / (geo.hh * 0.8), 0, 1);
    if (geo.wide) {
      const e = easeInOut(p);
      const startVY = geo.cy - 0; // centro na tela com rolagem 0
      const dx = (geo.tx - geo.cx) * e;
      const dy = y + (geo.ty - startVY) * e;
      const s = 1 + (28 / geo.w - 1) * e;
      stage.style.transform = p > 0 ? `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${s.toFixed(4)})` : "";
      stage.style.opacity = p > 0.82 ? String(clamp(1 - (p - 0.82) / 0.18, 0, 1)) : "";
    } else {
      stage.style.transform = p > 0 ? `translate3d(0, ${(y * 0.3).toFixed(1)}px, 0) scale(${(1 - p * 0.18).toFixed(4)})` : "";
      stage.style.opacity = p > 0 ? String(1 - p * 0.6) : "";
    }
    copy.style.transform = p > 0 ? `translate3d(0, ${(y * -0.12).toFixed(1)}px, 0)` : "";
    copy.style.opacity = p > 0.15 ? String(clamp(1 - (p - 0.15) * 1.1, 0.15, 1)) : "";
    stage.classList.toggle("docking", p > 0.02);
    const api = ctx.stageView && ctx.stageView.hero3d;
    if (api && api.setPaused) api.setPaused(p >= 1);
    // chegou no HUD: o cristal "entra" no trilho com uma faísca
    if (geo.wide && p >= 1 && !docked) { docked = true; overlay.burst(geo.tx, geo.ty, 12); }
    if (p < 0.95) docked = false;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const onResize = () => { measure(); onScroll(); };
  on(window, "scroll", onScroll, { passive: true });
  on(window, "resize", onResize);
  // espera as fontes/imagens assentarem antes de medir
  setTimeout(onResize, 50);
  cleanups.push(() => {
    stage.style.transform = ""; stage.style.opacity = ""; copy.style.transform = ""; copy.style.opacity = "";
    stage.classList.remove("docking");
    const api = ctx.stageView && ctx.stageView.hero3d;
    if (api && api.setPaused) api.setPaused(false);
  });
}

/* ------------------------------------------------------------
   Galeria: cada arte entra em 1-bit e ganha cor (também as do "Carregar mais")
   ------------------------------------------------------------ */
function gallery(fine) {
  const box = document.getElementById("gallery");
  if (!box) return;
  let batch = 0;
  const io = new IntersectionObserver((es) => es.forEach((en) => {
    if (!en.isIntersecting) return;
    const el = en.target;
    io.unobserve(el);
    el.style.setProperty("--d", (batch++ % 4) * 70 + "ms");
    el.classList.remove("art-pending");
    el.classList.add("art-in");
    const img = el.querySelector("img");
    const done = () => el.classList.remove("art-in");
    (img || el).addEventListener("animationend", done, { once: true });
    setTimeout(done, 2200);
  }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  setTimeout(() => (batch = 0), 0);
  const prep = (el) => {
    if (!el.classList || !el.classList.contains("art") || el.dataset.fx) return;
    el.dataset.fx = "1";
    if (fine) el.classList.add("fx-tilt");
    if (el.getBoundingClientRect().top > innerHeight * 0.95) { el.classList.add("art-pending"); io.observe(el); }
  };
  [...box.children].forEach(prep);
  const mo = new MutationObserver((ms) => { batch = 0; ms.forEach((m) => m.addedNodes.forEach(prep)); });
  mo.observe(box, { childList: true });
  cleanups.push(() => {
    mo.disconnect(); io.disconnect();
    box.querySelectorAll(".art").forEach((el) => { el.classList.remove("art-pending", "art-in", "fx-tilt"); delete el.dataset.fx; });
  });
}

/* ------------------------------------------------------------
   Inclinação 3D + brilho que segue o mouse (galeria, cards, projetos)
   ------------------------------------------------------------ */
const TILT = [
  [".art", 7], [".game", 6], [".asset", 6], [".cert", 5], [".project", 2.2],
];
function tilt() {
  const sel = TILT.map((t) => t[0]).join(",");
  const els = [...document.querySelectorAll(".game, .asset, .cert, .project")];
  els.forEach((el) => el.classList.add("fx-tilt"));
  let cur = null, raf = 0, lx = 0, ly = 0;
  const reset = (el) => {
    el.classList.remove("tilting");
    ["--rx", "--ry", "--gx", "--gy"].forEach((v) => el.style.removeProperty(v));
    const media = el.classList.contains("project") && el.querySelector(".p-media");
    if (media) { media.style.removeProperty("--px"); media.style.removeProperty("--py"); el.firstElementChild.style.removeProperty("--px"); }
  };
  const apply = () => {
    raf = 0;
    if (!cur) return;
    const r = cur.getBoundingClientRect();
    const px = clamp((lx - r.left) / r.width, 0, 1), py = clamp((ly - r.top) / r.height, 0, 1);
    const deg = (TILT.find((t) => cur.matches(t[0])) || [0, 4])[1];
    cur.classList.add("tilting");
    cur.style.setProperty("--rx", ((0.5 - py) * deg).toFixed(2) + "deg");
    cur.style.setProperty("--ry", ((px - 0.5) * deg).toFixed(2) + "deg");
    cur.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
    cur.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
    if (cur.classList.contains("project")) {
      // camadas: a mídia anda mais que o texto (profundidade)
      const media = cur.querySelector(".p-media");
      if (media) { media.style.setProperty("--px", ((px - 0.5) * 16).toFixed(1) + "px"); media.style.setProperty("--py", ((py - 0.5) * 10).toFixed(1) + "px"); }
      cur.firstElementChild.style.setProperty("--px", ((px - 0.5) * -6).toFixed(1) + "px");
    }
  };
  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    const el = e.target.closest && e.target.closest(sel);
    if (el !== cur) { if (cur) reset(cur); cur = el && el.classList.contains("fx-tilt") ? el : null; }
    lx = e.clientX; ly = e.clientY;
    if (cur && !raf) raf = requestAnimationFrame(apply);
  };
  on(document, "pointermove", onMove, { passive: true });
  on(document, "pointerleave", () => { if (cur) reset(cur); cur = null; });
  cleanups.push(() => { cancelAnimationFrame(raf); els.forEach((el) => { reset(el); el.classList.remove("fx-tilt"); }); });
}

/* ------------------------------------------------------------
   VFX temáticos nos cards: brasas (terror), pixels 1-bit (jam), brilhos (cristal)
   ------------------------------------------------------------ */
function cardVfx() {
  const defs = [];
  const horror = document.querySelector("#unreal .p-media");
  const onebit = document.querySelector("#god-of-small-things .p-media");
  const crystalCard = [...document.querySelectorAll(".game")].find((g) => /Cristal/.test(g.textContent));
  if (horror) defs.push([horror, "ember", 30]);
  if (onebit) defs.push([onebit, "pixel", 26]);
  if (crystalCard) defs.push([crystalCard.querySelector(".shots") || crystalCard, "glint", 14]);
  defs.forEach(([el, kind, rate]) => {
    let em = null;
    const enter = () => {
      let r = el.getBoundingClientRect(), acc = 0, lastR = performance.now();
      em = {
        tick(dt, now) {
          if (now - lastR > 200) { r = el.getBoundingClientRect(); lastR = now; }
          acc += dt * rate;
          while (acc >= 1) {
            acc -= 1;
            if (kind === "ember") overlay.emit("ember", r.left + Math.random() * r.width, r.bottom - 4, { vx: (Math.random() - 0.5) * 18, vy: -40 - Math.random() * 60, life: 1 + Math.random() * 0.9, size: 1.2 + Math.random() * 1.6, drag: 0.6 });
            else if (kind === "pixel") overlay.emit("pixel", r.left + Math.random() * r.width, r.top + Math.random() * r.height, { life: 0.5 + Math.random() * 0.6, size: 3, drag: 0 });
            else overlay.emit("glint", r.left + Math.random() * r.width, r.top + Math.random() * r.height, { life: 0.7 + Math.random() * 0.5, size: 4 + Math.random() * 5, rot: Math.random(), vr: 1.5, drag: 0, color: Math.random() < 0.7 ? "#8dffe6" : "#ffffff" });
          }
        },
      };
      overlay.addEmitter(em);
    };
    const leave = () => { if (em) overlay.removeEmitter(em); em = null; };
    on(el, "pointerenter", enter);
    on(el, "pointerleave", leave);
    cleanups.push(leave);
  });
}

/* ------------------------------------------------------------
   Fase 3: hover com identidade própria em cada jogo (só mouse).
   Cada efeito só existe enquanto o mouse está em cima E o card está na tela.
   ------------------------------------------------------------ */
const VOX = [["#8dffe6", "#2cf5c0", "#12866a"], ["#d8dce3", "#9aa1ac", "#5b616b"], ["#c6b5ff", "#8b5cf6", "#4f2fa8"]];
function gameFx() {
  const q = (s) => document.querySelector(s);
  const game = (re) => [...document.querySelectorAll(".game")].find((g) => re.test(g.textContent));
  const defs = [];
  // o Mystic Slime perde a coluna de imagens se a API do Roblox falhar: aí as gotas escorrem do card inteiro
  const blox = q("#roblox .hero-shot"), slime = q('[data-place="70698901839021"] .hero-shot') || q('[data-place="70698901839021"]'), house = q("#unreal");
  const stack = game(/Big Stack/), capi = game(/Capivaras/);
  if (blox) defs.push({ el: blox, rate: 9, make: voxels });
  if (slime) defs.push({ el: slime, rate: 7, make: goo });
  if (stack) defs.push({ el: stack.querySelector(".shots") || stack, rate: 2.6, make: pile });
  if (capi) defs.push({ el: capi.querySelector(".shots") || capi, rate: 4, make: pond });
  if (house) {
    house.classList.add("fx-vhs");
    const media = house.querySelector(".p-media");
    if (media) on(media, "pointerenter", (e) => { if (e.pointerType === "mouse") ctx.SND && ctx.SND.play("hum"); });
    cleanups.push(() => house.classList.remove("fx-vhs"));
  }
  defs.forEach((d) => {
    let em = null, visible = true;
    const leave = () => { if (em) overlay.removeEmitter(em); em = null; };
    const enter = (e) => {
      if (e.pointerType !== "mouse" || em || !visible) return;
      let r = d.el.getBoundingClientRect(), acc = 0, lastR = performance.now();
      const st = d.st || (d.st = { n: 0, cols: [] }); // a pilha continua se o hover "piscar" com a inclinação do card
      em = {
        tick(dt, now) {
          if (now - lastR > 200) { r = d.el.getBoundingClientRect(); lastR = now; }
          acc += dt * d.rate;
          while (acc >= 1) { acc -= 1; d.make(r, st); }
        },
      };
      overlay.addEmitter(em);
    };
    on(d.el, "pointerenter", enter);
    on(d.el, "pointerleave", leave);
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (!visible) leave(); });
    io.observe(d.el);
    cleanups.push(() => { io.disconnect(); leave(); });
  });
}
// Blox Survival: cubos voxel sobem e se encaixam em pilhas na base da imagem
function voxels(r, st) {
  const size = Math.max(10, Math.min(16, r.width / 34)), w = size * 0.866 * 2;
  const ncol = Math.max(4, Math.floor((r.width * 0.8) / w));
  if (!st.cols.length) st.cols = new Array(ncol).fill(0);
  const c = Math.floor(Math.random() * ncol);
  if (st.cols[c] >= 3) st.cols[c] = 0;
  const h = st.cols[c]++;
  const tx = r.left + r.width * 0.1 + (c + 0.5) * w + (h % 2) * 0.5, ty = r.bottom - size * 0.8 - h * size;
  const sx = tx + (Math.random() - 0.5) * 60, sy = r.bottom + 24 + Math.random() * 30;
  overlay.emit("voxel", sx, sy, { life: 1.7, size, drag: 0, extra: { sx, sy, tx, ty, travel: 0.55 + Math.random() * 0.2, rot0: (Math.random() - 0.5) * 1.6, c: VOX[Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2] } });
}
// Mystic Slime Defense: gotas roxas/verdes penduradas na borda de cima que escorrem, e bolhas
function goo(r, st) {
  st.n++;
  if (st.n % 3 === 0) {
    overlay.emit("bubble", r.left + Math.random() * r.width, r.bottom - 6, { vy: -26 - Math.random() * 20, life: 1.3, size: 2 + Math.random() * 3, drag: 0.2, color: Math.random() < 0.5 ? "#a98bff" : "#8dffe6" });
    return;
  }
  const x = r.left + 10 + Math.random() * (r.width - 20), y = r.top + 2;
  overlay.emit("drip", x, y, { life: 1.6 + Math.random() * 0.5, size: 4 + Math.random() * 4, grav: 190, drag: 0.4, color: Math.random() < 0.6 ? "#8b5cf6" : "#2cf5c0", extra: { hang: 0.4 + Math.random() * 0.35, y0: y } });
}
// Big Stack: blocos deslizam de lado e empilham (com um leve desalinhamento, como no jogo)
const PILE = ["#2cf5c0", "#8b5cf6", "#eceef2", "#ffb35c"];
function pile(r, st) {
  const bh = 7, max = Math.max(4, Math.min(9, Math.floor((r.height - 16) / (bh + 2))));
  if (st.n >= max) st.n = 0;
  const n = st.n++, w = r.width * (0.22 - n * 0.008), fromLeft = n % 2 === 0;
  const tx = r.left + r.width / 2 + (Math.random() - 0.5) * 10, ty = r.bottom - 8 - (n + 1) * (bh + 2);
  const sx = fromLeft ? r.left - w * 0.2 : r.right + w * 0.2;
  overlay.emit("block", sx, ty, { life: 2.2, size: bh, drag: 0, a: 0.85, color: PILE[n % PILE.length], extra: { w, sx, sy: ty, tx, ty, travel: 0.26, rot0: 0 } });
}
// Capivaras: ondas na lagoa e folhas caindo
function pond(r, st) {
  st.n++;
  if (st.n % 3 === 0) {
    overlay.emit("leaf", r.left + Math.random() * r.width, r.top - 4, { vy: 26 + Math.random() * 14, life: 2.4, size: 6 + Math.random() * 3, drag: 0, rot: Math.random() * 3, color: Math.random() < 0.5 ? "#5fcf7f" : "#2cf5c0" });
    return;
  }
  overlay.emit("ripple", r.left + r.width * (0.1 + Math.random() * 0.8), r.top + r.height * (0.55 + Math.random() * 0.4), { life: 1.4, size: 24 + Math.random() * 16, drag: 0, color: "#eafffb" });
}

/* ------------------------------------------------------------
   Cursor: brilho de cristal com rastro, rótulos de contexto e botões magnéticos.
   O cursor nativo continua normal; isto é só um acompanhante.
   ------------------------------------------------------------ */
const LABELS = [
  ["#stage-view", "Girar"],
  ["a.btn", (el) => (/Jogar/.test(el.textContent) || (el.closest("#jogos") && el.classList.contains("primary")) ? "Jogar" : null)],
  [".art", "Ampliar"],
  [".cert", "Ampliar"],
  [".asset", "Ver na Fab"],
];
function cursor() {
  const C = ctx.CONFIG;
  const c = { x: -100, y: -100, gx: -100, gy: -100, rot: 0, on: false, moving: false, hot: false, shape: "crystal", from: null, m: 1 };
  const setShape = (sh) => {
    if (!C.sectionCursor || sh === c.shape) return;
    c.from = c.shape; c.shape = sh; c.m = 0;
    label.style.setProperty("--lc", CUR[sh] || CUR.crystal);
    overlay.kick();
  };
  const shapeAt = (t) => {
    const sec = t && t.closest && t.closest("main > section[id], footer");
    if (!sec) return null;
    return SECTION_SHAPE[sec.id] || "ring";
  };
  overlay.setCursor(c);
  const label = document.createElement("div");
  label.className = "fx-label";
  label.setAttribute("aria-hidden", "true");
  document.body.appendChild(label);
  let lastEmit = { x: 0, y: 0 }, labelEl = null, lraf = 0;
  const moveLabel = () => { lraf = 0; label.style.transform = `translate3d(${c.x + 20}px, ${c.y + 26}px, 0)`; };
  const findLabel = (t) => {
    for (const [s, v] of LABELS) {
      const el = t.closest && t.closest(s);
      if (el) { const txt = typeof v === "function" ? v(el) : v; if (txt) return txt; }
    }
    return null;
  };
  const onMove = (e) => {
    if (e.pointerType !== "mouse") return;
    c.x = e.clientX; c.y = e.clientY; c.on = true; c.moving = true;
    if (c.gx < -50) { c.gx = c.x; c.gy = c.y; }
    const d = Math.hypot(c.x - lastEmit.x, c.y - lastEmit.y);
    if (d > 18 && (c.shape === "crystal" || !C.sectionCursor)) {
      lastEmit = { x: c.x, y: c.y };
      overlay.emit("glint", c.x + 13, c.y + 15, { life: 0.42, size: 2.6 + Math.random() * 1.6, rot: Math.random() * 3, vr: 3, vx: (Math.random() - 0.5) * 20, vy: 12 + Math.random() * 16, drag: 3, a: 0.7 });
    }
    if (labelEl && !lraf) lraf = requestAnimationFrame(moveLabel);
    overlay.kick();
  };
  const onOver = (e) => {
    const sh = shapeAt(e.target);
    if (sh) setShape(sh);
    const txt = findLabel(e.target);
    c.hot = !!(e.target.closest && e.target.closest("a, button, [tabindex]"));
    if (txt) { label.textContent = txt; labelEl = e.target; moveLabel(); label.classList.add("on"); }
    else { labelEl = null; label.classList.remove("on"); }
  };
  const hide = () => { c.on = false; label.classList.remove("on"); };
  on(document, "pointermove", onMove, { passive: true });
  on(document, "pointerover", onOver, { passive: true });
  on(document.documentElement, "pointerleave", hide);
  on(window, "blur", hide);
  // rolando sem mexer o mouse: a seção embaixo do cursor muda, então confere de tempos em tempos
  let sTimer = 0;
  on(window, "scroll", () => {
    if (sTimer || !c.on || !C.sectionCursor) return;
    sTimer = setTimeout(() => { sTimer = 0; const el = document.elementFromPoint(c.x, c.y); const sh = shapeAt(el); if (sh) setShape(sh); }, 120);
  }, { passive: true });

  // botões magnéticos (hero, contato, Contratar)
  const mags = [...document.querySelectorAll(".hero-actions .btn, .contact .btn, .nav-cta")];
  mags.forEach((b) => {
    const mv = (e) => {
      const r = b.getBoundingClientRect();
      b.classList.add("magnet");
      b.style.setProperty("--mx", (((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1) + "px");
      b.style.setProperty("--my", (((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(1) + "px");
    };
    const lv = () => { b.classList.remove("magnet"); b.style.removeProperty("--mx"); b.style.removeProperty("--my"); };
    on(b, "pointermove", mv, { passive: true });
    on(b, "pointerleave", lv);
    cleanups.push(lv);
  });
  cleanups.push(() => { label.remove(); overlay.setCursor(null); });
}

/* ------------------------------------------------------------
   HUD: o cristal da seção explode em estilhaços na primeira visita
   ------------------------------------------------------------ */
function hudBursts() {
  on(window, "hud:lit", (e) => {
    const el = e.detail && e.detail.el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    overlay.burst(r.left + r.width / 2, r.top + r.height / 2, 12);
  });
}

/* ------------------------------------------------------------
   Navegação interna com cortina pontilhada (menu, HUD, botões)
   Mantém o endereço (#secao), o foco e o "voltar" do navegador.
   ------------------------------------------------------------ */
function anchors() {
  const wipe = document.getElementById("fx-wipe");
  if (!wipe) return;
  let busy = false;
  const offset = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 84;
  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id.length > 1 && document.querySelector(id);
    if (!target || busy) return;
    e.preventDefault();
    busy = true;
    wipe.classList.remove("uncover");
    wipe.classList.add("cover");
    setTimeout(() => {
      const jump = () => {
        const top = id === "#top" ? 0 : target.getBoundingClientRect().top + scrollY - offset();
        if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
        else window.scrollTo({ top, behavior: "instant" });
      };
      jump();
      // imagens "lazy" acima do destino podem carregar depois do salto e empurrar a página:
      // por ~1,2 s, mantém a seção no lugar (a menos que a pessoa role por conta própria)
      let userMoved = false;
      const mark = () => { userMoved = true; };
      ["wheel", "touchstart", "keydown", "pointerdown"].forEach((t) => addEventListener(t, mark, { once: true, passive: true }));
      const until = performance.now() + 1200;
      const hold = () => {
        if (userMoved || performance.now() > until) { ["wheel", "touchstart", "keydown", "pointerdown"].forEach((t) => removeEventListener(t, mark)); return; }
        if (id !== "#top" && Math.abs(target.getBoundingClientRect().top - offset()) > 2) jump();
        requestAnimationFrame(hold);
      };
      requestAnimationFrame(hold);
      if (location.hash !== id) history.pushState(null, "", id);
      // leva o foco junto, como um link de âncora normal faria
      const focusEl = target.tagName === "MAIN" ? target : target;
      if (!focusEl.hasAttribute("tabindex")) focusEl.setAttribute("tabindex", "-1");
      focusEl.focus({ preventScroll: true });
      requestAnimationFrame(() => {
        wipe.classList.remove("cover");
        wipe.classList.add("uncover");
        setTimeout(() => { wipe.classList.remove("uncover"); busy = false; }, T.wipeOut + 30);
      });
    }, T.wipeIn);
  };
  on(document, "click", onClick);
  cleanups.push(() => wipe.classList.remove("cover", "uncover"));
}

/* ------------------------------------------------------------
   Fase 3: transição "portal" (menu, HUD, botões internos).
   Um anel 1-bit (pontilhado Bayer, verde e roxo) abre a partir do clique ou do cristal do HUD,
   cobre a tela com um vórtice escuro, a página salta para a seção e ela aparece "dentro" do portal,
   que abre até sumir. Desenhado em baixa resolução (1 pixel = 4+ px na tela) num canvas 2D.
   Mantém o endereço (#secao), o histórico, o foco e o aria-current. Qualquer tecla ou clique pula.
   ------------------------------------------------------------ */
const PORTAL = { open: 300, hold: 70, reveal: 380 }; // ~750 ms no total
function portal() {
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  // cores em ABGR (ImageData little-endian)
  const VOID = 0xff070504, ARM = 0xff1d2c0c, GREEN = 0xffc0f52c, PURPLE = 0xfff65c8b, CLEAR = 0;
  let cv = null, g = null, img = null, buf = null, cw = 0, ch = 0, cell = 4, raf = 0, run = null;
  const offset = () => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 84;

  const setup = () => {
    cell = Math.max(4, Math.round(innerWidth / 360));
    cw = Math.ceil(innerWidth / cell); ch = Math.ceil(innerHeight / cell);
    if (!cv) {
      cv = document.createElement("canvas");
      cv.className = "fx-portal";
      cv.setAttribute("aria-hidden", "true");
      g = cv.getContext("2d");
    }
    cv.width = cw; cv.height = ch;
    cv.style.width = cw * cell + "px"; cv.style.height = ch * cell + "px";
    img = g.createImageData(cw, ch);
    buf = new Uint32Array(img.data.buffer);
  };
  // um quadro do portal. mode "open": o vazio cresce a partir de (ox, oy) com raio R.
  // mode "reveal": um buraco de raio R a partir de (ox, oy) mostra a página por baixo.
  const paint = (mode, ox, oy, R, time, rimA) => {
    const BAND = 9, spin = time * 0.008;
    for (let y = 0; y < ch; y++) {
      const dy = y - oy, row = y * cw, by = (y & 3) * 4;
      for (let x = 0; x < cw; x++) {
        const dx = x - ox, d = Math.sqrt(dx * dx + dy * dy);
        const th = BAYER[by + (x & 3)];
        // braços do vórtice: espiral que gira (só muda a cor do vazio)
        const sw = Math.sin(Math.atan2(dy, dx) * 5 + d * 0.11 - spin);
        let v = mode === "open" ? (R - d) / BAND : (d - R) / BAND;
        let c = CLEAR;
        if (v > th) c = v > 1.6 && sw > 0.86 && th < 0.34 ? ARM : VOID;
        else if (v > -0.45) {
          // anel: pontilhado que mistura verde e roxo seguindo a espiral
          const e = (1 - Math.abs(v + 0.1) / 0.45) * rimA;
          if (e > th) c = sw > -0.1 ? GREEN : PURPLE;
        }
        buf[row + x] = c;
      }
    }
    g.putImageData(img, 0, 0);
  };
  const far = (x, y) => Math.max(Math.hypot(x, y), Math.hypot(cw - x, y), Math.hypot(x, ch - y), Math.hypot(cw - x, ch - y));

  const jumpTo = (id, target) => {
    const jump = () => {
      const top = id === "#top" ? 0 : target.getBoundingClientRect().top + scrollY - offset();
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo({ top, behavior: "instant" });
    };
    jump();
    // imagens "lazy" acima do destino podem carregar depois do salto e empurrar a página:
    // por ~1,2 s, mantém a seção no lugar (a menos que a pessoa role por conta própria)
    let userMoved = false;
    const evs = ["wheel", "touchstart", "keydown", "pointerdown"];
    const mark = () => { userMoved = true; };
    setTimeout(() => evs.forEach((t) => addEventListener(t, mark, { once: true, passive: true })), 0);
    const until = performance.now() + 1200;
    const hold = () => {
      if (userMoved || performance.now() > until) { evs.forEach((t) => removeEventListener(t, mark)); return; }
      if (id !== "#top" && Math.abs(target.getBoundingClientRect().top - offset()) > 2) jump();
      requestAnimationFrame(hold);
    };
    requestAnimationFrame(hold);
    if (location.hash !== id) history.pushState(null, "", id);
    // leva o foco junto, como um link de âncora normal faria
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  const end = () => {
    if (!run) return;
    cancelAnimationFrame(raf); raf = 0;
    if (!run.jumped) { run.jumped = true; jumpTo(run.id, run.target); }
    removeEventListener("keydown", skip, true);
    removeEventListener("pointerdown", skip, true);
    if (cv) cv.remove();
    run = null;
  };
  function skip() { end(); }

  const step = (now) => {
    raf = 0;
    if (!run) return;
    const t = now - run.t0;
    const A = PORTAL.open, B = A + PORTAL.hold, Z = B + PORTAL.reveal;
    if (t < A) {
      const p = t / A, e = p * p * (1.6 - 0.6 * p); // começa devagar perto do clique e acelera
      paint("open", run.ox, run.oy, 2 + e * (run.far1 + 12), t, 1);
    } else if (t < B) {
      if (!run.jumped) { run.jumped = true; jumpTo(run.id, run.target); }
      paint("open", run.ox, run.oy, run.far1 + 14, t, 1);
    } else if (t < Z) {
      if (!run.jumped) { run.jumped = true; jumpTo(run.id, run.target); }
      const q = (t - B) / PORTAL.reveal, e = 1 - Math.pow(1 - q, 3);
      paint("reveal", run.cx, run.cy, -10 + e * (run.far2 + 22), t, 1 - q * 0.5);
    } else { end(); return; }
    raf = requestAnimationFrame(step);
  };

  const onClick = (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (run) end();
    setup();
    // origem: o ponto do clique; pelo teclado (sem coordenadas), o cristal do HUD da seção ou o próprio link
    let ox, oy;
    const gem = document.querySelector(`#xp a[href="${id}"]`);
    const fromHud = a.closest("#xp");
    const gr = gem && !gem.closest("[hidden]") && gem.getBoundingClientRect();
    if (fromHud && gr && gr.width) { ox = gr.left + gr.width / 2; oy = gr.top + gr.height / 2; }
    else if (e.detail > 0 && (e.clientX || e.clientY)) { ox = e.clientX; oy = e.clientY; }
    else if (gr && gr.width) { ox = gr.left + gr.width / 2; oy = gr.top + gr.height / 2; }
    else { const r = a.getBoundingClientRect(); ox = r.left + r.width / 2; oy = r.top + r.height / 2; }
    ox /= cell; oy /= cell;
    const cx = cw / 2, cy = ch * 0.42;
    run = { id, target, t0: performance.now(), ox, oy, cx, cy, far1: far(ox, oy), far2: far(cx, cy), jumped: false };
    document.body.appendChild(cv);
    paint("open", ox, oy, 2, 0, 1);
    if (ctx.SND) ctx.SND.play("portal");
    // espera o clique atual terminar antes de ouvir "pular"
    setTimeout(() => { if (run) { addEventListener("keydown", skip, true); addEventListener("pointerdown", skip, true); } }, 0);
    raf = requestAnimationFrame(step);
  };
  on(document, "click", onClick);
  cleanups.push(() => { end(); cv = null; });
}
