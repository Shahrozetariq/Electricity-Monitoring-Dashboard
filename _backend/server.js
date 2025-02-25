const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const meterRoutes = require('./routes/meters');
const blockRoutes = require('./routes/blocks');
const companyRoutes = require('./routes/companies');
const energySourceRoutes = require('./routes/energy_sources');



const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/meters', meterRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/energy_sources', energySourceRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

