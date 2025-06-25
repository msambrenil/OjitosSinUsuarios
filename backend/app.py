import os
import datetime # Para fechas y deltas
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func, extract # Para funciones SQL como SUM, COUNT, y extract para partes de fechas
from flask_cors import CORS

# Crear la carpeta 'instance' si no existe, ya que ahí vivirá el SQLite
instance_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'instance')
os.makedirs(instance_path, exist_ok=True)

app = Flask(__name__)
CORS(app) # Habilitar CORS para todas las rutas

# Configuración de la base de datos SQLAlchemy
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(instance_path, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Modelos de la Base de Datos ---

# Tabla de asociación para la relación muchos a muchos entre Product y Tag
product_tags_table = db.Table('product_tags',
    db.Column('product_id', db.Integer, db.ForeignKey('product.id'), primary_key=True),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'), primary_key=True)
)

# Tabla de asociación para la relación muchos a muchos entre Product y Category
product_categories_table = db.Table('product_categories',
    db.Column('product_id', db.Integer, db.ForeignKey('product.id'), primary_key=True),
    db.Column('category_id', db.Integer, db.ForeignKey('category.id'), primary_key=True)
)

class Config(db.Model):
    __tablename__ = 'config'
    id = db.Column(db.Integer, primary_key=True)
    siteName = db.Column(db.String(100), default="Showroom Natura OjitOs")
    brandColorPrimary = db.Column(db.String(7), default="#6750A4") # Color M3 por defecto
    logoUrl = db.Column(db.String(255), nullable=True)
    contactInfo = db.Column(db.String(255), nullable=True) # Email, teléfono general
    socialInstagram = db.Column(db.String(255), nullable=True)
    socialTikTok = db.Column(db.String(255), nullable=True)
    socialWhatsApp = db.Column(db.String(255), nullable=True) # Link directo o número
    feriaOnlineLink = db.Column(db.String(255), nullable=True)
    showroomAddress = db.Column(db.String(255), nullable=True)
    isFeriaModeActive = db.Column(db.Boolean, default=False, nullable=False)
    # Otros parámetros del sistema que puedan surgir

class Product(db.Model):
    __tablename__ = 'product'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    # Relación muchos a muchos con Category
    categories = db.relationship('Category', secondary=product_categories_table, lazy='subquery',
                                 backref=db.backref('products', lazy=True))
    # Relación muchos a muchos con Tag
    tags = db.relationship('Tag', secondary=product_tags_table, lazy='subquery',
                           backref=db.backref('products', lazy=True))
    priceRevista = db.Column(db.Float, nullable=True) # Precio de revista/catálogo oficial
    priceShowroom = db.Column(db.Float, nullable=False) # Precio normal (-20% aprox)
    priceFeria = db.Column(db.Float, nullable=True) # Precio especial feria (-35% aprox)
    stockActual = db.Column(db.Integer, default=0, nullable=False)
    stockCritico = db.Column(db.Integer, default=1, nullable=False) # Alerta si stockActual <= stockCritico
    imageUrl = db.Column(db.String(255), nullable=True)
    # Campo para el catálogo (si se quiere sobreescribir imagen/precio solo para catálogo)
    catalogImageUrl = db.Column(db.String(255), nullable=True)
    catalogPrice = db.Column(db.Float, nullable=True)

    # Relación con SaleItem
    sale_items = db.relationship('SaleItem', backref='product', lazy=True)

class Category(db.Model):
    __tablename__ = 'category'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True)
    imageUrl = db.Column(db.String(255), nullable=True)
    # Para jerarquía (opcional, no implementado en esta fase inicial)
    # parent_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=True)
    # children = db.relationship('Category', backref=db.backref('parent', remote_side=[id]), lazy=True)

class Tag(db.Model):
    __tablename__ = 'tag'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True)

class Client(db.Model):
    __tablename__ = 'client'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    nickname = db.Column(db.String(50), nullable=True)
    whatsapp = db.Column(db.String(20), nullable=True) # Para link directo: api.whatsapp.com/send?phone=NUMERO
    email = db.Column(db.String(100), nullable=True)
    gender = db.Column(db.String(10), nullable=True) # F/M/Otro
    clientLevel = db.Column(db.String(20), default="Nuevo") # Nuevo/Frecuente/VIP
    profileImageUrl = db.Column(db.String(255), nullable=True)
    # Historial de compras
    sales = db.relationship('Sale', backref='client', lazy=True)

class Sale(db.Model):
    __tablename__ = 'sale'
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('client.id'), nullable=False)
    saleDate = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    totalAmount = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(20), default="Contactado") # Contactado 💬, Armado 📤, Entregado 📦, Cobrado 💵
    # Relación con SaleItem
    items = db.relationship('SaleItem', backref='sale', lazy=True, cascade="all, delete-orphan")

