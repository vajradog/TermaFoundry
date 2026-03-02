---
draft: false
title: "Tibetan Fonts Library: 36 Free Web Fonts for the Tibetan Script"
snippet: "Terma Foundry's Tibetan Fonts Library collects 36 typefaces across Uchen, Drutsa, Sans, and semi-cursive styles — all free, Unicode-compliant, and previewable in your browser."
image: {
    src: "/images/blog-fonts.svg",
    alt: "Tibetan fonts library showing 36 typefaces across Uchen, Drutsa, Sans-Serif and Semi-Cursive categories with live preview"
}
publishDate: "2026-02-26 09:30"
category: "Terma Fonts"
author: "Thupten Chakrishar"
tags: [tibetan fonts, uchen, drutsa, tibetan typography, free fonts, unicode tibetan]
---

Finding high-quality, Unicode-compliant Tibetan fonts has historically been a scattered process — searching across monastery websites, obscure FTP archives, and decade-old download pages. Terma Foundry's **Tibetan Fonts Library** consolidates 36 curated typefaces into one place, with live browser previews, category filtering, and direct download links.

The library covers the full range of Tibetan scripts in active use: formal Uchen (དབུ་ཅན།) for religious and scholarly texts, flowing Drutsa (འབྲུ་ཚ།) for decorative headings, contemporary sans-serif designs for digital interfaces, and semi-cursive styles that bridge tradition and modernity.

---

## The Four Script Categories

### Uchen — དབུ་ཅན། (24 fonts)

*Uchen* literally means "with head" — referring to the horizontal headline (*shhu*) that caps each Tibetan letter, similar in concept to the headline of Devanagari. It is the formal, upright script used for:

- Religious canonical texts (*kangyur*, *tengyur*)
- Government and official documents
- Printed books, textbooks, and signage
- Digital body text on websites and apps

The library's Uchen collection ranges from classical block-print styles faithful to woodblock printing traditions to modern geometric designs optimized for screen rendering:

**Classical / Traditional Uchen**
- **Jomolhari** — the benchmark for high-quality traditional Uchen; elegant, balanced, widely trusted for canonical texts
- **Tibetan Machine Uni** — the most widely deployed Tibetan font in the world; robust Unicode coverage, reliable across platforms
- **DDC Uchen** — clean, open letterforms from the Dharma Dictionary Consortium; excellent for body text and bilingual documents
- **Monlam Bodyig** — pen-calligraphy-derived Uchen from Monlam's foundry; warm and humanist in character
- **BabelStone Tibetan** — exceptional Unicode block coverage, including obscure characters rarely found in other fonts

**Screen-Optimized Uchen**
- **Noto Serif Tibetan** — Google's Noto family entry for Tibetan; hinted for all sizes, works at 12px and 96px equally well
- **Noto Sans Tibetan** — the sans variant; slightly lighter weight, clean at small sizes on low-DPI screens

**Extended and Specialized**
- Multiple Qomolangma variants, Kailash, and additional foundry releases covering specialized use cases including historical character variants

### Drutsa — འབྲུ་ཚ། (6 fonts)

*Drutsa* (sometimes transliterated *drutsha* or *drütsa*) is the semi-formal cursive script historically used for:

- Book titles and chapter headings
- Certificate headers and official letterheads
- Decorative architectural inscriptions
- High-status correspondence

Drutsa letter forms are rounder and more fluid than Uchen, with fewer horizontal headline elements and more calligraphic flow. The library includes six Drutsa typefaces:

- **Qomolangma Drutsa** — flowing, readable, widely compatible
- Additional variants covering different regional calligraphic traditions and weight variations

Drutsa is an ideal script choice when you need decorative impact that remains unmistakably Tibetan — for signage, posters, book covers, or pecha title pages.

### Sans-Serif Tibetan (3 fonts)

Contemporary sans-serif Tibetan designs are newer, emerging primarily in the last decade to address digital interface needs:

