const SalesBill = require("../models/SalesBill");
const RegistrationBill = require("../models/RegistrationBill");
const BillCumReceipt = require("../models/BillCumReceipt");
const MoneyReceipt = require("../models/MoneyReceipt");
const Sequence = require("../models/Sequence");
const Appointment = require("../models/Appointment");
const Inventory = require("../models/Inventory");
const { calculateGST } = require("../utils/gstHelper");
const { generateBillPDF, generateRegistrationBillPDF } = require("../utils/pdfGenerator");

const getFinancialYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    if (month >= 3) return `${String(year).slice(-2)}-${String(year + 1).slice(-2)}`;
    return `${String(year - 1).slice(-2)}-${String(year).slice(-2)}`;
};

exports.createRegistrationBill = async (req, res) => {
    try {
        const { appointmentId, paymentMode } = req.body;
        const amount = 100.00; // Fixed registration fee
        
        const appointment = await Appointment.findById(appointmentId).populate('patient').populate('doctor');
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        let bill = await RegistrationBill.findOne({ appointment: appointmentId })
            .populate('patient', 'name phone address mrdNumber')
            .populate('doctor', 'name specialization qualifications');
        if (bill) return res.json({ success: true, data: bill });

        // Get and increment year-scoped sequence
        const currentYear = new Date().getFullYear();
        let sequence = await Sequence.findOne({ id: `registration_bill_${currentYear}` });
        if (!sequence) {
            try {
                sequence = await Sequence.create({ id: `registration_bill_${currentYear}`, sequence_value: 1 });
            } catch (err) {
                // In case of parallel request race condition
                sequence = await Sequence.findOneAndUpdate(
                    { id: `registration_bill_${currentYear}` },
                    { $inc: { sequence_value: 1 } },
                    { new: true }
                );
            }
        } else {
            sequence = await Sequence.findOneAndUpdate(
                { id: `registration_bill_${currentYear}` },
                { $inc: { sequence_value: 1 } },
                { new: true }
            );
        }

        const receiptNo = `${sequence.sequence_value}/${currentYear}`;

        bill = await RegistrationBill.create({
            appointment: appointmentId,
            patient: appointment.patient._id,
            doctor: appointment.doctor._id,
            receiptNo,
            amount,
            paymentMode
        });

        const populatedBill = await RegistrationBill.findById(bill._id)
            .populate('patient', 'name phone address mrdNumber')
            .populate('doctor', 'name specialization qualifications');

        res.json({ success: true, data: populatedBill });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getRegistrationBillByAppointment = async (req, res) => {
    try {
        const bill = await RegistrationBill.findOne({ appointment: req.params.appointmentId })
            .populate('patient', 'name phone address mrdNumber')
            .populate('doctor', 'name specialization qualifications');
        
        if (!bill) return res.status(404).json({ success: false, message: 'Bill not found' });
        res.json({ success: true, data: bill });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.createBillCumReceipt = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        
        const appointment = await Appointment.findById(appointmentId)
            .populate('patient')
            .populate('doctor');
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        let receipt = await BillCumReceipt.findOne({ appointment: appointmentId })
            .populate('patient')
            .populate('doctor');
        if (receipt) return res.json({ success: true, data: receipt });

        const currentYear = new Date().getFullYear();
        const currentYearShort = String(currentYear).slice(-2);

        // 1. Patient ID Sequence resetting yearly
        let patSeq = await Sequence.findOne({ id: `bill_patient_id_${currentYear}` });
        if (!patSeq) {
            try {
                patSeq = await Sequence.create({ id: `bill_patient_id_${currentYear}`, sequence_value: 1 });
            } catch (err) {
                patSeq = await Sequence.findOneAndUpdate(
                    { id: `bill_patient_id_${currentYear}` },
                    { $inc: { sequence_value: 1 } },
                    { new: true }
                );
            }
        } else {
            patSeq = await Sequence.findOneAndUpdate(
                { id: `bill_patient_id_${currentYear}` },
                { $inc: { sequence_value: 1 } },
                { new: true }
            );
        }
        const patientIdNo = `${String(patSeq.sequence_value).padStart(3, '0')}/${currentYear}`;

        // 2. Receipt No Sequence resetting yearly
        let recSeq = await Sequence.findOne({ id: `bill_cum_receipt_rec_${currentYear}` });
        if (!recSeq) {
            try {
                recSeq = await Sequence.create({ id: `bill_cum_receipt_rec_${currentYear}`, sequence_value: 1 });
            } catch (err) {
                recSeq = await Sequence.findOneAndUpdate(
                    { id: `bill_cum_receipt_rec_${currentYear}` },
                    { $inc: { sequence_value: 1 } },
                    { new: true }
                );
            }
        } else {
            recSeq = await Sequence.findOneAndUpdate(
                { id: `bill_cum_receipt_rec_${currentYear}` },
                { $inc: { sequence_value: 1 } },
                { new: true }
            );
        }
        const receiptNo = `${String(recSeq.sequence_value).padStart(3, '0')}/${currentYearShort}`;

        // 3. Service Code sequence
        let serviceSeq = await Sequence.findOneAndUpdate(
            { id: 'bill_service_code' },
            { $inc: { sequence_value: 1 } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        if (serviceSeq.sequence_value < 1000) {
            serviceSeq.sequence_value = 1000;
            await serviceSeq.save();
        }

        const billNo = `LEF/${patientIdNo}`;
        const serviceCode = `LEF-${patientIdNo}`;
        
        // Use doctor consultation fee if available, else default to 0
        const amount = appointment.doctor.consultationFee || 0;

        receipt = await BillCumReceipt.create({
            appointment: appointmentId,
            patient: appointment.patient._id,
            doctor: appointment.doctor._id,
            billNo,
            receiptNo,
            patientIdNo,
            serviceCode,
            amount
        });

        const populatedReceipt = await BillCumReceipt.findById(receipt._id)
            .populate('patient')
            .populate('doctor');

        res.json({ success: true, data: populatedReceipt });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getBillCumReceiptByAppointment = async (req, res) => {
    try {
        const receipt = await BillCumReceipt.findOne({ appointment: req.params.appointmentId })
            .populate('patient')
            .populate('doctor');
        
        if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
        res.json({ success: true, data: receipt });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

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

exports.createMoneyReceipt = async (req, res) => {
    try {
        const { appointmentId, name, age, sex, receivedFrom, sumOfRupees, purpose, amount } = req.body;
        
        const appointment = await Appointment.findById(appointmentId).populate('patient');
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        let receipt = await MoneyReceipt.findOne({ appointment: appointmentId });
        
        if (receipt) {
            receipt.name = name;
            receipt.age = age;
            receipt.sex = sex;
            receipt.receivedFrom = receivedFrom;
            receipt.sumOfRupees = sumOfRupees;
            receipt.purpose = purpose;
            receipt.amount = amount;
            await receipt.save();
        } else {
            let sequence = await Sequence.findOneAndUpdate(
                { id: 'money_receipt_no' },
                { $inc: { sequence_value: 1 } },
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            const fy = getFinancialYear();
            const receiptNo = `MR\\${fy}\\${sequence.sequence_value}`;

            receipt = await MoneyReceipt.create({
                appointment: appointmentId,
                patient: appointment.patient._id,
                receiptNo,
                name,
                age,
                sex,
                receivedFrom,
                sumOfRupees,
                purpose,
                amount
            });
        }

        res.json({ success: true, data: receipt });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMoneyReceiptByAppointment = async (req, res) => {
    try {
        const receipt = await MoneyReceipt.findOne({ appointment: req.params.appointmentId });
        if (!receipt) return res.status(404).json({ success: false, message: 'Receipt not found' });
        res.json({ success: true, data: receipt });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
