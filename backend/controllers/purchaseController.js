const PurchaseInvoice = require("../models/PurchaseInvoice");
const Inventory = require("../models/Inventory");
const { calculateGST } = require("../utils/gstHelper");

exports.createPurchase = async (req, res) => {
    try {
        const { vendorName, vendorGST, invoiceNumber, items } = req.body;

        let subTotal = 0,
            cgstTotal = 0,
            sgstTotal = 0;

        const updatedItems = items.map((item) => {
            const gst = calculateGST(
                item.purchasePrice,
                item.qty,
                item.gstPercent || 18
            );

            subTotal += item.purchasePrice * item.qty;
            cgstTotal += gst.cgst;
            sgstTotal += gst.sgst;

            return { ...item, ...gst };
        });

        const purchase = await PurchaseInvoice.create({
            vendorName,
            vendorGST,
            invoiceNumber,
            items: updatedItems,
            subTotal,
            cgstTotal,
            sgstTotal,
            grandTotal: subTotal + cgstTotal + sgstTotal,
        });

        // Update inventory
        for (const item of items) {
            let inventoryItem = await Inventory.findOne({ sku: item.sku });
            if (inventoryItem) {
                inventoryItem.quantity += item.qty;
                inventoryItem.purchasePrice = item.purchasePrice;
                // Update selling price from invoice
                if (item.salePrice) {
                    inventoryItem.unitPrice = item.salePrice;
                }
                await inventoryItem.save();
            } else {
                await Inventory.create({
                    name: item.name,
                    sku: item.sku,
                    category: item.category || 'Other',
                    quantity: item.qty,
                    purchasePrice: item.purchasePrice,
                    unitPrice: item.salePrice || (item.purchasePrice * 1.5), // Use salePrice from invoice or default markup
                    gstPercent: item.gstPercent || 18,
                    description: `Added from invoice ${invoiceNumber}`
                });
            }
        }

        res.status(201).json({ success: true, data: purchase });
    } catch (err) {
        console.error("Purchase error:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};