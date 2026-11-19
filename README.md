# Mochi — Adjudicator of the Internet

A playable prototype with **two stages**. In **Stage 1** (Validator Run), Mochi runs through a world of computers, cables, and satellites to recruit **5 validators**. Each validator requires a stake of **42,000** tokens.

Once all five validators are recruited, Mochi becomes the Adjudicator of the Internet, and **Stage 2** opens up a single course: Contract Market, Oracle Port, and Rally Square, connected by bridges, with the camera positioned behind and above her. Each island has its own colors and flooring. Silver robots argue beneath a vertical red beam. The **Stage 2** button on the title screen takes you straight to Contract Market.

Procedural 3D geometry built with Three.js. Original code, with no paid assets.

## How to run

Requirements: Node.js 18 or newer.

```bash
npm install
npm run dev
```

Open the URL shown by Vite. The local server uses port **47321** and the base path `/mochi-game/`, for example `http://127.0.0.1:47321/mochi-game/`. The published version is available at [https://cgmello.github.io/mochi-game/](https://cgmello.github.io/mochi-game/).

Production build:

```bash
npm run build
npm run preview
```

Collision tests (no browser required):

```bash
npm test
```

## Stage 1 controls

| Key | Action |
| --- | --- |
| Up arrow | Jump |
| Down arrow | Crouch / slide |
| Left / right arrow | Switch lanes |
| Touch | Swipe in the direction you want to move. Touchscreens also have on-screen buttons. |

W, A, S, D, and Space provide alternative controls for jumping, crouching, and switching lanes.

## Stage 2 controls

| Key | Action |
| --- | --- |
| Up arrow | Run forward |
| Down arrow | Walk backward slowly |
| Left / right arrow | Turn |
| Space | Jump, including from one server to another |

W, A, and D provide alternative controls for running and turning. The down arrow and S let you walk backward slowly. The minimap shows only Mochi's current island, zoomed in to fill the circle, with bridge exits at the edge. While crossing a bridge, the map switches to the nearest island and shows the bridge. Each resolved dispute earns **1 token**. Large golden tokens in elevated locations are worth **3 tokens** and appear on the minimap. A stopwatch high up in Oracle Port adds **30 seconds** (`+30s`); another in Rally Square adds **1 minute** (`+1:00`). Both rotate around their vertical axis, just like the tokens. At the start of each stage, a large panel in the center displays the full text at once, alongside Mochi's portrait. The game stays paused until you press Enter or Space. At the end of Stage 2, Enter restarts the run and Esc returns to the menu. There are **45 disputes** in a single run, with one pair of robots per pit and around 15 on each island, and **5 minutes** on the clock: **Contract Market** (pink flooring), **Oracle Port** (a teal grid), and **Rally Square** (orange and gold). Open bridges connect the islands. Robot spiders patrol the ground. Strips marked with arrows provide a speed boost for about 3 seconds.

If time runs out, the **THE END** screen appears, the tokens collected during the run are lost, and the course restarts. To win, collect all 45 tokens. Pits around the agents have warning borders and either a gap to jump across or a bridge. Falling costs 1 token and returns Mochi to the last **checkpoint**. Jumping along a row of servers all the way to the last one makes Mochi perform flips in midair.

## Rules

- Tokens are worth **500**, **1,000**, **5,000**, or **10,000**. The 10,000-token pickup sits above the server trains: go up the ramp (or jump onto the front if there is no ramp), then jump again from the top to collect it. Hitting a train head-on without jumping or using a ramp costs one life.
- Conveyor strips marked with arrows cover 1, 2, or 3 lanes (usually 1 or 2). Running over them speeds Mochi up for about 3 seconds; you can dodge them. The base speed also increases gradually throughout the run.
- The music changes each time a validator is completed: five grooves, each faster and more layered than the last. The Sound button mutes both sound effects and music.
- Losing all 3 lives breaks the current stake: a red aura pulses around Mochi, tokens burst outward and fall, and the validator's progress circle empties. The camera and Mochi remain steady, without shaking or flashing.
- The current validator's progress circle fills up to 42,000 tokens. Once it is full, a validator robot appears and greets Mochi. The next validator starts from zero, with any tokens beyond 42,000 carried over.
- You have **3 lives**. Hitting an obstacle costs 1 life and grants a brief period of invulnerability.
- Losing all 3 lives resets the **current** validator's token balance to zero. Previously recruited validators remain, and your lives are fully restored.
- Once all 5 validators are recruited, Stage 1 ends and Stage 2 can begin. The music continues across both stages and becomes fuller as disputes on the islands are resolved. The Sound button mutes both sound effects and music.

The title screen uses `public/mockup.jpg`.
