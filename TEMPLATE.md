# game
Barebones canvas 2D game: fixed loop, input, entity base, HUD.
Size: small. Source projects: cursor-crawler, deepdown, farmtile.

## Files
- `index.html`: canvas + HUD, loads `src/*.js` in order (input, entity, game, main).
- `style.css`: tokens + full-screen canvas and glass HUD.
- `src/input.js`: `Input` static class: keys set, mouse state, `isDown(...codes)`.
- `src/entity.js`: `Entity` base (`update(dt)`, `draw(ctx)`).
- `src/game.js`: `Game`: canvas resize, rAF loop with clamped `dt` (seconds), entity list.
- `src/main.js`: entry; creates `Game`, HUD refresh, `start()`.

## Extend
- New actor: `class X extends Entity` in its own `src/x.js`, add its `<script>` before `game.js`, `game.add(new X(...))` in `main.js`.
- Systems (camera, tiles, sound, lighting): see the `game-crawler` template.
