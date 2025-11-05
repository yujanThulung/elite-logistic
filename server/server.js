import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Fix __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB connection error:', err));

// Shipment Schema
const shipmentSchema = new mongoose.Schema({
  trackingNumber: { type: String, required: true },
  destination: { type: String, required: true },
  status: { type: String, required: true },
  estimatedDelivery: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Shipment = mongoose.model('Shipment', shipmentSchema);

// Test API
app.get('/api/test', (req, res) => {
  res.json({
     message: 'Elite Logistic API is working!',
     nodeVersion: process.version,
     timestamp: new Date().toISOString(),
  });
});

// Get all shipments
app.get('/api/shipments', async (req, res) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 });
    res.json(shipments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create shipment
app.post('/api/shipments', async (req, res) => {
  try {
    const shipment = new Shipment(req.body);
    await shipment.save();
    res.status(201).json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get shipment by tracking number
app.get('/api/shipments/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({ trackingNumber: req.params.trackingNumber });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update shipment status
app.put('/api/shipments/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndUpdate(
      { trackingNumber: req.params.trackingNumber },
      req.body,
      { new: true }
    );
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete shipment
app.delete('/api/shipments/:trackingNumber', async (req, res) => {
  try {
    const shipment = await Shipment.findOneAndDelete({ trackingNumber: req.params.trackingNumber });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'Elite Logistic Server',
    nodeVersion: process.version,
    timestamp: new Date().toISOString()
  });
});

// ------------------- ✅ Serve Frontend ---------------------

// Serve static files from the client dist folder
app.use(express.static(path.join(__dirname, '../client/dist')));

// ✅ FIXED: Simple catch-all for frontend routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    // If it's an API route that hasn't been handled, return 404
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  // For all other routes, serve the frontend
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// -----------------------------------------------------------

app.listen(PORT, () => {
  console.log(`🚀 Elite Logistic server running on port ${PORT}`);
  console.log(`💡 Node.js version: ${process.version}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Serving frontend from: ${path.join(__dirname, '../client/dist')}`);
});