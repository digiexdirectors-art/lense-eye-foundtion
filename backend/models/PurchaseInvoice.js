const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
    vendorName: String,
    vendorGST: String,
    invoiceNumber: String,

    items: [
        {
            name: String,
            qty: Number,
            purchasePrice: Number,
            salePrice: Number,
            profitType: { type: String, enum: ['Fixed', 'Percentage'], default: 'Percentage' },
            profitValue: Number,
            gstPercent: Number,
            cgst: Number,
            sgst: Number,
            total: Number,
        },
    ],

    subTotal: Number,
    cgstTotal: Number,
    sgstTotal: Number,
    grandTotal: Number,

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PurchaseInvoice", purchaseSchema);