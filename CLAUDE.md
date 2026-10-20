# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository nature

This is a **game design document (GDD) repository**, not a code project. It contains standalone GDD files, written in Portuguese, one per game/franchise:

- `RallySurvive.md` — the racing franchise (RallySurvive, Navigation Expert, RaceLegenda, Street Legends).
- `StarExpeditionCo.md` — space team-management with idle expeditions.
- `PaddockBoss.md` — racing-team management sim: the race is simulated on a topdown 2D map while the player invests live (car engineering, marketing, driver training, pit crew, pit/tire strategy). Despite the racing theme it is **not** part of the Rally franchise: no `ChevronGuide`, no mouse driving, no shared track format.
- `EvilEnemyDefense.md` and `GuerreiroDaMasmorra.md` — GDDs reverse-engineered from playable web prototypes (`abraaovilanova/evil-enemy-defense`, `abraaovilanova/guerreiro-da-masmorra`). The prototype's code is the behavioral spec: Parte 1 describes what it does, Parte 2+ ports it to Unity. When the prototype's own docs disagree with its code, these GDDs follow the code and log the gap under "Em aberto".
- `CraftDice.md` — roguelike + soulslike RPG: topdown 2D exploration of a fixed handmade map, with battles resolved by forgeable dice (attack, defense, spell). Fully offline; dying wipes the whole run. Unrelated to `DiceAndBlood.md` despite the shared dice theme.
- `PaperFlight.md` — portrait mobile "launch" incremental: slingshot a paper plane, glide (speed is altitude, stall below a speed), tap for wind and swipe to pitch, then buy upgrades in 5 tracks; 5 maps whose goal unlocks the next and resets everything.
- `UltimaEntrega.md` — 2D sidescroller platformer with psychological horror (a courier balancing a stack of boxes). Its Unity guide starts at the `## Unity: ` headings, not at a "Parte".
- `ProjetoHex.md` — isometric 2D hex-grid strategy in the style of Catan, but with no dice or turns: scouts reveal fogged hexes, villages/cities on hex intersections (vertices) collect resources on timers, roads on edges, idle offline progress, and one AI rival competing for space. "Projeto Hex" is a working name (the real name is "Em aberto"); its Unity guide does its own hex math (`HexCoord`/`VertexCoord`/`EdgeCoord`) instead of Unity's Tilemap, because the game needs vertices and edges.
- `CacaAsBruxas.md` — souls-like where the player is the hunted witch. Early GDD with no Unity guide yet, so it's `gddOnly: true` in `GAMES` (site shows only the "GDD" page).
- `GDD_8-Bit_Armageddon.md`, `RequiemOfBlessings.md`, `DiceAndBlood.md`, `GDD_Protocolo_Ectoplasma.md` — other separate games (see the `GAMES` table in `site/scripts/split-gdds.mjs` for one-line descriptions).
- `SpaceHauler.md` — a **separate game** derived from `FuryHauler.md` (own glossary in `contexts/space-hauler/`, own save): a cargo ship flies itself between planets in isometric space. Differences that matter when editing: 6 hardpoints with 180° arcs and none covering 360°, enemies come from the arc of the node's trip type (open space = behind, asteroid belt = front/sides with indestructible asteroids, pirate route = 360°) and match the ship's cruise speed, Carenagem (`HullPlating`) is a ship upgrade that only reduces collision damage, and the Estação is a no-combat route node for paid hull repair. It was written fresh on Fury's structure, not as a diff, so Fury edits don't carry over. Its prototype `prototipos/space-hauler/` started as a copy of `fury-hauler/` and uses PixelLab art in `Sprites/SpaceHauler/` (same recipe and tools as Fury's).
- `GDD_8-Bit_Armageddon_Iso.md` — a **separate game** (own glossary in `contexts/8-bit-armageddon-iso/`, own save): 8-Bit Armageddon's rules on an isometric camera, without ads or Revive. The rules stay on a 2D ground plane; only the view is projected (Unity guide: `IsoProjection`, `IsoView` on a `View` child, `IsoFloor` for things lying on the grid). Its prototype `prototipos/8-bit-armageddon-iso/` started as a copy of `8-bit-armageddon/` (they no longer share code) and reads art from both `Sprites/8-Bit-Armageddon/` and `Sprites/8-Bit-Armageddon-Iso/` (only the grid tiles), so both folders must be deployed.
- `tutorial-mvp-completo-unity.md` — Unity tutorial only (Mercador & Legião), no GDD of its own.

`prototipos/` is the one exception to "no code": plain HTML/JS playable prototypes, one folder per game (open `index.html`, no build), each following its GDD's Parte 1: `8-bit-armageddon/`, `star-expedition-co/`, `paddock-boss/`, `rallysurvive/`, `requiem-of-blessings/`, `paper-flight/`, `craft-dice/`, `evil-enemy-defense/`, `guerreiro-da-masmorra/`, `protocolo-ectoplasma/`, `dice-and-blood/`, `ultima-entrega/`, and the other three Rally games `navigation-expert/`, `race-legenda/` and `street-legends/`. Those three share `prototipos/rally-core/` (the Parte 1 Core: `CarController`, `ChevronGuide`, 8-direction car sprites, local ranking) and use PixelLab pixel art in the `rally2d` repo's style (`Sprites/NavigationExpert/`, `Sprites/RaceLegenda/`, `Sprites/StreetLegends/`; recipe and download tools in `Sprites/RallyFranquia/`), unlike `rallysurvive/`, which is standalone and uses the vector art in `Sprites/Rally2D/`. `evil-enemy-defense/` and `guerreiro-da-masmorra/` rewrite the original web prototypes (the other repos) with this repo's new art. `iso-rpg/` has no GDD of its own: it is `guerreiro-da-masmorra/`'s rules (same combat code) on Fury Hauler's isometric pixel-art camera, with PixelLab art in `Sprites/IsoRpg/` (generated by `Sprites/IsoRpg/_tools/baixar.py`); its hub card links to the Guerreiro GDD. Unlike Guerreiro it has 42 dungeons in 6 fixed biomes (7 each, `BIOMES` in its `game.js`); each biome has its own PixelLab tiles, scenery, 3–4 monsters and a boss; a biome whose tiles fail to load falls back to the Orc Dungeon's art and cast. `prototipos/index.html` is the hub page that lists them all (screenshots in `prototipos/thumbs/`), and the site navbar links to it. Each prototype loads art straight from its `Sprites/<Game>/` folder, so renaming those sprites breaks it; dev URL shortcuts are in each prototype's `README.md`.

- **New prototype** → add a card to `GAMES` in `prototipos/index.html` and add its `Sprites/<Game>` folder to the copy list and to `paths` in `.github/workflows/deploy-site.yml`, or its art 404s on the site.

There is no Unity project, no build system, and no test suite here — the repository's "product" is the design documents themselves. There are no lint/build/test commands to run.

Each GDD file is self-contained: its own "Parte 1 — GDD" (or GDD Core) section plus its own Unity implementation guide. Don't assume content from one file applies to another — they are separate games with separate mechanics, only sharing the repo's overall Markdown conventions (see "Conventions when editing this document" below, which apply repo-wide, not just to `RallySurvive.md`).

## Site (Docusaurus / GitHub Pages)

`site/` is a Docusaurus site that publishes the GDDs to GitHub Pages (`https://manguebyte.github.io/gdd/`) via `.github/workflows/deploy-site.yml` on every push to `main`. The root `.md` files stay the single source of truth — never edit `site/docs/` (generated, gitignored). `site/scripts/split-gdds.mjs` splits each GDD into two pages, "GDD" and "Guia Unity", using the `GAMES` table at the top of the script (`guideStart`/`gddStart` regexes match the heading where the Unity guide starts/ends). Commands, run inside `site/`: `npm start` (local preview with live reload of the root `.md` files), `npm run build`.

- **New GDD file** → add a line to `GAMES`, or it won't appear on the site.
- **Renaming the heading where a Unity guide starts** → update that game's `guideStart`; the build fails loudly if it no longer matches.

If future work adds an actual Unity project (scripts, scenes, assets) alongside this GDD, that project's own tooling (Unity Editor, .NET/C# compiler) should be documented separately once it exists — don't assume it exists yet.

## Document structure

`RallySurvive.md` is a single consolidated document covering four related racing games plus a Unity implementation walkthrough. It's organized in 14 parts (see the file's own Índice/table of contents at the top):

