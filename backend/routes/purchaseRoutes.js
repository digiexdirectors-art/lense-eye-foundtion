const express = require('express');
const router = express.Router();
const { createPurchase } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'accountant'), createPurchase);

module.exports = router;
