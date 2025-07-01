const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Server } = require('socket.io');
const http = require('http');

require('dotenv').config();

const meterRoutes = require('./routes/meters');
const blockRoutes = require('./routes/blocks');
const companyRoutes = require('./routes/companies');
const energySourceRoutes = require('./routes/energy_sources');
//Giving access to the data for GRID,SOLAR and GENERATOR meters
const sourceTypeConsumptionRoutes = require("./routes/sourceTypeConsumption");
const deltaConsumption = require("./routes/deltaConsumption");
const metertypeRoutes = require('./routes/metertypeRoutes');
const commonAreaUsageRoutes = require('./routes/commonAreaUsage');
// company consumption
const companyUsageRoutes = require('./routes/companyUsageRoutes');
//Service to get MDI of blocks
const blockService = require('./services/blockService');



const app = express();
app.use(cors());
app.use(bodyParser.json());




app.use('/api/meters', meterRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/energy_sources', energySourceRoutes);
app.use("/api/sourcetypeconsumption", sourceTypeConsumptionRoutes);
app.use("/api/delta_consumption", deltaConsumption);
app.use('/api/metertype', metertypeRoutes);
//api for common area usage
app.use('/api/common_area_usage', commonAreaUsageRoutes);

app.use('/api/company_usage', companyUsageRoutes);


app.get('/api/block-demand', async (req, res) => {
  try {
    const { start, end, interval } = req.query;

    // Validate required parameters
    if (!start || !end || !interval) {
      return res.status(400).json({
        error: 'Missing required parameters: start, end, interval'
      });
    }

    const data = await blockService.getBlockDemandByRange(start, end, interval);
    res.json(data);

  } catch (err) {
    console.error('Error fetching block demand:', err);
    res.status(500).json({
      error: 'Failed to fetch block demand',
      details: err.message
    });
  }
});

const server = http.createServer(app);
// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://182.180.69.71:3000', // Specific origin instead of *
    methods: ['GET', 'POST']
  }
});



// WebSocket for block demand
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  let intervalHandle = null;

  socket.on('request_block_data', async ({ start, end, interval, refreshRate }) => {
    if (intervalHandle) clearInterval(intervalHandle);

    const sendData = async () => {
      try {
        const data = await blockService.getBlockDemandByRange(start, end, interval);
        socket.emit('block_data', data);
      } catch (err) {
        console.error('Error fetching block data:', err);
        socket.emit('error', err.message);
      }
    };

    await sendData(); // initial send
    intervalHandle = setInterval(sendData, refreshRate || 5 * 60 * 1000); // default: 5min
  });

  socket.on('disconnect', () => {
    if (intervalHandle) clearInterval(intervalHandle);
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
// Use server.listen instead of app.listen
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO available at ws://localhost:${PORT}`);
});

