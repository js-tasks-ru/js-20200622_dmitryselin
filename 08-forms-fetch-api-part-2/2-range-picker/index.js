export default class RangePicker {
  element;
  subElements = {};

  onDocumentClick = (event) => {
    if (event.target.closest('.rangepicker__selector') === this.subElements.selector) {
      this.handleSelectorClick(event);
    }
    else if (event.target.closest('.rangepicker__input') === this.subElements.input) {
      this.onInputClick();
      event.stopPropagation();
    }
    else {
      this.element.classList.remove('rangepicker_open');
    }
  }

  onInputClick = (event) => {
    if (this.element.classList.contains('rangepicker_open')) {
      this.element.classList.remove('rangepicker_open');
    } else {
      if (!this.subElements.selector.innerHTML) this.subElements.selector.innerHTML = this.getSelectorContent();
      this.element.classList.add('rangepicker_open');
    }
  }

  constructor({
    from,
    to,
  } = {}) {
    this.dateFrom = from;
    this.dateTo = to;
    this.selectedDates = [this.dateFrom, this.dateTo];
    this.calendarStartDate = new Date(this.dateFrom);
    this.calendarStartDate.setDate(1);
    this.render();
  }

  handleSelectorClick = (event) => {
    const target = event.target;
    if (target.className === 'rangepicker__selector-control-left') return this.handleLeftArrowClick();
    else if (target.className === 'rangepicker__selector-control-right') return this.handleRightArrowClick();
    else if ([...target.classList].includes('rangepicker__cell')) return this.handleCellClick(event);
  }

  handleLeftArrowClick = () => {
    this.calendarStartDate.setMonth(this.calendarStartDate.getMonth() - 1);
    this.updateSelectorContent();
  }

  handleRightArrowClick = () => {
    this.calendarStartDate.setMonth(this.calendarStartDate.getMonth() + 1);
    this.updateSelectorContent();
  }

  handleCellClick = (event) => {
    const cell = event.target.closest('.rangepicker__cell');
    const cellDate = new Date(cell.dataset.value);

    if (this.selectedDates.length === 2) {
      this.dateTo = null;
      this.selectedDates = [cellDate];
      this.dateFrom = cellDate;
      this.updateCells();
    } else if (this.selectedDates.length === 1) {
      this.selectedDates.push(cellDate);
      this.selectedDates.sort(this.compareDates);
      this.dateFrom = this.selectedDates[0];
      this.dateTo = this.selectedDates[1];
      this.updateCells();
      this.updateInput();
      this.element.classList.remove('rangepicker_open');

      this.element.dispatchEvent(new CustomEvent('date-select', {
        detail: {
          from: this.dateFrom,
          to: this.dateTo,
        },
      }));
    }
  }

  updateCells() {
    const cells = this.subElements.selector.querySelectorAll('.rangepicker__cell');
    for (const cell of cells) {
      const cellDate = new Date(cell.dataset.value);
      cell.className = this.getCellClass(cellDate);
    }
  }

  updateInput() {
    this.subElements.from.textContent = this.getInputFormattedDate(this.dateFrom);
    this.subElements.to.textContent = this.getInputFormattedDate(this.dateTo);
  }

  updateSelectorContent() {
    const calendars = this.subElements.selector.querySelectorAll('.rangepicker__calendar');
    calendars[0].innerHTML = this.getLeftCalendarContent();
    calendars[1].innerHTML = this.getRightCalendarContent();
  }

  get template() {
    return `
      <div class="rangepicker">
        <div class="rangepicker__input" data-element="input">
          <span data-element="from"></span> -
          <span data-element="to"></span>
        </div>
        <div class="rangepicker__selector" data-element="selector"></div>
      </div>
    `;
  }

  getInputFormattedDate(date) {
    const addZeroPrefix = value => {
      const valueStr = value.toString();
      return valueStr.length === 2 ? valueStr : `0${valueStr}`;
    };
    return `${addZeroPrefix(date.getDate())}.${addZeroPrefix(date.getMonth() + 1)}.${date.getFullYear()}`;
  }

  getSelectorContent() {
    return `
      <div class="rangepicker__selector-arrow"></div>
      <div class="rangepicker__selector-control-left"></div>
      <div class="rangepicker__selector-control-right"></div>
      <div class="rangepicker__calendar">${this.getLeftCalendarContent()}</div>
      <div class="rangepicker__calendar">${this.getRightCalendarContent()}</div>
    `;
  }

  getLeftCalendarContent() {
    return this.getCalendarContent(this.calendarStartDate);
  }

  getRightCalendarContent() {
    const rightCalendarStartDate = new Date(this.calendarStartDate);
    rightCalendarStartDate.setMonth(rightCalendarStartDate.getMonth() + 1);
    return this.getCalendarContent(rightCalendarStartDate);
  }

  getCalendarContent(startDate) {
    const monthName = startDate.toLocaleString('ru', { month: 'long' });

    return `
      <div class="rangepicker__month-indicator">
        <time datetime="${monthName}">${monthName}</time>
      </div>
      <div class="rangepicker__day-of-week">
        <div>Пн</div>
        <div>Вт</div>
        <div>Ср</div>
        <div>Чт</div>
        <div>Пт</div>
        <div>Сб</div>
        <div>Вс</div>
      </div>
      <div class="rangepicker__date-grid">
        ${this.getDateGridContent(startDate)}
      </div>
    `;
  }

  getDateGridContent(startDate) {
    const gridCells = [];
    const month = startDate.getMonth();
    const currentDate = new Date(startDate);

    while (currentDate.getMonth() === month) {
      gridCells.push(this.getGridCell(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return gridCells.join('');
  }

  getGridCell(date) {
    const style = date.getDate() === 1 ? `style="--start-from: ${date.getDay()}"` : '';

    return `
      <button type="button" class="${this.getCellClass(date)}" data-value="${date.toISOString()}" ${style}>
        ${date.getDate()}
      </button>
    `;
  }

  getCellClass(date) {
    let result = "rangepicker__cell";
    if (!this.compareDates(date, this.dateFrom)) result += ' rangepicker__selected-from';
    if (!this.compareDates(date, this.dateTo)) result += ' rangepicker__selected-to';
    if (this.compareDates(date, this.dateFrom) === 1 && this.compareDates(date, this.dateTo) === -1) {
      result += ' rangepicker__selected-between';
    }
    return result;
  }

  compareDates(date1, date2) {
    const convertedDate1 = new Date(date1);
    convertedDate1.setHours(0, 0, 0, 0);
    const convertedDate2 = new Date(date2);
    convertedDate2.setHours(0, 0, 0, 0);

    const time1 = convertedDate1.getTime();
    const time2 = convertedDate2.getTime();

    if (time1 === time2) return 0;
    return time1 > time2 ? 1 : -1;
  }

  render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);
    this.updateInput();
    this.initEventListeners();
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  initEventListeners() {
    this.subElements.input.addEventListener('click', this.onInputClick);
    document.addEventListener('click', this.onDocumentClick, true);
  }

  removeEventListeners() {
    document.removeEventListener('click', this.onDocumentClick, true);
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.removeEventListeners();
    this.remove();
  }
}
