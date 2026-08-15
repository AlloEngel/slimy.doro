# Slimy.doro 🟦

A tiny desktop companion for people who can't stare at a bare countdown timer for 25 minutes straight. Slimy.doro is a frameless, transparent Pomodoro overlay with a pixel-art slime that reacts to what you're doing — it walks while you focus, dozes off on breaks, and does a little jump when you finish a task. Built with Tauri v2 + React + TypeScript because I wanted something native, lightweight, and not another Electron memory hog.

Open source, MIT licensed, PRs welcome.

## Why

Every Pomodoro app I tried was either too plain or too bloated. I wanted a widget I could pin in a corner, forget about, and glance at — something that felt more like a pet than a productivity tool. So I built one.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable) + your platform's Tauri build tools ([prerequisites here](https://v2.tauri.app/start/prerequisites/))

## Getting started

```bash
npm install

# generates real .icns/.ico icons from the placeholder — do this once before packaging a release
npx tauri icon src-tauri/icons/icon.png

npm run tauri dev
```

Build a release bundle:

```bash
npm run tauri build
```

## How it's put together
src-tauri/ Rust backend
src/
lib.rs app builder — plugins, tray icon, command registry
main.rs entry point
commands/
window.rs pin/click-through, always-on-top, snap-to-corner, drag
storage.rs atomic JSON read/write under $APP_DATA
capabilities/ window permission grants
tauri.conf.json transparent/frameless window config

src/ React frontend
components/ SlimeStage, TimerDisplay, TitleBarControls,
TodoCompact, TodoDrawer, SettingsPanel
hooks/ sprite animation loop, pomodoro ticker, drag,
click-through sync, drawer resize sync
store/useAppStore.ts settings, tasks, timer state machine (zustand)
lib/ tauri command wrappers, chiptune SFX synth,
sprite sheet metadata, theme helpers
assets/sprites/ slime_blue_*-Sheet.png (32x32 frames each)

themes/ drop-in JSON theme files

## Persistence

Settings and tasks live in `$APP_DATA/config.json` and `$APP_DATA/tasks.json`, written through a small Rust command pair (`read_json_file` / `write_json_file`) that does a temp-file-then-rename so a crash mid-write can't corrupt anything. `$APP_DATA` resolves per OS — e.g. `~/Library/Application Support/com.cozyware.pixelslimepomodoro` on macOS, `%APPDATA%\com.cozyware.pixelslimepomodoro` on Windows.

## Theming

Themes are just JSON — drop a new file in `themes/` shaped like `themes/cozy-default.json`:

```json
{
  "id": "your-theme-id",
  "name": "Your Theme",
  "colors": {
    "surface": "#RRGGBB",
    "surfaceSoft": "#RRGGBB",
    "accent": "#RRGGBB",
    "accentDim": "#RRGGBB",
    "text": "#RRGGBB",
    "textDeep": "#RRGGBB"
  }
}
```

`src/lib/theme.ts` turns a theme into CSS custom properties on the document root. If you want a theme switcher in the settings panel, that's on the roadmap — for now it's a manual swap.

## The slime's state machine

| State   | Sheet  | Frames | Trigger                                  |
|---------|--------|--------|--------------------------------------------|
| `idle`  | idle   | 10     | timer paused / stopped                     |
| `walk`  | walk   | 7      | focus session running                      |
| `sleep` | idle*  | 10     | break session running (idle @ 70% speed)   |
| `jump`  | jump   | 12     | task completed or timer finished           |
| `death` | death  | 5      | timer canceled / reset                     |

Frames render on a `<canvas>` with `image-rendering: pixelated`, driven by a `requestAnimationFrame` loop in `useSpriteAnimation`. One-shot states (`jump`, `death`) play once and hand control back to idle/walk/sleep automatically.

## Window behavior

- **Pin mode** (top-left icon) — click-through so it sits over whatever you're working in. Since a pinned window can't receive the click to unpin itself, use the tray menu's "Toggle Pin Mode" if you get stuck.
- **Snap positions** — corner/center snapping from Settings → Window position.
- **To-do drawer** — expanding it grows the window and shifts it left in the same motion, so the extra space opens up on the left instead of pushing the whole thing off-screen.

## Contributing

Issues and PRs are welcome. If you're adding a new slime animation state, check `lib/sprites.ts` first — frame size and sheet layout are all defined there.

## License

MIT