- **Noto Sans Tibetan** — the most complete sans option; designed to work alongside Noto Sans Latin for seamless bilingual UI
- **Microsoft Himalaya** — Microsoft's bundled Tibetan sans; solid coverage, designed for Windows system-level rendering

Sans-serif Tibetan works particularly well for:
- Mobile app interfaces
- Captions and UI labels
- Short text at small sizes where serif detail becomes noise

### Semi-Cursive (3 fonts)

Between the formality of Uchen and the fluidity of fully cursive *Umé* (དབུ་མེད།) sits a category of semi-cursive designs — less rigid than classical block print but more legible than hand-written cursive:

- **Monlam OuChan** — warm and approachable; popular for educational materials where strict formality would feel unwelcoming

---

## How the Library Is Organized

The fonts page at [termafoundry.com/fonts](/fonts) displays all 36 fonts in a filterable grid. Each font card shows:

- The font name and script category
- A live preview of a Tibetan sentence rendered in that exact font, loaded directly in the browser
- A download button linking to the font file

### Category Filtering

The top toolbar lets you filter by script style. Clicking **Uchen** shows only the 24 Uchen fonts. Clicking **Drutsa** narrows to the 6 calligraphic options. You can reset to show all 36.

### Live Preview Bar

Below the filter toolbar sits a live preview input. Type or paste any Tibetan text (or use the built-in Tibetan IME) and all 36 font cards update simultaneously to preview your exact string. This is the fastest way to compare how a specific word or phrase renders across different typefaces.

The preview bar includes:
- A text input with the Monlam phonetic IME active by default
- Font size controls (small / medium / large)
- Clear button

---

## Technical Details: How the Fonts Load

### Unicode Range Loading

All 36 fonts are loaded using `@font-face` declarations scoped to the Tibetan Unicode block:

```css
@font-face {
  font-family: 'Jomolhari';
  src: url('/fonts/jomolhari.woff2') format('woff2');
  unicode-range: U+0F00-0FFF;
}
```

The `unicode-range` descriptor tells the browser to only download a font file when the page actually contains Tibetan text. For visitors viewing the fonts page, this means all 36 fonts load; for visitors on other pages where Tibetan text appears, only the fonts actually used on that page are downloaded.

### WOFF2 Format

All fonts are served as WOFF2 (Web Open Font Format 2), the most efficient web font format with roughly 30% smaller file sizes than WOFF and 40% smaller than TTF. Tibetan font files tend to be larger than Latin fonts due to the complexity of stacked consonant glyphs — WOFF2 compression meaningfully reduces load times.

### Rendering Considerations

Tibetan script stacks consonants vertically to form syllables — for example, the syllable གྲུབ (drub) stacks three components. Web browsers render these stacks using OpenType features, primarily GSUB (Glyph Substitution) and GPOS (Glyph Positioning) rules embedded in the font file. Font quality varies significantly in how well these rules are implemented:

- **Higher quality fonts** handle all standard stacks cleanly and produce correct spacing in mixed Tibetan-Latin documents
- **Lower quality fonts** may misalign stacks, produce incorrect spacing, or fail to render uncommon character combinations

The Terma Foundry library is curated with OpenType quality as a key criterion. Fonts with known rendering issues in major browsers are excluded or flagged.

---

## Choosing the Right Font

Different use cases call for different typefaces. Here is a practical guide:

| Use Case | Recommended Fonts |
|----------|------------------|
| Long-form body text (print) | Jomolhari, DDC Uchen, Monlam Bodyig |
| Long-form body text (screen) | Noto Serif Tibetan, Tibetan Machine Uni |
| UI labels and interfaces | Noto Sans Tibetan, Microsoft Himalaya |
| Document headings | Qomolangma Drutsa, Monlam OuChan |
| Sacred texts and manuscripts | Jomolhari, Monlam Bodyig |
| Children's education | Noto Serif Tibetan (open, well-hinted) |
| Pecha manuscript pages | Jomolhari, DDC Uchen, Noto Serif Tibetan |
| Bilingual (Tibetan + Latin) | Noto Serif Tibetan, Noto Sans Tibetan |

