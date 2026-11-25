/**
 * Collection page (PLP) behaviour:
 *  - <bb-read-more>: 2-line description clamp with Read more / Show less.
 *  - <bb-load-more>: appends the next page via the Section Rendering API (falls back to the ?page=n link).
 *  - Mobile sort sheet: opens/closes the <dialog> from the bottom bar (event delegation, survives re-renders).
 */

class BbReadMore extends HTMLElement {
  connectedCallback() {
    this.text = this.querySelector('[data-bb-clamp]');
    this.button = this.querySelector('button[aria-expanded]');
    if (!this.text || !this.button) return;

    // Only offer the button when the text is actually clamped.
    requestAnimationFrame(() => {
      if (this.text.scrollHeight > this.text.clientHeight + 2) this.button.hidden = false;
    });

    this.button.addEventListener('click', () => {
      const expanded = this.button.getAttribute('aria-expanded') === 'true';
      this.button.setAttribute('aria-expanded', String(!expanded));
      this.classList.toggle('is-expanded', !expanded);
      this.button.textContent = expanded ? this.button.dataset.labelMore : this.button.dataset.labelLess;
    });
  }
}

class BbLoadMore extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.#onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.#onClick);
  }

  /** @param {MouseEvent} event */
  #onClick = async (event) => {
    const link = /** @type {HTMLAnchorElement|null} */ (/** @type {HTMLElement} */ (event.target).closest('[data-bb-next]'));
    if (!link || this.loading) return;
    event.preventDefault();

    const grid = document.querySelector('#ResultsList .product-grid');
    const sectionId = this.dataset.sectionId;
    if (!grid || !sectionId) {
      window.location.href = link.href;
      return;
    }

    this.loading = true;
    link.setAttribute('aria-busy', 'true');

    try {
      const pageUrl = new URL(link.href, window.location.href);
      const fetchUrl = new URL(pageUrl);
      fetchUrl.searchParams.set('section_id', sectionId);

      const response = await fetch(fetchUrl.toString());
      if (!response.ok) throw new Error(String(response.status));
      const doc = new DOMParser().parseFromString(await response.text(), 'text/html');

      const newItems = [...doc.querySelectorAll('.product-grid > .product-grid__item')];
      const existing = new Set([...grid.querySelectorAll(':scope > .product-grid__item')].map((li) => li.id));
      const added = [];
      for (const item of newItems) {
        if (item.id && existing.has(item.id)) continue;
        grid.append(item);
        added.push(item);
      }

      const nextBlock = doc.querySelector('bb-load-more');
      const shown = Number(this.dataset.shown || 0) + added.length;
      const total = Number(nextBlock?.getAttribute('data-total') || this.dataset.total || 0);
      this.#updateStatus(shown, total);

      const nextLink = nextBlock?.querySelector('[data-bb-next]');
      if (nextLink) {
        link.href = /** @type {HTMLAnchorElement} */ (nextLink).href;
        link.removeAttribute('aria-busy');
      } else {
        link.remove();
      }

      const page = pageUrl.searchParams.get('page');
      if (page) {
        const current = new URL(window.location.href);
        current.searchParams.set('page', page);
        history.replaceState(history.state, '', current.toString());
      }

      const focusTarget = /** @type {HTMLElement|null} */ (added[0]?.querySelector('a[href]'));
      focusTarget?.focus({ preventScroll: false });
    } catch {
      window.location.href = link.href;
    } finally {
      this.loading = false;
    }
  };

  /** @param {number} shown @param {number} total */
  #updateStatus(shown, total) {
    this.dataset.shown = String(shown);
    const status = this.querySelector('[data-bb-status]');
    const bar = /** @type {HTMLElement|null} */ (this.querySelector('[data-bb-bar]'));
    const template = this.dataset.template || '';
    if (status) status.textContent = template.replace('[shown]', String(shown)).replace('[total]', String(total));
    if (bar && total > 0) bar.style.width = `${Math.min(100, Math.round((shown / total) * 100))}%`;
  }
}

if (!customElements.get('bb-read-more')) customElements.define('bb-read-more', BbReadMore);
if (!customElements.get('bb-load-more')) customElements.define('bb-load-more', BbLoadMore);

if (!window.__bbSortSheet) {
  window.__bbSortSheet = true;
  document.addEventListener('click', (event) => {
    const target = /** @type {HTMLElement} */ (event.target);

    const opener = target.closest('[data-bb-sort-open]');
    if (opener) {
      const dialog = document.getElementById(opener.getAttribute('aria-controls') || '');
      if (dialog instanceof HTMLDialogElement) {
        dialog.showModal();
        opener.setAttribute('aria-expanded', 'true');
      }
      return;
    }

    const dialog = target.closest('.bb-sort-sheet');
    if (target.closest('[data-bb-sort-close]') || (target instanceof HTMLDialogElement && target.classList.contains('bb-sort-sheet'))) {
      /** @type {HTMLDialogElement} */ (dialog || target).close();
      document.querySelector('[data-bb-sort-open][aria-expanded="true"]')?.setAttribute('aria-expanded', 'false');
    }
  });
}
