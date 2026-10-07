/*
  learn.js — "Write the letters" under the hero (typing.astro, `data-learn`): the stroke-order video of
  the thirty consonants (rendered in the skeleton repo, work/research/learn_video.py). The letter
  buttons jump to a letter; the card's head names the letter being written; play, pause, before, next.
*/
export function bootLearn() {
  const root = document.querySelector('[data-learn]');
  if (!root) return;
  const video = root.querySelector('[data-learn-video]');
  const buttons = [...root.querySelectorAll('[data-learn-at]')];
  if (!video || !buttons.length) return;
  const starts = buttons.map((b) => parseFloat(b.dataset.learnAt));
  const nowBo = root.querySelector('[data-learn-now-bo]');
  const nowWy = root.querySelector('[data-learn-now-wy]');
  const count = root.querySelector('[data-learn-count]');
  const play = root.querySelector('[data-learn-play]');
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = -1;
  const indexAt = (t) => {
    let k = 0;
    for (let i = 0; i < starts.length; i++) if (t + 0.05 >= starts[i]) k = i;
    return k;
  };
  const mark = (k) => {
    if (k === current) return;
    current = k;
    buttons.forEach((b, i) => b.setAttribute('aria-current', i === k ? 'true' : 'false'));
    if (nowBo) nowBo.textContent = buttons[k].textContent.trim();
    if (nowWy) nowWy.textContent = buttons[k].getAttribute('aria-label');
    if (count) count.textContent = `${k + 1} / ${buttons.length}`;
  };
  const go = (k) => {
    k = (k + buttons.length) % buttons.length;
    video.currentTime = starts[k] + 0.05;
    mark(k);
    if (video.paused && !still) video.play().catch(() => {});
    setPlaying(!video.paused);
  };
  const setPlaying = (on) => {
    if (!play) return;
    play.querySelector('[data-ico-pause]').hidden = !on;
    play.querySelector('[data-ico-play]').hidden = on;
    play.querySelector('[data-learn-play-label]').textContent = on ? 'Pause' : 'Play';
  };

  video.addEventListener('timeupdate', () => mark(indexAt(video.currentTime)));
  video.addEventListener('play', () => setPlaying(true));
  video.addEventListener('pause', () => setPlaying(false));
  buttons.forEach((b, i) => b.addEventListener('click', () => go(i)));
  root.querySelector('[data-learn-prev]')?.addEventListener('click', () => go(current - 1));
  root.querySelector('[data-learn-next]')?.addEventListener('click', () => go(current + 1));
  play?.addEventListener('click', () => (video.paused ? video.play().catch(() => {}) : video.pause()));

  if (still) {
    video.removeAttribute('autoplay');
    video.pause();
  }
  setPlaying(!video.paused && !still);
  mark(0);
}
