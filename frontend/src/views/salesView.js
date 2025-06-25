// frontend/src/views/salesView.js

let sales = [];
let allClients = [];
let allProducts = [];
let editingSale = null;
let currentSaleItems = []; // Para el formulario de nueva venta/edición

const saleStatusOptions = ["Contactado", "Armado", "Entregado", "Cobrado", "Cancelado"];
const saleStatusColors = {
    "Contactado": "blue", // O un color de M3 como var(--md-sys-color-secondary)
    "Armado": "orange",   // var(--md-sys-color-tertiary)
    "Entregado": "green", // var(--md-sys-color-primary)
    "Cobrado": "purple",  // var(--md-sys-color-primary-container) -> pero el texto debe ser on-container
    "Cancelado": "gray"   // var(--md-sys-color-outline)
};
const saleStatusIcons = {
    "Contactado": "pending_actions", // o "chat" 💬
    "Armado": "inventory_2",      // o "unarchive" 📤
    "Entregado": "local_shipping", // o "redeem" 📦
    "Cobrado": "paid",            // o "attach_money" 💵
    "Cancelado": "cancel"
};


async function fetchDataForSalesForm() {
    try {
        const [clientsRes, productsRes] = await Promise.all([
            fetch('/api/clients'),
            fetch('/api/products')
        ]);
        if (!clientsRes.ok || !productsRes.ok) {
            throw new Error('Error al cargar datos maestros para ventas.');
        }
        allClients = await clientsRes.json();
        allProducts = await productsRes.json();
    } catch (error) {
        console.error("Error fetching data for sales form:", error);
        allClients = [];
        allProducts = [];
    }
}

function renderSaleForm(sale = {}) {
    editingSale = sale.id ? sale : null;
    if (editingSale) {
        currentSaleItems = sale.items ? [...sale.items.map(item => ({...item, product_id: item.product_id || item.productId}))] : []; // Clona para edición
    } else {
        currentSaleItems = []; // Limpia para nueva venta
    }

    let formHtml = `
        <h4>${editingSale ? 'Editar Venta (ID: ' + sale.id + ')' : 'Nueva Venta'}</h4>
        <form id="saleForm" style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 16px;">
            <input type="hidden" name="id" value="${sale.id || ''}">

            <md-outlined-select label="Cliente" name="client_id" value="${sale.client_id || ''}" required>
                ${allClients.map(c => `<md-select-option value="${c.id}" ${sale.client_id === c.id ? 'selected' : ''}>${c.name}</md-select-option>`).join('')}
            </md-outlined-select>

            <h5>Items del Pedido</h5>
            <div id="saleItemsContainer" style="display: flex; flex-direction: column; gap: 10px; border: 1px solid #ccc; padding:10px; border-radius:4px;">
                ${renderCurrentSaleItemsForm()}
            </div>
            <md-outlined-button type="button" id="addSaleItemBtn">Añadir Producto</md-outlined-button>

            <md-outlined-text-field label="Monto Total" name="totalAmount" type="number" step="0.01" value="${sale.totalAmount || 0}" readonly filled></md-outlined-text-field>

            <md-outlined-select label="Estado del Pedido" name="status" value="${sale.status || 'Contactado'}" required>
                ${saleStatusOptions.map(s => `<md-select-option value="${s}" ${sale.status === s ? 'selected' : ''}>${s}</md-select-option>`).join('')}
            </md-outlined-select>

            <div>
                <md-filled-button type="submit">${editingSale ? 'Actualizar Venta' : 'Crear Venta'}</md-filled-button>
                ${editingSale ? '<md-outlined-button type="button" id="cancelEditSaleBtn" style="margin-left: 8px;">Cancelar Edición</md-outlined-button>' : ''}
            </div>
        </form>
        <div id="saleMessage" style="margin-bottom: 16px;"></div>
    `;
    return formHtml;
}

