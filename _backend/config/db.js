const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: "103.164.9.68",
    user: "adminems",
    password: "Delta@1122",
    database: "emsdb",
    port: 3306,
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