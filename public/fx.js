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

export function start(c) {
  if (running) return;
  running = true;
  ctx = c;
  const C = ctx.CONFIG;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  overlay.init(fine);
  if (C.smooth && fine) startLenis();
  if (C.scrollFx) { headings(); parallaxMedia(); marquee(); dock(); }
  if (C.cardFx) { gallery(fine); if (fine) { tilt(); cardVfx(); } }
  if (C.cursor && fine) cursor();
  hudBursts();
  if (C.wipe) anchors();
}

export function stop() {
  if (!running) return;
  running = false;
  cleanups.splice(0).reverse().forEach((f) => { try { f(); } catch (e) { /* segue */ } });
  if (lenis) { lenis.destroy(); lenis = null; }
  overlay.destroy();
}

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
      p.vx *= Math.exp(-dt * p.drag); p.vy *= Math.exp(-dt * p.drag);
      p.vy += p.grav * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
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
    } else if (p.kind === "ring") {
      g.globalCompositeOperation = "lighter";
      const e = easeOut(k);
      g.globalAlpha = p.a * (1 - e);
      g.strokeStyle = p.color; g.lineWidth = 1.5;
      g.beginPath(); g.arc(p.x, p.y, 4 + e * p.size, 0, Math.PI * 2); g.stroke();
    }
    g.globalAlpha = 1;
  };
  const drawCursor = (dt) => {
    const c = cursor;
    const k = 1 - Math.exp(-dt * 22);
    c.gx += (c.x - c.gx) * k; c.gy += (c.y - c.gy) * k;
    c.rot += dt * 1.6;
    g.globalCompositeOperation = "lighter";
    const r = c.hot ? 9 : 6;
    star(c.gx + 13, c.gy + 15, r, c.rot, "#8dffe6", 0.95);
    star(c.gx + 13, c.gy + 15, r * 0.45, -c.rot, "#ffffff", 0.9);
    c.moving = Math.abs(c.x - c.gx) + Math.abs(c.y - c.gy) > 0.3;
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
   Cursor: brilho de cristal com rastro, rótulos de contexto e botões magnéticos.
   O cursor nativo continua normal; isto é só um acompanhante.
   ------------------------------------------------------------ */
const LABELS = [
  ["#stage-view", "Girar"],
  ["a.btn", (el) => (/Jogar/.test(el.textContent) ? "Jogar" : null)],
  [".art", "Ver"],
  [".cert", "Ampliar"],
  [".asset", "Ver na Fab"],
];
function cursor() {
  const c = { x: -100, y: -100, gx: -100, gy: -100, rot: 0, on: false, moving: false, hot: false };
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
    if (d > 18) {
      lastEmit = { x: c.x, y: c.y };
      overlay.emit("glint", c.x + 13, c.y + 15, { life: 0.42, size: 2.6 + Math.random() * 1.6, rot: Math.random() * 3, vr: 3, vx: (Math.random() - 0.5) * 20, vy: 12 + Math.random() * 16, drag: 3, a: 0.7 });
    }
    if (labelEl && !lraf) lraf = requestAnimationFrame(moveLabel);
    overlay.kick();
  };
  const onOver = (e) => {
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
