// Função serverless da Vercel: busca no Roblox as capturas de tela e o ícone dos jogos.
// Os links de imagem do Roblox expiram, então o site pede links novos a esta função
// (cache de 6h) em vez de guardar endereços fixos no HTML.
//
// Uso: /api/roblox?places=124276279483504,70698901839021   (IDs de "place", os números da URL do jogo)

const UA = { "User-Agent": "Mozilla/5.0 (compatible; portfolio-sync)", Accept: "application/json" };

async function getJson(url) {
  const r = await fetch(url, { headers: UA });
  if (!r.ok) throw new Error(`${new URL(url).host} respondeu ${r.status}`);
  return r.json();
}

module.exports = async (req, res) => {
  const places = String((req.query && req.query.places) || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{5,20}$/.test(s))
    .slice(0, 6);

  if (!places.length) {
    res.status(400).json({ error: "Informe ?places=ID1,ID2 (somente números)." });
    return;
  }

  try {
    // 1) place id -> universe id
    const universes = {};
    await Promise.all(
      places.map(async (p) => {
        try {
          const j = await getJson(`https://apis.roblox.com/universes/v1/places/${p}/universe`);
          if (j && j.universeId) universes[p] = j.universeId;
        } catch (_) { /* esse jogo fica sem imagens, os outros seguem */ }
      })
    );

    const ids = [...new Set(Object.values(universes))];
    const games = {};
    places.forEach((p) => { games[p] = { universeId: universes[p] || null, icon: null, thumbnails: [] }; });

    if (ids.length) {
      const list = ids.join(",");
      const [shots, icons] = await Promise.all([
        getJson(`https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${list}&countPerUniverse=6&defaults=false&size=768x432&format=Png&isCircular=false`).catch(() => ({ data: [] })),
        getJson(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${list}&returnPolicy=PlaceHolder&size=256x256&format=Png&isCircular=false`).catch(() => ({ data: [] })),
      ]);

      places.forEach((p) => {
        const u = universes[p];
        if (!u) return;
        const s = (shots.data || []).find((d) => d.universeId === u);
        const i = (icons.data || []).find((d) => d.targetId === u);
        games[p].thumbnails = ((s && s.thumbnails) || [])
          .filter((t) => t.state === "Completed" && t.imageUrl)
          .map((t) => t.imageUrl);
        games[p].icon = i && i.state === "Completed" ? i.imageUrl : null;
      });
    }

    res.setHeader("Cache-Control", "public, s-maxage=21600, stale-while-revalidate=86400");
    res.status(200).json({ games });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "Não foi possível consultar o Roblox agora.", detail: String(err.message || err) });
  }
};
