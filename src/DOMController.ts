export default class DOMController {
  constructor(public el: HTMLElement) {}

  /**
   * update content of the element selected.
   * @param textContent new value to display
   * @param selector (optional) can target any child element to update
   *
   */
  update(textContent: string, selector?: string) {
    const el = selector ? this.el?.querySelector(selector) : this.el;
    if (el) {
      el.textContent = textContent; // update textContent in favor of innerHTML to avoid injection
    }
  }
}
