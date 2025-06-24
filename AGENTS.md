# AGENTS.md para "Showroom Natura OjitOs"

Este archivo proporciona contexto y directrices para el agente de IA Jules, ayudándolo a entender y trabajar con este repositorio de manera más efectiva para la aplicación "Showroom Natura OjitOs".

---

## 1. Visión General del Proyecto

"Showroom Natura OjitOs" es una aplicación web responsiva diseñada para la gestión integral de productos cosméticos Natura, clientes, ventas y un catálogo interactivo. La arquitectura del proyecto busca ser moderna, con una clara separación entre el frontend y el backend para facilitar la escalabilidad y el mantenimiento.

**Entorno de Desarrollo:**
* **Sistema Operativo:** Windows 11
* **IDE:** Visual Studio Code
* **IMPORTANTE:** La aplicación se utilizará de manera local en una PC

**Tecnologías Clave:**
* **Backend:** Se optará por la tecnología que sea la más fácil de implementar ya que el desarrollador no tiene mucha experiencia. Esto implica una solución moderna y eficiente. 
* **Frontend:** **HTML, JavaScript y CSS**, con la implementación de **Material Design 3 (M3)** para los componentes UI/UX. Se utilizará un **framework de JavaScript (el mas simple de implementar de manera local)** para construir la interfaz dinámica y gestionar el estado.
* **Base de Datos:** **SQLite** (para simplicidad y portabilidad en una primera fase). Se requerirá un **ORM (Object-Relational Mapper)** (el mas simple de implementar de manera local) para manejar las interacciones con la base de datos de manera eficiente y segura, incluyendo las relaciones entre entidades.
* **Tipografía Principal:** **Comfortaa**.

**Consideraciones Técnicas Generales:**
* **Responsividad:** El diseño debe ser adaptable a cualquier tamaño de pantalla, desde dispositivos móviles pequeños hasta desktops, usando un enfoque **mobile-first**.
* **Modo Oscuro:** Se debe implementar una funcionalidad de alternancia (toggle) entre tema claro y oscuro para toda la interfaz, utilizando los sistemas de temas de Material Design 3.
* **Seguridad:** La aplicación no debe requerir el login, solo la utilizara una persona quien debe tener todos los privilegios.
* **Rendimiento:** La aplicación debe ser optimizada para minimizar los clics del usuario y asegurar tiempos de carga rápidos. Se aplicará **carga perezosa (lazy loading)** para componentes y datos donde sea apropiado. Las consultas a la base de datos deben ser eficientes y optimizadas para el catálogo y reportes.
* **Escalabilidad:** La arquitectura debe ser modular y bien organizada para permitir futuras expansiones y la adición de nuevas funcionalidades sin grandes reestructuraciones.

---

## 2. Estructura del Repositorio (Propuesta Actualizada)

La estructura del repositorio mantendrá una separación clara entre frontend y backend, con una organización modular dentro de cada uno.

* `/frontend`: Contendrá todo el código de la interfaz de usuario.
    * `/frontend/src/components`: Componentes reutilizables de UI.
    * `/frontend/src/pages`: Vistas o pantallas principales de la aplicación (Dashboard, Products, Clients, Sales, Settings, Auth, UserManagement, TagManagement, CategoryManagement, Catalog, ClientProfile, Cart, Wishlist, OrderHistory, Stats, etc.).
    * `/frontend/src/assets`: Imágenes, íconos, tipografías (Comfortaa), logo de la marca.
    * `/frontend/src/styles`: Archivos CSS generales, configuración de temas (claro/oscuro) y variables de Material Design 3.
    * `/frontend/src/utils`: Funciones de utilidad, helpers (ej. para cálculos, validaciones frontend, formateo de datos, manejo de tokens).
    * `/frontend/src/services`: Lógica para interactuar con la API del backend, incluyendo manejo de autenticación/autorización y APIs específicas para cada módulo.
    * `/frontend/src/hooks`: Hooks personalizados (si se usa React) para lógica de estado y efectos.
