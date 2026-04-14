const Patient = require('../models/Patient');

// @desc    Create a new patient
// @route   POST /api/patients
// @access  Private (Admin or Doctor)
const createPatient = async (req, res) => {
    try {
        const { name, age, gender, phone, address, medicalHistory } = req.body;

        const patient = await Patient.create({
            name,
            age,
            gender,
            phone,
            address,
            medicalHistory,
            // The protect middleware sets req.user to whoever made this request!
            registeredBy: req.user._id, 
        });

        res.status(201).json({
            success: true,
            data: patient,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private (Admin or Doctor)
const getPatients = async (req, res) => {
    try {
        // Find all patients, and populate the 'registeredBy' field to show the name/email of the doctor that registered them
        const patients = await Patient.find({}).sort({ createdAt: -1 }).populate('registeredBy', 'name email role');
        
        res.json({
            success: true,
            count: patients.length,
            data: patients,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get patient by ID
// @route   GET /api/patients/:id
// @access  Private
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).populate('registeredBy', 'name email role');

        if (patient) {
            res.json({ success: true, data: patient });
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a patient
// @route   PUT /api/patients/:id
// @access  Private
const updatePatient = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (patient) {
            patient.name = req.body.name || patient.name;
            patient.age = req.body.age !== undefined ? req.body.age : patient.age;
            patient.gender = req.body.gender || patient.gender;
            patient.phone = req.body.phone || patient.phone;
            patient.address = req.body.address || patient.address;
            patient.medicalHistory = req.body.medicalHistory || patient.medicalHistory;

            const updatedPatient = await patient.save();

            res.json({
                success: true,
                message: 'Patient updated successfully',
                data: updatedPatient,
            });
        } else {
            res.status(404).json({ message: 'Patient not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = { createPatient, getPatients, getPatientById, updatePatient };
