(() => {
  const navToggle = document.querySelector('#navToggle');
  const nav = document.querySelector('#navLinks');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open'); navToggle.setAttribute('aria-expanded','false');
    }));
  }
  const videos = [...document.querySelectorAll('.robot-video')];
  const speedButtons = [...document.querySelectorAll('[data-speed]')];
  let rate = 2;
  function setRate(value) {
    const n = Number(value); if (!Number.isFinite(n) || n <= 0) return;
    rate = n;
    videos.forEach(v => { v.defaultPlaybackRate = n; v.playbackRate = n; });
    speedButtons.forEach(b => { const active = Number(b.dataset.speed) === n; b.classList.toggle('active', active); b.setAttribute('aria-pressed', String(active)); });
  }
  videos.forEach(v => { v.addEventListener('loadedmetadata', () => { v.defaultPlaybackRate = rate; v.playbackRate = rate; }); v.addEventListener('play', () => { if (v.playbackRate !== rate) v.playbackRate = rate; }); });
  speedButtons.forEach(b => b.addEventListener('click', () => setRate(b.dataset.speed)));
  setRate(rate);
  document.querySelectorAll('[data-play-row]').forEach(btn => btn.addEventListener('click', () => { const row = btn.closest('.video-task-row'); row.querySelectorAll('video').forEach(v => { v.currentTime = 0; v.play().catch(() => {}); }); document.querySelector('#videoStatus').textContent = 'Playing all three rollouts in this row.'; }));
  document.querySelectorAll('[data-pause-row]').forEach(btn => btn.addEventListener('click', () => { const row = btn.closest('.video-task-row'); row.querySelectorAll('video').forEach(v => v.pause()); document.querySelector('#videoStatus').textContent = 'Paused the selected rollout row.'; }));
  const dialog = document.querySelector('#figureDialog'); const expanded = document.querySelector('#expandedFigure'); const title = document.querySelector('#figureTitle'); const caption = document.querySelector('#figureCaption');
  document.querySelectorAll('[data-lightbox]').forEach(link => link.addEventListener('click', e => { e.preventDefault(); const img = link.querySelector('img'); expanded.src = link.href; expanded.alt = img.alt; title.textContent = img.alt; caption.textContent = link.closest('figure').querySelector('figcaption')?.textContent || ''; dialog.showModal(); }));
  document.querySelector('#closeFigure')?.addEventListener('click', () => dialog.close()); dialog?.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
})();
