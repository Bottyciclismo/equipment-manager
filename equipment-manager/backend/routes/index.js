// =====================================================
// MAIN ROUTES FILE
// =====================================================

const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const usersController = require('../controllers/usersController');
const brandsController = require('../controllers/brandsController');
const modelsController = require('../controllers/modelsController');
const uploadController = require('../controllers/uploadController');

// Middleware
const { authenticate, authenticateAdmin } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

// =====================================================
// PUBLIC ROUTES (Sin autenticación)
// =====================================================

// Auth
router.post('/auth/login', authController.login);

// =====================================================
// PROTECTED ROUTES (Requieren autenticación)
// =====================================================

// Auth
router.get('/auth/verify', authenticate, authController.verifyToken);
router.post('/auth/logout', authenticate, authController.logout);

// Brands (Lectura para todos los usuarios autenticados)
router.get('/brands', authenticate, brandsController.getAllBrands);
router.get('/brands/:id', authenticate, brandsController.getBrandById);
router.get('/brands/:id/models', authenticate, brandsController.getBrandModels);

// Models (Lectura para todos los usuarios autenticados)
router.get('/models', authenticate, modelsController.getAllModels);
router.get('/models/search', authenticate, modelsController.searchModels);
router.get('/models/:id', authenticate, modelsController.getModelById);

// =====================================================
// UPLOAD ROUTES (Solo Admin)
// =====================================================
router.post('/upload', authenticateAdmin, upload.single('image'), handleMulterError, uploadController.uploadImage);
router.get('/upload', authenticateAdmin, uploadController.listImages);
router.delete('/upload/:filename', authenticateAdmin, uploadController.deleteImage);

// =====================================================
// ADMIN ONLY ROUTES
// =====================================================

// Users Management
router.get('/users', authenticateAdmin, usersController.getAllUsers);
router.get('/users/:id', authenticateAdmin, usersController.getUserById);
router.post('/users', authenticateAdmin, usersController.createUser);
router.put('/users/:id', authenticateAdmin, usersController.updateUser);
router.delete('/users/:id', authenticateAdmin, usersController.deleteUser);

// Brands Management
router.post('/brands', authenticateAdmin, brandsController.createBrand);
router.put('/brands/:id', authenticateAdmin, brandsController.updateBrand);
router.delete('/brands/:id', authenticateAdmin, brandsController.deleteBrand);

// Models Management
router.post('/models', authenticateAdmin, modelsController.createModel);
router.put('/models/:id', authenticateAdmin, modelsController.updateModel);
router.delete('/models/:id', authenticateAdmin, modelsController.deleteModel);

// =====================================================
// HEALTH CHECK
// =====================================================
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
