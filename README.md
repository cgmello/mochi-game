# Mochi — Adjudicator of the Internet

Protótipo jogável da **Fase 1**. A Mochi, mascote da GenLayer, corre por um mundo de computadores, cabos e satélites para reunir **5 validadores**. Cada validador exige um stake de **42.000 GEN**.

Quando os cinco estão completos, a Mochi vira a Adjudicator of the Internet. A Fase 2 (percorrer o mundo resolvendo conflitos entre agentes de IA, com a câmera mais distante) fica para depois — esta build só mostra a tela de conclusão.

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

## Controles

| Tecla | Ação |
| --- | --- |
| Seta para cima | Pular |
| Seta para baixo | Agachar / deslizar |
| Seta esquerda / direita | Trocar de faixa |
| Toque | Deslize na direção do movimento. Em telas de toque também há botões. |

W, A, S, D e espaço repetem pulo e troca de faixa.

## Regras

- As moedas GEN valem **500**, **1.000**, **5.000** ou **10.000**. O tamanho e o brilho mudam com o valor. A de 10.000 é dourada, maior, com rastro de faíscas, e fica no alto: só dá para pegar no ponto mais alto do pulo (seta para cima).
- O círculo do validador atual enche até 42.000 GEN. Ao completar, um robô validador aparece e cumprimenta a Mochi. O próximo validador começa do zero (o que passar de 42.000 entra no seguinte).
- São **3 vidas**. Bater num obstáculo tira 1 vida e dá um instante de invulnerabilidade.
- Ao perder as 3 vidas, o GEN do validador **atual** volta a zero. Validadores já conquistados permanecem, e as vidas enchem de novo.
- Com os 5 validadores, a fase termina.

A tela de abertura usa `public/mockup.jpg`.
