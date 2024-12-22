type ListitemElement = HTMLElement;

export default class DraggableController {
  private _draggedElement: HTMLElement | null = null;
  private _mirrorElement: HTMLElement | null = null;
  private _isDragging = false;
  private _hoverTimer: number | null = null;
  private _offsetX: number = 0;
  private _offsetY: number = 0;

  constructor(private container: HTMLElement) {
    this.container.addEventListener('mousedown', this._onMouseDown.bind(this));
    document.addEventListener('mousemove', this._onMouseMove.bind(this));
    document.addEventListener('mouseup', this._onMouseUp.bind(this));
    document.addEventListener('keydown', this._onKeyDown.bind(this));
    this.container.addEventListener('mouseenter', this._onMouseEnterListItem.bind(this), true);
    this.container.addEventListener('mouseleave', this._onMouseLeaveListItem.bind(this), true);
  }

  private _getListitemElement(el: HTMLElement): ListitemElement;
  private _getListitemElement(el: null): null;
  private _getListitemElement(el: HTMLElement | null): ListitemElement | null {
    let result: HTMLElement | null = el;

    while (result && result !== this.container) {
      if (result.getAttribute('role') === 'listitem') {
        break;
      }
      result = result.parentElement;
    }
    return result as ListitemElement | null;
  }

  private _onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target?.tagName === 'BUTTON') {
      return;
    }
    const listitemElement = this._getListitemElement(target);
    if (
      listitemElement === null ||
      listitemElement.getAttribute('role') !== 'listitem' ||
      listitemElement.classList.contains('completed')
      // TODO: use "data-todo-completed"
    ) {
      return;
    }

    this._draggedElement = listitemElement;
    this._isDragging = true;

    // get relative position of cursor
    const rect = listitemElement.getBoundingClientRect();
    this._offsetX = event.clientX - rect.left;
    this._offsetY = event.clientY - rect.top;

    document.body.classList.add('dragging');
    this._createMirrorElement(listitemElement);
  }

  private _onMouseMove(event: MouseEvent) {
    if (!this._isDragging || !this._mirrorElement) return;

    this._mirrorElement.style.left = `${event.clientX - this._offsetX}px`;
    this._mirrorElement.style.top = `${event.clientY - this._offsetY}px`;
  }

  private _onMouseUp(event: MouseEvent) {
    if (!this._isDragging || !this._draggedElement) return;

    const dropTarget = document.elementFromPoint(event.clientX, event.clientY);
    if (this.container.contains(dropTarget) === false) {
      console.log('Drag canceled: Mouse left the container.');
      this._cleanup();
      return;
    }
    const targetListitem = this._getListitemElement(event.target as HTMLElement);
    this._handleDrop(targetListitem);
    this._cleanup();
  }

  private _handleDrop(target: HTMLElement) {
    if (!this._draggedElement || target === this._draggedElement) {
      return;
    }
    const draggedIndex = Array.from(this.container.children).indexOf(this._draggedElement);
    const targetIndex = Array.from(this.container.children).indexOf(target);
    if (draggedIndex < targetIndex) {
      this.container.insertBefore(this._draggedElement, target.nextSibling);
    } else if (draggedIndex > targetIndex) {
      this.container.insertBefore(this._draggedElement, target);
    }
  }

  private _onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
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
    this._mirrorElement.style.left = `${rect.x}px`;
    this._mirrorElement.style.top = `${rect.y}px`;

    // render
    document.body.append(this._mirrorElement);
  }

  private _onMouseEnterListItem(event: MouseEvent) {
    if (!this._isDragging || !this._draggedElement) return;

    const target = event.target as HTMLElement;
    if (target.getAttribute('role') !== 'listitem') return;
    target.classList.add('drag-over');
  }

  private _onMouseLeaveListItem(event: MouseEvent) {
    const target = event.target as HTMLElement;
    target.classList.remove('drag-over');
  }

  private _cleanup() {
    this._isDragging = false;
    if (this._mirrorElement) {
      document.body.removeChild(this._mirrorElement);
      this._mirrorElement = null;
    }
    if (this._draggedElement) {
      this._draggedElement.classList.remove('preview');
      this._draggedElement = null;
    }
    if (this._hoverTimer) {
      clearTimeout(this._hoverTimer);
      this._hoverTimer = null;
    }
    this._offsetX = 0;
    this._offsetY = 0;
    this.container.querySelectorAll('.drag-over').forEach((el) => {
      el.classList.remove('drag-over');
    });

    document.body.classList.remove('dragging');
  }
}
