const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
require('dotenv').config();

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const db = require('./config/db');

// Test DB connection
db.getConnection()
  .then(connection => {
    console.log('MySQL connected...');
    connection.release();
  })
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api', require('./routes/adminSignupRoutes'));
app.use('/api', require('./routes/loginRoutes'));
app.use('/api', require('./routes/userRegisterRoutes'));
app.use('/api', require('./routes/CustomerRoutes'));
app.use('/api', require('./routes/mechanicRoutes'));
app.use('/api', require('./routes/inventoryRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/customer-bills', require('./routes/customerBillRoutes'));
app.use('/api/shop', require('./routes/shopControlRoutes'));
app.use('/uploads', express.static('uploads'));


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));