1. **Parte 1 — GDD Core**: mechanics, rules, and systems shared by all games (the "base" every variant inherits from).
2. **Partes 2–5 — Game variants**: RallySurvive, Navigation Expert, RaceLegenda, Street Legends. Each variant document is written as a *diff* against the Core — it only describes what's specific to that game, not a full restatement.
3. **Parte 6 — Divergence table**: a single table cross-referencing how each variant differs from the Core across track structure, failure rules, player guidance, multiplayer, car customization, etc. This is the fastest place to understand differences between games without reading all four variant sections.
4. **Partes 7–14 — Unity implementation guide**: a phase-by-phase (Fase 0–7) walkthrough for building RallySurvive in Unity, including actual C# script listings (`CarController.cs`, `CarParticles.cs`, `CarTerrainSensor.cs`, `ChevronGuide.cs`, `TrackBoundary.cs`, `PuddleZone.cs`, `RaceManager.cs`, `TimerDisplay.cs`, `FirebaseBootstrap.cs`, `LeaderboardService.cs`, `MainMenuController.cs`). All three launch tracks (Deserto, Floresta, Gelo) are built from the same pipeline: Deserto is documented in full, Floresta/Gelo as diffs (what changes: terrain art, puddle zones, grip value, particle presets, ambient rain) via a Unity Scene Template saved once Deserto is complete (Parte 10 §3.12). Each phase ends with a "✅ Checkpoint" section describing how to verify it worked, and often a "Problemas comuns" (common issues) section.
5. **Parte 15 — 3D topdown future vision**: describes how the same Core mechanic would port to a 3D topdown camera (raycast-against-ground-plane instead of `ScreenToWorldPoint`, billboarded chevrons, etc.) as a post-launch possibility, not current scope.

