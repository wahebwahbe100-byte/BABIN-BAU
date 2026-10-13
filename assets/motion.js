/* BABIN BAU: progressive Scroll-Reveals on all pages; no external library needed. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches || !('IntersectionObserver' in window)) return;

  const elements = new Set();
  const add = (selector, options = {}) => {
    const nodes = Array.from(document.querySelectorAll(selector));
    nodes.forEach((node, index) => {
      if (node.closest('dialog, [hidden], .hero-carousel') || elements.has(node)) return;
      node.classList.add('scroll-reveal');
      let direction = options.direction;
      if (typeof direction === 'function') direction = direction(node, index);
      if (direction === 'left' || direction === 'right') node.classList.add('reveal-' + direction);
      const step = options.step || 0;
      // Keep long lists snappy; restart stagger for each row of cards.
      let position = index;
      if (options.columns) position = index % options.columns;
      if (step) node.style.setProperty('--reveal-delay', `${Math.min(position * step, 420)}ms`);
      elements.add(node);
    });
  };

  // Homepage: gentle, progressively revealed sections and image cards.
  add('.promise-grid > .promise', {step: 110});
  add('.section-head');
  add('.services-grid > .service-card', {step: 95, columns: 3});
  add('.homepage-photo-gallery .projects-grid > .project-card', {step: 75, columns: 4});
  add('.why-grid > .why-item', {step: 100, columns: 4});
  add('.process-copy', {direction: 'left'});
  add('.steps > li', {direction: 'right', step: 135});
  add('.faq-copy', {direction: 'left'});
  add('.faq-list > details', {direction: 'right', step: 100});

  // Inner service pages: opposing photo/copy motion in a clean two-column layout.
  add('.service-row > .service-row-photo', {
    direction: node => Array.from(node.parentElement.parentElement.children).indexOf(node.parentElement) % 2 ? 'right' : 'left'
  });
  add('.service-row > .service-row-copy', {
    direction: node => Array.from(node.parentElement.parentElement.children).indexOf(node.parentElement) % 2 ? 'left' : 'right'
  });
  add('.detail-content > .detail-main', {direction: 'left'});
  add('.detail-content > .detail-sidebar', {direction: 'right'});
  add('.about-story > *', {direction: node => node.matches('.story-image') ? 'right' : 'left'});
  add('.values-grid > *', {step: 110, columns: 3});
  add('.contact-layout > .contact-aside', {direction: 'left'});
  add('.contact-layout > .form-wrap', {direction: 'right'});
  add('.projects-page .filter-row');
  add('.projects-page .projects-grid > .project-card', {step: 75, columns: 4});
  add('.image-note');
  add('.cta-inner');
  add('.footer-grid > *', {step: 80, columns: 4});

  const root = document.documentElement;
  if (elements.size === 0) return;
  // Hidden states are activated only when JS + IntersectionObserver are available.
  root.classList.add('babin-motion-ready');
  const observer = new IntersectionObserver(records => {
    for (const record of records) {
      if (!record.isIntersecting) continue;
      record.target.classList.add('is-revealed');
      observer.unobserve(record.target);
    }
  }, {threshold: 0.06, rootMargin: '0px 0px -3% 0px'});

  // Avoid hiding content when a page is loaded at a saved scroll position.
  window.requestAnimationFrame(() => {
    for (const node of elements) {
      const bounds = node.getBoundingClientRect();
      if (bounds.bottom < 0) node.classList.add('is-revealed');
      else observer.observe(node);
    }
  });
  reducedMotion.addEventListener?.('change', event => {
    if (event.matches) {
      root.classList.remove('babin-motion-ready');
      observer.disconnect();
      elements.forEach(node => node.classList.add('is-revealed'));
    }
  });
})();
