const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const http = require('http'); // Import http module
const socketIo = require('socket.io'); // Import socket.io
require('dotenv').config(); // Load environment variables

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = socketIo(server); // Initialize Socket.IO
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(helmet());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100 // Limit each IP to 100 requests per windowMs
});
app.use(limiter);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
    console.log('Connected to MongoDB successfully.');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

// Reservation Schema with Indexing
const reservationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    people: { type: Number, required: true },
    time: { type: Date, required: true, index: true },
    status: { type: String, default: 'Pending', index: true },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

// Create a reservation
app.post('/reserve', [
    body('name').isString().notEmpty(),
    body('mobile').isString().notEmpty(),
    body('people').isInt({ gt: 0 }),
    body('time').isISO8601(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, mobile, people, time } = req.body;
    const reservation = new Reservation({ name, mobile, people, time });
    
    try {
        await reservation.save();
        console.log('Reservation saved:', reservation);
        io.emit('newReservation', reservation); // Emit new reservation event
        res.json({ message: 'رزرو با موفقیت ثبت شد!' });
    } catch (error) {
        console.error('Error saving reservation:', error);
        res.status(500).json({ message: 'خطا در ثبت رزرو.' });
    }
});

// Get all reservations for admin
app.get('/reservations', async (req, res) => {
    try {
        const reservations = await Reservation.find().sort({ time: 1 });
        res.json(reservations);
    } catch (error) {
        console.error('Error fetching reservations:', error);
        res.status(500).json({ message: 'خطا در دریافت رزروها.' });
    }
});

// Update reservation status
app.post('/update-status', async (req, res) => {
    const { id, status } = req.body;

    // Validate input
    if (!id || !status) {
        return res.status(400).json({ message: 'ID و وضعیت الزامی است.' });
    }

    try {
        const updatedReservation = await Reservation.findByIdAndUpdate(id, { status }, { new: true });

        if (!updatedReservation) {
            return res.status(404).json({ message: 'رزرو پیدا نشد.' });
        }

        console.log(`Reservation ID ${id} updated to status: ${status}`);
        res.json({ message: 'وضعیت رزرو به روز شد!', reservation: updatedReservation });
    } catch (error) {
        console.error('Error updating reservation status:', error);
        res.status(500).json({ message: 'خطا در به روز رسانی وضعیت.' });
    }
});

// Socket connection
io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
