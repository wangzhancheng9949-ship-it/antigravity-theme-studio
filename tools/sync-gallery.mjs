#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./platform.mjs";

const themesPath = path.join(PROJECT_ROOT, "themes", "themes.json");
const galleryPath = path.join(PROJECT_ROOT, "gallery", "index.html");

const { themes } = JSON.parse(fs.readFileSync(themesPath, "utf8"));
const html = fs.readFileSync(galleryPath, "utf8");
const startTag = "// EMBEDDED_THEMES_START";
const endTag = "// EMBEDDED_THEMES_END";
const s = html.indexOf(startTag);
const e = html.indexOf(endTag);
if (s < 0 || e < 0) {
  console.error("Sync markers not found in gallery/index.html");
  process.exit(1);
}
const updated =
  html.slice(0, s) +
  `${startTag}\n    let THEMES = ${JSON.stringify(themes, null, 2)};\n    ${endTag}` +
  html.slice(e + endTag.length);

fs.writeFileSync(galleryPath, updated, "utf8");
console.log(`Synced ${themes.length} themes into gallery/index.html`);
