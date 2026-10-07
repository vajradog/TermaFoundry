/*
  voice.js — plays recorded spelling units: public/spell/audio/<unit id>.wav. The page lists the
  recordings that exist when it is built (`have`), so a unit nobody has recorded yet is silence,
  not a failed request; the spelling plays on regardless.
*/
export function createVoice(base, have = []) {
  const known = new Set(have);
  const buffers = new Map(); // id -> Promise<AudioBuffer|null>
  const live = new Set();
  let ctx = null;

  function context() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function load(id) {
    if (!buffers.has(id)) {
      const p = fetch(`${base}${encodeURIComponent(id)}.wav`)
        .then((r) => (r.ok ? r.arrayBuffer() : null))
        .then((bytes) => (bytes ? new Promise((ok) => context().decodeAudioData(bytes, ok, () => ok(null))) : null))
        .catch(() => null);
      p.then((b) => (p.buffer = b));
      buffers.set(id, p);
    }
    return buffers.get(id);
  }

  return {
    /* From a click or key press: load what `ids` need, waiting at most `ms`. */
    async ready(ids, ms = 450) {
      if (!context()) return;
      const wanted = ids.filter((id) => known.has(id)).map(load);
      await Promise.race([Promise.all(wanted), new Promise((r) => setTimeout(r, ms))]);
    },
    /* Seconds of audio the unit has (0: silent). */
    duration: (id) => buffers.get(id)?.buffer?.duration || 0,
    play(id) {
      const buffer = buffers.get(id)?.buffer;
      if (!buffer || !ctx) return 0;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.connect(ctx.destination);
      src.onended = () => live.delete(src);
      live.add(src);
      src.start();
      return buffer.duration;
    },
    stop() {
      for (const s of live) s.stop();
      live.clear();
    },
    count: () => known.size,
  };
}
