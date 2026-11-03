# Portfólio · André Casagrande

Site estático (HTML + CSS + JS) com uma função serverless que puxa as artes do ArtStation.

```
public/            site (index.html, style.css, main.js, assets/)
public/hero3d.js   modelo 3D do topo do site (three.js), carregado depois da página
public/fx.js       efeitos do modo completo (rolagem suave, partículas, cursor, portal, hovers dos jogos), carregado depois da página
public/vendor/     three.js 0.180.0 e Lenis 1.3.27 hospedados no próprio site (licenças MIT em vendor/*/LICENSE)
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


## Efeitos (fase 2): modo completo e modo reduzido

O site tem dois modos, e quem visita escolhe no botão **Efeitos** da barra de navegação (fica salvo no navegador):

- **Completo**: abertura, 3D com pós-processamento, partículas, cursor, rolagem suave e transições.
- **Reduzido**: nada se desloca nem fica em loop; só transições suaves de opacidade e cor. O cristal 3D só carrega se a pessoa passar o mouse, tocar ou focar nele, e aí gira apenas quando ela arrasta.

Qual modo abre por padrão:
1. `?fx=full` ou `?fx=reduced` na URL (bom para testar; não fica salvo).
2. A escolha feita no botão Efeitos.
3. Se o sistema pede menos movimento ("Mostrar animações" desligado no Windows, "Reduzir movimento" no Mac/iPhone) ou o aparelho é fraco (2 GB de memória, 2 núcleos ou menos, ou economia de dados), abre **Reduzido** e mostra um aviso discreto com o botão "Ativar efeitos completos". Senão, abre **Completo**.

### O que anima, e onde
| Efeito | Completo | Reduzido |
|---|---|---|
| Abertura (≤ 1,6 s, uma vez por sessão; clique ou tecla pula): letras do nome em "dissolve 1-bit", luz que acende o cristal, números contando | sim | não |
| Cristal 3D: bloom, aberração cromática sutil, facho de luz volumétrico, poeira no facho, rastros nos estilhaços, parallax da câmera | sim | parado, sem pós-movimento |
| Clique/toque/Enter no cristal: explosão de estilhaços + onda de choque (no máximo 2 por segundo) | sim | não |
| Lanterna que segue o cursor/dedo | sim | luz parada |
| Rolagem suave (só computador com mouse) | sim | não |
| Cristal "encaixa" no HUD ao rolar (telas ≥ 1300 px) | sim | não |
| Títulos que dissolvem, parallax das imagens, faixa de ferramentas com inclinação | sim | faixa parada |
| Galeria: entra em 1-bit e ganha cor; inclinação e brilho no hover | sim | só brilho leve |
| Cards: inclinação, brilho, brasas (House of Photh), pixels 1-bit (The God of Small Things), brilhos (A Lenda do Cristal) | sim (mouse) | não |
| Cursor: brilho de cristal com rastro, rótulos "Jogar"/"Ver"/"Ampliar", botões magnéticos (o cursor normal continua) | sim (mouse) | não |
| HUD: estilhaços quando um cristal acende, cabeça luminosa da barra | sim | só a cor muda |
| Transição portal ao navegar pelo menu/HUD (fase 3; com `portal: false` volta a cortina pontilhada) | sim | não |

### Desligar um efeito
No topo do `public/main.js`, mude para `false`:
`intro`, `postfx`, `cursor`, `smooth`, `scrollFx`, `cardFx`, `wipe` (além dos antigos `hero3d`, `lantern`, `hud`).

### Níveis de qualidade do 3D
O 3D começa escondido no nível barato, mede ~1,2 s de quadros atrás da imagem estática e só então decide:
- **full** (computador): bloom, aberração cromática, facho volumétrico, rastros, 150 partículas de poeira, até 2x de pixel ratio.
- **medium** (celular): bloom mais leve, sem aberração, 90 partículas, até 1,25x.
- **low**: sem pós-processamento, sem facho nem rastros, 40 partículas, 1x.
Se os quadros ficarem lentos, desce um nível sozinho; se nem o **low** aguentar, o cristal para de animar e só redesenha quando alguém mexe. Para ver no console: `document.querySelector('#stage-view').hero3d.state()`.

### Imagem estática do cristal
Se você mudar o visual do cristal, gere de novo `public/assets/hero-crystal-640.webp` e `-1040.webp` (PNG quadrado com fundo transparente convertido para WebP), mantendo os nomes. Peça ao Claude se quiser que ele gere automaticamente.

## Efeitos (fase 3)

Tudo aqui só existe no modo completo. Com `?fx=reduced` na URL ou sem JavaScript, o site fica igual ao normal: sem tela arcade, sem som, sem portal, sem cursor customizado.

| Efeito | O que faz | Desligar (topo do `public/main.js`) |
|---|---|---|
| Tela arcade "INSIRA A MOEDA" | Na primeira visita da sessão, uma tela 8 bits com scanlines mostra o nome em fonte pixel, "INSIRA A MOEDA" piscando devagar (1 vez por segundo) e uma barra "CARREGANDO". Se ninguém mexer, entra sozinha em ~1,6 s. Um clique, toque ou tecla "insere a moeda": ela cai, o crédito vira 01, a barra enche e a tela se desfaz em pontilhado. Esc sai na hora. Nunca passa de 2,2 s. O site inteiro já está carregado por baixo (não atrasa o LCP nem esconde nada do Google). | `arcadeIntro: false` (volta a abertura antiga do hero) |
| Portal | Ao clicar num link do menu, do HUD ou num botão interno (#secao), um anel 1-bit verde/roxo abre a partir do ponto do clique (ou do cristal do HUD, pelo teclado), cobre a tela com um vórtice escuro, a página salta e a seção aparece "dentro" do portal, que abre até sumir. ~750 ms. Qualquer tecla ou clique pula. O endereço (#secao), o "voltar" do navegador e o foco continuam funcionando. | `portal: false` (volta a cortina pontilhada; `wipe: false` tira as duas) |
| Som | Botão **Som** na barra (ícone de alto-falante). Começa **desligado** para todo mundo; a escolha fica salva no navegador. Sons sintetizados na hora (nenhum arquivo): tilintar de cristal quando um cristal do HUD acende (uma nota por seção), "blip" baixinho no hover/clique de botões, sopro no portal, moeda na tela arcade e um zumbido grave quando o mouse entra no topo escuro (lanterna) ou no House of Photh. O áudio só é criado depois de um clique/tecla da pessoa. | `sound: false` (o botão some) |
| Hover dos jogos | Só com mouse: Blox Survival = cubos voxel que sobem e se empilham; Mystic Slime Defense = gotas de slime roxas/verdes que escorrem e bolhas; House of Photh = brasas + tela VHS (scanlines, ruído e faixa de tracking); The God of Small Things = pixels 1-bit; Big Stack = blocos que deslizam e empilham; Capivaras = ondas na lagoa e folhas caindo; A Lenda do Cristal = brilhos. Cada efeito pausa quando o card sai da tela. | `gameFx: false` (os da fase 2 ficam em `cardFx`) |
| Cursor por seção | O acompanhante do cursor (o cursor normal continua) muda de forma e cor em cada seção, com uma troca de 150 ms: Hero = cristal com rastro; Sobre = anel discreto; Galeria = lupa com "Ampliar"; Jogos = mira com "Jogar" (trava em cima dos botões); Assets = cubo com "Ver na Fab"; Formação = selo; Contato = envelope. Só mouse. | `sectionCursor: false` (fica sempre o cristal) |

### Mudar textos e sons
- **Textos da tela arcade**: objeto `ARCADE` logo abaixo do `CONFIG` no `public/main.js`. A fonte pixel só tem as letras A-Z (sem J, K, Q, W, X, Y), É, os números 0-3, espaço, `/`, `-` e `·`. Para outra letra, acrescente uma linha no objeto `F` dentro de `arcadeIntro()` (7 números, um por linha do caractere; cada número é uma linha de 5 pixels em binário, por exemplo `31` = `11111`).
- **Sons**: objeto `SOUNDS` dentro de `SND` no `public/main.js`. Cada som é uma receita curta (tipo de onda, frequência em Hz, duração em segundos, volume). O volume geral é `VOL` (0,14). O intervalo mínimo entre repetições de cada som fica em `GAP`.
- **Cores e formas do cursor**: `CUR` (cores) e `SECTION_SHAPE` (seção -> forma) no começo do `public/fx.js`.
- **Tempo do portal**: `PORTAL` no `public/fx.js` (`open`, `hold`, `reveal` em ms).

### Acessibilidade
- A tela arcade é `aria-hidden`, não recebe foco e sai do DOM ao terminar; Tab e o teclado continuam funcionando por baixo. O texto pisca a 1 Hz (bem abaixo do limite de 3 por segundo).
- O botão Som tem `aria-pressed` e nome "Som". Nada toca sozinho.
- O portal leva o foco para a seção de destino, como um link normal.
