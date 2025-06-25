// frontend/src/views/catalogView.js

let allAvailableCategories = [];
let allAvailableTags = [];
let currentFilters = {
    searchTerm: '',
    category_ids: [],
    tag_ids: []
};

async function fetchFilterData() {
    try {
        const [categoriesRes, tagsRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/tags')
        ]);
        allAvailableCategories = categoriesRes.ok ? await categoriesRes.json() : [];
        allAvailableTags = tagsRes.ok ? await tagsRes.json() : [];
    } catch (error) {
        console.error("Error fetching filter data:", error);
        allAvailableCategories = [];
        allAvailableTags = [];
    }
}

function renderProductCard(product) {
    // Usamos md-elevated-card o similar para cada producto
    const card = document.createElement('md-elevated-card'); // o md-filled-card / md-outlined-card
    card.classList.add('product-card');
    if (product.stockStatus === 'AGOTADO') {
        card.classList.add('agotado');
    }

    let imageHtml = product.imageUrl
        ? `<img src="${product.imageUrl}" alt="${product.name}" style="width:100%; height: 200px; object-fit: cover;" loading="lazy">`
        : '<div style="width:100%; height: 200px; background-color: #eee; display:flex; align-items:center; justify-content:center;"><span>Sin imagen</span></div>';

    // Si está agotado, atenuar la imagen
    if (product.stockStatus === 'AGOTADO') {
        imageHtml = `<div style="position:relative;">${imageHtml}<div style="position:absolute; top:0; left:0; width:100%; height:100%; background-color:rgba(200,200,200,0.7); display:flex; align-items:center; justify-content:center; font-weight:bold; color:white; font-size:1.5em;">AGOTADO</div></div>`;
    }


    card.innerHTML = `
        <div class="card-media">
            ${imageHtml}
        </div>
        <div class="card-header" style="padding: 16px;">
            <h3 style="margin: 0 0 8px 0;">${product.name}</h3>
        </div>
        <div class="card-content" style="padding: 0 16px 16px 16px;">
            <p style="font-size: 1.2em; font-weight: bold; color: var(--md-sys-color-primary, #6750A4); margin:0 0 8px 0;">
                $${product.displayPrice ? product.displayPrice.toFixed(2) : 'N/A'}
            </p>
            ${product.stockStatus && product.stockStatus !== 'AGOTADO' ? `<p style="color: orange; font-weight:bold;">${product.stockStatus}</p>` : ''}
            <!-- Podríamos añadir un botón "Ver más" o "Añadir al carrito" en el futuro -->
        </div>
    `;
    return card;
}

function renderFilterControls() {
    const filterControlsContainer = document.createElement('div');
    filterControlsContainer.id = 'catalog-filters';
    filterControlsContainer.style.marginBottom = '24px';
    filterControlsContainer.style.padding = '16px';
    filterControlsContainer.style.border = '1px solid var(--md-sys-color-outline-variant)';
    filterControlsContainer.style.borderRadius = '8px';

    let searchHtml = `
        <md-outlined-text-field type="search" id="catalogSearchTerm" label="Buscar por nombre..." value="${currentFilters.searchTerm}" style="width:100%; margin-bottom:16px;"></md-outlined-text-field>
    `;

    let categoriesHtml = '<h4>Categorías:</h4><div class="filter-chip-group">';
    if (allAvailableCategories.length > 0) {
        allAvailableCategories.forEach(cat => {
            categoriesHtml += `
                <md-filter-chip label="${cat.name}" data-filter-type="category" data-id="${cat.id}"
                                ${currentFilters.category_ids.includes(cat.id) ? 'selected' : ''}>
                </md-filter-chip>
            `;
        });
    } else {
        categoriesHtml += '<p style="font-size:0.9em; color:grey;">No hay categorías para filtrar.</p>';
    }
    categoriesHtml += '</div>';

    let tagsHtml = '<h4 style="margin-top:16px;">Tags:</h4><div class="filter-chip-group">';
    if (allAvailableTags.length > 0) {
        allAvailableTags.forEach(tag => {
            tagsHtml += `
                <md-filter-chip label="${tag.name}" data-filter-type="tag" data-id="${tag.id}"
                                ${currentFilters.tag_ids.includes(tag.id) ? 'selected' : ''}>
                </md-filter-chip>
            `;
        });
    } else {
        tagsHtml += '<p style="font-size:0.9em; color:grey;">No hay tags para filtrar.</p>';
    }
    tagsHtml += '</div>';

    filterControlsContainer.innerHTML = searchHtml + categoriesHtml + tagsHtml;

    // Event listeners para los filtros
    filterControlsContainer.querySelector('#catalogSearchTerm').addEventListener('input', debounce(e => {
        currentFilters.searchTerm = e.target.value;
        fetchAndRenderCatalog();
    }, 300));

    filterControlsContainer.querySelectorAll('md-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => { // 'click' para md-filter-chip para que capture el cambio de 'selected'
            const id = parseInt(chip.dataset.id);
            const type = chip.dataset.filterType;

            // Toggle selection state for filter chips
            // chip.selected = !chip.selected; // md-filter-chip debería manejar esto internamente

            if (type === 'category') {
                if (chip.selected) {
                    currentFilters.category_ids.push(id);
                } else {
                    currentFilters.category_ids = currentFilters.category_ids.filter(catId => catId !== id);
                }
            } else if (type === 'tag') {
                if (chip.selected) {
                    currentFilters.tag_ids.push(id);
                } else {
                    currentFilters.tag_ids = currentFilters.tag_ids.filter(tagId => tagId !== id);
                }
            }
            fetchAndRenderCatalog();
        });
    });

    return filterControlsContainer;
}

