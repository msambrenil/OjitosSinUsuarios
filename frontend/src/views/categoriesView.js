// frontend/src/views/categoriesView.js

let categories = [];
let editingCategory = null;

function renderCategoryForm(category = {}) {
    editingCategory = category.id ? category : null;
    return `
        <h4>${editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h4>
        <form id="categoryForm" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; max-width: 400px;">
            <input type="hidden" name="id" value="${category.id || ''}">
            <md-outlined-text-field label="Nombre de la Categoría" name="name" value="${category.name || ''}" required></md-outlined-text-field>
            <md-outlined-text-field label="URL de Imagen (Opcional)" name="imageUrl" value="${category.imageUrl || ''}"></md-outlined-text-field>
            <div>
                <md-filled-button type="submit">${editingCategory ? 'Actualizar' : 'Crear'}</md-filled-button>
                ${editingCategory ? '<md-outlined-button type="button" id="cancelEditCategoryBtn" style="margin-left: 8px;">Cancelar</md-outlined-button>' : ''}
            </div>
        </form>
        <div id="categoryMessage" style="margin-bottom: 16px;"></div>
    `;
}

function renderCategoriesList(categoriesToRender) {
    if (!categoriesToRender || categoriesToRender.length === 0) {
        return '<p>No hay categorías para mostrar.</p>';
    }
    let listHtml = `
        <h4>Listado de Categorías</h4>
        <div class="category-list" style="display: flex; flex-direction: column; gap: 8px;">
    `;
    categoriesToRender.forEach(cat => {
        listHtml += `
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 8px;">
                ${cat.imageUrl ? `<img src="${cat.imageUrl}" alt="${cat.name}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">` : '<div style="width: 40px; height: 40px; background-color: #eee; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.8em;">SinImg</div>'}
                <span style="flex-grow: 1;">${cat.name}</span>
                <md-icon-button class="edit-category-btn" data-id="${cat.id}"><md-icon>edit</md-icon></md-icon-button>
                <md-icon-button class="delete-category-btn" data-id="${cat.id}"><md-icon>delete</md-icon></md-icon-button>
            </div>
        `;
    });
    listHtml += `</div>`;
    return listHtml;
}

export function renderCategoriesView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "categories-view-container";
    viewContainer.innerHTML = `<h2>Gestión de Categorías</h2>`;

    const formContainer = document.createElement('div');
    formContainer.id = "category-form-container";
    formContainer.innerHTML = renderCategoryForm();

    const listContainer = document.createElement('div');
    listContainer.id = "categories-list-container";
    listContainer.innerHTML = '<p>Cargando categorías...</p>';

    viewContainer.appendChild(formContainer);
    viewContainer.appendChild(listContainer);

    function refreshCategoriesList() {
        fetch('/api/categories')
            .then(response => response.json())
            .then(data => {
                categories = data;
                listContainer.innerHTML = renderCategoriesList(categories);
                attachListEventListeners();
            })
            .catch(error => {
                console.error('Error cargando categorías:', error);
                listContainer.innerHTML = '<p>Error al cargar categorías.</p>';
            });
    }

    function attachFormEventListeners() {
        const categoryForm = formContainer.querySelector('#categoryForm');
        const categoryMessage = formContainer.querySelector('#categoryMessage');

        if (categoryForm) {
            categoryForm.addEventListener('submit', (event) => {
                event.preventDefault();
                categoryMessage.textContent = 'Guardando...';
                const formData = new FormData(categoryForm);
                const dataToSave = {
                    name: formData.get('name'),
                    imageUrl: formData.get('imageUrl')
                };

                const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
                const method = editingCategory ? 'PUT' : 'POST';

                fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                })
                .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, body: data })))
                .then(res => {
                    if (res.ok) {
                        categoryMessage.textContent = res.body.message || (editingCategory ? 'Categoría actualizada.' : 'Categoría creada.');
                        categoryMessage.style.color = 'green';
                        formContainer.innerHTML = renderCategoryForm(); // Reset form
                        attachFormEventListeners();
                        refreshCategoriesList();
                    } else {
                        categoryMessage.textContent = `Error: ${res.body.error || 'No se pudo guardar la categoría.'}`;
                        categoryMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    console.error('Error guardando categoría:', error);
                    categoryMessage.textContent = 'Error al guardar la categoría.';
                    categoryMessage.style.color = 'red';
                });
            });
        }
        const cancelBtn = formContainer.querySelector('#cancelEditCategoryBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                formContainer.innerHTML = renderCategoryForm();
                attachFormEventListeners();
            });
        }
    }

    function attachListEventListeners() {
        listContainer.querySelectorAll('.edit-category-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Necesitamos obtener el data-id del botón, no del icono interno si existe
                const categoryId = parseInt(e.currentTarget.dataset.id, 10);
                const categoryToEdit = categories.find(c => c.id === categoryId);
                if (categoryToEdit) {
                    formContainer.innerHTML = renderCategoryForm(categoryToEdit);
                    attachFormEventListeners();
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        listContainer.querySelectorAll('.delete-category-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const categoryId = e.currentTarget.dataset.id;
                const categoryToDelete = categories.find(c => c.id === parseInt(categoryId));
                if (confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete.name}"?`)) {
                    fetch(`/api/categories/${categoryId}`, { method: 'DELETE' })
                    .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, body: data })))
                    .then(res => {
                        if (res.ok) {
                            alert(res.body.message);
                            refreshCategoriesList();
                        } else {
                            alert(`Error: ${res.body.error || 'No se pudo eliminar la categoría.'}`);
                        }
                    })
                    .catch(error => {
                         console.error('Error eliminando categoría:', error);
                         alert('Error al eliminar la categoría.');
                    });
                }
            });
        });
    }

    refreshCategoriesList();
    attachFormEventListeners();
    return viewContainer;
}
