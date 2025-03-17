// import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import { Grid, Divider } from '@mui/material';


import { _tasks, _posts, _timeline } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

// import { ElectricityFlowDiagram } from './overview-power-supply';
import Flow from './turboflow/Flow';

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


// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  return (
    <DashboardContent maxWidth="xl" >
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Hi, Welcome back 👋
      </Typography>


      <Flow />

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



        <Grid xs={12} md={6} lg={4} >
          <AnalyticsCurrentVisits
            title="Consumption"
            chart={{
              series: [
                { label: 'Tenants', value: 3500 },
                { label: 'Common Area', value: 2500 },

              ],
            }}
          />
        </Grid>

        <Grid xs={12} md={8} lg={8}>
          <AnalyticsWebsiteVisits
            title="Delta Analytics"
            subheader="(+43%) than last year"
            chart={{
              categories: ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'],
              series: [
                { name: 'Building', data: [43, 33, 22, 37, 67, 68, 37, 24, 55] },
                { name: 'HVAC', data: [51, 70, 47, 67, 40, 37, 24, 70, 24] },
                { name: 'Combined', data: [] },
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
            chart={{
              categories: ['Company 1', 'Company 2', 'Company 3', 'Company 4', 'Company 5'],
              series: [
                { name: 'Building', data: [44, 55, 41, 64, 22] },
                { name: 'HVAC', data: [53, 32, 33, 52, 13] },
              ],
            }}
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
