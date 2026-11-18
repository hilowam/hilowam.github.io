'use strict';

(() => {
  const graphic = document.querySelector('.insight-graphic');
  if (!graphic) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const edge = graphic.querySelector('#insight-wave-edge');
  const strokes = graphic.querySelector('#insight-wave-strokes');
  const label = graphic.querySelector('.insight-split-label');
  const width = 1187;
  const split = 515;
  const entry = -46;
  const callouts = [
    { element: graphic.querySelector('.mini-world'), from: 65, to: 175 },
    { element: graphic.querySelector('.mini-state'), from: 610, to: 730 },
    { element: graphic.querySelector('.mini-local'), from: 890, to: 1020 }
  ];
  const sequence = [
    { duration: 2.0, from: entry, to: split },
    { duration: .28, from: split, to: split },
    { duration: 2.25, from: split, to: width },
    { duration: 3.25, from: width, to: width },
    { duration: .38, from: width, to: width, fade: true }
  ];
  const loop = sequence.reduce((total, stage) => total + stage.duration, 0);
  let visible = false;
  let frame;
  let startTime;

  function progressBetween(position, from, to) {
    return Math.min(1, Math.max(0, (position - from) / (to - from)));
  }

  function reveal(position, opacity = 1) {
    edge.setAttribute('gradientTransform', `translate(${position.toFixed(1)})`);
    strokes.setAttribute('opacity', opacity.toFixed(3));
    label.style.opacity = opacity * progressBetween(position, split - 25, split + 30);
    for (const { element, from, to } of callouts) {
      const progress = progressBetween(position, from, to);
      element.style.opacity = (opacity * progress).toFixed(3);
      element.style.setProperty('--insight-offset', `${((1 - progress) * 5).toFixed(2)}px`);
    }
  }

  function draw(seconds) {
    let time = seconds % loop;
    for (const { duration, from, to, fade } of sequence) {
      if (time < duration) {
        const progress = time / duration;
        const eased = progress * progress * (3 - 2 * progress);
        const position = from + (to - from) * eased;
        reveal(position, fade ? 1 - progress : 1);
        return;
      }
      time -= duration;
    }
  }

  function tick(now) {
    startTime ??= now;
    draw((now - startTime) / 1000);
    frame = requestAnimationFrame(tick);
  }

  function playback() {
    cancelAnimationFrame(frame);
    if (visible && !document.hidden && !reducedMotion.matches) {
      startTime = undefined;
      reveal(entry);
      frame = requestAnimationFrame(tick);
    } else if (reducedMotion.matches) {
      reveal(width);
    }
  }

  if (!reducedMotion.matches) reveal(entry);
  document.addEventListener('visibilitychange', playback);
  reducedMotion.addEventListener('change', playback);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    playback();
  }, { threshold: .12 }).observe(graphic);
})();