function renderCurrentSaleItemsForm() {
    let itemsHtml = '';
    if (currentSaleItems.length === 0) {
        itemsHtml = '<p>Añada productos al pedido.</p>';
    }
    currentSaleItems.forEach((item, index) => {
        const product = allProducts.find(p => p.id === item.product_id);
        itemsHtml += `
            <div class="sale-item-form-row" data-index="${index}" style="display:flex; gap:8px; align-items:center; border-bottom: 1px dashed #eee; padding-bottom: 8px;">
                <md-outlined-select label="Producto" class="sale-item-product" value="${item.product_id || ''}" style="flex:3;">
                    <md-select-option value=""></md-select-option> <!-- Opción vacía -->
                    ${allProducts.map(p => `<md-select-option value="${p.id}" ${item.product_id === p.id ? 'selected' : ''}>${p.name} (Stock: ${p.stockActual})</md-select-option>`).join('')}
                </md-outlined-select>
                <md-outlined-text-field label="Cant." type="number" class="sale-item-quantity" value="${item.quantity || 1}" style="flex:1;"></md-outlined-text-field>
                <md-outlined-text-field label="Precio Unit." type="number" step="0.01" class="sale-item-price" value="${item.price_at_sale || (product ? product.priceShowroom : 0)}" style="flex:1;"></md-outlined-text-field>
                <md-outlined-text-field label="Subtotal" type="number" step="0.01" class="sale-item-subtotal" value="${item.subtotal || 0}" readonly filled style="flex:1;"></md-outlined-text-field>
                <md-icon-button class="remove-sale-item-btn" title="Quitar Item"><md-icon>delete</md-icon></md-icon-button>
            </div>
        `;
    });
    return itemsHtml;
}

function updateTotalAmountDisplay() {
    const total = currentSaleItems.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
    const totalAmountField = document.querySelector('#saleForm [name="totalAmount"]');
    if (totalAmountField) totalAmountField.value = total.toFixed(2);
}

