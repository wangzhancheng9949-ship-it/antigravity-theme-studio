/**
 * Antigravity Theme Studio — Cross-Platform Self-Updater (Windows / macOS / Linux)
 * 支持：
 *   1. 检查 GitHub Releases 最新版本（SemVer 比较，优雅处理离线/限流）
 *   2. 一键无损热更新：git 仓库优先 fast-forward pull；zip 解压版自动下载最新官方 Release 包并覆盖更新
 *   3. 个人配置与自定义主题/壁纸存放在 ~/.antigravity-themes/，更新零数据丢失
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { PROJECT_ROOT, DAEMON_LOCK_FILE, ensureDaemonRunning } from "./platform.mjs";

const REPO_SLUG = "wangzhancheng9949-ship-it/antigravity-theme-studio";
const ALLOWED_DOWNLOAD_PREFIX = `https://github.com/${REPO_SLUG}/releases/download/`;

export function getLocalVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, "package.json"), "utf8"));
    return String(pkg.version || "0.0.0").replace(/^v/i, "");
  } catch {
    return "0.0.0";
  }
}

export function compareSemver(a, b) {
  const pa = String(a).replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, "").split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < 3; i++) {
    const da = pa[i] || 0;
    const db = pb[i] || 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

export async function checkForUpdate() {
  const currentVersion = getLocalVersion();
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO_SLUG}/releases/latest`, {
      headers: {
        "User-Agent": `Antigravity-Theme-Studio/${currentVersion}`,
        "Accept": "application/vnd.github+json"
      },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) {
      return { ok: false, currentVersion, error: `GitHub API 返回状态 ${res.status}` };
    }
    const rel = await res.json();
    const latestVersion = String(rel.tag_name || "").replace(/^v/i, "");
    const hasUpdate = Boolean(latestVersion && compareSemver(latestVersion, currentVersion) > 0);
    const zipAsset = (rel.assets || []).find(
      (a) => typeof a.name === "string" && a.name.endsWith(".zip") && typeof a.browser_download_url === "string"
    );

    return {
      ok: true,
      currentVersion,
      latestVersion,
      hasUpdate,
      releaseUrl: rel.html_url || `https://github.com/${REPO_SLUG}/releases`,
      releaseName: rel.name || `v${latestVersion}`,
      publishedAt: rel.published_at || "",
      assetName: zipAsset ? zipAsset.name : null,
      assetUrl: zipAsset ? zipAsset.browser_download_url : null
    };
  } catch (err) {
    return { ok: false, currentVersion, error: err.message || "网络不可用" };
  }
}

function restartDaemonIfRunning() {
  try {
    if (fs.existsSync(DAEMON_LOCK_FILE)) {
      const pid = Number(fs.readFileSync(DAEMON_LOCK_FILE, "utf8").trim());
      if (pid > 0) {
        try { process.kill(pid, "SIGTERM"); } catch {}
      }
      try { fs.unlinkSync(DAEMON_LOCK_FILE); } catch {}
      ensureDaemonRunning();
    }
  } catch {}
}

function tryGitPull() {
  const gitDir = path.join(PROJECT_ROOT, ".git");
  if (!fs.existsSync(gitDir)) return false;
  try {
    execFileSync("git", ["pull", "--ff-only", "origin", "main"], {
      cwd: PROJECT_ROOT,
      stdio: "pipe",
      windowsHide: true,
      timeout: 25000
    });
    return true;
  } catch {
    return false;
  }
}

function extractZipCrossPlatform(zipPath, destDir) {
  if (process.platform === "win32") {
    const cmd = `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force`;
    execFileSync("powershell.exe", ["-NoProfile", "-Command", cmd], {
      windowsHide: true,
      timeout: 30000
    });
    return;
  }
  try {
    execFileSync("unzip", ["-o", zipPath, "-d", destDir], { stdio: "pipe", timeout: 30000 });
  } catch {
    // 某些精简 Linux 未装 unzip 时回退使用 python3 标准库 zipfile
    execFileSync(
      "python3",
      ["-c", "import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])", zipPath, destDir],
      { stdio: "pipe", timeout: 30000 }
    );
  }
}

export async function performSelfUpdate() {
  const info = await checkForUpdate();
  if (!info.ok) {
    throw new Error(info.error || "无法连接 GitHub 检查更新");
  }
  if (!info.hasUpdate) {
    return { updated: false, currentVersion: info.currentVersion, latestVersion: info.latestVersion, method: "none" };
  }

  // 模式 1：若为 git 克隆用户，优先安全 fast-forward pull
  if (tryGitPull()) {
    restartDaemonIfRunning();
    return { updated: true, from: info.currentVersion, to: getLocalVersion(), method: "git-pull" };
  }

  // 模式 2：免安装 zip 解压用户，自动下载最新官方 Release 压缩包并无损覆盖更新
  if (!info.assetUrl || !info.assetUrl.startsWith(ALLOWED_DOWNLOAD_PREFIX)) {
    throw new Error("未找到有效的官方 Release 更新压缩包，请前往 GitHub Releases 手动下载。");
  }

  const res = await fetch(info.assetUrl, {
    headers: { "User-Agent": `Antigravity-Theme-Studio/${info.currentVersion}` },
    signal: AbortSignal.timeout(45000)
  });
  if (!res.ok) {
    throw new Error(`下载更新包失败（HTTP ${res.status}）`);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const tmpZip = path.join(os.tmpdir(), `agy-theme-update-${Date.now()}.zip`);
  fs.writeFileSync(tmpZip, buf);

  try {
    extractZipCrossPlatform(tmpZip, PROJECT_ROOT);
  } finally {
    try { fs.unlinkSync(tmpZip); } catch {}
  }

  // macOS / Linux 恢复脚本可执行权限
  if (process.platform !== "win32") {
    for (const f of ["start-studio.sh", "start-studio.command"]) {
      const p = path.join(PROJECT_ROOT, f);
      if (fs.existsSync(p)) {
        try { fs.chmodSync(p, 0o755); } catch {}
      }
    }
  }

  restartDaemonIfRunning();
  return { updated: true, from: info.currentVersion, to: getLocalVersion(), method: "release-zip" };
}

/**
 * 延迟重启当前 studio-server.mjs 进程以加载最新后端代码
 */
export function scheduleServerRestart() {
  const serverScript = path.join(PROJECT_ROOT, "tools", "studio-server.mjs");
  setTimeout(() => {
    const child = spawn(process.execPath, [serverScript, "--no-open"], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
      windowsHide: true
    });
    child.unref();
    process.exit(0);
  }, 450);
}