* `/backend`: Contendrá el código del servidor y la lógica de negocio.
    * `/backend/src/controllers`: Lógica para manejar las peticiones HTTP y coordinar respuestas.
    * `/backend/src/services`: Lógica de negocio principal y orquestación de operaciones, incluyendo gestión de tags, categorías, lógica de catálogo, perfil de cliente, historial de pedidos, puntos y estadísticas.
    * `/backend/src/models`: Definición de modelos de datos (esquemas de la DB) y lógica de validación de modelos, incluyendo `Product`, `Client`, `Sale`, `SaleItem`, `Config`, `Tag`, `Category`, `CatalogProduct`, `ClientPoint` (o integración en `Client`).
    * `/backend/src/routes`: Definición de las rutas de la API y middleware de autenticación/autorización para cada ruta. Rutas específicas para tags, categorías, catálogo, y endpoints accesibles para clientes y para las nuevas funcionalidades.
    * `/backend/src/database`: Archivos de configuración y migración de la base de datos (SQLite), y la instancia del ORM.
    * `/backend/src/middlewares`: Middleware de Express (o framework equivalente) para manejo de errores global.
    * `/backend/src/lib`: Librerías o módulos internos para tareas específicas (ej. cálculos de precios de venta, utilidades de autenticación/hashing de contraseñas, generación de JWT, lógica de puntos).
* `/public`: Archivos estáticos o de acceso público (imágenes de productos subidas, imágenes de perfil de clientes, logo de la marca configurado, etc.).
* `/docs`: Documentación adicional del proyecto.

---

## 3. Características de la Aplicación (Implementadas y Pendientes)

### **3.1. Dashboard (Implementado - Característica 1)**

El dashboard será la vista principal al ingresar a la aplicación para administradores y vendedores, mostrando un resumen visual del estado del negocio.

* **Cards Visuales:** Ventas Entregadas, A Entregar, Por Armar, Cobradas, A Cobrar.
* **Cards Personalizables:** El usuario podrá reorganizar o seleccionar qué cards visualiza. La configuración debe persistir.
* **Indicadores Visuales y Colores:** Uso de íconos y colores intuitivos (alineados con Material Design 3) para representar el estado y la cantidad.
* **Vista Estilo Pipeline (Kanban):** Una sección del dashboard o vista secundaria mostrando el flujo de ventas como un tablero Kanban, con columnas representando los diferentes estados del pedido.

### **3.2. Gestión de Productos y Stock (Implementado - Característica 2)**

Este módulo permitirá la administración completa del catálogo de productos y el control de inventario.

* **CRUD Completo:** Funcionalidades de Crear, Leer, Actualizar y Eliminar productos.
* **Datos del Producto:** ID, Nombre, Categorías, Tags, Precios (Revista, Showroom (-20%), Feria (-35%)), Stock Actual, Stock Crítico (con alerta visual), Imagen del Producto (subida).
* **Edición Rápida:** Posibilidad de editar campos clave directamente desde la vista de lista/tabla.
* **Filtros + Colores para Alertas de Stock:** Filtros avanzados y uso de colores intuitivos para resaltar stock crítico/agotado.
* **Sticky Header con Filtros Tipo Chips:** En la vista de listado, la barra de encabezado con filtros debe permanecer visible.
* **Wishlist Integración (Anticipado):** La estructura de productos debe permitir la selección para una "wishlist" y pasaje a carrito.

### **3.3. Gestión de Clientes (Implementado - Característica 3)**

Este módulo permitirá la administración completa de la información de los clientes, su contacto e historial.

* **CRUD Completo:** Funcionalidades de Crear, Leer, Actualizar y Eliminar clientes.
* **Datos del Cliente:** ID Cliente, Nombre Completo, Apodo (opcional), WhatsApp (con ícono de contacto directo), Email, Género (F/M/Otro), Nivel de Cliente (Nuevo/Frecuente/VIP), Imagen de Perfil (subida).
* **Contacto Directo desde la Ficha del Cliente:** Botones/íconos para contactar por WhatsApp o Email.
* **Tabla con Búsqueda Rápida:** Vista de listado de clientes con búsqueda reactiva.
* **Vista Individual con Historial de Compras:** Vista detallada del cliente incluyendo un registro de todas las transacciones/pedidos asociados, con detalles clave.

### **3.4. Gestión de Ventas (Implementado - Característica 4)**

Este módulo central manejará el ciclo de vida de los pedidos, desde su creación hasta la entrega y el cobro.

