import SortableList from './index.js';

describe('tests-for-frontend-apps/sortable-list', () => {
  let sortableList;

  const data = [1, 2, 3];

  beforeEach(() => {
    sortableList = new SortableList({
      items: data.map(item => {
        const element = document.createElement('li');

        element.innerHTML = `
          <span data-grab-handle>drag me!</span>
          <span data-delete-handle>${item} delete me!</spa>
        `;

        return element;
      })
    });

    document.body.append(sortableList.element);
  });

  afterEach(() => {
    sortableList.destroy();
    sortableList = null;
  });

  it('should be rendered correctly', () => {
    expect(sortableList.element).toBeVisible();
    expect(sortableList.element).toBeInTheDocument();
  });

  it('should render placeholder element', () => {
    const pointerdown = new MouseEvent('pointerdown', {
      bubbles: true,
      which: 1
    });
    const draggingElement = sortableList.element.querySelector('[data-grab-handle]');

    expect(sortableList.element.children.length).toBe(3);

    draggingElement.dispatchEvent(pointerdown);

    expect(sortableList.element.children.length).toBe(4);

    const placeholderElement = sortableList.element.querySelector('.sortable-list__placeholder');

    expect(placeholderElement).toBeInTheDocument();
  });

  it('should have ability to remove item from list', () => {
    const pointerdown = new MouseEvent('pointerdown', {
      bubbles: true,
      which: 1
    });

    const deleteHandle = sortableList.element.querySelector('[data-delete-handle]');

    expect(sortableList.element.children.length).toBe(3);

    deleteHandle.dispatchEvent(pointerdown);

    expect(sortableList.element.children.length).toBe(2);
  });

  it('should have ability to be removed', () => {
    sortableList.remove();

    expect(sortableList.element).not.toBeInTheDocument();
  });
});
