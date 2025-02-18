// controllers/websocketController.js
const db = require('../db/connection');

const setupWebSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Emit latest meter reading every 5 seconds
    setInterval(() => {
      db.query('SELECT * FROM Meter_readings ORDER BY _TIMESTAMP DESC LIMIT 1', (err, results) => {
        if (err) {
          console.error(err.message);
        } else {
          socket.emit('new-reading', results[0]); // Emit latest meter reading to client
        }
      });
    }, 5000); // Send updates every 5 seconds

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });
};

module.exports = {
  setupWebSocket
};
