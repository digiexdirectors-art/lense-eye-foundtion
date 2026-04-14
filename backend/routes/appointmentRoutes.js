const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, updateAppointment } = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, authorize('admin', 'receptionist'), createAppointment);
router.get('/', protect, authorize('admin', 'receptionist', 'doctor'), getAppointments);
router.put('/:id', protect, authorize('admin', 'receptionist', 'doctor'), updateAppointment);

module.exports = router;
