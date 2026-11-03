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
  // ---- Efeitos da fase 2 (cada um pode ser desligado) ----
  intro: true,     // abertura curta, uma vez por sessão
  postfx: true,    // bloom, aberração cromática e luz volumétrica no 3D
  cursor: true,    // brilho de cristal que acompanha o mouse e rótulos "Jogar"/"Ver"
  smooth: true,    // rolagem suave (Lenis) no computador
  scrollFx: true,  // títulos que dissolvem, contadores, parallax, faixa de ferramentas, encaixe do cristal
  cardFx: true,    // inclinação, brilho e partículas nos cards e na galeria
  wipe: true,      // cortina pontilhada ao navegar pelo menu/HUD (usada se "portal" estiver desligado)
  // ---- Efeitos da fase 3 ----
  portal: true,        // transição "portal" 1-bit ao navegar pelo menu/HUD
  sound: true,         // botão "Som" na barra (o som em si começa DESLIGADO para quem visita)
  arcadeIntro: true,   // tela "INSIRA A MOEDA" na primeira visita da sessão (substitui a abertura)
  gameFx: true,        // efeito de hover próprio de cada jogo (voxels, slime, VHS, pilha, lagoa)
  sectionCursor: true, // o acompanhante do cursor muda de forma e cor em cada seção
};

