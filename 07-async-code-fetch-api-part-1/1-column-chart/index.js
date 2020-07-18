export default class ColumnChart {
  element;
  subElements = [];
  chartHeight = 50;
  data = [];
  apiHost = 'course-js.javascript.ru';

  constructor({
    url = '',
    range = {
      from: new Date(),
      to: new Date(),
    },
    label = '',
    link = '',
    formatHeading = data => data,
  } = {}) {
    this.url = url;
    this.range = range;
    this.label = label;
    this.link = link;
    this.formatHeading = formatHeading;
    this.render();
  }

  get template() {
    return `
      <div class="column-chart column-chart_loading">
        <div class="column-chart__title">
          Total ${this.label}
          ${this.getLink()}
        </div>
        <div class="column-chart__container">
          <div data-element="header" class="column-chart__header"></div>
          <div data-element="body" class="column-chart__chart"></div>
        </div>
      </div>
    `;
  }

  getLink() {
    return this.link ? `<a class="column-chart__link" href="${this.link}">View all</a>` : '';
  }

  getColumnBody(data) {
    const maxValue = Math.max(...data);
    return data
      .map(item => {
        const scale = this.chartHeight / maxValue;
        const percent = (item / maxValue * 100).toFixed(0);
        return `<div style="--value: ${Math.floor(item * scale)}" data-tooltip="${percent}%"></div>`
      })
      .join('');
  }

  getHeadingValue(data) {
    if (!data.length) return 0;
    const sum = Object.values(data).reduce((acc, current) => acc + current, 0);
    return this.formatHeading(sum);
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.update(this.range.from, this.range.to);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  update(dateFrom, dateTo) {
    return fetch(this.getFullUrl(dateFrom, dateTo))
      .then(response => response.json())
      .then(data => {
        this.data = [...Object.values(data)];
        if (this.data.length) {
          this.element.classList.remove('column-chart_loading');
          this.subElements.header.textContent = this.getHeadingValue(this.data);
          this.subElements.body.innerHTML = this.getColumnBody(this.data);
        }
      })
      .catch(err => {
        console.log(err);
        this.data = [];
      })
  }

  getFullUrl(dateFrom, dateTo) {
    return `https://${this.apiHost}/${this.url}?from=${dateFrom.toISOString()}&to=${dateTo.toISOString()}`;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    this.subElements = {};
    this.data = [];
  }
}
