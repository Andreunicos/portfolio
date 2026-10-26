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
  { title: "Viking Tankard", sub: "Stylized Hand-Painted Game Asset", match: "tankard", icon: "🍺" },
  { title: "Low Poly Nature Pack", sub: "Árvores, rochas e props", match: "nature", icon: "🌳" },
  { title: "Post-apocalyptic Melee Weapons Pack", sub: "Game Ready", match: "melee", icon: "🪓" },
  { title: "Stylized Fantasy Keys Pack", sub: "Chaves de fantasia", match: "keys", icon: "🗝️" },
  { title: "Stylized Potion Bottles Pack", sub: "Poções e frascos", match: "potion bottles", icon: "🧪" },
  { title: "Adventure Complete Pack", sub: "Low Poly · Medieval estilizado", match: "adventure", icon: "🏰" },
  { title: "PS1 Style Wooden Doors Pack", sub: "10 portas low poly", match: "doors", icon: "🚪" },
  { title: "Stylized Crystal Pack", sub: "10 gemas de fantasia", match: "crystal", icon: "💎" },
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
});
menu.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    menu.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
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

async function loadArt() {
  try {
    const r = await fetch(`/api/artstation?user=${CONFIG.artstationUser}`);
    if (!r.ok) throw new Error("API " + r.status);
    const data = await r.json();
    if (!data.projects || !data.projects.length) throw new Error("vazio");
    projects = data.projects;
    const stat = $("#stat-art");
    if (stat) stat.textContent = data.total || projects.length;
  } catch (err) {
    console.warn("ArtStation indisponível, usando artes fixas:", err);
    projects = FALLBACK_ART;
  }
  renderMore();
  renderAssets();
}

/* ============================================================
   Assets da Fab
   ============================================================ */
$("#fab-name").textContent = CONFIG.fabName;
$("#fab-link").href = CONFIG.fabUrl;

function renderAssets() {
  $("#assets-grid").innerHTML = FAB_ASSETS.map((a) => {
    const art = projects.find((p) => p.title && p.title.toLowerCase().includes(a.match));
    const img = art ? `<img src="${esc(art.image)}" alt="${esc(a.title)}" loading="lazy" onerror="this.remove()">` : a.icon;
    return `<a class="asset reveal in" href="${esc(CONFIG.fabUrl)}" target="_blank" rel="noopener">
      <div class="img">${img}</div>
      <div class="info">${esc(a.title)}<small>${esc(a.sub)}</small></div></a>`;
  }).join("");
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

loadArt();
