const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptionByAppointmentId, getPrescriptionPDF, getLatestPrescriptionByPatientId } = require('../controllers/prescriptionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createPrescription);
router.get('/appointment/:appointmentId', protect, getPrescriptionByAppointmentId);
router.get('/patient/:patientId/latest', protect, getLatestPrescriptionByPatientId);
router.get('/:id/pdf', protect, getPrescriptionPDF);

module.exports = router;

