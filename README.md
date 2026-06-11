# Synthegnotica

**AI-powered synthegnotic Open Source IDE** — build full applications using free cloud AI, with no API keys, no subscriptions, and no local GPU required.

![Synthegnotica](public/favicon.svg)

---

## What is Synthegnotica?

Synthegnotica is a native desktop IDE built with **Tauri + React** that connects to **Puter.js** free cloud AI to let you:

- Chat with AI (GPT-4o, Claude 3.5 Sonnet, Llama 3.1) to generate complete code files
- Save generated files directly to any folder on your machine
- Edit, rename, delete, and manage workspace files inside the app
- Browse and switch workspace directories with a native folder picker
- Copy production-ready UI components from the built-in catalog

Everything runs **free** — no OpenAI API key, no Anthropic account, no billing. Puter.js provides the AI layer at zero cost.

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 Free AI | GPT-4o, GPT-4o-mini, Claude 3.5 Sonnet, Claude 3 Opus, Llama 3.1 70B — all free via Puter.js |
| 💾 File Management | Create, edit, save, rename, delete workspace files from inside the IDE |
| 📁 Workspace Switcher | Native folder picker dialog + manual path input + visual folder browser |
| ✏️ Code Editor | Editable textarea with unsaved indicator, line/char count, Ctrl+S save |
| 🎨 Component Catalog | Copy-ready glassmorphic UI components (cards, buttons, badges) |
| 📊 Diagnostics | Live workspace stats, system info, AI readiness |
| 🖥️ Native Desktop | Built with Tauri v2 — tiny binary, no Electron overhead |
| 🌐 Internet Required | AI calls are cloud-based — an active internet connection is needed |

---

## Tech Stack

- **Frontend** — React 19, Vite 7, Lucide React icons
- **Backend** — Tauri v2 (Rust), rfd (native file dialogs)
- **AI** — Puter.js v2 cloud API (free, no key required)
- **Styling** — Pure CSS with glassmorphic dark theme

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (stable toolchain)
- [Tauri CLI prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS

### Development

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/synthegnotica.git
cd synthegnotica

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build Installer

```bash
npm run tauri build
```

Output: `src-tauri/target/release/bundle/`
- `nsis/Synthegnotica_x.x.x_x64-setup.exe` — Windows installer
- `msi/Synthegnotica_x.x.x_x64_en-US.msi` — MSI package

---

## Project Structure

```
synthegnotica/
├── src/                    # React frontend
│   ├── App.jsx             # Main application component
│   ├── index.css           # Global styles & design tokens
│   └── main.jsx            # React entry point
├── src-tauri/              # Rust/Tauri backend
│   ├── src/
│   │   ├── lib.rs          # Tauri commands (file I/O, folder browser)
│   │   └── main.rs         # Entry point
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri app configuration
├── public/
│   └── favicon.svg         # Synthegnotica logo
└── index.html              # HTML shell
```

---

## Tauri Commands (Rust Backend)

| Command | Description |
|---------|-------------|
| `select_directory` | Opens native OS folder picker dialog |
| `get_files` | Recursively lists files in a workspace directory |
| `read_file` | Reads file content (sandboxed to workspace) |
| `save_file` | Writes file content (creates parent dirs automatically) |
| `delete_file` | Deletes a file (sandboxed to workspace) |
| `rename_file` | Renames/moves a file (sandboxed to workspace) |
| `browse_folders` | Lists subfolders for the visual folder browser |
| `create_folder` | Creates a new directory |

---

## AI Models Available (All Free via Puter.js)

| Provider | Model |
|----------|-------|
| OpenAI | `gpt-4o-mini`, `gpt-4o` |
| Anthropic | `claude-3-5-sonnet`, `claude-3-opus`, `claude-3-haiku` |
| Meta | `Llama 3.1 70B`, `Llama 3.1 8B` |

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Acknowledgements

- [Puter.js](https://puter.com) — free cloud AI API
- [Tauri](https://tauri.app) — native desktop framework
- [Lucide](https://lucide.dev) — icon library
- [rfd](https://github.com/PolyMeilex/rfd) — Rust native file dialogs
