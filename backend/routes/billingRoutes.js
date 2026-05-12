const express = require('express');
const router = express.Router();
const { 
    createBill, 
    getBillPDF, 
    getBills, 
    createRegistrationBill, 
    getRegistrationBillByAppointment,
    createBillCumReceipt,
    getBillCumReceiptByAppointment,
    createMoneyReceipt,
    getMoneyReceiptByAppointment
} = require('../controllers/billingController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'accountant'), createBill);
router.get('/', protect, authorize('admin', 'accountant'), getBills);
router.get('/:id/pdf', protect, authorize('admin', 'accountant'), getBillPDF);

// Registration Bill Routes
router.post('/registration', protect, authorize('admin', 'receptionist', 'accountant'), createRegistrationBill);
router.get('/appointment/:appointmentId', protect, authorize('admin', 'receptionist', 'accountant'), getRegistrationBillByAppointment);
router.get('/registration/:id/pdf', protect, authorize('admin', 'receptionist', 'accountant'), async (req, res) => {
    const RegistrationBill = require('../models/RegistrationBill');
    const { generateRegistrationBillPDF } = require('../utils/pdfGenerator');
    const bill = await RegistrationBill.findById(req.params.id)
        .populate('patient', 'name phone address mrdNumber')
        .populate('doctor', 'name specialization qualifications');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    return await generateRegistrationBillPDF(res, bill);
});

// Bill Cum Receipt Routes
router.post('/receipt', protect, authorize('admin', 'receptionist', 'accountant'), createBillCumReceipt);
router.get('/receipt/appointment/:appointmentId', protect, authorize('admin', 'receptionist', 'accountant'), getBillCumReceiptByAppointment);

// Money Receipt Routes
router.post('/money-receipt', protect, authorize('admin', 'receptionist', 'accountant'), createMoneyReceipt);
router.get('/money-receipt/appointment/:appointmentId', protect, authorize('admin', 'receptionist', 'accountant'), getMoneyReceiptByAppointment);

module.exports = router;

