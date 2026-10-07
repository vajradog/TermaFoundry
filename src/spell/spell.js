/*
  spell.js — the spelling-out of one syllable, as data. A pure function: the tutor's own parse
  (src/typing/lib/anatomy.js) and a scheme (utsang.json) in, a list of steps out. The renderer
  and the audio only consume these steps.

    spell(parseSyllable('ki'), scheme).steps ->
      { kind: 'name',   role: 'root',   say: ['l.ka'],   highlight: [0],    show: 1, label: 'ka' }
      { kind: 'name',   role: 'vowel',  say: ['v.gigu'], highlight: [1],    show: 2, label: 'gi-gu' }
      { kind: 'result', role: 'result', say: ['syl.ki'], highlight: [0, 1], show: 2, label: 'ki', final: true }

  say        unit IDs to speak, in order (a recording if there is one, else silence)
  highlight  codepoint indices of the Tibetan being named, painted red
  show       how many codepoints are on screen: the stack assembles as it is spelled
  label      what is said, in Latin letters (a result says its Wylie)
  tib        the Tibetan of the unit
*/
import { toUnicode } from '../foundry/lib/ewts.js';

/*
  Every component of a parsed syllable, in writing order, with the codepoint it is in the Tibetan.
  Each part is one codepoint, except the inherent vowel a, which is written with none.
*/
export function components(parsed) {
  const out = [];
  let at = 0;
  parsed.parts.forEach((part, i) => {
    if (part.role === 'vowel' && part.wy === 'a') return;
    out.push({ role: part.role, wy: part.wy, end: part.end, at: at++, part: i });
  });
  return out;
}

export function spell(parsed, scheme) {
  if (!parsed || !parsed.ok) return { ok: false, steps: [] };
  const comps = components(parsed);
  const vowel = parsed.parts.find((p) => p.role === 'vowel');
  const units = scheme.units;
  const steps = [];

  // the fused sound of the syllable up to a component, as Wylie: bkr -> bkra
  const resultAt = (c) => {
    let wy = parsed.wy.slice(0, c.end);
    if (c.end <= vowel.start) wy += 'a';
    return wy;
  };

  let run = 0;
  comps.forEach((c, k) => {
    const rule = scheme.roles[c.role];
    const say = rule.say.map((ref) => (scheme.tables[ref] ? scheme.tables[ref][c.wy] : ref)).filter(Boolean);
    steps.push({
      kind: 'name',
      role: c.role,
      say,
      highlight: [c.at],
      show: c.at + 1,
      label: say.map((id) => units[id]?.say || id).join(' '),
      tib: say.map((id) => units[id]?.tib || '').join(' '),
    });
    run++;
    const next = comps[k + 1];
    if (next && scheme.roles[next.role].group === rule.group) return;
    const res = scheme.results[rule.group];
    if (res && run >= (res.min_parts || 1)) {
      const wy = resultAt(c);
      steps.push({
        kind: 'result',
        role: 'result',
        group: rule.group,
        say: [scheme.result_unit + wy],
        highlight: comps.slice(0, k + 1).map((x) => x.at),
        show: c.at + 1,
        label: wy,
        tib: toUnicode(wy).text,
      });
    }
    run = 0;
  });

  steps[steps.length - 1].final = true;
  return { ok: true, text: parsed.bo, steps };
}

/* Every unit a list of parsed syllables needs, once each, in order. */
export function unitsFor(parsedList, scheme) {
  const out = new Map();
  for (const p of parsedList) {
    for (const s of spell(p, scheme).steps) {
      s.say.forEach((id) => out.has(id) || out.set(id, { id, label: s.kind === 'result' ? s.label : scheme.units[id].say, tib: s.kind === 'result' ? s.tib : scheme.units[id].tib }));
    }
  }
  return [...out.values()];
}
