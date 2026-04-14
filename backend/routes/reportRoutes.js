const express = require('express');
const router = express.Router();
const { 
    getDoctorReport, 
    getPatientReport, 
    getAppointmentReport, 
    getSalesReport,
    getDoctorStats,
    getGlobalStats 
} = require('../controllers/reportController');
const { protect, admin, authorize } = require('../middleware/authMiddleware');

router.get('/doctors', protect, admin, getDoctorReport);
router.get('/patients', protect, admin, getPatientReport);
router.get('/appointments', protect, authorize('admin', 'doctor', 'receptionist'), getAppointmentReport);
router.get('/sales', protect, authorize('admin', 'accountant'), getSalesReport);
router.get('/doctor-stats', protect, authorize('doctor', 'admin'), getDoctorStats);
router.get('/global-stats', protect, authorize('admin', 'accountant', 'doctor'), getGlobalStats);

module.exports = router;
