const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Optional if using a .env file

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'DELETE', 'PUT'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Origin', 'X-Requested-With', 'Accept']
}));

// app.use((req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Credentials", true);
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE,PUT");
//     next();
// });

app.use(express.json()); // Parses incoming JSON requests

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://shanghai-rummy-671bf-default-rtdb.firebaseio.com"
    });
    console.log("Firebase Admin initialized successfully");
} catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    process.exit(1); // Exit if Firebase initialization fails
}

const welcomeRoutes = require('./routes/welcomeRoutes');
const waitingRoomRoutes = require('./routes/waitingRoomRoutes');
const deckRoutes = require('./routes/deckRoutes');
const playerHandRoutes = require('./routes/playerHandRoutes');

// Routes
app.use('/api/welcome', welcomeRoutes);
app.use('/api/waiting-room', waitingRoomRoutes);
app.use('/api/deck', deckRoutes);
app.use('/api/player-hand', playerHandRoutes);

app.use((err, req, res, next) => {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
