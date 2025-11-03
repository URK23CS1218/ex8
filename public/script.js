const API_BASE = '/api/bookings';
let selectedSeats = [];
let seatPrice = 200;

// Tab management
function openTab(tabName) {
    const tabContents = document.getElementsByClassName('tab-content');
    const tabButtons = document.getElementsByClassName('tab-button');
    
    for (let tab of tabContents) {
        tab.classList.remove('active');
    }
    for (let button of tabButtons) {
        button.classList.remove('active');
    }
    
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');
    
    if (tabName === 'view') {
        loadAllBookings();
    } else if (tabName === 'booking') {
        initializeSeatMap();
    } else if (tabName === 'search') {
        clearSearchResults();
    }
}

// Clear search results
function clearSearchResults() {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchEmail').value = '';
    document.getElementById('searchReference').value = '';
}

// Initialize seat map
function initializeSeatMap() {
    const seatMap = document.getElementById('seatMap');
    seatMap.innerHTML = '';
    
    // Add screen
    const screen = document.createElement('div');
    screen.className = 'screen';
    screen.textContent = 'SCREEN';
    screen.style.gridColumn = '1 / -1';
    screen.style.marginBottom = '20px';
    seatMap.appendChild(screen);
    
    // Create 50 seats (5 rows x 10 columns)
    for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 10; col++) {
            const seat = document.createElement('button');
            const seatNumber = `${String.fromCharCode(64 + row)}${col}`;
            seat.className = 'seat';
            seat.textContent = seatNumber;
            seat.type = 'button';
            seat.onclick = () => toggleSeat(seatNumber);
            seatMap.appendChild(seat);
        }
    }
    
    selectedSeats = [];
    updateSeatDisplay();
    calculateTotal();
}

// Toggle seat selection
function toggleSeat(seatNumber) {
    const seatElement = Array.from(document.querySelectorAll('.seat')).find(seat => seat.textContent === seatNumber);
    
    if (seatElement && seatElement.classList.contains('occupied')) {
        return;
    }
    
    const index = selectedSeats.indexOf(seatNumber);
    
    if (index === -1) {
        selectedSeats.push(seatNumber);
    } else {
        selectedSeats.splice(index, 1);
    }
    
    updateSeatDisplay();
    calculateTotal();
}

// Update seat display
function updateSeatDisplay() {
    const seats = document.querySelectorAll('.seat');
    const selectedSeatsDiv = document.getElementById('selectedSeats');
    
    seats.forEach(seat => {
        if (selectedSeats.includes(seat.textContent)) {
            seat.classList.add('selected');
        } else {
            seat.classList.remove('selected');
        }
    });
    
    selectedSeatsDiv.textContent = `Selected Seats: ${selectedSeats.join(', ') || 'None'}`;
}

// Calculate total amount
function calculateTotal() {
    const total = selectedSeats.length * seatPrice;
    document.getElementById('totalAmount').textContent = total;
}

// Update showtimes based on movie selection
function updateShowtimes() {
    const movieSelect = document.getElementById('movieTitle');
    const timeSelect = document.getElementById('movieTime');
    const movie = movieSelect.value;
    
    timeSelect.innerHTML = '<option value="">Select show time</option>';
    
    if (movie) {
        const showtimes = ['10:00 AM', '1:30 PM', '4:00 PM', '7:00 PM', '10:30 PM'];
        showtimes.forEach(time => {
            const option = document.createElement('option');
            option.value = time;
            option.textContent = time;
            timeSelect.appendChild(option);
        });
    }
    
    selectedSeats = [];
    updateSeatDisplay();
    calculateTotal();
    initializeSeatMap();
}

// Check seat availability
async function checkSeatAvailability() {
    const movie = document.getElementById('movieTitle').value;
    const time = document.getElementById('movieTime').value;
    
    if (!movie || !time) return;
    
    try {
        const response = await fetch(`${API_BASE}/availability/${encodeURIComponent(movie)}/${time}`);
        if (response.ok) {
            const data = await response.json();
            
            const seats = document.querySelectorAll('.seat');
            seats.forEach(seat => {
                if (data.bookedSeats.includes(seat.textContent)) {
                    seat.classList.add('occupied');
                    seat.disabled = true;
                } else {
                    seat.classList.remove('occupied');
                    seat.disabled = false;
                }
            });
        }
    } catch (error) {
        console.error('Error checking seat availability:', error);
    }
}

