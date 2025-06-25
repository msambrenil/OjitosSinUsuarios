// frontend/src/views/productsView.js

let products = []; // Cache local de productos
let allTags = []; // Cache local de todos los tags disponibles
let allCategories = []; // Cache local de todas las categorías disponibles
let editingProduct = null; // Producto que se está editando, o null si es nuevo

async function fetchAllTags() {
    try {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Error al cargar tags');
        allTags = await response.json();
    } catch (error) {
        console.error("Error fetching tags:", error);
        allTags = []; // Resetear en caso de error
    }
}

async function fetchAllCategories() {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) throw new Error('Error al cargar categorías');
        allCategories = await response.json();
    } catch (error) {
        console.error("Error fetching categories:", error);
        allCategories = [];
    }
}

function renderTagsSelector(productTags = []) {
    if (!allTags || allTags.length === 0) return '<p>No hay tags disponibles. Por favor, cree algunos en la sección "Gestión de Tags".</p>';

    const productTagIds = productTags.map(t => t.id);

    let tagsHtml = '<h4>Tags:</h4><div class="tags-selector" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">';
    allTags.forEach(tag => {
        const isSelected = productTagIds.includes(tag.id);
        tagsHtml += `
            <md-filter-chip
                label="${tag.name}"
                value="${tag.id}"
                ${isSelected ? 'selected' : ''}
                data-tag-id="${tag.id}">
            </md-filter-chip>
        `;
    });
    tagsHtml += '</div>';
    return tagsHtml;
}


function renderCategoriesSelector(productCategories = []) {
    if (!allCategories || allCategories.length === 0) return '<p>No hay categorías disponibles. Cree algunas en "Gestión de Categorías".</p>';

    const productCategoryIds = productCategories.map(c => c.id);

    let categoriesHtml = '<h4>Categorías:</h4><div class="categories-selector" style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">';
    allCategories.forEach(category => {
        const isSelected = productCategoryIds.includes(category.id);
        categoriesHtml += `
            <md-filter-chip
                label="${category.name}"
                value="${category.id}"
                ${isSelected ? 'selected' : ''}
                data-category-id="${category.id}">
            </md-filter-chip>
        `;
    });
    categoriesHtml += '</div>';
    return categoriesHtml;
}

function renderProductForm(product = {}) {
    editingProduct = product.id ? product : null;
    const productCurrentTags = product.tags || [];
    const productCurrentCategories = product.categories || [];

    return `
        <h3>${editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h3>
        <form id="productForm">
            <input type="hidden" name="id" value="${product.id || ''}">
            <md-outlined-text-field label="Nombre del Producto" name="name" value="${product.name || ''}" required></md-outlined-text-field>
            <md-outlined-text-field label="Precio Revista" name="priceRevista" type="number" step="0.01" value="${product.priceRevista || ''}"></md-outlined-text-field>
            <md-outlined-text-field label="Precio Showroom" name="priceShowroom" type="number" step="0.01" value="${product.priceShowroom || ''}" required></md-outlined-text-field>
            <md-outlined-text-field label="Precio Feria" name="priceFeria" type="number" step="0.01" value="${product.priceFeria || ''}"></md-outlined-text-field>
            <md-outlined-text-field label="Stock Actual" name="stockActual" type="number" value="${product.stockActual || 0}" required></md-outlined-text-field>
            <md-outlined-text-field label="Stock Crítico" name="stockCritico" type="number" value="${product.stockCritico || 1}" required></md-outlined-text-field>
            <md-outlined-text-field label="URL Imagen Principal" name="imageUrl" value="${product.imageUrl || ''}"></md-outlined-text-field>
            <md-outlined-text-field label="URL Imagen Catálogo (Opcional)" name="catalogImageUrl" value="${product.catalogImageUrl || ''}"></md-outlined-text-field>
            <md-outlined-text-field label="Precio Catálogo (Opcional)" name="catalogPrice" type="number" step="0.01" value="${product.catalogPrice || ''}"></md-outlined-text-field>

            <div id="tags-form-section">
                ${renderTagsSelector(productCurrentTags)}
            </div>
            <div id="categories-form-section">
                ${renderCategoriesSelector(productCurrentCategories)}
            </div>

            <div style="margin-top:16px;">
                <md-filled-button type="submit">${editingProduct ? 'Actualizar Producto' : 'Crear Producto'}</md-filled-button>
                ${editingProduct ? '<md-outlined-button type="button" id="cancelEditBtn">Cancelar Edición</md-outlined-button>' : ''}
            </div>
        </form>
        <div id="productMessage" style="margin-top: 16px;"></div>
    `;
}

