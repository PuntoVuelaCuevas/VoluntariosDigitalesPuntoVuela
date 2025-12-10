const express = require('express');
const router = express.Router();
const trayectoController = require('../controllers/trayecto.controller');

router.post('/', trayectoController.createTrayecto);
router.get('/', trayectoController.findAllTrayectos);
router.get('/:id', trayectoController.findOneTrayecto);
router.put('/:id', trayectoController.updateTrayecto);

module.exports = router;
