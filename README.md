# slimy.doro

A tiny desktop companion for people who don't want to stare at a bare countdown timer for 25 minutes straight.

**slimy.doro** is a frameless, transparent Pomodoro desktop companion with a pixel-art slime that reacts to your workflow. It walks while you focus, dozes during breaks, and reacts when sessions or tasks are completed.

Built with **Tauri v2 + React + TypeScript** for a native-feeling, lightweight desktop experience rather than another resource-heavy Electron app.

Open source and MIT licensed. Contributions and pull requests are welcome.

Now updated to v1.1!

## Why

Every Pomodoro app I tried was either too plain or too bloated. I wanted a widget I could pin in a corner, forget about, and glance at — something that felt more like a companion buddy than a productivity tool.

**slimy.doro** combines productivity features with a small visual companion:

- Pomodoro sessions with configurable durations and cycles
- Reactive pixel-art slime animations
- Compact task management
- Task reordering, favorites, editing, and completion
- Independent visibility controls for the slime, timer, and task list
- Pin and click-through mode
- Always-on-top window setting
- Window snapping and native desktop dragging
- Adjustable opacity and native background blur
- Multiple built-in themes
- Desktop notifications and chiptune sound effects
- System tray integration
- Emergency unpin shortcut
- Local JSON persistence

## Features

### Pomodoro Timer

The timer supports the standard Pomodoro workflow:

- Focus sessions, short breaks, and long breaks
- Configurable focus, short-break, and long-break durations
- Configurable focus cycles before a long break
- Optional automatic start of the next session
- Manual session reset and skip
- Optional desktop notifications and chiptune sound effects
- Cycle tracking and reset

Timer values can be edited directly or using dedicated increment/decrement controls. Each timer value also has an individual reset control for quickly returning to its default value.

The timer state drives the slime's behavior automatically.

### Pixel-art Slime

The slime acts as a visual companion to the Pomodoro timer. Supported states include:

- **Idle**: Timer stopped or paused
- **Walking**: Active focus session
- **Sleeping**: Break session active
- **Jumping**: Task completed or session finished
- **Death**: Timer canceled or reset

The slime can be independently hidden from Settings without changing the application's native window dimensions. Sprite animation is rendered through a canvas-based animation loop using `requestAnimationFrame`.

### To-do List

**slimy.doro** includes a compact task manager designed for the small desktop widget layout.

#### Task Management
- Quick task creation (36-character title limit)
- Task completion, inline renaming (double-click to rename), favorites, and deletion
- Persistent local storage (maximum of 10 tasks)

#### Task Ordering
Tasks can be reordered in two ways:
- Drag and drop
- Dedicated move-up and move-down controls

#### Task Controls
The completion checkbox uses a larger invisible hit area while keeping the visual checkbox compact. This makes completion easier to click without increasing visual density or interfering with adjacent controls.

## Modules

The main interface is divided into independent modules that can be enabled or disabled from Settings:

- **Slime**
- **Timer**
- **To-do list**

Hiding a module automatically adapts the internal layout while preserving the native window dimensions defined by the application. When the to-do list is hidden, the main timer area uses the compact layout.

## Settings

Settings are organized into functional sections to keep the panel compact and easier to navigate:

- **Appearance**: Theme, window opacity, background blur
- **Modules**: Show slime animation, show timer, show to-do list
- **Window**: Always on Top, window position
- **General**: Chiptune sound effects, desktop notifications
- **Timer**: Focus duration, short-break duration, long-break duration, focus cycles before long break, auto-start next session, Pomodoro cycle reset
- **Pin Mode**: Can be enabled or disabled independently from Always on Top

## Window Behavior & Pin Mode

**slimy.doro** is designed to behave like a native desktop widget.

### Native Window
- Frameless, transparent, and non-resizable
- Compact fixed dimensions with native desktop dragging and snapping
- Optional Always on Top and system tray integration

### Pin Mode
**Pin Mode** enables click-through behavior, allowing the widget to remain visible while preventing it from blocking interaction with applications underneath it.

Pin Mode is independent from **Always on Top**:
- Always on Top can be enabled without Pin Mode.
- Pin Mode can be enabled without Always on Top.
- Disabling Pin Mode does not change Always on Top.
- Enabling or disabling Always on Top does not change Pin Mode.

### Emergency Unpin
If Pin Mode is enabled and the window becomes difficult to interact with, the emergency shortcut disables click-through mode:

- **Windows / Linux**: `Ctrl + Shift + U`
- **macOS**: `Cmd + Shift + U`

The emergency shortcut only disables Pin Mode. It does not change the Always on Top preference.

## Window Snapping

The application supports native snapping positions:
- Top-left
- Top-right
- Bottom-left
- Bottom-right
- Center

