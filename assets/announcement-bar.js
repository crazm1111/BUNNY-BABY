import { Component } from '@theme/component';

/**
 * Announcement banner custom element that allows fading between content.
 * Based on the Slideshow component.
 *
 * @typedef {object} Refs
 * @property {HTMLElement} slideshowContainer
 * @property {HTMLElement[]} [slides]
 * @property {HTMLButtonElement} [previous]
 * @property {HTMLButtonElement} [next]
 *
 * @extends {Component<Refs>}
 */
export class AnnouncementBar extends Component {
  #current = 0;

  /**
   * The interval ID for automatic playback.
   * @type {number|undefined}
   */
  #interval = undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('mouseenter', this.suspend);
    this.addEventListener('mouseleave', this.#handlePointerLeave);
    // Pause while anything inside has keyboard focus (WCAG 2.2.2).
    this.addEventListener('focusin', this.suspend);
    this.addEventListener('focusout', this.#handleFocusOut);
    document.addEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#reducedMotion.addEventListener?.('change', this.#handleMotionChange);

    this.play();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.suspend();
    document.removeEventListener('visibilitychange', this.#handleVisibilityChange);
    this.#reducedMotion.removeEventListener?.('change', this.#handleMotionChange);
  }

  /** @type {MediaQueryList} */
  #reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  next() {
    this.current += 1;
    this.#announce();
  }

  previous() {
    this.current -= 1;
    this.#announce();
  }

  /** Manual navigation: let screen readers hear the new message. */
  #announce() {
    this.querySelector('[aria-live]')?.setAttribute('aria-live', 'polite');
  }

  #handlePointerLeave = () => {
    if (this.contains(document.activeElement)) return;
    this.resume();
  };

  /** @param {FocusEvent} event */
  #handleFocusOut = (event) => {
    const next = /** @type {Node|null} */ (event.relatedTarget);
    if (next && this.contains(next)) return;
    if (this.matches(':hover')) return;
    this.resume();
  };

  #handleMotionChange = () => {
    if (this.#reducedMotion.matches) {
      this.suspend();
    } else {
      this.paused = false;
      this.resume();
    }
  };

  /**
   * Starts automatic slide playback.
   * @param {number} [interval] - The time interval in seconds between slides.
   */
  play(interval = this.autoplayInterval) {
    if (!this.autoplay || this.#reducedMotion.matches) return;

    this.paused = false;

    this.#interval = setInterval(() => {
      if (this.matches(':hover') || this.contains(document.activeElement) || document.hidden) return;

      this.current += 1;
    }, interval);
  }

  /**
   * Pauses automatic slide playback.
   */
  pause() {
    this.paused = true;
    this.suspend();
  }

  get paused() {
    return this.hasAttribute('paused');
  }

  set paused(paused) {
    this.toggleAttribute('paused', paused);
  }

  /**
   * Suspends automatic slide playback.
   */
  suspend() {
    clearInterval(this.#interval);
    this.#interval = undefined;
  }

  /**
   * Resumes automatic slide playback if autoplay is enabled.
   */
  resume() {
    if (!this.autoplay || this.paused) return;

    this.pause();
    this.play();
  }

  get autoplay() {
    return Boolean(this.autoplayInterval);
  }

  get autoplayInterval() {
    const interval = this.getAttribute('autoplay');
    const value = parseInt(`${interval}`, 10);

    if (Number.isNaN(value)) return undefined;

    return value * 1000;
  }

  get current() {
    return this.#current;
  }

  set current(current) {
    this.#current = current;

    let relativeIndex = current % (this.refs.slides ?? []).length;
    if (relativeIndex < 0) {
      relativeIndex += (this.refs.slides ?? []).length;
    }

    this.refs.slides?.forEach((slide, index) => {
      slide.setAttribute('aria-hidden', `${index !== relativeIndex}`);
    });
  }

  /**
   * Pause the slideshow when the page is hidden.
   */
  #handleVisibilityChange = () => (document.hidden ? this.suspend() : this.resume());
}

if (!customElements.get('announcement-bar-component')) {
  customElements.define('announcement-bar-component', AnnouncementBar);
}
