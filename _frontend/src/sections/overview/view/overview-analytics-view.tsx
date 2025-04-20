// import Grid from '@mui/material/Unstable_Grid2';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { Grid, Divider } from '@mui/material';


import { _tasks, _posts, _timeline } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

// import { ElectricityFlowDiagram } from './overview-power-supply';
// import Flow from './turboflow/Flow';

import GenerationMixChart from '../analytics-generation-mix'
import GenerationTypeChart from '../analytics-generation-type'
import ConsumptionMixChart from '../analytics-consumption-delta'
import { AnalyticsNews } from '../analytics-news';
import { AnalyticsTasks } from '../analytics-tasks';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsOrderTimeline } from '../analytics-order-timeline';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsWidgetSummary } from '../analytics-widget-summary';
import { AnalyticsTrafficBySite } from '../analytics-traffic-by-site';
import { AnalyticsCurrentSubject } from '../analytics-current-subject';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';
import EnergyFlowGraph from '../EnergyFlowGraph';


// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {

  const [energyData, setEnergyData] = useState([]);
  const [chartData, setChartData] = useState({
    categories: [],
    series: [
      { name: 'Utility', data: [] },
      { name: 'HVAC', data: [] }, // Replace with real HVAC data if available
    ],
  });

  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/common_area_usage');
        setEnergyData(response.data);
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };
    axios.get('http://localhost:5000/api/company_usage')
      .then((response) => {
        const data = response.data;

        // Sort by total_consumption and get top 5
        const topFive = data
          .sort((a, b) => parseFloat(b.total_consumption) - parseFloat(a.total_consumption))
          .slice(0, 5);

        const categories = topFive.map(company => company.company_name);
        const utilityData = topFive.map(company => parseFloat(company.utility_consumption));
        const hvacData = topFive.map(company => parseFloat(company.hvac_consumption));

        setChartData({
          categories,
          series: [
            { name: 'Utility', data: utilityData },
            { name: 'HVAC', data: hvacData },
          ],
        });
      })
      .catch((error) => {
        console.error('Error fetching company usage data:', error);
      });
    fetchEnergyData();
  }, []);

  const categories = energyData.map(item => item.block_name);
  const buildingData = energyData.map(item => parseFloat(item.tenant_utility || 0));
  const hvacData = energyData.map(item => parseFloat(item.tenant_hvac || 0));


  const blockUtilityData = energyData.map(item => parseFloat(item.block_utility || 0));
  const blockHvacData = energyData.map(item => parseFloat(item.block_hvac || 0));
  const tenantUtilityData = energyData.map(item => parseFloat(item.tenant_utility || 0));
  const tenantHvacData = energyData.map(item => parseFloat(item.tenant_hvac || 0));
  const totalTenants = buildingData.reduce((acc, val) => acc + val, 0);
  const totalCommonArea = hvacData.reduce((acc, val) => acc + val, 0);

  return (
    <DashboardContent maxWidth="xl" >
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>
      <EnergyFlowGraph />

      {/* <Flow /> */}

      <Divider
        sx={{
          my: 4, // Margin top and bottom
          bborderColor: 'grey.500', // Use theme primary color
          borderWidth: 2, // Thicker line
        }}
      />
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>

        <Grid item xs={2} sm={4} md={4} >
          <GenerationMixChart />
        </Grid>
        <Grid item xs={2} sm={4} md={4} >
          <GenerationTypeChart />
        </Grid>

        <Grid item xs={2} sm={4} md={4} >
          <ConsumptionMixChart />
        </Grid>

      </Grid>
      <Divider
        sx={{
          my: 4, // Margin top and bottom
          borderColor: 'grey.500', // Use theme primary color
          borderWidth: 2, // Thicker line
        }}
      />
      {/* <ElectricityFlowDiagram /> */}

      <Grid container spacing={3}>
        <Grid xs={12} sm={6} md={3} />

        <Grid xs={12} sm={6} md={3} />

        <Grid xs={12} sm={6} md={3} />


        <Grid xs={12} sm={6} md={3} />



        <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentVisits
            title="Consumption"
            chart={{
              series: [
                { label: 'Tenants', value: totalTenants },
                { label: 'Common Area', value: totalCommonArea },
              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={8} lg={8}>
          <AnalyticsWebsiteVisits
            title="Delta Analytics"
            subheader="(Real-time data)"
            chart={{
              categories, // Categories are the block names (Delta 1, Delta 2, etc.)
              series: [
                { name: 'Block Utility', data: blockUtilityData },
                { name: 'Block HVAC', data: blockHvacData },
                { name: 'Tenant Utility', data: tenantUtilityData },
                { name: 'Tenant HVAC', data: tenantHvacData },
              ],
            }}
          />
        </Grid>
        <Divider
          sx={{
            my: 4, // Margin top and bottom
            borderColor: 'grey.500', // Use theme primary color
            borderWidth: 2, // Thicker line
            width: '100%', // Full width
          }}
        />
        <Grid xs={12} md={6} lg={12}>
          <AnalyticsConversionRates
            title="Top Five Companies (Current Month)"
            subheader="(+43%) than last year"
            chart={chartData}
          />
        </Grid>

        {/* <Grid xs={12} md={6} lg={4}>
          <AnalyticsCurrentSubject
            title="Current subject"
            chart={{
              categories: ['English', 'History', 'Physics', 'Geography', 'Chinese', 'Math'],
              series: [
                { name: 'Series 1', data: [80, 50, 30, 40, 100, 20] },
                { name: 'Series 2', data: [20, 30, 40, 80, 20, 80] },
                { name: 'Series 3', data: [44, 76, 78, 13, 43, 10] },
              ],
            }}
          />
        </Grid> */}

        <Grid xs={12} md={6} lg={8}>
          {/* <AnalyticsNews title="News" list={_posts.slice(0, 5)} /> */}
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          {/* <AnalyticsOrderTimeline title="Order timeline" list={_timeline} /> */}
        </Grid>

        <Grid xs={12} md={6} lg={4}>
          {/* <AnalyticsTrafficBySite
            title="Traffic by site"
            list={[
              { value: 'facebook', label: 'Facebook', total: 323234 },
              { value: 'google', label: 'Google', total: 341212 },
              { value: 'linkedin', label: 'Linkedin', total: 411213 },
              { value: 'twitter', label: 'Twitter', total: 443232 },
            ]}
          /> */}
        </Grid>

        <Grid xs={12} md={6} lg={8}>
          {/* <AnalyticsTasks title="Tasks" list={_tasks} /> */}
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
