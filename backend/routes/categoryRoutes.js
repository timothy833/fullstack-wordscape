const express = require('express');
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, categoryController.createCategory);
router.get('/', categoryController.getAllCategories);
router.get('/get-category', categoryController.getCategoryByName);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
