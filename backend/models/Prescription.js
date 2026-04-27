const mongoose = require('mongoose');

const eyeDataSchema = mongoose.Schema({
  pgvn: { type: String, default: '' },
  bcvn: { type: String, default: '' },
  nct: { type: String, default: '' }
}, { _id: false });

const optTestSchema = mongoose.Schema({
  acid: { type: String, default: '' },
  pupillaryReaction: { type: String, default: '' },
  eom: { type: String, default: '' }
}, { _id: false });

const prescriptionSchema = mongoose.Schema({
   appointment: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Appointment',
    unique: true
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
  chiefComplaints: { type: String, default: '' },
  generalHealth: { type: String, default: '' },
  pastHistory: { type: String, default: '' },
  rightEye: eyeDataSchema,
  leftEye: eyeDataSchema,
  optTest: {
    rightEye: optTestSchema,
    leftEye: optTestSchema
  },
  diagnosis: { type: String, default: '' },
  medications: [{
    name: { type: String, default: '' },
    description: { type: String, default: '' }
  }],
  comments: { type: String, default: '' },
  notes: { type: String, default: '' },
  suggestedLens: { type: String, default: '' },
  recommendations: { type: String, default: '' },
  prescriptionDate: { type: Date, default: Date.now },
  nextReviewDate: { type: String, default: '' },
  nextReviewNote: { type: String, default: '' }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
