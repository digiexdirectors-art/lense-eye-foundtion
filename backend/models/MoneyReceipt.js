const mongoose = require('mongoose');

const moneyReceiptSchema = mongoose.Schema({
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
  receiptNo: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  age: { type: String, default: '' },
  sex: { type: String, default: '' },
  receivedFrom: { type: String, default: '' },
  sumOfRupees: { type: String, default: '' },
  purpose: { type: String, default: '' },
  amount: { type: Number, default: 0 }
}, { timestamps: true });

const MoneyReceipt = mongoose.model('MoneyReceipt', moneyReceiptSchema);
module.exports = MoneyReceipt;
