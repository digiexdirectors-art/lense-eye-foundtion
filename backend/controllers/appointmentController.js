const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const User = require('../models/User'); // Used to pull Doctor data
const { sendEmailNotification, sendSmsNotification } = require('../utils/notifier');

// @desc    Create new targeted appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  const { patientId, doctorId, appointmentDate, timeSlot, reason } = req.body;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' });

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') return res.status(404).json({ success: false, message: 'Target doctor not found' });

    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorId,
      appointmentDate,
      timeSlot,
      reason,
      createdBy: req.user._id
    });

    // ============================================
    // Notification Dispatch Center
    // ============================================
    const dateFormatted = new Date(appointmentDate).toLocaleDateString();
    
    // Alert the Patient
    if (patient.email) {
      await sendEmailNotification(
        patient.email, 
        'Eye Nova Appointment Confirmed', 
        `Hi ${patient.name}, your eye consultation with Dr. ${doctor.name} is officially confirmed for ${dateFormatted} at ${timeSlot}.`
      );
    } else {
      console.log("[NOTIFIER FLAG] Missing Patient Email - skipping patient email dispatch.");
    }
    
    if (patient.phone) {
      await sendSmsNotification(
        patient.phone, 
        `Eye Nova: Hi ${patient.name}, your appt with Dr. ${doctor.name} is confirmed for ${dateFormatted} at ${timeSlot}.`
      );
    }

    // Alert the Doctor
    if (doctor.email) {
      await sendEmailNotification(
        doctor.email, 
        'New Patient Booking Confirmed', 
        `Hello Dr. ${doctor.name}, you have a new automated booking with patient ${patient.name} scheduled for ${dateFormatted} at ${timeSlot}. Reason: ${reason || 'N/A'}`
      );
    }

    res.status(201).json({ success: true, data: appointment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Backend Server Error' });
  }
};

// @desc    Get all appointments (Filtered by role automatically)
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    let query = {};
    // If the authenticated user is a doctor, filter out everyone else's appointments!
    if (req.user.role === 'doctor') {
      query.doctor = req.user._id;
    }
    
    const appointments = await Appointment.find(query)
      .populate('patient', 'name phone email gender')
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 }); // Sort chronologically (latest first)
      
    res.json({ success: true, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// @desc    Update appointment status (e.g. mark as Cancelled/Completed)
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment record not found' });

    // Allow updating status or details
    appointment.status = req.body.status || appointment.status;
    appointment.appointmentDate = req.body.appointmentDate || appointment.appointmentDate;
    appointment.timeSlot = req.body.timeSlot || appointment.timeSlot;
    appointment.reason = req.body.reason || appointment.reason;

    await appointment.save();
    res.json({ success: true, data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = { createAppointment, getAppointments, updateAppointment };
