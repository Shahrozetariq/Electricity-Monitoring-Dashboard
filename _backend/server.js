const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const meterRoutes = require('./routes/meters');
const blockRoutes = require('./routes/blocks');
const companyRoutes = require('./routes/companies');
const energySourceRoutes = require('./routes/energy_sources');
//Giving access to the data for GRID,SOLAR and GENERATOR meters
const sourceTypeConsumptionRoutes = require("./routes/sourceTypeConsumption");
const deltaConsumption = require("./routes/deltaConsumption");
const metertypeRoutes = require('./routes/metertypeRoutes');


const app = express();
app.use(cors());
app.use(bodyParser.json());


app.use("/api/sourcetypeconsumption", sourceTypeConsumptionRoutes);


app.use('/api/meters', meterRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/energy_sources', energySourceRoutes);
app.use("/api/sourcetypeconsumption", sourceTypeConsumptionRoutes);
app.use("/api/delta_consumption", deltaConsumption);
app.use('/api/metertype', metertypeRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

