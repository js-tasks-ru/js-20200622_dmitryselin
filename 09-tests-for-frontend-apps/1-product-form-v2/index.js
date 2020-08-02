import fetchJson from './utils/fetch-json.js';
import SortableList from "../2-sortable-list/index.js";

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

const FIELDS = [
  { name: 'title', type: 'string' },
  { name: 'description', type: 'string' },
  { name: 'images', type: 'array' },
  { name: 'subcategory', type: 'string' },
  { name: 'price', type: 'number' },
  { name: 'discount', type: 'number' },
  { name: 'quantity', type: 'number' },
  { name: 'status', type: 'number' },
];

export default class ProductForm {
  element;
  subElements = {};
  form;
  uploadImageButton;
  fileInput;
  categories = [];
  imagesSortableList;

  onSubmit = async (event) => {
    event.preventDefault();
    await this.save();
  };

  onUploadButtonClick = () => {
    this.fileInput.click();
  };

  onUploadImage = async () => {
    const [file] = this.fileInput.files;
    const formData = new FormData();
    formData.append('image', file);

    this.uploadImageButton.classList.add('is-loading');
    const result = await fetchJson('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${IMGUR_CLIENT_ID}`,
      },
      body: formData,
    });
    this.uploadImageButton.classList.remove('is-loading');
    const url = result.data.link;

    const newImage = {
      url,
      source: file.name,
    };
    this.imagesSortableList.addItem(this.getImageListItem(newImage));
  };

  constructor(productId = null) {
    this.productId = productId;
  }

  get template() {
    return `
      <div class="product-form">
        <form data-element="productForm" name="productForm" class="form-grid"">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input required="" type="text" name="title" id="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea required="" class="form-control" name="description" id="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer"></div>
            <button type="button" name="uploadImage" class="button-primary-outline">
              <span>Загрузить</span>
            </button>
            <input type="file" hidden>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory"></select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input required="" type="number" name="price" id="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input required="" type="number" name="discount" id="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input required="" type="number" class="form-control" name="quantity" id="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select class="form-control" name="status" id="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>
    `;
  }

  async render() {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.template;
    const element = wrapper.firstElementChild;
    this.element = element;

    this.subElements = this.getSubElements(element);
    this.form = this.subElements['productForm'];
    this.fileInput = this.element.querySelector('input[type=file]');
    this.uploadImageButton = this.element.querySelector('button[name=uploadImage]');
    this.imagesSortableList = new SortableList();
    this.subElements['imageListContainer'].append(this.imagesSortableList.element);

    this.initEventListeners();
    await Promise.all([this.updateCategories(), this.updateProduct()]);
    return this.element;
  }

  getSubElements(element) {
    const elements = element.querySelectorAll('[data-element]');
    return [...elements].reduce((acc, subElement) => {
      acc[subElement.dataset.element] = subElement;
      return acc;
    }, {});
  }

  initEventListeners() {
    this.form.addEventListener('submit', this.onSubmit);
    this.uploadImageButton.addEventListener('click', this.onUploadButtonClick);
    this.fileInput.addEventListener('change', this.onUploadImage);
  }

  async updateCategories() {
    this.categories = await this.loadCategories();
    this.form.elements.subcategory.innerHTML = this.getCategories();
  }

  loadCategories() {
    const url = new URL('/api/rest/categories', BACKEND_URL);
    url.searchParams.set('_sort', 'weight');
    url.searchParams.set('_refs', 'subcategory');
    return fetchJson(url);
  }

  getCategories() {
    return this.categories.map(category => this.getSubCategories(category)).join('');
  }

  getSubCategories(category) {
    return category.subcategories.map(item => {
      return `<option value="${item.id}">${category.title} > ${item.title}</option>`;
    }).join('');
  }

  async updateProduct() {
    if (!this.productId) return;
    try {
      const [product] = await this.loadProducts();

      const fields = FIELDS.filter(field => field.name !== 'subcategory' && field.name !== 'images');
      fields.forEach(field => {
        const fieldName = field.name;
        this.form.elements[fieldName].value = product[fieldName];
      });

      product.images.forEach(image => this.imagesSortableList.addItem(this.getImageListItem(image)));
    } catch {
      this.productId = null;
    }
  }

  loadProducts() {
    const url = new URL('/api/rest/products', BACKEND_URL);
    url.searchParams.set('id', this.productId);
    return fetchJson(url);
  }

  getImageListItem(image) {
    const item = document.createElement('li');
    item.className = 'products-edit__imagelist-item sortable-list__item';
    item.innerHTML = `
      <input type="hidden" name="url" value="${image.url}">
      <input type="hidden" name="source" value="${image.source}">
      <span>
        <img src="icon-grab.svg" data-grab-handle="" alt="grab">
        <img class="sortable-table__cell-img" alt="Image" src="${image.url}">
        <span>${image.source}</span>
      </span>
      <button type="button">
        <img src="icon-trash.svg" data-delete-handle="" alt="delete">
      </button>
    `;
    return item;
  }

  getImage(imageListItem) {
    const url = imageListItem.querySelector('input[name=url]').value;
    const source = imageListItem.querySelector('input[name=source]').value;
    return { url, source };
  }

  async save() {
    const isExistingProduct = !!this.productId;

    const fields = FIELDS.filter(field => field.name !== 'images');
    const productData = {};
    fields.forEach(field => {
      const fieldName = field.name;
      const fieldData = this.form.elements[fieldName].value;
      productData[fieldName] = field.type === 'number' ? parseInt(fieldData) : fieldData;
    });
    const imageListItems = this.imagesSortableList.getItems();
    productData.images = imageListItems.map(item => this.getImage(item));
    if (isExistingProduct) productData.id = this.productId;

    const url = new URL('/api/rest/products', BACKEND_URL);
    const result = await fetchJson(url.toString(), {
      method: isExistingProduct ? 'PATCH' : 'PUT',
      body: JSON.stringify(productData),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });
    if (!isExistingProduct) {
      productData.id = result.id;
      this.productId = result.id;
    }

    const resultEventName = isExistingProduct ? 'product-updated' : 'product-saved';
    this.element.dispatchEvent(new CustomEvent(resultEventName, {
      detail: productData,
    }));
  }

  remove() {
    this.element.remove();
  }

  destroy() {
    this.remove();
  }
}
