// frontend/src/views/dashboardView.js

const cardDefinitions = [
    {
        key: 'ventasAEntregar', title: 'Ventas por Entregar', icon: 'local_shipping',
        countKey: 'count', amountKey: 'totalAmount',
        tooltip: 'Pedidos en estado "Contactado" o "Armado".'
    },
    {
        key: 'ventasPorArmar', title: 'Pedidos por Armar', icon: 'inventory_2',
        countKey: 'count', amountKey: 'totalAmount',
        tooltip: 'Pedidos en estado "Contactado", pendientes de preparación.'
    },
    {
        key: 'ventasEntregadas', title: 'Ventas Entregadas (A Cobrar)', icon: 'redeem', // o "check_circle_outline"
        countKey: 'count', amountKey: 'totalAmount',
        tooltip: 'Pedidos en estado "Entregado", pendientes de cobro.'
    },
    {
        key: 'ventasCobradas', title: 'Ventas Cobradas', icon: 'paid',
        countKey: 'count', amountKey: 'totalAmount',
        tooltip: 'Pedidos en estado "Cobrado".'
    },
    // Podríamos añadir una card para "Ventas A Cobrar" si la definición es distinta a "Ventas Entregadas"
    // Por ahora, según el backend, son lo mismo.
];

function renderDashboardCard(cardDef, summaryData) {
    const data = summaryData[cardDef.key] || { count: 0, totalAmount: 0 };
    const card = document.createElement('md-elevated-card'); // o md-filled-card
    card.classList.add('dashboard-card');
    card.setAttribute('title', cardDef.tooltip); // Tooltip para el hover

    card.innerHTML = `
        <div class="card-header" style="display: flex; align-items: center; padding: 16px;">
            <md-icon style="margin-right: 12px; font-size: 28px; color: var(--md-sys-color-primary);">${cardDef.icon}</md-icon>
            <h3 style="margin: 0; font-size: 1.2em;">${cardDef.title}</h3>
        </div>
        <div class="card-content" style="padding: 0 16px 16px 16px; text-align: center;">
            <p style="font-size: 2.5em; font-weight: bold; margin: 8px 0; color: var(--md-sys-color-primary);">
                ${data[cardDef.countKey]}
            </p>
            <p style="font-size: 1em; margin: 0;">
                Total: $${data[cardDef.amountKey] ? data[cardDef.amountKey].toFixed(2) : '0.00'}
            </p>
        </div>
    `;
    return card;
}

function renderKanbanBoard(salesByStatus) {
    const boardContainer = document.createElement('div');
    boardContainer.id = 'kanban-board';
    boardContainer.innerHTML = '<h3>Pipeline de Ventas (Kanban)</h3>';

    const columnsContainer = document.createElement('div');
    columnsContainer.classList.add('kanban-columns-container');

    // Definir las columnas del Kanban
    const kanbanStatuses = ["Contactado", "Armado", "Entregado", "Cobrado"]; // Cancelado se podría mostrar aparte o no aquí

    kanbanStatuses.forEach(status => {
        const column = document.createElement('div');
        column.classList.add('kanban-column');
        column.innerHTML = `<h4>${status} (${(salesByStatus[status] || []).length})</h4>`;

        const cardsContainer = document.createElement('div');
        cardsContainer.classList.add('kanban-cards-container');

        (salesByStatus[status] || []).forEach(sale => {
            const card = document.createElement('md-outlined-card'); // Usar outlined para las tarjetas de venta
            card.classList.add('kanban-sale-card');
            card.innerHTML = `
                <div style="padding: 8px 12px;">
                    <p style="font-weight: bold; margin-bottom: 4px;">Venta #${sale.id} - ${sale.client_name}</p>
                    <p style="font-size: 0.9em; margin-bottom: 4px;">Total: $${sale.totalAmount.toFixed(2)}</p>
                    <p style="font-size: 0.8em; color: #666;">Fecha: ${new Date(sale.saleDate).toLocaleDateString()}</p>
                    <!-- Podríamos añadir más detalles o un botón para ver la venta completa -->
                </div>
            `;
            // Aquí se podría añadir drag-and-drop si se quisiera mover entre estados (requiere más lógica)
            cardsContainer.appendChild(card);
        });
        column.appendChild(cardsContainer);
        columnsContainer.appendChild(column);
    });

    boardContainer.appendChild(columnsContainer);
    return boardContainer;
}


export function renderDashboardView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "dashboard-view-container";
    viewContainer.innerHTML = `<h2>Dashboard</h2>`;

    const summaryCardsContainer = document.createElement('div');
    summaryCardsContainer.id = "summary-cards-container";
    summaryCardsContainer.classList.add('dashboard-grid');
    summaryCardsContainer.innerHTML = '<p>Cargando resumen...</p>';
    viewContainer.appendChild(summaryCardsContainer);

    const kanbanContainer = document.createElement('div');
    kanbanContainer.id = "kanban-container";
    kanbanContainer.innerHTML = '<p>Cargando pipeline de ventas...</p>';
    viewContainer.appendChild(kanbanContainer);


    // Fetch summary data
    fetch('/api/dashboard/summary')
        .then(response => response.json())
        .then(summary => {
            summaryCardsContainer.innerHTML = ''; // Clear loading
            cardDefinitions.forEach(def => {
                summaryCardsContainer.appendChild(renderDashboardCard(def, summary));
            });
        })
        .catch(error => {
            console.error('Error cargando resumen del dashboard:', error);
            summaryCardsContainer.innerHTML = '<p>Error al cargar resumen.</p>';
        });

    // Fetch all sales for Kanban (o por estados)
    fetch('/api/sales') // Podríamos tener un endpoint que ya las agrupe por estado
        .then(response => response.json())
        .then(allSales => {
            const salesByStatus = {};
            allSales.forEach(sale => {
                if (!salesByStatus[sale.status]) {
                    salesByStatus[sale.status] = [];
                }
                salesByStatus[sale.status].push(sale);
            });
            kanbanContainer.innerHTML = ''; // Clear loading
            kanbanContainer.appendChild(renderKanbanBoard(salesByStatus));
        })
        .catch(error => {
            console.error('Error cargando ventas para Kanban:', error);
            kanbanContainer.innerHTML = '<p>Error al cargar pipeline de ventas.</p>';
        });

    const style = document.createElement('style');
    style.textContent = `
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        .dashboard-card {
            width: 100%;
        }
        .kanban-columns-container {
            display: flex;
            gap: 16px;
            overflow-x: auto; /* Permite scroll horizontal si las columnas no caben */
            padding-bottom: 16px; /* Espacio para la barra de scroll */
        }
        .kanban-column {
            flex: 1;
            min-width: 250px; /* Ancho mínimo de columna */
            max-width: 300px; /* Ancho máximo */
            background-color: var(--md-sys-color-surface-container-low); /* Color de fondo para la columna */
            border-radius: 8px;
            padding: 8px;
        }
        .kanban-column h4 {
            margin: 0 0 12px 0;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--md-sys-color-outline-variant);
            text-align: center;
        }
        .kanban-cards-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
            min-height: 100px; /* Para que la columna tenga algo de alto incluso vacía */
        }
        .kanban-sale-card {
            border: 1px solid var(--md-sys-color-outline-variant);
        }
    `;
    viewContainer.appendChild(style);

    return viewContainer;
}
