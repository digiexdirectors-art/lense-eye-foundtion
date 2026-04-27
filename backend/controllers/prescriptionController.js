const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// @desc    Create or update prescription for an appointment
// @route   POST /api/prescriptions
// @access  Private (Doctors/Admin)
const createPrescription = async (req, res) => {
  const { 
    appointmentId, rightEye, leftEye, optTest,
    chiefComplaints, generalHealth, pastHistory,
    diagnosis, medications, comments, notes, 
    suggestedLens, recommendations, prescriptionDate,
    nextReviewDate, nextReviewNote 
  } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId).populate('patient').populate('doctor');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if prescription already exists for this appointment
    let prescription = await Prescription.findOne({ appointment: appointmentId });

    if (prescription) {
      // Update existing
      prescription.rightEye = rightEye;
      prescription.leftEye = leftEye;
      prescription.optTest = optTest;
      prescription.chiefComplaints = chiefComplaints;
      prescription.generalHealth = generalHealth;
      prescription.pastHistory = pastHistory;
      prescription.diagnosis = diagnosis;
      prescription.medications = medications;
      prescription.comments = comments;
      prescription.notes = notes;
      prescription.suggestedLens = suggestedLens;
      prescription.recommendations = recommendations;
      prescription.prescriptionDate = prescriptionDate || prescription.prescriptionDate;
      prescription.nextReviewDate = nextReviewDate;
      prescription.nextReviewNote = nextReviewNote;
      await prescription.save();
    } else {
      // Create new
      prescription = await Prescription.create({
        appointment: appointmentId,
        patient: appointment.patient._id,
        doctor: appointment.doctor._id,
        rightEye,
        leftEye,
        optTest,
        chiefComplaints,
        generalHealth,
        pastHistory,
        diagnosis,
        medications,
        comments,
        notes,
        suggestedLens,
        recommendations,
        prescriptionDate: prescriptionDate || new Date(),
        nextReviewDate,
        nextReviewNote
      });
      
      // Auto-update appointment status to Completed when prescription is generated
      appointment.status = 'Completed';
      await appointment.save();
    }

    // Return populated data so frontend can print immediately
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name age gender phone address')
      .populate('doctor', 'name specialization qualifications registrationNumber');

    res.status(201).json({ success: true, data: populatedPrescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get prescription by appointment ID
// @route   GET /api/prescriptions/appointment/:appointmentId
// @access  Private
const getPrescriptionByAppointmentId = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ appointment: req.params.appointmentId })
      .populate('patient', 'name age gender phone address')
      .populate('doctor', 'name specialization qualifications registrationNumber')
      .populate('appointment', 'appointmentDate timeSlot reason');
      
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Get prescription PDF
// @route   GET /api/prescriptions/:id/pdf
// @access  Private
const getPrescriptionPDF = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patient', 'name age gender phone address')
      .populate('doctor', 'name specialization qualifications registrationNumber')
      .populate('appointment', 'appointmentDate timeSlot reason');
      
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    await generatePrescriptionPDF(res, prescription);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { createPrescription, getPrescriptionByAppointmentId, getPrescriptionPDF };

