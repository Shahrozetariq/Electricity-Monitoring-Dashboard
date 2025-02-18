// db/connection.js
const mysql = require('mysql2');

// Create a connection to the database
const db = mysql.createConnection({
  host: '',
  user: '',  // Your MySQL username
  password: '',  // Your MySQL password
  database: ''  // Your MySQL database name
});

// Test the connection
db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    return;
  }
  console.log('Connected to MySQL database.');
});

module.exports = db;
