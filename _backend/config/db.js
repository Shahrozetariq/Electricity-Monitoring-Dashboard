const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: "",
    user: "",
    password: "",
    database: "",
    port: ,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
    } else {
        console.log("Database connection successful!");
        connection.release(); // Release the connection back to the pool
    }
});
// Export the pool for querying
module.exports = pool.promise();  // Using promise-based queries
