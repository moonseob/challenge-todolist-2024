import DOMController from './DOMController';

/** manages counter value and updates DOM accordingly. */
export default class CounterController {
  private _value = 0;
  private _controller: DOMController;

  constructor(el: HTMLElement) {
    if (el) {
      // get initial value from HTML
      const parsedInt = parseInt(el.innerHTML);
      this._value = parsedInt;
    }
    this._controller = new DOMController(el);
  }

  set(value: number) {
    if (!Number.isNaN(value)) {
      this._value = value;
    }
    this._updateDOM();
  }

  increase() {
    this._value += 1;
    this._updateDOM();
  }

  decrease() {
    this._value -= 1;
    this._updateDOM();
  }

  private _updateDOM() {
    this._controller.update(this._value.toString());
  }
}
