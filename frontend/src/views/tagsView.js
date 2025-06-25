// frontend/src/views/tagsView.js

let tags = [];
let editingTag = null;

function renderTagForm(tag = {}) {
    editingTag = tag.id ? tag : null;
    return `
        <h4>${editingTag ? 'Editar Tag' : 'Nuevo Tag'}</h4>
        <form id="tagForm" style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <input type="hidden" name="id" value="${tag.id || ''}">
            <md-outlined-text-field label="Nombre del Tag" name="name" value="${tag.name || ''}" required style="flex-grow: 1;"></md-outlined-text-field>
            <md-filled-button type="submit">${editingTag ? 'Actualizar' : 'Crear'}</md-filled-button>
            ${editingTag ? '<md-outlined-button type="button" id="cancelEditTagBtn">Cancelar</md-outlined-button>' : ''}
        </form>
        <div id="tagMessage" style="margin-bottom: 16px;"></div>
    `;
}

function renderTagsList(tagsToRender) {
    if (!tagsToRender || tagsToRender.length === 0) {
        return '<p>No hay tags para mostrar.</p>';
    }
    let listHtml = `
        <h4>Listado de Tags</h4>
        <div class="tag-list" style="display: flex; flex-wrap: wrap; gap: 8px;">
    `;
    tagsToRender.forEach(t => {
        listHtml += `
            <md-chip-set>
                <md-input-chip label="${t.name}" data-id="${t.id}">
                    <md-icon slot="icon" class="edit-tag-icon" data-id="${t.id}" style="cursor:pointer;">edit</md-icon>
                    <md-icon slot="icon" class="delete-tag-icon" data-id="${t.id}" style="cursor:pointer;">delete</md-icon>
                </md-input-chip>
            </md-chip-set>
        `;
    });
    listHtml += `</div>`;
    return listHtml;
}

export function renderTagsView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "tags-view-container";
    viewContainer.innerHTML = `<h2>Gestión de Tags</h2>`;

    const formContainer = document.createElement('div');
    formContainer.id = "tag-form-container";
    formContainer.innerHTML = renderTagForm();

    const listContainer = document.createElement('div');
    listContainer.id = "tags-list-container";
    listContainer.innerHTML = '<p>Cargando tags...</p>';

    viewContainer.appendChild(formContainer);
    viewContainer.appendChild(listContainer);

    function refreshTagsList() {
        fetch('/api/tags')
            .then(response => response.json())
            .then(data => {
                tags = data;
                listContainer.innerHTML = renderTagsList(tags);
                attachListEventListeners();
            })
            .catch(error => {
                console.error('Error cargando tags:', error);
                listContainer.innerHTML = '<p>Error al cargar tags.</p>';
            });
    }

    function attachFormEventListeners() {
        const tagForm = formContainer.querySelector('#tagForm');
        const tagMessage = formContainer.querySelector('#tagMessage');

        if (tagForm) {
            tagForm.addEventListener('submit', (event) => {
                event.preventDefault();
                tagMessage.textContent = 'Guardando...';
                const formData = new FormData(tagForm);
                const dataToSave = { name: formData.get('name') };

                const url = editingTag ? `/api/tags/${editingTag.id}` : '/api/tags';
                const method = editingTag ? 'PUT' : 'POST';

                fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                })
                .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, body: data })))
                .then(res => {
                    if (res.ok) {
                        tagMessage.textContent = res.body.message || (editingTag ? 'Tag actualizado.' : 'Tag creado.');
                        tagMessage.style.color = 'green';
                        formContainer.innerHTML = renderTagForm(); // Reset form
                        attachFormEventListeners();
                        refreshTagsList();
                    } else {
                        tagMessage.textContent = `Error: ${res.body.error || 'No se pudo guardar el tag.'}`;
                        tagMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    console.error('Error guardando tag:', error);
                    tagMessage.textContent = 'Error al guardar el tag.';
                    tagMessage.style.color = 'red';
                });
            });
        }
        const cancelBtn = formContainer.querySelector('#cancelEditTagBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                formContainer.innerHTML = renderTagForm();
                attachFormEventListeners();
            });
        }
    }

    function attachListEventListeners() {
        listContainer.querySelectorAll('.edit-tag-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const tagId = parseInt(e.target.dataset.id, 10);
                const tagToEdit = tags.find(t => t.id === tagId);
                if (tagToEdit) {
                    formContainer.innerHTML = renderTagForm(tagToEdit);
                    attachFormEventListeners();
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        listContainer.querySelectorAll('.delete-tag-icon').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const tagId = e.target.dataset.id;
                const tagToDelete = tags.find(t => t.id === parseInt(tagId));
                if (confirm(`¿Estás seguro de que quieres eliminar el tag "${tagToDelete.name}"?`)) {
                    fetch(`/api/tags/${tagId}`, { method: 'DELETE' })
                    .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, body: data })))
                    .then(res => {
                        if (res.ok) {
                            alert(res.body.message);
                            refreshTagsList();
                        } else {
                            alert(`Error: ${res.body.error || 'No se pudo eliminar el tag.'}`);
                        }
                    })
                    .catch(error => {
                         console.error('Error eliminando tag:', error);
                         alert('Error al eliminar el tag.');
                    });
                }
            });
        });
    }

    refreshTagsList();
    attachFormEventListeners();
    return viewContainer;
}
