const express = require('express');
const router = express.Router();
const { createPurchase, getPurchases, getPurchasePDF } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'accountant'), createPurchase);
router.get('/', protect, authorize('admin', 'accountant'), getPurchases);
router.get('/:id/pdf', protect, getPurchasePDF);

module.exports = router;
