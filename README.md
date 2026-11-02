# Portfólio · André Casagrande

Site estático (HTML + CSS + JS) com uma função serverless que puxa as artes do ArtStation.

```
public/            site (index.html, style.css, main.js, assets/)
public/hero3d.js   modelo 3D do topo do site (three.js), carregado depois da página
public/vendor/     three.js 0.180.0 hospedado no próprio site (licença MIT em vendor/three/LICENSE)
public/models/     coloque aqui o seu .glb
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
- Resultado da 1-BIT JAM 15 (The God of Small Things): preencha `jamResult` no topo do `public/main.js`.
- As imagens de A Lenda do Cristal e do The God of Small Things vêm direto da Google Play e do itch.io. Se alguma sumir, salve a imagem em `public/assets/` e troque o link.
- Imagens do Roblox (`tr.rbxcdn.com`) vêm do CDN do Roblox e podem expirar com o tempo. Se alguma sumir, salve a captura em `public/assets/` e troque o link.
- Fotos melhores da Big Stack/Capivaras: substitua `public/assets/bigstack-shots.jpg`, `capivaras-shots.jpg` e os ícones mantendo o nome do arquivo.

## Topo do site: cristal 3D, lanterna e barra de progresso

Três efeitos que funcionam juntos. Cada um tem um interruptor no topo do `public/main.js`:

```js
hero3d: true,   // modelo 3D que gira com o mouse/dedo
lantern: true,  // luz que segue o cursor
hud: true,      // barra de progresso com cristais por seção
heroModel: "",  // seu .glb (vazio = cristal procedural)
heroModelAlt: "", // descrição do seu modelo para leitores de tela
```

Coloque `false` para desligar um efeito. O resto do site continua igual.

### Modelo 3D
- A página abre com uma **imagem estática** do cristal (`public/assets/hero-crystal-640.webp` e `-1040.webp`). O three.js só é baixado depois que a página termina de carregar, e o modelo entra por cima da imagem com um fade.
- Gire arrastando com o mouse (para os lados e um pouco para cima/baixo) ou com o dedo (só para os lados, para a rolagem da página continuar funcionando). Com o palco em foco, as setas do teclado também giram. Parado, ele gira sozinho bem devagar.
- A imagem estática fica no lugar do 3D quando: o aparelho pede movimento reduzido, está em modo de economia de dados, é fraco (2 GB de memória ou 2 núcleos ou menos), ou não tem WebGL2.
- O 3D pausa quando sai da tela ou a aba fica escondida.
- Nada vem de CDN: o three.js está em `public/vendor/three/`.

### Trocar o cristal pelo seu modelo (.glb)
1. No Blender: **File > Export > glTF 2.0**, formato **glTF Binary (.glb)**.
   - Marque **Apply Modifiers**.
   - Texturas de no máximo **2048 px** (1024 px costuma bastar).
   - Tente deixar o arquivo com **menos de 3 MB**.
   - Não precisa centralizar nem acertar a escala: o site faz isso sozinho.
2. Salve o arquivo como `public/models/hero.glb`.
3. No `public/main.js`, preencha:
   ```js
   heroModel: "models/hero.glb",
   heroModelAlt: "Caneca viking estilizada pintada à mão",
   ```
4. Se o arquivo não carregar, o site continua mostrando o cristal (e avisa no console).
5. Se o arquivo ficar grande e você quiser usar compressão **Draco**, peça ao Claude: o carregador do Draco ainda não está incluído.
6. A imagem estática do começo ainda é o cristal. Para combinar com o seu modelo, exporte do Blender um render PNG quadrado com fundo transparente (1040 x 1040), converta para WebP e substitua `public/assets/hero-crystal-1040.webp` e `hero-crystal-640.webp` (640 x 640), mantendo os nomes.

### Lanterna
- No computador, a luz quente segue o cursor: ilumina o cristal de verdade (uma luz dentro da cena 3D) e deixa um brilho suave no fundo, com a borda em pontilhado 1-bit.
- No celular, a luz segue o dedo e, quando ninguém está tocando, passeia devagar em volta do cristal.
- Com movimento reduzido ou só teclado, a luz fica parada.
- O texto nunca depende da luz: o contraste fica acima de 4,5:1 em qualquer posição.

### Barra de progresso (HUD)
- Um cristal para cada seção (Sobre, Galeria 3D, Jogos, Assets, Formação, Contato). Cada um acende na primeira vez que a seção aparece e continua aceso. O da seção atual brilha mais.
- Telas largas (1300 px ou mais): trilho vertical na borda direita. Telas menores: linha fina logo abaixo da barra de navegação. Ela some enquanto o menu do celular está aberto.
- Cada cristal é um link para a seção. Funciona com teclado (Tab) e mostra o nome ao passar o mouse ou focar.
- Para mudar as seções, edite a lista `<nav class="xp">` no `public/index.html` (o `href` precisa ser o `id` da seção).
