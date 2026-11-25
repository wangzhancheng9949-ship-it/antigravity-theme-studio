/**
 * Cross-Platform Environment & Launcher Utilities (Windows / macOS / Linux)
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, exec, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "..");
export const USER_STATE_DIR = path.join(os.homedir(), ".antigravity-themes");
export const STATE_FILE = path.join(USER_STATE_DIR, "state.json");
export const CUSTOM_THEMES_FILE = path.join(USER_STATE_DIR, "custom-themes.json");
export const CUSTOM_WALLPAPER_FILE = path.join(USER_STATE_DIR, "custom-wallpaper.txt");
export const DAEMON_LOCK_FILE = path.join(USER_STATE_DIR, "daemon.pid");

export const CANDIDATE_CDP_PORTS = [58321, 58322, 58323, 58324, 58325, 9222, 9223];
export const FALLBACK_LAUNCH_PORT = 58325;

const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;

export function ensureStateDir() {
  fs.mkdirSync(USER_STATE_DIR, { recursive: true });
}

export function loadUserState() {
  ensureStateDir();
  const defaults = {
    activeThemeId: null,
    enhanced: true,
    autoPersist: true,
    wallpaperId: "none",
    wallpaperOpacity: 0.14,
    wallpaperBlur: 0,
    scheduleEnabled: false,
    dayStart: "07:30",
    nightStart: "19:00",
    dayThemeId: "editorial-parchment",
    nightThemeId: "terracotta-charcoal",
    updatedAt: null
  };
  try {
    if (!fs.existsSync(STATE_FILE)) return defaults;
    return { ...defaults, ...JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) };
  } catch {
    return defaults;
  }
}

export function resolveEffectiveThemeId(state, now = new Date()) {
  if (!state.scheduleEnabled) {
    return state.activeThemeId;
  }
  const toMin = (hhmm, fallback) => {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || "").trim());
    if (!m) return fallback;
    const h = Math.min(23, Math.max(0, Number(m[1])));
    const min = Math.min(59, Math.max(0, Number(m[2])));
    return h * 60 + min;
  };
  const curMin = now.getHours() * 60 + now.getMinutes();
  const dayMin = toMin(state.dayStart, 7 * 60 + 30);
  const nightMin = toMin(state.nightStart, 19 * 60);
  const isDay = dayMin <= nightMin
    ? (curMin >= dayMin && curMin < nightMin)
    : (curMin >= dayMin || curMin < nightMin);
  return isDay ? (state.dayThemeId || state.activeThemeId) : (state.nightThemeId || state.activeThemeId);
}

/**
 * 根据 3 个基础色自动派生完整的侧栏色、卡片色、代码块底色与深浅模式
 */
export function buildCustomThemeObject({ id, name, zhName, background, foreground, accent, glass = false, radius = "12px" }) {
  if (!HEX6_RE.test(background) || !HEX6_RE.test(foreground) || !HEX6_RE.test(accent)) {
    throw new Error("颜色值必须为 6 位标准 Hex（例如 #1E1E2E）");
  }
  const toRgb = (hex) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
  const toHex = ([r, g, b]) =>
    "#" + [r, g, b].map((x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, "0")).join("").toUpperCase();
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const lum = ([r, g, b]) => {
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };

  const bgRgb = toRgb(background);
  const fgRgb = toRgb(foreground);
  const isDark = lum(bgRgb) < 0.45;
  const sidebarHex = toHex(isDark ? mix(bgRgb, [0, 0, 0], 0.22) : mix(bgRgb, fgRgb, 0.045));
  const cardHex = toHex(isDark ? mix(bgRgb, fgRgb, 0.055) : mix(bgRgb, [255, 255, 255], 0.65));
  const codeHex = toHex(isDark ? mix(bgRgb, [0, 0, 0], 0.28) : mix(bgRgb, fgRgb, 0.06));
  const cleanName = String(zhName || name || "自定义主题").slice(0, 32).replace(/[<>]/g, "");
  const cleanEn = String(name || cleanName).slice(0, 36).replace(/[<>]/g, "");
  const safeId = (id || `custom-${Date.now().toString(36)}`).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);

  return {
    id: safeId,
    name: cleanEn,
    zhName: cleanName,
    mode: isDark ? "dark" : "light",
    category: "user-custom",
    license: "User Custom",
    description: `自定义调色主题 (${background.toUpperCase()} / ${accent.toUpperCase()})`,
    native: {
      preset: isDark ? "Onyx" : "Everforest Light",
      background: background.toUpperCase(),
      foreground: foreground.toUpperCase(),
      accent: accent.toUpperCase(),
      contrast: "default",
      font: "Google Sans",
      fontSize: 14
    },
    enhanced: {
      sidebarBg: sidebarHex,
      cardBg: cardHex,
      borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
      codeBg: codeHex,
      radius: /^\d{1,2}px$/.test(String(radius)) ? String(radius) : "12px",
      glass: Boolean(glass)
    }
  };
}

