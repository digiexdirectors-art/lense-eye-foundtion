const mongoose = require('mongoose');

const eyeDataSchema = mongoose.Schema({
  sph: { type: String, default: '' },
  cyl: { type: String, default: '' },
  axis: { type: String, default: '' },
  add: { type: String, default: '' }, 
  vision: { type: String, default: '' } 
}, { _id: false });

const prescriptionSchema = mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Appointment'
  },
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Patient'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  rightEye: eyeDataSchema,
  leftEye: eyeDataSchema,
  notes: {
    type: String,
    default: ''
  },
  suggestedLens: {
    type: String,
    default: ''
  },
  recommendations: {
    type: String,
    default: '' 
  }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
