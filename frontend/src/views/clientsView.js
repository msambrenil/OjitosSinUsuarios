// frontend/src/views/clientsView.js

let clients = [];
let editingClient = null;
let searchTerm = '';

const genderOptions = [
    { value: '', label: 'No especificado' },
    { value: 'F', label: 'Femenino' },
    { value: 'M', label: 'Masculino' },
    { value: 'Otro', label: 'Otro' }
];

const clientLevelOptions = [
    { value: 'Nuevo', label: 'Nuevo' },
    { value: 'Frecuente', label: 'Frecuente' },
    { value: 'VIP', label: 'VIP' }
];

function renderClientForm(client = {}) {
    editingClient = client.id ? client : null;
    return `
        <h4>${editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}</h4>
        <form id="clientForm" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px; max-width: 500px;">
            <input type="hidden" name="id" value="${client.id || ''}">
            <md-outlined-text-field label="Nombre Completo" name="name" value="${client.name || ''}" required></md-outlined-text-field>
            <md-outlined-text-field label="Apodo (Opcional)" name="nickname" value="${client.nickname || ''}"></md-outlined-text-field>
            <md-outlined-text-field label="WhatsApp (ej: 54911...)" name="whatsapp" value="${client.whatsapp || ''}"></md-outlined-text-field>
            <md-outlined-text-field label="Email (Opcional)" name="email" type="email" value="${client.email || ''}"></md-outlined-text-field>

            <md-outlined-select label="Género" name="gender" value="${client.gender || ''}">
                ${genderOptions.map(opt => `<md-select-option value="${opt.value}" ${client.gender === opt.value ? 'selected' : ''}>${opt.label}</md-select-option>`).join('')}
            </md-outlined-select>

            <md-outlined-select label="Nivel de Cliente" name="clientLevel" value="${client.clientLevel || 'Nuevo'}">
                 ${clientLevelOptions.map(opt => `<md-select-option value="${opt.value}" ${client.clientLevel === opt.value ? 'selected' : ''}>${opt.label}</md-select-option>`).join('')}
            </md-outlined-select>

            <md-outlined-text-field label="URL Imagen de Perfil (Opcional)" name="profileImageUrl" value="${client.profileImageUrl || ''}"></md-outlined-text-field>
            <div>
                <md-filled-button type="submit">${editingClient ? 'Actualizar' : 'Crear'}</md-filled-button>
                ${editingClient ? '<md-outlined-button type="button" id="cancelEditClientBtn" style="margin-left: 8px;">Cancelar</md-outlined-button>' : ''}
            </div>
        </form>
        <div id="clientMessage" style="margin-bottom: 16px;"></div>
    `;
}