// Textos da tela arcade (só letras A-Z, É, 0-9, espaço, "/", "-" e "·"; o resto vira espaço)
const ARCADE = {
  title: "ANDRÉ CASAGRANDE",
  subtitle: "GAME DESIGNER / 3D ARTIST",
  insert: "INSIRA A MOEDA",
  credit: "CRÉDITO 01",
  loading: "CARREGANDO",
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
  if (stat) setStat(stat, total);
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
   Modo de efeitos: "full" (completo) ou "reduced" (reduzido)
   O <head> já decidiu antes da primeira pintura (data-fx). Aqui fica o botão "Efeitos".
   ============================================================ */
const root = document.documentElement;
const FX = {
  get mode() { return root.dataset.fx === "reduced" ? "reduced" : "full"; },
  get why() { return root.dataset.fxWhy || "default"; },
  get full() { return this.mode === "full"; },
  set(mode, why = "user") {
    if (mode !== "full" && mode !== "reduced") return;
    root.dataset.fx = mode;
    root.dataset.fxWhy = why;
    if (why === "user") { try { localStorage.setItem("fx", mode); } catch (e) { /* sem armazenamento: vale só nesta visita */ } }
    syncToggle();
    dispatchEvent(new CustomEvent("fxchange", { detail: { mode } }));
  },
};
window.FX = FX;
const lowEndDevice = (() => {
  const n = navigator, c = n.connection;
  return !!((n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 2) || (c && c.saveData));
})();

const fxToggle = $("#fx-toggle");
const fxHint = $("#fx-hint");
function syncToggle() {
  if (fxToggle) fxToggle.setAttribute("aria-pressed", String(FX.full));
  if (fxHint && FX.full) fxHint.hidden = true;
}
syncToggle();
if (fxToggle) fxToggle.addEventListener("click", () => FX.set(FX.full ? "reduced" : "full"));
(function hint() {
  if (!fxHint || FX.full || (FX.why !== "os" && FX.why !== "device")) return;
  try { if (sessionStorage.getItem("fx-hint")) return; } catch (e) { /* ok */ }
  $("#fx-hint-text").textContent = FX.why === "os"
    ? "Efeitos reduzidos porque seu sistema pede menos movimento."
    : "Efeitos reduzidos para poupar seu aparelho.";
  fxHint.hidden = false;
  const close = () => { fxHint.hidden = true; try { sessionStorage.setItem("fx-hint", "1"); } catch (e) { /* ok */ } };
  $("#fx-hint-x").addEventListener("click", () => { close(); fxToggle.focus(); });
  $("#fx-hint-on").addEventListener("click", () => { close(); FX.set("full"); fxToggle.focus(); });
  setTimeout(close, 14000);
})();

/* ============================================================
   Som (opcional, DESLIGADO por padrão). Tudo sintetizado com WebAudio, sem arquivos.
   O AudioContext só nasce num clique/tecla da pessoa, e só se ela ligou o "Som".
   Para mudar um som, edite a receita em SOUNDS (frequências em Hz, tempos em segundos).
   ============================================================ */
const SND = (() => {
  const KEY = "som", VOL = 0.14;
  let on = false, ac = null, out = null, noise = null;
  const last = {};
  try { on = localStorage.getItem(KEY) === "1"; } catch (e) { /* sem armazenamento: começa desligado */ }
  const live = () => on && CONFIG.sound && FX.full;
  const ensure = () => {
    if (!live()) return null;
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      try { ac = new A(); } catch (e) { return null; }
      out = ac.createGain(); out.gain.value = VOL;
      const comp = ac.createDynamicsCompressor();
      out.connect(comp); comp.connect(ac.destination);
    }
    if (ac.state === "suspended") ac.resume().catch(() => {});
    return ac;
  };
  // um "tom" com envelope curto: tipo de onda, frequência inicial/final, início, duração, volume
  const tone = (type, f0, f1, t0, dur, vol, dest = out) => {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t0);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + Math.min(0.012, dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest);
    o.start(t0); o.stop(t0 + dur + 0.03);
  };
  const noiseBuf = () => {
    if (noise) return noise;
    noise = ac.createBuffer(1, ac.sampleRate * 0.8, ac.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return noise;
  };
  const SCALE = [0, 3, 5, 7, 10, 12]; // pentatônica menor: cada cristal do HUD tem a sua nota
  const SOUNDS = {
    chime(t, i = 0) { // tilintar de cristal (parciais inarmônicos, como vidro)
      const f = 1244.5 * Math.pow(2, SCALE[i % SCALE.length] / 12);
      tone("sine", f, f, t, 1.2, 0.42);
      tone("sine", f * 2.76, f * 2.74, t + 0.004, 0.45, 0.1);
      tone("triangle", f * 5.4, f * 5.4, t, 0.12, 0.04);
    },
    blip(t) { tone("triangle", 920, 1380, t, 0.05, 0.09); },
    click(t) { tone("square", 640, 320, t, 0.06, 0.035); tone("sine", 1280, 1280, t, 0.04, 0.05); },
    portal(t) { // sopro filtrado que sobe e desce + um grave curto
      const src = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
      src.buffer = noiseBuf(); bp.type = "bandpass"; bp.Q.value = 4;
      bp.frequency.setValueAtTime(260, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 0.3); bp.frequency.exponentialRampToValueAtTime(420, t + 0.72);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);
      src.connect(bp); bp.connect(g); g.connect(out); src.start(t); src.stop(t + 0.78);
      tone("sine", 140, 55, t + 0.25, 0.5, 0.35);
    },
    hum(t) { // zumbido grave da lanterna (terror)
      const o = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
      o.type = "sawtooth"; o.frequency.setValueAtTime(52, t); o.frequency.linearRampToValueAtTime(49, t + 0.9);
      lp.type = "lowpass"; lp.frequency.value = 190;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.18); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.95);
      o.connect(lp); lp.connect(g); g.connect(out); o.start(t); o.stop(t + 1);
    },
    coin(t) { tone("square", 1175, 1175, t, 0.075, 0.07); tone("square", 1760, 1760, t + 0.075, 0.36, 0.07); },
  };
  const GAP = { blip: 70, click: 60, chime: 90, hum: 6000, portal: 300, coin: 200 };
  return {
    get on() { return on; },
    get available() { return !!CONFIG.sound && FX.full; },
    set(v) {
      on = !!v;
      try { localStorage.setItem(KEY, on ? "1" : "0"); } catch (e) { /* vale só nesta visita */ }
      if (on && ensure()) this.play("chime", 3);
    },
    unlock() { if (live()) ensure(); }, // chamado só dentro de um clique/tecla
    play(name, arg) {
      if (!live() || !ac || ac.state !== "running" && name !== "chime" && name !== "coin") return;
      const now = performance.now();
      if (now - (last[name] || 0) < (GAP[name] || 0)) return;
      last[name] = now;
      try { SOUNDS[name](ac.currentTime + 0.005, arg); } catch (e) { /* som é enfeite: nunca quebra a página */ }
    },
  };
})();
window.SND = SND;