function fetchAndRenderCatalog() {
    const catalogGrid = document.getElementById('catalog-grid');
    if (!catalogGrid) return;
    catalogGrid.innerHTML = '<p>Cargando productos...</p>';

    const params = new URLSearchParams();
    if (currentFilters.searchTerm) {
        params.append('search_term', currentFilters.searchTerm);
    }
    if (currentFilters.category_ids.length > 0) {
        params.append('category_ids', currentFilters.category_ids.join(','));
    }
    if (currentFilters.tag_ids.length > 0) {
        params.append('tag_ids', currentFilters.tag_ids.join(','));
    }

    fetch(`/api/catalog?${params.toString()}`)
        .then(response => {
            if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
            return response.json();
        })
        .then(products => {
            catalogGrid.innerHTML = ''; // Limpiar "Cargando..."
            if (products && products.length > 0) {
                products.forEach(product => {
                    catalogGrid.appendChild(renderProductCard(product));
                });
            } else {
                catalogGrid.innerHTML = '<p>No se encontraron productos con los filtros aplicados.</p>';
            }
        })
        .catch(error => {
            console.error('Error cargando el catálogo:', error);
            catalogGrid.innerHTML = `<p>Error al cargar el catálogo: ${error.message}. Intente más tarde.</p>`;
        });
}

// Debounce function para no llamar a la API en cada tecleo
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}


export function renderCatalogView() {
    const viewContainer = document.createElement('div');
    viewContainer.id = "catalog-view-container";

    viewContainer.innerHTML = `
        <h2>Catálogo de Productos</h2>
        <p>¡Bienvenidos a nuestro showroom!</p>
        <div id="catalog-filter-controls-container"></div>
        <div id="catalog-grid" class="product-grid" style="margin-top: 16px;">
            Cargando productos...
        </div>
    `;

    async function initializeView() {
        const filterControlsContainer = viewContainer.querySelector('#catalog-filter-controls-container');
        filterControlsContainer.innerHTML = '<p>Cargando filtros...</p>';
        await fetchFilterData();
        filterControlsContainer.innerHTML = ''; // Clear loading
        filterControlsContainer.appendChild(renderFilterControls());
        fetchAndRenderCatalog(); // Carga inicial de productos (sin filtros o con filtros por defecto)
    }

    initializeView();

    const style = document.createElement('style');
    style.textContent = `
        .product-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
            margin-top: 16px;
        }
        .product-card {
            width: 100%; /* Asegura que la tarjeta ocupe el espacio del grid */
        }
        .product-card.agotado .card-media img {
            /* filter: grayscale(80%) opacity(0.7);  // Otra forma de atenuar */
        }
        .product-card h3 {
            font-size: 1.1em;
        }
    `;
    viewContainer.appendChild(style);


    return viewContainer;
}
