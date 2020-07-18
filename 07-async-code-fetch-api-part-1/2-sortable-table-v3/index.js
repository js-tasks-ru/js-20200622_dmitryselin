import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';
const PAGE_SIZE = 30;

export default class SortableTable {
  element;
  subElements = {};
  data = [];
  range = {
    start: 0,
    end: PAGE_SIZE,
  };
  loading = false;

  onHeaderClick = (event) => {
    const field = event.target.closest(".sortable-table__header .sortable-table__cell").dataset.id;
    const sortable = this.headerConfig.find(item => item.id === field).sortable;
    if (!sortable) return;

    let order = 'asc';
    if (this.sorting.field === field && this.sorting.order === 'asc') order = 'desc';
    this.sorting = {field, order};
    this.range = {
      start: 0,
      end: PAGE_SIZE,
    };
    this.subElements.body.innerHTML = '';
    this.data = [];

    this.sortOnServer(field, order);
  };

  onScroll = () => {
    if (this.loading) return;
    if (this.data.length % PAGE_SIZE) return;
    if (this.element.getBoundingClientRect().bottom >= document.documentElement.clientHeight) return;

    const {start, end} = this.range;
    this.range = {
      start: start + PAGE_SIZE,
      end: end + PAGE_SIZE,
    }

    this.sortOnServer(this.sorting.field, this.sorting.order);
  }

  constructor(headerConfig = [], {
    url = '',
  }) {
    this.headerConfig = headerConfig;
    this.url = url;
    this.sorting = {
      field: this.headerConfig.find(item => item.sortable === true).id,
      order: 'asc',
    };
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
        ${this.getLoading()}
        ${this.getEmptyPlaceHolder()}
      </div>`;
  }

  getLoading() {
    return '<div data-element="loading" class="loading-line sortable-table__loading-line"></div>';
  }

  getEmptyPlaceHolder() {
    return `
      <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        <div>
          <p>Не найдено товаров удовлетворяющих выбранному критерию</p>
        </div>
      </div>`;
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.getTable(this.data);
    const element = wrapper.firstElementChild;
    this.element = element;
    this.subElements = this.getSubElements(element);
    this.subElements.header.addEventListener('pointerdown', this.onHeaderClick);
    this.addEventListeners();
    await this.sortOnServer(this.sorting.field, this.sorting.order);
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  addEventListeners() {
    this.subElements.header.addEventListener('pointerdown', this.onHeaderClick);
    window.addEventListener('scroll', this.onScroll);
  }

  removeEventListeners() {
    window.removeEventListener('scroll', this.onScroll);
  }

  sortOnServer(field, order) {
    this.element.classList.remove('sortable-table_empty');
    this.element.classList.add('sortable-table_loading');
    this.loading = true;

    const {start, end} = this.range;
    return fetchJson(this.getFullUrl(field, order, start, end))
      .then(data => {
        this.loading = false;
        this.element.classList.remove('sortable-table_loading');
        this.data.push(...data);
        if (this.data.length) {
          this.subElements.body.innerHTML = this.getTableRows(this.data);
          const allColumns = this.element.querySelectorAll('.sortable-table__cell[data-id]');
          const currentColumn = this.element.querySelector(`.sortable-table__cell[data-id="${field}"]`);
          allColumns.forEach(column => column.dataset.order = '');
          currentColumn.dataset.order = order;
        } else {
          this.element.classList.add('sortable-table_empty');
        }
      })
      .catch(err => {
        this.loading = false;
        this.element.classList.remove('sortable-table_loading');
        this.subElements.body.innerHTML = this.getTableRows(this.data);
        console.log(err);
      })
  }

  getFullUrl(field, order, start, end) {
    return `
      ${BACKEND_URL}/${this.url}?_embed=subcategory.category&_sort=${field}&_order=${order}&_start=${start}&_end=${end}
    `;
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
    this.subElements = {};
  }
}
