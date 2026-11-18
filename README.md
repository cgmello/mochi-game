# Mochi — Adjudicator of the Internet

Protótipo jogável da **Fase 1** e da **Fase 2**. A Mochi, mascote da GenLayer, corre por um mundo de computadores, cabos e satélites para reunir **5 validadores**. Cada validador exige um stake de **42.000 GEN**.

Quando os cinco estão completos, a Mochi vira a Adjudicator of the Internet e a **Fase 2** abre um percurso só: Contract Market, Oracle Port e Rally Square, ligados por pontes, com a câmera atrás e acima. Cada ilha tem cor e piso próprios. Robôs prateados discutem sob um raio vermelho vertical. O botão **Phase 2** na abertura entra direto em Contract Market.

Geometria 3D procedural em Three.js. Código original, sem assets pagos.

## Como rodar

Requisitos: Node.js 18 ou mais novo.

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar. O servidor local usa a porta **47321**, por exemplo `http://127.0.0.1:47321`.

Build de produção:

```bash
npm run build
npm run preview
```

Testes da colisão (sem abrir o navegador):

```bash
npm test
```

## Controles da Fase 1

| Tecla | Ação |
| --- | --- |
| Seta para cima | Pular |
| Seta para baixo | Agachar / deslizar |
| Seta esquerda / direita | Trocar de faixa |
| Toque | Deslize na direção do movimento. Em telas de toque também há botões. |

W, A, S, D e espaço repetem pulo e troca de faixa.

## Controles da Fase 2

| Tecla | Ação |
| --- | --- |
| Seta para cima | Correr para a frente |
| Seta para baixo | Não faz nada |
| Seta esquerda / direita | Virar |
| Espaço | Pular, inclusive de servidor em servidor |

W, A e D repetem correr e virar. Seta para baixo e S não fazem nada. O minimapa mostra as três ilhas, as pontes e para onde a Mochi está olhando. Cada briga resolvida vale **1 token**. São **45 brigas** numa corrida só, uma dupla por fosso, cerca de 15 em cada ilha, com **5 minutos** no relógio: **Contract Market** (piso rosa), **Oracle Port** (grade verde-água) e **Rally Square** (laranja e ouro). Pontes livres ligam as ilhas. Aranhas-robô patrulham o piso. Faixas com setas dão cerca de 3 segundos de impulso.

Se o tempo acaba, a tela **THE END** aparece, os tokens da corrida se perdem e o percurso recomeça. Vencer é juntar os 45. Buracos em volta dos agentes têm borda de alerta e um vão ou uma ponte. Cair custa 1 token e a Mochi volta ao último **checkpoint**. Uma fileira de servidores, pulada em sequência até o último, faz a Mochi dar cambalhotas no ar.

## Regras

- As moedas GEN valem **500**, **1.000**, **5.000** ou **10.000**. A de 10.000 fica acima dos trens de servidores: suba a rampa (ou pule na frente, se não houver rampa) e pule de novo em cima para pegá-la. Bater de frente no trem, sem pular e sem rampa, tira uma vida.
- Faixas de esteira com setas cobrem 1, 2 ou 3 pistas (quase sempre 1 ou 2). Passar por cima acelera a Mochi por cerca de 3 segundos; dá para desviar. A velocidade base também sobe aos poucos ao longo da corrida.
- A música muda a cada validador concluído: cinco levadas, cada uma mais rápida e com mais camadas. O botão Sound corta efeitos e música.
- Perder as 3 vidas quebra o stake atual: uma aura vermelha pulsa em volta da Mochi, as fichas GEN estouram e caem, e o círculo do validador esvazia. A câmera e a Mochi ficam firmes, sem tremor nem piscada.
- O círculo do validador atual enche até 42.000 GEN. Ao completar, um robô validador aparece e cumprimenta a Mochi. O próximo validador começa do zero (o que passar de 42.000 entra no seguinte).
- São **3 vidas**. Bater num obstáculo tira 1 vida e dá um instante de invulnerabilidade.
- Ao perder as 3 vidas, o GEN do validador **atual** volta a zero. Validadores já conquistados permanecem, e as vidas enchem de novo.
- Com os 5 validadores, a Fase 1 termina e a Fase 2 pode começar. A música continua nas duas fases e fica mais cheia conforme as brigas da ilha são resolvidas. O botão Sound corta efeitos e música.

A tela de abertura usa `public/mockup.jpg`.