function renderClientsTable(clientsToRender) {
    if (!clientsToRender || clientsToRender.length === 0) {
        return '<p>No hay clientes para mostrar.</p>';
    }
    let tableHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <h4>Listado de Clientes</h4>
            <md-outlined-text-field id="clientSearch" label="Buscar cliente..." value="${searchTerm}" style="width: 250px;"></md-outlined-text-field>
        </div>
        <div style="overflow-x: auto;">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Apodo</th>
                    <th>WhatsApp</th>
                    <th>Nivel</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    clientsToRender.forEach(c => {
        tableHtml += `
            <tr>
                <td>${c.id}</td>
                <td>${c.name}</td>
                <td>${c.nickname || '-'}</td>
                <td>
                    ${c.whatsapp ? `<a href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank">${c.whatsapp} <md-icon style="font-size:1em; vertical-align:middle;">open_in_new</md-icon></a>` : '-'}
                </td>
                <td>${c.clientLevel}</td>
                <td>
                    <md-icon-button class="edit-client-btn" data-id="${c.id}" title="Editar"><md-icon>edit</md-icon></md-icon-button>
                    <md-icon-button class="delete-client-btn" data-id="${c.id}" title="Eliminar"><md-icon>delete</md-icon></md-icon-button>
                    <md-icon-button class="history-client-btn" data-id="${c.id}" title="Ver Historial"><md-icon>history</md-icon></md-icon-button>
                    ${c.email ? `<md-icon-button title="Enviar Email" onclick="window.location='mailto:${c.email}'"><md-icon>email</md-icon></md-icon-button>` : ''}
                </td>
            </tr>
        `;
    });
    tableHtml += `
            </tbody>
        </table>
        </div>
        <div id="clientSalesHistoryModal" class="modal" style="display:none;">
            <div class="modal-content" style="background: var(--md-sys-color-surface-container-high); padding:20px; border-radius:8px; max-width: 700px; margin: 5% auto;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>Historial de Compras</h4>
                    <md-icon-button id="closeSalesHistoryModal"><md-icon>close</md-icon></md-icon-button>
                </div>
                <div id="clientSalesHistoryContent"></div>
            </div>
        </div>
        <style>
            .modal { position: fixed; z-index: 100; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4); }
            /* Otros estilos para modal-content según necesidad */
        </style>
    `;
    return tableHtml;
}

async function showClientSalesHistory(clientId, clientName) {
    const modal = document.getElementById('clientSalesHistoryModal');
    const contentDiv = document.getElementById('clientSalesHistoryContent');
    const modalTitle = modal.querySelector('h4');

    modalTitle.textContent = `Historial de Compras - ${clientName}`;
    contentDiv.innerHTML = '<p>Cargando historial...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch(`/api/sales?client_id=${clientId}`);
        if (!response.ok) throw new Error('Error al cargar el historial de ventas.');
        const salesHistory = await response.json();

        if (salesHistory.length === 0) {
            contentDiv.innerHTML = '<p>Este cliente no tiene ventas registradas.</p>';
        } else {
            let historyHtml = '<table><thead><tr><th>ID Venta</th><th>Fecha</th><th>Total</th><th>Estado</th><th>Items</th></tr></thead><tbody>';
            salesHistory.forEach(sale => {
                historyHtml += `
                    <tr>
                        <td>${sale.id}</td>
                        <td>${new Date(sale.saleDate).toLocaleDateString()}</td>
                        <td>$${sale.totalAmount.toFixed(2)}</td>
                        <td>${sale.status}</td>
                        <td>${sale.items.map(item => `${item.quantity}x ${item.product_name}`).join('<br>')}</td>
                    </tr>
                `;
            });
            historyHtml += '</tbody></table>';
            contentDiv.innerHTML = historyHtml;
        }
    } catch (error) {
        console.error("Error fetching client sales history:", error);
        contentDiv.innerHTML = `<p>${error.message}</p>`;
    }

    document.getElementById('closeSalesHistoryModal').onclick = () => {
        modal.style.display = 'none';
    };
    window.onclick = (event) => { // Cerrar si se hace clic fuera del modal
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}


export function renderClientsView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "clients-view-container";
    viewContainer.innerHTML = `<h2>Gestión de Clientes</h2>`;

    const formContainer = document.createElement('div');
    formContainer.id = "client-form-container";
    formContainer.innerHTML = renderClientForm();

    const tableContainer = document.createElement('div');
    tableContainer.id = "clients-table-container";
    tableContainer.innerHTML = '<p>Cargando clientes...</p>';

    viewContainer.appendChild(formContainer);
    viewContainer.appendChild(tableContainer);

    function filterClients() {
        const lowerSearchTerm = searchTerm.toLowerCase();
        const filtered = clients.filter(client =>
            (client.name && client.name.toLowerCase().includes(lowerSearchTerm)) ||
            (client.nickname && client.nickname.toLowerCase().includes(lowerSearchTerm)) ||
            (client.whatsapp && client.whatsapp.includes(lowerSearchTerm)) ||
            (client.email && client.email.toLowerCase().includes(lowerSearchTerm))
        );
        tableContainer.innerHTML = renderClientsTable(filtered);
        attachTableEventListeners(); // Re-attach listeners for table and search
    }

    function refreshClientsList() {
        fetch('/api/clients')
            .then(response => response.json())
            .then(data => {
                clients = data;
                filterClients(); // Render with current search term
            })
            .catch(error => {
                console.error('Error cargando clientes:', error);
                tableContainer.innerHTML = '<p>Error al cargar clientes.</p>';
            });
    }

    function attachFormEventListeners() {
        const clientForm = formContainer.querySelector('#clientForm');
        const clientMessage = formContainer.querySelector('#clientMessage');

        if (clientForm) {
            clientForm.addEventListener('submit', (event) => {
                event.preventDefault();
                clientMessage.textContent = 'Guardando...';
                const formData = new FormData(clientForm);
                const dataToSave = {};
                formData.forEach((value, key) => dataToSave[key] = value);

                const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
                const method = editingClient ? 'PUT' : 'POST';

                fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSave),
                })
                .then(response => response.json().then(data => ({ ok: response.ok, body: data })))
                .then(res => {
                    if (res.ok) {
                        clientMessage.textContent = res.body.message || (editingClient ? 'Cliente actualizado.' : 'Cliente creado.');
                        clientMessage.style.color = 'green';
                        formContainer.innerHTML = renderClientForm();
                        attachFormEventListeners();
                        refreshClientsList();
                    } else {
                        clientMessage.textContent = `Error: ${res.body.error || 'No se pudo guardar el cliente.'}`;
                        clientMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    console.error('Error guardando cliente:', error);
                    clientMessage.textContent = 'Error al guardar el cliente.';
                    clientMessage.style.color = 'red';
                });
            });
        }
        const cancelBtn = formContainer.querySelector('#cancelEditClientBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                formContainer.innerHTML = renderClientForm();
                attachFormEventListeners();
            });
        }
    }

    function attachTableEventListeners() {
        tableContainer.querySelectorAll('.edit-client-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const clientId = parseInt(e.currentTarget.dataset.id, 10);
                const clientToEdit = clients.find(c => c.id === clientId);
                if (clientToEdit) {
                    formContainer.innerHTML = renderClientForm(clientToEdit);
                    attachFormEventListeners();
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        tableContainer.querySelectorAll('.delete-client-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const clientId = e.currentTarget.dataset.id;
                const clientToDelete = clients.find(c => c.id === parseInt(clientId));
                if (confirm(`¿Estás seguro de que quieres eliminar al cliente "${clientToDelete.name}"?`)) {
                    fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
                    .then(response => response.json().then(data => ({ ok: response.ok, body: data })))
                    .then(res => {
                        if (res.ok) {
                            alert(res.body.message);
                            refreshClientsList();
                        } else {
                            alert(`Error: ${res.body.error || 'No se pudo eliminar el cliente.'}`);
                        }
                    })
                    .catch(error => {
                         console.error('Error eliminando cliente:', error);
                         alert('Error al eliminar el cliente.');
                    });
                }
            });
        });

        tableContainer.querySelectorAll('.history-client-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const clientId = parseInt(e.currentTarget.dataset.id, 10);
                const client = clients.find(c => c.id === clientId);
                if (client) {
                    showClientSalesHistory(clientId, client.name);
                }
            });
        });

        const searchInput = tableContainer.querySelector('#clientSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchTerm = e.target.value;
                filterClients();
            });
        }
    }

    refreshClientsList();
    attachFormEventListeners();
    return viewContainer;
}
