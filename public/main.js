/* ============================================================
   CONFIGURAÇÃO: o que costuma mudar fica aqui no topo
   ============================================================ */
const CONFIG = {
  artstationUser: "andrecasagrande",
  artstationProfile: "https://www.artstation.com/andrecasagrande",
  // Nome e link da loja na Fab. Se o nome mudar, altere só estas duas linhas.
  fabName: "Big Loop Studio",
  fabUrl: "https://www.fab.com/sellers/Big%20Loop%20Studio",
  pageSize: 12,
  // Resultado da 1-BIT JAM 15 (The God of Small Things). Deixe "" enquanto a votação está aberta.
  // Quando sair, escreva por exemplo "3º lugar geral" ou "1º lugar em Arte" e publique de novo.
  jamResult: "",

  // ---- Topo do site (hero) ----
  // Liga/desliga cada efeito. Com false, o site volta ao comportamento simples.
  hero3d: true,   // modelo 3D que gira com o mouse/dedo (sem ele fica só a imagem estática)
  lantern: true,  // "lanterna": a luz segue o cursor no topo do site
  hud: true,      // barra de progresso com cristais por seção
  // Seu modelo 3D (.glb exportado do Blender). Deixe "" para usar o cristal procedural.
  // Exemplo: "models/hero.glb" (coloque o arquivo em public/models/).
  heroModel: "",
  // Descrição do modelo para leitores de tela (troque junto com o heroModel).
  heroModelAlt: "",
};

// Nível de 1 a 5 (do currículo)
const SKILLS = [
  { name: "Blender", level: 5, note: "Avançado" },
  { name: "Unreal Engine 5", level: 4, note: "Intermediário / Avançado" },
  { name: "Roblox Studio (Lua)", level: 4, note: "Jogos publicados" },
  { name: "Photoshop", level: 3, note: "Intermediário" },
  { name: "Maya", level: 3, note: "Intermediário" },
  { name: "Illustrator", level: 3, note: "Intermediário" },
  { name: "Moho", level: 3, note: "Intermediário" },
  { name: "Premiere Pro", level: 2, note: "Básico / Intermediário" },
  { name: "Cinema 4D", level: 1, note: "Básico" },
];

// Assets que vendo na Fab. "match" tenta achar a capa no ArtStation pelo título.
const FAB_ASSETS = [
  { title: "Viking Tankard", sub: "Stylized Hand-Painted Game Asset", img: "assets/fab-viking-tankard.jpg", icon: "🍺" },
  { title: "Low Poly Nature Pack", sub: "Árvores, rochas e props", img: "assets/fab-low-poly-nature.jpg", icon: "🌳" },
  { title: "Post-apocalyptic Melee Weapons Pack", sub: "Game Ready", img: "assets/fab-melee-weapons.jpg", icon: "🪓" },
  { title: "Stylized Fantasy Keys Pack", sub: "Chaves de fantasia", img: "assets/fab-fantasy-keys.jpg", icon: "🗝️" },
  { title: "Stylized Potion Bottles Pack", sub: "Poções e frascos", img: "assets/fab-potion-bottles.jpg", icon: "🧪" },
  { title: "Adventure Complete Pack", sub: "Low Poly · Medieval estilizado", img: "assets/fab-adventure-pack.jpg", icon: "🏰" },
  { title: "PS1 Style Wooden Doors Pack", sub: "10 portas low poly", img: "assets/fab-ps1-doors.jpg", icon: "🚪" },
  { title: "Stylized Crystal Pack", sub: "10 gemas de fantasia", img: "assets/fab-crystal-pack.jpg", icon: "💎" },
];