* **CRUD Completo:** Funcionalidades de Crear, Leer, Actualizar y Eliminar pedidos/ventas.
* **Datos del Pedido:** ID Pedido, Cliente (relación), Fecha de Venta (autogenerada/editable), Productos Vendidos (lista de ítems con Producto, Cantidad, Precio Feria (autocompletado/editable), Stock actual (solo lectura), Subtotal), Total de Venta (calculado).
* **Estado del Pedido:** Campo de selección/acciones para cambiar el estado (Contactado 💬, Armado 📤, Entregado 📦, Cobrado 💵).
* **Visualización por Estados y Filtros:** Lista de ventas filtrable por estado. Integración con Kanban del Dashboard.
* **Cálculos Automáticos:** Totales, descuentos (a futuro), **puntos ganados (integración con Característica 11)**.
* **Botón de Eliminar Circular:** Botones de eliminación con diseño circular y confirmación.
* **Estados con Tooltips:** Tooltips al pasar el mouse sobre el estado.
* **Indicadores Visuales:** Colores e íconos Material Design según estado.

### **3.5. Gestión de Configuración (Implementado - Característica 5)**

Este módulo permitirá a los usuarios administradores personalizar y gestionar la información global y los parámetros de la aplicación.

* **CRUD de Información del Sitio:** Personalización de Marca (Nombre, Colores, Logo, Información de Contacto), Redes Sociales (Instagram, TikTok, WhatsApp, Link de Feria Online), Dirección Física (Ubicación del showroom), Parámetros del Sistema (Configuraciones generales).
* **Acceso Exclusivo:** Esta sección debe ser accesible **únicamente por el rol de Administrador**.

### **3.6. Gestión de Tags (Implementado - Característica 7)**

Este módulo permite la administración de etiquetas descriptivas que se pueden asignar a los productos para facilitar la búsqueda y categorización.

* **CRUD Completo:** Funcionalidades de Crear, Leer, Actualizar y Eliminar tags.
    * **Datos del Tag:** Principalmente un campo de texto para el **Nombre del Tag**.
    * Cada tag debe tener un **ID único** (autogenerado).
* **Interfaz de Gestión:** Una tabla o lista en el panel de administración.
* **Integración con Productos:**
    * Al crear o editar un producto, debe haber un componente de selección que permita asignar uno o varios tags existentes.
    * La relación entre productos y tags es de **muchos a muchos**.

### **3.7. Gestión de Categorías de Productos (Implementado - Característica 8)**

Este módulo permite la administración de las categorías a las que pertenecen los productos (ej., "Perfumería", "Cuidado Corporal", "Maquillaje", "Rostro", "Cabello", "Infantiles", "Kits").

* **CRUD Completo:** Funcionalidades de Crear, Leer, Actualizar y Eliminar categorías.
    * **Datos de la Categoría:** ID, Nombre, Imagen (Opcional), Categoría Padre (Opcional - para jerarquía).
* **Interfaz de Gestión:** Una vista que permita ver las categorías, crear nuevas, editar y eliminar. Si hay jerarquía, debe visualizarse.
* **Integración con Productos:**
    * Al crear o editar un producto, debe haber un componente de selección que permita asignar una o varias categorías existentes.
    * La relación entre productos y categorías es de **muchos a muchos**.

### **3.8. Gestión de Catálogo de Productos y Promos (Implementado - Característica 9)**

Este módulo define la interfaz pública del catálogo de productos, accesible por los clientes, mostrando los productos disponibles y las promociones mediante un link publico que se pueda compartir por whatsapp. 

* **CRUD del Catálogo Visible por Clientes:**
    * **Agregar productos desde el stock general:** Seleccionar productos del inventario para mostrar en el catálogo.
    * **Posibilidad de cambiar precio e imagen (solo para el catálogo):** Sobreescribir `Precio Feria` y `Imagen` para la vista del catálogo. Se recomienda un modelo `CatalogProduct` separado.
* **Posibilidad de marcar un producto como AGOTADO:**
    * Marcado visual claro ("AGOTADO") y atenuación de la imagen/texto.
    * **Basado en el `Stock Actual` del inventario (cuando llega a 0).**
* **Diseño centrado en el cliente:** Intuitivo, visualmente atractivo y fácil de navegar.
* **Filtros y Búsqueda para Clientes (anticipado):** Catálogo requerirá filtros por categoría, tags y una barra de búsqueda.