// Handle booking form submission
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedSeats.length === 0) {
        showMessage('Please select at least one seat.', 'error');
        return;
    }
    
    const formData = {
        customerName: document.getElementById('customerName').value.trim(),
        customerEmail: document.getElementById('customerEmail').value.trim().toLowerCase(),
        customerPhone: document.getElementById('customerPhone').value.trim().replace(/\D/g, ''),
        movieTitle: document.getElementById('movieTitle').value,
        movieTime: document.getElementById('movieTime').value,
        theater: document.getElementById('theater').value,
        seats: selectedSeats,
        totalAmount: selectedSeats.length * seatPrice
    };

    // Basic validation
    if (!formData.customerName || formData.customerName.length < 2) {
        showMessage('Please enter a valid name (at least 2 characters)', 'error');
        return;
    }

    if (!formData.customerEmail || !formData.customerEmail.includes('@')) {
        showMessage('Please enter a valid email address', 'error');
        return;
    }

    if (!formData.customerPhone || formData.customerPhone.length < 10) {
        showMessage('Please enter a valid phone number (at least 10 digits)', 'error');
        return;
    }

    if (!formData.movieTitle || !formData.movieTime || !formData.theater) {
        showMessage('Please select movie, show time, and theater', 'error');
        return;
    }

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage(`✅ Booking successful! Reference: ${result.booking.bookingReference}`, 'success');
            
            // Reset form
            document.getElementById('bookingForm').reset();
            selectedSeats = [];
            updateSeatDisplay();
            calculateTotal();
            initializeSeatMap();
            
        } else {
            let errorMessage = `❌ Booking failed: ${result.message}`;
            if (result.errors) {
                errorMessage += ` - ${result.errors.join(', ')}`;
            }
            showMessage(errorMessage, 'error');
        }
    } catch (error) {
        showMessage('🚨 Network error. Please try again.', 'error');
    }
});

// Load all bookings
async function loadAllBookings() {
    try {
        const response = await fetch(API_BASE);
        if (response.ok) {
            const data = await response.json();
            displayBookings(data.bookings, 'bookingsList');
        } else {
            showMessage('Error loading bookings.', 'error');
        }
    } catch (error) {
        showMessage('Error loading bookings.', 'error');
    }
}

