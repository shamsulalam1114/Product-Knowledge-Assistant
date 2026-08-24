require('dotenv').config();
const express = require('express');
const askRoute = require('./routes/ask');

const app = express();
const PORT = process.env.PORT || 4500;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/ask', askRoute);

// Health check
app.get('/', (req, res) => {
  res.send('Product Knowledge Assistant API is running. Send POST requests to /ask');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});
