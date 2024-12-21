import './styles.css';

import Counter from './Counter';
import TodoList from './TodoList';

const container = document.querySelector('#list-container') as HTMLUListElement;
const todolist = new TodoList(container, onTodoListChange);
const leftItemsCount = new Counter(document.getElementById('left-items-count')!);
const completedItemsCount = new Counter(document.getElementById('completed-items-count')!);
const clearCompletedButton = document.getElementById('clear-completed-button') as HTMLButtonElement;

(document.querySelector('#text-input') as HTMLInputElement).addEventListener('keydown', (event) => {
  const target = event.target as HTMLInputElement;
  if (event.key === 'Enter') {
    if (typeof target.value !== 'string' || target.value === '') {
      return;
    }
    event.preventDefault();
    todolist.addItem(target.value);
    target.value = '';
  }
});

function onTodoListChange() {
  leftItemsCount.set(todolist.totalCount);
  completedItemsCount.set(todolist.completedCount);
}

clearCompletedButton.addEventListener('click', () => todolist.clearCompletedItems());
