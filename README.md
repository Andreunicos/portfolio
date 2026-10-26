# Portfólio · André Casagrande

Site estático (HTML + CSS + JS) com uma função serverless que puxa as artes do ArtStation.

```
public/            site (index.html, style.css, main.js, assets/)
api/artstation.js  função da Vercel: busca os projetos no ArtStation (cache de 1h)
vercel.json        diz à Vercel para servir a pasta public/ sem build
```

## Publicar na Vercel
1. Suba esta pasta inteira para um repositório no GitHub (ou arraste a pasta em vercel.com/new).
2. Em Framework Preset deixe **Other**. Não precisa de build.
3. Deploy. A galeria usa `/api/artstation`, que só existe na Vercel (não funciona abrindo o index.html direto).

## O que editar
- `public/main.js` (topo): usuário do ArtStation, nome e link da loja na Fab, lista de assets, níveis das ferramentas.
- `public/index.html`: textos, jogos e links.
- A Lenda do Cristal: quando for aprovado na Google Play, troque o botão "Em breve" pelo link
  `https://play.google.com/store/apps/details?id=com.bighouse.alendadocristal` (há um comentário no HTML mostrando onde).
- Imagens do Roblox (`tr.rbxcdn.com`) vêm do CDN do Roblox e podem expirar com o tempo. Se alguma sumir, salve a captura em `public/assets/` e troque o link.
- Fotos melhores da Big Stack/Capivaras: substitua `public/assets/bigstack-shots.jpg`, `capivaras-shots.jpg` e os ícones mantendo o nome do arquivo.
