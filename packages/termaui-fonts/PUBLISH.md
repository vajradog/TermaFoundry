# How to publish termaui-fonts

## Prerequisites

- npm 2FA must be enabled on your account (same as termaui)
- You must be logged in: `npm whoami`

## First-time publish (v0.3.0)

This package has never been published. You need to publish it once to claim the name.

```bash
cd packages/termaui-fonts
npm publish --otp=XXXXXX
```

Replace `XXXXXX` with your current 2FA OTP code.

## Future updates

Whenever you add or update fonts:

1. Update font files in `packages/termaui-fonts/fonts/`
2. Update `packages/termaui-fonts/dist/termaui-fonts.css` with the new `@font-face`
3. Rebuild the minified CSS:
   ```bash
   cd /path/to/TermaFoundry
   npx postcss packages/termaui-fonts/dist/termaui-fonts.css --use cssnano -o packages/termaui-fonts/dist/termaui-fonts.min.css --no-map
   ```
4. Bump the version in `packages/termaui-fonts/package.json`
5. Publish:
   ```bash
   cd packages/termaui-fonts
   npm publish --otp=XXXXXX
   ```

## Publishing both packages together (termaui + termaui-fonts)

When releasing a version that updates both:

```bash
# 1. Build termaui
cd /path/to/TermaFoundry
npm run pkg:build

# 2. Publish termaui
cd packages/termaui
npm publish --otp=XXXXXX

# 3. Rebuild termaui-fonts min CSS if needed
cd /path/to/TermaFoundry
npx postcss packages/termaui-fonts/dist/termaui-fonts.css --use cssnano -o packages/termaui-fonts/dist/termaui-fonts.min.css --no-map

# 4. Publish termaui-fonts (new OTP — codes expire)
cd packages/termaui-fonts
npm publish --otp=YYYYYY
```

## CDN availability

After publish, jsDelivr serves the files automatically (may take ~5 min to propagate):

```
https://cdn.jsdelivr.net/npm/termaui-fonts/dist/termaui-fonts.min.css
https://cdn.jsdelivr.net/npm/termaui-fonts@0.3.0/dist/termaui-fonts.min.css
```

## What to tell users

Load both stylesheets for the full 44-font library:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui/dist/termaui.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui-fonts/dist/termaui-fonts.min.css">
<script src="https://cdn.jsdelivr.net/npm/termaui/dist/terma.js"></script>
```

Browsers only download fonts that are actually used on the page — no performance penalty.
