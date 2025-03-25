const amqp = require('amqplib');
const mysql = require('mysql2/promise');

const RABBIT_HOST = process.env.RABBIT_HOST || 'localhost';
const RABBIT_QUEUE = process.env.RABBIT_QUEUE || 'SUBMITTED_QUESTIONS';

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_DATABASE = process.env.MYSQL_DATABASE || 'questionsdb';

let pool;

async function initDB() {
  pool = await mysql.createPool({
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    database: MYSQL_DATABASE
  });
  console.log('[ETL] Connected to MySQL');
}

async function start() {
  await initDB();

  // Connect to RabbitMQ with retry
  try {
    const conn = await amqp.connect(`amqp://${RABBIT_HOST}`);
    const channel = await conn.createChannel();
    await channel.assertQueue(RABBIT_QUEUE, { durable: true });
    console.log('[ETL] Waiting for messages in', RABBIT_QUEUE);

    channel.consume(RABBIT_QUEUE, async (msg) => {
      if (msg) {
        const content = JSON.parse(msg.content.toString());
        console.log('[ETL] Received:', content);
        try {
          await insertNewQuestion(content);
          channel.ack(msg);
        } catch (err) {
          console.error('[ETL] Error inserting question:', err);
          // discard or requeue
          channel.nack(msg, false, false);
        }
      }
    });
  } catch (err) {
    console.error('[ETL] RabbitMQ connection error:', err);
    setTimeout(start, 5000);
  }
}

async function insertNewQuestion({ question, answers, correctIndex, category }) {
  // Insert category if not exists
  await pool.query(`
    INSERT IGNORE INTO categories (name) VALUES (?)
  `, [category]);

  // Insert question
  const answersJson = JSON.stringify(answers);
  await pool.query(`
    INSERT INTO questions (question, answers, correctIndex, category)
    VALUES (?, ?, ?, ?)
  `, [question, answersJson, correctIndex, category]);
}

start();