class SaleItem(db.Model):
    __tablename__ = 'sale_item'
    id = db.Column(db.Integer, primary_key=True)
    sale_id = db.Column(db.Integer, db.ForeignKey('sale.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('product.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    price_at_sale = db.Column(db.Float, nullable=False) # Precio del producto al momento de la venta (puede ser priceFeria o priceShowroom)
    subtotal = db.Column(db.Float, nullable=False, default=0.0) # quantity * price_at_sale

# --- Rutas y Lógica de la Aplicación ---

@app.route('/')
def hello():
    return "Backend del Showroom Natura OjitOs funcionando!"

# --- API Endpoints ---

# Endpoint para la Configuración
@app.route('/api/config', methods=['GET'])
def get_config():
    config = Config.query.first()
    if not config:
        # Si no hay configuración, crear una por defecto y guardarla
        config = Config()
        db.session.add(config)
        db.session.commit()

    return jsonify({
        'id': config.id,
        'siteName': config.siteName,
        'brandColorPrimary': config.brandColorPrimary,
        'logoUrl': config.logoUrl,
        'contactInfo': config.contactInfo,
        'socialInstagram': config.socialInstagram,
        'socialTikTok': config.socialTikTok,
        'socialWhatsApp': config.socialWhatsApp,
        'feriaOnlineLink': config.feriaOnlineLink,
        'showroomAddress': config.showroomAddress,
        'isFeriaModeActive': config.isFeriaModeActive
    })

@app.route('/api/config', methods=['PUT'])
def update_config():
    data = request.json
    if not data:
        return jsonify({'error': 'Cuerpo de la petición vacío o no es JSON.'}), 400

    config = Config.query.first()
    if not config:
        # Si no hay configuración, es probable que queramos crearla aquí también o error
        # Por ahora, asumimos que get_config() se llamó o que la DB no está vacía.
        # Para mayor robustez, se podría crear una config por defecto si no existe.
        config = Config()
        db.session.add(config)

    config.siteName = data.get('siteName', config.siteName)
    config.brandColorPrimary = data.get('brandColorPrimary', config.brandColorPrimary)
    config.logoUrl = data.get('logoUrl', config.logoUrl)
    config.contactInfo = data.get('contactInfo', config.contactInfo)
    config.socialInstagram = data.get('socialInstagram', config.socialInstagram)
    config.socialTikTok = data.get('socialTikTok', config.socialTikTok)
    config.socialWhatsApp = data.get('socialWhatsApp', config.socialWhatsApp)
    config.feriaOnlineLink = data.get('feriaOnlineLink', config.feriaOnlineLink)
    config.showroomAddress = data.get('showroomAddress', config.showroomAddress)

    # Manejo especial para el booleano isFeriaModeActive
    is_feria_mode_active = data.get('isFeriaModeActive')
    if isinstance(is_feria_mode_active, bool):
        config.isFeriaModeActive = is_feria_mode_active
    elif isinstance(is_feria_mode_active, str): # Si viene como string "true" o "false"
        config.isFeriaModeActive = is_feria_mode_active.lower() == 'true'

    db.session.commit()
    return jsonify({'message': 'Configuración actualizada exitosamente!'})

# --- API Endpoints para Productos ---

def product_to_json(product):
    """Convierte un objeto Product a un diccionario JSON serializable."""
    return {
        'id': product.id,
        'name': product.name,
        'priceRevista': product.priceRevista,
        'priceShowroom': product.priceShowroom,
        'priceFeria': product.priceFeria,
        'stockActual': product.stockActual,
        'stockCritico': product.stockCritico,
        'imageUrl': product.imageUrl,
        'catalogImageUrl': product.catalogImageUrl,
        'catalogPrice': product.catalogPrice,
        'tags': [tag_to_json(tag) for tag in product.tags],
        'categories': [category_to_json(category) for category in product.categories] # Asumiendo que existirá category_to_json
    }

@app.route('/api/products', methods=['POST'])
def create_product():
    data = request.json
    if not data:
        return jsonify({'error': 'Cuerpo de la petición vacío o no es JSON.'}), 400

    name_data = data.get('name')
    price_showroom_data = data.get('priceShowroom')

    if not name_data or not name_data.strip() or price_showroom_data is None: # priceShowroom puede ser 0, así que None es mejor check
        return jsonify({'error': 'Datos incompletos. Nombre y Precio Showroom son requeridos.'}), 400

    new_product = Product()
    new_product.name = name_data.strip()
    new_product.priceRevista = data.get('priceRevista')
    new_product.priceShowroom = price_showroom_data
    new_product.priceFeria = data.get('priceFeria')
    new_product.stockActual = data.get('stockActual', 0)
    new_product.stockCritico = data.get('stockCritico', 1)
    new_product.imageUrl = data.get('imageUrl')
    new_product.catalogImageUrl = data.get('catalogImageUrl')
    new_product.catalogPrice = data.get('catalogPrice')

    tag_ids = data.get('tag_ids', [])
    if tag_ids:
        for tag_id in tag_ids:
            tag = Tag.query.get(tag_id)
            if tag:
                new_product.tags.append(tag)

    category_ids = data.get('category_ids', [])
    if category_ids:
        for cat_id in category_ids:
            category = Category.query.get(cat_id)
            if category:
                new_product.categories.append(category)

    db.session.add(new_product)
    db.session.commit()
    return jsonify(product_to_json(new_product)), 201

@app.route('/api/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([product_to_json(product) for product in products])

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product_to_json(product))

@app.route('/api/products/<int:product_id>', methods=['PUT'])
def update_product(product_id):
    product = Product.query.get_or_404(product_id)
    data = request.json
    if not data:
        return jsonify({'error': 'Cuerpo de la petición vacío o no es JSON.'}), 400

    product.name = data.get('name', product.name) if data.get('name') is not None else product.name # Asegurar que no se borre si no viene
    product.priceRevista = data.get('priceRevista', product.priceRevista) if data.get('priceRevista') is not None else product.priceRevista
    product.priceShowroom = data.get('priceShowroom', product.priceShowroom) if data.get('priceShowroom') is not None else product.priceShowroom
    product.priceFeria = data.get('priceFeria', product.priceFeria)
    product.stockActual = data.get('stockActual', product.stockActual)
    product.stockCritico = data.get('stockCritico', product.stockCritico)
    product.imageUrl = data.get('imageUrl', product.imageUrl)
    product.catalogImageUrl = data.get('catalogImageUrl', product.catalogImageUrl)
    product.catalogPrice = data.get('catalogPrice', product.catalogPrice)

    # Lógica para actualizar tags
    tag_ids = data.get('tag_ids') # Si es None, no se actualizan. Si es [], se borran todos.
    if tag_ids is not None:
        product.tags.clear() # Limpiar tags existentes
        if tag_ids: # Si la lista no está vacía
            for tag_id in tag_ids:
                tag = Tag.query.get(tag_id)
                if tag:
                    product.tags.append(tag)

    # Lógica para actualizar categorías
    category_ids = data.get('category_ids')
    if category_ids is not None:
        product.categories.clear()
        if category_ids:
            for cat_id in category_ids:
                category = Category.query.get(cat_id)
                if category:
                    product.categories.append(category)

    db.session.commit()
    return jsonify(product_to_json(product))

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    product = Product.query.get_or_404(product_id)
    db.session.delete(product)
    db.session.commit()
    return jsonify({'message': 'Producto eliminado exitosamente.'})

# --- API Endpoint para el Catálogo Público ---
@app.route('/api/catalog', methods=['GET'])
def get_catalog():
    search_term = request.args.get('search_term', '').strip()
    category_ids_str = request.args.get('category_ids', '') # CSV de IDs
    tag_ids_str = request.args.get('tag_ids', '') # CSV de IDs

    config = Config.query.first()
    is_feria_active = config.isFeriaModeActive if config else False

    query = Product.query

    if search_term:
        query = query.filter(Product.name.ilike(f'%{search_term}%')) # Búsqueda case-insensitive

    if category_ids_str:
        try:
            category_ids = [int(id_str) for id_str in category_ids_str.split(',') if id_str.strip()]
            if category_ids:
                query = query.join(Product.categories).filter(Category.id.in_(category_ids))
        except ValueError:
            return jsonify({'error': 'category_ids debe ser una lista de números enteros separados por comas.'}), 400

    if tag_ids_str:
        try:
            tag_ids = [int(id_str) for id_str in tag_ids_str.split(',') if id_str.strip()]
            if tag_ids:
                query = query.join(Product.tags).filter(Tag.id.in_(tag_ids))
        except ValueError:
            return jsonify({'error': 'tag_ids debe ser una lista de números enteros separados por comas.'}), 400

    products_query = query.order_by(Product.name).all() # Ordenar por nombre
    catalog_products = []

    for p in products_query:
        display_price = p.priceShowroom # Precio por defecto
        if is_feria_active and p.priceFeria is not None:
            display_price = p.priceFeria

        # Si hay un precio específico de catálogo y NO estamos en modo feria, podría usarse.
        # AGENTS.md: "Posibilidad de cambiar precio e imagen (solo para el catálogo): Sobreescribir `Precio Feria` y `Imagen` para la vista del catálogo."
        # Esto sugiere que `catalogPrice` y `catalogImageUrl` son para el catálogo general, no específicamente feria.
        # Si `catalogPrice` existe, y no estamos en modo feria, podría tener precedencia sobre showroom.
        # Por ahora, la lógica es: Modo Feria -> priceFeria (si existe), sino priceShowroom.
        # Si AGENTS.md implica que catalogPrice es EL precio del catálogo (y priceFeria lo sobreescribe en modo feria), la lógica cambiaría.
        # Mantendré la lógica simple por ahora: Feria usa PriceFeria, sino PriceShowroom. CatalogPrice/ImageUrl se pueden usar en el frontend si se desea.

        stock_status = ""
        if p.stockActual == 0:
            stock_status = "AGOTADO"
        elif p.stockActual > 0 and p.stockActual <= p.stockCritico:
            stock_status = "Pocas unidades!"

        catalog_products.append({
            'id': p.id,
            'name': p.name,
            'displayPrice': display_price,
            'imageUrl': p.catalogImageUrl if p.catalogImageUrl else p.imageUrl, # Usar imagen de catálogo si existe
            'stockActual': p.stockActual,
            'stockCritico': p.stockCritico,
            'stockStatus': stock_status,
            # Incluir categorías y tags si se decide mostrarlos en el catálogo
            # 'categories': [c.name for c in p.categories],
            # 'tags': [t.name for t in p.tags],
        })

    return jsonify(catalog_products)

# --- API Endpoints para Tags ---

def tag_to_json(tag):
    return {'id': tag.id, 'name': tag.name}

@app.route('/api/tags', methods=['POST'])
def create_tag():
    data = request.json
    if not data or not data.get('name') or not data.get('name').strip():
        return jsonify({'error': 'El nombre del tag es requerido.'}), 400

    name_stripped = data['name'].strip()
    existing_tag = Tag.query.filter_by(name=name_stripped).first()
    if existing_tag:
        return jsonify({'error': 'Este tag ya existe.'}), 409 # Conflict

    new_tag = Tag()
    new_tag.name = name_stripped
    db.session.add(new_tag)
    db.session.commit()
    return jsonify(tag_to_json(new_tag)), 201

@app.route('/api/tags', methods=['GET'])
def get_tags():
    tags = Tag.query.order_by(Tag.name).all()
    return jsonify([tag_to_json(tag) for tag in tags])

@app.route('/api/tags/<int:tag_id>', methods=['PUT'])
def update_tag(tag_id):
    tag = Tag.query.get_or_404(tag_id)
    data = request.json
    if not data:
        return jsonify({'error': 'Cuerpo de la petición vacío o no es JSON.'}), 400

    new_name_data = data.get('name')
    if not new_name_data or not new_name_data.strip():
        return jsonify({'error': 'El nombre del tag es requerido.'}), 400

    new_name = new_name_data.strip()
    existing_tag_with_new_name = Tag.query.filter(Tag.id != tag_id, Tag.name == new_name).first()
    if existing_tag_with_new_name:
        return jsonify({'error': 'Ya existe otro tag con este nombre.'}), 409

    tag.name = new_name
    db.session.commit()
    return jsonify(tag_to_json(tag))

@app.route('/api/tags/<int:tag_id>', methods=['DELETE'])
def delete_tag(tag_id):
    tag = Tag.query.get_or_404(tag_id)

    # Opcional: verificar si el tag está siendo usado por algún producto
    if tag.products: # Si la backref 'products' en el modelo Tag tiene elementos
        return jsonify({'error': 'Este tag está asociado a productos y no puede ser eliminado directamente.'}), 400
        # Alternativamente, se podrían desasociar los productos aquí antes de eliminar.
        # O permitir la eliminación y que la relación se rompa (depende del comportamiento deseado).

    db.session.delete(tag)
    db.session.commit()
    return jsonify({'message': 'Tag eliminado exitosamente.'})

# --- API Endpoints para Categorías ---

def category_to_json(category):
    return {'id': category.id, 'name': category.name, 'imageUrl': category.imageUrl}

@app.route('/api/categories', methods=['POST'])
def create_category():
    data = request.json
    if not data or not data.get('name') or not data.get('name').strip():
        return jsonify({'error': 'El nombre de la categoría es requerido.'}), 400

    existing_category = Category.query.filter_by(name=data['name'].strip()).first()
    if existing_category:
        return jsonify({'error': 'Esta categoría ya existe.'}), 409

    new_category = Category()
    new_category.name = data['name'].strip()
    new_category.imageUrl = data.get('imageUrl')

    db.session.add(new_category)
    db.session.commit()
    return jsonify(category_to_json(new_category)), 201

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.order_by(Category.name).all()
    return jsonify([category_to_json(cat) for cat in categories])

@app.route('/api/categories/<int:category_id>', methods=['PUT'])
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.json
    if not data:
        return jsonify({'error': 'Cuerpo de la petición vacío o no es JSON.'}), 400

    new_name_data = data.get('name')
    if not new_name_data or not new_name_data.strip():
        return jsonify({'error': 'El nombre de la categoría es requerido.'}), 400

    new_name = new_name_data.strip()
    existing_cat_with_new_name = Category.query.filter(Category.id != category_id, Category.name == new_name).first()
    if existing_cat_with_new_name:
        return jsonify({'error': 'Ya existe otra categoría con este nombre.'}), 409

    category.name = new_name
    category.imageUrl = data.get('imageUrl', category.imageUrl)
    db.session.commit()
    return jsonify(category_to_json(category))

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    if category.products: # Si la backref 'products' tiene elementos
        return jsonify({'error': 'Esta categoría está asociada a productos y no puede ser eliminada directamente.'}), 400

    db.session.delete(category)
    db.session.commit()
    return jsonify({'message': 'Categoría eliminada exitosamente.'})

# --- API Endpoints para Clientes ---

def client_to_json(client):
    return {
        'id': client.id,
        'name': client.name,
        'nickname': client.nickname,
        'whatsapp': client.whatsapp,
        'email': client.email,
        'gender': client.gender,
        'clientLevel': client.clientLevel,
        'profileImageUrl': client.profileImageUrl,
        # 'sales': [sale.id for sale in client.sales] # Podría ser útil más adelante
    }

@app.route('/api/clients', methods=['POST'])
def create_client():
    data = request.json
    if not data or not data.get('name') or not data.get('name').strip():
        return jsonify({'error': 'El nombre del cliente es requerido.'}), 400

    new_client = Client()
    new_client.name = data['name'].strip()
    new_client.nickname = data.get('nickname', '').strip()
    new_client.whatsapp = data.get('whatsapp', '').strip()
    new_client.email = data.get('email', '').strip()
    new_client.gender = data.get('gender')
    new_client.clientLevel = data.get('clientLevel', 'Nuevo')
    new_client.profileImageUrl = data.get('profileImageUrl')

    db.session.add(new_client)
    db.session.commit()
    return jsonify(client_to_json(new_client)), 201

@app.route('/api/clients', methods=['GET'])
def get_clients():
    # Implementar búsqueda si se necesita: request.args.get('search_term')
    clients = Client.query.order_by(Client.name).all()
    return jsonify([client_to_json(client) for client in clients])

@app.route('/api/clients/<int:client_id>', methods=['GET'])
def get_client(client_id):
    client = Client.query.get_or_404(client_id)
    return jsonify(client_to_json(client))

@app.route('/api/clients/<int:client_id>', methods=['PUT'])
def update_client(client_id):
    client = Client.query.get_or_404(client_id)
    data = request.json
    if not data:
        return jsonify({'error': 'Cuerpo de la petición vacío o no es JSON.'}), 400

    name_data = data.get('name')
    if not name_data or not name_data.strip(): # Nombre sigue siendo requerido
        return jsonify({'error': 'El nombre del cliente es requerido.'}), 400

    client.name = name_data.strip()
    client.nickname = data.get('nickname', client.nickname).strip() if data.get('nickname') is not None else client.nickname
    client.whatsapp = data.get('whatsapp', client.whatsapp).strip() if data.get('whatsapp') is not None else client.whatsapp
    client.email = data.get('email', client.email).strip() if data.get('email') is not None else client.email
    client.gender = data.get('gender', client.gender)
    client.clientLevel = data.get('clientLevel', client.clientLevel)
    client.profileImageUrl = data.get('profileImageUrl', client.profileImageUrl)

    db.session.commit()
    return jsonify(client_to_json(client))

@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
def delete_client(client_id):
    client = Client.query.get_or_404(client_id)
    # Verificar si el cliente tiene ventas asociadas
    if client.sales:
        return jsonify({'error': 'Este cliente tiene ventas asociadas y no puede ser eliminado directamente.'}), 400
        # Se podría implementar lógica para anonimizar o reasignar ventas si es necesario.

    db.session.delete(client)
    db.session.commit()
    return jsonify({'message': 'Cliente eliminado exitosamente.'})

# --- API Endpoints para Ventas (Sales) ---

def sale_item_to_json(item):
    return {
        'id': item.id,
        'product_id': item.product_id,
        'product_name': item.product.name, # Asumiendo backref 'product'
        'quantity': item.quantity,
        'price_at_sale': item.price_at_sale,
        'subtotal': item.subtotal
    }

def sale_to_json(sale):
    return {
        'id': sale.id,
        'client_id': sale.client_id,
        'client_name': sale.client.name, # Asumiendo backref 'client'
        'saleDate': sale.saleDate.isoformat(),
        'totalAmount': sale.totalAmount,
        'status': sale.status,
        'items': [sale_item_to_json(item) for item in sale.items]
    }

@app.route('/api/sales', methods=['POST'])
def create_sale():
    data = request.json
    if not data or not 'client_id' in data or not 'items' in data or not isinstance(data['items'], list) or not data['items']:
        return jsonify({'error': 'Datos incompletos. Se requiere client_id y una lista de items.'}), 400

    client = Client.query.get(data['client_id'])
    if not client:
        return jsonify({'error': 'Cliente no encontrado.'}), 404

    new_sale = Sale()
    new_sale.client_id = data['client_id']
    new_sale.status = data.get('status', 'Contactado') # Estado inicial por defecto

    calculated_total_amount = 0
    items_to_add = []

    for item_data in data['items']:
        product = Product.query.get(item_data.get('product_id'))
        if not product:
            return jsonify({'error': f"Producto con ID {item_data.get('product_id')} no encontrado."}), 404

        quantity = item_data.get('quantity', 1)
        if not isinstance(quantity, int) or quantity <= 0:
            return jsonify({'error': f"Cantidad inválida para el producto {product.name}."}), 400

        if product.stockActual < quantity:
            return jsonify({'error': f"Stock insuficiente para {product.name}. Disponible: {product.stockActual}, Solicitado: {quantity}"}), 400

        price_at_sale = item_data.get('price_at_sale', product.priceShowroom) # Usar precio de showroom por defecto si no se especifica
        # Aquí se podría implementar lógica más compleja para determinar el precio (ej. modo feria)

        subtotal = quantity * price_at_sale
        calculated_total_amount += subtotal

        # Disminuir stock
        product.stockActual -= quantity

        sale_item = SaleItem()
        sale_item.product_id = product.id
        sale_item.quantity = quantity
        sale_item.price_at_sale = price_at_sale
        sale_item.subtotal = subtotal
        # sale_item.sale = new_sale # Asociar con la venta
        items_to_add.append(sale_item)

    new_sale.totalAmount = calculated_total_amount
    new_sale.items = items_to_add

    try:
        db.session.add(new_sale)
        db.session.commit()
        return jsonify(sale_to_json(new_sale)), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error al crear venta: {e}") # Log del error
        return jsonify({'error': f'Ocurrió un error al crear la venta: {str(e)}'}), 500


@app.route('/api/sales', methods=['GET'])
def get_sales():
    status_filter = request.args.get('status')
    client_id_filter = request.args.get('client_id', type=int)

    query = Sale.query.order_by(Sale.saleDate.desc())

    if status_filter:
        query = query.filter(Sale.status == status_filter)
    if client_id_filter:
        query = query.filter(Sale.client_id == client_id_filter)

    sales = query.all()
    return jsonify([sale_to_json(s) for s in sales])

@app.route('/api/sales/<int:sale_id>', methods=['GET'])
def get_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)
    return jsonify(sale_to_json(sale))

@app.route('/api/sales/<int:sale_id>', methods=['PUT'])
def update_sale_status(sale_id): # Por ahora solo actualiza el estado
    sale = Sale.query.get_or_404(sale_id)
    data = request.json

    new_status = data.get('status')
    if not new_status:
        return jsonify({'error': 'Se requiere un nuevo estado (status).'}), 400

    # Validar que el estado sea uno de los permitidos (opcional pero recomendado)
    allowed_statuses = ["Contactado", "Armado", "Entregado", "Cobrado", "Cancelado"] # Añadir "Cancelado"
    if new_status not in allowed_statuses:
        return jsonify({'error': f'Estado "{new_status}" no válido. Estados permitidos: {", ".join(allowed_statuses)}'}), 400

    # Lógica para restaurar stock si se cancela una venta que ya había descontado stock
    # Esto asume que el stock se descuenta al crear la venta.
    if new_status == "Cancelado" and sale.status != "Cancelado": # Si se está cancelando y no estaba ya cancelada
        for item in sale.items:
            product = Product.query.get(item.product_id)
            if product:
                product.stockActual += item.quantity
        sale.status = new_status # Actualizar estado después de restaurar stock
        db.session.commit()
        return jsonify(sale_to_json(sale)) # Retornar venta actualizada
    elif sale.status == "Cancelado" and new_status != "Cancelado": # Si se está reactivando una venta cancelada
        # Verificar stock nuevamente antes de descontar
        for item in sale.items:
            product = Product.query.get(item.product_id)
            if not product or product.stockActual < item.quantity:
                 return jsonify({'error': f"No se puede reactivar la venta. Stock insuficiente para {product.name if product else 'ID '+str(item.product_id)}. Disponible: {product.stockActual if product else 'N/A'}, Requerido: {item.quantity}"}), 400
        # Si hay stock, descontarlo
        for item in sale.items:
            product = Product.query.get(item.product_id) # Volver a obtener por si acaso
            product.stockActual -= item.quantity
        sale.status = new_status
        db.session.commit()
        return jsonify(sale_to_json(sale))

    sale.status = new_status
    db.session.commit()
    return jsonify(sale_to_json(sale))


@app.route('/api/sales/<int:sale_id>', methods=['DELETE'])
def delete_sale(sale_id):
    sale = Sale.query.get_or_404(sale_id)

    # Importante: decidir si se restaura el stock al eliminar una venta.
    # Si la venta no fue "Cancelada" antes, el stock ya fue descontado.
    # Si se elimina una venta "Entregada" o "Cobrada", restaurar stock podría no ser lo correcto.
    # Por simplicidad, si se elimina una venta que no está Cancelada, restauramos stock.
    # Si ya estaba Cancelada, el stock ya debería haber sido restaurado por el PUT.
    if sale.status != "Cancelado":
        for item in sale.items:
            product = Product.query.get(item.product_id)
            if product:
                product.stockActual += item.quantity

    # Los SaleItems se eliminan en cascada debido a la configuración del modelo Sale.
    db.session.delete(sale)
    db.session.commit()
    return jsonify({'message': 'Venta eliminada exitosamente.'})

# --- API Endpoint para el Dashboard ---
@app.route('/api/dashboard/summary', methods=['GET'])
def get_dashboard_summary():
    summary = {
        'ventasEntregadas': {'count': 0, 'totalAmount': 0},
        'ventasAEntregar': {'count': 0, 'totalAmount': 0}, # Contactado, Armado
        'ventasPorArmar': {'count': 0, 'totalAmount': 0},   # Solo Contactado
        'ventasCobradas': {'count': 0, 'totalAmount': 0},
        'ventasACobrar': {'count': 0, 'totalAmount': 0}    # Entregado pero no Cobrado
    }

    sales_data = Sale.query.all()

    for sale in sales_data:
        if sale.status == 'Entregado':
            summary['ventasEntregadas']['count'] += 1
            summary['ventasEntregadas']['totalAmount'] += sale.totalAmount
            if sale.status != 'Cobrado': # Asumiendo que "Cobrado" es un estado final y separado
                summary['ventasACobrar']['count'] += 1
                summary['ventasACobrar']['totalAmount'] += sale.totalAmount

        if sale.status in ['Contactado', 'Armado']:
            summary['ventasAEntregar']['count'] += 1
            summary['ventasAEntregar']['totalAmount'] += sale.totalAmount
            if sale.status == 'Contactado':
                summary['ventasPorArmar']['count'] += 1
                summary['ventasPorArmar']['totalAmount'] += sale.totalAmount

        if sale.status == 'Cobrado':
            summary['ventasCobradas']['count'] += 1
            summary['ventasCobradas']['totalAmount'] += sale.totalAmount
            # Si una venta está "Cobrada", también está "Entregada" implícitamente para algunos conteos.
            # AGENTS.md: "Ventas Entregadas" y "Ventas Cobradas" son cards separadas.
            # Re-evaluar si "Entregadas" debe incluir "Cobradas" o ser mutuamente excluyentes para las cards.
            # Por ahora, si está Cobrada, la cuento en Cobradas. Si está Entregada (y no Cobrada), la cuento en Entregadas y A Cobrar.
            # Si está Entregada Y Cobrada, se contará en ambas 'ventasEntregadas' (si no es mutuamente excluyente) y 'ventasCobradas'.
            # Para evitar doble conteo en "Entregadas" si ya está "Cobrada", ajusto:
            if sale.status == 'Cobrado' and summary['ventasEntregadas']['count'] > 0 and sale.status != 'Entregado':
                 # Esta lógica es un poco confusa. Simplificando:
                 # Entregada: status == 'Entregado' (puede o no estar cobrada)
                 # A Entregar: status == 'Contactado' o 'Armado'
                 # Por Armar: status == 'Contactado'
                 # Cobrada: status == 'Cobrado'
                 # A Cobrar: status == 'Entregado' Y status != 'Cobrado'
                 pass # Ya se manejó arriba

    # Re-calculo para mayor claridad y evitar doble conteo problemático
    summary['ventasEntregadas'] = {'count': Sale.query.filter(Sale.status == 'Entregado').count(), 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Entregado').scalar() or 0}
    summary['ventasAEntregar'] = {'count': Sale.query.filter(Sale.status.in_(['Contactado', 'Armado'])).count(), 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status.in_(['Contactado', 'Armado'])).scalar() or 0}
    summary['ventasPorArmar'] = {'count': Sale.query.filter(Sale.status == 'Contactado').count(), 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Contactado').scalar() or 0}
    summary['ventasCobradas'] = {'count': Sale.query.filter(Sale.status == 'Cobrado').count(), 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Cobrado').scalar() or 0}
    summary['ventasACobrar'] = {'count': Sale.query.filter(Sale.status == 'Entregado').count(), 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Entregado').scalar() or 0}
    # Nota: "Ventas a Cobrar" según AGENTS.md es "Entregado pero no Cobrado".
    # El cálculo actual de 'ventasACobrar' es igual a 'ventasEntregadas'. Necesita ajuste.
    # Lo correcto para 'ventasACobrar':

    entregadas_no_cobradas_query = Sale.query.filter(Sale.status == 'Entregado') # AGENTS.md no especifica si "Cobrado" es un superestado de "Entregado"
                                                                              # Asumiré que son estados distintos. Si una venta está "Cobrada", ya no está solo "Entregada".
                                                                              # Si una venta puede estar "Entregada" Y "Cobrada" simultáneamente (ej. flags), la lógica cambia.
                                                                              # Para el dashboard, "Ventas Entregadas" probablemente significa "Entregadas Y NO COBRADAS AÚN"
                                                                              # o "Todas las que llegaron a estado Entregado o Cobrado".
                                                                              # Asumiré que los estados son progresivos y excluyentes para las cards.
                                                                              # Entregado (y no cobrado)
                                                                              # Cobrado (implica entregado)

    summary['ventasEntregadas'] = {'count': Sale.query.filter(Sale.status == 'Entregado').count(),
                                   'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Entregado').scalar() or 0}
    summary['ventasCobradas'] = {'count': Sale.query.filter(Sale.status == 'Cobrado').count(),
                                 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Cobrado').scalar() or 0}
    summary['ventasACobrar'] = summary['ventasEntregadas'] # Si "Entregadas" son las que están pendientes de cobro.
                                                          # Si "Entregadas" es un estado que persiste aún después de "Cobrado", entonces A Cobrar es Entregadas - Cobradas.
                                                          # Por simplicidad y según el texto "Ventas Entregadas" y "Ventas A Cobrar", parece que "Entregadas" son las que esperan cobro.

    # Para mayor claridad según AGENTS.md:
    # - Ventas Entregadas: status == 'Entregado' (aún no cobradas)
    # - Ventas A Entregar: status == 'Contactado' OR status == 'Armado'
    # - Ventas Por Armar: status == 'Contactado'
    # - Ventas Cobradas: status == 'Cobrado'
    # - Ventas A Cobrar: status == 'Entregado' (igual que "Ventas Entregadas" en este caso)

    # Recalculando con esta interpretación:
    summary['ventasEntregadas'] = {'count': Sale.query.filter(Sale.status == 'Entregado').count(),
                                   'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Entregado').scalar() or 0}
    summary['ventasAEntregar'] = {'count': Sale.query.filter(Sale.status.in_(['Contactado', 'Armado'])).count(),
                                  'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status.in_(['Contactado', 'Armado'])).scalar() or 0}
    summary['ventasPorArmar'] = {'count': Sale.query.filter(Sale.status == 'Contactado').count(),
                                 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Contactado').scalar() or 0}
    summary['ventasCobradas'] = {'count': Sale.query.filter(Sale.status == 'Cobrado').count(),
                                 'totalAmount': db.session.query(db.func.sum(Sale.totalAmount)).filter(Sale.status == 'Cobrado').scalar() or 0}
    summary['ventasACobrar'] = summary['ventasEntregadas'] # Reitero, esto es si 'Entregado' significa 'entregado y pendiente de cobro'.

    return jsonify(summary)

# --- API Endpoints para Estadísticas ---

@app.route('/api/stats/sales_over_time', methods=['GET'])
def stats_sales_over_time():
    period = request.args.get('period', 'month') # 'day', 'week', 'month', 'year'

    # Solo considerar ventas que no estén canceladas para estadísticas financieras
    base_query = Sale.query.filter(Sale.status != 'Cancelado')

    results = []
    if period == 'day':
        # Agrupar por día: se usa strftime con SQLite. Para otros DBs, puede ser diferente.
        # SQLite strftime: '%Y-%m-%d'
        daily_sales = base_query.with_entities(
            func.strftime('%Y-%m-%d', Sale.saleDate).label('date_period'),
            func.count(Sale.id).label('order_count'),
            func.sum(Sale.totalAmount).label('total_sales')
        ).group_by('date_period').order_by('date_period').all()
        results = [{'period': r.date_period, 'orderCount': r.order_count, 'totalSales': r.total_sales or 0} for r in daily_sales]

    elif period == 'month':
        # Agrupar por mes: '%Y-%m'
        monthly_sales = base_query.with_entities(
            func.strftime('%Y-%m', Sale.saleDate).label('date_period'),
            func.count(Sale.id).label('order_count'),
            func.sum(Sale.totalAmount).label('total_sales')
        ).group_by('date_period').order_by('date_period').all()
        results = [{'period': r.date_period, 'orderCount': r.order_count, 'totalSales': r.total_sales or 0} for r in monthly_sales]

    elif period == 'year':
        # Agrupar por año: '%Y'
        yearly_sales = base_query.with_entities(
            func.strftime('%Y', Sale.saleDate).label('date_period'),
            func.count(Sale.id).label('order_count'),
            func.sum(Sale.totalAmount).label('total_sales')
        ).group_by('date_period').order_by('date_period').all()
        results = [{'period': r.date_period, 'orderCount': r.order_count, 'totalSales': r.total_sales or 0} for r in yearly_sales]

    # 'week' es más complejo con strftime puro y puede variar entre DBs.
    # Para SQLite, strftime('%Y-%W') (semana del año) o strftime('%Y-%j')/7.
    # Por simplicidad, omitiré 'week' por ahora o se puede implementar si es muy necesario.

    return jsonify(results)

@app.route('/api/stats/top_products', methods=['GET'])
def stats_top_products():
    by = request.args.get('by', 'quantity') # 'quantity' o 'value'
    limit = request.args.get('limit', 5, type=int)

    if by == 'quantity':
        top_products_query = db.session.query(
            Product.name,
            func.sum(SaleItem.quantity).label('total_sold')
        ).join(SaleItem.sale).filter(Sale.status != 'Cancelado').join(Product).group_by(Product.id).order_by(func.sum(SaleItem.quantity).desc()).limit(limit).all()
        results = [{'productName': r.name, 'totalSold': r.total_sold or 0} for r in top_products_query]
    elif by == 'value':
        top_products_query = db.session.query(
            Product.name,
            func.sum(SaleItem.subtotal).label('total_value')
        ).join(SaleItem.sale).filter(Sale.status != 'Cancelado').join(Product).group_by(Product.id).order_by(func.sum(SaleItem.subtotal).desc()).limit(limit).all()
        results = [{'productName': r.name, 'totalValue': r.total_value or 0} for r in top_products_query]
    else:
        return jsonify({'error': "Parámetro 'by' debe ser 'quantity' o 'value'."}), 400

    return jsonify(results)

@app.route('/api/stats/top_clients', methods=['GET'])
def stats_top_clients():
    by = request.args.get('by', 'frequency') # 'frequency' o 'value'
    limit = request.args.get('limit', 5, type=int)

    if by == 'frequency':
        top_clients_query = db.session.query(
            Client.name,
            func.count(Sale.id).label('order_count')
        ).join(Sale.client).filter(Sale.status != 'Cancelado').group_by(Client.id).order_by(func.count(Sale.id).desc()).limit(limit).all()
        results = [{'clientName': r.name, 'orderCount': r.order_count or 0} for r in top_clients_query]
    elif by == 'value':
        top_clients_query = db.session.query(
            Client.name,
            func.sum(Sale.totalAmount).label('total_spent')
        ).join(Sale.client).filter(Sale.status != 'Cancelado').group_by(Client.id).order_by(func.sum(Sale.totalAmount).desc()).limit(limit).all()
        results = [{'clientName': r.name, 'totalSpent': r.total_spent or 0} for r in top_clients_query]
    else:
        return jsonify({'error': "Parámetro 'by' debe ser 'frequency' o 'value'."}), 400

    return jsonify(results)

@app.route('/api/stats/stock_summary', methods=['GET'])
def stats_stock_summary():
    critical_stock_products = Product.query.filter(Product.stockActual > 0, Product.stockActual <= Product.stockCritico).order_by(Product.stockActual).all()
    out_of_stock_products = Product.query.filter(Product.stockActual == 0).order_by(Product.name).all()

    return jsonify({
        'criticalStock': [product_to_json(p) for p in critical_stock_products],
        'outOfStock': [product_to_json(p) for p in out_of_stock_products]
    })

# Función para crear la base de datos y tablas
def create_db():
    with app.app_context():
        db.create_all()
    print("Base de datos y tablas creadas en: " + app.config['SQLALCHEMY_DATABASE_URI'])

if __name__ == '__main__':
    # Descomentar la siguiente línea SOLO la primera vez para crear la DB, o cuando se añadan nuevos modelos.
    # Luego comentar para evitar recrear la DB cada vez que se inicia el servidor.
    # create_db()
    app.run(debug=True, port=5000)
