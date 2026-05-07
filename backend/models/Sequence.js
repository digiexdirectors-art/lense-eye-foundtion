const mongoose = require('mongoose');

const sequenceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sequence_value: { type: Number, default: 1000 }
});

const Sequence = mongoose.model('Sequence', sequenceSchema);
module.exports = Sequence;
