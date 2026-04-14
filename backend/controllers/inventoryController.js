const Inventory = require('../models/Inventory');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Admin/Staff)
exports.getInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find().sort({ createdAt: -1 });
        res.json({ success: true, data: inventory });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Add new inventory item
// @route   POST /api/inventory
// @access  Private (Admin)
exports.addInventoryItem = async (req, res) => {
    try {
        const { name, sku, category, quantity, unitPrice, purchasePrice, gstPercent, description, vendor } = req.body;
        
        const itemExists = await Inventory.findOne({ sku });
        if (itemExists) {
            return res.status(400).json({ message: 'SKU already exists' });
        }

        const newItem = await Inventory.create({
            name,
            sku,
            category,
            quantity,
            unitPrice,
            purchasePrice,
            gstPercent,
            description,
            vendor
        });

        res.status(201).json({ success: true, data: newItem });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin)
exports.updateInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const updatedItem = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updatedItem });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin)
exports.deleteInventoryItem = async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        res.json({ success: true, message: 'Item removed' });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
