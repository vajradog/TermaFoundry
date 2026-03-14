# termaui-fonts

Extended Tibetan font library for [termaUI](https://termafoundry.com/termaui) — 40+ WOFF2 fonts with calibrated `size-adjust` values.

This package is a companion to `termaui`. Install `termaui` first, then add this package to access the full font library.

## CDN (no install needed)

```html
<!-- Load termaUI first -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui/dist/termaui.min.css">

<!-- Then add extended fonts -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui-fonts/dist/termaui-fonts.min.css">
```

## npm

```bash
npm install termaui termaui-fonts
```

```js
import 'termaui/dist/termaui.css';
import 'termaui-fonts/dist/termaui-fonts.css';
```

## What's included

40+ Tibetan WOFF2 fonts covering:

- **Noto Serif Tibetan** — full weight axis (100–900)
- **Tibetan Machine Uni** — bold display/headline
- **BabelStone Tibetan** (regular + slim)
- **DDC Uchen**, **DDC Rinzin** — Bhutanese government fonts
- **GangJie Uchen**, **GangJie Drutsa**
- **Jamyang Monlam Uchen**
- **Khampa Dedri** (Bechu, Chuyig, Drutsa)
- **Monlam Uni** — OuChan 1–5, Sans, PayTsik, Tikrang, TikTong, Dutsa 1–2
- **Noto Sans Tibetan**, **MiSans Tibetan**
- **Panchen Tsukring**, **Riwoche Dhodri**
- **Sadri Yigchen**, **Sadri Drutsa**
- **Joyig**
- **Qomolangma-Betsu**, **Qomolangma-Tsutong**

All fonts include `size-adjust` calibrated against the Jomolhari reference ascent.

## Bundled fonts (in termaui)

The base `termaui` package includes 4 fonts: Jomolhari, Monlam Bodyig, Qomolangma-UchenSarchen, and Qomolangma-Drutsa. You only need this package for the additional 40+.

## Documentation

[termafoundry.com/termaui](https://termafoundry.com/termaui)
