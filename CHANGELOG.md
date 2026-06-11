# Changelog

All notable changes to Synthegnotica will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.2] — 2025-07-19

### Added
- Monaco Editor — full syntax highlighting, bracket colorization, font ligatures for all file types
- Drag & drop files from Explorer into the editor to import them into the workspace instantly
- Copy button per chat message (appears on hover)
- README badges — CI, Release, License, Version, Tauri, Puter.js
- Updated README with download link, full feature table, keyboard shortcuts

---

### Fixed
- Updated all Claude model IDs to match official Puter.js v2 API (sourced from developer.puter.com)
- Simplified streaming chunk extraction to `part?.text` per Puter.js docs — fixes silent empty responses on all models
- Removed invalid model aliases (`claude-3-5-sonnet`, `claude-3-opus-20240229`, `claude-sonnet`, `claude-haiku`)

### Added
- Claude Fable 5 — Anthropic's most capable model
- Claude Opus 4.8 and claude-opus-4.8-fast (2.5x faster variant)
- Claude Opus 4.7
- Claude Sonnet 4.6 set as default model (matches Puter.js docs recommendation)
- Claude Haiku 4.5
- GPT-4.1 and GPT-4.1-mini

### Changed
- Default model changed from `gpt-4o-mini` to `claude-sonnet-4-6`

---

## [0.1.0] — 2025-07-18

### Added
- AI chat with streaming responses via Puter.js (free, no API key required)
- Support for GPT-4o, GPT-4o-mini, Claude, Llama 3.1 70B/8B via Puter.js
- Workspace file manager — create, read, edit, save, rename, delete files
- Editable code editor with unsaved indicator, line/char count, Ctrl+S shortcut
- Native folder picker dialog (Rust rfd) + manual path input + visual folder browser
- AI-generated file detection and one-click save to workspace
- Save All button for multiple generated files
- New File modal to create blank files from the IDE
- Workspace refresh button
- Toast notification system
- Component Catalog tab with copy-ready glassmorphic UI components
- Workspace Stats / Diagnostics tab with live system info
- Synthegnotica neural S-mark logo (inline SVG, purple-cyan gradient)
- Full dark glassmorphic theme with neon accents
- Native Windows installer via Tauri NSIS + MSI bundler
- MIT open source license
