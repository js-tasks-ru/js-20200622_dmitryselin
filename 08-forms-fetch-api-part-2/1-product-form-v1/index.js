import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

export default class ProductForm {
  element;
  subElements = {};
  form;
  imageListContainer;
  uploadImageButton;
  fileInput;
  categories = [];
  images = [];

  onSubmit = (event) => {
    event.preventDefault();
    this.save();
  };

  onDeleteImageClick = (event) => {
    const target = event.target;
    if (target.tagName !== 'IMG' || !target.hasAttribute('data-delete-handle')) return;
    const imageListItem = event.target.closest('.sortable-list__item');
    const url = imageListItem.querySelector('input[name=url]').value;
    this.images = this.images.filter(item => item.url !== url);
    this.imageListContainer.innerHTML = this.getImages();
  };

  onUploadButtonClick = (event) => {
    this.fileInput.click();
  };

  onUploadImage = async (event) => {
    const file = this.fileInput.files[0];
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
    this.images.push({
      url,
      source: url.substring(url.lastIndexOf('/') + 1),
    });
    this.imageListContainer.innerHTML = this.getImages();
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
    this.imageListContainer = this.subElements['imageListContainer'];
    this.fileInput = this.element.querySelector('input[type=file]');
    this.uploadImageButton = this.element.querySelector('button[name=uploadImage]');

    this.initEventListeners();
    await Promise.resolve(this.updateCategories(), this.updateProduct());

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
    this.imageListContainer.addEventListener('click', this.onDeleteImageClick);
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
      const product = (await this.loadProducts())[0];
      this.form.elements.title.value = product.title;
      this.form.elements.description.value = product.description;
      this.form.elements.quantity.value = product.quantity;
      this.form.elements.price.value = product.price;
      this.form.elements.discount.value = product.discount;
      this.images = product.images;
      this.imageListContainer.innerHTML = this.getImages();
    } catch {
      this.productId = null;
    }
  }

  loadProducts() {
    const url = new URL('/api/rest/products', BACKEND_URL);
    url.searchParams.set('id', this.productId);
    return fetchJson(url);
  }

  getImages() {
    return `
      <ul class="sortable-list">
        ${this.images.map(image => this.getImage(image)).join('')}
      </ul>
    `;
  }

  getImage(image) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item">
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
      </li>
    `;
  }

  async save() {
    const { title, description, quantity, price, discount, status, subcategory: category } = this.form.elements;
    const isUpdating = !!this.productId;

    const productData = {
      title: title.value,
      description: description.value,
      quantity: +quantity.value,
      price: +price.value,
      discount: +discount.value,
      subcategory: category.value,
      status: +status.value,
      images: this.images,
    };
    if (isUpdating) productData.id = this.productId;

    const url = new URL('/api/rest/products', BACKEND_URL);
    const result = await fetchJson(url.toString(), {
      method: isUpdating ? 'PATCH' : 'PUT',
      body: JSON.stringify(productData),
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });
    if (!isUpdating) this.productId = productData.id = result.id;

    const resultEventName = isUpdating ? 'product-updated' : 'product-saved';
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
