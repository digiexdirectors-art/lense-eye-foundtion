const mongoose = require('mongoose');

const eyeDataSchema = mongoose.Schema({
  pgvn: { type: String, default: '' },
  bcvn: { type: String, default: '' },
  nct: { type: String, default: '' },
  phvn: { type: String, default: '' }
}, { _id: false });

const optTestSchema = mongoose.Schema({
  acd: { type: String, default: '' },
  pupillaryReaction: { type: String, default: '' },
  eom: { type: String, default: '' }
}, { _id: false });

const spectacleSchema = mongoose.Schema({
  sph: { type: String, default: '' },
  cyl: { type: String, default: '' },
  axis: { type: String, default: '' },
  add: { type: String, default: '' },
  va: { type: String, default: '' }
}, { _id: false });

const examinationSchema = mongoose.Schema({
  anteriorSegment: { type: String, default: '' },
  posteriorSegment: { type: String, default: '' }
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
  optTest: { // We'll keep the key 'optTest' but label it 'OPD Test' in UI
    rightEye: optTestSchema,
    leftEye: optTestSchema
  },
  spectaclePrescription: {
    rightEye: spectacleSchema,
    leftEye: spectacleSchema
  },
  examinationFinding: {
    rightEye: examinationSchema,
    leftEye: examinationSchema
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
  nextReviewNote: { type: String, default: '' },
  glassPrescription: {
    material: { type: String, default: '' },
    category: { type: String, default: '' },
    product: { type: String, default: '' },
    usage: { type: String, default: '' },
    remarks: { type: String, default: '' },
    glassType: { type: String, default: '' }
  }
}, { timestamps: true });

const Prescription = mongoose.model('Prescription', prescriptionSchema);
module.exports = Prescription;
