/**
 * Bunny Friday header behaviour:
 *  - <bb-header-search>: visible desktop search field that hands off to the predictive search modal.
 *  - <bb-mega-nav>: desktop menu row with mega menus (hover, click, Enter/Space, Escape, aria-expanded).
 *  - <bb-drawer>: mobile two-level drill-down drawer (dialog, focus handling, RTL-aware via CSS).
 */

/* ------------------------------------------------------------------ */
/* Visible search field                                                */
/* ------------------------------------------------------------------ */
class BbHeaderSearch extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input[type="search"]');
    if (!this.input) return;
    this.input.addEventListener('input', this.#handOff);
    this.input.addEventListener('click', this.#handOff);
  }

  disconnectedCallback() {
    this.input?.removeEventListener('input', this.#handOff);
    this.input?.removeEventListener('click', this.#handOff);
  }

  #handOff = () => {
    const modal = /** @type {any} */ (document.getElementById('search-modal'));
    if (!modal || typeof modal.showDialog !== 'function') return; // fall back to plain form submit

    const value = this.input.value;
    modal.showDialog();

    requestAnimationFrame(() => {
      const modalInput = /** @type {HTMLInputElement|null} */ (modal.querySelector('input[type="search"]'));
      if (!modalInput) return;
      modalInput.value = value;
      modalInput.focus();
      modalInput.setSelectionRange?.(value.length, value.length);
      if (value) modalInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.input.value = '';
    });
  };
}

/* ------------------------------------------------------------------ */
/* Desktop mega menu                                                   */
/* ------------------------------------------------------------------ */
class BbMegaNav extends HTMLElement {
  /** @type {HTMLElement|null} */
  #openItem = null;
  #openTimer = 0;
  #closeTimer = 0;

  connectedCallback() {
    this.items = [...this.querySelectorAll('[data-bb-nav-item]')];
    for (const item of this.items) {
      const trigger = item.querySelector('[data-bb-nav-trigger]');
      if (!trigger) continue;

      trigger.addEventListener('click', () => (this.#openItem === item ? this.close() : this.open(item)));
      item.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse') return;
        clearTimeout(this.#closeTimer);
        clearTimeout(this.#openTimer);
        this.#openTimer = window.setTimeout(() => this.open(item), this.#openItem ? 0 : 120);
      });
      item.addEventListener('pointerleave', (event) => {
        if (event.pointerType !== 'mouse') return;
        clearTimeout(this.#openTimer);
        this.#closeTimer = window.setTimeout(() => {
          if (this.#openItem === item && !item.contains(document.activeElement)) this.close();
        }, 200);
      });
      item.addEventListener('focusout', (event) => {
        const next = /** @type {Node|null} */ (event.relatedTarget);
        if (this.#openItem === item && next && !item.contains(next)) this.close();
      });
      trigger.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          this.open(item);
          item.querySelector('[data-bb-nav-panel] a')?.focus();
        }
      });
    }

    this.addEventListener('keydown', this.#onKeydown);
    document.addEventListener('click', this.#onDocumentClick);
  }

  disconnectedCallback() {
    this.removeEventListener('keydown', this.#onKeydown);
    document.removeEventListener('click', this.#onDocumentClick);
  }

  /** @param {HTMLElement} item */
  open(item) {
    if (this.#openItem && this.#openItem !== item) this.close();
    const trigger = item.querySelector('[data-bb-nav-trigger]');
    const panel = item.querySelector('[data-bb-nav-panel]');
    if (!trigger || !panel) return;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    item.classList.add('is-open');
    this.#openItem = item;
  }

  close({ focusTrigger = false } = {}) {
    const item = this.#openItem;
    if (!item) return;
    const trigger = /** @type {HTMLElement|null} */ (item.querySelector('[data-bb-nav-trigger]'));
    const panel = item.querySelector('[data-bb-nav-panel]');
    if (panel) panel.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    item.classList.remove('is-open');
    this.#openItem = null;
    if (focusTrigger) trigger?.focus();
  }

  /** @param {KeyboardEvent} event */
  #onKeydown = (event) => {
    if (event.key === 'Escape' && this.#openItem) {
      event.stopPropagation();
      this.close({ focusTrigger: true });
    }
  };

  /** @param {MouseEvent} event */
  #onDocumentClick = (event) => {
    if (this.#openItem && !this.#openItem.contains(/** @type {Node} */ (event.target))) this.close();
  };
}

/* ------------------------------------------------------------------ */
/* Mobile drill-down drawer                                            */
/* ------------------------------------------------------------------ */
class BbDrawer extends HTMLElement {
  connectedCallback() {
    this.dialog = /** @type {HTMLDialogElement|null} */ (this.querySelector('dialog'));
    this.openButton = /** @type {HTMLElement|null} */ (this.querySelector('[data-bb-drawer-open]'));
    this.root = /** @type {HTMLElement|null} */ (this.querySelector('[data-bb-panel="root"]'));
    if (!this.dialog || !this.openButton || !this.root) return;

    // The dialog lives inside the sticky header; move it to <body> so it is never clipped
    // or re-rendered by header morphing.
    document.body.append(this.dialog);

    this.openButton.addEventListener('click', this.open);
    this.dialog.addEventListener('click', this.#onDialogClick);
    this.dialog.addEventListener('close', this.#onClose);
  }

  disconnectedCallback() {
    this.openButton?.removeEventListener('click', this.open);
    this.dialog?.remove();
  }

  open = () => {
    if (!this.dialog || this.dialog.open) return;
    this.dialog.showModal();
    this.dialog.classList.add('is-open');
    this.openButton?.setAttribute('aria-expanded', 'true');
    document.documentElement.classList.add('bb-scroll-lock');
  };

  close = () => {
    if (!this.dialog?.open) return;
    this.dialog.close();
  };

  #onClose = () => {
    this.dialog?.classList.remove('is-open');
    this.openButton?.setAttribute('aria-expanded', 'false');
    document.documentElement.classList.remove('bb-scroll-lock');
    this.#showRoot({ focus: false });
    this.openButton?.focus();
  };

  /** @param {MouseEvent} event */
  #onDialogClick = (event) => {
    const target = /** @type {HTMLElement} */ (event.target);

    // Click on the backdrop (the dialog element itself, outside the viewport box).
    if (target === this.dialog) {
      this.close();
      return;
    }

    if (target.closest('[data-bb-drawer-close]')) {
      this.close();
      return;
    }

    const opener = /** @type {HTMLElement|null} */ (target.closest('[data-bb-panel-open]'));
    if (opener) {
      this.#showPanel(opener);
      return;
    }

    if (target.closest('[data-bb-panel-back]')) {
      this.#showRoot({ focus: true });
    }
  };

  /** @type {HTMLElement|null} */
  #activePanel = null;
  /** @type {HTMLElement|null} */
  #activeOpener = null;

  /** @param {HTMLElement} opener */
  #showPanel(opener) {
    const panel = this.dialog?.querySelector(`#${CSS.escape(opener.dataset.bbPanelOpen || '')}`);
    if (!(panel instanceof HTMLElement) || !this.root) return;

    panel.hidden = false;
    // Force layout so the slide-in transition runs.
    void panel.offsetWidth;
    panel.classList.add('is-active');
    this.root.classList.add('is-behind');
    this.root.setAttribute('inert', '');
    opener.setAttribute('aria-expanded', 'true');
    this.#activePanel = panel;
    this.#activeOpener = opener;
    panel.scrollTop = 0;

    /** @type {HTMLElement|null} */ (panel.querySelector('[data-bb-panel-heading]'))?.focus({ preventScroll: true });
  }

  /** @param {{ focus: boolean }} options */
  #showRoot({ focus }) {
    const panel = this.#activePanel;
    const opener = this.#activeOpener;
    if (!panel || !this.root) return;

    panel.classList.remove('is-active');
    this.root.classList.remove('is-behind');
    this.root.removeAttribute('inert');
    opener?.setAttribute('aria-expanded', 'false');

    const hide = () => {
      if (!panel.classList.contains('is-active')) panel.hidden = true;
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !focus) {
      hide();
    } else {
      panel.addEventListener('transitionend', hide, { once: true });
      window.setTimeout(hide, 400);
    }

    this.#activePanel = null;
    this.#activeOpener = null;
    if (focus) opener?.focus();
  }
}

if (!customElements.get('bb-header-search')) customElements.define('bb-header-search', BbHeaderSearch);
if (!customElements.get('bb-mega-nav')) customElements.define('bb-mega-nav', BbMegaNav);
if (!customElements.get('bb-drawer')) customElements.define('bb-drawer', BbDrawer);

