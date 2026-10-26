// Função serverless da Vercel: faz a "ponte" com a API pública do ArtStation.
// O navegador não consegue chamar o ArtStation direto (CORS), então o site chama /api/artstation
// e esta função busca, limpa e devolve os projetos já prontos, com cache de 1h.

const DEFAULT_USER = "andrecasagrande";
const MAX_PAGES = 6; // 50 projetos por página no máximo; 6 páginas cobre de sobra

module.exports = async (req, res) => {
  const user = String((req.query && req.query.user) || DEFAULT_USER).replace(/[^a-zA-Z0-9_-]/g, "");

  try {
    let total = 0;
    const raw = [];

    for (let page = 1; page <= MAX_PAGES; page++) {
      const r = await fetch(`https://www.artstation.com/users/${user}/projects.json?page=${page}`, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; portfolio-sync)", Accept: "application/json" },
      });
      if (!r.ok) throw new Error(`ArtStation respondeu ${r.status}`);

      const json = await r.json();
      const items = json.data || json.projects || [];
      total = json.total_count || total;
      raw.push(...items);

      if (!items.length || raw.length >= total) break;
    }

    const projects = raw
      .filter((p) => p && p.cover && !p.hide_as_adult)
      .map((p) => {
        const base = p.cover.small_square_url || p.cover.micro_square_image_url || "";
        return {
          id: p.id,
          title: p.title,
          url: p.permalink,
          // "medium" mantém a proporção original da arte (bom para o grid em masonry)
          image: base.replace("/small_square/", "/medium/").replace("/micro_square/", "/medium/"),
          thumb: base,
          likes: p.likes_count || 0,
          published: p.published_at,
        };
      });

    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ user, total: total || projects.length, projects });
  } catch (err) {
    res.setHeader("Cache-Control", "no-store");
    res.status(502).json({ error: "Não foi possível carregar o ArtStation agora.", detail: String(err.message || err) });
  }
};
