class Tooltip {
  static instance = null;
  element;
  eventListeners = [];

  constructor() {
    if (Tooltip.instance) {
      return Tooltip.instance;
    }

    Tooltip.instance = this;
  }

  onPointerOver = (event) => {
    const tooltipContent = event.target.dataset.tooltip;
    if (tooltipContent !== undefined) {
      this.render(tooltipContent);
    }
  };

  onPointerOut = (event) => {
    if (event.target.dataset.tooltip !== undefined) {
      this.remove();
    }
  };

  onPointerMove = (event) => {
    if (event.target.dataset.tooltip !== undefined) {
      this.move(event.clientX, event.clientY);
    }
  };

  initialize() {
    this.addEventListener(document, 'pointerover', this.onPointerOver);
    this.addEventListener(document, 'pointerout', this.onPointerOut);
    this.addEventListener(document, 'pointermove', this.onPointerMove);
  }

  addEventListener(element, eventName, handler) {
    element.addEventListener(eventName, handler);
    this.eventListeners.push({element, eventName, handler});
  }

  render(data) {
    this.element = document.createElement('div');
    this.element.className = 'tooltip';
    this.element.innerHTML = data;
    document.body.append(this.element);
  }

  move(x, y) {
    const offset = 10;
    this.element.style.top = `${(y + offset).toFixed(0)}px`;
    this.element.style.left = `${(x + offset).toFixed(0)}px`;
  }

  remove() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }

  removeEventListeners() {
    this.eventListeners.forEach(({element, eventName, handler}) => {
      element.removeEventListener(eventName, handler);
    });
    this.eventListeners.length = 0;
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }
}

const tooltip = new Tooltip();

export default tooltip;
