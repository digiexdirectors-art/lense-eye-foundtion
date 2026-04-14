const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptionByAppointmentId, getPrescriptionPDF } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPrescription);
router.get('/appointment/:appointmentId', protect, getPrescriptionByAppointmentId);
router.get('/:id/pdf', protect, getPrescriptionPDF);

module.exports = router;

