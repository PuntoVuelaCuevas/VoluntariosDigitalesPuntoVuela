const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuario.controller');

router.post('/', usuarioController.createUsuario);
router.get('/', usuarioController.findAllUsuarios);
router.get('/:id', usuarioController.findOneUsuario);
router.put('/:id/rol', usuarioController.updateRol);

module.exports = router;
