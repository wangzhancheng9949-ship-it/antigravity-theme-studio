#!/usr/bin/env node
/**
 * Antigravity Theme Studio Server v1.0 (Windows / macOS / Linux)
 * 监听 127.0.0.1:3399，零外部依赖，内置回环安全校验。
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  PROJECT_ROOT,
  CANDIDATE_CDP_PORTS,
  loadUserState,
  saveUserState,
  loadCustomWallpaperDataUrl,
  saveCustomWallpaperDataUrl,
  openExternalUrl,
  ensureDaemonRunning,
  createCrossPlatformLauncher
} from "./platform.mjs";

const THEMES_PATH = path.join(PROJECT_ROOT, "themes", "themes.json");
const GALLERY_PATH = path.join(PROJECT_ROOT, "gallery", "index.html");
const RUNTIME_PATH = path.join(PROJECT_ROOT, "tools", "skin-runtime.js");
const HOST = "127.0.0.1";
const PORT = 3399;
const MAX_BODY_BYTES = 12 * 1024 * 1024; // 允许最高 ~8MB 图片的 Base64 DataURL

function loadCatalog() {
  return JSON.parse(fs.readFileSync(THEMES_PATH, "utf8"));
}

async function loadRuntime() {
  const modUrl = `${pathToFileURL(RUNTIME_PATH).href}?t=${Date.now()}`;
  return import(modUrl);
}

async function discoverAntigravityCDP() {
  for (const port of CANDIDATE_CDP_PORTS) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(800)
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
    }, 4000);

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
          resolve(msg.result);
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

async function readJsonBody(req) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("文件过大（请上传 8MB 以内的图片）");
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  const hostHeader = req.headers.host || "";
  if (!hostHeader.startsWith("127.0.0.1:") && !hostHeader.startsWith("localhost:")) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);

    if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
      const html = fs.readFileSync(GALLERY_PATH, "utf8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(html);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/catalog") {
      sendJson(res, 200, loadCatalog());
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/status") {
      const cdp = await discoverAntigravityCDP();
      const state = loadUserState();
      const hasCustomWallpaper = Boolean(loadCustomWallpaperDataUrl());
      sendJson(res, 200, {
        version: "1.0.0",
        platform: process.platform,
        connected: cdp.connected,
        port: cdp.port,
        pageCount: cdp.pages.length,
        state,
        hasCustomWallpaper
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/wallpaper") {
      const { dataUrl } = await readJsonBody(req);
      if (dataUrl && !/^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(dataUrl)) {
        sendJson(res, 400, { ok: false, error: "仅支持 PNG / JPG / WebP / GIF 格式图片" });
        return;
      }
      saveCustomWallpaperDataUrl(dataUrl || "");
      const state = saveUserState({ wallpaperId: dataUrl ? "custom" : "none" });
      sendJson(res, 200, { ok: true, state });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/apply") {
      const body = await readJsonBody(req);
      const {
        themeId,
        enhanced = true,
        autoPersist = true,
        wallpaperId = "none",
        wallpaperOpacity = 0.14,
        wallpaperBlur = 0
      } = body;

      const { themes } = loadCatalog();
      const theme = themes.find((t) => t.id === themeId);
      if (!theme) {
        sendJson(res, 404, { ok: false, error: `未找到主题 ${themeId}` });
        return;
      }

      const savedState = saveUserState({
        activeThemeId: theme.id,
        enhanced: Boolean(enhanced),
        autoPersist: Boolean(autoPersist),
        wallpaperId,
        wallpaperOpacity: Number(wallpaperOpacity),
        wallpaperBlur: Number(wallpaperBlur)
      });

      if (savedState.autoPersist) {
        ensureDaemonRunning();
      }

      const cdp = await discoverAntigravityCDP();
      if (!cdp.connected) {
        sendJson(res, 200, {
          ok: true,
          savedOnly: true,
          message: "已保存主题配置；当前未检测到调试端口，点击「创建桌面主题启动图标」启动客户端即可自动生效。"
        });
        return;
      }

      const customWp = wallpaperId === "custom" ? loadCustomWallpaperDataUrl() : "";
      const { buildPageApplyExpression } = await loadRuntime();
      const expr = buildPageApplyExpression({
        theme,
        enhanced: savedState.enhanced,
        wallpaperId: savedState.wallpaperId,
        wallpaperOpacity: savedState.wallpaperOpacity,
        wallpaperBlur: savedState.wallpaperBlur,
        customWallpaperDataUrl: customWp
      });

      let applied = 0;
      let mappedVars = 0;
      for (const page of cdp.pages) {
        try {
          const out = await evalInPage(page.webSocketDebuggerUrl, expr);
          const val = out?.result?.value;
          if (val?.mappedVars) mappedVars = Math.max(mappedVars, val.mappedVars);
          applied++;
        } catch {}
      }

      sendJson(res, 200, {
        ok: true,
        applied,
        mappedVars,
        port: cdp.port,
        themeName: theme.zhName,
        state: savedState
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/reset") {
      saveUserState({ activeThemeId: null });
      const cdp = await discoverAntigravityCDP();
      if (cdp.connected) {
        const { buildPageResetExpression } = await loadRuntime();
        const expr = buildPageResetExpression();
        for (const page of cdp.pages) {
          try { await evalInPage(page.webSocketDebuggerUrl, expr); } catch {}
        }
      }
      sendJson(res, 200, { ok: true });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/create-launcher") {
      saveUserState({ autoPersist: true });
      ensureDaemonRunning();
      const result = createCrossPlatformLauncher();
      sendJson(res, 200, { ok: true, ...result });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/shutdown") {
      sendJson(res, 200, { ok: true });
      setTimeout(() => process.exit(0), 80);
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message || String(err) });
  }
});

server.on("error", async (err) => {
  if (err.code === "EADDRINUSE") {
    openExternalUrl(`http://${HOST}:${PORT}`);
    process.exit(0);
  }
  console.error(err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Antigravity Theme Studio v1.0 running at http://${HOST}:${PORT}`);
  if (!process.argv.includes("--no-open")) {
    openExternalUrl(`http://${HOST}:${PORT}`);
  }
});
