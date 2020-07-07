export default class SortableTable {
  element = null;
  subElements = {};

  constructor(header = [], { data = [] } = {}) {
    this.header = header;
    this.data = data;
    this.render();
  }

  get template() {
    return `
      <div class="sortable-table">
        <div data-element="header" class="sortable-table__header sortable-table__row">
          ${this.getHeader()}
        </div>
        <div data-element="body" class="sortable-table__body">
          ${this.data.map(item => (this.getBodyRow(item))).join('')}
        </div>
      </div>
    `;
  }

  getHeader() {
    return this.header.map(item => `
      <div class="sortable-table__cell" data-name="${item.id}" data-sortable="${item.sortable}">
        <span>${item.title}</span>
        ${item.sortable ? '<span class="sortable-table__sort-arrow"><span class="sort-arrow"></span></span>' : ''}
      </div>
    `).join('');
  }

  getBodyRow(rowData) {
    return (`
      <a class="sortable-table__row">
        ${this.header.map(column => {
          const columnData = rowData[column.id];
          return column.template ?
            column.template(columnData) : ('<div class="sortable-table__cell">' + columnData + '</div>');
        }).join('')}
      </a>
    `);
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  sort(field, order = 'asc') {
    const headerField = this.header.find(item => item.id === field);
    if (!headerField.sortable) {
      return;
    }

    this.data.sort((item1, item2) => {
      const value1 = item1[field];
      const value2 = item2[field];

      let compareResult;
      if (typeof value1 === 'number') {
        compareResult = value1 > value2 ? 1 : -1;
      } else {  // string
        compareResult = value1.localeCompare(value2, 'ru');
      }

      const direction = order === 'desc' ? -1 : 1;
      return compareResult * direction;
    });

    this.element.innerHTML = this.template;
    this.subElements = this.getSubElements(this.element);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
