import DOMController from './DOMController';

export default class Counter {
  private value = 0;
  private controller: DOMController;

  constructor(el: HTMLElement) {
    if (el) {
      // get initial value from HTML
      const parsedInt = parseInt(el.innerHTML);
      this.value = parsedInt;
    }
    this.controller = new DOMController(el);
  }

  set(value: number) {
    if (!Number.isNaN(value)) {
      this.value = value;
    }
    this.updateDOM();
  }

  increase() {
    this.value += 1;
    this.updateDOM();
  }

  decrease() {
    this.value -= 1;
    this.updateDOM();
  }

  private updateDOM() {
    this.controller.update(this.value.toString());
  }
}
