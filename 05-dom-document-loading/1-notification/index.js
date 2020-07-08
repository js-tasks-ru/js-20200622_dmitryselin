export default class NotificationMessage {
  element = null;
  static instance = null;

  constructor(name = '', {
    duration = 1000,
    type = 'success',
  } = {}) {
    this.name = name;
    this.duration = duration;
    this.type = type;

    if (NotificationMessage.instance) {
      NotificationMessage.instance.remove();
    }
    NotificationMessage.instance = this;

    this.render();
  }

  get template() {
    return `
      <div class="notification ${this.type}" style="--value:${this.duration / 1000}s">
        <div class="timer"></div>
        <div class="inner-wrapper">
          <div class="notification-header">${this.type}</div>
          <div class="notification-body">
            ${this.name}
          </div>
        </div>
      </div>
    `;
  }

  show(targetElement = null) {
    setTimeout(() => this.remove(), this.duration);
    this.render();
    if (targetElement) {
      targetElement.appendChild(this.element);
    }
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
