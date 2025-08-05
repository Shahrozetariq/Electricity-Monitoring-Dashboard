import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow
} from '@coreui/react';
import {
    Typography
} from '@mui/material';
import Chart, {
    ArgumentAxis,
    Label as ChartLabel,
    CommonSeriesSettings,
    Grid,
    Legend,
    MinorGrid,
    Series,
    Tooltip,
    Export,
    ZoomAndPan,
    ScrollBar,

    ValueAxis
} from 'devextreme-react/chart';
import 'devextreme/dist/css/dx.light.css';


const generateMockChartData = () => {
    const data = [];
    // Reduced minute interval for finer granularity, contributing to smoother curves
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 5) { // Changed from 15 to 5 minutes interval
            const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            let PV = 0;
            let Inverter = 0;
            let EPSPower = 0;
            let BatteryCharging = 0;
            let BatterySOC = 0;
            let Export = 0;
            let ToHome = 0;

            const timeInHours = hour + minute / 60;

            // Simulate solar production during day hours (e.g., 6:00 to 18:00)
            if (timeInHours >= 6 && timeInHours <= 18) {
                const peakHour = 12; // Peak production around 12 PM
                const spread = 6; // How wide the production curve is
                const intensity = 300000; // Max production in W

                // Using a Gaussian-like function for smoother peak
                PV = intensity * Math.exp(-Math.pow(timeInHours - peakHour, 2) / (2 * Math.pow(spread / 4, 2)));
                PV = Math.max(0, PV + (Math.random() - 0.5) * 5000); // Reduced randomness
                Inverter = PV * 0.95; // 95% efficiency
            }

            // Simulate home consumption (higher during peak usage times)
            if (timeInHours >= 7 && timeInHours < 9) { // Morning peak
                ToHome = 15000 + (Math.random() - 0.5) * 5000; // Reduced randomness
            } else if (timeInHours >= 17 && timeInHours < 22) { // Evening peak
                ToHome = 20000 + (Math.random() - 0.5) * 7500; // Reduced randomness
            } else {
                ToHome = 5000 + (Math.random() - 0.5) * 2500; // Base consumption, reduced randomness
            }
            ToHome = Math.max(0, ToHome); // Ensure consumption is not negative

            // Calculate Battery Charging and Export based on PV and ToHome
            const netProduction = Inverter - ToHome;

            if (netProduction > 0) {
                // Excess production: charge battery first, then export
                BatteryCharging = Math.min(netProduction, 15000); // Max battery charge rate
                Export = netProduction - BatteryCharging;
                if (Export < 0) Export = 0; // Ensure export is not negative
            } else {
                // Deficit: no battery charging, no export
                BatteryCharging = 0;
                Export = 0;
            }

            // Simulate Battery SOC (more dynamic and smoother transitions)
            let currentSOC = data.length > 0 ? data[data.length - 1].BatterySOC : 80; // Start at 80%

            if (BatteryCharging > 0) {
                currentSOC += (BatteryCharging / 100000) * 0.1; // Charging effect, scaled and smoothed
            } else if (netProduction < 0) {
                // Discharging if there's a deficit
                currentSOC += (netProduction / 100000) * 0.1; // Discharging effect, scaled and smoothed
            } else {
                // Slight natural discharge if no production/consumption activity
                currentSOC -= 0.05;
            }

            // Keep SOC within 0-100 bounds
            BatterySOC = Math.max(0, Math.min(100, currentSOC + (Math.random() - 0.5) * 0.5)); // Very small random fluctuation

            data.push({
                time,
                PV: Math.round(PV),
                Inverter: Math.round(Inverter),
                EPSPower: Math.round(EPSPower),
                BatteryCharging: Math.round(BatteryCharging),
                BatterySOC: Math.round(BatterySOC),
                Export: Math.round(Export),
                ToHome: Math.round(ToHome),
            });
        }
    }
    return data;
};


const mockChartData = generateMockChartData();

// Custom tooltip for the chart


function onLegendClick({ target: series }) {
    if (series.isVisible()) {
        series.hide();
    } else {
        series.show();
    }
}