(function soundUi() {
  const btn = $("#snd-toggle");
  if (!btn || !SND.available) return;
  btn.hidden = false;
  const sync = () => btn.setAttribute("aria-pressed", String(SND.on));
  sync();
  btn.addEventListener("click", () => { SND.set(!SND.on); sync(); });
  // se a pessoa ligou o som numa visita anterior, o áudio só acorda no primeiro clique/tecla dela
  const wake = () => SND.unlock();
  addEventListener("pointerdown", wake, { capture: true, passive: true });
  addEventListener("keydown", wake, { capture: true });
  // blip no hover (só mouse) e no clique de botões e links de navegação
  const HOT = "a.btn, button, #menu a, .xp a, .logo, .socials a";
  document.addEventListener("pointerover", (e) => {
    if (e.pointerType !== "mouse" || !SND.on) return;
    const el = e.target.closest && e.target.closest(HOT);
    if (el && !(e.relatedTarget && el.contains(e.relatedTarget))) SND.play("blip");
  }, { passive: true });
  document.addEventListener("click", (e) => { if (SND.on && e.target.closest && e.target.closest(HOT) && !e.target.closest("#snd-toggle")) SND.play("click"); });
  addEventListener("hud:lit", (e) => {
    const a = e.detail && e.detail.el;
    const i = a ? [...document.querySelectorAll("#xp a")].indexOf(a) : 0;
    SND.play("chime", Math.max(0, i));
  });
  // lanterna do terror: um zumbido grave quando o mouse entra no topo escuro
  const hero = $("#hero");
  if (hero) hero.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") SND.play("hum"); });
})();

/* ============================================================
   Abertura
   O <head> marca "arcade" (uma vez por sessão, só no modo completo). Com arcadeIntro: tela
   "INSIRA A MOEDA" por cima do site (o site já está todo no DOM por baixo). Depois, ou sem ela,
   a abertura curta do hero (classe "intro"). Qualquer clique, toque ou tecla pula; Esc sai na hora.
   ============================================================ */
const introStartFns = [];
let introStarted = false;
const onIntroStart = (fn) => (introStarted ? fn() : introStartFns.push(fn));
function heroIntro() {
  if (!CONFIG.intro) return;
  root.classList.add("intro");
  const skip = () => root.classList.add("intro-skip");
  addEventListener("pointerdown", skip, { once: true });
  addEventListener("keydown", skip, { once: true });
  addEventListener("wheel", skip, { once: true, passive: true });
  setTimeout(() => root.classList.remove("intro", "intro-skip"), 2200);
  introStarted = true;
  introStartFns.splice(0).forEach((f) => f());
}
const introPlayed = root.classList.contains("arcade") && (CONFIG.arcadeIntro || CONFIG.intro);
if (root.classList.contains("arcade")) {
  if (CONFIG.arcadeIntro) arcadeIntro(heroIntro);
  else { root.classList.remove("arcade"); heroIntro(); }
}

