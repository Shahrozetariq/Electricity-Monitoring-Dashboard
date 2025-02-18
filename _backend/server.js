const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const routes = require("./routes");
const { handleWebSocket } = require("./controllers/websocketController");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this for security in production
  },
});

app.use(express.json());
app.use("/api", routes);

io.on("connection", (socket) => {
  console.log("New WebSocket connection");
  handleWebSocket(socket);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
