const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Login admin (sin protección, debe ser público para permitir login)
router.post('/login', adminController.adminLogin);

// Rutas protegidas (requieren token de admin)
router.get('/pending-users', adminController.verifyAdminAuth, adminController.getPendingUsersForAdmin);
router.put('/approve/:userId', adminController.verifyAdminAuth, adminController.approveUserAsAdmin);
router.put('/deny/:userId', adminController.verifyAdminAuth, adminController.denyUserAsAdmin);
router.post('/logout', adminController.verifyAdminAuth, adminController.adminLogout);

module.exports = router;
