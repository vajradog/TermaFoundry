"""The superscript lesson at the top of /typing, built from Sonam Tsering's video.

    python scripts/superscripts.py --video "The Superscript Letters (མགོ་ཅན་གསུམ).mp4"
    python scripts/superscripts.py              # glyphs only, keep the audio already cut

Writes
  src/spell/superscripts.json   the three series in the video's order, each stack drawn from
                                Jomolhari as two SVG paths: the superscript (red) and the rest
                                (ink), in font units, y up
  public/spell/sonam/<wy>.mp3   his voice for each stack, cut at his pauses (ffmpeg)
  <temp>/superscripts-proof.png a proof sheet of every split, to check by eye (not kept)

The video says one stack every three seconds and is silent in between, so silencedetect finds
exactly one stretch of speech per stack, in order. The split is the top of the root's head bar:
everything above it is the superscript. The root is found inside the stack by laying the root
letter over it where the two overlap most. ཙ ཚ ཛ carry a mark above their head bar; it stays ink.
"""

import argparse
import io
import json
import os
import re
import subprocess
import sys
import tempfile

import numpy as np
import pathops
import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.ttLib import TTFont

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, 'public', 'fonts', 'jomolhari-regular.woff2')
OUT_JSON = os.path.join(ROOT, 'src', 'spell', 'superscripts.json')
OUT_AUDIO = os.path.join(ROOT, 'public', 'spell', 'sonam')
PROOF = os.path.join(tempfile.gettempdir(), 'superscripts-proof.png')

# The video's order (its ra-mgo row puts rtsa before rma).
SERIES = [
    ('r', 'ར', ['rka', 'rga', 'rnga', 'rja', 'rnya', 'rta', 'rda', 'rna', 'rba', 'rtsa', 'rma', 'rdza']),
    ('l', 'ལ', ['lka', 'lga', 'lnga', 'lca', 'lja', 'lta', 'lda', 'lpa', 'lba', 'lha']),
    ('s', 'ས', ['ska', 'sga', 'snga', 'snya', 'sta', 'sda', 'sna', 'spa', 'sba', 'sma', 'stsa']),
]
LETTER = {'k': 'ཀ', 'g': 'ག', 'ng': 'ང', 'c': 'ཅ', 'j': 'ཇ', 'ny': 'ཉ', 't': 'ཏ', 'd': 'ད', 'n': 'ན',
          'p': 'པ', 'b': 'བ', 'm': 'མ', 'ts': 'ཙ', 'dz': 'ཛ', 'h': 'ཧ'}
MARKED = {'ཙ', 'ཚ', 'ཛ'}          # a mark that rises above the head bar and belongs to the root
TSHEG = '་'


def tibetan(wy):
    sup, root = wy[0], wy[1:-1]
    return {'r': 'ར', 'l': 'ལ', 's': 'ས'}[sup] + chr(ord(LETTER[root]) + 0x50)


# ---------------------------------------------------------------- glyphs

def load_font():
    f = TTFont(FONT)
    f.flavor = None
    buf = io.BytesIO()
    f.save(buf)
    face = hb.Face(buf.getvalue())
    return f, hb.Font(face)


def shaped(f, font, text):
    """[(glyph name, x)] for text."""
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {})
    out, x = [], 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        out.append((f.getGlyphName(info.codepoint), x + pos.x_offset, pos.y_offset))
        x += pos.x_advance
    return out, x


def outline(f, name, dx=0, dy=0):
    p = pathops.Path()
    f.getGlyphSet()[name].draw(p.getPen())
    return p.transform(1, 0, 0, 1, dx, dy) if dx or dy else p   # transform() returns a new path


