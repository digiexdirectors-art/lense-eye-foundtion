const express = require('express');
const router = express.Router();
const { createPatient, getPatients, getPatientById, updatePatient } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

// All patient routes require authentication, so we use `protect`
router.route('/')
    .post(protect, createPatient)
    .get(protect, getPatients);

router.route('/:id')
    .get(protect, getPatientById)
    .put(protect, updatePatient);

module.exports = router;
