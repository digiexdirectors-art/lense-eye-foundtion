const SalesBill = require("../models/SalesBill");
const Inventory = require("../models/Inventory");
const { calculateGST } = require("../utils/gstHelper");
const { generateBillPDF } = require("../utils/pdfGenerator");

exports.createBill = async (req, res) => {
    try {
        const { patientId, doctorId, appointmentId, items, paymentMode } = req.body;

        let subTotal = 0,
            cgstTotal = 0,
            sgstTotal = 0;

        const updatedItems = [];
        
        for (const item of items) {
            const gst = calculateGST(item.price, item.qty, item.gstPercent);

            subTotal += item.price * item.qty;
            cgstTotal += gst.cgst;
            sgstTotal += gst.sgst;
            
            // Deduct from inventory if it's an inventory item
            if (item.inventoryId) {
                const inventoryItem = await Inventory.findById(item.inventoryId);
                if (!inventoryItem || inventoryItem.quantity < item.qty) {
                    return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
                }
                inventoryItem.quantity -= item.qty;
                await inventoryItem.save();
            }

            updatedItems.push({ ...item, ...gst });
        }

        const grandTotal = subTotal + cgstTotal + sgstTotal;

        const bill = await SalesBill.create({
            patientId,
            doctorId,
            appointmentId,
            items: updatedItems,
            subTotal,
            cgstTotal,
            sgstTotal,
            grandTotal,
            paymentMode,
        });

        res.json({ success: true, data: bill });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBillPDF = async (req, res) => {
    try {
        const bill = await SalesBill.findById(req.params.id)
            .populate({
                path: 'patientId',
                model: 'Patient',
                select: 'name phone address age gender'
            })
            .populate('doctorId', 'name specialization');
            
        if (!bill) return res.status(404).json({ message: 'Bill not found' });
        return await generateBillPDF(res, bill);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: err.message });
    }
};

exports.getBills = async (req, res) => {
    try {
        const bills = await SalesBill.find()
            .populate('patientId', 'name phone')
            .populate('doctorId', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
            
        res.json({ success: true, count: bills.length, data: bills });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};