---

## Multilingual Design Challenges

One recurring challenge in Tibetan typography is integration with Latin scripts. Tibetan syllables are taller and wider than Latin characters at equivalent font sizes, causing:

- Inconsistent baseline alignment in mixed-script paragraphs
- Irregular line spacing when Tibetan stacks push line height
- Layout reflow in narrow columns or constrained containers

The fonts in the Terma Foundry library are selected partly based on how gracefully they handle mixed-script documents. Noto's family design — where Latin, Tibetan, and dozens of other scripts are designed together — makes it the most reliable choice for multilingual contexts.

---

## Frequently Asked Questions

**Are all 36 fonts free to download?**
Yes. Every font in the library is freely distributable. Most are released under the SIL Open Font License (OFL), which permits free use, modification, and redistribution, including for commercial projects. License details are noted on each font's individual page or in the downloaded package.

**Can I use these fonts on my website?**
Yes. The WOFF2 files are suitable for `@font-face` embedding in web projects. Check the individual font license to confirm commercial hosting rights — all OFL fonts permit this.

**Are these fonts compatible with Microsoft Word and LibreOffice?**
Yes. Download the TTF or OTF version from the linked source pages. TTF/OTF files install like any system font and work in any desktop application.

**Do these fonts cover all Tibetan Unicode characters?**
Coverage varies by font. Tibetan Machine Uni and BabelStone Tibetan have the broadest Unicode coverage, including many archaic and specialized characters. More design-focused fonts may cover only the most common characters. If you need a specific character, test in the live preview bar.

**What is the difference between Uchen and Umé?**
Uchen (དབུ་ཅན།) means "with head" and refers to the formal, headed script with horizontal top strokes. Umé (དབུ་མེད།) means "headless" and is the informal cursive script used for everyday handwriting. The Terma Foundry library currently focuses on Uchen and Drutsa; Umé fonts are planned for a future update.

**Why is my Tibetan text not rendering correctly?**
The most common issues are:
1. Text is encoded in a legacy encoding (like Sambhota or TCRC) rather than Unicode — these fonts require Unicode input (U+0F00–0FFF)
2. A missing font fallback — if your browser cannot find a Tibetan font, it will render tofu (□) characters
3. Incorrect stacking sequences — Unicode Tibetan has specific rules for how stack components must be ordered

**How often is the library updated?**
New fonts are added as they are discovered, evaluated for quality, and licensed. The library is actively maintained as part of the Terma Foundry project.

---

## About the Curation Process

Adding a font to the library involves several checks:

1. **Unicode compliance** — all characters must map to the correct Unicode code points (U+0F00–0FFF), not legacy encodings
2. **OpenType stack rendering** — common consonant stacks (e.g., སྐ, གྲ, བྲ, སྤྱ) are tested in Chrome, Firefox, and Safari
3. **Mixed-script behavior** — the font is tested alongside Noto Sans Latin to check baseline and line-height behavior
4. **License verification** — only fonts with clear open licensing are included
5. **File integrity** — WOFF2 conversion is verified; corrupted or incomplete font files are excluded

This curation approach makes the library a reliable starting point rather than an exhaustive raw dump of every Tibetan font ever released.

---

---

## Related Articles

- [PechaForge: Create Traditional Tibetan Pecha Manuscripts in Your Browser](/blog/pechaforge-tibetan-pecha-layout-tool) — Use these fonts to create formatted pecha pages
- [termaUI: A Utility CSS Framework for Tibetan Script Web Design](/blog/termaui-tibetan-css-framework) — CSS framework that loads these fonts with a single class
- [Learn to Type Tibetan: Free Online Practice Tool](/blog/tibetan-typing-practice-online) — Practice typing the script these fonts render

*The Tibetan Fonts Library is available at [termafoundry.com/fonts](/fonts). All fonts are free to download and use.*