## Core design concept (applies to all four games)

- Topdown 2D racing in a minimalist flat-vector art style (replaced the original pixel art; assets and their SpriteCook `asset_id` manifest live in `Sprites/Rally2D/`). The car moves toward the mouse cursor; **speed is proportional to cursor distance from the car**, following a smooth exponential curve (not linear) — this is the central "on the edge of control" pillar.
- **Chevrons**: a row of arrows drawn between car and cursor, green when accelerating, red when braking, with density scaling by intensity. The system/class name for this must stay `ChevronGuide` across all games/projects — this is an explicit shared-naming convention meant to ease future convergence of the four games into one.
- Input is mouse-only for the MVP.
- Track/terrain data (waypoints, width, checkpoints) should use the same format across games so tracks are portable between them.
- Firebase (Firestore) backs auth (anonymous login) and leaderboards, structured as `/leaderboards/{jogo}/{pista}/{uid} → { tempo, nome, data, replayData? }`. Each variant's section gives its own concrete path (e.g. `/leaderboards/rallysurvive/{pista}/{uid}`).

## Key cross-game divergences (see Parte 6 for the full table)

The document explicitly flags 5 "flags" worth keeping as configurable in code if/when the games ever unify:
- Track guidance type: fixed path / free checkpoints / closed circuit with laps.
- Failure rule: full restart / no failure / natural penalty only.
- Multiplayer on/off.
- Car assistance/customization on/off (temporary per-race setup vs. permanent garage progression).
- External threat (police chase) on/off — introduced by Street Legends.

## Conventions when editing this document

- **Keep variant sections as diffs.** Don't restate Core content inside a variant's section (Partes 2–5) — only document what's specific/overridden there. This is a deliberate structure to avoid duplication across the four game docs.
- **"Definido" vs. "Em aberto"**: the document consistently marks settled decisions as "**Definido:**" and unresolved questions as "**Em aberto**". Preserve this distinction when editing — don't silently convert an open question into a decision, and don't strip the "Em aberto" call-outs that track known unknowns (e.g. multiplayer room sizing, police escalation curve, garage screen layout).
- **Language**: the document is written in Portuguese (pt-BR). Match that unless the user asks otherwise.
- Unity code samples target Unity 6 / 2023.x+ API (`rb.linearVelocity`); the document notes the older `rb.velocity` name for 2022 LTS as a fallback — keep both noted if you touch those snippets.
