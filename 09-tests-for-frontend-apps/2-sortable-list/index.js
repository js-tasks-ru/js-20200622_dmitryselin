export default class SortableList {
  element;
  draggingElement;
  placeholderElement;
  elementInitialIndex;
  pointerInitialShift;

  onPointerDown = (event) => {
    const target = event.target;
    const item = target.closest('.sortable-list__item');
    if (!item) return;

    if (target.closest('[data-grab-handle]')) {
      event.preventDefault();
      this.dragStart(item, event);
    } else if (target.closest('[data-delete-handle]')) {
      event.preventDefault();
      this.removeItem(item);
    }
  }

  dragStart(element, {clientX, clientY}) {
    this.elementInitialIndex = [...this.element.children].indexOf(element);
    const rect = element.getBoundingClientRect();
    this.pointerInitialShift = {
      x: clientX - rect.x,
      y: clientY - rect.y,
    };
    this.draggingElement = element;

    this.placeholderElement = document.createElement('div');
    this.placeholderElement.className = 'sortable-list__placeholder';
    element.style.width = `${element.offsetWidth}px`;
    element.style.height = `${element.offsetHeight}px`;
    this.placeholderElement.style.width = element.style.width;
    this.placeholderElement.style.height = element.style.height;

    element.classList.add('sortable-list__item_dragging');
    element.after(this.placeholderElement);
    this.element.append(element);
    this.moveDraggingAt(clientX, clientY);
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  moveDraggingAt(x, y) {
    this.draggingElement.style.left = `${x - this.pointerInitialShift.x}px`;
    this.draggingElement.style.top = `${y - this.pointerInitialShift.y}px`;
  }

  onPointerMove = (event) => {
    const { clientX, clientY } = event;
    this.moveDraggingAt(clientX, clientY);

    if (clientY < this.element.firstElementChild.getBoundingClientRect().top) {
      this.movePlaceholderAt(0);
    } else if (clientY > this.element.lastElementChild.getBoundingClientRect().bottom) {
      this.movePlaceholderAt(this.element.children.length);
    } else {
      for (let t = 0; t < this.element.children.length; t++) {
        const child = this.element.children[t];
        const childRect = child.getBoundingClientRect();
        if (child !== this.draggingElement && clientY > childRect.top && clientY < childRect.bottom) {
          if (clientY < childRect.top + child.offsetHeight / 2) this.movePlaceholderAt(t);
          else this.movePlaceholderAt(t + 1);
          break;
        }
      }
    }

    this.scrollIfCloseToWindowEdge(event);
  }

  movePlaceholderAt(index) {
    const child = this.element.children[index];
    if (child !== this.placeholderElement) this.element.insertBefore(this.placeholderElement, child);
  }

  scrollIfCloseToWindowEdge(event) {
    const { clientY } = event;
    const minDistanceToEdge = 20;
    const scrollStep = 10;
    if (clientY < minDistanceToEdge) window.scrollBy(0, -scrollStep);
    else if (clientY > document.documentElement.clientHeight - minDistanceToEdge) window.scrollBy(0, scrollStep);
  }

  onPointerUp = () => this.dragStop();

  dragStop() {
    this.placeholderElement.replaceWith(this.draggingElement);

    this.draggingElement.classList.remove('sortable-list__item_dragging');
    const style = this.draggingElement.style;
    [style.left, style.top, style.width, style.height] = ['', '', '', ''];
    this.draggingElement = null;

    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  constructor({
    items = [],
  } = {}) {
    this.items = items;
    this.render();
  }

  render() {
    this.element = document.createElement('ul');
    this.element.className = 'sortable-list';
    this.items.forEach(item => this.addItem(item));
    this.initEventListeners();
  }

  addItem(item) {
    item.classList.add('sortable-list__item');
    item.ondragstart = () => false;
    this.element.append(item);
  }

  removeItem(item) {
    item.remove();
  }

  getItems() {
    return [...this.element.querySelectorAll('.sortable-list__item')];
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', this.onPointerDown);
  }

  removeEventListeners() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }
}
