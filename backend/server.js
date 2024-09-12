// backend/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Optional if you're using a .env file

const app = express();

// Middleware
app.use(cors()); // Enables CORS for cross-origin requests
app.use(express.json()); // Parses incoming JSON requests

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Backend server is running');
});

// Example API route
app.get('/api/data', (req, res) => {
    res.json({ message: 'Hello from the backend!' });
});

// Listen on a port
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
  
process.on('SIGINT', () => {
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
    