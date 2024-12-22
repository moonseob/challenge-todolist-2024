import { ListFilter } from './models';
import TodoItem, { ITodoItem } from './TodoItem';

/** manage TodoItems and reflect changes to DOM */
export default class TodoList {
  private _todos: TodoItem[] = [];
  /** a callback for side effects. For now it has nothing to do with list itself. */
  private _updateCallback: (() => void) | undefined;

  constructor(private _containerEl: HTMLUListElement) {
    this._loadFromLocalStorage();
  }

  private _onUpdate() {
    this._saveToLocalStorage();
    this._updateCallback?.();
    // TODO: sort todos
    // TODO: render todos
  }

  private _handleDestroy(id: TodoItem['id']) {
    this._todos = this._todos.filter((x) => x.id !== id);
    this._onUpdate();
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
    this._todos.push(item);
    this._containerEl.appendChild(item.el);
    this._onUpdate();
  }

  toggleStatus(id: TodoItem['id']) {
    this._todos.find((x) => x.id === id)?.toggleCompleted();
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

  setListFilter(filter: ListFilter) {
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
        todos.forEach(({ id, content, completed, hidden }) => {
          const item = new TodoItem(content, id);
          item.onUpdate = this._onUpdate.bind(this);
          item.onDestroy = this._handleDestroy.bind(this);
          if (completed) item.toggleCompleted();
          item.setHidden(hidden);
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
}