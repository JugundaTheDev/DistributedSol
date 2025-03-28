const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const amqp = require('amqplib');
const axios = require('axios');
const swaggerUi = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json'); // Minimal OpenAPI doc

// Use environment variables for config
const PORT = process.env.PORT || 3001;
const QUESTION_SERVICE_URL = process.env.QUESTION_SERVICE_URL || 'http://localhost:3002';
const RABBIT_HOST = process.env.RABBIT_HOST || 'localhost';
const RABBIT_QUEUE = process.env.RABBIT_QUEUE || 'SUBMITTED_QUESTIONS';

// Where  categories are cached if Question is down
const CACHE_FILE = path.join(__dirname, 'categories-cache.json');

const app = express();
app.use(bodyParser.json());

// Serve any static front-end files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Logging utility
function logInfo(message, data) {
  console.log(`[Submit] INFO: ${message}`, data || '');
}
function logError(message, error) {
  console.error(`[Submit] ERROR: ${message}`, error);
}

// RabbitMQ channel
let amqpChannel = null;

// Attempt to connect to RabbitMQ with retry logic
async function connectRabbit() {
  try {
    logInfo('Connecting to RabbitMQ at', RABBIT_HOST);
    const conn = await amqp.connect(`amqp://${RABBIT_HOST}`);
    amqpChannel = await conn.createChannel();
    await amqpChannel.assertQueue(RABBIT_QUEUE, { durable: true });
    logInfo('Connected to RabbitMQ, queue asserted:', RABBIT_QUEUE);
  } catch (err) {
    logError('RabbitMQ connection error', err);
    // Retry after 5 seconds
    setTimeout(connectRabbit, 5000);
  }
}
connectRabbit();

// GET /categories - fetch from Question microservice or fallback to cache
app.get('/categories', async (req, res) => {
  try {
    logInfo('Fetching categories from Question service at', QUESTION_SERVICE_URL);
    const response = await axios.get(`${QUESTION_SERVICE_URL}/categories`);
    const categories = response.data;
    // Update local cache
    fs.writeFileSync(CACHE_FILE, JSON.stringify(categories, null, 2));
    return res.json(categories);
  } catch (error) {
    logError('Could not fetch categories, using cache if available', error);
    if (fs.existsSync(CACHE_FILE)) {
      const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      return res.json(cached);
    } else {
      return res.status(500).json({ error: 'Unable to fetch categories' });
    }
  }
});

// POST /submit - publish new question to RabbitMQ
app.post('/submit', (req, res) => {
  const { question, answers, correctIndex, category, newCategory } = req.body;

  // Basic validation
  if (!question || !answers || correctIndex == null) {
    return res.status(400).json({ error: 'Missing required fields: question, answers, correctIndex' });
  }
  if (!Array.isArray(answers) || answers.length !== 4) {
    return res.status(400).json({ error: 'Must provide exactly 4 answers' });
  }

  // Determine final category
  const finalCategory = newCategory && newCategory.trim() !== '' ? newCategory.trim() : category;

  // Construct the message
  const message = { question, answers, correctIndex, category: finalCategory };

  // Ensure RabbitMQ channel is ready
  if (!amqpChannel) {
    logError('RabbitMQ channel not ready', null);
    return res.status(500).json({ error: 'RabbitMQ channel not ready' });
  }

  try {
    // Publish to queue
    amqpChannel.sendToQueue(RABBIT_QUEUE, Buffer.from(JSON.stringify(message)), { persistent: true });
    logInfo('Published message to queue:', message);
    return res.json({ status: 'Question submitted successfully' });
  } catch (err) {
    logError('Error publishing message to queue', err);
    return res.status(500).json({ error: 'Publish error' });
  }
});

// GET /docs -using swagger
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// Start the server
app.listen(PORT, () => {
  logInfo(`Service running on port ${PORT}`);
});