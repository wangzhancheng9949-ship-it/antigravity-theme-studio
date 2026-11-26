#!/usr/bin/env node
/**
 * Antigravity Themes Background Persistence Daemon & Launcher (Cross-Platform)
 * 用法：
 *   node tools/daemon.mjs            仅运行后台主题守护进程
 *   node tools/daemon.mjs --launch   一键启动 Antigravity（若装了汉化则优先调起汉化）并在后台自动保持主题
 *   node tools/daemon.mjs --stop     停止正在运行的主题守护进程
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import {
  PROJECT_ROOT,
  DAEMON_LOCK_FILE,
  CANDIDATE_CDP_PORTS,
  FALLBACK_LAUNCH_PORT,
  ensureStateDir,
  loadUserState,
  saveUserState,
  resolveEffectiveThemeId,
  loadCustomThemes,
  loadCustomWallpaperDataUrl,
  findAntigravityExecutable,
  findHansExecutable
} from "./platform.mjs";
import {
  computeThemeSignature,
  buildCheckSignatureExpression,
  buildPageApplyExpression
} from "./skin-runtime.js";

const THEMES_PATH = path.join(PROJECT_ROOT, "themes", "themes.json");

function loadThemes() {
  const builtin = JSON.parse(fs.readFileSync(THEMES_PATH, "utf8")).themes;
  return [...loadCustomThemes(), ...builtin];
}

async function discoverPages() {
  for (const port of CANDIDATE_CDP_PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(700)
      });
      if (!res.ok) continue;
      const list = await res.json();
      const pages = list.filter((p) => p.type === "page" && p.webSocketDebuggerUrl);
      if (pages.length > 0) return { connected: true, port, pages };
    } catch {}
  }
  return { connected: false, port: null, pages: [] };
}

function evalInPage(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    const timer = setTimeout(() => {
      try { ws.close(); } catch {}
      reject(new Error("CDP timeout"));
    }, 3000);

    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({
        id: 1,
        method: "Runtime.evaluate",
        params: { expression, returnByValue: true }
      }));
    });

    ws.addEventListener("message", (ev) => {
      try {
        const msg = JSON.parse(String(ev.data));
        if (msg.id === 1) {
          clearTimeout(timer);
          ws.close();
          resolve(msg.result?.result?.value);
        }
      } catch (e) {
        clearTimeout(timer);
        ws.close();
        reject(e);
      }
    });

    ws.addEventListener("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

async function launchClientIfNeeded() {
  const existing = await discoverPages();
  if (existing.connected) return;

  // 若本机安装了 Antigravity-Hans 汉化工具，优先通过它启动（汉化 + 调试端口一次就位）
  const hansExe = findHansExecutable();
  if (hansExe) {
    const args = process.platform === "win32" ? ["--app", "--nogui"] : ["--app"];
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(hansExe, args, {
      detached: true,
      stdio: "ignore",
      env,
      windowsHide: true
    });
    child.unref();
    return;
  }

  // 未安装汉化工具（如纯英文/国际版用户），直接带调试端口启动原版 Antigravity
  const agyExe = findAntigravityExecutable();
  if (agyExe) {
    const env = { ...process.env };
    delete env.ELECTRON_RUN_AS_NODE;
    const child = spawn(agyExe, [`--remote-debugging-port=${FALLBACK_LAUNCH_PORT}`], {
      detached: true,
      stdio: "ignore",
      env,
      windowsHide: true
    });
    child.unref();
  }
}

function stopExistingDaemon() {
  if (!fs.existsSync(DAEMON_LOCK_FILE)) return false;
  try {
    const pid = Number(fs.readFileSync(DAEMON_LOCK_FILE, "utf8").trim());
    if (pid > 0 && pid !== process.pid) {
      process.kill(pid, "SIGTERM");
    }
  } catch {}
  try { fs.unlinkSync(DAEMON_LOCK_FILE); } catch {}
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--stop")) {
    stopExistingDaemon();
    console.log("Stopped Antigravity Themes daemon.");
    process.exit(0);
  }

  ensureStateDir();

  if (args.includes("--launch")) {
    await launchClientIfNeeded();
  }

  // 单实例锁：若已有其他守护在跑，本进程完成启动任务后直接退出
  if (fs.existsSync(DAEMON_LOCK_FILE)) {
    try {
      const pid = Number(fs.readFileSync(DAEMON_LOCK_FILE, "utf8").trim());
      if (pid > 0 && pid !== process.pid) {
        process.kill(pid, 0);
        process.exit(0);
      }
    } catch {}
  }

  fs.writeFileSync(DAEMON_LOCK_FILE, String(process.pid), "utf8");
  const cleanup = () => {
    try {
      const cur = Number(fs.readFileSync(DAEMON_LOCK_FILE, "utf8").trim());
      if (cur === process.pid) fs.unlinkSync(DAEMON_LOCK_FILE);
    } catch {}
  };
  process.on("exit", cleanup);
  process.on("SIGTERM", () => { cleanup(); process.exit(0); });
  process.on("SIGINT", () => { cleanup(); process.exit(0); });

  let disconnectedTicks = 0;
  let everConnected = false;

  // 每 2.2 秒轻量巡检：若窗口尚未打上当前主题签名，自动无感挂载
  while (true) {
    try {
      const state = loadUserState();
      const targetThemeId = resolveEffectiveThemeId(state);
      if (!state.autoPersist || !targetThemeId) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      const cdp = await discoverPages();
      if (!cdp.connected) {
        disconnectedTicks++;
        if ((everConnected && disconnectedTicks > 9) || (!everConnected && disconnectedTicks > 15)) {
          break;
        }
        await new Promise((r) => setTimeout(r, 2200));
        continue;
      }

      everConnected = true;
      disconnectedTicks = 0;

      const themes = loadThemes();
      const theme = themes.find((t) => t.id === targetThemeId);
      if (theme) {
        const customWp = state.wallpaperId === "custom" ? loadCustomWallpaperDataUrl() : "";
        const sig = computeThemeSignature({
          theme,
          enhanced: state.enhanced,
          wallpaperId: state.wallpaperId,
          wallpaperOpacity: state.wallpaperOpacity,
          wallpaperBlur: state.wallpaperBlur,
          customWallpaperLen: customWp.length
        });
        const checkExpr = buildCheckSignatureExpression(sig);
        let applyExpr = null;

        for (const page of cdp.pages) {
          try {
            // 跳过空白过渡页或 about:blank
            if (!page.url || page.url === "about:blank") continue;
            const alreadyApplied = await evalInPage(page.webSocketDebuggerUrl, checkExpr);
            if (alreadyApplied === "YIELDED") {
              // 用户刚刚在 Antigravity 原生「设置 → 外观」中主动切换了官方主题，自动解除工坊接管并持久化
              saveUserState({ activeThemeId: null, scheduleEnabled: false });
              break;
            }
            if (!alreadyApplied) {
              if (!applyExpr) {
                applyExpr = buildPageApplyExpression({
                  theme,
                  enhanced: state.enhanced,
                  wallpaperId: state.wallpaperId,
                  wallpaperOpacity: state.wallpaperOpacity,
                  wallpaperBlur: state.wallpaperBlur,
                  customWallpaperDataUrl: customWp
                });
              }
              await evalInPage(page.webSocketDebuggerUrl, applyExpr);
            }
          } catch {}
        }
      }
    } catch {}

    await new Promise((r) => setTimeout(r, 2200));
  }

  cleanup();
  process.exit(0);
}

main();
