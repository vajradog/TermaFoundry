"""Write src/foundry/data/glyphset.js: every character of Yangtso, read from the font itself.

Run from the repository root after replacing the fonts in public/test/fonts/:

    python src/foundry/tools/glyphset.py

Needs fontTools (with brotli) and uharfbuzz. Each precomposed stack in the font is named after its
Unicode sequence (uni0F660F90 is སྐ); the script shapes every sequence with HarfBuzz and keeps it
only if the font really draws it as that one glyph, so the page shows nothing the font cannot
render. The font keeps its stacks in order of use, commonest first: `stacksByUse` keeps that
order, `stacks` sorts them alphabetically.
"""
import io
import json
import re
import sys
from pathlib import Path

import uharfbuzz as hb
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3]
FONT = ROOT / 'public/test/fonts/yangtso-regular.woff2'
OUT = ROOT / 'src/foundry/data/glyphset.js'

# The thirty letters in Tibetan alphabetical order; a subjoined letter sorts with its base letter.
ALPHABET = 'ཀཁགངཅཆཇཉཏཐདནཔཕབམཙཚཛཝཞཟའཡརལཤསཧཨ'
RANK = {ord(c): i for i, c in enumerate(ALPHABET)}


def rank(cp):
    if 0x0F90 <= cp <= 0x0FBC:
        cp -= 0x50
    return RANK.get(cp, 100 + cp)


def sort_key(seq):
    return [rank(c) for c in seq]


font = TTFont(FONT)
cmap = font.getBestCmap()
order = font.getGlyphOrder()

# HarfBuzz reads TrueType, not WOFF2: hand it the decompressed font.
font.flavor = None
raw = io.BytesIO()
font.save(raw)
hb_font = hb.Font(hb.Face(hb.Blob(raw.getvalue())))


def shapes_to(text, glyph):
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(hb_font, buf, {})
    return [order[i.codepoint] for i in buf.glyph_infos] == [glyph]


stacks, vowel_ligs, failed = [], [], []
for g in order:
    m = re.fullmatch(r'uni((?:[0-9A-F]{4})+)', g)
    if not m or len(m.group(1)) == 4:
        continue
    seq = [int(m.group(1)[i:i + 4], 16) for i in range(0, len(m.group(1)), 4)]
    text = ''.join(map(chr, seq))
    if not 0x0F40 <= seq[0] <= 0x0F6C:
        text = 'ཀ' + text  # a vowel-and-anusvara pair is shown on ka
        ok = True
    else:
        ok = shapes_to(text, g)
    if not ok:
        failed.append(text)
        continue
    has_sub = any(0x0F8D <= c <= 0x0FBC for c in seq)
    has_vowel = any(0x0F71 <= c <= 0x0F87 for c in seq)
    (vowel_ligs if has_vowel else stacks).append((sort_key(seq), text))
    assert has_sub or has_vowel, text

cps = sorted(cmap)
in_range = lambda a, b: [chr(c) for c in cps if a <= c <= b]
letters_extra = [chr(c) for c in cps if 0x0F40 <= c <= 0x0F6C and chr(c) not in ALPHABET]
vowels = ['ཀ' + chr(c) for c in cps if 0x0F71 <= c <= 0x0F84]
digits = in_range(0x0F20, 0x0F33)
signs = [chr(c) for c in cps if (0x0F00 <= c <= 0x0F1F or 0x0F34 <= c <= 0x0F3F or 0x0F85 <= c <= 0x0F8C or 0x0FBE <= c <= 0x0FDA)]
english = [chr(c) for c in cps if 0x21 <= c <= 0x7E or c in (0xB0, 0x2010, 0x2011, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026)]
sums = [chr(c) for c in cps if c in (0x2B, 0x2212, 0xD7, 0xF7, 0x3D)]
icons = [chr(c) for c in cps if (0x2190 <= c <= 0x2BFF and c != 0x2212) or c >= 0x1F000]
seals = [chr(c) for c in cps if 0xE000 <= c <= 0xF8FF]

data = {
    'letters': list(ALPHABET),
    'sanskrit': letters_extra,
    'vowels': vowels,
    'stacks': [t for _, t in sorted(stacks)],
    'stacksByUse': [t for _, t in stacks],
    'vowelLigatures': [t for _, t in sorted(vowel_ligs)],
    'digits': digits,
    'signs': signs,
    'english': english,
    'sums': sums,
    'icons': icons,
    'seals': seals,
    'glyphs': len(order),
}

OUT.write_text(
    '/* Every character of Yangtso, grouped for the "whole set" on the Yangtso page.\n'
    '   Generated from the font by src/foundry/tools/glyphset.py; do not edit by hand. */\n'
    f'export const GLYPHSET = {json.dumps(data, ensure_ascii=False, indent=1)};\n',
    encoding='utf-8',
    newline='\n',
)
print({k: len(v) if isinstance(v, list) else v for k, v in data.items()}, 'failed:', failed, file=sys.stderr)
