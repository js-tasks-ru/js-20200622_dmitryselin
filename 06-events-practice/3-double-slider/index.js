export default class DoubleSlider {
  element;
  subElements = [];
  dragging;
  shiftX = 0;

  onMouseDown = event => {
    this.element.classList.add('range-slider_dragging');
    this.dragging = event.target;
    this.getClickShift(event);
    this.setEventListeners();
  };

  getClickShift(event) {
    this.shiftX = event.clientX - event.target.getBoundingClientRect().left;
  }

  onMouseMove = event => {
    const { clientX } = event;
    const rect = this.subElements.inner.getBoundingClientRect();

    if (this.dragging === this.subElements.thumbLeft) {
      let newFrom = Math.floor((clientX + this.shiftX - rect.left) * (this.max - this.min) / rect.width) + this.min;
      if (newFrom < this.min) newFrom = this.min;
      if (newFrom > this.selected.to) newFrom = this.selected.to;
      this.setPosition(newFrom);
    } else {
      let newTo = Math.floor((clientX + this.shiftX - rect.left) * (this.max - this.min) / rect.width) + this.min;
      if (newTo > this.max) newTo = this.max;
      if (newTo < this.selected.from) newTo = this.selected.from;
      this.setPosition(null, newTo);
    }
  };

  onMouseUp = () => {
    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: this.selected,
    }));

    this.element.classList.remove('range-slider_dragging');
    this.dragging = null;
    this.removeEventListeners();
  };

  constructor({
    min = 100,
    max = 200,
    formatValue = value => value,
    selected = {
      from: min,
      to: max,
    }
  } = {}) {
    this.min = min;
    this.max = max;
    this.formatValue = formatValue;
    this.selected = selected;
    this.render();
  }

  get template() {
    return `
      <div class="range-slider">
        <span data-element="from"></span>
        <div class="range-slider__inner" data-element="inner">
          <span class="range-slider__progress" data-element="progress"></span>
          <span class="range-slider__thumb-left" data-element="thumbLeft"></span>
          <span class="range-slider__thumb-right" data-element="thumbRight"></span>
        </div>
        <span data-element="to"></span>
      </div>
    `;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    const element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(element);
    this.element = element;
    this.subElements.thumbLeft.ondragstart = () => false;
    this.subElements.thumbRight.ondragstart = () => false;
    this.subElements.thumbLeft.addEventListener('pointerdown', this.onMouseDown);
    this.subElements.thumbRight.addEventListener('pointerdown', this.onMouseDown);
    this.setPosition(this.selected.from, this.selected.to);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  setPosition(from = null, to = null) {
    if (from) {
      const leftPercent = Math.floor((from - this.min) / (this.max - this.min) * 100);
      this.subElements.progress.style.left = `${leftPercent}%`;
      this.subElements.thumbLeft.style.left = `${leftPercent}%`;
      this.subElements.from.textContent = this.formatValue(from);
      this.selected.from = from;
    }
    if (to) {
      const rightPercent = Math.floor((this.max - to) / (this.max - this.min) * 100);
      this.subElements.progress.style.right = `${rightPercent}%`;
      this.subElements.thumbRight.style.right = `${rightPercent}%`;
      this.subElements.to.textContent = this.formatValue(to);
      this.selected.to = to;
    }
  }

  setEventListeners() {
    document.addEventListener('pointermove', this.onMouseMove);
    document.addEventListener('pointerup', this.onMouseUp);
  }

  removeEventListeners() {
    document.removeEventListener('pointermove', this.onMouseMove);
    document.removeEventListener('pointerup', this.onMouseUp);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }
}
