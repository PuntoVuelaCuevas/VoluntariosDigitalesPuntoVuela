const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');

// Create a new Product
router.post('/', productosController.createProducto);

// Retrieve all Products
router.get('/', productosController.findAllProductos);

// Retrieve a single Product with id
router.get('/:id', productosController.findOneProducto);

// Update a Product with id
router.put('/:id', productosController.updateProducto);

// Delete a Product with id
router.delete('/:id', productosController.deleteProducto);

module.exports = router;
