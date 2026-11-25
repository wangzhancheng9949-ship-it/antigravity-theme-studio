# Antigravity Theme Studio

[简体中文](./README.md) | English · 🌐 **[Live Theme Gallery](https://wangzhancheng9949-ship-it.github.io/antigravity-theme-studio/gallery/)** · 📦 **[Download Latest Release](https://github.com/wangzhancheng9949-ship-it/antigravity-theme-studio/releases/latest)**

A cross-platform (**Windows · macOS · Linux**) visual theme studio, native CSS variable curve remapper, and procedural wallpaper engine for **Google Antigravity 2.0 Desktop**.

- **Non-Intrusive & Update-Proof**: Never modifies `app.asar` or application binaries, preserving official macOS / Windows code signatures across auto-updates.
- **Native-Grade CSS Variable Remapping**: Dynamically maps every native CSS color token along a perceptual luminance curve—seamless dark/light transitions without unreadable contrast or broken syntax/diff colors.
- **Persistent Across Restarts**: Includes a lightweight background daemon and one-click launcher generator for Windows (`.lnk`), macOS (`.app`), and Linux (`.desktop`).
- **Zero Dependencies**: Works out of the box using either system Node.js (`>=20`) or Antigravity's built-in runtime (`ELECTRON_RUN_AS_NODE=1`).
- **Clean IP & MIT Licensed**: Ships with 8 original studio palettes, 6 MIT-licensed community classics, and 100% procedural SVG patterns plus local-only custom wallpaper support.

---

## Quick Start

- **Windows**: Double-click `start-studio.bat`
- **macOS**: `chmod +x start-studio.command && ./start-studio.command`
- **Linux**: `chmod +x start-studio.sh && ./start-studio.sh`

Your browser will open **`http://127.0.0.1:3399`**, where you can live-preview all 14 themes, overlay procedural/custom wallpapers, apply skins in real time, and generate a persistent desktop launcher.

---

## License & Attribution

Licensed under the [MIT License](./LICENSE). Community open-source palette attributions are documented in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
