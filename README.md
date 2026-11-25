# Antigravity Theme Studio

简体中文 | [English](./README.en.md) · 🌐 **[在线预览主题画廊 (Live Gallery)](https://wangzhancheng9949-ship-it.github.io/antigravity-theme-studio/gallery/)** · 📦 **[下载最新免安装版 (Releases)](https://github.com/wangzhancheng9949-ship-it/antigravity-theme-studio/releases/latest)**

为 **Google Antigravity 2.0 桌面端** 打造的跨平台（Windows · macOS · Linux）可视化主题工坊、原生色阶重映射引擎与程序化纹理壁纸工具。

- **零侵入、不怕自动更新**：完全不修改 `app.asar` 与安装目录，不破坏 macOS / Windows 官方代码签名；客户端版本更新后依然无缝生效。
- **原生级 CSS 变量重映射引擎**：自动扫描并按明度曲线重映射页面全部原生 CSS 颜色变量，深色与浅色无缝翻转，绝无“白底白字”或局部色块割裂，完整保留语法高亮与 Diff 状态色。
- **重启自动保持 + 汉化无缝联动**：内置轻量持久化守护与跨平台启动器生成，自动兼容 `Antigravity-Hans` 等 CDP 工具，下次打开软件自动套用上次保存的皮肤与壁纸。
- **零外部依赖、三端开箱即用**：无需安装 Node.js 或 `npm install`，自动复用本机 Node 或 Antigravity 内置运行时。
- **100% 版权与商标合规**：内置 8 套原创美学色板 + 6 套 MIT 协议社区经典色板，搭配 3 款纯代码程序化生成 SVG 纹理与本地壁纸叠加（仅存本机，不上传）。

---

## 快速开始（Windows / macOS / Linux）

### Windows
双击运行根目录的 **`打开主题工坊.bat`**（或 `start-studio.bat`），浏览器将自动打开 `http://127.0.0.1:3399`。

### macOS
首次赋予执行权限后双击 **`start-studio.command`**（或在终端运行）：
```bash
chmod +x start-studio.command
./start-studio.command
```

### Linux
```bash
chmod +x start-studio.sh
./start-studio.sh
```

---

## 三步完成换肤与「重启不掉皮肤」

1. **预览与选款**：在 `http://127.0.0.1:3399` 左侧点选任意深色/浅色主题，可自由叠加 **极光流体 / 等高线微纹 / 极客点阵** 或上传**本机图片壁纸**，拖动滑块调节浓度与高斯模糊。
2. **一键生效**：点击 **`⚡ 一键实时换肤并保存`**，当前运行的 Antigravity 窗口立即变身（若未通过调试模式启动，请先执行第 3 步）。
3. **跨平台自动保持**：点击页面横幅上的 **`📌 生成桌面「Antigravity 主题版」启动器`**：
   - **Windows**：在桌面生成 `Antigravity 主题版.lnk`（若本机已装 `Antigravity-Hans` 汉化，双击会自动同时拉起汉化与主题守护）。
   - **macOS**：在 `~/Applications/` 生成 `Antigravity Themed.app`。
   - **Linux**：在 `~/.local/share/applications/` 生成桌面应用入口。

---

## 内置 14 套精选主题

### 深色主题（8 套）
| ID | 名称 | 中文名 | 授权来源 | 背景色 | 前景色 | 强调色 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `terracotta-charcoal` | Terracotta Charcoal | 赤陶暖炭 | MIT (Original) | `#1F1E1D` | `#ECEAE4` | `#D97757` |
| `obsidian-nebula` | Obsidian Nebula | 黑曜星云 | MIT (Original) | `#0F1014` | `#E6E8F0` | `#7C6BF0` |
| `midnight-cobalt` | Midnight Cobalt | 极夜钴蓝 | MIT (Original) | `#121316` | `#E4E6EB` | `#3B82F6` |
| `graphite-coral` | Graphite Coral | 石墨珊瑚 | MIT (Original) | `#141417` | `#F0F0F5` | `#FF6363` |
| `catppuccin-mocha` | Catppuccin Mocha | 猫布奇诺 · 摩卡 | MIT (Catppuccin) | `#1E1E2E` | `#CDD6F4` | `#CBA6F7` |
| `tokyo-night` | Tokyo Night | 东京之夜 | MIT (Tokyo Night) | `#1A1B26` | `#C0CAF5` | `#7AA2F7` |
| `rose-pine` | Rosé Pine | 玫瑰松 · 暗夜 | MIT (Rosé Pine) | `#191724` | `#E0DEF4` | `#EBBCBA` |
| `kanagawa-wave` | Kanagawa Wave | 神奈川海浪 | MIT (Kanagawa) | `#1F1F28` | `#DCD7BA` | `#7E9CD8` |

### 浅色主题（6 套）
| ID | 名称 | 中文名 | 授权来源 | 背景色 | 前景色 | 强调色 |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `editorial-parchment` | Editorial Parchment | 羊皮书卷 | MIT (Original) | `#F5F4EE` | `#2D2B28` | `#C96442` |
| `ivory-studio` | Ivory Studio | 象牙简白 | MIT (Original) | `#FBFBFA` | `#37352F` | `#2383E2` |
| `silver-frost` | Silver Frost | 极简霜白 | MIT (Original) | `#F5F5F7` | `#1D1D1F` | `#0071E3` |
| `matcha-washi` | Matcha Washi | 抹茶和纸 | MIT (Original) | `#F2F5EF` | `#2C362B` | `#4A7C59` |
| `catppuccin-latte` | Catppuccin Latte | 猫布奇诺 · 拿铁 | MIT (Catppuccin) | `#EFF1F5` | `#4C4F69` | `#8839EF` |
| `rose-pine-dawn` | Rosé Pine Dawn | 玫瑰松 · 晨曦 | MIT (Rosé Pine) | `#FAF4ED` | `#575279` | `#D7827E` |

---

## Roadmap

- [x] 原生 CSS 变量曲线重映射引擎（深浅零割裂）
- [x] 原创程序化 SVG 纹理与本地自定义图片壁纸（含浓度/模糊调节）
- [x] Windows / macOS / Linux 三端启动器与重启自动保持守护
- [ ] 可视化自由调色器与一键生成配对深/浅色板
- [ ] 跟随日出日落自动切换深浅主题
- [ ] 社区主题一键导入/导出分享码

---

## 合规与致谢

- 本项目为社区独立开源工具，与 Google LLC 无隶属或官方背书关系。
- 仓库不分发任何官方二进制或受版权保护的第三方图片素材；社区开源色板署名详见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。
- 开源协议：[MIT License](./LICENSE)。
