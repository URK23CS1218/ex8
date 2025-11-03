const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true,
    trim: true
  },
  customerEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  customerPhone: {
    type: String,
    required: true,
    trim: true
  },
  movieTitle: {
    type: String,
    required: true,
    trim: true
  },
  movieTime: {
    type: String,
    required: true
  },
  theater: {
    type: String,
    required: true,
    trim: true
  },
  seats: {
    type: [String],
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  bookingDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'confirmed'
  },
  bookingReference: {
    type: String,
    unique: true,
    default: function() {
      return 'MOV' + Date.now() + Math.random().toString(36).substring(2, 7).toUpperCase();
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);