const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Allows us to accept JSON data in the body
app.use(express.urlencoded({ limit: '10mb', extended: true })); // Allows us to accept form-data

// Define API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/api/inventory', require('./routes/inventoryRoutes'));
app.use('/api/billing', require('./routes/billingRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));

app.use('/api/settings', require('./routes/settingRoutes'));



// Define initial basic route
app.get('/', (req, res) => {
    res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
