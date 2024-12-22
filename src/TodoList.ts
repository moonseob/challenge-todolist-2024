import { ListFilter } from './models';
import TodoItem, { ITodoItem } from './TodoItem';

/** manage TodoItems and reflect changes to DOM */
export default class TodoList {
  private _todos: TodoItem[] = [];
  private _currentFilter: ListFilter = 'all';
  /** a callback for side effects. For now it has nothing to do with list itself. */
  private _updateCallback: (() => void) | undefined;

  constructor(private _containerEl: HTMLUListElement) {
    this._loadFromLocalStorage();
  }

  private _onUpdate() {
    this.setListFilter();
    this._updateCallback?.();
    setTimeout(() => this._saveToLocalStorage()); // To ensure write after all DOM changes are done
    // TODO: sort todos
    // TODO: render todos
  }

  private _handleDestroy(id: TodoItem['id']) {
    this._todos = this._todos.filter((x) => x.id !== id);
    this._onUpdate();
  }

  /** Save current state to localStorage */
  private _saveToLocalStorage() {
    const data: ITodoItem[] = this._todos.map((item) => ({
      id: item.id,
      content: item.content,
      completed: item.completed,
      hidden: item.hidden,
    }));
    localStorage.setItem('todoList', JSON.stringify(data));
  }

  /** Load state from localStorage */
  private _loadFromLocalStorage() {
    const data = localStorage.getItem('todoList');
    if (data) {
      try {
        const todos: ITodoItem[] = JSON.parse(data);
        const fragment = document.createDocumentFragment();
        todos.forEach(({ id, content, completed }) => {
          const item = new TodoItem(content, id);
          item.onUpdate = this._onUpdate.bind(this);
          item.onDestroy = this._handleDestroy.bind(this);
          item.setCompleted(completed);
          this._todos.push(item);
          fragment.appendChild(item.el);
        });
        this._containerEl.innerHTML = '';
        this._containerEl.appendChild(fragment);
      } catch (error) {
        console.warn('Failed to load todos from localStorage:', error);
        localStorage.removeItem('todoList');
      }
    }
  }

  set onUpdate(cb: NonNullable<typeof this._updateCallback>) {
    this._updateCallback = cb;
  }

  get totalCount() {
    return this._todos.filter((x) => !x.hidden).length;
  }

  get completedCount() {
    return this._todos.filter((x) => x.completed).length;
  }

  addItem(content: string) {
    const item = new TodoItem(content);
    item.onUpdate = this._onUpdate.bind(this);
    item.onDestroy = this._handleDestroy.bind(this);
    if (this._todos.length > 0) {
      this._containerEl.insertBefore(item.el, this._todos[0].el);
    } else {
      this._containerEl.appendChild(item.el);
    }
    this._todos.unshift(item);
    this._onUpdate();
  }

  toggleStatus(id: TodoItem['id']) {
    const todo = this._todos.find((x) => x.id === id);
    if (todo) {
      todo.setCompleted(!todo.completed);
    }
    this._onUpdate();
  }

  clearCompletedItems() {
    for (const item of this._todos) {
      if (item.completed) {
        item.destroy(); // TODO: need to reduce the occurrence of DOM manipulations
      }
    }
    this._onUpdate();
  }

  setListFilter(filter: ListFilter = this._currentFilter) {
    this._currentFilter = filter;
    for (const item of this._todos) {
      let isHidden = false;
      switch (filter) {
        case 'all':
          isHidden = false;
          break;
        case 'active':
          isHidden = item.completed;
          break;
        case 'completed':
          isHidden = !item.completed;
          break;
      }
      item.setHidden(isHidden); // TODO: need to reduce the occurrence of DOM manipulations
    }
    // this._onUpdate();
  }

  swapItemsByIndex(draggedIndex: number, targetIndex: number) {
    const [draggedItem] = this._todos.splice(draggedIndex, 1);
    this._todos.splice(targetIndex, 0, draggedItem);
    this._onUpdate();
  }
}
