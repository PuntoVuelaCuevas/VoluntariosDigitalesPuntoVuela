const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

router.post('/', usuarioController.createUsuario);
router.get('/', usuarioController.findAllUsuarios);
router.get('/:id', usuarioController.findOneUsuario);

module.exports = router;