// Search bookings by email
async function searchBookings() {
    const email = document.getElementById('searchEmail').value.trim().toLowerCase();
    
    if (!email) {
        showMessage('Please enter an email address.', 'error');
        return;
    }

    if (!email.includes('@')) {
        showMessage('Please enter a valid email address.', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/email/${encodeURIComponent(email)}`);
        if (response.ok) {
            const data = await response.json();
            displaySearchResults(data.bookings, `Search Results for Email: ${email}`);
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
            document.getElementById('searchResults').innerHTML = '';
        }
    } catch (error) {
        showMessage('Error searching bookings.', 'error');
        document.getElementById('searchResults').innerHTML = '';
    }
}

// Search booking by reference - FIXED FUNCTION
async function searchByReference() {
    const reference = document.getElementById('searchReference').value.trim().toUpperCase();
    
    if (!reference) {
        showMessage('Please enter a booking reference.', 'error');
        return;
    }

    if (reference.length < 5) {
        showMessage('Please enter a valid booking reference.', 'error');
        return;
    }
    
    try {
        console.log('Searching for reference:', reference);
        const response = await fetch(`${API_BASE}/reference/${encodeURIComponent(reference)}`);
        
        if (response.ok) {
            const data = await response.json();
            // Wrap single booking in array for display function
            const bookings = data.booking ? [data.booking] : [];
            displaySearchResults(bookings, `Search Results for Reference: ${reference}`);
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
            document.getElementById('searchResults').innerHTML = '';
        }
    } catch (error) {
        console.error('Search by reference error:', error);
        showMessage('Error searching booking reference.', 'error');
        document.getElementById('searchResults').innerHTML = '';
    }
}

// Search all criteria
async function searchAll() {
    const email = document.getElementById('searchEmail').value.trim().toLowerCase();
    const reference = document.getElementById('searchReference').value.trim().toUpperCase();
    
    if (!email && !reference) {
        showMessage('Please enter either email or reference to search.', 'error');
        return;
    }
    
    try {
        const params = new URLSearchParams();
        if (email) params.append('email', email);
        if (reference) params.append('reference', reference);
        
        const response = await fetch(`${API_BASE}/search/all?${params}`);
        if (response.ok) {
            const data = await response.json();
            let searchTitle = 'Search Results';
            if (email && reference) searchTitle = `Results for Email: ${email} and Reference: ${reference}`;
            else if (email) searchTitle = `Results for Email: ${email}`;
            else if (reference) searchTitle = `Results for Reference: ${reference}`;
            
            displaySearchResults(data.bookings, searchTitle);
        } else {
            const error = await response.json();
            showMessage(error.message, 'error');
        }
    } catch (error) {
        showMessage('Error searching.', 'error');
    }
}

// Display search results
function displaySearchResults(bookings, title) {
    const container = document.getElementById('searchResults');
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = `
            <div class="search-header">
                <h3>${title}</h3>
            </div>
            <div class="booking-card">
                <p>No bookings found.</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="search-header">
            <h3>${title}</h3>
            <p>Found ${bookings.length} booking(s)</p>
        </div>
    `;
    
    html += bookings.map(booking => `
        <div class="booking-card">
            <h3>🎬 ${booking.movieTitle}</h3>
            <p><strong>Reference:</strong> <span class="reference-code">${booking.bookingReference}</span></p>
            <p><strong>Customer:</strong> ${booking.customerName} (${booking.customerEmail})</p>
            <p><strong>Phone:</strong> ${booking.customerPhone}</p>
            <p><strong>Show:</strong> ${booking.movieTime} at ${booking.theater}</p>
            <p><strong>Seats:</strong> ${Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</p>
            <p><strong>Amount:</strong> ₹${booking.totalAmount}</p>
            <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span></p>
            <p><strong>Booked on:</strong> ${new Date(booking.bookingDate).toLocaleString()}</p>
            <button class="btn-danger" onclick="deleteBooking('${booking._id}')">Cancel Booking</button>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Display bookings for view tab
function displayBookings(bookings, containerId) {
    const container = document.getElementById(containerId);
    
    if (!bookings || bookings.length === 0) {
        container.innerHTML = '<div class="booking-card"><p>No bookings found.</p></div>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="booking-card">
            <h3>🎬 ${booking.movieTitle}</h3>
            <p><strong>Reference:</strong> <span class="reference-code">${booking.bookingReference}</span></p>
            <p><strong>Customer:</strong> ${booking.customerName} (${booking.customerEmail})</p>
            <p><strong>Phone:</strong> ${booking.customerPhone}</p>
            <p><strong>Show:</strong> ${booking.movieTime} at ${booking.theater}</p>
            <p><strong>Seats:</strong> ${Array.isArray(booking.seats) ? booking.seats.join(', ') : booking.seats}</p>
            <p><strong>Amount:</strong> ₹${booking.totalAmount}</p>
            <p><strong>Status:</strong> <span class="status-${booking.status}">${booking.status}</span></p>
            <p><strong>Booked on:</strong> ${new Date(booking.bookingDate).toLocaleString()}</p>
            <button class="btn-danger" onclick="deleteBooking('${booking._id}')">Cancel Booking</button>
        </div>
    `).join('');
}

// Delete booking
async function deleteBooking(id) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showMessage('Booking cancelled successfully.', 'success');
            // Refresh current view
            if (document.getElementById('search').classList.contains('active')) {
                const email = document.getElementById('searchEmail').value;
                const reference = document.getElementById('searchReference').value;
                if (email || reference) {
                    searchAll();
                } else {
                    document.getElementById('searchResults').innerHTML = '';
                }
            } else {
                loadAllBookings();
            }
        } else {
            showMessage('Error cancelling booking.', 'error');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'error');
    }
}

// Show message
function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    
    setTimeout(() => {
        messageDiv.textContent = '';
        messageDiv.className = 'message';
    }, 5000);
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeSeatMap();
    loadAllBookings();
    
    // Add Enter key support for search
    document.getElementById('searchEmail').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBookings();
        }
    });
    
    document.getElementById('searchReference').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchByReference();
        }
    });
});