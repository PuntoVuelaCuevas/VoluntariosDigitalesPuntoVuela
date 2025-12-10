const Producto = require('../models/producto.model');

// Create a new Product
exports.createProducto = async (req, res) => {
    try {
        const { nombre, precio, stock } = req.body;
        if (!nombre || !precio) {
            return res.status(400).json({ message: 'Nombre and precio are required.' });
        }
        const nuevoProducto = await Producto.create({ nombre, precio, stock });
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ message: 'Error creating product', error: error.message });
    }
};

// Retrieve all Products
exports.findAllProductos = async (req, res) => {
    try {
        const productos = await Producto.findAll();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving products', error: error.message });
    }
};

// Retrieve a single Product by Id
exports.findOneProducto = async (req, res) => {
    try {
        const id = req.params.id;
        const producto = await Producto.findByPk(id);
        if (producto) {
            res.status(200).json(producto);
        } else {
            res.status(404).json({ message: `Product with id=${id} not found.` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving product', error: error.message });
    }
};

// Update a Product by Id
exports.updateProducto = async (req, res) => {
    try {
        const id = req.params.id;
        const [updated] = await Producto.update(req.body, {
            where: { id: id }
        });
        if (updated) {
            const updatedProducto = await Producto.findByPk(id);
            res.status(200).json({ message: 'Product updated successfully.', producto: updatedProducto });
        } else {
            res.status(404).json({ message: `Cannot update Product with id=${id}. Maybe Product was not found or req.body is empty!` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating product', error: error.message });
    }
};

// Delete a Product by Id
exports.deleteProducto = async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await Producto.destroy({
            where: { id: id }
        });
        if (deleted) {
            res.status(200).json({ message: 'Product was deleted successfully!' });
        } else {
            res.status(404).json({ message: `Cannot delete Product with id=${id}. Maybe Product was not found!` });
        }
    } catch (error) {
        res.status(500).json({ message: 'Could not delete Product', error: error.message });
    }
};
