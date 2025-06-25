# Showroom Natura OjitOs - Aplicación

Aplicación para la gestión de productos, clientes, ventas y catálogo para "Showroom Natura OjitOs".

## Entorno de Desarrollo Sugerido

*   **Sistema Operativo:** Windows 11 (pero debería funcionar en otros SO)
*   **IDE:** Visual Studio Code
*   **Python:** Versión 3.8 o superior.
*   **Node.js:** Para el frontend (opcional, si se decide usar herramientas de frontend que lo requieran).

## Configuración y Ejecución del Backend (Python/Flask)

1.  **Clonar el Repositorio (si aún no lo has hecho):**
    ```bash
    git clone <url-del-repositorio>
    cd <nombre-del-repositorio>
    ```

2.  **Asegurarse de tener Python instalado:**
    Verifica tu versión de Python:
    ```bash
    python --version
    # o en Windows
    py --version
    ```
    Si no lo tienes, descárgalo desde [python.org](https://www.python.org/downloads/).

3.  **Crear un Entorno Virtual (Recomendado):**
    Dentro de la carpeta raíz del proyecto, ejecuta:
    ```bash
    # En Windows
    python -m venv venv
    venv\Scripts\activate

    # En macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```
    Esto crea y activa un entorno virtual llamado `venv`.

4.  **Instalar las Dependencias del Backend:**
    Asegúrate de estar en la raíz del proyecto y que tu entorno virtual esté activado.
    ```bash
    pip install -r backend/requirements.txt
    ```

5.  **Inicializar la Base de Datos (Solo la primera vez o si hay cambios en los modelos):**
    *   Abre el archivo `backend/app.py`.
    *   Busca la sección `if __name__ == '__main__':`.
    *   Descomenta la línea `# create_db()`. Debería quedar así:
        ```python
        if __name__ == '__main__':
            create_db() # Descomentado para crear la DB
            app.run(debug=True, port=5000)
        ```
    *   Ejecuta el servidor una vez para crear la base de datos:
        ```bash
        python backend/app.py
        ```
    *   Una vez que veas el mensaje "Base de datos y tablas creadas...", detén el servidor (Ctrl+C).
    *   **MUY IMPORTANTE:** Vuelve a comentar la línea `create_db()` en `backend/app.py` para evitar que la base de datos se intente recrear (y potencialmente borrar) cada vez que inicies el servidor.
        ```python
        if __name__ == '__main__':
            # create_db() # Comentado nuevamente
            app.run(debug=True, port=5000)
        ```

6.  **Ejecutar el Servidor Backend:**
    Con el entorno virtual activado y desde la raíz del proyecto:
    ```bash
    python backend/app.py
    ```
    El backend debería estar corriendo en `http://127.0.0.1:5000`.

## Configuración y Ejecución del Frontend (HTML, CSS, JavaScript)

El frontend está diseñado para ser simple, utilizando HTML, CSS vainilla y JavaScript vainilla, con componentes de Material Design 3 Web Components cargados desde un CDN.

1.  **Descargar la Tipografía Comfortaa (Recomendado):**
    *   Ve a [Google Fonts - Comfortaa](https://fonts.google.com/specimen/Comfortaa).
    *   Haz clic en "Download family".
    *   Descomprime el archivo ZIP.
    *   Copia los archivos de la fuente (especialmente `Comfortaa-VariableFont_wght.ttf`, `Comfortaa-Regular.ttf`, `Comfortaa-Bold.ttf`, o los que necesites) en la carpeta `frontend/assets/fonts/` de tu proyecto. (Deberás crear la carpeta `fonts` dentro de `assets` si no existe).
    *   El archivo `frontend/styles/style.css` ya está configurado para buscar las fuentes en esta ubicación.

2.  **Abrir el Frontend en el Navegador:**
    *   Simplemente abre el archivo `frontend/index.html` directamente en tu navegador web (ej. Chrome, Firefox, Edge).
    *   No se requiere un paso de compilación ni un servidor de desarrollo Node.js complejo para esta configuración básica.

3.  **Estructura de Archivos Clave del Frontend:**
    *   `frontend/index.html`: El archivo HTML principal.
    *   `frontend/src/app.js`: Lógica principal de JavaScript, incluyendo el enrutamiento simple de vistas.
    *   `frontend/styles/style.css`: Estilos globales y configuración de la tipografía.
    *   `frontend/src/views/`: (Se crearán archivos aquí, ej. `catalogView.js`, `settingsView.js`) Módulos para cada vista o "página" de la aplicación.
    *   `frontend/assets/`: Para recursos estáticos como fuentes e imágenes.

## Características Implementadas

### 1. Gestión de Configuración (Característica 5 de AGENTS.md)

*   **Backend:**
    *   Modelo `Config` en `backend/app.py` para almacenar los ajustes.
    *   Endpoints API en `backend/app.py`:
        *   `GET /api/config`: Obtiene la configuración actual. Si no existe, crea una con valores por defecto.
        *   `PUT /api/config`: Actualiza la configuración.
*   **Frontend:**
    *   Vista de configuración en `frontend/src/views/settingsView.js`.
    *   Permite al usuario ver y modificar los parámetros de configuración del sitio, incluyendo:
        *   Nombre del Sitio
        *   Color Primario de la Marca
        *   URL del Logo
        *   Información de Contacto
        *   Redes Sociales (Instagram, TikTok, WhatsApp)
        *   Link de Feria Online
        *   Dirección del Showroom
        *   **Toggle para activar/desactivar el "Modo Feria"**.
    *   Los cambios se guardan y se recuperan del backend.
    *   Accesible a través del botón "Configuración (Admin)" en la navegación principal.

### 2. Gestión de Productos y Stock (Parcial - Característica 2 de AGENTS.md)

*   **Backend:**
    *   Modelo `Product` en `backend/app.py`.
    *   Endpoints API CRUD en `backend/app.py` para `/api/products`:
        *   `POST /api/products`: Crear un nuevo producto.
        *   `GET /api/products`: Obtener listado de todos los productos.
        *   `GET /api/products/<id>`: Obtener un producto específico.
        *   `PUT /api/products/<id>`: Actualizar un producto.
        *   `DELETE /api/products/<id>`: Eliminar un producto.
*   **Frontend:**
    *   Vista de gestión de productos en `frontend/src/views/productsView.js`.
    *   Permite:
        *   Crear nuevos productos con campos como nombre, precios (revista, showroom, feria), stock actual, stock crítico, URLs de imágenes.
        *   Ver un listado de productos existentes en una tabla.
        *   Editar los detalles de un producto existente.
        *   Eliminar productos (con confirmación).
    *   La tabla de productos resalta visualmente el stock crítico.
    *   **Integración con Tags:** El formulario de creación/edición de productos ahora permite asociar múltiples tags a un producto. Los tags asociados se envían al backend.
    *   Accesible a través del botón "Productos (Admin)" en la navegación principal.

### 3. Gestión de Tags (Característica 7 de AGENTS.md)

*   **Backend:**
    *   Modelo `Tag` en `backend/app.py`.
    *   Endpoints API CRUD en `backend/app.py` para `/api/tags` (Crear, Listar, Actualizar, Eliminar).
    *   Actualizados los endpoints de creación/actualización de Productos para aceptar y procesar `tag_ids`.
    *   La función `product_to_json` ahora incluye los tags asociados al producto.
*   **Frontend:**
    *   Vista de gestión de tags en `frontend/src/views/tagsView.js`.
    *   Permite Crear, Listar (como chips), Editar y Eliminar tags.
    *   Se añadió un botón "Tags (Admin)" a la navegación principal en `frontend/index.html`.
    *   `frontend/src/app.js` actualizado para manejar la nueva vista.

### 4. Gestión de Categorías de Productos (Característica 8 de AGENTS.md)

*   **Backend:**
    *   Modelo `Category` en `backend/app.py`.
    *   Endpoints API CRUD en `backend/app.py` para `/api/categories` (Crear, Listar, Actualizar, Eliminar), incluyendo subida opcional de URL de imagen.
    *   Actualizados los endpoints de creación/actualización de Productos para aceptar y procesar `category_ids`.
    *   La función `product_to_json` ahora incluye las categorías asociadas al producto.
*   **Frontend:**
    *   Vista de gestión de categorías en `frontend/src/views/categoriesView.js`.
    *   Permite Crear, Listar (con imagen previa), Editar y Eliminar categorías.
    *   Se añadió un botón "Categorías (Admin)" a la navegación principal en `frontend/index.html`.
    *   `frontend/src/app.js` actualizado para manejar la nueva vista.
    *   **Integración con Productos:** El formulario de creación/edición de productos en `productsView.js` ahora permite asociar múltiples categorías a un producto.

### 5. Gestión de Clientes (Característica 3 de AGENTS.md)

*   **Backend:**
    *   Modelo `Client` en `backend/app.py`.
    *   Endpoints API CRUD en `backend/app.py` para `/api/clients` (Crear, Listar, Obtener por ID, Actualizar, Eliminar).
*   **Frontend:**
    *   Vista de gestión de clientes en `frontend/src/views/clientsView.js`.
    *   Permite Crear, Listar, Editar y Eliminar clientes.
    *   Campos: Nombre, Apodo, WhatsApp, Email, Género, Nivel de Cliente, URL de Imagen de Perfil.
    *   La lista de clientes incluye una barra de búsqueda rápida (filtra por nombre, apodo, WhatsApp, email).
    *   Incluye enlaces directos para contactar por WhatsApp (si se proporciona el número) y Email.
    *   Se añadió un botón "Clientes (Admin)" a la navegación principal.
    *   `frontend/src/app.js` actualizado para la nueva vista.
    *   *Nota: El historial de compras del cliente se implementará con la Gestión de Ventas.*

### 6. Gestión de Ventas (Característica 4 de AGENTS.md)

*   **Backend:**
    *   Modelos `Sale` y `SaleItem` en `backend/app.py`.
    *   Endpoints API en `backend/app.py` para `/api/sales`:
        *   `POST /api/sales`: Crear nueva venta. Valida stock y lo descuenta.
        *   `GET /api/sales`: Listar ventas (permite filtrar por estado).
        *   `GET /api/sales/<id>`: Obtener una venta específica.
        *   `PUT /api/sales/<id>`: Actualizar estado de una venta. Maneja restauración/descuento de stock si se cancela/reactiva una venta.
        *   `DELETE /api/sales/<id>`: Eliminar una venta. Restaura stock si la venta no estaba cancelada.
*   **Frontend:**
    *   Vista de gestión de ventas en `frontend/src/views/salesView.js`.
    *   Permite Crear, Listar y Eliminar ventas, y Editar el estado de las mismas.
    *   **Formulario de Creación/Edición:**
        *   Selector de cliente.
        *   Sección para añadir/eliminar items (productos) al pedido:
            *   Selector de producto (muestra stock actual).
            *   Campo para cantidad.
            *   Campo para precio unitario (autocompletado, editable).
            *   Subtotal del item (calculado).
        *   Monto total de la venta (calculado).
        *   Selector de estado del pedido.
    *   **Listado de Ventas:**
        *   Muestra ID, cliente, fecha, total y estado.
        *   El estado se visualiza con color e ícono.
    *   Se añadió un botón "Ventas (Admin)" a la navegación principal.
    *   `frontend/src/app.js` actualizado para la nueva vista.

### 7. Dashboard (Característica 1 de AGENTS.md)

*   **Backend:**
    *   Endpoint API `GET /api/dashboard/summary` en `backend/app.py` que calcula y retorna conteos y sumas totales para:
        *   Ventas Entregadas (estado 'Entregado', aún no cobradas)
        *   Ventas A Entregar (estados 'Contactado', 'Armado')
        *   Ventas Por Armar (estado 'Contactado')
        *   Ventas Cobradas (estado 'Cobrado')
        *   Ventas A Cobrar (estado 'Entregado')
*   **Frontend:**
    *   Vista de Dashboard en `frontend/src/views/dashboardView.js`.
    *   Muestra cards resumen para las métricas clave obtenidas del backend (conteo y monto total).
    *   Incluye una sección "Pipeline de Ventas (Kanban)" que muestra las ventas como tarjetas en columnas según su estado ('Contactado', 'Armado', 'Entregado', 'Cobrado').
    *   El Dashboard es ahora la vista por defecto al cargar la aplicación.
    *   Se añadió un botón "Dashboard" a la navegación principal (como primer ítem).
    *   `frontend/src/app.js` actualizado para la nueva vista y carga por defecto.
    *   *Nota: La personalización de cards y drag-and-drop en Kanban son mejoras futuras.*

### 8. Gestión de Catálogo de Productos y Promos (Característica 9 de AGENTS.md)

*   **Backend:**
    *   Endpoint API `GET /api/catalog` en `backend/app.py`.
    *   Este endpoint:
        *   Verifica si el "Modo Feria" está activo (desde la configuración).
        *   Si está activo y el producto tiene un `priceFeria`, este se usa como `displayPrice`.
        *   Si no, se usa `priceShowroom` como `displayPrice`.
        *   Determina un `stockStatus` ("AGOTADO", "Pocas unidades!").
        *   Usa `catalogImageUrl` si está disponible, sino `imageUrl`.
        *   Acepta parámetros de consulta `search_term`, `category_ids` (CSV), y `tag_ids` (CSV) para filtrar los productos.
*   **Frontend:**
    *   Vista de catálogo en `frontend/src/views/catalogView.js`.
    *   Muestra los productos en un formato de tarjetas (grid).
    *   Cada tarjeta de producto muestra:
        *   Imagen del producto (con indicación visual si está agotado).
        *   Nombre del producto.
        *   Precio de venta (`displayPrice` determinado por el backend).
        *   Mensaje de "Pocas unidades!" si aplica.
    *   La vista se carga por defecto y es accesible a través del botón "Catálogo" en la navegación.
    *   **Filtros y Búsqueda para Clientes:**
        *   Se añadió una sección de filtros encima del listado de productos.
        *   Incluye un campo de búsqueda por nombre de producto.
        *   Muestra chips (`md-filter-chip`) para todas las categorías y tags disponibles, permitiendo selección múltiple.
        *   Al cambiar cualquier filtro o el término de búsqueda, el catálogo se actualiza dinámicamente llamando a la API con los nuevos parámetros.
        *   La búsqueda por texto usa `debounce` para optimizar las llamadas a la API.

### 9. Sección de Estadísticas y Reportes (Parcial - Característica 11 de AGENTS.md)

*   **Backend:**
    *   Nuevos endpoints API en `backend/app.py` para obtener datos estadísticos:
        *   `GET /api/stats/sales_over_time?period=<day|month|year>`: Devuelve ventas agrupadas por período (cantidad y monto total).
        *   `GET /api/stats/top_products?by=<quantity|value>&limit=<N>`: Devuelve los N productos más vendidos por cantidad o valor.
        *   `GET /api/stats/top_clients?by=<frequency|value>&limit=<N>`: Devuelve los N clientes top por frecuencia o valor de compra.
        *   `GET /api/stats/stock_summary`: Devuelve un listado de productos con stock crítico y productos agotados.
    *   Las consultas excluyen ventas canceladas para cálculos financieros.
*   **Frontend:**
    *   Vista de estadísticas en `frontend/src/views/statsView.js`.
    *   Muestra en tablas los datos obtenidos de los endpoints de estadísticas:
        *   Ventas a lo largo del tiempo (con selector de período: Diario, Mensual, Anual).
        *   Top productos (con selector para ver por Cantidad o Valor).
        *   Top clientes (con selector para ver por Frecuencia o Valor).
        *   Resumen de stock (productos críticos y agotados).
    *   **Exportación a CSV:** Cada tabla de estadísticas ahora incluye un botón para descargar los datos en formato CSV.
    *   Se añadió un botón "Estadísticas (Admin)" a la navegación principal.
    *   `frontend/src/app.js` actualizado para la nueva vista.
    *   *Nota: Gráficos visuales son mejoras futuras.*

---
*Este README se actualizará a medida que el proyecto avance.*
