const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.get('/test-email/:email', authController.testEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas de admin
router.put('/approve/:userId', authController.approveUser);
router.get('/pending-users', authController.getPendingUsers);

module.exports = router;
