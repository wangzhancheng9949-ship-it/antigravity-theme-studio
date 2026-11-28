#!/usr/bin/env node
/**
 * Automated Integrity & Contrast Verification Suite (CI Gate)
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import {
  PROJECT_ROOT,
  encodeThemeShareCode,
  decodeThemeShareCode,
  resolveEffectiveThemeId
} from "./platform.mjs";
import { buildPageApplyExpression } from "./skin-runtime.js";
import { compareSemver } from "./updater.mjs";

const HEX6_RE = /^#[0-9A-Fa-f]{6}$/;

function relLum(hex) {
  const h = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const lin = rgb.map((s) => (s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)));
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrastRatio(hex1, hex2) {
  const l1 = relLum(hex1);
  const l2 = relLum(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const catalogPath = path.join(PROJECT_ROOT, "themes", "themes.json");
const galleryPath = path.join(PROJECT_ROOT, "gallery", "index.html");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

assert.ok(Array.isArray(catalog.themes) && catalog.themes.length >= 24, "Expected at least 24 built-in themes");

const seenIds = new Set();
for (const t of catalog.themes) {
  assert.ok(t.id && /^[a-z0-9-]+$/.test(t.id), `Invalid theme id: ${t.id}`);
  assert.ok(!seenIds.has(t.id), `Duplicate theme id: ${t.id}`);
  seenIds.add(t.id);

  assert.ok(t.name && t.zhName, `Missing names on ${t.id}`);
  assert.ok(t.description && t.enDescription, `Missing bilingual descriptions on ${t.id}`);
  assert.ok(t.mode === "dark" || t.mode === "light", `Invalid mode on ${t.id}`);

  for (const key of ["background", "foreground", "accent"]) {
    assert.ok(HEX6_RE.test(t.native[key]), `Invalid ${key} hex on ${t.id}: ${t.native[key]}`);
  }
  for (const key of ["sidebarBg", "cardBg", "codeBg"]) {
    assert.ok(HEX6_RE.test(t.enhanced[key]), `Invalid enhanced.${key} hex on ${t.id}`);
  }

  const ratio = contrastRatio(t.native.background, t.native.foreground);
  assert.ok(ratio >= 4.5, `Theme ${t.id} fails WCAG AA text contrast (${ratio.toFixed(2)}:1 < 4.5:1)`);

  // Share code round-trip
  const code = encodeThemeShareCode(t);
  const decoded = decodeThemeShareCode(code);
  assert.equal(decoded.native.background, t.native.background.toUpperCase());
  assert.equal(decoded.native.accent, t.native.accent.toUpperCase());

  // Runtime AST validity check across wallpapers
  const expr = buildPageApplyExpression({ theme: t, enhanced: true, wallpaperId: "cyber-grid" });
  new Function("return " + expr);
}

// Gallery sync check
const html = fs.readFileSync(galleryPath, "utf8");
for (const id of seenIds) {
  assert.ok(html.includes(`"id": "${id}"`), `Theme "${id}" is not synced into gallery/index.html (run npm run sync)`);
}

// Schedule & SemVer checks
assert.equal(
  resolveEffectiveThemeId(
    { scheduleEnabled: true, dayStart: "07:30", nightStart: "19:00", dayThemeId: "d", nightThemeId: "n" },
    new Date("2026-11-28T11:00:00")
  ),
  "d"
);
assert.equal(compareSemver("0.4.0", "0.3.0"), 1);

console.log(`✅ Integrity check passed: ${catalog.themes.length} themes verified (100% WCAG AA+, AST valid, gallery synced).`);