// Plano B: se a API falhar, mostra estas artes (fixas) e o link do perfil.
const FALLBACK_ART = [
  { title: "Viking Tankard - Stylized Hand-Painted Game Asset", url: "https://www.artstation.com/artwork/ayR2nX", image: "https://cdnb.artstation.com/p/assets/images/images/101/054/023/medium/andre-render.jpg?1784917141", likes: 8 },
  { title: "3D The Autumn Guardian", url: "https://www.artstation.com/artwork/0lVOYY", image: "https://cdnb.artstation.com/p/assets/images/images/089/923/963/medium/andre-render-principal-personagem.jpg?1752353243", likes: 16 },
  { title: "The Ember Mage", url: "https://www.artstation.com/artwork/y4eLLJ", image: "https://cdna.artstation.com/p/assets/images/images/090/098/050/medium/andre-next-mage-render.jpg?1752872729", likes: 12 },
  { title: "3D Character – Magical Water Jester", url: "https://www.artstation.com/artwork/mAY3aE", image: "https://cdnb.artstation.com/p/assets/images/images/089/801/271/medium/andre-boneco-da-varinha-d-agua.jpg?1751991035", likes: 11 },
  { title: "3D Modeling Purple Magic Mushroom Spider", url: "https://www.artstation.com/artwork/1NVwVZ", image: "https://cdna.artstation.com/p/assets/images/images/089/808/666/medium/andre-aranha.jpg?1752005403", likes: 9 },
];

/* ============================================================
   Utilidades
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ============================================================
   Navegação
   ============================================================ */
const nav = $("#nav");
const menu = $("#menu");
const burger = $("#burger");

const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 24);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("menu-open", open);
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }
});

// Destaca o item do menu da seção visível
const links = [...menu.querySelectorAll("a")];
const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
const spy = new IntersectionObserver(
  (entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) {
        links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      }
    });
  },
  { rootMargin: "-45% 0px -50% 0px" }
);
sections.forEach((s) => spy.observe(s));

// Animação de entrada
const reveal = new IntersectionObserver(
  (entries) => entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); reveal.unobserve(en.target); } }),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));

$("#year").textContent = new Date().getFullYear();

/* ============================================================
   Ferramentas (skills)
   ============================================================ */