function arcadeIntro(onReveal) {
  // fonte pixel 5x7 desenhada no canvas (nada é baixado). Cada número é uma linha de 5 bits.
  const F = {
    A: [14, 17, 17, 31, 17, 17, 17], C: [14, 17, 16, 16, 16, 17, 14], D: [30, 17, 17, 17, 17, 17, 30], E: [31, 16, 16, 30, 16, 16, 31],
    G: [14, 17, 16, 23, 17, 17, 15], I: [14, 4, 4, 4, 4, 4, 14], L: [16, 16, 16, 16, 16, 16, 31], M: [17, 27, 21, 21, 17, 17, 17],
    N: [17, 25, 21, 19, 17, 17, 17], O: [14, 17, 17, 17, 17, 17, 14], P: [30, 17, 17, 30, 16, 16, 16], R: [30, 17, 17, 30, 20, 18, 17],
    S: [15, 16, 16, 14, 1, 1, 30], T: [31, 4, 4, 4, 4, 4, 4], U: [17, 17, 17, 17, 17, 17, 14], B: [30, 17, 17, 30, 17, 17, 30],
    F: [31, 16, 16, 30, 16, 16, 16], H: [17, 17, 17, 31, 17, 17, 17], V: [17, 17, 17, 17, 17, 10, 4], Z: [31, 1, 2, 4, 8, 16, 31],
    0: [14, 19, 21, 21, 25, 17, 14], 1: [4, 12, 4, 4, 4, 4, 14], 2: [14, 17, 1, 6, 8, 16, 31], 3: [30, 1, 1, 14, 1, 1, 30],
    "/": [1, 1, 2, 4, 8, 16, 16], "-": [0, 0, 0, 14, 0, 0, 0], "·": [0, 0, 0, 4, 0, 0, 0],
  };
  F["É"] = F.E;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const GEM = ["...#...", "..###..", ".##.##.", "#######", ".#####.", ".##.##.", "..#.#..", "..###..", "...#..."];
  const COIN = ["..###..", ".#####.", "##.####", "##.####", "#######", ".#####.", "..###.."];
  const C = { bg: "#07080b", text: "#eceef2", shadow: "#33246b", dim: "#8d939e", acc: "#2cf5c0", acc2: "#a98bff", edge: "#0f8f70", off: "#1a1f27" };

  const el = document.createElement("div");
  el.className = "arcade-screen";
  el.setAttribute("aria-hidden", "true");
  const cv = document.createElement("canvas");
  el.appendChild(cv);
  document.body.appendChild(el);
  root.classList.remove("arcade"); // a camada do CSS sai; esta assume no mesmo quadro
  const g = cv.getContext("2d");

  const t0 = performance.now();
  // tempos em ms desde a abertura da página: entra sozinha em ~1,6 s e nunca passa de 2,2 s
  const CAP = 2200, OUT = 360, OUT_FAST = 200;
  let outAt = Math.min(CAP - OUT, Math.max(1250, t0 + 700));
  const barFrom = Math.max(t0 + 420, 500);
  let coinAt = -1, landed = false, finished = false, raf = 0, outDur = OUT, L = null, dpr = 1;

  const width = (str, u) => (str.length * 6 - 1) * u;
  const text = (str, x, y, u, color, k = 1, shadow = null) => {
    // k < 1: o texto aparece em pontilhado Bayer (pixel a pixel)
    [...str].forEach((ch, i) => {
      const rows = F[ch];
      if (!rows) return;
      const ox = x + i * 6 * u;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
        if (!(rows[r] >> (4 - c) & 1)) continue;
        const col = i * 6 + c;
        if (k < 1 && BAYER[(r & 3) * 4 + (col & 3)] / 16 >= k * 1.35 - (col / (str.length * 6)) * 0.35) continue;
        if (shadow) { g.fillStyle = shadow; g.fillRect(ox + c * u + u, y + r * u + u, u, u); }
        g.fillStyle = color; g.fillRect(ox + c * u, y + r * u, u, u);
      }
      if (ch === "É" && k > 0.5) { g.fillStyle = color; g.fillRect(ox + 3 * u, y - 2 * u, u, u); g.fillRect(ox + 2 * u, y - u, u, u); }
    });
  };
  const layout = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const W = Math.round(innerWidth * dpr), H = Math.round(innerHeight * dpr);
    cv.width = W; cv.height = H;
    const words = ARCADE.title.split(" ");
    let lines = [ARCADE.title];
    let u = Math.floor(Math.min((W * 0.74) / width(ARCADE.title, 1), (H * 0.1) / 9));
    if (u < 6 * dpr && words.length > 1) {
      lines = words;
      u = Math.floor(Math.min((W * 0.8) / Math.max(...words.map((w) => width(w, 1))), (H * 0.07) / 9));
    }
    u = Math.max(2, u);
    const us = Math.max(2, Math.round(u * 0.3)), ub = Math.max(2, Math.round(u * 0.42)), uh = Math.max(2, Math.round(u * 0.26));
    const titleH = lines.length * 10 * u - 3 * u;
    const block = 9 * ub + 4 * u + titleH + 6 * u + 7 * us + 9 * u + 7 * ub + 5 * u + 13 * uh;
    let y = Math.round((H - block) / 2);
    const gemY = y; y += 9 * ub + 4 * u;
    const titleY = y; y += titleH + 6 * u;
    const subY = y; y += 7 * us + 9 * u;
    const insY = y; y += 7 * ub + 5 * u;
    const barY = y;
    const barW = Math.min(W * 0.8, width(ARCADE.title, 1) * u * 0.5, 26 * 5 * ub);
    L = { W, H, u, us, ub, uh, lines, gemY, titleY, subY, insY, barY, barW: Math.round(barW / 26) * 26, pad: Math.max(16 * dpr, 4 * uh) };
  };
  const frame = (now) => {
    raf = 0;
    if (finished) return;
    if (!L) layout();
    const { W, H, u, us, ub, uh } = L;
    const t = now - t0;
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    // placar do topo: 1UP e créditos
    const credit = landed ? ARCADE.credit : ARCADE.credit.replace(/\d+$/, (n) => "0".repeat(n.length));
    text("1UP", L.pad, L.pad, uh, C.acc2);
    text("000000", L.pad + width("1UP ", uh) + uh, L.pad, uh, C.text);
    text(credit, W - L.pad - width(credit, uh), L.pad, uh, landed ? C.acc : C.text);
    // o cristal em pixel (assinatura do site) e o nome, os dois entrando em pontilhado Bayer
    const k = Math.min(1, t / 280);
    GEM.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch !== "#" || BAYER[(r & 3) * 4 + (c & 3)] / 16 >= k) return;
      g.fillStyle = r < 3 ? "#8dffe6" : r > 6 ? C.edge : C.acc;
      g.fillRect(Math.round(W / 2 + (c - 3.5) * ub), L.gemY + r * ub, ub, ub);
    }));
    L.lines.forEach((line, i) => text(line, Math.round((W - width(line, u)) / 2), L.titleY + i * 10 * u, u, C.text, k, C.shadow));
    if (t > 120) text(ARCADE.subtitle, Math.round((W - width(ARCADE.subtitle, us)) / 2), L.subY, us, C.dim, Math.min(1, (t - 120) / 240));
    // INSIRA A MOEDA: pisca a 1 Hz (aceso 0,5 s, apagado 0,5 s)
    if (landed) text(ARCADE.credit, Math.round((W - width(ARCADE.credit, ub)) / 2), L.insY, ub, C.acc);
    else if (t > 300 && Math.floor((t - 300) / 500) % 2 === 0) text(ARCADE.insert, Math.round((W - width(ARCADE.insert, ub)) / 2), L.insY, ub, C.acc);
    // moeda caindo (gira trocando a largura do sprite)
    if (coinAt >= 0 && !landed) {
      const p = Math.min(1, (now - coinAt) / 300);
      const cu = ub, cx = W / 2, cy = -8 * cu + (L.insY + 3 * cu + 8 * cu) * p * p;
      const wide = [7, 5, 3, 5][Math.floor((now - coinAt) / 45) % 4];
      COIN.forEach((row, r) => [...row].forEach((ch, c) => {
        if (ch === ".") return;
        const sx = Math.round(cx + ((c - 3) * wide) / 7 * cu * 1.0);
        g.fillStyle = ch === "#" ? (r > 4 ? C.edge : C.acc) : "#ffffff";
        if (wide === 7 && c === 2 && (r === 2 || r === 3)) g.fillStyle = "#ffffff";
        g.fillRect(sx, Math.round(cy + (r - 3) * cu), Math.max(cu * wide / 7, 1) + 0.5, cu);
      }));
      if (p >= 1) { landed = true; SND.play("coin"); }
    }
    // barra CARREGANDO em 26 blocos
    const bp = landed ? Math.min(1, 0.35 + (now - coinAt - 300) / 220) : Math.max(0, Math.min(1, (now - barFrom) / Math.max(1, outAt - barFrom)));
    const seg = L.barW / 26, bx = Math.round((W - L.barW) / 2), by = L.barY + 10 * uh;
    if (t > 260 || coinAt >= 0) text(ARCADE.loading, bx, L.barY, uh, C.dim);
    if (t > 260 || coinAt >= 0) for (let i = 0; i < 26; i++) {
      g.fillStyle = i < Math.floor(bp * 26) ? C.acc : C.off;
      g.fillRect(Math.round(bx + i * seg), by, Math.max(1, Math.round(seg) - Math.max(1, Math.round(uh / 2))), 3 * uh);
    }
    if (now >= outAt) out();
    else raf = requestAnimationFrame(frame);
  };
  const insert = (e) => {
    if (finished || el.classList.contains("out")) return;
    if (e.type === "keydown" && e.key === "Escape") { outDur = OUT_FAST; outAt = performance.now(); out(); return; }
    if (coinAt >= 0) return;
    SND.unlock();
    coinAt = performance.now();
    outAt = Math.min(CAP - OUT, coinAt + 300 + 260);
    if (!raf) raf = requestAnimationFrame(frame);
  };
  const out = () => {
    if (el.classList.contains("out")) return;
    el.style.animationDuration = outDur + "ms";
    el.classList.add("out");
    onReveal();
    setTimeout(finish, outDur + 20);
  };
  function finish() {
    if (finished) return;
    finished = true;
    cancelAnimationFrame(raf);
    ["pointerdown", "keydown", "wheel"].forEach((t) => removeEventListener(t, insert, true));
    removeEventListener("resize", onResize);
    el.remove();
  }
  const onResize = () => { L = null; };
  ["pointerdown", "keydown"].forEach((t) => addEventListener(t, insert, true));
  addEventListener("wheel", insert, { capture: true, passive: true });
  addEventListener("resize", onResize);
  // se a aba estiver escondida, o requestAnimationFrame não roda: o relógio garante a saída
  setTimeout(() => { if (!el.classList.contains("out")) { outAt = performance.now(); out(); } }, Math.max(0, CAP - OUT - performance.now()) + 30);
  layout();
  frame(performance.now());
}

