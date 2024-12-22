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

  completed = false;
  hidden = false;
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

    this._controller = new DOMController(document.createElement('span'));
    this._controller.update(content);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('remove-button');
    deleteButton.textContent = 'Remove';
    deleteButton.onclick = (event) => {
      event.stopPropagation();
      this.destroy();
    };

    const li = document.createElement('li');
    li.appendChild(this._controller.el);
    li.appendChild(deleteButton);
    li.classList.add('list-item');
    li.addEventListener('click', this.toggleCompleted.bind(this)); // TODO: should prevent drag event
    li.setAttribute('role', 'listitem');
    this.el = li;
  }

  set onUpdate(cb: NonNullable<typeof this._onUpdate>) {
    this._onUpdate = cb;
  }

  set onDestroy(cb: NonNullable<typeof this._onDestroy>) {
    this._onDestroy = cb;
  }

  toggleCompleted() {
    this.completed = !this.completed;
    if (this.completed) {
      this.el.classList.add('completed');
    } else {
      this.el.classList.remove('completed');
    }
    this.lastUpdatedAt = new Date().valueOf();
    this._onUpdate?.();
  }

  setHidden(isHidden: boolean) {
    this.hidden = isHidden;
    this.el.hidden = this.hidden;
  }

  // update(content: string) {
  //   this.content = content;
  //   this.lastUpdatedAt = new Date().valueOf();
  // }

  destroy() {
    this.el.remove();
    this.el.replaceWith(this.el.cloneNode(true)); // remove event listeners
    this.el = null as never;
    this._onDestroy?.(this.id);
    this._onDestroy = null as never;
  }
}
