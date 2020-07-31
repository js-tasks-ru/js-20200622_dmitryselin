import RangePicker from './components/range-picker/src/index.js';
import SortableTable from './components/sortable-table/src/index.js';
import ColumnChart from './components/column-chart/src/index.js';
import header from './bestsellers-header.js';

import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru/';
const API_DASHBOARD_PATH = 'api/dashboard';
const SORTABLE_TABLE_PAGINATION = {
  start: 0,
  step: 30,
};

export default class Page {
  element;
  subElements = {};
  components = {};

  async updateComponents(from, to) {
    const url = this.getBestSellersUrl(from, to);
    url.searchParams.set('_start', SORTABLE_TABLE_PAGINATION.start.toString());
    url.searchParams.set('_end', (SORTABLE_TABLE_PAGINATION.start + SORTABLE_TABLE_PAGINATION.step).toString());
    const data = await fetchJson(url);

    const { sortableTable, ordersChart, salesChart, customersChart } = this.components;
    sortableTable.addRows(data);
    await Promise.all([ordersChart, salesChart, customersChart].map(chart => chart.update(from, to)));
  }

  getBestSellersUrl(from, to) {
    const url = new URL(`${API_DASHBOARD_PATH}/bestsellers`, BACKEND_URL);
    url.searchParams.set('from', from.toISOString());
    url.searchParams.set('to', to.toISOString());
    return url;
  }

  initComponents() {
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - 1);

    const rangePicker = new RangePicker({ from, to });

    const url = this.getBestSellersUrl(from, to);
    const sortableTable = new SortableTable(header, {
      url: `${url.pathname}${url.search}`,
      isSortLocally: true,
      start: SORTABLE_TABLE_PAGINATION.start,
      step: SORTABLE_TABLE_PAGINATION.step,
    });

    const ordersChart = new ColumnChart({
      url: `${API_DASHBOARD_PATH}/orders`,
      range: { from, to },
      label: 'orders',
      link: '#',
    });

    const salesChart = new ColumnChart({
      url: `${API_DASHBOARD_PATH}/sales`,
      range: { from, to },
      label: 'sales',
    });

    const customersChart = new ColumnChart({
      url: `${API_DASHBOARD_PATH}/customers`,
      range: { from, to },
      label: 'customers',
    });

    this.components = {
      rangePicker,
      sortableTable,
      ordersChart,
      salesChart,
      customersChart,
    };
  }

  get template() {
    return `
      <div class="dashboard">
        <div class="content__top-panel">
          <h2 class="page-title">Dashboard</h2>
          <div data-element="rangePicker"></div>
        </div>

        <div data-element="chartsRoot" class="dashboard__charts">
          <div data-element="ordersChart" class="dashboard__chart_orders"></div>
          <div data-element="salesChart" class="dashboard__chart_sales"></div>
          <div data-element="customersChart" class="dashboard__chart_customers"></div>
        </div>

        <h3 class="block-title">Best sellers</h3>

        <div data-element="sortableTable"></div>
      </div>
    `;
  }

  initEventListeners() {
    this.components.rangePicker.element.addEventListener('date-select', this.onDateSelect);
  }

  onDateSelect = async event => {
    const { from, to } = event.detail;
    await this.updateComponents(from, to);
  }

  render() {
    const element = document.createElement('div');
    element.innerHTML = this.template;
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.initComponents();
    this.renderComponents();
    this.initEventListeners();

    return this.element;
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  renderComponents() {
    Object.keys(this.components).forEach(component => {
      const root = this.subElements[component];
      const { element } = this.components[component];
      root.append(element);
    });
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
    for (const component of Object.values(this.components)) component.destroy();
  }
}
