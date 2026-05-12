const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const { generatePrescriptionPDF } = require('../utils/pdfGenerator');

// @desc    Create or update prescription for an appointment
// @route   POST /api/prescriptions
// @access  Private (Doctors/Admin)
const createPrescription = async (req, res) => {
  const { 
    appointmentId, rightEye, leftEye, optTest,
    spectaclePrescription, examinationFinding,
    chiefComplaints, generalHealth, pastHistory,
    diagnosis, medications, comments, notes, 
    suggestedLens, recommendations, prescriptionDate,
    nextReviewDate, nextReviewNote, glassPrescription
  } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId).populate('patient').populate('doctor');
    
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Check if prescription already exists for this appointment
    let prescription = await Prescription.findOne({ appointment: appointmentId });

    if (prescription) {
      // Update existing - only update fields that are present in req.body
      if (rightEye !== undefined) prescription.rightEye = rightEye;
      if (leftEye !== undefined) prescription.leftEye = leftEye;
      if (optTest !== undefined) prescription.optTest = optTest;
      if (spectaclePrescription !== undefined) prescription.spectaclePrescription = spectaclePrescription;
      if (examinationFinding !== undefined) prescription.examinationFinding = examinationFinding;
      if (chiefComplaints !== undefined) prescription.chiefComplaints = chiefComplaints;
      if (generalHealth !== undefined) prescription.generalHealth = generalHealth;
      if (pastHistory !== undefined) prescription.pastHistory = pastHistory;
      if (diagnosis !== undefined) prescription.diagnosis = diagnosis;
      if (medications !== undefined) prescription.medications = medications;
      if (comments !== undefined) prescription.comments = comments;
      if (notes !== undefined) prescription.notes = notes;
      if (suggestedLens !== undefined) prescription.suggestedLens = suggestedLens;
      if (recommendations !== undefined) prescription.recommendations = recommendations;
      if (prescriptionDate !== undefined) prescription.prescriptionDate = prescriptionDate;
      if (nextReviewDate !== undefined) prescription.nextReviewDate = nextReviewDate;
      if (nextReviewNote !== undefined) prescription.nextReviewNote = nextReviewNote;
      if (glassPrescription !== undefined) prescription.glassPrescription = glassPrescription;
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
        spectaclePrescription,
        examinationFinding,
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
        nextReviewNote,
        glassPrescription
      });
      
      // Auto-update appointment status to Completed when prescription is generated
      appointment.status = 'Completed';
      await appointment.save();
    }

    // Return populated data so frontend can print immediately
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('patient', 'name age gender phone address mrdNumber purpose regdBy')
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
      .populate('patient', 'name age gender phone address mrdNumber purpose regdBy')
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
      .populate('patient', 'name age gender phone address mrdNumber purpose regdBy')
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

// @desc    Get latest prescription by patient ID
// @route   GET /api/prescriptions/patient/:patientId/latest
// @access  Private
const getLatestPrescriptionByPatientId = async (req, res) => {
  try {
    const prescription = await Prescription.findOne({ patient: req.params.patientId })
      .sort({ createdAt: -1 })
      .populate('patient', 'name age gender phone address mrdNumber purpose regdBy')
      .populate('doctor', 'name specialization qualifications registrationNumber')
      .populate('appointment', 'appointmentDate timeSlot reason');
      
    if (!prescription) {
      return res.status(404).json({ success: false, message: 'No prescription found for this patient' });
    }

    res.json({ success: true, data: prescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { createPrescription, getPrescriptionByAppointmentId, getPrescriptionPDF, getLatestPrescriptionByPatientId };

