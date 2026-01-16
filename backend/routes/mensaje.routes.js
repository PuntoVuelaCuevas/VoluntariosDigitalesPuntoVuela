const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensaje.controller');

router.post('/', mensajeController.createMensaje);
router.get('/trayecto/:trayectoId', mensajeController.getMensajesByTrayecto);
router.delete('/trayecto/:trayectoId', mensajeController.deleteMensajesByTrayecto);

module.exports = router;