Snapping respects the active monitor's work area and keeps a configurable edge margin from screen boundaries.

## Visual Effects

### Transparency
The window surface supports adjustable opacity through Settings, applied through the active theme's surface color rather than a fixed background color.

### Native Background Blur
When enabled, background blur uses native operating-system window effects instead of relying on CSS `backdrop-filter`:

- **Windows**: Native Blur effect
- **macOS**: Native Popover material
- **Linux**: Transparent window without native blur effect

This allows the application to blur desktop content outside the WebView where supported. Surface opacity is automatically adjusted when native blur is enabled to preserve translucent glass appearance.

## Themes

Themes are defined centrally in `src/lib/theme.ts` as TypeScript objects and converted into CSS custom properties at runtime.

Semantic colors used: `surface`, `surfaceSoft`, `accent`, `accentDim`, `text`, `textDeep`, `onAccent`.

Built-in palettes:
- **Dusk Slate** (default)
- **Cozy Cream**
- **Dracula**
- **Gruvbox**
- **100% Black**

## Layout & Dimensions

The native Tauri window uses fixed compact dimensions to maintain a predictable layout:

| Layout | Width | Height |
| :--- | :--- | :--- |
| **With To-do** | 231 px | 382 px |
| **Without To-do** | 231 px | 230 px |

Uses logical CSS dimensions scaled inside the native window to ensure consistent rendering across different Windows DPI scaling configurations.

## Architecture

**slimy.doro** is divided between a native Rust backend and a React frontend.

### Rust Backend
Handles native desktop functionality: window positioning, snapping, resizing, dragging, Always on Top, click-through behavior, native background effects, persistent JSON storage, system tray functionality, global shortcuts, and capabilities.

### React Frontend
Handles user interface, Pomodoro timer state, task management, settings, theme application, slime canvas rendering, user interactions, and audio/notification orchestration using [Zustand](https://github.com/pmndrs/zustand) for central state management.

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
```

### Key Modules
- `src-tauri/`: Native Rust/Tauri functionality (window commands, persistence, tray, native effects).
- `src/components/`: Main React UI components.
- `src/hooks/`: Pomodoro ticker, window dragging, click-through synchronization.
- `src/store/useAppStore.ts`: Central Zustand store for settings, tasks, and timer state.
- `src/lib/theme.ts`: Built-in theme definitions and theme-to-CSS variable conversion.
- `src/lib/tauri.ts`: Frontend wrappers for native Tauri commands.
- `src/lib/audio.ts`: Chiptune sound generation and playback.
- `src/assets/sprites/`: Pixel-art slime sprite assets.

## Persistence

Application settings and tasks are persisted locally as JSON through the Rust backend using an atomic temporary-file-then-rename strategy.

Storage locations:
- **macOS**: `~/Library/Application Support/com.cozyware.pixelslimepomodoro`
- **Windows**: `%APPDATA%\com.cozyware.pixelslimepomodoro`

## Slime State Machine

The slime uses $32 \times 32$ pixel sprite sheets rendered through a canvas animation loop using `requestAnimationFrame`.

| State | Sheet | Frames | Trigger |
| :--- | :--- | :--- | :--- |
| **idle** | `idle` | 10 | Timer paused or stopped |
| **walk** | `walk` | 7 | Focus session active |
| **sleep** | `idle` | 10 | Break session active |
| **jump** | `jump` | 12 | Task completed / session finished |
| **death** | `death` | 5 | Timer canceled or reset |

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (stable) + your platform's Tauri build tools ([prerequisites here](https://v2.tauri.app/start/prerequisites/))

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate application icons:
   ```bash
   npx tauri icon src-tauri/icons/icon.png
   ```

3. Start the application in development mode:
   ```bash
   npm run tauri dev
   ```

## Production Builds

Build the application for the current platform:

```bash
npm run tauri build
```

### Windows NSIS Installer

To build the Windows `.exe` installer specifically:

```bash
npx tauri build --bundles nsis
```

The generated installer is placed under:
```text
src-tauri/target/release/bundle/nsis/
```

## Development Notes

### Native Window Sizing
Resizes use logical dimensions for compatibility with display scaling (125%, 150% DPI).

### Native Blur
Uses Tauri native window effects instead of CSS `backdrop-filter` because WebView CSS cannot blur content outside its own window boundaries.

### State Management
Zustand orchestrates UI state and persistence while native behavior remains encapsulated in Tauri wrappers.

## Contributing

Pull requests and community ideas are welcome! Key contribution areas:
- Additional themes and sprite animations
- Accessibility and reduced-motion support
- Additional desktop integrations and timer workflows

When contributing, keep pull requests focused on small, incremental improvements.

## License

[MIT License](LICENSE) © 2026 Allo Engel