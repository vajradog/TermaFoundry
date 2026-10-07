/*
  stack.js — draws a syllable glyph by glyph, so one component of a stack can be painted red.

  Text is shaped with HarfBuzz (harfbuzzjs, WebAssembly) in Yangtso and drawn from the font's own
  outlines as SVG. A stack is a single shaped cluster, and Yangtso draws most stacks as one
  outline (ཀྲ is a single glyph), so a component cannot be picked out by glyph. Instead every
  drawing compares two shapings: `text`, what is on screen, and `base`, the same without the
  component being taught. Whatever `text` has and `base` lacks is the component; an SVG mask
  paints exactly that difference red, on the real designed stack.

    const r = await createStack(host, { fontUrl });
    r.frame('བཀྲ');                                   width for the whole syllable
    r.draw({ text: 'བཀ', base: 'བ', from: 'above' });  ka arrives, red, onto ba
    r.draw({ text: 'བཀྲ', base: '', pulse: true });    the whole syllable flashes
    r.draw({ text: 'བཀྲ', base: 'བཀྲ' });              plain ink

  Everything is in font units (1000 per em); the frame keeps one scale, so stacks grow downward
  the way they are written instead of shrinking to fit.
*/

const TOP = 1160; // above the highest vowel on a superscript stack (སྐྱོ reaches 1122)
const BOTTOM = -820; // below the deep stacks (བསྒྲུབས reaches -618; the rare ཕྱྭུ, -856, may brush the label)
const SIDE = 140;
const MIN_WIDTH = 1100;
const DILATE = 26; // how far a "base" outline is grown before it is cut out, so its anti-aliased rim is not painted red

let shaperP = null;
function loadShaper(fontUrl) {
  shaperP ||= (async () => {
    const [hb, bytes] = await Promise.all([
      import('harfbuzzjs'),
      fetch(fontUrl).then((r) => {
        if (!r.ok) throw new Error(`font ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);
    const face = new hb.Face(new hb.Blob(bytes));
    return { hb, font: new hb.Font(face), paths: new Map(), shapes: new Map() };
  })();
  return shaperP;
}

/* text -> { glyphs: [{ d, x, y }], width, box } in font units, y up */
function shape(S, text) {
  if (S.shapes.has(text)) return S.shapes.get(text);
  const out = { glyphs: [], width: 0, box: null };
  if (text) {
    const buf = new S.hb.Buffer();
    buf.addText(text);
    buf.guessSegmentProperties();
    buf.setFlags(S.hb.BufferFlag.DO_NOT_INSERT_DOTTED_CIRCLE);
    S.hb.shape(S.font, buf);
    const pos = buf.getGlyphPositions();
    let x = 0;
    buf.getGlyphInfos().forEach((g, i) => {
      const p = pos[i];
      if (!S.paths.has(g.codepoint)) S.paths.set(g.codepoint, S.font.glyphToPath(g.codepoint));
      const d = S.paths.get(g.codepoint);
      const gx = x + p.xOffset;
      const gy = p.yOffset;
      if (d) out.glyphs.push({ d, x: gx, y: gy });
      const e = S.font.glyphExtents(g.codepoint);
      if (e && e.width) {
        const b = { x0: gx + e.xBearing, x1: gx + e.xBearing + e.width, y1: gy + e.yBearing, y0: gy + e.yBearing + e.height };
        out.box = out.box ? { x0: Math.min(out.box.x0, b.x0), x1: Math.max(out.box.x1, b.x1), y0: Math.min(out.box.y0, b.y0), y1: Math.max(out.box.y1, b.y1) } : b;
      }
      x += p.xAdvance;
    });
    out.width = x;
  }
  if (S.shapes.size > 400) S.shapes.clear();
  S.shapes.set(text, out);
  return out;
}

const glyphsSvg = (s, attrs = '') => s.glyphs.map((g) => `<path${attrs} transform="translate(${g.x} ${g.y})" d="${g.d}"/>`).join('');

let uid = 0;

export async function createStack(host, { fontUrl }) {
  const S = await loadShaper(fontUrl);
  const id = `sp${++uid}`;
  let frameWidth = MIN_WIDTH;
  let settleTimer = 0;

  host.innerHTML = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'sp-svg');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  host.appendChild(svg);

  function frame(text) {
    const s = shape(S, text);
    frameWidth = Math.max(MIN_WIDTH, s.width + 2 * SIDE);
  }

  /*
    text   what is on screen
    base   the part of it that is not being taught (drawn in ink); the rest is red.
           base === text: all ink. base === '': all red.
    from   where the red part comes from: 'above', 'below', 'side', or null (no motion)
    pulse  the red part swells once instead of arriving (a fused result)
    settle ms after which the red fades back to ink (0: stays red)
  */
  function draw({ text = '', base = text, from = 'above', pulse = false, settle = 0 } = {}) {
    clearTimeout(settleTimer);
    const A = shape(S, text);
    const B = base === text ? A : shape(S, base);
    const w = Math.max(frameWidth, A.width + 2 * SIDE);
    const ox = (w - A.width) / 2; // centre the pen run
    const vb = `0 ${-TOP} ${w} ${TOP - BOTTOM}`;
    svg.setAttribute('viewBox', vb);
    svg.style.setProperty('--sp-aspect', String(w / (TOP - BOTTOM)));

    const flip = `translate(${ox} 0) scale(1 -1)`;
    const allInk = base === text || !A.glyphs.length;
    let body;
    if (allInk) {
      body = `<g class="sp-ink" transform="${flip}">${glyphsSvg(A)}</g>`;
    } else {
      // the mask is drawn in the same flipped space as the glyphs it cuts
      const cut = glyphsSvg(B, ` stroke-width="${DILATE * 2}" stroke-linejoin="round"`);
      const motion = pulse ? 'sp-pulse' : from ? `sp-from-${from}` : '';
      body =
        `<defs>` +
        `<mask id="${id}o" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">` +
        `<g transform="${flip}" fill="#fff" stroke="#fff">${cut}</g></mask>` +
        `<mask id="${id}n" maskUnits="userSpaceOnUse" x="-5000" y="-5000" width="20000" height="20000">` +
        `<rect x="-5000" y="-5000" width="20000" height="20000" fill="#fff"/>` +
        `<g transform="${flip}" fill="#000" stroke="#000">${cut}</g></mask>` +
        `</defs>` +
        `<g class="sp-ink" mask="url(#${id}o)"><g transform="${flip}">${glyphsSvg(A)}</g></g>` +
        `<g class="sp-new ${motion}"><g class="sp-red" mask="url(#${id}n)"><g transform="${flip}">${glyphsSvg(A)}</g></g></g>`;
    }
    svg.innerHTML = body;
    if (settle > 0 && !allInk) {
      settleTimer = setTimeout(() => {
        const ink = svg.querySelector('.sp-ink');
        if (ink) ink.removeAttribute('mask'); // the whole stack in ink beneath...
        svg.querySelector('.sp-new')?.classList.add('is-settled'); // ...as the red fades away
      }, settle);
    }
  }

  function clear() {
    clearTimeout(settleTimer);
    svg.innerHTML = '';
  }

  return { frame, draw, clear, width: (text) => shape(S, text).width };
}
