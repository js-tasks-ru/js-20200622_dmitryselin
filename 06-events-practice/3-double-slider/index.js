export default class DoubleSlider {
  element;
  subElements = {};
  shiftX = 0;
  dragging;

  constructor({
    min = 100,
    max = 800,
    formatValue = (value => `$${value}`),
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
        <span data-element="from">${this.formatValue(this.selected.from)}</span>
        <div class="range-slider__inner" data-element="inner">
          <span class="range-slider__progress" data-element="progress"></span>
          <span class="range-slider__thumb-left" data-element="thumbLeft"></span>
          <span class="range-slider__thumb-right" data-element="thumbRight"></span>
        </div>
        <span data-element="to">${this.formatValue(this.selected.to)}</span>
      </div>
    `;
  }

  render() {
    const $wrapper = document.createElement('div');
    $wrapper.innerHTML = this.template;
    const element = $wrapper.firstElementChild;
    this.subElements = this.getSubElements(element);
    this.element = element;
    this.subElements.thumbLeft.addEventListener('pointerdown', this.onPointerDown);
    this.subElements.thumbRight.addEventListener('pointerdown', this.onPointerDown);
    this.update();
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  update() {
    let e = this.max - this.min;
    this.subElements.progress.style.left = Math.floor((this.selected.from - this.min) / e * 100) + "%";
    this.subElements.progress.style.right = Math.floor((this.max - this.selected.to) / e * 100) + "%";
    this.subElements.thumbLeft.style.left = this.subElements.progress.style.left;
    this.subElements.thumbRight.style.right = this.subElements.progress.style.right;
    this.subElements.from.innerHTML = this.formatValue(this.selected.from);
    this.subElements.to.innerHTML = this.formatValue(this.selected.to);
  }

  onPointerDown = (event) => {
    const target = event.target;
    const rect = target.getBoundingClientRect();
    this.shiftX = target === this.subElements.thumbLeft ? rect.right - event.clientX : rect.left - event.clientX;
    this.dragging = target;
    this.element.classList.add('range-slider_dragging');

    document.addEventListener("pointermove", this.onPointerMove);
    document.addEventListener("pointerup", this.onPointerUp);
  };

  onPointerMove = (event) => {
    if (this.dragging === this.subElements.thumbLeft) {
      let t = (event.clientX - this.subElements.inner.getBoundingClientRect().left + this.shiftX) / this.subElements.inner.offsetWidth;
      if (t < 0) t = 0;
      t *= 100;
      let s = parseFloat(this.subElements.thumbRight.style.right);
      if (t + s > 100) t = 100 - s;
      this.dragging.style.left = `${t}%`;
      this.subElements.progress.style.left = `${t}%`;
      this.subElements.from.innerHTML = this.formatValue(this.getValue().from);
    } else {
      let t = (this.subElements.inner.getBoundingClientRect().right - event.clientX - this.shiftX) / this.subElements.inner.offsetWidth;
      if (t < 0) t = 0;
      t *= 100;
      let s = parseFloat(this.subElements.thumbLeft.style.left);
      if (t + s > 100) t = 100 - s;
      this.dragging.style.right = this.subElements.progress.style.right = `${t}%`;
      this.subElements.to.innerHTML = this.formatValue(this.getValue().to);
    }
  };

  getValue() {
    return {
      from: Math.round(this.min + .01 * parseFloat(this.subElements.thumbLeft.style.left) * (this.max - this.min)),
      to: Math.round(this.max - .01 * parseFloat(this.subElements.thumbRight.style.right) * (this.max - this.min)),
    };
  }

  onPointerUp = () => {
    this.element.classList.remove('range-slider_dragging');
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);

    this.element.dispatchEvent(new CustomEvent('range-select', {
      detail: this.getValue(),
    }));
  };

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
  }
}
