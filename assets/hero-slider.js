(() => {
  'use strict';
  const root = document.querySelector('[data-hero-carousel]');
  if (!root) return;
  const slides = [...root.querySelectorAll('.hero-slide')];
  const dots = [...root.querySelectorAll('[data-slide-to]')];
  if (slides.length < 2) return;
  // The slide timer and progress line share the same 4-second cycle.
  const interval = Number(root.dataset.interval) || 4000;
  const toggle = root.querySelector('.hero-toggle');
  const currentLabel = root.querySelector('[data-slide-current]');
  const announcement = root.querySelector('.hero-announcement');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let active = 0;
  let timer = null;
  let progress = null;
  let paused = motion.matches;
  let keyboardFocused = false;
  let visible = true;
  let touching = false;
  let startPoint = null;

  function clearTimer() {
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    if (progress !== null) progress.cancel();
    progress = null;
  }

  function schedule() {
    clearTimer();
    if (paused || keyboardFocused || touching || !visible || document.hidden) return;
    const line = dots[active].querySelector('span');
    if (line && typeof line.animate === 'function' && !motion.matches) {
      progress = line.animate([
        { transform: 'scaleX(0)' },
        { transform: 'scaleX(1)' }
      ], { duration: interval, easing: 'linear', fill: 'forwards' });
    }
    timer = window.setTimeout(() => show(active + 1), interval);
  }

  function show(index, manual = false) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, position) => {
      const selected = position === active;
      slide.classList.toggle('is-active', selected);
      slide.setAttribute('aria-hidden', String(!selected));
      slide.inert = !selected;
      slide.querySelectorAll('a, button').forEach(element => {
        if (selected) element.removeAttribute('tabindex');
        else element.setAttribute('tabindex', '-1');
      });
    });
    dots.forEach((dot, position) => dot.setAttribute('aria-pressed', String(position === active)));
    currentLabel.textContent = String(active + 1).padStart(2, '0');
    if (manual) announcement.textContent = slides[active].getAttribute('aria-label');
    schedule();
  }

  function updatePauseButton() {
    const label = paused ? 'Automatischen Wechsel starten' : 'Automatischen Wechsel pausieren';
    toggle.setAttribute('aria-label', label);
    toggle.setAttribute('title', label);
    toggle.setAttribute('aria-pressed', String(paused));
  }

  root.querySelector('.hero-controls').hidden = false;
  root.querySelector('.hero-prev').addEventListener('click', () => show(active - 1, true));
  root.querySelector('.hero-next').addEventListener('click', () => show(active + 1, true));
  dots.forEach((dot, index) => dot.addEventListener('click', () => show(index, true)));
  toggle.addEventListener('click', () => {
    paused = !paused;
    // Resuming the slideshow must work even if the pause button keeps focus.
    if (!paused) keyboardFocused = false;
    updatePauseButton();
    schedule();
  });
  // Hovering over the hero or clicking its arrows must not silently stop autoplay.
  // Keyboard users can focus interactive controls without slides changing beneath them.
  root.addEventListener('keydown', event => {
    if (event.key === 'Tab') {
      keyboardFocused = true;
      clearTimer();
    }
    if (!event.target.closest('.hero-controls')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(active + (event.key === 'ArrowRight' ? 1 : -1), true);
    }
  });

  root.addEventListener('focusout', () => {
    window.setTimeout(() => {
      if (!root.contains(document.activeElement)) {
        keyboardFocused = false;
        schedule();
      }
    }, 0);
  });

  root.addEventListener('touchstart', event => {
    if (event.touches.length !== 1 || event.target.closest('a, button')) return;
    startPoint = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    touching = true;
    clearTimer();
  }, { passive: true });
  root.addEventListener('touchend', event => {
    touching = false;
    if (!startPoint || !event.changedTouches.length) { schedule(); return; }
    const dx = event.changedTouches[0].clientX - startPoint.x;
    const dy = event.changedTouches[0].clientY - startPoint.y;
    startPoint = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.4) show(active + (dx < 0 ? 1 : -1), true);
    else schedule();
  }, { passive: true });
  root.addEventListener('touchcancel', () => { touching = false; startPoint = null; schedule(); }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', event => {
    paused = event.matches;
    updatePauseButton();
    schedule();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      schedule();
    }, { threshold: 0.15 }).observe(root);
  }
  updatePauseButton();
  show(0);
})();
