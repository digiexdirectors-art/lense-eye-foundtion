const mongoose = require('mongoose');

const patientSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female', 'Other'],
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        address: {
            type: String,
        },
        medicalHistory: {
            type: String,
        },
        registeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Refers back to the User who created this patient
        },
    },
    {
        timestamps: true,
    }
);

const Patient = mongoose.model('Patient', patientSchema);

module.exports = Patient;
