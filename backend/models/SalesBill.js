const mongoose = require("mongoose");

const salesBillSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient" },

    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },

    items: [
        {
            name: String,
            qty: Number,
            price: Number,
            gstPercent: Number,
            cgst: Number,
            sgst: Number,
            total: Number,
        },
    ],

    subTotal: Number,
    cgstTotal: Number,
    sgstTotal: Number,
    grandTotal: Number,
    paymentMode: String,

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SalesBill", salesBillSchema);