const EnergyAnalysis = () => {
    return (

        <CCard className="p-4">
            <Typography variant="h6" gutterBottom>
                Energy analysis
            </Typography>
            {/* KPI Cards */}


            <CRow className="mt-4">
                {/* Yield */}
                <CCol md={6}>
                    <CCard>
                        <CCardBody>
                            <div className="d-flex align-items-center mb-3">
                                <img src="./yield.png" alt="Yield" style={{ width: 20, marginRight: 8 }} />
                                <h6 className="mb-0">Yield</h6>
                            </div>
                            <CRow className="align-items-center">
                                <CCol xs={4}>
                                    <div
                                        style={{
                                            width: 120,
                                            height: 120,
                                            borderRadius: '50%',
                                            border: '10px solid #b2ebe5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: 22,
                                            color: '#1e1e2d',
                                        }}
                                    >
                                        <div style={{ textAlign: 'center' }}>
                                            484.70
                                            <div style={{ fontSize: 12, color: '#777' }}>kWh</div>
                                        </div>
                                    </div>
                                </CCol>
                                <CCol xs={8}>
                                    <div className="mb-2 d-flex align-items-center">
                                        <span style={{ backgroundColor: '#9ae3dc', width: 10, height: 10, borderRadius: '50%', marginRight: 8 }}></span>
                                        System to Home (100%)
                                    </div>
                                    <strong>484.70 kWh</strong>

                                    <div className="mt-3 d-flex align-items-center">
                                        <span style={{ backgroundColor: '#d4edea', width: 10, height: 10, borderRadius: '50%', marginRight: 8 }}></span>
                                        System to Grid (0%)
                                    </div>
                                    <strong>0.00 kWh</strong>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>
                </CCol>

                {/* Consumed */}
                <CCol md={6}>
                    <CCard>
                        <CCardBody>
                            <div className="d-flex align-items-center mb-3">
                                <img src="./consumed.png" alt="Consumed" style={{ width: 20, marginRight: 8 }} />
                                <h6 className="mb-0">Consumed</h6>
                            </div>
                            <CRow className="align-items-center">
                                <CCol xs={4}>
                                    <div
                                        style={{
                                            width: 120,
                                            height: 120,
                                            borderRadius: '50%',
                                            border: '10px solid #ffe680',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 700,
                                            fontSize: 22,
                                            color: '#1e1e2d',
                                        }}
                                    >
                                        <div style={{ textAlign: 'center' }}>
                                            484.70
                                            <div style={{ fontSize: 12, color: '#777' }}>kWh</div>
                                        </div>
                                    </div>
                                </CCol>
                                <CCol xs={8}>
                                    <div className="mb-2 d-flex align-items-center">
                                        <span style={{ backgroundColor: '#fbc02d', width: 10, height: 10, borderRadius: '50%', marginRight: 8 }}></span>
                                        From System (100%)
                                    </div>
                                    <strong>484.70 kWh</strong>

                                    <div className="mt-3 d-flex align-items-center">
                                        <span style={{ backgroundColor: '#eee', width: 10, height: 10, borderRadius: '50%', marginRight: 8 }}></span>
                                        From Grid (0%)
                                    </div>
                                    <strong>0.00 kWh</strong>
                                </CCol>
                            </CRow>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            <CRow>
                <div className="min-h-screen bg-gray-100 p-4 font-inter">
                    <div className="max-w-7xl mx-auto">

                        <Chart id="power-flow-chart" dataSource={mockChartData} onLegendClick={onLegendClick} size={{ height: 450 }}>
                            {/* Time axis */}
                            <CommonSeriesSettings argumentField="time" type="splinearea" selectionMode="allArgumentPoints" /> {/* Changed to splinearea for smooth curves */}
                            <ArgumentAxis tickInterval={12} />

                            {/* Left Y-axis: Power (W) */}
                            <ValueAxis title="W" />

                            {/* Right Y-axis: SOC (%) */}
                            <ValueAxis
                                name="socAxis"
                                position="right"
                                title="SOC(%)"
                                min={0}
                                max={100}
                                tickInterval={20}
                                label={{ customizeText: (arg) => `${arg.value}%` }}
                            />

                            {/* Smooth Area Charts */}
                            <Series
                                valueField="ToHome"
                                name="To Home"
                                argumentField="time"
                                type="splinearea"
                                color="#81C784"
                            />
                            <Series
                                valueField="Export"
                                name="Export"
                                argumentField="time"
                                type="splinearea"
                                color="#4FC3F7"
                            />
                            <Series
                                valueField="Inverter"
                                name="Inverter"
                                argumentField="time"
                                type="splinearea"
                                color="#90A4AE"
                            />
                            <Series
                                valueField="BatteryCharging"
                                name="Battery Charging"
                                argumentField="time"
                                type="splinearea"
                                color="#B0BEC5"
                            />

                            {/* Battery SOC Line (Subtle Blue) */}
                            <Series
                                valueField="BatterySOC"
                                name="Battery SOC"
                                argumentField="time"
                                type="spline"
                                axis="socAxis"
                                color="#607D8B"
                            />

                            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
                            <Tooltip enabled={true} shared={true} />
                            <Export enabled={true} />
                            {/* <ZoomAndPan argumentAxis="both" /> */}
                            {/* <ScrollBar visible={true} /> */}
                        </Chart>


                    </div>
                </div>

            </CRow>
            {/* <Box mt={5}>
                <Chart
                    dataSource={sampleData}
                    title=""
                    palette="Soft"
                    id="energyChart"
                >
                    <CommonSeriesSettings argumentField="time" type="area" opacity={0.6} />
                    <Series valueField="pv" name="PV" />
                    <Series valueField="toHome" name="To Home" color="#4caf50" />
                    <ArgumentAxis title="" />
                    <ValueAxis title="W" />
                    <Legend verticalAlignment="bottom" horizontalAlignment="center" />
                    <Tooltip enabled={true} />
                    <ZoomAndPan argumentAxis="both" />
                    <ScrollBar visible={true} />
                    <Export enabled={true} />
                </Chart>
            </Box> */}
        </CCard>
    )
}

export default EnergyAnalysis
