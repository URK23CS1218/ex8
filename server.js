require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bookingRoutes = require('./routes/bookings');
const path = require('path');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use('/api/bookings', bookingRoutes);

// MongoDB Connection with exact URI format
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wtlab_db_user:Jerry%407@cluster0.5gwoosa.mongodb.net/moviebooking?retryWrites=true&w=majority';

console.log('🔗 Connecting to MongoDB Atlas...');
console.log('📊 Database: moviebooking');

const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

mongoose.connect(MONGODB_URI, mongooseOptions)
.then(() => {
  console.log('✅ Successfully connected to MongoDB Atlas');
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
});

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🗄️ Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Basic routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus] || 'unknown';
  
  res.json({ 
    status: dbStatus === 1 ? 'OK' : 'ERROR',
    database: statusText,
    timestamp: new Date().toISOString()
  });
});

// Test MongoDB connection route
app.get('/api/test-db', async (req, res) => {
  try {
    const Booking = require('./models/Booking');
    const testBooking = new Booking({
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '1234567890',
      movieTitle: 'Test Movie',
      movieTime: '10:00 AM',
      theater: 'Test Theater',
      seats: ['A1'],
      totalAmount: 200
    });
    
    const saved = await testBooking.save();
    await Booking.findByIdAndDelete(saved._id); // Clean up
    
    res.json({ 
      message: '✅ MongoDB connection test successful!',
      bookingReference: saved.bookingReference 
    });
  } catch (error) {
    res.status(500).json({ 
      error: '❌ MongoDB test failed: ' + error.message 
    });
  }
});

// Reset collection route (development only)
app.post('/api/reset-db', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' });
  }
  
  try {
    const Booking = require('./models/Booking');
    await Booking.deleteMany({});
    res.json({ message: '✅ Database reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to open browser automatically
function openBrowser() {
  const url = `http://localhost:${PORT}`;
  
  console.log('🌐 Attempting to open browser automatically...');
  
  try {
    switch (process.platform) {
      case 'win32': // Windows
        exec(`start ${url}`);
        break;
      case 'darwin': // macOS
        exec(`open ${url}`);
        break;
      default: // Linux and others
        exec(`xdg-open ${url}`);
        break;
    }
    console.log('✅ Browser should open shortly...');
  } catch (error) {
    console.log('⚠️ Could not open browser automatically');
    console.log(`📍 Please manually open: ${url}`);
  }
}

app.listen(PORT, () => {
  console.log('🎬 Movie Ticket Booking System');
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Local: http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️ MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Connecting...'}`);
  
  // Auto-open browser in development mode
  if (process.env.NODE_ENV !== 'production') {
    setTimeout(openBrowser, 2000); // Wait 2 seconds then open browser
  }
});