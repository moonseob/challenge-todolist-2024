import type TodoList from './TodoList';

type ListitemElement = HTMLElement;

export default class DraggableController {
  private _container: HTMLElement;

  private _offsetX = 0;
  private _offsetY = 0;
  private _draggedElement: HTMLElement | null = null;
  private _mirrorElement: HTMLElement | null = null;

  private _dragThreshold = 5;
  private _startX = 0;
  private _startY = 0;
  private _hasCrossedThreshold = false; // for drag

  private _hoverTimer: number | null = null;
  private _isPreviewActive = false;
  private _rollbackRefEl: Element | null = null;
  /** the nextElementSibling when it's at its original position */
  private _previewOriginalIndex: number | null = null;

  private _commitIndexSwap: TodoList['swapItemsByIndex'] | undefined;

  constructor(container: HTMLElement) {
    this._container = container;
    this._addEventListeners();
  }

  set onIndexSwap(cb: typeof this._commitIndexSwap) {
    this._commitIndexSwap = cb;
  }

  private _addEventListeners() {
    this._container.addEventListener('mousedown', this._onMouseDown.bind(this));
    this._container.addEventListener('mouseenter', this._onMouseEnterListItem.bind(this), true);
    this._container.addEventListener('mouseleave', this._onMouseLeaveListItem.bind(this), true);
    document.addEventListener('mousemove', this._onMouseMove.bind(this));
    document.addEventListener('mouseup', this._onMouseUp.bind(this));
    document.addEventListener('keydown', this._onKeyDown.bind(this));
  }

