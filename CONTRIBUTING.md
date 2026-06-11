# Contributing to Synthegnotica

Thank you for your interest in contributing!

## Getting Started

```bash
git clone https://github.com/YOUR_USERNAME/synthegnotica.git
cd synthegnotica
npm install
npm run tauri dev
```

### Prerequisites
- Node.js v18+
- Rust stable toolchain (`rustup install stable`)
- [Tauri v2 prerequisites](https://v2.tauri.app/start/prerequisites/)

## How to Contribute

### Reporting Bugs
Open an issue with:
- OS and version
- Steps to reproduce
- Expected vs actual behaviour
- Screenshots if relevant

### Suggesting Features
Open an issue labelled `enhancement` describing the use case and proposed solution.

### Pull Requests
1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```
2. Make your changes — keep commits focused and descriptive
3. Test locally with `npm run tauri dev`
4. Confirm `npm run build` and `cargo check` both pass
5. Open a PR against `main` with a clear description

## Code Style
- React components: functional, hooks only
- Rust: follow `rustfmt` defaults (`cargo fmt`)
- Keep changes minimal — one concern per PR

## License
By contributing, you agree your code will be licensed under the [MIT License](LICENSE).
