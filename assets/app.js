(() => {
  'use strict';
  const config = window.BABIN_CONFIG || {};
  // Pictures linked directly to BABIN BAU's own public Kleinanzeigen ads.
  // Offline viewing / removed ads / hotlink blocks all recover to bundled local images.
  function setPhotoFallback(img, fallback) {
    if (!img || !fallback) return;
    img.addEventListener('error', () => {
      if (img.getAttribute('src') !== fallback) {
        img.removeAttribute('srcset');
        img.src = fallback;
        img.classList.add('photo-fallback');
      }
    });
  }
  document.querySelectorAll('img[data-remote-src]').forEach(img => {
    setPhotoFallback(img, img.dataset.fallbackSrc);
    img.src = img.dataset.remoteSrc;
  });

  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');
  const closeMenu = () => {
    header?.classList.remove('menu-open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Menü öffnen');
  };
  menuButton?.addEventListener('click', () => {
    const open = header.classList.toggle('menu-open');
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  });
  document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header?.classList.contains('menu-open')) {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!header?.contains(event.target)) closeMenu();
  });
  window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);

  const toTop = document.querySelector('.back-to-top');
  const updateScroll = () => toTop?.classList.toggle('visible', window.scrollY > 650);
  window.addEventListener('scroll', updateScroll, { passive: true });
  updateScroll();

  for (const key of ['email', 'phone', 'address', 'instagram']) {
    if (!config[key]) continue;
    document.querySelectorAll(`[data-contact-${key}]`).forEach(element => {
      element.hidden = false;
      const target = element.querySelector('[data-contact-value]') || element;
      target.textContent = config[key];
      if (target.tagName === 'A') {
        if (key === 'email') target.href = `mailto:${config.email}`;
        if (key === 'phone') target.href = `tel:${config.phone.replace(/[^+\d]/g, '')}`;
        if (key === 'instagram' && /^https:\/\/www\.instagram\.com\//.test(config.instagram)) target.href = config.instagram;
      }
    });
  }
  if (config.email || config.phone) document.querySelectorAll('[data-contact-placeholder]').forEach(element => element.hidden = true);

  const filters = document.querySelectorAll('[data-filter]');
  const cards = document.querySelectorAll('[data-project]');
  const galleryStatus = document.querySelector('.gallery-status');
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter;
      if (!card.hidden) count++;
    });
    if (galleryStatus) galleryStatus.textContent = `${count} ${count === 1 ? 'Bild' : 'Bilder'} aus unseren Anzeigen`;
  }));

  const dialog = document.querySelector('.gallery-dialog');
  if (dialog) {
    let opener;
    const closeDialog = () => dialog.close();
    cards.forEach(card => card.addEventListener('click', () => {
      opener = card;
      const image = dialog.querySelector('.dialog-image');
      image.src = card.querySelector('.project-image img')?.currentSrc || card.dataset.image;
      image.alt = card.dataset.title;
      image.onerror = () => { image.onerror = null; image.src = card.dataset.imageFallback || 'assets/hero.webp'; };
      dialog.querySelector('#dialog-title').textContent = card.dataset.title;
      dialog.querySelector('.dialog-description').textContent = card.dataset.description;
      dialog.querySelector('.dialog-inquiry').href = `kontakt.html?leistung=${encodeURIComponent(card.dataset.service)}`;
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
        document.body.classList.add('modal-open');
      } else {
        window.location.href = `${card.dataset.service}.html`;
      }
    }));
    dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
    dialog.addEventListener('click', event => {
      const rect = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) closeDialog();
    });
    dialog.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      opener?.focus();
    });
  }

  const form = document.querySelector('#inquiry-form');
  if (!form) return;
  const result = document.querySelector('#inquiry-result');
  const summary = document.querySelector('#inquiry-summary');
  const status = document.querySelector('#inquiry-status');
  const requestedService = new URLSearchParams(window.location.search).get('leistung');
  if (requestedService) {
    form.querySelectorAll('input[name="leistung"]').forEach(input => input.checked = input.value === requestedService);
  }
  const labels = {
    malerarbeiten: 'Malerarbeiten', trockenbau: 'Trockenbau', fliesenarbeiten: 'Fliesenarbeiten',
    bodenverlegung: 'Bodenverlegung', komplettsanierung: 'Komplettsanierung'
  };
  if (config.email) {
    document.querySelector('[data-inquiry-explainer]').textContent = 'Beschreiben Sie Ihr Vorhaben. Anschließend prüfen Sie Ihre Anfrage und öffnen sie in Ihrem E-Mail-Programm.';
    document.querySelector('[data-no-email-note]').hidden = true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const selected = values.getAll('leistung').map(value => labels[value] || value);
    const text = [
      'Projektanfrage an BABIN BAU', '',
      `Name: ${String(values.get('name')).trim()}`,
      `E-Mail: ${String(values.get('email')).trim()}`,
      `Telefon: ${String(values.get('phone') || '').trim() || 'Nicht angegeben'}`,
      `Ort: ${String(values.get('ort') || '').trim() || 'Noch offen'}`,
      `Objekt: ${values.get('objekt') || 'Noch offen'}`,
      `Gewünschter Zeitraum: ${values.get('zeitraum') || 'Nach Absprache'}`,
      `Leistungen: ${selected.length ? selected.join(', ') : 'Beratung gewünscht'}`,
      '', 'Mein Vorhaben:', String(values.get('message')).trim()
    ].join('\n');
    summary.value = text;
    result.hidden = false;
    status.textContent = '';
    const emailLink = document.querySelector('#email-inquiry');
    if (config.email) {
      emailLink.href = `mailto:${config.email}?subject=${encodeURIComponent('Projektanfrage – BABIN BAU')}&body=${encodeURIComponent(text)}`;
      emailLink.hidden = false;
    }
    result.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    document.querySelector('#result-heading').focus({ preventScroll: true });
  });
  document.querySelector('#copy-inquiry').addEventListener('click', async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(summary.value);
      status.textContent = 'Die Anfrage wurde kopiert. Sie können sie jetzt als Nachricht einfügen.';
    } catch {
      summary.focus();
      summary.select();
      status.textContent = 'Bitte kopieren Sie den markierten Text mit Strg+C oder über das Auswahlmenü.';
    }
  });
  document.querySelector('#download-inquiry').addEventListener('click', () => {
    const blob = new Blob(['\uFEFF' + summary.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BABIN-BAU-Projektanfrage.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Der Download wurde gestartet. Die Anfrage wurde noch nicht versendet.';
  });
  form.addEventListener('input', () => {
    if (!result.hidden) {
      result.hidden = true;
      summary.value = '';
    }
  });
})();
