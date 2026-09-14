# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository nature

This is a **game design document (GDD) repository**, not a code project. It currently contains a single file, `RallySurvive.md`, written in Portuguese. There is no Unity project, no source code, no build system, and no test suite here — the repository's "product" is the design document itself. There are no lint/build/test commands to run.

If future work adds an actual Unity project (scripts, scenes, assets) alongside this GDD, that project's own tooling (Unity Editor, .NET/C# compiler) should be documented separately once it exists — don't assume it exists yet.

## Document structure

`RallySurvive.md` is a single consolidated document covering four related racing games plus a Unity implementation walkthrough. It's organized in 14 parts (see the file's own Índice/table of contents at the top):

1. **Parte 1 — GDD Core**: mechanics, rules, and systems shared by all games (the "base" every variant inherits from).
2. **Partes 2–5 — Game variants**: RallySurvive, Navigation Expert, RaceLegenda, Street Legends. Each variant document is written as a *diff* against the Core — it only describes what's specific to that game, not a full restatement.
3. **Parte 6 — Divergence table**: a single table cross-referencing how each variant differs from the Core across track structure, failure rules, player guidance, multiplayer, car customization, etc. This is the fastest place to understand differences between games without reading all four variant sections.
4. **Partes 7–13 — Unity implementation guide**: a phase-by-phase (Fase 0–6) walkthrough for building RallySurvive in Unity, including actual C# script listings (`CarController.cs`, `ChevronGuide.cs`, `TrackBoundary.cs`, `RaceManager.cs`, `TimerDisplay.cs`, `FirebaseBootstrap.cs`, `LeaderboardService.cs`). Each phase ends with a "✅ Checkpoint" section describing how to verify it worked, and often a "Problemas comuns" (common issues) section.
5. **Parte 14 — 3D topdown future vision**: describes how the same Core mechanic would port to a 3D topdown camera (raycast-against-ground-plane instead of `ScreenToWorldPoint`, billboarded chevrons, etc.) as a post-launch possibility, not current scope.

## Core design concept (applies to all four games)

- Topdown 2D pixel-art racing. The car moves toward the mouse cursor; **speed is proportional to cursor distance from the car**, following a smooth exponential curve (not linear) — this is the central "on the edge of control" pillar.
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
