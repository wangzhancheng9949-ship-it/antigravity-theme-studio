---
name: antigravity-theme-studio
description: Zero-patch, cross-platform visual theme studio, native CSS token remapper, procedural/custom wallpaper engine, and auto day/night scheduler for Google Antigravity 2.0 Desktop (Windows, macOS, Linux). Use when the user asks to install, configure, switch themes, add wallpapers, or set up day/night auto-switching for Antigravity Theme Studio.
---

# Antigravity Theme Studio — Agent Guided Setup Skill

This skill guides an AI agent to safely install and launch **Antigravity Theme Studio** without modifying `app.asar`, application binaries, or code signatures.

## Safety Rules
- **NEVER** modify `resources/app.asar` or any files inside the official Antigravity installation directory.
- **NEVER** kill the active Antigravity session abruptly unless the user explicitly asks to restart it.
- All user data (`state.json`, custom palettes, local wallpapers) is stored strictly inside `~/.antigravity-themes/`.

## Step-by-Step Deployment Procedure

1. **Choose a clean installation directory**:
   - Windows: `%USERPROFILE%\Documents\antigravity-theme-studio`
   - macOS / Linux: `~/antigravity-theme-studio`

2. **Download the repository** (prefer `git clone`; if `git` is unavailable, download and extract the latest release zip from `https://github.com/wangzhancheng9949-ship-it/antigravity-theme-studio/releases/latest`):
   ```bash
   git clone https://github.com/wangzhancheng9949-ship-it/antigravity-theme-studio.git
   ```

3. **Start the local Theme Studio web server (`http://127.0.0.1:3399`)**:
   - **Windows**: run `start-studio.bat` (auto-detects `node` or falls back to Antigravity's built-in runtime with `ELECTRON_RUN_AS_NODE=1`).
   - **macOS**: `chmod +x start-studio.command && ./start-studio.command`
   - **Linux**: `chmod +x start-studio.sh && ./start-studio.sh`

4. **Verify & Hand Off**:
   - Confirm `http://127.0.0.1:3399` is reachable and opens in the user's default browser.
   - Guide the user to:
     - Pick any of the 14 built-in themes (or craft a custom palette / paste an `agy-theme://v1/...` share code) and click **Apply**.
     - Click **Generate Desktop Launcher** in the studio banner so themes and day/night schedules persist automatically across restarts (compatible with `Antigravity-Hans` localization).
     - Switch back to native themes anytime inside Antigravity's own **Settings → Appearance** (auto-yields with zero lock-in).
