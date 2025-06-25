// frontend/src/views/statsView.js

async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText} fetching ${endpoint}`);
        }
        return await response.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

function renderSalesOverTime(data) {
    let content = '<h4>Ventas a lo largo del Tiempo</h4>';
    if (!data || data.length === 0) {
        return content + '<p>No hay datos de ventas para mostrar.</p>';
    }
    content += `
        <md-outlined-select id="salesPeriodSelect" label="Periodo">
            <md-select-option value="day" selected>Diario</md-select-option>
            <md-select-option value="month">Mensual</md-select-option>
            <md-select-option value="year">Anual</md-select-option>
        </md-outlined-select>
        <div id="salesOverTimeChart" style="margin-top:16px;">
            <table>
                <thead>
                    <tr><th>Periodo</th><th>Cantidad de Pedidos</th><th>Total Ventas ($)</th></tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr><td>${row.period}</td><td>${row.orderCount}</td><td>${row.totalSales.toFixed(2)}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
    return content;
}

function generateCSV(headers, dataRows) {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.join(",") + "\r\n";
    dataRows.forEach(rowArray => {
        csvContent += rowArray.join(",") + "\r\n";
    });
    return encodeURI(csvContent);
}

function addExportButton(containerElement, data, headers, filename) {
    const exportButton = document.createElement('md-filled-button');
    exportButton.innerHTML = 'Exportar a CSV <md-icon slot="icon">download</md-icon>';
    exportButton.style.marginTop = '8px';
    exportButton.addEventListener('click', () => {
        if (data && data.length > 0) {
            const dataRows = data.map(item => {
                // Esto necesita ser adaptado para cada tipo de dato
                if (filename.includes('sales_over_time')) return [item.period, item.orderCount, item.totalSales.toFixed(2)];
                if (filename.includes('top_products_qty')) return [item.productName, item.totalSold];
                if (filename.includes('top_products_val')) return [item.productName, item.totalValue.toFixed(2)];
                if (filename.includes('top_clients_freq')) return [item.clientName, item.orderCount];
                if (filename.includes('top_clients_val')) return [item.clientName, item.totalSpent.toFixed(2)];
                if (filename.includes('critical_stock')) return [item.id, item.name, item.stockActual, item.stockCritico];
                if (filename.includes('out_of_stock')) return [item.id, item.name];
                return Object.values(item); // Fallback genérico
            });
            const csvLink = generateCSV(headers, dataRows);
            const link = document.createElement('a');
            link.setAttribute('href', csvLink);
            link.setAttribute('download', `${filename}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("No hay datos para exportar.");
        }
    });
    containerElement.appendChild(exportButton);
}


function renderStockSummary(data) {
    let content = '<h4>Resumen de Stock</h4>';
    if (!data) {
        return content + '<p>Error al cargar resumen de stock.</p>';
    }

    const criticalStockContainer = document.createElement('div');
    let criticalHtml = '<h5>Productos con Stock Crítico</h5>';
    if (data.criticalStock && data.criticalStock.length > 0) {
        criticalHtml += '<table><thead><tr><th>ID</th><th>Nombre</th><th>Stock Actual</th><th>Stock Crítico</th></tr></thead><tbody>';
        data.criticalStock.forEach(p => {
            criticalHtml += `<tr><td>${p.id}</td><td>${p.name}</td><td>${p.stockActual}</td><td>${p.stockCritico}</td></tr>`;
        });
        criticalHtml += '</tbody></table>';
        criticalStockContainer.innerHTML = criticalHtml;
        addExportButton(criticalStockContainer, data.criticalStock, ["ID", "Nombre", "Stock Actual", "Stock Critico"], "critical_stock_products");
    } else {
        criticalStockContainer.innerHTML = criticalHtml + '<p>No hay productos con stock crítico.</p>';
    }

    const outOfStockContainer = document.createElement('div');
    outOfStockContainer.style.marginTop = '16px';
    let outOfStockHtml = '<h5>Productos Agotados</h5>';
    if (data.outOfStock && data.outOfStock.length > 0) {
        outOfStockHtml += '<table><thead><tr><th>ID</th><th>Nombre</th></tr></thead><tbody>';
        data.outOfStock.forEach(p => {
            outOfStockHtml += `<tr><td>${p.id}</td><td>${p.name}</td></tr>`;
        });
        outOfStockHtml += '</tbody></table>';
        outOfStockContainer.innerHTML = outOfStockHtml;
        addExportButton(outOfStockContainer, data.outOfStock, ["ID", "Nombre"], "out_of_stock_products");
    } else {
        outOfStockContainer.innerHTML = outOfStockHtml + '<p>No hay productos agotados.</p>';
    }

    const mainContent = document.createElement('div');
    mainContent.innerHTML = '<h4>Resumen de Stock</h4>';
    mainContent.appendChild(criticalStockContainer);
    mainContent.appendChild(outOfStockContainer);
    return mainContent; // Retornar el elemento contenedor
}


function renderTopProducts(data, type = 'quantity') {
    const container = document.createElement('div');
    let content = `<h4>Top Productos (por ${type === 'quantity' ? 'Cantidad Vendida' : 'Valor de Venta'})</h4>`;
     if (!data || data.length === 0) {
        container.innerHTML = content + '<p>No hay datos de productos para mostrar.</p>';
        return container;
    }
    content += `
        <md-outlined-select id="topProductsBySelect" label="Ver por">
            <md-select-option value="quantity" ${type === 'quantity' ? 'selected' : ''}>Cantidad</md-select-option>
            <md-select-option value="value" ${type === 'value' ? 'selected' : ''}>Valor</md-select-option>
        </md-outlined-select>
        <div id="topProductsChart" style="margin-top:16px;">
            <table>
                <thead>
                    <tr><th>Producto</th><th>${type === 'quantity' ? 'Total Vendido' : 'Valor Total ($)'}</th></tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr><td>${row.productName}</td><td>${type === 'quantity' ? row.totalSold : row.totalValue.toFixed(2)}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = content;
    const headers = ["Producto", type === 'quantity' ? 'Total Vendido' : 'Valor Total ($)'];
    addExportButton(container, data, headers, `top_products_${type}`);
    return container;
}

function renderTopClients(data, type = 'frequency') {
    const container = document.createElement('div');
    let content = `<h4>Top Clientes (por ${type === 'frequency' ? 'Frecuencia de Compra' : 'Valor Gastado'})</h4>`;
    if (!data || data.length === 0) {
        container.innerHTML = content + '<p>No hay datos de clientes para mostrar.</p>';
        return container;
    }
     content += `
        <md-outlined-select id="topClientsBySelect" label="Ver por">
            <md-select-option value="frequency" ${type === 'frequency' ? 'selected' : ''}>Frecuencia</md-select-option>
            <md-select-option value="value" ${type === 'value' ? 'selected' : ''}>Valor</md-select-option>
        </md-outlined-select>
        <div id="topClientsChart" style="margin-top:16px;">
            <table>
                <thead>
                    <tr><th>Cliente</th><th>${type === 'frequency' ? 'Nº Pedidos' : 'Total Gastado ($)'}</th></tr>
                </thead>
                <tbody>
                    ${data.map(row => `<tr><td>${row.clientName}</td><td>${type === 'frequency' ? row.orderCount : row.totalSpent.toFixed(2)}</td></tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = content;
    const headers = ["Cliente", type === 'frequency' ? 'Nº Pedidos' : 'Total Gastado ($)'];
    addExportButton(container, data, headers, `top_clients_${type}`);
    return container;
}


export function renderStatsView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "stats-view-container";
    viewContainer.innerHTML = `<h2>Estadísticas y Reportes</h2>`;

    const salesOverTimeContainer = document.createElement('div'); // Este será el contenedor que pasaremos
    salesOverTimeContainer.id = 'stats-sales-over-time';
    salesOverTimeContainer.style.marginBottom = '24px';
    viewContainer.appendChild(salesOverTimeContainer);

    const topProductsContainer = document.createElement('div'); // Contenedor
    topProductsContainer.id = 'stats-top-products';
    topProductsContainer.style.marginBottom = '24px';
    viewContainer.appendChild(topProductsContainer);

    const topClientsContainer = document.createElement('div');
    topClientsContainer.id = 'stats-top-clients';
    topClientsContainer.style.marginBottom = '24px';
    viewContainer.appendChild(topClientsContainer);

    const stockSummaryContainer = document.createElement('div');
    stockSummaryContainer.id = 'stats-stock-summary';
    stockSummaryContainer.style.marginBottom = '24px';
    viewContainer.appendChild(stockSummaryContainer);

    // --- Carga de Datos y Renderizado ---
    async function loadSalesOverTime(period = 'month') {
        salesOverTimeContainer.innerHTML = '<p>Cargando ventas...</p>'; // Clear previous content including old button
        const data = await fetchData(`/api/stats/sales_over_time?period=${period}`);
        const contentElement = renderSalesOverTime(data); // This now returns an element or string
        salesOverTimeContainer.innerHTML = ''; // Clear again before appending new structure
        salesOverTimeContainer.appendChild(typeof contentElement === 'string' ? new DOMParser().parseFromString(contentElement, 'text/html').body.firstChild : contentElement);

        if (data && data.length > 0) {
            addExportButton(salesOverTimeContainer, data, ["Periodo", "Cantidad Pedidos", "Total Ventas ($)"], `sales_over_time_${period}`);
        }

        const periodSelect = salesOverTimeContainer.querySelector('#salesPeriodSelect');
        if(periodSelect) {
            periodSelect.value = period;
            periodSelect.addEventListener('change', (e) => loadSalesOverTime(e.target.value));
        }
    }

    async function loadTopProducts(by = 'quantity') {
        topProductsContainer.innerHTML = '<p>Cargando top productos...</p>';
        const data = await fetchData(`/api/stats/top_products?by=${by}&limit=10`);
        // renderTopProducts ya devuelve un elemento contenedor y le añade el botón
        const contentElement = renderTopProducts(data, by);
        topProductsContainer.innerHTML = '';
        topProductsContainer.appendChild(contentElement);

        const topProductsSelect = topProductsContainer.querySelector('#topProductsBySelect');
        if(topProductsSelect) {
            topProductsSelect.value = by;
            topProductsSelect.addEventListener('change', (e) => loadTopProducts(e.target.value));
        }
    }

    async function loadTopClients(by = 'frequency') {
        topClientsContainer.innerHTML = '<p>Cargando top clientes...</p>';
        const data = await fetchData(`/api/stats/top_clients?by=${by}&limit=10`);
        // renderTopClients ya devuelve un elemento contenedor y le añade el botón
        const contentElement = renderTopClients(data, by);
        topClientsContainer.innerHTML = '';
        topClientsContainer.appendChild(contentElement);

        const topClientsSelect = topClientsContainer.querySelector('#topClientsBySelect');
        if(topClientsSelect) {
            topClientsSelect.value = by;
            topClientsSelect.addEventListener('change', (e) => loadTopClients(e.target.value));
        }
    }

    async function loadStockSummary() {
        stockSummaryContainer.innerHTML = '<p>Cargando resumen de stock...</p>';
        const data = await fetchData('/api/stats/stock_summary');
        // renderStockSummary devuelve un elemento contenedor y añade botones internamente
        const contentElement = renderStockSummary(data);
        stockSummaryContainer.innerHTML = '';
        stockSummaryContainer.appendChild(contentElement);
    }

    // Carga inicial de todas las estadísticas
    loadSalesOverTime();
    loadTopProducts();
    loadTopClients();
    loadStockSummary();

    return viewContainer;
}