function renderSalesTable(salesToRender) {
    // Implementar búsqueda/filtro por estado aquí si es necesario
    let tableHtml = `
        <h4>Listado de Ventas</h4>
        <!-- Filtros aquí -->
        <div style="overflow-x: auto;">
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    if (!salesToRender || salesToRender.length === 0) {
        tableHtml += '<tr><td colspan="6">No hay ventas para mostrar.</td></tr>';
    } else {
        salesToRender.forEach(s => {
            tableHtml += `
                <tr>
                    <td>${s.id}</td>
                    <td>${s.client_name || s.client_id}</td>
                    <td>${new Date(s.saleDate).toLocaleDateString()}</td>
                    <td>$${s.totalAmount.toFixed(2)}</td>
                    <td>
                        <span style="color: ${saleStatusColors[s.status] || 'black'}; display:flex; align-items:center; gap:4px;">
                            <md-icon style="font-size:1.1em;">${saleStatusIcons[s.status] || 'help_outline'}</md-icon>
                            ${s.status}
                        </span>
                    </td>
                    <td>
                        <md-icon-button class="edit-sale-btn" data-id="${s.id}" title="Editar Estado/Ver"><md-icon>edit_note</md-icon></md-icon-button>
                        <md-icon-button class="delete-sale-btn" data-id="${s.id}" title="Eliminar"><md-icon>delete</md-icon></md-icon-button>
                    </td>
                </tr>
            `;
        });
    }
    tableHtml += `</tbody></table></div>`;
    return tableHtml;
}


export function renderSalesView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "sales-view-container";
    viewContainer.innerHTML = `<h2>Gestión de Ventas</h2>`;

    // Estilos específicos para esta vista (incluyendo responsividad para items de venta)
    const style = document.createElement('style');
    style.textContent = `
        .sale-item-form-row {
            display: flex;
            gap: 8px;
            align-items: center;
            border-bottom: 1px dashed #eee;
            padding-bottom: 8px;
            margin-bottom: 8px; /* Espacio entre items */
        }
        .sale-item-form-row > * { /* Todos los hijos directos */
            margin-bottom: 0; /* Resetear margen si los text-fields lo tienen */
        }
        @media (max-width: 768px) {
            .sale-item-form-row {
                flex-direction: column;
                align-items: stretch; /* Que los elementos ocupen el ancho */
            }
            .sale-item-form-row > md-outlined-select,
            .sale-item-form-row > md-outlined-text-field {
                width: 100%; /* Ocupar todo el ancho en móvil */
            }
            .sale-item-form-row md-icon-button {
                align-self: flex-end; /* Botón de eliminar a la derecha */
            }
        }
    `;
    viewContainer.appendChild(style);

    const formContainer = document.createElement('div');
    formContainer.id = "sale-form-container";
    formContainer.innerHTML = '<p>Cargando datos del formulario...</p>';

    const tableContainer = document.createElement('div');
    tableContainer.id = "sales-table-container";
    tableContainer.innerHTML = '<p>Cargando ventas...</p>';

    viewContainer.appendChild(formContainer);
    viewContainer.appendChild(tableContainer);

    async function initializeForm() {
        await fetchDataForSalesForm(); // Cargar clientes y productos
        formContainer.innerHTML = renderSaleForm(); // Renderizar el formulario vacío
        attachFormEventListeners();
    }

    function refreshSalesList() {
        fetch('/api/sales')
            .then(response => response.json())
            .then(data => {
                sales = data;
                tableContainer.innerHTML = renderSalesTable(sales);
                attachTableEventListeners();
            })
            .catch(error => {
                console.error('Error cargando ventas:', error);
                tableContainer.innerHTML = '<p>Error al cargar ventas.</p>';
            });
    }

    function updateItemSubtotal(itemRow) {
        const quantity = parseFloat(itemRow.querySelector('.sale-item-quantity').value) || 0;
        const price = parseFloat(itemRow.querySelector('.sale-item-price').value) || 0;
        const subtotalField = itemRow.querySelector('.sale-item-subtotal');
        const subtotal = quantity * price;
        subtotalField.value = subtotal.toFixed(2);

        const itemIndex = parseInt(itemRow.dataset.index, 10);
        if(currentSaleItems[itemIndex]) {
            currentSaleItems[itemIndex].quantity = quantity;
            currentSaleItems[itemIndex].price_at_sale = price;
            currentSaleItems[itemIndex].subtotal = subtotal;
        }
        updateTotalAmountDisplay();
    }

    function attachSaleItemRowListeners(itemRow) {
        itemRow.querySelector('.sale-item-product').addEventListener('change', function(e) {
            const productId = parseInt(e.target.value, 10);
            const product = allProducts.find(p => p.id === productId);
            const priceField = itemRow.querySelector('.sale-item-price');
            if (product) {
                // AGENTS.md: "Precio Feria (autocompletado/editable)"
                // Decidir qué precio autocompletar: Showroom o Feria (si está activo el modo).
                // Por ahora, usaré priceShowroom. El backend lo manejará si es necesario.
                priceField.value = product.priceShowroom.toFixed(2);
                 const itemIndex = parseInt(itemRow.dataset.index, 10);
                if(currentSaleItems[itemIndex]) currentSaleItems[itemIndex].product_id = productId;
            } else {
                priceField.value = '0.00';
            }
            updateItemSubtotal(itemRow);
        });

        itemRow.querySelector('.sale-item-quantity').addEventListener('input', () => updateItemSubtotal(itemRow));
        itemRow.querySelector('.sale-item-price').addEventListener('input', () => updateItemSubtotal(itemRow));

        itemRow.querySelector('.remove-sale-item-btn').addEventListener('click', () => {
            const itemIndex = parseInt(itemRow.dataset.index, 10);
            currentSaleItems.splice(itemIndex, 1);
            document.getElementById('saleItemsContainer').innerHTML = renderCurrentSaleItemsForm();
            document.querySelectorAll('#saleItemsContainer .sale-item-form-row').forEach(row => attachSaleItemRowListeners(row));
            updateTotalAmountDisplay();
        });
    }


    function attachFormEventListeners() {
        const saleForm = formContainer.querySelector('#saleForm');
        const saleMessage = formContainer.querySelector('#saleMessage');

        document.getElementById('addSaleItemBtn')?.addEventListener('click', () => {
            currentSaleItems.push({ product_id: '', quantity: 1, price_at_sale: 0, subtotal: 0 });
            document.getElementById('saleItemsContainer').innerHTML = renderCurrentSaleItemsForm();
            document.querySelectorAll('#saleItemsContainer .sale-item-form-row').forEach(row => attachSaleItemRowListeners(row));
        });

        document.querySelectorAll('#saleItemsContainer .sale-item-form-row').forEach(row => attachSaleItemRowListeners(row));

        if (saleForm) {
            saleForm.addEventListener('submit', (event) => {
                event.preventDefault();
                saleMessage.textContent = 'Guardando...';

                const dataToSave = {
                    client_id: parseInt(saleForm.elements.client_id.value, 10),
                    status: saleForm.elements.status.value,
                    items: currentSaleItems.filter(item => item.product_id && item.quantity > 0).map(item => ({
                        product_id: parseInt(item.product_id, 10),
                        quantity: parseInt(item.quantity, 10),
                        price_at_sale: parseFloat(item.price_at_sale)
                    }))
                };

                if (dataToSave.items.length === 0) {
                    saleMessage.textContent = 'Error: Debe añadir al menos un producto a la venta.';
                    saleMessage.style.color = 'red';
                    return;
                }

                const url = editingSale ? `/api/sales/${editingSale.id}` : '/api/sales';
                // Si se edita, por ahora solo se permite cambiar el estado. El PUT en backend está simplificado.
                // Para editar items, se necesitaría un PUT más complejo o endpoints dedicados.
                // Por ahora, el formulario de edición solo tiene sentido para el estado si no se reconstruyen los items.
                // Si es una nueva venta (POST), enviamos todo.
                const method = editingSale ? 'PUT' : 'POST';
                let payload = dataToSave;
                if(editingSale && method === 'PUT') { // Solo enviar estado si se está editando
                    payload = { status: dataToSave.status };
                }


                fetch(url, {
                    method: method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                .then(response => response.json().then(data => ({ ok: response.ok, body: data })))
                .then(res => {
                    if (res.ok) {
                        saleMessage.textContent = res.body.message || (editingSale ? 'Venta actualizada.' : 'Venta creada.');
                        saleMessage.style.color = 'green';
                        editingSale = null; // Resetear
                        currentSaleItems = [];
                        formContainer.innerHTML = renderSaleForm();
                        attachFormEventListeners();
                        refreshSalesList();
                        fetchDataForSalesForm(); // Para refrescar stock de productos en el selector.
                    } else {
                        saleMessage.textContent = `Error: ${res.body.error || 'No se pudo guardar la venta.'}`;
                        saleMessage.style.color = 'red';
                    }
                })
                .catch(error => {
                    console.error('Error guardando venta:', error);
                    saleMessage.textContent = 'Error al guardar la venta.';
                    saleMessage.style.color = 'red';
                });
            });
        }
        const cancelBtn = formContainer.querySelector('#cancelEditSaleBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                editingSale = null;
                currentSaleItems = [];
                formContainer.innerHTML = renderSaleForm();
                attachFormEventListeners();
            });
        }
    }

    function attachTableEventListeners() {
        tableContainer.querySelectorAll('.edit-sale-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const saleId = parseInt(e.currentTarget.dataset.id, 10);
                const saleToEdit = sales.find(s => s.id === saleId);
                if (saleToEdit) {
                    // Cuando se edita una venta, el formulario actual solo permite cambiar el estado.
                    // Para una edición completa de items, el flujo sería más complejo.
                    // Por ahora, `renderSaleForm` cargará los items si `editingSale` está seteado,
                    // pero el submit para PUT solo envía el status.
                    editingSale = saleToEdit; // Marcar que estamos editando
                    formContainer.innerHTML = renderSaleForm(saleToEdit); // Renderizar con datos de la venta
                    attachFormEventListeners();
                    formContainer.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        tableContainer.querySelectorAll('.delete-sale-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const saleId = e.currentTarget.dataset.id;
                if (confirm(`¿Estás seguro de que quieres eliminar la venta ID ${saleId}? Esto restaurará el stock de los productos si la venta no fue cancelada.`)) {
                    fetch(`/api/sales/${saleId}`, { method: 'DELETE' })
                    .then(response => response.json().then(data => ({ ok: response.ok, body: data })))
                    .then(res => {
                        if (res.ok) {
                            alert(res.body.message);
                            refreshSalesList();
                            fetchDataForSalesForm(); // Para refrescar stock de productos en el selector.
                        } else {
                            alert(`Error: ${res.body.error || 'No se pudo eliminar la venta.'}`);
                        }
                    })
                    .catch(error => {
                         console.error('Error eliminando venta:', error);
                         alert('Error al eliminar la venta.');
                    });
                }
            });
        });
    }

    initializeForm();
    refreshSalesList();
    return viewContainer;
}
