import { StandardEvents } from '@shopify/events';

/**
 * Keeps a block in step with the selected variant.
 * Wrap the block's markup in <bb-variant-sync data-sync-id="…">. When the shopper picks
 * another variant, Horizon fetches the section again; this copies the matching
 * element's new markup across.
 */
class BbVariantSync extends HTMLElement {
  connectedCallback() {
    this.section = this.closest('.shopify-section, dialog');
    this.section?.addEventListener(StandardEvents.productSelect, this.onSelect);
  }

  disconnectedCallback() {
    this.section?.removeEventListener(StandardEvents.productSelect, this.onSelect);
  }

  onSelect = (event) => {
    if (!(event.target instanceof Element) || event.target.closest('product-card')) return;
    event.promise
      ?.then(({ detail }) => {
        const html = detail?.html;
        if (!html) return;
        const next = html.querySelector(`bb-variant-sync[data-sync-id="${this.dataset.syncId}"]`);
        if (next) this.innerHTML = next.innerHTML;
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') console.warn('[bb-variant-sync]', error);
      });
  };
}

if (!customElements.get('bb-variant-sync')) customElements.define('bb-variant-sync', BbVariantSync);
