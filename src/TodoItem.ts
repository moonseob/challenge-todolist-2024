import DOMController from './DOMController';

export interface ITodoItem {
  id: string;
  content: string;
  completed: boolean;
  hidden: boolean;
}

export default class TodoItem implements ITodoItem {
  private _controller: DOMController;
  private _onUpdate: (() => void) | undefined;
  private _onDestroy: ((id: typeof this.id) => void) | undefined;

  hidden = false;
  /** a checkbox to indicate whether the item is completed */
  checkbox: HTMLInputElement;
  el: HTMLLIElement;
  id: string;
  createdAt: number;
  lastUpdatedAt: number;

  constructor(
    public content: string,
    id?: string,
  ) {
    const now = new Date().valueOf();
    this.createdAt = now;
    this.lastUpdatedAt = now;
    this.id = id || self.crypto.randomUUID();

    // checkbox to mark completed
    this.checkbox = document.createElement('input');
    this.checkbox.type = 'checkbox';
    this.checkbox.addEventListener('change', this._handleCheckboxChange.bind(this));
    this.checkbox.classList.add('visually-hidden');

    // span element to show content
    this._controller = new DOMController(document.createElement('span'));
    this._controller.update(content);

    // delete button
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('remove-button');
    deleteButton.textContent = 'Remove';
    deleteButton.onclick = (event) => {
      event.stopPropagation();
      this.destroy();
    };

    const li = document.createElement('li');
    li.appendChild(this.checkbox);
    li.appendChild(this._controller.el);
    li.appendChild(deleteButton);
    li.classList.add('list-item');
    li.addEventListener('click', () => this.checkbox.click());
    li.setAttribute('role', 'listitem');
    this.el = li;
  }

  set onUpdate(cb: NonNullable<typeof this._onUpdate>) {
    this._onUpdate = cb;
  }

  set onDestroy(cb: NonNullable<typeof this._onDestroy>) {
    this._onDestroy = cb;
  }

  get completed() {
    return this.checkbox.checked;
  }

  private _handleCheckboxChange() {
    this.lastUpdatedAt = new Date().valueOf();
    this.checkbox.ariaLabel = this.checkbox.checked ? 'Mark as active' : 'Mark as completed';
    this._onUpdate?.();
  }

  setCompleted(isCompleted: boolean) {
    this.checkbox.checked = isCompleted;
  }

  setHidden(isHidden: boolean) {
    this.hidden = isHidden;
    this.el.hidden = this.hidden;
  }

  destroy() {
    this.el.remove();
    this.el.replaceWith(this.el.cloneNode(true)); // remove event listeners
    this.el = null as never;
    this._onDestroy?.(this.id);
    this._onDestroy = null as never;
  }
}
