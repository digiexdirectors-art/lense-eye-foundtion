const express = require('express');
const router = express.Router();
const { createBill, getBillPDF, getBills } = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'accountant'), createBill);
router.get('/', protect, authorize('admin', 'accountant'), getBills);
router.get('/:id/pdf', protect, authorize('admin', 'accountant'), getBillPDF);

module.exports = router;
