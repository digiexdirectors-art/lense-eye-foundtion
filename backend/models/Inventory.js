const mongoose = require('mongoose');

const inventorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sku: {
    type: String,
    unique: true,
    required: true
  },
  category: {
    type: String,
    enum: ['Frame', 'Lens', 'Contact Lens', 'Accessories', 'Other'],
    default: 'Frame'
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    default: 0
  },
  purchasePrice: {
    type: Number,
    required: true,
    default: 0
  },
  gstPercent: {
    type: Number,
    default: 18
  },
  description: {
    type: String,
    default: ''
  },
  vendor: {
    type: String,
    default: ''
  }
}, { timestamps: true });

const Inventory = mongoose.model('Inventory', inventorySchema);
module.exports = Inventory;
