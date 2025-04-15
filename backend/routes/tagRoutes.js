const express = require('express');
const tagController = require('../controllers/tagController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', tagController.getTags);
router.post('/', authMiddleware, tagController.createTag);
router.delete('/:id', authMiddleware, tagController.deleteTag);

module.exports = router;
