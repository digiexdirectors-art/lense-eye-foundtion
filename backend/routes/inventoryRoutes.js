const express = require('express');
const router = express.Router();
const { getInventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = require('../controllers/inventoryController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, authorize('admin', 'accountant'), getInventory)
    .post(protect, authorize('admin', 'accountant'), addInventoryItem);

router.route('/:id')
    .put(protect, authorize('admin', 'accountant'), updateInventoryItem)
    .delete(protect, admin, deleteInventoryItem);

module.exports = router;
