const mongoose = require('mongoose');

const registrationBillSchema = mongoose.Schema({
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
  receiptNo: {
    type: String,
    required: true,
    unique: true
  },
  amount: {
    type: Number,
    default: 0
  },
  paymentMode: {
    type: String,
    enum: ['Cash', 'Online', 'Card'],
    default: 'Cash'
  }
}, { timestamps: true });

const RegistrationBill = mongoose.model('RegistrationBill', registrationBillSchema);
module.exports = RegistrationBill;
