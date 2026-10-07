/*
  player.js — plays a spell() result: each step draws its part of the stack, speaks its units and
  holds for the scheme's pace (longer if the audio is longer). It knows nothing about the page:
  `onStep(step, i)` and `onDone(finished)` let the caller light up its own labels.

    const player = createPlayer({ scheme, voice, getStack: () => stack, onStep, onDone });
    player.play(spell(parse('ཀི'), scheme));   // ka ... gi-gu ... ki
    player.stop();
*/

/* Where a component arrives from: subscripts and zhabs-kyu rise, prefixes and suffixes slide in. */
export function arrival(step, chars) {
  if (step.kind === 'result') return null;
  if (step.role === 'sub') return 'below';
  if (step.role === 'vowel') return chars[step.highlight[0]] === 'ུ' ? 'below' : 'above';
  if (step.role === 'prefix' || step.role === 'suffix' || step.role === 'suffix2') return 'side';
  return 'above';
}

export function createPlayer({ scheme, voice, getStack, onStep, onDone }) {
  let token = 0;
  let playing = false;
  const wait = (ms, t) => new Promise((resolve) => setTimeout(() => resolve(t === token), ms));

  async function play(result) {
    if (!result || !result.ok) return;
    const t = ++token;
    voice.stop();
    playing = true;
    const chars = [...result.text];
    await voice.ready([...new Set(result.steps.flatMap((s) => s.say))]);
    if (t !== token) return;
    getStack()?.frame(result.text);

    for (let i = 0; i < result.steps.length; i++) {
      const step = result.steps[i];
      const shown = chars.slice(0, step.show);
      const lit = new Set(step.highlight);
      // each unit gets the scheme's pace, or its own length and a breath if that is longer
      const plan = step.say.map((id) => Math.max(scheme.pace_ms, voice.duration(id) * 1000 + 180));
      const total = plan.reduce((a, b) => a + b, 0);
      const hold = step.final ? Math.max(scheme.final_ms, total) : total;
      getStack()?.draw({
        text: shown.join(''),
        base: shown.filter((_, k) => !lit.has(k)).join(''),
        from: arrival(step, chars),
        pulse: step.kind === 'result',
        settle: step.final ? Math.max(600, hold - 450) : 0,
      });
      onStep?.(step, i);
      for (let j = 0; j < step.say.length; j++) {
        voice.play(step.say[j]);
        if (!(await wait(j === step.say.length - 1 ? hold - (total - plan[j]) : plan[j], t))) return;
      }
    }
    playing = false;
    onDone?.(true);
  }

  function stop() {
    if (!playing) return;
    token++;
    playing = false;
    voice.stop();
    onDone?.(false);
  }

  return { play, stop, isPlaying: () => playing };
}
