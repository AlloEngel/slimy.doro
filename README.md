# slimy.doro 🟦

A tiny desktop companion for people who don't want to stare at a bare countdown timer for 25 minutes straight.

**slimy.doro** is a frameless, transparent Pomodoro desktop companion with a pixel-art slime that reacts to your workflow. It walks while you focus, dozes during breaks, and reacts when sessions or tasks are completed.

Built with **Tauri v2 + React + TypeScript** for a native-feeling, lightweight desktop experience rather than another resource-heavy Electron app.

Open source and MIT licensed. Contributions and pull requests are welcome!

---

## Why

Every Pomodoro app I tried was either too plain or too bloated. I wanted a widget I could pin in a corner, forget about, and glance at — something that felt more like a companion buddy than a productivity tool.

The app combines:
- Pomodoro sessions & compact task list
- Reactive pixel-art slime animations
- Pin & click-through mode
- Always-on-top window setting
- Window snapping & native desktop dragging
- Opacity control & native background blur
- Desktop notifications & chiptune sound effects
- System tray menu & emergency unpin shortcut

---

## Features

### Pomodoro Timer
- Focus sessions, short breaks, and long breaks
- Configurable durations and cycle tracking
- Desktop notifications & optional chiptune audio feedback
- Timer state automatically drives the slime's animations

### Pixel-art Slime
Visual companion that reacts dynamically to your workflow:
- **Idle**: Timer stopped or paused
- **Walking**: Active focus session
- **Sleeping**: Break time
- **Jumping**: Task completed or session finished
- **Death**: Session canceled or reset

*Note: The slime can be toggled off in Settings without altering the window dimensions.*

### To-do List
A compact task manager tailored for small overlay windows:
- Quick creation, inline editing, and task completion
- Drag-and-drop reordering + move up/down actions
- Favorites & persistent local storage

### Window Behavior & Pin Mode
Designed to feel like a native desktop widget:
- Frameless transparent surface with fixed compact dimensions
- **Pin Mode**: Makes the window click-through so it stays visible over other apps without blocking interaction.
- **Emergency Unpin Shortcut**:
    - **Windows / Linux**: `Ctrl + Shift + U`
    - **macOS**: `Cmd + Shift + U`
- **Always on Top**: Functions independently from Pin Mode.

### Visual Effects & System Tray
- **Transparency**: Adjust surface opacity via Settings.
- **Native Background Blur**: Uses OS-level window effects (not CSS `backdrop-filter`) for translucent readability. *(Opacity control is disabled when blur is enabled).*
- **System Tray**: Built via Tauri's native `TrayIconBuilder` with options for Show/Hide, Toggle Pin Mode, and Quit.

---

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable) + your platform's Tauri build tools ([prerequisites here](https://v2.tauri.app/start/prerequisites/))

---

## Getting Started

1. Install frontend dependencies:
   ```bash
   npm install
   ```

2. Generate platform-specific app icons:
   ```bash
   npx tauri icon src-tauri/icons/icon.png
   ```

3. Start in development mode:
   ```bash
   npm run tauri dev
   ```

---

## Production Builds

Build the app for your current platform:
```bash
npm run tauri build
```

### Windows NSIS Installer
To build the `.exe` installer specifically:
```bash
npx tauri build --bundles nsis
```
Output location: `src-tauri/target/release/bundle/nsis/`

---

## Project Structure

```text
src-tauri/
├── src/
│   ├── commands/
│   │   ├── window.rs
│   │   └── storage.rs
│   ├── lib.rs
│   └── main.rs
├── capabilities/
├── icons/
├── Cargo.toml
└── tauri.conf.json

src/
├── components/
│   ├── SlimeStage
│   ├── TimerDisplay
│   ├── TitleBarControls
│   ├── TodoList
│   └── SettingsPanel
├── hooks/
│   ├── sprite animation
│   ├── Pomodoro ticker
│   ├── window drag
│   └── click-through synchronization
├── store/
│   └── useAppStore.ts
├── lib/
│   ├── Tauri command wrappers
│   ├── theme helpers
│   ├── sprite metadata
│   └── chiptune sound synthesis
└── assets/
    └── sprites/

themes/
└── JSON theme files
```

### Key Modules
- **Rust Backend (`src-tauri/`)**: Controls native window behavior (`window.rs`), atomic JSON storage (`storage.rs`), global shortcuts, tray icons, and system capabilities.
- **React Frontend (`src/`)**: Interface components, Zustand store (`useAppStore.ts`), sprite canvas renderers, and custom hooks.

---

## Layout & Dimensions

Fixed compact widget dimensions maintain visual layout stability:
- **Width**: `231 px`
- **Height (with To-do)**: `382 px`
- **Height (without To-do)**: `230 px`

Uses logical dimensions to ensure rendering consistency across Windows DPI scaling configurations.

---

## Persistence

All settings, tasks, and preferences are saved locally to JSON files via Rust using an atomic temporary-file-then-rename writing strategy.

- **macOS**: `~/Library/Application Support/com.cozyware.pixelslimepomodoro`
- **Windows**: `%APPDATA%\com.cozyware.pixelslimepomodoro`

---

## Theming

Themes are stored as JSON files and parsed into CSS custom properties via `src/lib/theme.ts`:

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

---

## Slime State Machine

Animations are rendered on a `<canvas>` element using $32 \times 32$ px sprite sheets driven by a `requestAnimationFrame` loop.

| State | Sheet | Frames | Trigger |
| :--- | :--- | :--- | :--- |
| **idle** | `idle` | 10 | Timer paused or stopped |
| **walk** | `walk` | 7 | Focus session active |
| **sleep** | `idle` | 10 | Break session active |
| **jump** | `jump` | 12 | Task completed / session finished |
| **death** | `death` | 5 | Timer canceled or reset |

---

## Contributing

Pull requests and community ideas are welcome! Key areas for improvement:
- **Pin Mode**: Flexible click-through behaviors & shortcuts
- **Accessibility**: High contrast, screen-reader support, reduced-motion options
- **UX & Companions**: Task list refinements & alternative sprite characters

---

## License

MIT License

Copyright © 2026 Allo Engel

See the [MIT License](LICENSE) for the full license text.