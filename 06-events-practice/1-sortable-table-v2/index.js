export default class SortableTable {
  element;
  subElements = {};
  headerConfig = [];
  data = [];
  eventListeners = [];

  constructor(headerConfig = [], {
    data = [],
    sortingField = null,
  } = {}) {
    this.headerConfig = headerConfig;
    this.data = data;
    this.sorting = {
      field: sortingField,
      order: 'asc',
    }
    this.render();
  }

  getTableHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">
        ${this.headerConfig.map(item => this.getHeaderRow(item)).join('')}
      </div>`;
  }

  getHeaderRow({id, title, sortable}) {
    return `
      <div class="sortable-table__cell" data-id="${id}" data-sortable="${sortable}">
        <span>${title}</span>
        ${this.getHeaderSortingArrow()}
      </div>`;
  }

  getHeaderSortingArrow() {
    return `
      <span data-element="arrow" class="sortable-table__sort-arrow">
        <span class="sort-arrow"></span>
      </span>`;
  }

  getTableBody(data) {
    return `
      <div data-element="body" class="sortable-table__body">
        ${this.getTableRows(data)}
      </div>`;
  }

  getTableRows(data) {
    return data.map(item => `
      <div class="sortable-table__row">
        ${this.getTableRow(item)}
      </div>
    `).join('');
  }

  getTableRow(item) {
    const cells = this.headerConfig.map(({id, template}) => ({
      id,
      template,
    }));

    return cells.map(({id, template}) => {
      return template
        ? template(item[id])
        : `<div class="sortable-table__cell">${item[id]}</div>`
    }).join('');
  }

  getTable(data) {
    return `
      <div class="sortable-table">
        ${this.getTableHeader()}
        ${this.getTableBody(data)}
      </div>`;
  }

  onHeaderClick = (event) => {
    const field = event.target.closest(".sortable-table__header .sortable-table__cell").dataset.id;
    const sortable = this.headerConfig.find(item => item.id === field).sortable;
    if (!sortable) return;

    let order = 'desc';
    if (this.sorting.field === field && this.sorting.order === 'desc') order = 'asc';
    this.sorting = {field, order};
    this.sort();
  };

  render() {
    const $wrapper = document.createElement('div');
    $wrapper.innerHTML = this.getTable(this.data);
    const element = $wrapper.firstElementChild;
    this.element = element;
    this.subElements = this.getSubElements(element);
    if (this.sorting.field) {
      this.sort();
    }

    const pointerDownEvent = 'pointerdown';
    this.subElements.header.addEventListener(pointerDownEvent, this.onHeaderClick);
    this.eventListeners.push({
      element: this.subElements.header,
      eventName: pointerDownEvent,
      handler: this.onHeaderClick,
    });
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');

    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  sort() {
    const {field, order} = this.sorting;
    const sortedData = this.sortData(field, order);
    const allColumns = this.element.querySelectorAll('.sortable-table__cell[data-id]');
    const currentColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);

    allColumns.forEach(column => {
      column.dataset.order = '';
    });

    currentColumn.dataset.order = order;
    this.subElements.body.innerHTML = this.getTableRows(sortedData);
  }

  sortData(field, order) {
    const arr = [...this.data];
    const column = this.headerConfig.find(item => item.id === field);
    const {sortType, customSorting} = column;
    const direction = order === 'asc' ? 1 : -1;

    return arr.sort((a, b) => {
      switch (sortType) {
        case 'number':
          return direction * (a[field] - b[field]);
        case 'string':
          return direction * a[field].localeCompare(b[field], 'ru');
        case 'custom':
          return direction * customSorting(a, b);
        default:
          return direction * (a[field] - b[field]);
      }
    });
  }

  remove() {
    this.element.remove();
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
