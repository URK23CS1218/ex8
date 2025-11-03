const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// CREATE new booking
router.post('/', async (req, res) => {
  try {
    console.log('📥 Received booking data:', req.body);

    // Validate required fields
    const { customerName, customerEmail, customerPhone, movieTitle, movieTime, theater, seats } = req.body;
    
    if (!customerName || !customerEmail || !customerPhone || !movieTitle || !movieTime || !theater) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return res.status(400).json({ 
        message: 'Please select at least one seat' 
      });
    }

    // Create booking - bookingReference will be auto-generated
    const bookingData = {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: customerPhone.toString().replace(/\D/g, ''),
      movieTitle: movieTitle,
      movieTime: movieTime,
      theater: theater,
      seats: seats,
      totalAmount: seats.length * 200
    };

    console.log('💾 Saving booking data:', bookingData);

    const booking = new Booking(bookingData);
    const savedBooking = await booking.save();
    
    console.log('✅ Booking created successfully. Reference:', savedBooking.bookingReference);
    
    res.status(201).json({
      message: 'Booking created successfully!',
      booking: savedBooking
    });
    
  } catch (error) {
    console.error('❌ Booking creation error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error. Please try again.',
      error: error.message 
    });
  }
});

// GET all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({
      bookings: bookings || [],
      totalBookings: bookings.length
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      message: 'Failed to fetch bookings'
    });
  }
});

// GET booking by ID
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }
    res.status(500).json({ message: error.message });
  }
});

// GET bookings by email
router.get('/email/:email', async (req, res) => {
  try {
    const email = req.params.email.toLowerCase();
    const bookings = await Booking.find({ customerEmail: email }).sort({ createdAt: -1 });

    res.json({
      bookings: bookings || [],
      total: bookings.length,
      customerEmail: email
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET booking by reference number - FIXED ROUTE
router.get('/reference/:reference', async (req, res) => {
  try {
    const reference = req.params.reference.toUpperCase();
    console.log('🔍 Searching for booking reference:', reference);
    
    const booking = await Booking.findOne({ bookingReference: reference });
    
    if (!booking) {
      return res.status(404).json({ 
        message: 'No booking found with this reference number' 
      });
    }
    
    res.json({
      booking: booking,
      message: 'Booking found successfully'
    });
    
  } catch (error) {
    console.error('Error searching by reference:', error);
    res.status(500).json({ 
      message: 'Error searching booking',
      error: error.message 
    });
  }
});

// SEARCH bookings by multiple criteria
router.get('/search/all', async (req, res) => {
  try {
    const { email, reference } = req.query;
    let query = {};
    
    if (email) {
      query.customerEmail = email.toLowerCase();
    }
    
    if (reference) {
      query.bookingReference = reference.toUpperCase();
    }
    
    const bookings = await Booking.find(query).sort({ createdAt: -1 });
    
    res.json({
      bookings: bookings || [],
      total: bookings.length,
      searchCriteria: { email, reference }
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE booking
router.delete('/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.json({ 
      message: 'Booking cancelled successfully',
      cancelledBooking: booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET available seats
router.get('/availability/:movie/:time', async (req, res) => {
  try {
    const { movie, time } = req.params;
    const bookings = await Booking.find({ 
      movieTitle: decodeURIComponent(movie), 
      movieTime: time,
      status: 'confirmed'
    });
    
    const bookedSeats = bookings.flatMap(booking => booking.seats);
    
    res.json({ 
      bookedSeats: bookedSeats || [],
      totalBooked: bookedSeats.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;