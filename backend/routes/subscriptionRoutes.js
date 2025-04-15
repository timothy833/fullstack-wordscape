const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/:user_id', authMiddleware, subscriptionController.toggleSubscription);
router.get('/', authMiddleware, subscriptionController.getSubscriptions);
router.get('/followers', authMiddleware, subscriptionController.getFollowers);

module.exports = router;
