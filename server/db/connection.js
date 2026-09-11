const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ DB connection failed:', err.message);
  } else {
    console.log('✅ MySQL pool connected!');
    connection.release();
  }
});


module.exports = db;