export function loadCustomThemes() {
  ensureStateDir();
  try {
    if (!fs.existsSync(CUSTOM_THEMES_FILE)) return [];
    const arr = JSON.parse(fs.readFileSync(CUSTOM_THEMES_FILE, "utf8"));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCustomTheme(themeObj) {
  const list = loadCustomThemes().filter((t) => t.id !== themeObj.id);
  list.unshift(themeObj);
  ensureStateDir();
  fs.writeFileSync(CUSTOM_THEMES_FILE, JSON.stringify(list, null, 2), "utf8");
  return list;
}

export function deleteCustomTheme(themeId) {
  const list = loadCustomThemes().filter((t) => t.id !== themeId);
  ensureStateDir();
  fs.writeFileSync(CUSTOM_THEMES_FILE, JSON.stringify(list, null, 2), "utf8");
  return list;
}

export function encodeThemeShareCode(t) {
  const compact = {
    v: 1,
    n: t.name,
    z: t.zhName,
    b: t.native.background,
    f: t.native.foreground,
    a: t.native.accent,
    g: Boolean(t.enhanced?.glass),
    r: t.enhanced?.radius || "12px"
  };
  const b64 = Buffer.from(JSON.stringify(compact), "utf8").toString("base64url");
  return `agy-theme://v1/${b64}`;
}

export function decodeThemeShareCode(code) {
  const trimmed = String(code || "").trim();
  const prefix = "agy-theme://v1/";
  if (!trimmed.startsWith(prefix) || trimmed.length > 600) {
    throw new Error("无效的主题分享码格式（应以 agy-theme://v1/ 开头）");
  }
  const raw = Buffer.from(trimmed.slice(prefix.length), "base64url").toString("utf8");
  const data = JSON.parse(raw);
  return buildCustomThemeObject({
    name: data.n || "Shared Theme",
    zhName: data.z || data.n || "导入的分享主题",
    background: data.b,
    foreground: data.f,
    accent: data.a,
    glass: Boolean(data.g),
    radius: data.r || "12px"
  });
}

export function saveUserState(patch) {
  const next = { ...loadUserState(), ...patch, updatedAt: new Date().toISOString() };
  ensureStateDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function loadCustomWallpaperDataUrl() {
  try {
    if (fs.existsSync(CUSTOM_WALLPAPER_FILE)) {
      return fs.readFileSync(CUSTOM_WALLPAPER_FILE, "utf8").trim();
    }
  } catch {}
  return "";
}

export function saveCustomWallpaperDataUrl(dataUrl) {
  ensureStateDir();
  if (!dataUrl) {
    try { fs.unlinkSync(CUSTOM_WALLPAPER_FILE); } catch {}
    return;
  }
  fs.writeFileSync(CUSTOM_WALLPAPER_FILE, dataUrl, "utf8");
}

/**
 * 跨平台定位 Antigravity 客户端可执行文件
 */
export function findAntigravityExecutable() {
  const home = os.homedir();
  const candidates = [];

  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    const pf = process.env.ProgramFiles || "C:\\Program Files";
    candidates.push(
      path.join(local, "Programs", "Antigravity", "Antigravity.exe"),
      path.join(local, "Programs", "antigravity", "Antigravity.exe"),
      path.join(pf, "Antigravity", "Antigravity.exe")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/Applications/Antigravity.app/Contents/MacOS/Antigravity",
      path.join(home, "Applications", "Antigravity.app", "Contents", "MacOS", "Antigravity")
    );
  } else {
    candidates.push(
      "/usr/bin/antigravity",
      "/usr/local/bin/antigravity",
      "/opt/Antigravity/antigravity",
      "/opt/antigravity/antigravity",
      path.join(home, ".local", "bin", "antigravity"),
      "/snap/bin/antigravity"
    );
  }

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * 检测本机是否安装了 Antigravity-Hans 汉化工具（若存在可无缝串联启动）
 */
export function findHansExecutable() {
  const home = os.homedir();
  const candidates = [];
  if (process.platform === "win32") {
    const local = process.env.LOCALAPPDATA || path.join(home, "AppData", "Local");
    candidates.push(
      path.join(local, "Programs", "Antigravity-Hans", "antigravity-hans.exe"),
      path.join(home, "Desktop", "antigravity-hans-windows-amd64.exe")
    );
  } else if (process.platform === "darwin") {
    candidates.push(
      "/usr/local/bin/antigravity-hans",
      path.join(home, ".local", "bin", "antigravity-hans"),
      path.join(home, "Applications", "antigravity-hans")
    );
  } else {
    candidates.push(
      "/usr/local/bin/antigravity-hans",
      path.join(home, ".local", "bin", "antigravity-hans")
    );
  }
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * 打开系统默认浏览器（Windows / macOS / Linux）
 */
export function openExternalUrl(url) {
  if (process.platform === "win32") {
    exec(`cmd /c start "" "${url}"`);
  } else if (process.platform === "darwin") {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

/**
 * 后台分离启动守护进程（如果尚未运行）
 */
export function ensureDaemonRunning() {
  ensureStateDir();
  if (fs.existsSync(DAEMON_LOCK_FILE)) {
    try {
      const pid = Number(fs.readFileSync(DAEMON_LOCK_FILE, "utf8").trim());
      if (pid > 0) {
        process.kill(pid, 0);
        return { alreadyRunning: true, pid };
      }
    } catch {
      // stale pid file
    }
  }

  const daemonScript = path.join(__dirname, "daemon.mjs");
  const child = spawn(process.execPath, [daemonScript], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    windowsHide: true
  });
  child.unref();
  return { alreadyRunning: false, pid: child.pid };
}

/**
 * 跨平台创建「Antigravity 主题版」一键启动快捷方式（自动带起客户端/汉化 + 皮肤守护）
 */
export function createCrossPlatformLauncher() {
  const home = os.homedir();
  const daemonScript = path.join(__dirname, "daemon.mjs");
  const agyExe = findAntigravityExecutable();
  const hansExe = findHansExecutable();

  if (process.platform === "win32") {
    const desktop = path.join(home, "Desktop");
    const lnkPath = path.join(desktop, "Antigravity 主题版.lnk");
    const targetNodeExe = agyExe || process.execPath;
    ensureStateDir();

    // 关键设计：由独立 PowerShell 启动脚本先拉起客户端/汉化（避开 Antigravity-Hans 启动前清场误杀无窗口 Antigravity.exe），
    // 等待 CDP 端口就绪后，再以后台 Node 模式启动 daemon.mjs 挂载保存的主题！
    const psLauncherPath = path.join(USER_STATE_DIR, "launch-themed.ps1");
    const psLines = [
      `$ErrorActionPreference = 'SilentlyContinue'`,
      `$ports = @(58321, 58322, 58323, 58324, 58325, 9222, 9223)`,
      `function Test-CdpReady {`,
      `  foreach ($p in $ports) {`,
      `    try {`,
      `      $r = Invoke-WebRequest -Uri "http://127.0.0.1:$p/json/list" -UseBasicParsing -TimeoutSec 1`,
      `      if ($r.StatusCode -eq 200 -and $r.Content -match 'webSocketDebuggerUrl') { return $true }`,
      `    } catch {}`,
      `  }`,
      `  return $false`,
      `}`,
      `if (-not (Test-CdpReady)) {`,
      `  $hans = '${(hansExe || "").replace(/'/g, "''")}'`,
      `  $agy = '${(agyExe || "").replace(/'/g, "''")}'`,
      `  if ($hans -and (Test-Path $hans)) {`,
      `    Start-Process -FilePath $hans -ArgumentList '--app','--nogui' -WindowStyle Hidden`,
      `  } elseif ($agy -and (Test-Path $agy)) {`,
      `    Start-Process -FilePath $agy -ArgumentList '--remote-debugging-port=${FALLBACK_LAUNCH_PORT}'`,
      `  }`,
      `  for ($i = 0; $i -lt 40; $i++) {`,
      `    Start-Sleep -Milliseconds 500`,
      `    if (Test-CdpReady) { break }`,
      `  }`,
      `  Start-Sleep -Milliseconds 800`,
      `}`,
      `$psi = New-Object System.Diagnostics.ProcessStartInfo`,
      `$psi.FileName = '${targetNodeExe.replace(/'/g, "''")}'`,
      `$psi.Arguments = '"${daemonScript}"'`,
      `$psi.UseShellExecute = $false`,
      `$psi.CreateNoWindow = $true`,
      `$psi.EnvironmentVariables['ELECTRON_RUN_AS_NODE'] = '1'`,
      `[System.Diagnostics.Process]::Start($psi) | Out-Null`
    ];
    fs.writeFileSync(psLauncherPath, psLines.join("\r\n"), "utf8");

    const vbsPath = path.join(USER_STATE_DIR, "launch-themed.vbs");
    const vbsContent = [
      `Set sh = CreateObject("WScript.Shell")`,
      `sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""${psLauncherPath}""", 0, False`
    ].join("\r\n");
    fs.writeFileSync(vbsPath, vbsContent, "utf8");

    const psShortcut = [
      `$sh = New-Object -ComObject WScript.Shell`,
      `$lnk = $sh.CreateShortcut('${lnkPath.replace(/'/g, "''")}')`,
      `$lnk.TargetPath = 'wscript.exe'`,
      `$lnk.Arguments = '"${vbsPath}"'`,
      agyExe ? `$lnk.IconLocation = '${agyExe.replace(/'/g, "''")},0'` : "",
      `$lnk.Description = 'Antigravity (自动挂载自定义主题与汉化)'`,
      `$lnk.Save()`
    ].filter(Boolean).join("; ");

    execFileSync("powershell.exe", ["-NoProfile", "-Command", psShortcut], { windowsHide: true });
    return { platform: "win32", path: lnkPath };
  }

  if (process.platform === "darwin") {
    const appDir = path.join(home, "Applications", "Antigravity Themed.app", "Contents", "MacOS");
    fs.mkdirSync(appDir, { recursive: true });
    const binPath = path.join(appDir, "Antigravity Themed");
    const nodeCmd = agyExe ? `ELECTRON_RUN_AS_NODE=1 "${agyExe}"` : `"${process.execPath}"`;
    const launchCmd = hansExe
      ? `"${hansExe}" --app >/dev/null 2>&1 &`
      : `"${agyExe}" --remote-debugging-port=${FALLBACK_LAUNCH_PORT} >/dev/null 2>&1 &`;
    const script = [
      "#!/bin/bash",
      "if ! curl -fsS --max-time 1 http://127.0.0.1:58321/json/list >/dev/null 2>&1 && ! curl -fsS --max-time 1 http://127.0.0.1:58325/json/list >/dev/null 2>&1; then",
      `  ${launchCmd}`,
      "  for i in $(seq 1 30); do",
      "    sleep 0.5",
      "    if curl -fsS --max-time 1 http://127.0.0.1:58321/json/list >/dev/null 2>&1 || curl -fsS --max-time 1 http://127.0.0.1:58325/json/list >/dev/null 2>&1; then break; fi",
      "  done",
      "  sleep 0.8",
      "fi",
      `${nodeCmd} "${daemonScript}" >/dev/null 2>&1 &`
    ].join("\n") + "\n";
    fs.writeFileSync(binPath, script, { mode: 0o755 });
    const plistPath = path.join(home, "Applications", "Antigravity Themed.app", "Contents", "Info.plist");
    fs.writeFileSync(
      plistPath,
      `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>CFBundleExecutable</key><string>Antigravity Themed</string><key>CFBundleIdentifier</key><string>community.antigravity.themed</string><key>CFBundleName</key><string>Antigravity Themed</string></dict></plist>`,
      "utf8"
    );
    return { platform: "darwin", path: path.join(home, "Applications", "Antigravity Themed.app") };
  }

  // Linux (.desktop entry + wrapper shell script)
  ensureStateDir();
  const wrapperSh = path.join(USER_STATE_DIR, "launch-themed.sh");
  const nodeCmd = agyExe ? `ELECTRON_RUN_AS_NODE=1 "${agyExe}"` : `"${process.execPath}"`;
  const launchCmd = hansExe
    ? `"${hansExe}" --app >/dev/null 2>&1 &`
    : `"${agyExe}" --remote-debugging-port=${FALLBACK_LAUNCH_PORT} >/dev/null 2>&1 &`;
  fs.writeFileSync(
    wrapperSh,
    [
      "#!/usr/bin/env bash",
      "if ! curl -fsS --max-time 1 http://127.0.0.1:58321/json/list >/dev/null 2>&1 && ! curl -fsS --max-time 1 http://127.0.0.1:58325/json/list >/dev/null 2>&1; then",
      `  ${launchCmd}`,
      "  for i in $(seq 1 30); do",
      "    sleep 0.5",
      "    if curl -fsS --max-time 1 http://127.0.0.1:58321/json/list >/dev/null 2>&1 || curl -fsS --max-time 1 http://127.0.0.1:58325/json/list >/dev/null 2>&1; then break; fi",
      "  done",
      "  sleep 0.8",
      "fi",
      `${nodeCmd} "${daemonScript}" >/dev/null 2>&1 &`
    ].join("\n") + "\n",
    { mode: 0o755 }
  );

  const appsDir = path.join(home, ".local", "share", "applications");
  fs.mkdirSync(appsDir, { recursive: true });
  const desktopFile = path.join(appsDir, "antigravity-themed.desktop");
  const content = [
    "[Desktop Entry]",
    "Type=Application",
    "Name=Antigravity (Themed)",
    "Comment=Launch Antigravity with persistent custom theme",
    `Exec="${wrapperSh}"`,
    "Terminal=false",
    "Categories=Development;Utility;"
  ].join("\n");
  fs.writeFileSync(desktopFile, content, { mode: 0o755 });
  return { platform: "linux", path: desktopFile };
}