function renderProductsTable(productsToRender) {
    if (!productsToRender || productsToRender.length === 0) {
        return '<p>No hay productos para mostrar.</p>';
    }
    let tableHtml = `
        <h3>Listado de Productos</h3>
        <div style="overflow-x: auto;">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>P. Showroom</th>
                    <th>Stock</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    productsToRender.forEach(p => {
        tableHtml += `
            <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>${p.priceShowroom}</td>
                <td style="${p.stockActual <= p.stockCritico ? 'color:red; font-weight:bold;' : ''}">${p.stockActual} ${p.stockActual <= p.stockCritico ? '(Crítico)' : ''}</td>
                <td>
                    <md-text-button class="edit-btn" data-id="${p.id}">Editar</md-text-button>
                    <md-text-button class="delete-btn" data-id="${p.id}" style="color:red;">Eliminar</md-text-button>
                </td>
            </tr>
        `;
    });
    tableHtml += `
            </tbody>
        </table>
        </div>
    `;
    return tableHtml;
}

export function renderProductsView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "products-view-container"; // Para poder refrescarla

    const formContainer = document.createElement('div');
    formContainer.id = "product-form-container";
    // formContainer.innerHTML = renderProductForm(); // Se renderizará después de cargar los tags

    const tableContainer = document.createElement('div');
    tableContainer.id = "products-table-container";
    tableContainer.innerHTML = '<p>Cargando productos...</p>';

    viewContainer.appendChild(formContainer);
    viewContainer.appendChild(tableContainer);

    function refreshTable() {
        fetch('/api/products')
            .then(response => response.json())
            .then(data => {
                products = data;
                tableContainer.innerHTML = renderProductsTable(products);
                attachTableEventListeners();
            })
            .catch(error => {
                console.error('Error cargando productos:', error);
                tableContainer.innerHTML = '<p>Error al cargar productos.</p>';
            });
    }

    function attachFormEventListeners() {
        const productForm = formContainer.querySelector('#productForm');
        const productMessage = formContainer.querySelector('#productMessage');

        if (productForm) {
            productForm.addEventListener('submit', (event) => {
                event.preventDefault();
                productMessage.textContent = 'Guardando...';
                const formData = new FormData(productForm);
                const dataToSave = {};
                formData.forEach((value, key) => {
                    if (['priceRevista', 'priceShowroom', 'priceFeria', 'catalogPrice'].includes(key) && value) {
                        dataToSave[key] = parseFloat(value);
                    } else if (['stockActual', 'stockCritico'].includes(key) && value) {
                        dataToSave[key] = parseInt(value, 10);
                    } else if (key !== 'id' || value) { // No incluir 'id' si está vacío (nuevo producto)
                        dataToSave[key] = value;
                    }
                });

                // Recolectar IDs de tags seleccionados
                const selectedTagChips = formContainer.querySelectorAll('.tags-selector md-filter-chip[selected]');
                dataToSave.tag_ids = Array.from(selectedTagChips).map(chip => parseInt(chip.dataset.tagId, 10));

                // Recolectar IDs de categorías seleccionadas
                const selectedCategoryChips = formContainer.querySelectorAll('.categories-selector md-filter-chip[selected]');
                dataToSave.category_ids = Array.from(selectedCategoryChips).map(chip => parseInt(chip.dataset.categoryId, 10));

                const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
                const method = editingProduct ? 'PUT' : 'POST';

                fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                })
                .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, body: data })))
                .then(res => {
                    if (res.ok) {
                        productMessage.textContent = res.body.message || (editingProduct ? 'Producto actualizado.' : 'Producto creado.');
                        productMessage.style.color = 'green';
                        formContainer.innerHTML = renderProductForm(); // Resetear formulario (o cargar el producto editado)
                        attachFormEventListeners(); // Re-adjuntar listeners al nuevo form
                        refreshTable(); // Recargar tabla
                    } else {
                        productMessage.textContent = `Error: ${res.body.error || 'No se pudo guardar el producto.'}`;
                        productMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    console.error('Error guardando producto:', error);
                    productMessage.textContent = 'Error al guardar el producto.';
                    productMessage.style.color = 'red';
                });
            });
        }

        const cancelEditBtn = formContainer.querySelector('#cancelEditBtn');
        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                formContainer.innerHTML = renderProductForm(); // Resetear a formulario de nuevo producto
                attachFormEventListeners();
            });
        }
    }

    function attachTableEventListeners() {
        tableContainer.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = parseInt(e.target.dataset.id, 10);
                const productToEdit = products.find(p => p.id === productId);
                if (productToEdit) {
                    formContainer.innerHTML = renderProductForm(productToEdit);
                    attachFormEventListeners(); // Re-adjuntar listeners al nuevo form
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        tableContainer.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const productId = e.target.dataset.id;
                if (confirm(`¿Estás seguro de que quieres eliminar el producto ID ${productId}?`)) {
                    fetch(`/api/products/${productId}`, { method: 'DELETE' })
                    .then(response => response.json())
                    .then(res => {
                        alert(res.message);
                        refreshTable();
                    })
                    .catch(error => {
                         console.error('Error eliminando producto:', error);
                         alert('Error al eliminar el producto.');
                    });
                }
            });
        });
    }

    // Carga inicial y configuración de listeners
    async function initializeView() {
        formContainer.innerHTML = '<p>Cargando formulario y datos maestros...</p>';
        await Promise.all([fetchAllTags(), fetchAllCategories()]); // Cargar tags y categorías en paralelo
        formContainer.innerHTML = renderProductForm(); // Renderizar form inicial
        attachFormEventListeners();
        refreshTable(); // Cargar tabla de productos
    }

    initializeView();

    return viewContainer;
}
