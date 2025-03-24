const mysql = require('mysql2/promise');

let pool;

async function getDB() {
  if (!pool) {
    pool = await mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'questionsdb',
      waitForConnections: true,
      connectionLimit: 10
    });
    console.log('[Question] Connected to MySQL');
  }
  return pool;
}

module.exports = { getDB };