/* Números do hero: contam de 0 até o valor na abertura (o valor final está sempre no HTML) */
function setStat(el, value) {
  el.dataset.target = value;
  if (!el.dataset.counting) el.textContent = value;
}
onIntroStart(function counters() {
  if (!CONFIG.scrollFx) return;
  document.querySelectorAll(".stat b").forEach((b, i) => {
    const m = b.textContent.match(/^(\d+)(.*)$/);
    if (!m) return;
    b.dataset.target = m[1];
    b.dataset.counting = "1";
    const suffix = m[2], t0 = performance.now() + 900 + i * 70, dur = 1100;
    b.textContent = "0" + suffix;
    const step = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / dur));
      const e = 1 - Math.pow(1 - k, 4);
      const target = +b.dataset.target;
      b.textContent = Math.round(target * e) + suffix;
      if (k < 1 && !root.classList.contains("intro-skip")) requestAnimationFrame(step);
      else { b.textContent = b.dataset.target + suffix; delete b.dataset.counting; }
    };
    requestAnimationFrame(step);
  });
});

/* ============================================================
   Topo do site: lanterna, HUD de progresso e modelo 3D
   ============================================================ */
const heroEl = $("#hero");
const stageView = $("#stage-view");

// Posição da lanterna em px, relativa ao topo do hero. O hero3d.js lê este objeto a cada quadro.
const lantern = { x: 0, y: 0, ready: false, nx: 0, ny: 0 };

