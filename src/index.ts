import './styles.css';

import CounterController from './CounterController';
import DraggableController from './DraggableController';
import RadioManager from './RadioManager';
import TodoList from './TodoList';
import { ListFilter } from './models';

// Access essential DOM elements for the application
const container = document.getElementById('list-container') as HTMLUListElement;
const leftItemsCount = new CounterController(document.getElementById('left-items-count') as HTMLElement);
const completedItemsCount = new CounterController(
  document.getElementById('completed-items-count') as HTMLElement,
);
const clearCompletedButton = document.getElementById('clear-completed-button') as HTMLButtonElement;
const textInput = document.getElementById('text-input') as HTMLInputElement;

// Initialize the TodoList and define its update behavior
const todolist = new TodoList(container);
const onTodoListChange = () => {
  leftItemsCount.set(todolist.totalCount);
  completedItemsCount.set(todolist.completedCount);
};
// Update Counter elements whenever the Todo list changes
todolist.onUpdate = onTodoListChange;

// register draggable controller
const dragController = new DraggableController(container);
dragController.onDrop = todolist.swapItemsByIndex.bind(todolist);

/** Handle new TodoItem submission. */
function handleEnterKey(event: KeyboardEvent) {
  const target = event.target as HTMLInputElement;
  if (event.key === 'Enter' && !event.isComposing) {
    if (typeof target.value !== 'string' || target.value.trim() === '') {
      return;
    }
    event.preventDefault();
    todolist.addItem(target.value.trim());
    target.value = '';
  }
}
textInput.removeEventListener('keydown', handleEnterKey); // cleanup for development
textInput.addEventListener('keydown', handleEnterKey);

/** Clear all completed Todo items. */
function handleCompletedButtonClick() {
  todolist.clearCompletedItems();
}
clearCompletedButton.removeEventListener('click', handleCompletedButtonClick); // cleanup for development
clearCompletedButton.addEventListener('click', handleCompletedButtonClick);

// Manage the Todo list view filter
const radio = new RadioManager<ListFilter>('filter');
radio.onChange = (v) => {
  todolist.setListFilter(v);
  onTodoListChange();
};

// Render the initial state of the Todo list
onTodoListChange();