$("#skills").innerHTML = SKILLS.map(
  (s) => `<div class="skill"><div>${esc(s.name)}<small>${esc(s.note)}</small></div>
  <div class="dots" role="img" aria-label="Nível ${s.level} de 5">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= s.level ? "on" : ""}"></i>`).join("")}</div></div>`
).join("");

/* ============================================================
   Galeria (ArtStation via /api/artstation)
   ============================================================ */
const gallery = $("#gallery");
const moreBtn = $("#more");
let projects = [];
let shown = 0;

function renderMore() {
  const slice = projects.slice(shown, shown + CONFIG.pageSize);
  if (shown === 0) gallery.innerHTML = "";
  gallery.insertAdjacentHTML(
    "beforeend",
    slice
      .map(
        (p) => `<a class="art" href="${esc(p.url)}" target="_blank" rel="noopener" aria-label="${esc(p.title)} (abre no ArtStation)">
        <img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" onerror="if(this.dataset.f!=='1'&&this.dataset.t){this.dataset.f='1';this.src=this.dataset.t}else{this.closest('.art').remove()}" data-t="${esc(p.thumb || "")}">
        <figcaption><span>${esc(p.title)}</span>${p.likes ? `<span>♥ ${p.likes}</span>` : ""}</figcaption></a>`
      )
      .join("")
  );
  shown += slice.length;
  moreBtn.hidden = shown >= projects.length;
}

moreBtn.addEventListener("click", renderMore);

/* Busca JSON com tempo limite, para a página nunca ficar presa esperando */
async function fetchJson(url, ms = 7000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    if (!r.ok) throw new Error(url + " respondeu " + r.status);
    return await r.json();
  } finally {
    clearTimeout(timer);
  }
}

// Garante os campos que a galeria usa (a cópia fixa guarda só a miniatura quadrada)
const normalize = (list) =>
  list.map((p) => ({
    ...p,
    image: p.image || String(p.thumb || "").replace("/small_square/", "/medium/"),
  }));

async function loadArt() {
  let total = 0;
  // 1) ao vivo, pela função da Vercel  2) cópia fixa das 37 artes  3) 5 artes embutidas
  try {
    const data = await fetchJson(`/api/artstation?user=${CONFIG.artstationUser}`);
    if (!data.projects || !data.projects.length) throw new Error("vazio");
    projects = normalize(data.projects);
    total = data.total || projects.length;
  } catch (err) {
    console.warn("API do ArtStation indisponível, usando a cópia fixa:", err);
    try {
      const snap = await fetchJson("data/artstation.json");
      projects = normalize(snap.projects);
      total = snap.total || projects.length;
    } catch (err2) {
      console.warn("Cópia fixa indisponível, usando artes embutidas:", err2);
      projects = normalize(FALLBACK_ART);
      total = projects.length;
    }
  }
  const stat = $("#stat-art");
  if (stat) stat.textContent = total;
  renderMore();
}

/* ============================================================
   Assets da Fab (imagens ficam em /assets, recortadas da loja)
   ============================================================ */
$("#fab-name").textContent = CONFIG.fabName;
$("#fab-link").href = CONFIG.fabUrl;

$("#assets-grid").innerHTML = FAB_ASSETS.map(
  (a) => `<a class="asset reveal in" href="${esc(CONFIG.fabUrl)}" target="_blank" rel="noopener">
    <div class="img"><img src="${esc(a.img)}" alt="${esc(a.title)}" loading="lazy" onerror="this.replaceWith(document.createTextNode('${a.icon}'))"></div>
    <div class="info">${esc(a.title)}<small>${esc(a.sub)}</small></div></a>`
).join("");

/* ============================================================
   Roblox: capturas de tela sempre atualizadas (via /api/roblox)
   ============================================================ */
function fillRoblox(card, game) {
  const shots = (game && game.thumbnails) || [];
  const name = card.dataset.name || "jogo no Roblox";
  const hero = card.querySelector(".hero-shot img");
  const thumbs = card.querySelector(".thumbs");
  const heroIsLocal = card.dataset.hero === "local";
  const rest = heroIsLocal ? shots : shots.slice(1);

  if (!heroIsLocal) {
    if (!shots.length) {            // sem imagens: esconde a coluna de mídia e deixa só o texto
      card.querySelector(".p-media").remove();
      card.classList.add("no-media");
      return;
    }
    hero.alt = "Captura de " + name;
    hero.src = shots[0];
  }
  if (thumbs) {
    thumbs.innerHTML = rest.slice(0, 3).map(
      (u, i) => `<img src="${esc(u)}" alt="Captura ${i + 2} de ${esc(name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">`
    ).join("");
  }
}

async function loadRoblox() {
  const cards = [...document.querySelectorAll("[data-place]")];
  if (!cards.length) return;
  let games = {};
  try {
    const data = await fetchJson("/api/roblox?places=" + cards.map((c) => c.dataset.place).join(","), 9000);
    games = data.games || {};
  } catch (err) {
    console.warn("API do Roblox indisponível:", err);
  }
  cards.forEach((c) => fillRoblox(c, games[c.dataset.place]));
}

/* ============================================================
   Certificados (lightbox)
   ============================================================ */
const lb = $("#lightbox");
const lbImg = $("#lb-img");
const closeLb = () => { lb.classList.remove("open"); lbImg.removeAttribute("src"); };
document.querySelectorAll(".cert[data-full]").forEach((c) =>
  c.addEventListener("click", () => {
    lbImg.src = c.dataset.full;
    lbImg.alt = c.getAttribute("aria-label") || "Certificado";
    lb.classList.add("open");
  })
);
lb.addEventListener("click", (e) => { if (e.target !== lbImg) closeLb(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeLb(); });

/* ============================================================
   Status da game jam (The God of Small Things)
   ============================================================ */
(function jamStatus() {
  const box = $("#jam-status");
  if (!box || !CONFIG.jamResult) return;       // sem resultado: mantém o texto "em andamento" do HTML
  box.classList.add("done");
  box.querySelector("span").textContent = `🏆 ${CONFIG.jamResult} na 1-BIT JAM 15.`;
  const badge = document.querySelector("#god-of-small-things .badge.live");
  if (badge) badge.textContent = "Resultado da jam";
})();

/* ============================================================
   Topo do site: lanterna, HUD de progresso e modelo 3D
   ============================================================ */
const motionOK = !matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroEl = $("#hero");
const stageView = $("#stage-view");

// Posição da lanterna em px, relativa ao topo do hero. O hero3d.js lê este objeto a cada quadro.
const lantern = { x: 0, y: 0, ready: false };

(function setupLantern() {
  const el = $("#lantern");
  if (!heroEl || !el || !stageView) return;

  let tx = 0, ty = 0, raf = 0, last = 0, lastTouch = -1e9, inView = true;
  let mode = "rest"; // rest | follow-mouse | follow (toque) | wander (toque parado)
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const live = CONFIG.lantern && motionOK;

  // Geometria em cache (medida só no resize), para não forçar layout a cada movimento
  const geo = { hx: 0, hy: 0, sx: 0, sy: 0, sw: 1, sh: 1 };
  const measure = () => {
    const h = heroEl.getBoundingClientRect(), s = stageView.getBoundingClientRect();
    geo.hx = h.left + scrollX; geo.hy = h.top + scrollY;
    geo.sx = s.left - h.left; geo.sy = s.top - h.top; geo.sw = s.width; geo.sh = s.height;
  };
  // Ponto de descanso: acima e à esquerda do cristal, para ele ficar dentro do facho
  const rest = () => ({ x: geo.sx + geo.sw * 0.34, y: geo.sy + geo.sh * 0.3 });
  const toHero = (e) => ({ x: e.clientX + scrollX - geo.hx, y: e.clientY + scrollY - geo.hy });
  const paint = () => { el.style.transform = `translate3d(${lantern.x.toFixed(1)}px, ${lantern.y.toFixed(1)}px, 0)`; };
  const place = () => {
    measure();
    const r = rest();
    if (mode === "rest" || !lantern.ready) { tx = lantern.x = r.x; ty = lantern.y = r.y; }
    lantern.ready = true;
    paint();
  };
  place();
  addEventListener("resize", place);
  addEventListener("load", place);
  if ("ResizeObserver" in window) new ResizeObserver(place).observe(heroEl);
  if (!live) return; // luz estática (movimento reduzido ou lanterna desligada)

  const tick = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - (last || now)) / 1000);
    last = now;
    if (mode === "wander" || (!fine && now - lastTouch > 2600 && mode !== "follow-mouse")) {
      // no celular a luz "vagueia" devagar em volta do cristal quando ninguém está tocando
      mode = "wander";
      const t = now / 1000;
      const cx = geo.sx + geo.sw / 2, cy = geo.sy + geo.sh / 2;
      tx = cx + Math.sin(t * 0.37) * geo.sw * 0.42 + Math.sin(t * 0.83) * geo.sw * 0.08;
      ty = cy + Math.cos(t * 0.29) * geo.sh * 0.3;
    }
    const k = 1 - Math.exp(-dt * (mode === "wander" ? 2.2 : 7));
    lantern.x += (tx - lantern.x) * k;
    lantern.y += (ty - lantern.y) * k;
    paint();
    const moving = Math.abs(tx - lantern.x) + Math.abs(ty - lantern.y) > 0.4;
    if (inView && !document.hidden && (moving || mode === "wander" || (!fine && mode !== "follow-mouse"))) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && inView && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };

  heroEl.addEventListener("pointermove", (e) => {
    ({ x: tx, y: ty } = toHero(e));
    if (e.pointerType === "mouse") mode = "follow-mouse";
    else { mode = "follow"; lastTouch = performance.now(); }
    kick();
  }, { passive: true });
  heroEl.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    ({ x: tx, y: ty } = toHero(e));
    mode = "follow"; lastTouch = performance.now();
    kick();
  }, { passive: true });
  heroEl.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") lastTouch = performance.now(); }, { passive: true });

  new IntersectionObserver(([en]) => { inView = en.isIntersecting; if (inView) kick(); }).observe(heroEl);
  document.addEventListener("visibilitychange", kick);
  kick();
})();

(function setupHud() {
  const xp = $("#xp");
  if (!xp || !CONFIG.hud) return;
  xp.hidden = false;

  const marks = [...xp.querySelectorAll("a")];
  const targets = marks.map((a) => $(a.getAttribute("href")));
  const fill = $("#xp-fill");
  const n = marks.length;
  marks.forEach((a, i) => {
    a.parentElement.style.setProperty("--at", ((i + 1) / n) * 100 + "%");
    const label = a.textContent.trim();
    a.setAttribute("aria-label", `${label}, seção ${i + 1} de ${n}`);
  });

  let tops = [], startLine = 0, first = true, ticking = false, lastActive = -2;
  const LINE = 0.45; // mesma linha de referência do destaque do menu

  const measure = () => {
    const vh = innerHeight;
    const maxLine = document.documentElement.scrollHeight - vh * (1 - LINE);
    startLine = vh * LINE;
    tops = targets.map((el) => (el ? el.getBoundingClientRect().top + scrollY : maxLine));
    // As últimas seções podem nunca chegar à linha (a página acaba antes): puxa para o fim possível
    for (let i = n - 1; i >= 0; i--) {
      const cap = i === n - 1 ? maxLine - 2 : tops[i + 1] - 8;
      tops[i] = Math.max(startLine + 1, Math.min(tops[i], cap));
    }
  };

  const update = () => {
    ticking = false;
    const line = scrollY + innerHeight * LINE;
    let p = n;
    for (let k = 0; k < n; k++) {
      const a = k ? tops[k - 1] : startLine, b = tops[k];
      if (line < b) { p = k + Math.max(0, Math.min(1, (line - a) / Math.max(1, b - a))); break; }
    }
    fill.style.setProperty("--p", (p / n).toFixed(4));
    const active = Math.floor(p) - 1; // índice da última seção alcançada
    marks.forEach((a, i) => {
      if (i <= active && !a.classList.contains("lit")) {
        a.classList.add("lit");
        if (!first && motionOK) {
          a.classList.add("flash");
          a.addEventListener("animationend", () => a.classList.remove("flash"), { once: true });
        }
      }
    });
    if (active !== lastActive) {
      marks.forEach((a, i) => (i === active ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      lastActive = active;
    }
    first = false;
  };
  const onScrollHud = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  const remeasure = () => { measure(); onScrollHud(); };

  measure();
  update();
  addEventListener("scroll", onScrollHud, { passive: true });
  addEventListener("resize", remeasure);
  addEventListener("load", remeasure);
  if ("ResizeObserver" in window) new ResizeObserver(remeasure).observe(document.body);
})();

(function setupHero3D() {
  if (!CONFIG.hero3d || !stageView) return;
  // Fica só com a imagem estática quando: movimento reduzido, economia de dados ou aparelho fraco
  const conn = navigator.connection;
  if (!motionOK) return;
  if (conn && conn.saveData) return;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return;
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return;

  // Cria o contexto WebGL2 uma vez só (o three.js 0.180 exige WebGL2) e entrega ao hero3d.js.
  // Sem WebGL2, nem baixa o three.js: a imagem estática fica.
  const getGL = () => {
    try {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("webgl2", { alpha: true, antialias: true, depth: true, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false, powerPreference: "default" });
      return context ? { canvas, context } : null;
    } catch (e) { return null; }
  };

  const start = () => {
    const gl = getGL();
    if (!gl) return;
    import("./hero3d.js")
      .then((m) => m.startHero({
        view: stageView,
        hero: heroEl,
        gl,
        hint: $("#stage-hint"),
        hintText: $("#stage-hint-text"),
        meta: $("#stage-meta"),
        lantern,
        model: CONFIG.heroModel,
        modelAlt: CONFIG.heroModelAlt,
      }))
      .then((api) => { if (api) stageView.hero3d = api; })
      .catch((err) => console.warn("Modelo 3D indisponível, mantendo a imagem estática:", err));
  };
  const idle = () => ("requestIdleCallback" in window ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 400));
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle, { once: true });
})();

loadArt();
loadRoblox();
