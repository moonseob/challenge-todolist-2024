import { ListFilter } from './models';
import TodoItem from './TodoItem';

/** manage TodoItems and reflect changes to DOM */
export default class TodoList {
  private _todos: TodoItem[] = [];
  /** a callback for side effects. For now it has nothing to do with list itself. */
  private _updateCallback: (() => void) | undefined;
  constructor(private _containerEl: HTMLUListElement) {}

  private _onUpdate() {
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
  }

  clearCompletedItems() {
    for (const item of this._todos) {
      if (item.completed) {
        item.destroy(); // TODO: need to reduce the occurrence of DOM manipulations
      }
    }
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
  }
}