### **3.9. Interfaz Usuario Incognito (Implementado - Característica 10)**

Este módulo define la experiencia del usuario final (el cliente como usuario incognito ya que no puede hacer login) al interactuar con la aplicación. Los clientes tienen acceso limitado sólo al "Catálogo de Productos y Promos".

* **Acceso Restringido:** Los clientes **no tienen acceso a ningún módulo administrativo**.
* **Vistas Principales para el Cliente:**
    * **Vista de Catálogo:** Principal para clientes, muestra productos y promos (Característica 9).
        * **Alertas de Stock para Cliente:** Visualización de "Pocas unidades!" (<= 5) y "AGOTADO" (stock 0) con efectos visuales.

### **3.11. Modo "Feria" y Estadísticas (Implementado - Característica 11)**

Este módulo agrupa funcionalidades adicionales que mejoran la interacción del cliente y proporcionan herramientas de análisis al administrador.

* **Modo "Feria" / "Evento":**
    * **Activación:** Un toggle (`on/off`) en la **Gestión de Configuración (Característica 5)** que permite activar o desactivar el "Modo Feria".
    * **Comportamiento:** Cuando el "Modo Feria" está **activado**:
        * Todos los productos en el **Catálogo (Característica 9)** deben mostrar el **Precio Feria** en lugar del Precio Showroom o Revista.
* **Sección de Estadísticas y Reportes:**
    * **Acceso:** Esta sección es exclusiva para el usuario principal con todos los privilegios.
    * **Visualizaciones Clave:**
        * **Ventas por Período:** Gráficos y tablas que muestren el total de ventas (monto y cantidad de pedidos) por día, semana, mes, año.
        * **Productos Más Vendidos:** Lista de los productos más vendidos por cantidad y por valor.
        * **Clientes Top:** Clientes que más compran (por frecuencia y por monto).
        * **Estadísticas de Stock:** Resumen de productos con stock crítico/agotado, rotación de inventario (a futuro).
    * **Filtros:** Posibilidad de filtrar estadísticas por fechas, vendedores, categorías, etc.
    * **Exportación:** Opción para exportar datos a formatos comunes (ej., CSV, PDF para reportes básicos).

---

## 4. Directrices para Jules

* **Prioridad Absoluta:** Mantener la coherencia con **Material Design 3** en el frontend, utilizando sus componentes y principios de diseño para una UI/UX consistente y moderna en todas las vistas, incluyendo las nuevas de wishlist y estadísticas.
* **Tipografía:** Usar **Comfortaa** consistentemente en todos los textos y componentes.
* **Backend:**
    * La implementación del **Modo "Feria"** implicará una lógica condicional en los endpoints del catálogo que retornan los precios, para servir `Precio Feria` si el modo está activo.
    * Para las **Estadísticas**, el backend debe proporcionar endpoints optimizados para realizar consultas agregadas y complejas a la base de datos de ventas, productos y clientes. Esto podría requerir el uso de sentencias SQL avanzadas o funciones específicas del ORM para sumar, agrupar y filtrar datos eficientemente.
* **Frontend:**
    * El **framework de JavaScript** es esencial para la interfaz dinámica y reactiva de las estadísticas.
    * La **interfaz de configuración del Modo "Feria"** debe ser un toggle simple en la sección de configuración.
    * Para las **Estadísticas**, utilizar componentes de Material Design 3 para mostrar gráficos (ej., librerías como Chart.js integradas con Material Design) y tablas de datos filtrables y paginadas.
    * Implementar **carga perezosa (lazy loading)** para las imágenes de productos en la wishlist y optimizar el rendimiento de las vistas de estadísticas que puedan cargar grandes volúmenes de datos.
* **Responsividad:** Diseñar todas las interfaces, especialmente las de la wishlist y las estadísticas, con un enfoque **mobile-first**, garantizando una experiencia de usuario óptima en dispositivos móviles.
* **Seguridad:**
    * El **Modo "Feria"** y la **Sección de Estadísticas** son funcionalidades administrativas y deben ser accesibles solo por el usuario principal con todos los privilegios.
* **Modularidad:** Mantener el código bien organizado y asegurar que los componentes y servicios sean reutilizables y desacoplados. Las lógicas para puntos, modo feria y estadísticas deben ser servicios claros y bien definidos.