# Synthegnotica

**AI-powered Open Source IDE** — build full applications using free cloud AI, with no API keys, no subscriptions, and no local GPU required.

[![CI](https://github.com/IsuruAditya/synthegnotica/actions/workflows/ci.yml/badge.svg)](https://github.com/IsuruAditya/synthegnotica/actions/workflows/ci.yml)
[![Release](https://github.com/IsuruAditya/synthegnotica/actions/workflows/release.yml/badge.svg)](https://github.com/IsuruAditya/synthegnotica/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)](CHANGELOG.md)
[![Tauri](https://img.shields.io/badge/Tauri-v2-cyan.svg)](https://tauri.app)
[![Puter.js](https://img.shields.io/badge/AI-Puter.js-green.svg)](https://puter.com)

---

## What is Synthegnotica?

Synthegnotica is a native desktop IDE built with **Tauri v2 + React 19** that connects to **Puter.js** free cloud AI to let you:

- Chat with Claude, GPT-4, and Llama models to generate complete code files
- Save AI-generated files directly to any folder on your machine
- Edit, rename, delete, and manage workspace files inside the app
- Browse workspace directories with a native folder picker
- Attach open files as context to your AI chat
- Manage multiple named chat sessions with persistent history
- Copy production-ready UI components from the built-in catalog

Everything runs **free** — no API key, no Anthropic/OpenAI account, no billing. Puter.js provides the AI layer at zero cost.

---

## Download

👉 **[Download latest release](https://github.com/IsuruAditya/synthegnotica/releases/latest)**

| File | Platform |
|------|----------|
| `Synthegnotica_x.x.x_x64-setup.exe` | Windows installer |
| `Synthegnotica_x.x.x_x64_en-US.msi` | Windows MSI |

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 Free AI | Claude 3.5 Sonnet, Opus, GPT-4o, Llama 3.1 — free via Puter.js |
| 💬 Multi-session Chat | Create, switch, and delete named chat sessions with persistent history |
| 🛑 Stop Generation | Cancel AI generation mid-stream at any time |
| 📎 Attach File | Send the active editor file as context directly into your chat message |
| ⚙️ System Prompt | Customise AI behaviour with an editable system prompt per session |
| 🎨 Code Blocks | AI responses render syntax-highlighted code blocks inline |
| 💾 File Management | Create, edit, save, rename, delete workspace files |
| 📁 Workspace Switcher | Native folder picker + manual path input + visual folder browser |
| ✏️ Monaco Editor | Full syntax highlighting, IntelliSense-style editing powered by Monaco |
| 🖱️ Drag & Drop | Drag files from Explorer into the workspace to open them instantly |
| 🎨 Component Catalog | Copy-ready glassmorphic UI components |
| 📊 Diagnostics | Live workspace stats, system info, AI readiness |
| 🖥️ Native Desktop | Tauri v2 (Rust) — tiny binary, no Electron overhead |

---

## Tech Stack

- **Frontend** — React 19, Vite 7, Monaco Editor, Lucide React
- **Backend** — Tauri v2 (Rust), rfd (native file dialogs)
- **AI** — Puter.js v2 cloud API (free, no key required)
- **Styling** — Pure CSS with glassmorphic dark theme

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) stable toolchain
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

### Development

```bash
git clone https://github.com/IsuruAditya/synthegnotica.git
cd synthegnotica
npm install
npm run tauri dev
```

### Build Installer

```bash
npm run tauri build
```

Output: `src-tauri/target/release/bundle/`

---

## Project Structure

```
synthegnotica/
├── src/
│   ├── App.jsx         # Main application
│   ├── index.css       # Global styles & design tokens
│   └── main.jsx        # React entry point
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs      # Tauri commands (file I/O, folder browser)
│   │   └── main.rs     # Entry point
│   ├── Cargo.toml
│   └── tauri.conf.json
├── public/
│   └── favicon.svg     # Synthegnotica logo
└── index.html
```

---

## AI Models (Free via Puter.js)

| Provider | Models |
|----------|--------|
| Anthropic | `claude-3-5-sonnet`, `claude-3-opus`, `claude-3-haiku` |
| OpenAI | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo` |
| Meta | `Llama 3.1 70B`, `Llama 3.1 8B` |

**Note:** Model availability subject to Puter.js free tier terms.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save active file |
| `Ctrl+N` | New file |
| `Enter` | Send chat message |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork → branch → commit → PR against `main`
2. Run `npm run build` and `cargo check` before submitting

---

## License & Usage Rights

### ✅ Synthegnotica IDE

**MIT License** — completely free and open source:
- ✅ Use for personal or commercial projects
- ✅ Modify and redistribute
- ✅ Create and sell applications built with Synthegnotica
- ✅ No attribution required (but appreciated!)
- ✅ No cost, ever

See [LICENSE](LICENSE) for full terms.

### ⚠️ AI Service Provider

**Puter.js** provides the AI features:
- ✅ Free tier for all users
- ✅ No API keys or payment required from you or your users
- ⚠️ Requires free [Puter.com](https://puter.com) account sign-up
- ⚠️ Subject to Puter's [Terms of Service](https://puter.com/terms)
- ⚠️ Rate limits apply (generous for normal use)
- ⚠️ Internet connection required for AI features

**Important:** Synthegnotica is an independent project and not affiliated with or endorsed by Puter.

### 📝 Commercial Use

**YES** - you can:
- ✅ Build commercial applications using Synthegnotica
- ✅ Use AI-generated code in commercial projects
- ✅ Sell applications you create
- ✅ Offer Synthegnotica to your team/company
- ✅ Fork and create your own version

**NO** - you cannot:
- ❌ Remove or modify the MIT license notice
- ❌ Claim you created Synthegnotica
- ❌ Hold the authors liable for any damages

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [Puter.js](https://puter.com) — free cloud AI
- [Tauri](https://tauri.app) — native desktop framework
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — code editor
- [Lucide](https://lucide.dev) — icons
- [rfd](https://github.com/PolyMeilex/rfd) — Rust native file dialogs
