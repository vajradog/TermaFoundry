#!/usr/bin/env node
/**
 * scripts/build-pkg.mjs
 *
 * Assembles the termaUI npm package at packages/termaui/.
 * Copies built CSS, JS files, and WOFF2 fonts from public/ into
 * the package folder so it's ready for `npm publish`.
 *
 * Run via: npm run pkg:build
 * (which first runs css:dist, then this script)
 */

import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

// Resolve paths relative to repo root (works regardless of cwd)
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const PKG   = join(ROOT, 'packages', 'termaui');
const DIST  = join(PKG,  'dist');
const FONTS = join(PKG,  'fonts');
const SRC_DIST  = join(ROOT, 'public', 'dist');
const SRC_FONTS = join(ROOT, 'public', 'fonts');

/** Ensure a directory exists (mkdir -p) */
async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/** Copy a file and log the result */
async function copy(from, to, label) {
  await copyFile(from, to);
  const bytes = (await stat(to)).size;
  const kb = (bytes / 1024).toFixed(1);
  console.log(`  ✓ ${label.padEnd(30)} ${kb} KB`);
}

async function build() {
  console.log('\n📦  Building termaUI package...\n');

  await ensureDir(DIST);
  await ensureDir(FONTS);

  // ── CSS ──────────────────────────────────────────────────────────────────
  console.log('CSS:');
  await copy(join(SRC_DIST, 'termaui.css'),     join(DIST, 'termaui.css'),     'dist/termaui.css');
  await copy(join(SRC_DIST, 'termaui.min.css'), join(DIST, 'termaui.min.css'), 'dist/termaui.min.css');

  // ── JavaScript ───────────────────────────────────────────────────────────
  console.log('\nJavaScript:');
  await copy(join(SRC_DIST, 'terma.js'),     join(DIST, 'terma.js'),     'dist/terma.js (UMD/CJS)');
  await copy(join(SRC_DIST, 'terma.esm.js'), join(DIST, 'terma.esm.js'), 'dist/terma.esm.js (ESM)');

  // ── Fonts (WOFF2 only) ───────────────────────────────────────────────────
  console.log('\nFonts:');
  const allFiles = await readdir(SRC_FONTS);
  const woff2Files = allFiles.filter(f => extname(f).toLowerCase() === '.woff2');

  let totalFontBytes = 0;
  for (const f of woff2Files) {
    await copyFile(join(SRC_FONTS, f), join(FONTS, f));
    const bytes = (await stat(join(FONTS, f))).size;
    totalFontBytes += bytes;
  }
  const totalKb = (totalFontBytes / 1024).toFixed(0);
  console.log(`  ✓ ${'fonts/ (' + woff2Files.length + ' .woff2 files)'.padEnd(30)} ${totalKb} KB total`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`
✅  Package ready at packages/termaui/

  To publish:
    cd packages/termaui
    npm publish

  CDN (after publish):
    https://cdn.jsdelivr.net/npm/termaui/dist/termaui.min.css
    https://cdn.jsdelivr.net/npm/termaui/dist/terma.js
`);
}

build().catch(err => {
  console.error('\n❌  Build failed:', err.message);
  process.exit(1);
});
