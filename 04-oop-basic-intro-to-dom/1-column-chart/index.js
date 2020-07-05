export default class ColumnChart {
  constructor({ data = [], value, label, link } = {}) {
    this.element = null;
    this.chartHeight = 50;
    this.data = data;
    this.value = value;
    this.label = label;
    this.link = link;

    this.columnProps = this._getColumnProps();
    this.render();
  }

  _getColumnProps() {
    const maxValue = Math.max(...this.data);
    const scale = this.chartHeight / maxValue;

    return this.data.map(item => {
      return {
        percent: (item / maxValue * 100).toFixed(0) + '%',
        value: String(Math.floor(item * scale))
      };
    });
  }

  render() {
    const element = document.createElement('div');
    if (!this.data.length) {
      element.className = 'column-chart_loading';
    }
    const link = this.link ? `<a href="${this.link}" class="column-chart__link">View all</a>` : '';

    element.innerHTML = `
      <div class="column-chart">
        <div class="column-chart__title">
          Total ${this.label}
          ${link}
        </div>
        <div class="column-chart__container">
          <div class="column-chart__header">${this.value}</div>
          <div class="column-chart__chart">
            ${this._renderData()}
          </div>
        </div>
      </div>
    `;

    this.element = element;
  }

  _renderData() {
    return this.columnProps.reduce((acc, item) => {
      return acc + `<div style="--value:${item.value}" data-tooltip="${item.percent}"></div>`;
    }, '');
  }

  update({ bodyData }) {
    this.data = bodyData;
    this.columnProps = this._getColumnProps();
    this.render();
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
