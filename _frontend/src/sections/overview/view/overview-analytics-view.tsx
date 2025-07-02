import { useEffect, useState } from 'react';
import axios from 'axios';
import Typography from '@mui/material/Typography';
import { Grid, Divider } from '@mui/material';

import { DashboardContent } from 'src/layouts/dashboard';

import GenerationMixChart from '../analytics-generation-mix';
import GenerationTypeChart from '../analytics-generation-type';
import ConsumptionMixChart from '../analytics-consumption-delta';
import { AnalyticsCurrentVisits } from '../analytics-current-visits';
import { AnalyticsWebsiteVisits } from '../analytics-website-visits';
import { AnalyticsConversionRates } from '../analytics-conversion-rates';

// Define the expected shape of energy data
interface EnergyDataItem {
  block_name: string;
  tenant_utility?: string;
  tenant_hvac?: string;
  block_utility?: string;
  block_hvac?: string;
}

export function OverviewAnalyticsView() {
  const [energyData, setEnergyData] = useState<EnergyDataItem[]>([]);
  const [chartData, setChartData] = useState({
    categories: [] as string[],
    series: [
      { name: 'Utility', data: [] as number[] },
      { name: 'HVAC', data: [] as number[] },
    ],
  });

  useEffect(() => {
    const fetchEnergyData = async () => {
      try {
        const response = await axios.get('http://182.180.69.171/bck//api/common_area_usage');
        setEnergyData(response.data);
      } catch (error) {
        console.error('Error fetching energy data:', error);
      }
    };

    axios.get('http://182.180.69.171/bck//api/company_usage')
      .then((response) => {
        const data = response.data;

        const topFive = data
          .sort((a: any, b: any) => parseFloat(b.total_consumption) - parseFloat(a.total_consumption))
          .slice(0, 5);

        const categories = topFive.map((company: any) => company.company_name);
        const utilityData = topFive.map((company: any) => parseFloat(company.utility_consumption));
        const hvacData = topFive.map((company: any) => parseFloat(company.hvac_consumption));

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
  const buildingData = energyData.map(item => parseFloat(item.tenant_utility || '0'));
  const hvacData = energyData.map(item => parseFloat(item.tenant_hvac || '0'));

  const blockUtilityData = energyData.map(item => parseFloat(item.block_utility || '0'));
  const blockHvacData = energyData.map(item => parseFloat(item.block_hvac || '0'));
  const tenantUtilityData = energyData.map(item => parseFloat(item.tenant_utility || '0'));
  const tenantHvacData = energyData.map(item => parseFloat(item.tenant_hvac || '0'));
  const totalTenants = buildingData.reduce((acc, val) => acc + val, 0);
  const totalCommonArea = hvacData.reduce((acc, val) => acc + val, 0);

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>

      <Divider sx={{ my: 4, borderColor: 'grey.500', borderWidth: 2 }} />

      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        <Grid item xs={2} sm={4} md={4}>
          <GenerationMixChart />
        </Grid>
        <Grid item xs={2} sm={4} md={4}>
          <GenerationTypeChart />
        </Grid>
        <Grid item xs={2} sm={4} md={4}>
          <ConsumptionMixChart />
        </Grid>
      </Grid>

      <Divider sx={{ my: 4, borderColor: 'grey.500', borderWidth: 2 }} />

      <Grid container spacing={3}>
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
              categories,
              series: [
                { name: 'Block Utility', data: blockUtilityData },
                { name: 'Block HVAC', data: blockHvacData },
                { name: 'Tenant Utility', data: tenantUtilityData },
                { name: 'Tenant HVAC', data: tenantHvacData },
              ],
            }}
          />
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'grey.500', borderWidth: 2, width: '100%' }} />

        <Grid xs={12} md={6} lg={12}>
          <AnalyticsConversionRates
            title="Top Five Companies (Current Month)"
            subheader="(+43%) than last year"
            chart={chartData}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
export default OverviewAnalyticsView;