  private _getListitemElement(el: HTMLElement): ListitemElement;
  private _getListitemElement(el: null): null;
  private _getListitemElement(el: HTMLElement | null): ListitemElement | null {
    let result: HTMLElement | null = el;

    while (result && result !== this._container) {
      if (result.getAttribute('role') === 'listitem') {
        break;
      }
      result = result.parentElement;
    }
    return result as ListitemElement | null;
  }
  private _onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'BUTTON') return;

    const listitemElement = this._getListitemElement(target);
    if (
      listitemElement === null ||
      listitemElement.getAttribute('role') !== 'listitem' ||
      (listitemElement.querySelector('input[type=checkbox]') as HTMLInputElement | null)?.checked
    ) {
      return;
    }

    this._draggedElement = listitemElement;
    this._rollbackRefEl = listitemElement.nextElementSibling;
    this._previewOriginalIndex = Array.from(this._container.children).indexOf(listitemElement);

    // get relative position of cursor with scroll adjustments
    const rect = listitemElement.getBoundingClientRect();
    this._offsetX = event.clientX - (rect.left + window.scrollX);
    this._offsetY = event.clientY - (rect.top + window.scrollY);
  }

  private _onMouseMove(event: MouseEvent) {
    if (!this._draggedElement) return;

    if (!this._hasCrossedThreshold) {
      const deltaX = Math.abs(event.clientX - this._startX);
      const deltaY = Math.abs(event.clientY - this._startY);
      const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

      if (distance < this._dragThreshold) {
        return;
      }
      document.body.classList.add('dragging');
      this._hasCrossedThreshold = true;
      this._createMirrorElement(this._draggedElement);
    }

    if (!this._mirrorElement) return;

    this._mirrorElement.style.left = `${event.clientX - this._offsetX}px`;
    this._mirrorElement.style.top = `${event.clientY - this._offsetY}px`;
  }

  private _onMouseUp(event: MouseEvent) {
    if (!this._draggedElement) return;

    if (!this._mirrorElement) {
      this._cleanup();
      return;
    }

    const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
    if (!this._container.contains(dropTarget)) {
      console.log('Drag canceled: Mouse left the container.');
      this._rollbackPreview();
      this._cleanup();
      return;
    }
    const targetListitem = this._getListitemElement(event.target as HTMLElement);

    this._handleDrop(targetListitem);
    this._cleanup();
  }

  /**
   * Update DOM on drop
   * @param target - the element the overlay has been dropped on
   * @param isPreview - apply changes only temporarily
   */
  private _handleDrop(target: HTMLElement) {
    if (!this._draggedElement) return;

    const draggedIndex = Array.from(this._container.children).indexOf(this._draggedElement);
    const targetIndex = Array.from(this._container.children).indexOf(target);

    if (this._isPreviewActive) {
      if (this._previewOriginalIndex === null) return;
      this._commitIndexSwap?.(this._previewOriginalIndex, targetIndex);
      this._draggedElement.classList.remove('preview');
    } else {
      // drop on dragged element is only permitted when preview is activated
      if (target === this._draggedElement) return;

      // update model
      this._commitIndexSwap?.(draggedIndex, targetIndex);
      // update DOM
      if (draggedIndex < targetIndex) {
        this._container.insertBefore(this._draggedElement, target.nextElementSibling);
      } else if (draggedIndex > targetIndex) {
        this._container.insertBefore(this._draggedElement, target);
      }
    }
    this._cleanup();
  }

  private _triggerPreview(target: HTMLElement) {
    if (!this._draggedElement || target === this._draggedElement) return;
    const originalIndex = Array.from(this._container.children).indexOf(this._draggedElement);
    this._isPreviewActive = true;
    const targetIndex = Array.from(this._container.children).indexOf(target);
    this._draggedElement.classList.add('preview');

    if (originalIndex < targetIndex) {
      this._container.insertBefore(this._draggedElement, target.nextElementSibling);
    } else if (originalIndex > targetIndex) {
      this._container.insertBefore(this._draggedElement, target);
    }
  }

  private _rollbackPreview() {
    if (!this._draggedElement) return;
    this._draggedElement.classList.remove('preview');
    if (this._rollbackRefEl) {
      this._container.insertBefore(this._draggedElement, this._rollbackRefEl);
    } else {
      this._container.appendChild(this._draggedElement);
    }
    this._cleanup();
  }

  private _onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this._rollbackPreview();
      this._cleanup();
    }
  }

  private _createMirrorElement(target: HTMLElement) {
    this._mirrorElement = target.cloneNode(true) as HTMLElement;

    // set styles
    const rect = target.getBoundingClientRect();
    this._mirrorElement.style.position = 'absolute';
    this._mirrorElement.style.opacity = '0.5';
    this._mirrorElement.style.pointerEvents = 'none';
    this._mirrorElement.style.boxSizing = 'border-box';
    this._mirrorElement.style.width = `${rect.width}px`;
    this._mirrorElement.style.height = `${rect.height}px`;
    this._mirrorElement.style.left = `${rect.x + window.scrollX}px`;
    this._mirrorElement.style.top = `${rect.y + window.scrollY}px`;

    // render
    document.body.append(this._mirrorElement);
  }

  private _onMouseEnterListItem(event: MouseEvent) {
    if (!this._draggedElement) return;

    const target = event.target as HTMLElement;
    if (target.getAttribute('role') !== 'listitem') return;
    target.classList.add('drag-over');

    this._hoverTimer = window.setTimeout(() => {
      this._triggerPreview(target);
    }, 2000);
  }

  private _onMouseLeaveListItem(event: MouseEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('drag-over');
    if (this._hoverTimer) {
      clearTimeout(this._hoverTimer);
      this._hoverTimer = null;
    }
  }

  private _cleanup() {
    this._rollbackRefEl = null;
    this._previewOriginalIndex = null;
    this._isPreviewActive = false;
    this._hasCrossedThreshold = false;
    if (this._hoverTimer) {
      clearTimeout(this._hoverTimer);
      this._hoverTimer = null;
    }
    if (this._mirrorElement) {
      document.body.removeChild(this._mirrorElement);
      this._mirrorElement = null;
    }
    this._draggedElement = null;
    this._container.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });

    document.body.classList.remove('dragging');
  }
}
