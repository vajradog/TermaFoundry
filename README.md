# Terma Foundry

**Open-source tools for Tibetan script on the modern web.**

We design and build the infrastructure Tibetan script needs in the digital world — a CSS framework, a curated font library, a traditional manuscript creator, and keyboard training tools. Everything built from the ground up. Everything free.

→ **[termafoundry.com](https://termafoundry.com)**

---

## The Tools

### ◈ termaUI — Tibetan CSS Framework
*Available now · Seeking funding for full production*

The world's first utility-first CSS framework built specifically for Tibetan script rendering. One stylesheet that solves every problem Tibetan developers hit when building for the web.

**What it solves:**
- Vowel marks and stacked consonants clipping out of their line boxes
- Browsers breaking text at every tsheg, splitting syllables mid-word
- No standard way to select fonts, set sizes, or handle Tibetan-specific spacing
- Reinventing pecha manuscript layout from scratch on every project

**Six utility modules:**

| Module | What it does |
|---|---|
| **Font Stacks** | `tr-jomolhari`, `tr-noto`, `tr-monlam`, `tr-drutsa` and 30+ more — one class selects font + fallback chain |
| **Guardian** | `tr-guard` fixes vowel clipping by setting the correct line-height, overflow, and spacing for any Tibetan element |
| **Typography** | `tr-text-sm` → `tr-text-5xl` — font sizes paired with Tibetan-optimized line heights |
| **Effects** | `tr-text-rainbow`, `tr-shimmer`, `tr-text-fire`, `tr-emboss`, `tr-glow-aurora` and more — composable visual effects |
| **Pecha Layout** | `tr-pecha`, `tr-pecha-dark`, `tr-pecha-title`, `tr-pecha-body`, `tr-pecha-folio`, `tr-yig-mgo` — traditional manuscript format in pure CSS |
| **Stacking** | Utilities for complex consonant stacks (3–4 deep) common in Sanskrit mantras and dharani |

**Works alongside Tailwind, Bootstrap, and any other CSS framework** — all classes use the `tr-` prefix with zero conflicts.

**Companion: terma.js** — JavaScript utilities for problems CSS alone can't fix: correct Tibetan line breaking, Unicode NFC normalization, and protection of double-shad and tsheg-before-shad punctuation.

```html
<!-- One line to start -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/termaui/dist/termaui.min.css">

<!-- Then compose classes on any element -->
<p class="tr-jomolhari tr-guard tr-text-xl" lang="bo">བཀྲ་ཤིས་བདེ་ལེགས།</p>
```

→ [termafoundry.com/termaui](https://termafoundry.com/termaui) · [Documentation](https://termafoundry.com/termaui/docs)

---

### Ꞷ Font Library — 36 Free Tibetan Typefaces
*Available now*

36 open-source Tibetan fonts packaged as WOFF2, self-hosted, and ready to use with a single `tr-` class. No Google Fonts dependency, no external requests, loaded with `unicode-range: U+0F00-0FFF` so Latin text is never affected.

**Script categories:**

- **Uchen (དབུ་ཅན)** — The formal upright script. Jomolhari, DDC Uchen, Noto Serif Tibetan, Tibetan Machine Uni, BabelStone Tibetan, Monlam Bodyig, Panchen Tsukring, Riwoche Dhodri, and more
- **Qomolangma** — Sarchen, Betsu, Tsutong, and full Drutsa family
- **Monlam Uni** — OuChan 1–5, PayTsik, Tikrang, TikTong, Sans, Dutsa 1–2
- **Drutsa (དབུ་མེད)** — Flowing cursive. Qomolangma Drutsa, GangJie, Khampa Dedri, Sadri
- **Sans-serif** — Noto Sans Tibetan, MiSans Tibetan
- **Semi-cursive** — Joyig, Khampa Chuyig, Bechu

**Interactive preview bar** — type Tibetan directly in the browser (no keyboard or font installation needed), try preset phrases, and preview every font at any size up to 72px.

→ [termafoundry.com/fonts/library](https://termafoundry.com/fonts/library)

---

### 📜 PechaForge — Traditional Manuscript Creator
*Available now*

The first free tool to format Tibetan text into traditional pecha (དཔེ་ཆ།) manuscript pages, entirely in the browser. No account, no server, no installation.

**Features:**
- **36 fonts** — every font in the library available for your pecha
- **4 themes** — Light (classical), Dark (sacred gold on indigo), Aged Scroll, High Contrast
- **Yig mgo** — automatic ༄༅། opening mark insertion
- **Tibetan numeral folios** — folio numbers rendered in Tibetan script (༡, ༢, ༣…)
- **Configurable layout** — lines per page, folio starting number, custom title
- **PDF export** — one-click export via browser print
- **Duplex printing** — double-sided layout for cutting and binding into real pecha leaves
- **Save / Load** — projects saved as `.json` for later editing
- **Auto-save** — drafts preserved in browser storage automatically
- **Browser-native IME** — type Tibetan directly using standard keys (Monlam phonetic layout)

→ [termafoundry.com/pecha](https://termafoundry.com/pecha)

---

### ⌨ Tibetan Typing Practice
*Coming soon*

Structured keyboard training using the Monlam phonetic IME — the most widely used Tibetan input method. No Tibetan keyboard or font installation required. Practice in any browser, on any device.

**Planned features:**
- 5 progressive lessons: Alphabet (30 consonants), Vowels (4 diacritics), Stacked consonants, Words, Sentences
- Real-time WPM, accuracy tracking, and streak counter
- Visual QWERTY keyboard overlay mapping English keys to Tibetan characters
- Free typing mode alongside structured practice

→ [termafoundry.com/type](https://termafoundry.com/type)

---

## Why This Exists

Six million Tibetan speakers. Fifteen centuries of literary tradition. A diaspora scattered across forty countries.

And fewer than a dozen usable digital typefaces — none designed for children, language learners, or the modern web. No CSS framework. No browser-based manuscript tools. Developers building Tibetan websites manually patch vowel clipping bugs, hand-write line-height hacks, and reinvent layout systems project by project.

We are building the infrastructure that should already exist.

---

## The Fonts We're Designing

Beyond the library of existing fonts, we are creating three original typefaces with master calligrapher **Jamyang Dorjee**:

**Terma Serif** — A refined scholarly serif for print and long-form reading. Consistent weight, precise hinting, full Unicode coverage. The font Tibetan publishing has needed for a generation.

**Terma Sans** — A clean screen-optimised sans-serif that works at every scale, from navigation labels to display headings, and sits naturally alongside Latin and CJK in multilingual layouts.

**Terma Lotsawa** — Simplified letterforms with generous spacing for children, heritage learners, and the diaspora. The font nobody has built yet — designed with educators who told us: *"I gave up because the writing looked too hard."*

---

## Tech Stack

Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com), using termaUI itself for all Tibetan rendering. Deployed on GitHub Pages. MIT licensed.

---

## License

MIT — free to use, modify, and distribute. All fonts retain their original licenses (SIL OFL unless noted).

---

*Founded by [Thupten Chakrishar](https://chakrishar.com)*

