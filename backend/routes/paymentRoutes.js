const express = require('express');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', authMiddleware, paymentController.createPayment);
router.get('/', authMiddleware, paymentController.getAllPayments);
router.get('/sent', authMiddleware, paymentController.getPaymentsSent);
router.get('/received', authMiddleware, paymentController.getPaymentsReceived);

module.exports = router;
