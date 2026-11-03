/* ============================================================
   Fase 3, parte carregada logo no início (só no modo completo): som e tela arcade.
   Fica fora do main.js para não pesar no carregamento: o main.js importa este arquivo
   sem bloquear a página, e o CSS cobre a tela nos primeiros quadros (html.arcade::after).
   ============================================================ */
let CONFIG, ARCADE, FX, root;
const $ = (sel) => document.querySelector(sel);

// CSS do botão Som (fica aqui para não pesar no style.css, que bloqueia a primeira pintura)
const CSS = `.snd-toggle { display: inline-flex; align-items: center; gap: 7px; height: 36px; padding: 0 12px 0 10px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.03); font-size: 0.8rem; color: #a2a8b2; transition: border-color var(--t-fast), color var(--t-fast); } .snd-toggle:hover { border-color: rgba(44, 245, 192, 0.45); color: var(--text); } .snd-toggle svg { flex: none; } .snd-toggle .snd-w { display: none; } .snd-toggle[aria-pressed="true"] { color: var(--accent); border-color: rgba(44, 245, 192, 0.4); } .snd-toggle[aria-pressed="true"] .snd-w { display: inline; } .snd-toggle[aria-pressed="true"] .snd-x { display: none; } @media (max-width: 820px) { .snd-toggle { width: 40px; height: 40px; padding: 0; justify-content: center; } .snd-txt { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; } }`;

export function init(c) {
  ({ CONFIG, ARCADE, FX, root } = c);
  const st = document.createElement("style");
  st.textContent = CSS;
  document.head.appendChild(st);
  window.SND = SND;
  soundUi();
  if (c.arcade) arcadeIntro(c.onReveal, c.arcadeEnd);
  return SND;
}

/* ============================================================
   Som (opcional, DESLIGADO por padrão). Tudo sintetizado com WebAudio, sem arquivos.
   O AudioContext só nasce num clique/tecla da pessoa, e só se ela ligou o "Som".
   Para mudar um som, edite a receita em SOUNDS (frequências em Hz, tempos em segundos).
   ============================================================ */
export const SND = (() => {
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

function soundUi() {
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
}

function arcadeIntro(onReveal, arcadeEnd) {
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
    dpr = 1; // pixel art: desenha na resolução CSS e o navegador amplia com "pixelated" (4x menos trabalho no celular)
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
  let lastKey = "";
  const frame = (now) => {
    raf = 0;
    if (finished) return;
    if (now >= outAt) { out(); return; }
    raf = requestAnimationFrame(frame);
    if (!L) { layout(); lastKey = ""; }
    const { W, H, u, us, ub, uh } = L;
    const t = now - t0;
    // só redesenha quando algo visível muda (pontilhado, piscar, barra, moeda)
    const bpk = landed ? Math.min(1, 0.35 + (now - coinAt - 300) / 220) : Math.max(0, Math.min(1, (now - barFrom) / Math.max(1, outAt - barFrom)));
    const key = [Math.min(8, Math.floor(t / 40)), t > 300 && Math.floor((t - 300) / 500) % 2, Math.floor(bpk * 26), t > 260, coinAt >= 0 && !landed ? Math.floor((now - coinAt) / 16) : -1, landed].join();
    if (key === lastKey) return;
    lastKey = key;
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
    arcadeEnd();
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
