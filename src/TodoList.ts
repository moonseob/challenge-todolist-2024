import DOMController from './DOMController';

class TodoItem {
  private controller: DOMController;

  completed = false;
  el: HTMLLIElement;
  id = self.crypto.randomUUID();
  createdAt: number;
  lastUpdatedAt: number;

  constructor(
    public content: string,
    private onUpdate: () => void,
    private onDestory: (id: typeof this.id) => void,
  ) {
    const now = new Date().valueOf();
    this.createdAt = now;
    this.lastUpdatedAt = now;

    this.controller = new DOMController(document.createElement('span'));
    this.controller.update(content);
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.classList.add('remove-button');
    deleteButton.textContent = 'Remove';
    deleteButton.onclick = (event) => {
      event.stopPropagation();
      this.destroy();
    };

    const li = document.createElement('li');
    li.appendChild(this.controller.el);
    li.appendChild(deleteButton);
    li.addEventListener('click', this.toggle.bind(this)); // TODO: should prevent drag event
    li.setAttribute('role', 'listitem');
    this.el = li;
  }

  toggle() {
    this.completed = !this.completed;
    if (this.completed) {
      this.el.classList.add('completed');
    } else {
      this.el.classList.remove('completed');
    }
    this.lastUpdatedAt = new Date().valueOf();
    this.onUpdate();
  }

  // update(content: string) {
  //   this.content = content;
  //   this.lastUpdatedAt = new Date().valueOf();
  // }

  destroy() {
    this.el.remove();
    this.el.replaceWith(this.el.cloneNode(true)); // remove event listeners
    this.el = null as never;
    this.onDestory(this.id);
    this.onDestory = null as never;
  }
}

export default class TodoList {
  private todos: TodoItem[] = [];
  constructor(
    private listContainer: HTMLUListElement,
    private updateCallback: () => void,
  ) {}

  private onUpdate() {
    this.updateCallback();
    // TODO: sort todos
    // TODO: render todos
  }

  private handleDestroy(id: TodoItem['id']) {
    this.todos = this.todos.filter((x) => x.id !== id);
    this.onUpdate();
  }

  get totalCount() {
    return this.todos.length;
  }

  get completedCount() {
    return this.todos.filter((x) => x.completed).length;
  }

  addItem(content: string) {
    const item = new TodoItem(content, this.onUpdate.bind(this), this.handleDestroy.bind(this));
    this.todos.push(item);
    this.listContainer.appendChild(item.el);
    this.onUpdate();
  }

  toggleStatus(id: TodoItem['id']) {
    this.todos.find((x) => x.id === id)?.toggle();
  }

  clearCompletedItems() {
    for (const item of this.todos) {
      if (item.completed) {
        item.destroy();
      }
    }
  }
}