(function setupLantern() {
  const el = $("#lantern");
  if (!heroEl || !el || !stageView) return;

  let tx = 0, ty = 0, raf = 0, last = 0, lastTouch = -1e9, inView = true;
  let mode = "rest"; // rest | follow-mouse | follow (toque) | wander (toque parado)
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const live = () => CONFIG.lantern && FX.full;

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
  const paint = () => {
    el.style.transform = `translate3d(${lantern.x.toFixed(1)}px, ${lantern.y.toFixed(1)}px, 0)`;
    lantern.nx = (lantern.x / Math.max(1, heroEl.clientWidth)) * 2 - 1;
    lantern.ny = (lantern.y / Math.max(1, innerHeight)) * 2 - 1;
  };
  const place = () => {
    measure();
    const r = rest();
    if (mode === "rest" || !lantern.ready || !live()) { mode = "rest"; tx = lantern.x = r.x; ty = lantern.y = r.y; }
    lantern.ready = true;
    paint();
  };
  // a medição espera o layout assentar (o encaixe do cristal mexe no transform do palco)
  place();
  addEventListener("resize", place);
  addEventListener("load", place);
  if ("ResizeObserver" in window) new ResizeObserver(place).observe(heroEl);

  const tick = (now) => {
    raf = 0;
    if (!live()) return;
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
  const kick = () => { if (live() && !raf && inView && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };

  heroEl.addEventListener("pointermove", (e) => {
    if (!live()) return;
    ({ x: tx, y: ty } = toHero(e));
    if (e.pointerType === "mouse") mode = "follow-mouse";
    else { mode = "follow"; lastTouch = performance.now(); }
    kick();
  }, { passive: true });
  heroEl.addEventListener("pointerdown", (e) => {
    if (!live() || e.pointerType === "mouse") return;
    ({ x: tx, y: ty } = toHero(e));
    mode = "follow"; lastTouch = performance.now();
    kick();
  }, { passive: true });
  heroEl.addEventListener("pointerup", (e) => { if (e.pointerType !== "mouse") lastTouch = performance.now(); }, { passive: true });

  new IntersectionObserver(([en]) => {
    inView = en.isIntersecting;
    heroEl.classList.toggle("offscreen", !inView);
    if (inView) kick();
  }).observe(heroEl);
  document.addEventListener("visibilitychange", kick);
  addEventListener("fxchange", () => { mode = "rest"; place(); kick(); });
  kick();
})();

(function setupHud() {
  const xp = $("#xp");
  if (!xp || !CONFIG.hud) return;
  xp.hidden = false;

  const marks = [...xp.querySelectorAll("a")];
  const targets = marks.map((a) => $(a.getAttribute("href")));
  const fill = $("#xp-fill");
  const head = $("#xp-head");
  const track = xp.querySelector(".xp-track");
  const n = marks.length;
  marks.forEach((a, i) => {
    a.parentElement.style.setProperty("--at", ((i + 1) / n) * 100 + "%");
    const label = a.textContent.trim();
    a.setAttribute("aria-label", `${label}, seção ${i + 1} de ${n}`);
  });

  let tops = [], startLine = 0, first = true, ticking = false, lastActive = -2, trackLen = 0, vertical = true;
  let lastY = scrollY, lastT = performance.now(), vel = 0;
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
    vertical = track.clientHeight > track.clientWidth;
    trackLen = vertical ? track.clientHeight : track.clientWidth;
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
    // cabeça luminosa: acompanha a ponta da barra e brilha mais quando a rolagem é rápida
    const now = performance.now();
    const v = Math.abs(scrollY - lastY) / Math.max(8, now - lastT);
    lastY = scrollY; lastT = now;
    vel = Math.min(1, vel * 0.6 + v * 0.25);
    if (head) {
      const pos = (p / n) * trackLen;
      head.style.transform = vertical ? `translateY(${pos.toFixed(1)}px)` : `translateX(${pos.toFixed(1)}px)`;
      head.style.setProperty("--hv", (0.4 + (FX.full ? vel * 0.6 : 0)).toFixed(2));
    }
    const active = Math.floor(p) - 1; // índice da última seção alcançada
    marks.forEach((a, i) => {
      if (i <= active && !a.classList.contains("lit")) {
        a.classList.add("lit");
        if (!first && FX.full) {
          a.classList.add("flash");
          a.addEventListener("animationend", () => a.classList.remove("flash"), { once: true });
          dispatchEvent(new CustomEvent("hud:lit", { detail: { el: a } }));
        }
      }
    });
    if (active !== lastActive) {
      marks.forEach((a, i) => (i === active ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current")));
      lastActive = active;
    }
    first = false;
    if (vel > 0.02) onScrollHud(); // deixa o brilho apagar devagar depois de parar
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

/* ============================================================
   Carregamento sob demanda: modelo 3D (hero3d.js) e efeitos (fx.js)
   Nada disso atrasa a primeira pintura: tudo entra depois do "load", em tempo ocioso.
   ============================================================ */
const whenIdle = (fn) => {
  const go = () => ("requestIdleCallback" in window ? requestIdleCallback(fn, { timeout: 2500 }) : setTimeout(fn, 400));
  if (document.readyState === "complete") go();
  else addEventListener("load", go, { once: true });
};

const hero3d = (function setupHero3D() {
  let started = false, api = null;
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
    if (started || !CONFIG.hero3d || !stageView) return;
    started = true;
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
        mode: FX.mode,
        intro: introPlayed,
        postfx: CONFIG.postfx,
      }))
      .then((a) => { if (a) { api = a; stageView.hero3d = a; } })
      .catch((err) => console.warn("Modelo 3D indisponível, mantendo a imagem estática:", err));
  };
  if (!CONFIG.hero3d || !stageView) return { start() {} };
  if (FX.full) whenIdle(start);
  else if (FX.why !== "device") {
    // modo reduzido: o 3D (sem movimento automático) só carrega se a pessoa mexer no cristal
    const onDemand = () => { ["pointerenter", "touchstart", "focusin"].forEach((t) => stageView.removeEventListener(t, onDemand)); start(); };
    stageView.tabIndex = 0;
    ["pointerenter", "touchstart", "focusin"].forEach((t) => stageView.addEventListener(t, onDemand, { passive: true }));
  }
  addEventListener("fxchange", (e) => {
    if (api && api.setMode) api.setMode(e.detail.mode);
    if (e.detail.mode === "full") start();
  });
  return { start };
})();

(function setupFx() {
  let mod = null, loading = false;
  const ctx = { CONFIG, FX, SND, lantern, heroEl, stageView, $ };
  const load = () => {
    if (mod || loading) { if (mod) mod.start(ctx); return; }
    loading = true;
    import("./fx.js")
      .then((m) => { mod = m; if (FX.full) m.start(ctx); })
      .catch((err) => console.warn("Efeitos indisponíveis:", err));
  };
  if (FX.full) whenIdle(load);
  addEventListener("fxchange", (e) => {
    if (e.detail.mode === "full") load();
    else if (mod) mod.stop();
  });
})();

loadArt();
loadRoblox();