def place(f, font, root, stack, dys=range(-560, -79, 16)):
    """Where the root letter sits inside the stack: the shift (dx, dy) that lays its outline
    over the stack with the most of it inside and the least sticking out."""
    (name, _, _), = shaped(f, font, root)[0]
    whole = abs(outline(f, name).area)

    def score(dx, dy):
        inside = abs(pathops.op(stack, outline(f, name, dx, dy), pathops.PathOp.INTERSECTION).area)
        return 2 * inside - whole

    _, bx, by = max((score(dx, dy), dx, dy) for dy in dys for dx in range(-80, 81, 16))
    _, bx, by = max((score(dx, dy), dx, dy) for dy in range(by - 14, by + 15, 2) for dx in range(bx - 12, bx + 13, 4))
    return name, bx, by


def halfplane(y):
    """Everything above y."""
    p = pathops.Path()
    pen = p.getPen()
    pen.moveTo((-5000, y)); pen.lineTo((5000, y)); pen.lineTo((5000, 5000)); pen.lineTo((-5000, 5000)); pen.closePath()
    return p


def svg(path):
    pen = SVGPathPen(None, ntos=lambda v: str(round(v)))
    path.draw(pen)
    return pen.getCommands()


def build_glyphs():
    f, font = load_font()
    head = outline(f, shaped(f, font, 'ཀ')[0][0][0]).bounds[3]   # the headline every root letter's head bar meets
    series = []
    proofs = []
    for sup_wy, sup_bo, stacks in SERIES:
        built = []
        for wy in stacks:
            bo = tibetan(wy)
            glyphs, adv = shaped(f, font, bo + TSHEG)
            (sname, sx, sy) = glyphs[0]
            stack = outline(f, sname, sx, sy)
            rest = pathops.Path()
            for name, x, y in glyphs[1:]:
                rest = pathops.op(rest, outline(f, name, x, y), pathops.PathOp.UNION)
            root_nominal = chr(ord(bo[1]) - 0x50)
            built.append((wy, bo, adv, stack, rest, root_nominal, place(f, font, root_nominal, stack)[2]))
        # one series lowers its roots by much the same amount: search near the series' median
        mid = int(np.median([b[-1] for b in built]))
        items = []
        for wy, bo, adv, stack, rest, root_nominal, _ in built:
            rname, rx, ry = place(f, font, root_nominal, stack, range(mid - 48, mid + 49, 8))
            top = head + ry - 4
            red = pathops.op(stack, halfplane(top), pathops.PathOp.INTERSECTION)
            if root_nominal in MARKED:
                # the mark of ཙ ཚ ཛ rises above the root's head bar: that part of the root stays ink
                mark = pathops.op(outline(f, rname, rx, ry), halfplane(top + 12), pathops.PathOp.INTERSECTION)
                grown = pathops.Path()
                mark.draw(grown.getPen())
                grown.stroke(30, pathops.LineCap.ROUND_CAP, pathops.LineJoin.ROUND_JOIN, 4)
                grown.convertConicsToQuads()
                red = pathops.op(red, pathops.op(grown, mark, pathops.PathOp.UNION), pathops.PathOp.DIFFERENCE)
            ink = pathops.op(stack, red, pathops.PathOp.DIFFERENCE)
            ink = pathops.op(ink, rest, pathops.PathOp.UNION)
            items.append({'wy': wy, 'bo': bo, 'w': adv, 'red': svg(red), 'ink': svg(ink)})
            proofs.append((wy, red, ink, adv))
            print(f'  {wy:5s} {bo}  split at y={top:.0f}')
        series.append({'sup': sup_wy, 'bo': sup_bo, 'stacks': items})
    boxes = [b for _, red, ink, _ in proofs for b in (red.bounds, ink.bounds) if b != (0, 0, 0, 0)]
    return {
        'font': 'Jomolhari',
        'left': round(min(b[0] for b in boxes)) - 20,
        'right': round(max(it['w'] for ser in series for it in ser['stacks'])) + 20,
        'top': round(max(b[3] for b in boxes)) + 20,
        'bottom': round(min(b[1] for b in boxes)) - 20,
        'series': series,
    }, proofs


