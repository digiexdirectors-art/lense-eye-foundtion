const mongoose = require('mongoose');

const billCumReceiptSchema = mongoose.Schema({
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
  billNo: {
    type: String,
    required: true,
    unique: true
  },
  patientIdNo: {
    type: String,
    required: true
  },
  serviceCode: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending'],
    default: 'Paid'
  }
}, { timestamps: true });

const BillCumReceipt = mongoose.model('BillCumReceipt', billCumReceiptSchema);
module.exports = BillCumReceipt;
