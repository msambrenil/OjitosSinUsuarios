console.log("App.js cargado");

const appRoot = document.getElementById('app-root');
const navButtons = document.querySelectorAll('nav md-filled-button'); // O el selector que uses para tus botones de nav

// --- Carga de Vistas (Ejemplo simple) ---
async function loadView(viewName) {
    appRoot.innerHTML = `<p>Cargando vista: ${viewName}...</p>`;
    try {
        // Suponemos que cada vista tiene su propio módulo JS y una función para renderizar
        // Ejemplo: catalogView.js, productsView.js, settingsView.js
        // Estos archivos deberían exportar una función, por ejemplo, render()

        let viewElement; // Elemento a renderizar

        if (viewName === 'dashboard') {
            const dashboardViewModule = await import('./views/dashboardView.js');
            viewElement = dashboardViewModule.renderDashboardView();
        } else if (viewName === 'catalog') {
            const catalogViewModule = await import('./views/catalogView.js');
            viewElement = catalogViewModule.renderCatalogView();
        } else if (viewName === 'products') {
            const productsViewModule = await import('./views/productsView.js');
            viewElement = productsViewModule.renderProductsView();
        } else if (viewName === 'tags') {
            const tagsViewModule = await import('./views/tagsView.js');
            viewElement = tagsViewModule.renderTagsView();
        } else if (viewName === 'categories') {
            const categoriesViewModule = await import('./views/categoriesView.js');
            viewElement = categoriesViewModule.renderCategoriesView();
        } else if (viewName === 'clients') {
            const clientsViewModule = await import('./views/clientsView.js');
            viewElement = clientsViewModule.renderClientsView();
        } else if (viewName === 'sales') {
            const salesViewModule = await import('./views/salesView.js');
            viewElement = salesViewModule.renderSalesView();
        } else if (viewName === 'stats') {
            const statsViewModule = await import('./views/statsView.js');
            viewElement = statsViewModule.renderStatsView();
        } else if (viewName === 'settings') {
            const settingsViewModule = await import('./views/settingsView.js');
            viewElement = settingsViewModule.renderSettingsView();
        } else {
            appRoot.innerHTML = '<p>Vista no encontrada.</p>';
            return;
        }

        if (viewElement) {
            appRoot.innerHTML = ''; // Limpiar "Cargando..." o contenido anterior
            appRoot.appendChild(viewElement);
        } else {
            // Si viewElement es null/undefined pero no se usó el placeholder (ej. módulo importado pero sin función render)
            // Esto es más para el caso en que se quiten los placeholders
            if (!appRoot.innerHTML.includes('Placeholder')) {
                 appRoot.innerHTML = `<p>Error al renderizar la vista: ${viewName}.</p>`;
            }
        }
    } catch (error) {
        console.error(`Error cargando la vista ${viewName}:`, error);
        appRoot.innerHTML = `<p>Error al cargar la vista: ${viewName}.</p>`;
    }
}

// --- Manejo de Navegación ---
navButtons.forEach(button => {
    button.addEventListener('click', () => {
        const viewName = button.dataset.view;
        if (viewName) {
            loadView(viewName);
            // Opcional: actualizar URL con hash
            // window.location.hash = viewName;
        }
    });
});

// --- Carga Inicial (ej. basado en hash o vista por defecto) ---
// function handleInitialLoad() {
//     const hash = window.location.hash.substring(1);
//     if (hash) {
//         loadView(hash);
//     } else {
//         loadView('catalog'); // Vista por defecto
//     }
// }
//
// window.addEventListener('hashchange', handleInitialLoad);
// document.addEventListener('DOMContentLoaded', handleInitialLoad);

// Carga inicial simple por ahora
document.addEventListener('DOMContentLoaded', () => {
    // Dark Mode Toggle Logic
    const darkModeToggle = document.getElementById('darkModeToggle');
    const currentTheme = localStorage.getItem('theme');

    function setTheme(theme) {
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
            if(darkModeToggle) darkModeToggle.selected = true;
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            if(darkModeToggle) darkModeToggle.selected = false;
            localStorage.setItem('theme', 'light');
        }
    }

    if (currentTheme) {
        setTheme(currentTheme);
    } else { // Si no hay tema guardado, usar preferencia del sistema
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        } else {
            setTheme('light');
        }
    }

    if(darkModeToggle) {
        darkModeToggle.addEventListener('change', () => { // 'change' es más apropiado para md-switch
            if (darkModeToggle.selected) {
                setTheme('dark');
            } else {
                setTheme('light');
            }
        });
    }

    // Fin Dark Mode Logic

    loadView('dashboard'); // Cargar dashboard por defecto
});
