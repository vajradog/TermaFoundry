# termaUI

**Tibetan typography CSS framework** — fonts, utility classes, and rendering fixes for Tibetan script on the web.

[![npm](https://img.shields.io/npm/v/termaui)](https://www.npmjs.com/package/termaui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Documentation](https://termafoundry.com/termaui/docs/) · [Demo](https://termafoundry.com/termaui/) · [GitHub](https://github.com/vajradog/TermaFoundry)

---

## What it includes

- **30+ Tibetan fonts** as WOFF2 — Jomolhari, Noto Serif Tibetan, Monlam, Qomolangma, BabelStone, Khampa Dedri, and many more
- **Utility classes** for font selection, sizes, line heights, text effects, and pecha manuscript layout
- **terma.js** — JavaScript utilities that fix Tibetan rendering problems CSS alone cannot solve (line breaking, punctuation protection, Unicode normalization)
- **Zero config** — load the CSS and start using `tr-` classes

---

## Installation

### CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui/dist/termaui.min.css">
<script src="https://cdn.jsdelivr.net/npm/termaui/dist/terma.js"></script>
```

### npm

```bash
npm install termaui
```

---

## Quick Start

```html
<!-- 1. Load the stylesheet -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui/dist/termaui.min.css">

<!-- 2. Use lang="bo" + termaUI classes -->
<p class="tr-jomolhari tr-guard" lang="bo">
  བཀྲ་ཤིས་བདེ་ལེགས།
</p>
```

For correct line breaking, add terma.js and call `terma.prepareAll()` after the DOM is ready:

```html
<script src="https://cdn.jsdelivr.net/npm/termaui/dist/terma.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => terma.prepareAll());
</script>
```

---

## Framework Guides

### Vanilla HTML

No build step needed. Use the CDN links above.

### Next.js (App Router)

```bash
npm install termaui
```

```tsx
// app/layout.tsx
import 'termaui/dist/termaui.css';
```

```tsx
// app/TibetanInit.tsx
'use client';
import { useEffect } from 'react';
import terma from 'termaui';

export function TibetanInit() {
  useEffect(() => { terma.prepareAll(); }, []);
  return null;
}
// Add <TibetanInit /> inside <body> in your root layout
```

### Next.js (Pages Router)

```tsx
// pages/_app.tsx
import 'termaui/dist/termaui.css';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import terma from 'termaui';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  useEffect(() => {
    terma.prepareAll();
    router.events.on('routeChangeComplete', () => terma.prepareAll());
    return () => router.events.off('routeChangeComplete', () => terma.prepareAll());
  }, [router]);
  return <Component {...pageProps} />;
}
```

### Astro

```astro
---
// src/layouts/BaseLayout.astro
import 'termaui/dist/termaui.css';
---
<html><body>
  <slot />
  <script>
    import terma from 'termaui';
    terma.prepareAll();
  </script>
</body></html>
```

> **Astro + View Transitions**: Use `astro:page-load` instead of `DOMContentLoaded` when View Transitions are enabled — it fires after every client-side navigation.

### Vite + React

```jsx
// src/main.jsx
import 'termaui/dist/termaui.css';
```

```jsx
// Root component
import { useEffect } from 'react';
import terma from 'termaui';

export default function App() {
  useEffect(() => { terma.prepareAll(); }, []);
  // ...
}
```

### Vite + Vue

```ts
// src/main.ts
import 'termaui/dist/termaui.css';
```

```vue
<!-- Root component -->
<script setup>
import { onMounted } from 'vue';
import terma from 'termaui';
onMounted(() => terma.prepareAll());
</script>
```

### SvelteKit

```svelte
<!-- src/routes/+layout.svelte -->
<script>
  import 'termaui/dist/termaui.css';
  import { onMount } from 'svelte';
  import terma from 'termaui';
  onMount(() => terma.prepareAll());
</script>
<slot />
```

### Tailwind CSS Compatibility

termaUI uses a `tr-` prefix on every class. There are no naming conflicts with Tailwind, Bootstrap, or any other CSS framework. Combine classes freely:

```html
<div class="p-4 rounded-xl bg-slate-900 tr-glass">
  <p class="text-sm tr-jomolhari tr-guard tr-text-rainbow" lang="bo">
    བཀྲ་ཤིས་བདེ་ལེགས།
  </p>
</div>
```

---

## CSS Classes Reference

### Font Stacks

| Class | Font | Style |
|---|---|---|
| `.tr-jomolhari` | Jomolhari | Traditional Uchen |
| `.tr-noto` | Noto Serif Tibetan | Modern screen serif |
| `.tr-noto-bold` | Noto Serif Tibetan 700 | Bold |
| `.tr-machine-uni` | Tibetan Machine Uni | Display/headline |
| `.tr-monlam` | Monlam Bodyig | Elegant Uchen |
| `.tr-drutsa` | Qomolangma-Drutsa | Cursive drutsa |
| `.tr-noto-sans` | Noto Sans Tibetan | Sans-serif |
| `.tr-misans` | MiSans Tibetan | Geometric sans |

Full font list: [termafoundry.com/termaui/docs](https://termafoundry.com/termaui/docs/#tr-jomolhari)

### Typography

| Class | Effect |
|---|---|
| `.tr-text-sm` `.tr-text-base` `.tr-text-lg` `.tr-text-xl` `.tr-text-2xl` | Font sizes |
| `.tr-leading-tight` `.tr-leading-normal` `.tr-leading-relaxed` `.tr-leading-loose` | Line heights |
| `.tr-text-center` `.tr-text-right` | Alignment |
| `.tr-justify-bo` | Tibetan justification (requires terma.js) |
| `.tr-indent` | Traditional indent (2em) |

### Visual Effects

| Class | Effect |
|---|---|
| `.tr-text-rainbow` | Multi-color gradient text |
| `.tr-text-saffron` | Saffron-to-gold gradient |
| `.tr-text-fire` | Animated flame gradient |
| `.tr-shimmer` | Animated gold metallic sweep |
| `.tr-glow-aurora` | Pulsing teal aurora glow |
| `.tr-text-lapis` | Deep ultramarine gradient |
| `.tr-emboss` | Carved-stone relief effect |
| `.tr-outline-gold` | Gold outline, transparent fill |
| `.tr-glass` | Frosted glass panel |
| `.tr-glass-dark` | Dark frosted glass panel |

### Guardian Utilities

| Class | Effect |
|---|---|
| `.tr-guard` | Adds `padding-block: 0.25em` — prevents vowel mark clipping |
| `.tr-guard-lg` | Larger clip guard (`0.5em`) |
| `.tr-overflow-safe` | Last-resort overflow protection |
| `.tr-scale-up` | Scale Tibetan to 120% to match English visual weight |
| `.tr-scale-match` | Scale to 150% |
| `.tr-baseline` | Vertical alignment fix for inline Tibetan in English text |
| `.tr-shad-pair` | Prevent double-shad from splitting across lines |

### Stacking

| Class | Effect |
|---|---|
| `.tr-stack-safe` | Extra line height for complex consonant stacks (mantras, dharanis) |
| `.tr-ligatures` | Enable OpenType stacking features (`liga`, `blws`, `abvs`) |
| `.tr-yig-chung` | Commentary text at 75% size |

### Pecha Layout

| Class | Effect |
|---|---|
| `.tr-pecha` | Traditional pecha manuscript container (6:1 landscape, three columns) |
| `.tr-pecha-dark` | Dark variant (gold on indigo) |
| `.tr-pecha-title` | Left margin column |
| `.tr-pecha-body` | Main text block |
| `.tr-pecha-folio` | Right folio number column |
| `.tr-pecha-title-rotated` | Rotated title label |
| `.tr-yig-mgo` | Adds ༄༅། opening mark via `::before` |

---

## terma.js API

### `terma.prepare(element)`

Processes Tibetan text inside a single element:
- Inserts zero-width spaces after tsheg (་) for proper line-break opportunities
- Replaces tsheg-before-shad (་།) with non-breaking tsheg (༌།) to prevent splitting
- Wraps double-shad (། །) with word-joiners

Safe to call multiple times — processed elements are skipped.

```js
terma.prepare(document.getElementById('prayer'));
```

### `terma.prepareAll(selector?)`

Processes all `[lang="bo"]` elements on the page, or all elements matching the given CSS selector.

```js
terma.prepareAll();                    // all [lang="bo"]
terma.prepareAll('.tibetan-content');  // custom selector
```

### `terma.normalize(element)` / `terma.normalizeAll(selector?)`

Applies Unicode NFC normalization to text nodes. Fixes invisible search failures caused by equivalent-looking but differently encoded Tibetan sequences.

```js
terma.normalizeAll();
```

### CSS-only vs. Requires terma.js

**CSS only (no terma.js needed):**
- All font classes
- All visual effects
- Typography utilities (sizes, line heights, alignment)
- Guardian utilities
- Pecha layout

**Requires terma.js:**
- Correct Tibetan line breaking
- `.tr-justify-bo` (does nothing without `terma.prepare()`)
- Auto-protection of double-shad and tsheg-before-shad

---

## Package Contents

```
termaui/
  dist/
    termaui.css      — Full stylesheet (unminified)
    termaui.min.css  — Minified stylesheet (recommended for production)
    terma.js         — UMD/CJS build (browser script tag, Node require)
    terma.esm.js     — ESM build (bundler import)
  fonts/
    *.woff2          — All Tibetan font files
  README.md
```

---

## License

MIT — free for personal and commercial use.

Fonts are bundled under their respective open licenses (SIL OFL, GPL v2, open license). See [termafoundry.com/termaui](https://termafoundry.com/termaui/) for per-font license details.

---

*Created by [Thupten Chakrishar](https://termafoundry.com/about) · [Terma Foundry](https://termafoundry.com)*