def proof_sheet(proofs):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.patches import PathPatch
    from matplotlib.path import Path as MPath

    def mpl(path):
        verts, codes = [], []
        for verb, pts in path.segments:
            if verb == 'moveTo':
                verts.append(pts[0]); codes.append(MPath.MOVETO)
            elif verb == 'lineTo':
                verts.append(pts[0]); codes.append(MPath.LINETO)
            elif verb == 'qCurveTo':
                for i in range(0, len(pts) - 1):
                    on = pts[-1] if i == len(pts) - 2 else ((pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2)
                    verts += [pts[i], on]; codes += [MPath.CURVE3, MPath.CURVE3]
            elif verb == 'curveTo':
                verts += list(pts); codes += [MPath.CURVE4] * 3
            elif verb == 'closePath':
                verts.append((0, 0)); codes.append(MPath.CLOSEPOLY)
        return MPath(verts, codes) if verts else None

    cols = 11
    rows_ = (len(proofs) + cols - 1) // cols
    fig, axes = plt.subplots(rows_, cols, figsize=(cols * 1.6, rows_ * 2.1))
    for ax in axes.flat:
        ax.axis('off')
    for ax, (wy, red, ink, adv) in zip(axes.flat, proofs):
        for path, colour in ((ink, '#111'), (red, '#d4142a')):
            m = mpl(path)
            if m:
                ax.add_patch(PathPatch(m, facecolor=colour, edgecolor='none'))
        ax.set_xlim(-60, adv + 40)
        ax.set_ylim(-280, 840)
        ax.set_aspect('equal')
        ax.set_title(wy, fontsize=8)
    plt.tight_layout()
    plt.savefig(PROOF, dpi=70)


# ----------------------------------------------------------------- audio

def speech(video):
    """[(start, end)] of every stretch of speech, from ffmpeg's silencedetect."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', video, '-map', '0:a:0', '-af',
                        'silencedetect=noise=-35dB:d=0.25', '-f', 'null', '-'],
                       capture_output=True, text=True, encoding='utf-8', errors='replace')
    ev = re.findall(r'silence_(start|end): ([0-9.]+)', r.stderr)
    silences, start = [], None
    for kind, t in ev:
        if kind == 'start':
            start = float(t)
        else:
            silences.append((start, float(t)))
    out = []
    for (_, a), (b, _) in zip(silences, silences[1:]):
        if out and a - out[-1][1] < 0.5:      # a breath inside one stack
            out[-1][1] = b
        else:
            out.append([a, b])
    return out


def cut_audio(video):
    segs = speech(video)
    names = [wy for _, _, stacks in SERIES for wy in stacks]
    if len(segs) != len(names):
        sys.exit(f'found {len(segs)} stretches of speech for {len(names)} stacks: check the video')
    os.makedirs(OUT_AUDIO, exist_ok=True)
    for (a, b), wy in zip(segs, names):
        a, b = max(0, a - 0.06), b + 0.12
        d = b - a
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a:.3f}', '-t', f'{d:.3f}', '-i', video,
                        '-map', '0:a:0', '-ac', '1', '-ar', '44100',
                        '-af', f'afade=t=in:d=0.02,afade=t=out:st={d - 0.05:.3f}:d=0.05',
                        '-codec:a', 'libmp3lame', '-b:a', '64k', os.path.join(OUT_AUDIO, f'{wy}.mp3')], check=True)
        print(f'  {wy:5s} {a:7.2f}-{b:7.2f}s')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--video', help="Sonam Tsering's 'The Superscript Letters' video")
    args = ap.parse_args()
    if args.video:
        print('audio:')
        cut_audio(args.video)
    print('glyphs:')
    data, proofs = build_glyphs()
    with open(OUT_JSON, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write('\n')
    proof_sheet(proofs)
    print(f'-> {os.path.relpath(OUT_JSON, ROOT)}; proof sheet {PROOF}')


if __name__ == '__main__':
    main()
