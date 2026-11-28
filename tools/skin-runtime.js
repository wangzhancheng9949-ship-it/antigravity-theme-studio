/**
 * Antigravity Native-Grade Theme Runtime v2.1 (Cross-Platform & Zero-Copyright Procedural Wallpapers)
 * 特性：
 *   - 自动重映射页面全部原生 CSS 颜色变量，深浅无缝切换，无白底白字或黑块割裂。
 *   - 内置 3 款 100% 原创数学程序化 SVG 纹理壁纸 + 支持用户本机自定义图片（含不透明度与高斯模糊调节）。
 *   - 携带签名标记 data-sig，供后台守护进程 O(1) 检测是否需要补挂皮肤。
 */

function buildProceduralSvgDataUrl(wallpaperId, accentHex, fgHex, isDark) {
  const enc = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const strokeAlpha = isDark ? 0.16 : 0.13;

  if (wallpaperId === "aurora-mesh") {
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="g1" cx="20%" cy="18%" r="55%">
          <stop offset="0%" stop-color="${accentHex}" stop-opacity="0.65"/>
          <stop offset="100%" stop-color="${accentHex}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="g2" cx="82%" cy="22%" r="50%">
          <stop offset="0%" stop-color="#6366f1" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="#6366f1" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="g3" cx="65%" cy="85%" r="55%">
          <stop offset="0%" stop-color="#14b8a6" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="#14b8a6" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="800" fill="url(#g1)"/>
      <rect width="1200" height="800" fill="url(#g2)"/>
      <rect width="1200" height="800" fill="url(#g3)"/>
    </svg>`);
  }

  if (wallpaperId === "topo-lines") {
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
      <g fill="none" stroke="${accentHex}" stroke-opacity="${strokeAlpha}" stroke-width="1.2">
        <path d="M-50 80 C 120 20, 260 150, 650 60"/>
        <path d="M-50 140 C 150 70, 300 210, 650 120"/>
        <path d="M-50 200 C 180 130, 320 270, 650 190"/>
        <path d="M-50 270 C 160 210, 350 340, 650 260"/>
        <path d="M-50 340 C 200 280, 380 390, 650 330"/>
        <ellipse cx="440" cy="140" rx="110" ry="52"/>
        <ellipse cx="440" cy="140" rx="64" ry="28"/>
      </g>
    </svg>`);
  }

  if (wallpaperId === "dot-matrix") {
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="1.35" fill="${fgHex}" fill-opacity="${isDark ? 0.22 : 0.18}"/>
    </svg>`);
  }

  if (wallpaperId === "cyber-grid") {
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
      <path d="M 44 0 L 0 0 0 44" fill="none" stroke="${accentHex}" stroke-opacity="${isDark ? 0.18 : 0.14}" stroke-width="0.9"/>
    </svg>`);
  }

  if (wallpaperId === "zen-waves") {
    return enc(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40" viewBox="0 0 80 40">
      <g fill="none" stroke="${accentHex}" stroke-opacity="${isDark ? 0.16 : 0.13}" stroke-width="1.1">
        <path d="M 0 40 A 40 40 0 0 1 80 40"/>
        <path d="M 14 40 A 26 26 0 0 1 66 40"/>
        <path d="M 28 40 A 12 12 0 0 1 52 40"/>
      </g>
    </svg>`);
  }

  return "";
}

export function computeThemeSignature(options) {
  const { theme, enhanced = true, wallpaperId = "none", wallpaperOpacity = 0.14, wallpaperBlur = 0, customWallpaperLen = 0 } = options;
  return `v2.1|${theme.id}|${enhanced ? 1 : 0}|${wallpaperId}|${wallpaperOpacity}|${wallpaperBlur}|${customWallpaperLen}`;
}

export function buildCheckSignatureExpression(expectedSig) {
  return `(() => {
    if (window.__agyYieldedToNative) return "YIELDED";
    const el = document.getElementById("antigravity-theme-studio-v2");
    return Boolean(el && el.getAttribute("data-sig") === ${JSON.stringify(expectedSig)});
  })()`;
}

export function buildPageApplyExpression(options) {
  const {
    theme,
    enhanced = true,
    wallpaperId = "none",
    wallpaperOpacity = 0.14,
    wallpaperBlur = 0,
    customWallpaperDataUrl = ""
  } = options;

  const isDark = theme.mode === "dark";
  let resolvedWallpaperUrl = "";
  let bgRepeat = "no-repeat";
  let bgSize = "cover";

  if (wallpaperId === "custom" && customWallpaperDataUrl) {
    resolvedWallpaperUrl = customWallpaperDataUrl;
  } else if (wallpaperId && wallpaperId !== "none" && wallpaperId !== "custom") {
    resolvedWallpaperUrl = buildProceduralSvgDataUrl(wallpaperId, theme.native.accent, theme.native.foreground, isDark);
    if (wallpaperId === "dot-matrix") {
      bgRepeat = "repeat";
      bgSize = "28px 28px";
    } else if (wallpaperId === "cyber-grid") {
      bgRepeat = "repeat";
      bgSize = "44px 44px";
    } else if (wallpaperId === "zen-waves") {
      bgRepeat = "repeat";
      bgSize = "80px 40px";
    } else if (wallpaperId === "topo-lines") {
      bgRepeat = "repeat";
      bgSize = "600px 400px";
    }
  }

  const sig = computeThemeSignature({
    theme,
    enhanced,
    wallpaperId,
    wallpaperOpacity,
    wallpaperBlur,
    customWallpaperLen: customWallpaperDataUrl ? customWallpaperDataUrl.length : 0
  });

  const payload = JSON.stringify({
    theme,
    enhanced,
    sig,
    resolvedWallpaperUrl,
    wallpaperOpacity: Math.max(0, Math.min(0.6, Number(wallpaperOpacity) || 0.14)),
    wallpaperBlur: Math.max(0, Math.min(30, Number(wallpaperBlur) || 0)),
    bgRepeat,
    bgSize
  });

  return `(() => {
    const { theme, enhanced, sig, resolvedWallpaperUrl, wallpaperOpacity, wallpaperBlur, bgRepeat, bgSize } = ${payload};
    const STYLE_ID = "antigravity-theme-studio-v2";
    const LEGACY_IDS = ["antigravity-pro-skin-v1", STYLE_ID];

    // 用户从主题工坊主动应用新主题时，重置原生礼让标记并暂停旧观察器
    window.__agyYieldedToNative = false;
    window.__agyApplyingLock = true;
    if (window.__agyNativeYieldObserver) {
      try { window.__agyNativeYieldObserver.disconnect(); } catch {}
      window.__agyNativeYieldObserver = null;
    }

    for (const id of LEGACY_IDS) {
      const old = document.getElementById(id);
      if (old) old.remove();
    }

    const root = document.documentElement;
    if (document.readyState === "loading" || !document.body || document.body.children.length === 0) {
      return { ok: false, notReady: true };
    }

    function parseHex(hex) {
      const h = hex.replace("#", "").trim();
      return [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16)
      ];
    }

    function relLum([r, g, b]) {
      const f = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    }

    function rgbToHsl([r, g, b]) {
      r /= 255; g /= 255; b /= 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h = 0, s = 0;
      const l = (max + min) / 2;
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
    }

    function mixRgb(c1, c2, ratio) {
      const t = Math.max(0, Math.min(1, ratio));
      return [
        Math.round(c1[0] + (c2[0] - c1[0]) * t),
        Math.round(c1[1] + (c2[1] - c1[1]) * t),
        Math.round(c1[2] + (c2[2] - c1[2]) * t)
      ];
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function decodeColor(cssColor) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "rgba(0,0,0,0)";
      ctx.fillStyle = cssColor;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      return [d[0], d[1], d[2], +(d[3] / 255).toFixed(3)];
    }

    if (!window.__agyBaseSnapshot) {
      const varNames = new Set([
        "--background", "--foreground", "--card", "--card-foreground",
        "--popover", "--popover-foreground", "--primary", "--primary-foreground",
        "--secondary", "--secondary-foreground", "--muted", "--muted-foreground",
        "--accent", "--accent-foreground", "--border", "--input", "--ring",
        "--sidebar", "--sidebar-background", "--sidebar-foreground",
        "--sidebar-primary", "--sidebar-primary-foreground",
        "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border"
      ]);

      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = sheet.cssRules; } catch { continue; }
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          const text = rule.cssText || "";
          const matches = text.match(/--[a-zA-Z0-9_-]+/g);
          if (matches) {
            for (const m of matches) varNames.add(m);
          }
        }
      }

      const cs = getComputedStyle(root);
      const bodyCs = getComputedStyle(document.body);
      const baseBgRgba = decodeColor(cs.getPropertyValue("--background").trim() || bodyCs.backgroundColor || "#ffffff");
      const baseFgRgba = decodeColor(cs.getPropertyValue("--foreground").trim() || bodyCs.color || "#111111");

      const vars = [];
      const hslTripletRe = /^\\d+(\\.\\d+)?\\s+\\d+(\\.\\d+)?%\\s+\\d+(\\.\\d+)?%(\\s*\\/\\s*[\\d.%]+)?$/;

      for (const name of varNames) {
        if (/font|size|radius|space|spacing|width|height|shadow|z-|duration|ease|line|tracking|opacity/i.test(name)) {
          continue;
        }
        const raw = cs.getPropertyValue(name).trim();
        if (!raw) continue;

        let format = null;
        let rgba = null;
        if (hslTripletRe.test(raw)) {
          format = "hsl-triplet";
          rgba = decodeColor("hsl(" + raw + ")");
        } else if (CSS.supports("color", raw)) {
          format = "css-color";
          rgba = decodeColor(raw);
        }
        if (format && rgba) {
          vars.push({ name, raw, format, rgba });
        }
      }

      // 若样式表尚未加载完毕（采集到的原生颜色变量过少），暂不缓存快照，等待下一秒重试
      if (vars.length < 5 && document.styleSheets.length === 0) {
        return { ok: false, notReady: true };
      }

      window.__agyBaseSnapshot = {
        baseBg: baseBgRgba,
        baseFg: baseFgRgba,
        vars
      };
    }

    const snap = window.__agyBaseSnapshot;
    const baseBgLum = relLum(snap.baseBg);
    const baseFgLum = relLum(snap.baseFg);
    const baseSpan = Math.max(0.15, Math.abs(baseFgLum - baseBgLum));

    const targetIsDark = theme.mode === "dark";
    const tBg = parseHex(theme.native.background);
    const tFg = parseHex(theme.native.foreground);
    const tAccent = parseHex(theme.native.accent);
    const tSidebar = parseHex(enhanced ? theme.enhanced.sidebarBg : theme.native.background);
    const tCard = parseHex(enhanced ? theme.enhanced.cardBg : theme.native.background);
    const accentOnText = relLum(tAccent) > 0.42 ? [20, 20, 24] : [255, 255, 255];

    function formatOut(rgb, alpha, format) {
      if (format === "hsl-triplet") {
        const [h, s, l] = rgbToHsl(rgb);
        return alpha < 0.995 ? \`\${h} \${s}% \${l}% / \${alpha}\` : \`\${h} \${s}% \${l}%\`;
      }
      return alpha < 0.995
        ? \`rgba(\${rgb[0]}, \${rgb[1]}, \${rgb[2]}, \${alpha})\`
        : \`rgb(\${rgb[0]}, \${rgb[1]}, \${rgb[2]})\`;
    }

    const mappedLines = [];
    for (const v of snap.vars) {
      const n = v.name.toLowerCase();
      const [r, g, b, a] = v.rgba;
      if (a === 0) continue;
      if (/syntax|token|hljs|prism|shiki|diff|add|del|error|danger|destructive|success|warn|chart/i.test(n)) {
        continue;
      }

      const [, sat] = rgbToHsl([r, g, b]);
      let outRgb = null;
      let outAlpha = a;

      if (n === "--background" || n === "--bg" || n === "--canvas") {
        outRgb = tBg;
      } else if (n === "--foreground" || n === "--text" || n === "--card-foreground" || n === "--popover-foreground" || n === "--sidebar-foreground") {
        outRgb = tFg;
      } else if (n.includes("sidebar") && (n.includes("bg") || n === "--sidebar" || n === "--sidebar-background")) {
        outRgb = tSidebar;
      } else if (n === "--card" || n === "--popover" || n === "--dialog") {
        outRgb = tCard;
      } else if (n === "--primary" || n === "--ring" || n === "--sidebar-primary" || n.includes("brand")) {
        outRgb = tAccent;
      } else if (n === "--primary-foreground" || n === "--sidebar-primary-foreground") {
        outRgb = accentOnText;
      } else if (sat >= 26) {
        const [hue] = rgbToHsl([r, g, b]);
        const isSemanticStatus = (hue <= 22 || hue >= 345) || (hue >= 35 && hue <= 65) || (hue >= 95 && hue <= 160);
        if (!isSemanticStatus) outRgb = tAccent;
        else continue;
      } else {
        if (a < 0.85) {
          const lum = relLum([r, g, b]);
          outRgb = Math.abs(lum - baseFgLum) <= Math.abs(lum - baseBgLum) ? tFg : tBg;
        } else {
          const lum = relLum([r, g, b]);
          const t = Math.max(0, Math.min(1, Math.abs(lum - baseBgLum) / baseSpan));
          if (t <= 0.07) outRgb = mixRgb(tBg, tSidebar, t / 0.07);
          else if (t <= 0.16) outRgb = mixRgb(tSidebar, mixRgb(tCard, tFg, 0.08), (t - 0.07) / 0.09);
          else outRgb = mixRgb(tCard, tFg, (t - 0.08) / 0.92);
        }
      }

      if (outRgb) {
        mappedLines.push(\`  \${v.name}: \${formatOut(outRgb, outAlpha, v.format)} !important;\`);
      }
    }

    const borderCss = \`rgba(\${tFg[0]}, \${tFg[1]}, \${tFg[2]}, \${targetIsDark ? 0.10 : 0.09})\`;
    const subtleCodeBg = \`rgba(\${tFg[0]}, \${tFg[1]}, \${tFg[2]}, \${targetIsDark ? 0.08 : 0.06})\`;
    const radius = enhanced ? theme.enhanced.radius : "10px";
    const glowAlpha = targetIsDark ? 0.10 : 0.07;
    const ambientGlow = enhanced
      ? \`radial-gradient(ellipse 75% 38% at 55% -6%, rgba(\${tAccent[0]}, \${tAccent[1]}, \${tAccent[2]}, \${glowAlpha}), transparent 70%)\`
      : "none";

    const wallpaperLayerCss = resolvedWallpaperUrl
      ? \`body::after {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9998;
          background-image: url("\${resolvedWallpaperUrl}");
          background-repeat: \${bgRepeat};
          background-size: \${bgSize};
          background-position: center;
          opacity: \${wallpaperOpacity};
          \${wallpaperBlur > 0 ? \`filter: blur(\${wallpaperBlur}px); transform: scale(1.04);\` : ""}
        }\`
      : "";

    const cssText = [
      \`:root, html, body, .dark, .light, [data-theme] {\`,
      \`  color-scheme: \${targetIsDark ? "dark" : "light"} !important;\`,
      ...mappedLines,
      \`}\`,
      \`html, body {\`,
      \`  background-color: \${theme.native.background} !important;\`,
      \`  color: \${theme.native.foreground} !important;\`,
      \`}\`,
      enhanced ? \`body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 9999;
        background: \${ambientGlow};
      }\` : "",
      wallpaperLayerCss,
      \`pre {\`,
      \`  background-color: \${enhanced ? theme.enhanced.codeBg : theme.native.background} !important;\`,
      \`  border: 1px solid \${borderCss} !important;\`,
      \`  border-radius: \${radius} !important;\`,
      \`}\`,
      \`:not(pre) > code {\`,
      \`  background-color: \${subtleCodeBg} !important;\`,
      \`  color: inherit !important;\`,
      \`  border-radius: 5px !important;\`,
      \`}\`,
      \`::-webkit-scrollbar { width: 7px; height: 7px; }\`,
      \`::-webkit-scrollbar-thumb {\`,
      \`  background: rgba(\${tFg[0]}, \${tFg[1]}, \${tFg[2]}, 0.20) !important;\`,
      \`  border-radius: 999px !important;\`,
      \`}\`,
      \`::-webkit-scrollbar-thumb:hover {\`,
      \`  background: rgba(\${tAccent[0]}, \${tAccent[1]}, \${tAccent[2]}, 0.55) !important;\`,
      \`}\`
    ].join("\\n");

    const styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    styleEl.setAttribute("data-sig", sig);
    styleEl.textContent = cssText;
    document.head.appendChild(styleEl);

    // 安装「原生外观设置自动礼让监听器」：
    // 一旦用户在 Antigravity 自带「设置 → 外观」中切换深浅模式、更换预设或修改颜色，
    // 立即自动卸载工坊覆盖层，将控制权无缝归还给官方原生主题系统，绝不锁死原生设置！
    const yieldToNative = () => {
      if (window.__agyApplyingLock) return;
      window.__agyYieldedToNative = true;
      const cur = document.getElementById(STYLE_ID);
      if (cur) cur.remove();
      if (window.__agyNativeYieldObserver) {
        try { window.__agyNativeYieldObserver.disconnect(); } catch {}
        window.__agyNativeYieldObserver = null;
      }
      // 清空旧基准快照，以便下次重新启用工坊时按最新官方主题重新采样
      window.__agyBaseSnapshot = null;
    };

    // Track recent user pointer/keyboard interaction to avoid false positives from background sync
    if (!window.__agyInteractionHooked) {
      window.__agyInteractionHooked = true;
      window.__agyLastUserInputAt = 0;
      const markInput = () => { window.__agyLastUserInputAt = Date.now(); };
      window.addEventListener("pointerdown", markInput, true);
      window.addEventListener("keydown", markInput, true);

      try {
        const proto = Object.getPrototypeOf(window.localStorage);
        if (proto && !proto.__agyThemeYieldHooked) {
          const origSetItem = proto.setItem;
          Object.defineProperty(proto, "__agyThemeYieldHooked", { value: true });
          proto.setItem = function(k, v) {
            origSetItem.call(this, k, v);
            if (
              this === window.localStorage &&
              !window.__agyApplyingLock &&
              Date.now() - (window.__agyLastUserInputAt || 0) < 2500 &&
              /theme|preset|color-scheme/i.test(String(k)) &&
              !String(k).startsWith("agy_studio_")
            ) {
              yieldToNative();
            }
          };
        }
      } catch {}

      // 精准识别用户在官方「设置 → 外观」面板中点击内置预设选项或官方三色输入框的操作
      window.addEventListener("click", (ev) => {
        if (window.__agyApplyingLock) return;
        const el = ev.target && ev.target.closest ? ev.target.closest('[role="option"], [role="menuitemradio"], button') : null;
        if (!el) return;
        const txt = (el.textContent || "").trim();
        const officialPresets = /^(Onyx|Nord|Vesper|Darcula|Legacy Light|Legacy Dark|Everforest Light|Everforest Dark|Gruvbox Material)$/i;
        if (officialPresets.test(txt)) {
          yieldToNative();
        }
      }, true);

      window.addEventListener("input", (ev) => {
        if (window.__agyApplyingLock) return;
        const t = ev.target;
        if (t && t.tagName === "INPUT" && t.closest && t.closest('[role="dialog"]')) {
          const val = String(t.value || "").trim();
          if (/^#?[0-9A-Fa-f]{6}$/.test(val)) {
            yieldToNative();
          }
        }
      }, true);
    }

    setTimeout(() => {
      window.__agyApplyingLock = false;
      const getInlineColorKey = () => [
        root.style.getPropertyValue("--background"),
        root.style.getPropertyValue("--foreground"),
        root.style.getPropertyValue("--primary"),
        root.style.getPropertyValue("--accent")
      ].join("|");

      const rootAttrSnap = {
        cls: root.className,
        dt: root.getAttribute("data-theme"),
        colors: getInlineColorKey()
      };
      const obs = new MutationObserver(() => {
        if (window.__agyApplyingLock) return;
        const nextColors = getInlineColorKey();
        const themeChanged =
          root.className !== rootAttrSnap.cls ||
          root.getAttribute("data-theme") !== rootAttrSnap.dt ||
          nextColors !== rootAttrSnap.colors;
        rootAttrSnap.cls = root.className;
        rootAttrSnap.dt = root.getAttribute("data-theme");
        rootAttrSnap.colors = nextColors;
        if (themeChanged && Date.now() - (window.__agyLastUserInputAt || 0) < 2500) {
          yieldToNative();
        }
      });
      obs.observe(root, { attributes: true, attributeFilter: ["class", "data-theme", "style"] });
      window.__agyNativeYieldObserver = obs;
    }, 350);

    return { ok: true, mappedVars: mappedLines.length, sig };
  })()`;
}

export function buildPageResetExpression() {
  return `(() => {
    for (const id of ["antigravity-pro-skin-v1", "antigravity-theme-studio-v2"]) {
      const el = document.getElementById(id);
      if (el) el.remove();
    }
    return { ok: true };
  })()`;
}
