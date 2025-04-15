const express = require('express');
const { proxyImage } = require('../controllers/proxyImageController');
const router = express.Router();


router.get('/', proxyImage);


module.exports = router;