import React, { useState, useEffect } from 'react';
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CContainer,
    CRow,
    CSpinner,
    CAlert,
    CBadge,
    CButton,
    CForm,
    CFormLabel,
    CFormSelect,
    CInputGroup,
    CInputGroupText,
    CFormInput,
    CListGroup,
    CListGroupItem,
    CModal,
    CModalBody,
    CModalHeader,
    CModalTitle,
    CModalFooter,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell
} from '@coreui/react';
import {
    cilCalendar,
    cilBolt,
    cilSpeedometer,
    cilChart,
    cilPrint,
    cilCloudDownload,
    cilCheckCircle,
    cilXCircle,
    cilHome,
    cilIndustry
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import DataGrid, {
    Column,
    Paging,
    Pager,
    HeaderFilter,
    FilterRow,
    Export,
    Toolbar,
    Item,
    Summary,
    TotalItem
} from 'devextreme-react/data-grid';
import Chart, {
    Series,
    ArgumentAxis,
    ValueAxis,
    Legend,
    Title,
    Tooltip,
    Grid,
    CommonSeriesSettings
} from 'devextreme-react/chart';
import PieChart, {
    Series as PieSeries,
    Label,
    Connector,
    Size,
    Export as PieExport
} from 'devextreme-react/pie-chart';

const ElectricityBillPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deviceNames, setDeviceNames] = useState([]);
    const [selectedDeviceName, setSelectedDeviceName] = useState('');
    const [availableMeters, setAvailableMeters] = useState([]);
    const [selectedMeters, setSelectedMeters] = useState([]);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [meterData, setMeterData] = useState([]);
    const [aggregatedData, setAggregatedData] = useState({});
    const [billModal, setBillModal] = useState(false);
    const [billData, setBillData] = useState(null);

    // Sample electricity rates (you can make this configurable)
    const electricityRates = {
        baseRate: 0.12, // per kWh
        peakRate: 0.18,
        offPeakRate: 0.08,
        demandCharge: 15.0, // per kW
        fixedCharge: 25.0 // monthly
    };


    // Fetch unique device names
    const fetchDeviceNames = async () => {
        try {
            setLoading(true);
            // This would be your actual API endpoint
            const response = await fetch('/api/devices/names');
            if (response.ok) {
                const data = await response.json();
                setDeviceNames(data);
            }
        } catch (err) {
            console.error('Error fetching device names:', err);
            // Mock data for demonstration
            setDeviceNames(['Solar Panel A', 'Grid Connection', 'Block A', 'Block B', 'Generator', 'Main Supply']);
        } finally {
            setLoading(false);
        }
    };

    // Fetch meters for selected device name
    const fetchMetersForDevice = async (deviceName) => {
        try {
            setLoading(true);
            // This would be your actual API endpoint
            const response = await fetch(`/api/devices/${deviceName}/meters`);
            if (response.ok) {
                const data = await response.json();
                setAvailableMeters(data);
            }
        } catch (err) {
            console.error('Error fetching meters:', err);
            // Mock data for demonstration
            const mockMeters = [
                { dev_eui: 'A1B2C3D4E5F6', device_name: deviceName, type: 'ADW300' },
                { dev_eui: 'B2C3D4E5F6A1', device_name: deviceName, type: 'ADW310' },
                { dev_eui: 'C3D4E5F6A1B2', device_name: deviceName, type: 'DTSD4S' }
            ];
            setAvailableMeters(mockMeters);
        } finally {
            setLoading(false);
        }
    };

    // Fetch meter data for selected meters and date range
    const fetchMeterData = async () => {
        if (selectedMeters.length === 0) return;

        try {
            setLoading(true);
            const requests = selectedMeters.map(meter =>
                fetch(`/api/meters/${meter.dev_eui}/data?start=${dateRange.startDate}&end=${dateRange.endDate}`)
            );

            // Mock data generation for demonstration
            const mockData = generateMockMeterData();
            setMeterData(mockData);
            calculateAggregatedData(mockData);

        } catch (err) {
            console.error('Error fetching meter data:', err);
            setError('Failed to fetch meter data');
        } finally {
            setLoading(false);
        }
    };

    // Generate mock meter data
    const generateMockMeterData = () => {
        const data = [];
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        for (let meter of selectedMeters) {
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const baseConsumption = Math.random() * 100 + 50;
                data.push({
                    dev_eui: meter.dev_eui,
                    device_name: meter.device_name,
                    date: new Date(d).toISOString().split('T')[0],
                    voltage: 220 + (Math.random() - 0.5) * 20,
                    current: baseConsumption / 220,
                    power: baseConsumption,
                    energy_import: baseConsumption * 24 + Math.random() * 100,
                    energy_export: Math.random() * 50,
                    max_demand: baseConsumption * 1.2,
                    timestamp: new Date(d).toISOString()
                });
            }
        }
        return data;
    };

    // Calculate aggregated data for charts and billing
    const calculateAggregatedData = (data) => {
        const aggregated = {
            totalConsumption: 0,
            totalExport: 0,
            maxDemand: 0,
            dailyUsage: {},
            meterSummary: {},
            last6Months: {}
        };

        data.forEach(record => {
            // Total consumption and export
            aggregated.totalConsumption += record.energy_import || 0;
            aggregated.totalExport += record.energy_export || 0;

            // Max demand
            if (record.max_demand > aggregated.maxDemand) {
                aggregated.maxDemand = record.max_demand;
            }

            // Daily usage
            if (!aggregated.dailyUsage[record.date]) {
                aggregated.dailyUsage[record.date] = {
                    date: record.date,
                    consumption: 0,
                    export: 0,
                    demand: 0
                };
            }
            aggregated.dailyUsage[record.date].consumption += record.energy_import || 0;
            aggregated.dailyUsage[record.date].export += record.energy_export || 0;
            aggregated.dailyUsage[record.date].demand = Math.max(
                aggregated.dailyUsage[record.date].demand,
                record.max_demand || 0
            );

            // Meter summary
            if (!aggregated.meterSummary[record.dev_eui]) {
                aggregated.meterSummary[record.dev_eui] = {
                    dev_eui: record.dev_eui,
                    device_name: record.device_name,
                    consumption: 0,
                    export: 0,
                    maxDemand: 0
                };
            }
            aggregated.meterSummary[record.dev_eui].consumption += record.energy_import || 0;
            aggregated.meterSummary[record.dev_eui].export += record.energy_export || 0;
            aggregated.meterSummary[record.dev_eui].maxDemand = Math.max(
                aggregated.meterSummary[record.dev_eui].maxDemand,
                record.max_demand || 0
            );
        });

        // Generate last 6 months data for billing
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = date.toISOString().slice(0, 7);

            aggregated.last6Months[monthKey] = {
                month: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                consumption: Math.random() * 1000 + 500,
                demand: Math.random() * 100 + 50,
                cost: 0
            };
        }

        // Calculate costs
        Object.keys(aggregated.last6Months).forEach(month => {
            const data = aggregated.last6Months[month];
            data.cost = calculateElectricityCost(data.consumption, data.demand);
        });

        setAggregatedData(aggregated);
    };

    // Calculate electricity cost
    const calculateElectricityCost = (consumption, demand) => {
        const energyCost = consumption * electricityRates.baseRate;
        const demandCost = demand * electricityRates.demandCharge;
        return energyCost + demandCost + electricityRates.fixedCharge;
    };

    // Generate PDF bill
    const generatePDFBill = () => {
        const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const billData = {
            customerInfo: {
                name: 'Customer Name',
                address: '123 Main Street, City, State 12345',
                accountNumber: 'ACC-' + Math.random().toString(36).substring(7).toUpperCase(),
                meterNumbers: selectedMeters.map(m => m.dev_eui).join(', ')
            },
            billingPeriod: {
                current: currentMonth,
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            },
            usage: aggregatedData.last6Months,
            currentMonthDetails: {
                consumption: aggregatedData.totalConsumption,
                demand: aggregatedData.maxDemand,
                cost: calculateElectricityCost(aggregatedData.totalConsumption, aggregatedData.maxDemand)
            },
            rates: electricityRates
        };

        setBillData(billData);
        setBillModal(true);
    };

    useEffect(() => {
        fetchDeviceNames();
    }, []);

    useEffect(() => {
        if (selectedDeviceName) {
            fetchMetersForDevice(selectedDeviceName);
            setSelectedMeters([]);
        }
    }, [selectedDeviceName]);

    useEffect(() => {
        if (selectedMeters.length > 0) {
            fetchMeterData();
        }
    }, [selectedMeters, dateRange]);

    const handleMeterToggle = (meter) => {
        setSelectedMeters(prev => {
            const exists = prev.find(m => m.dev_eui === meter.dev_eui);
            if (exists) {
                return prev.filter(m => m.dev_eui !== meter.dev_eui);
            } else {
                return [...prev, meter];
            }
        });
    };

    const dailyChartData = Object.values(aggregatedData.dailyUsage || {});
    const meterSummaryData = Object.values(aggregatedData.meterSummary || {});
    const last6MonthsData = Object.values(aggregatedData.last6Months || {});

    const pieChartPalette = ['#f39c12', '#3498db', '#2ecc71', '#e74c3c', '#9b59b6', '#1abc9c'];

    return (
        <CContainer fluid className="px-4 py-4">
            <CRow className="mb-4">
                <CCol>
                    <h2 className="mb-1">Electricity Bill Management</h2>
                    <p className="text-muted">Select devices, meters, and date range to generate electricity bills</p>
                </CCol>
            </CRow>

            {/* Selection Controls */}
            <CRow className="mb-4">
                <CCol xs={12}>
                    <CCard>
                        <CCardHeader>
                            <h5 className="mb-0">Selection Criteria</h5>
                        </CCardHeader>
                        <CCardBody>
                            <CForm>
                                <CRow className="g-3">
                                    <CCol md={3}>
                                        <CFormLabel>Device Name</CFormLabel>
                                        <CFormSelect
                                            value={selectedDeviceName}
                                            onChange={(e) => setSelectedDeviceName(e.target.value)}
                                        >
                                            <option value="">Select Device</option>
                                            {deviceNames.map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </CFormSelect>
                                    </CCol>
                                    <CCol md={3}>
                                        <CFormLabel>Start Date</CFormLabel>
                                        <CFormInput
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </CCol>
                                    <CCol md={3}>
                                        <CFormLabel>End Date</CFormLabel>
                                        <CFormInput
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                                        />
                                    </CCol>
                                    <CCol md={3} className="d-flex align-items-end">
                                        <CButton
                                            color="primary"
                                            onClick={generatePDFBill}
                                            disabled={selectedMeters.length === 0}
                                            className="w-100"
                                        >
                                            <CIcon icon={cilPrint} className="me-2" />
                                            Generate Bill
                                        </CButton>
                                    </CCol>
                                </CRow>
                            </CForm>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Meter Selection */}
            {availableMeters.length > 0 && (
                <CRow className="mb-4">
                    <CCol xs={12}>
                        <CCard>
                            <CCardHeader>
                                <h5 className="mb-0">Available Meters for {selectedDeviceName}</h5>
                            </CCardHeader>
                            <CCardBody>
                                <CRow>
                                    {availableMeters.map(meter => (
                                        <CCol key={meter.dev_eui} xs={12} md={6} lg={4} className="mb-2">
                                            <CCard
                                                className={`cursor-pointer border ${selectedMeters.find(m => m.dev_eui === meter.dev_eui) ? 'border-primary bg-light' : 'border-secondary'}`}
                                                onClick={() => handleMeterToggle(meter)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <CCardBody className="py-2">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <div>
                                                            <code className="text-primary">{meter.dev_eui}</code>
                                                            <div className="small text-muted">{meter.type}</div>
                                                        </div>
                                                        {selectedMeters.find(m => m.dev_eui === meter.dev_eui) && (
                                                            <CIcon icon={cilCheckCircle} className="text-success" />
                                                        )}
                                                    </div>
                                                </CCardBody>
                                            </CCard>
                                        </CCol>
                                    ))}
                                </CRow>
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            )}

            {/* Summary Cards */}
            {meterData.length > 0 && (
                <CRow className="mb-4">
                    <CCol xs={12} sm={6} lg={3}>
                        <CCard className="bg-primary text-white">
                            <CCardBody className="text-center">
                                <CIcon icon={cilBolt} size="3xl" className="mb-3" />
                                <h4>{aggregatedData.totalConsumption?.toFixed(2) || '0'}</h4>
                                <p className="mb-0">Total Consumption (kWh)</p>
                            </CCardBody>
                        </CCard>
                    </CCol>
                    <CCol xs={12} sm={6} lg={3}>
                        <CCard className="bg-success text-white">
                            <CCardBody className="text-center">
                                <CIcon icon={cilChart} size="3xl" className="mb-3" />
                                <h4>{aggregatedData.totalExport?.toFixed(2) || '0'}</h4>
                                <p className="mb-0">Total Export (kWh)</p>
                            </CCardBody>
                        </CCard>
                    </CCol>
                    <CCol xs={12} sm={6} lg={3}>
                        <CCard className="bg-warning text-white">
                            <CCardBody className="text-center">
                                <CIcon icon={cilSpeedometer} size="3xl" className="mb-3" />
                                <h4>{aggregatedData.maxDemand?.toFixed(2) || '0'}</h4>
                                <p className="mb-0">Max Demand (kW)</p>
                            </CCardBody>
                        </CCard>
                    </CCol>
                    <CCol xs={12} sm={6} lg={3}>
                        <CCard className="bg-info text-white">
                            <CCardBody className="text-center">
                                <CIcon icon={cilHome} size="3xl" className="mb-3" />
                                <h4>{selectedMeters.length}</h4>
                                <p className="mb-0">Selected Meters</p>
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            )}

            {/* Charts */}
            {meterData.length > 0 && (
                <CRow className="mb-4">
                    <CCol xs={12} lg={8}>
                        <CCard>
                            <CCardHeader>
                                <h5 className="mb-0">Daily Usage Trend</h5>
                            </CCardHeader>
                            <CCardBody>
                                <Chart dataSource={dailyChartData} height={350}>
                                    <Series
                                        valueField="consumption"
                                        argumentField="date"
                                        name="Consumption (kWh)"
                                        type="area"
                                        color="#3498db"
                                    />
                                    <Series
                                        valueField="export"
                                        argumentField="date"
                                        name="Export (kWh)"
                                        type="area"
                                        color="#2ecc71"
                                    />
                                    <ArgumentAxis>
                                        <Grid visible />
                                    </ArgumentAxis>
                                    <ValueAxis>
                                        <Grid visible />
                                    </ValueAxis>
                                    <Legend visible />
                                    <Title text="Daily Energy Usage and Export" />
                                    <Tooltip
                                        enabled
                                        contentRender={({ argumentText, valueText, seriesName }) => (
                                            <div className="p-2">
                                                <div><strong>{seriesName}</strong></div>
                                                <div>Date: {argumentText}</div>
                                                <div>Value: {parseFloat(valueText).toFixed(2)} kWh</div>
                                            </div>
                                        )}
                                    />
                                </Chart>
                            </CCardBody>
                        </CCard>
                    </CCol>
                    <CCol xs={12} lg={4}>
                        <CCard>
                            <CCardHeader>
                                <h5 className="mb-0">Meter Distribution</h5>
                            </CCardHeader>
                            <CCardBody>
                                {meterSummaryData.length > 0 ? (
                                    <PieChart dataSource={meterSummaryData} height={350} palette={pieChartPalette}>
                                        <PieSeries
                                            argumentField="dev_eui"
                                            valueField="consumption"
                                        >
                                            <Label
                                                visible
                                                format={{ type: 'fixedPoint', precision: 1 }}
                                                customizeText={(arg) => `${arg.argumentText.slice(-4)}: ${arg.valueText}kWh`}
                                            >
                                                <Connector visible width={2} />
                                            </Label>
                                        </PieSeries>
                                        <Size height={300} />
                                        <PieExport enabled />
                                        <Tooltip
                                            enabled
                                            customizeTooltip={(arg) => ({
                                                text: `${arg.argumentText}: ${arg.valueText} kWh (${arg.percentText})`
                                            })}
                                        />
                                    </PieChart>
                                ) : (
                                    <p className="text-muted text-center">No data available</p>
                                )}
                            </CCardBody>
                        </CCard>
                    </CCol>
                </CRow>
            )}

            {/* Last 6 Months Trend */}
            {last6MonthsData.length > 0 && (
                <CRow className="mb-4">
                    <CCol xs={12}>
                        <CCard>
                            <CCardHeader>
                                <h5 className="mb-0">Last 6 Months Usage & Cost</h5>
                            </CCardHeader>
                            <CCardBody>
                                <Chart dataSource={last6MonthsData} height={350}>
                                    <CommonSeriesSettings type="bar" />
                                    <Series
                                        valueField="consumption"
                                        argumentField="month"
                                        name="Consumption (kWh)"
                                        color="#3498db"
                                        axis="consumption"
                                    />
                                    <Series
                                        valueField="cost"
                                        argumentField="month"
                                        name="Cost (Rs. )"
                                        color="#2ecc71"
                                        axis="cost"
                                    />
                                    <ArgumentAxis>
                                        <Grid visible />
                                    </ArgumentAxis>
                                    <ValueAxis name="consumption" position="left">
                                        <Grid visible />
                                        <Title text="Consumption (kWh)" />
                                    </ValueAxis>
                                    <ValueAxis name="cost" position="right">
                                        <Title text="Cost (Rs. )" />
                                    </ValueAxis>
                                    <Legend visible />
                                    <Title text="Monthly Usage and Cost Analysis" />
                                    <Tooltip
                                        enabled
                                        contentRender={({ argumentText, valueText, seriesName }) => (
                                            <div className="p-2">
                                                <div><strong>{seriesName}</strong></div>
                                                <div>Month: {argumentText}</div>
                                                <div>Value: {parseFloat(valueText).toFixed(2)} {seriesName.includes('Cost') ? 'Rs. ' : 'kWh'}</div>
                                            </div>
                                        )}

                                    />

                                    </Chart>
                                    {/* Selected Meters List */}
                                    {selectedMeters.length > 0 && (
                                        <CRow className="mb-4">
                                            <CCol xs={12}>
                                                <CCard>
                                                    <CCardHeader>
                                                        <h5 className="mb-0">Selected Meters Summary</h5>
                                                    </CCardHeader>
                                                    <CCardBody>
                                                        <DataGrid
                                                            dataSource={meterSummaryData}
                                                            keyExpr="dev_eui"
                                                            allowColumnReordering
                                                            allowColumnResizing
                                                            columnAutoWidth
                                                            showBorders
                                                            rowAlternationEnabled
                                                            hoverStateEnabled
                                                        >
                                                            <FilterRow visible />
                                                            <HeaderFilter visible />
                                                            <Export enabled />
                                                            <Toolbar>
                                                                <Item name="exportButton" />
                                                                <Item name="columnChooserButton" />
                                                            </Toolbar>

                                                            <Column
                                                                dataField="dev_eui"
                                                                caption="Meter ID"
                                                                cellRender={(cellData) => (
                                                                    <code className="text-primary">{cellData.value}</code>
                                                                )}
                                                            />
                                                            <Column
                                                                dataField="device_name"
                                                                caption="Device Name"
                                                            />
                                                            <Column
                                                                dataField="consumption"
                                                                caption="Consumption (kWh)"
                                                                dataType="number"
                                                                format={{ type: 'fixedPoint', precision: 2 }}
                                                                cellRender={(cellData) => (
                                                                    <span className="fw-bold text-primary">
                                                                        {parseFloat(cellData.value).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            />
                                                            <Column
                                                                dataField="export"
                                                                caption="Export (kWh)"
                                                                dataType="number"
                                                                format={{ type: 'fixedPoint', precision: 2 }}
                                                                cellRender={(cellData) => (
                                                                    <span className="fw-bold text-success">
                                                                        {parseFloat(cellData.value).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            />
                                                            <Column
                                                                dataField="maxDemand"
                                                                caption="Max Demand (kW)"
                                                                dataType="number"
                                                                format={{ type: 'fixedPoint', precision: 2 }}
                                                                cellRender={(cellData) => (
                                                                    <span className="fw-bold text-warning">
                                                                        {parseFloat(cellData.value).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            />
                                                            <Column
                                                                caption="Type"
                                                                cellRender={(cellData) => {
                                                                    const meter = selectedMeters.find(m => m.dev_eui === cellData.data.dev_eui);
                                                                    return (
                                                                        <CBadge color="info">
                                                                            {meter?.type || 'Unknown'}
                                                                        </CBadge>
                                                                    );
                                                                }}
                                                            />

                                                            <Summary>
                                                                <TotalItem
                                                                    column="consumption"
                                                                    summaryType="sum"
                                                                    displayFormat="Total: {0} kWh"
                                                                />
                                                                <TotalItem
                                                                    column="export"
                                                                    summaryType="sum"
                                                                    displayFormat="Total: {0} kWh"
                                                                />
                                                                <TotalItem
                                                                    column="maxDemand"
                                                                    summaryType="max"
                                                                    displayFormat="Peak: {0} kW"
                                                                />
                                                            </Summary>

                                                            <Paging defaultPageSize={10} />
                                                            <Pager
                                                                visible
                                                                allowedPageSizes={[5, 10, 20]}
                                                                showPageSizeSelector
                                                                showInfo
                                                                showNavigationButtons
                                                            />
                                                        </DataGrid>
                                                    </CCardBody>
                                                </CCard>
                                            </CCol>
                                        </CRow>
                                    )}

                                    {/* Bill Generation Modal */}
                                    <CModal size="xl" visible={billModal} onClose={() => setBillModal(false)}>
                                        <CModalHeader>
                                            <CModalTitle>Electricity Bill</CModalTitle>
                                        </CModalHeader>
                                        <CModalBody>
                                            {billData && (
                                                <div className="bill-content p-4" style={{ backgroundColor: 'white', fontFamily: 'Arial, sans-serif' }}>
                                                    {/* Bill Header */}
                                                    <div className="text-center mb-4 pb-3 border-bottom">
                                                        <h2 className="text-primary">ELECTRICITY BILL</h2>
                                                        <p className="mb-0">Account Number: <strong>{billData.customerInfo.accountNumber}</strong></p>
                                                    </div>

                                                    {/* Customer Info */}
                                                    <CRow className="mb-4">
                                                        <CCol md={6}>
                                                            <h5>Customer Information</h5>
                                                            <p className="mb-1"><strong>Name:</strong> {billData.customerInfo.name}</p>
                                                            <p className="mb-1"><strong>Address:</strong> {billData.customerInfo.address}</p>
                                                            <p className="mb-1"><strong>Meter Numbers:</strong> {billData.customerInfo.meterNumbers}</p>
                                                        </CCol>
                                                        <CCol md={6}>
                                                            <h5>Billing Period</h5>
                                                            <p className="mb-1"><strong>Current Month:</strong> {billData.billingPeriod.current}</p>
                                                            <p className="mb-1"><strong>Period:</strong> {billData.billingPeriod.startDate} to {billData.billingPeriod.endDate}</p>
                                                        </CCol>
                                                    </CRow>

                                                    {/* Current Month Details */}
                                                    <div className="mb-4">
                                                        <h5>Current Month Usage</h5>
                                                        <CTable striped>
                                                            <CTableBody>
                                                                <CTableRow>
                                                                    <CTableDataCell><strong>Total Consumption</strong></CTableDataCell>
                                                                    <CTableDataCell>{billData.currentMonthDetails.consumption.toFixed(2)} kWh</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow>
                                                                    <CTableDataCell><strong>Maximum Demand</strong></CTableDataCell>
                                                                    <CTableDataCell>{billData.currentMonthDetails.demand.toFixed(2)} kW</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow>
                                                                    <CTableDataCell><strong>Energy Charges</strong></CTableDataCell>
                                                                    <CTableDataCell>Rs. {(billData.currentMonthDetails.consumption * billData.rates.baseRate).toFixed(2)}</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow>
                                                                    <CTableDataCell><strong>Demand Charges</strong></CTableDataCell>
                                                                    <CTableDataCell>Rs. {(billData.currentMonthDetails.demand * billData.rates.demandCharge).toFixed(2)}</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow>
                                                                    <CTableDataCell><strong>Fixed Charges</strong></CTableDataCell>
                                                                    <CTableDataCell>Rs. {billData.rates.fixedCharge.toFixed(2)}</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow className="table-primary">
                                                                    <CTableDataCell><strong>Total Amount Due</strong></CTableDataCell>
                                                                    <CTableDataCell><strong>Rs. {billData.currentMonthDetails.cost.toFixed(2)}</strong></CTableDataCell>
                                                                </CTableRow>
                                                            </CTableBody>
                                                        </CTable>
                                                    </div>

                                                    {/* Last 6 Months History */}
                                                    <div className="mb-4">
                                                        <h5>Usage History (Last 6 Months)</h5>
                                                        <CTable striped hover>
                                                            <CTableHead>
                                                                <CTableRow>
                                                                    <CTableHeaderCell>Month</CTableHeaderCell>
                                                                    <CTableHeaderCell>Consumption (kWh)</CTableHeaderCell>
                                                                    <CTableHeaderCell>Demand (kW)</CTableHeaderCell>
                                                                    <CTableHeaderCell>Amount (Rs. )</CTableHeaderCell>
                                                                </CTableRow>
                                                            </CTableHead>
                                                            <CTableBody>
                                                                {Object.values(billData.usage).map((monthData, index) => (
                                                                    <CTableRow key={index}>
                                                                        <CTableDataCell>{monthData.month}</CTableDataCell>
                                                                        <CTableDataCell>{monthData.consumption.toFixed(2)}</CTableDataCell>
                                                                        <CTableDataCell>{monthData.demand.toFixed(2)}</CTableDataCell>
                                                                        <CTableDataCell>Rs. {monthData.cost.toFixed(2)}</CTableDataCell>
                                                                    </CTableRow>
                                                                ))}
                                                            </CTableBody>
                                                        </CTable>
                                                    </div>

                                                    {/* Rate Schedule */}
                                                    <div className="mb-4">
                                                        <h5>Rate Schedule</h5>
                                                        <CTable size="sm">
                                                            <CTableBody>
                                                                <CTableRow>
                                                                    <CTableDataCell>Base Energy Rate</CTableDataCell>
                                                                    <CTableDataCell>Rs. {billData.rates.baseRate.toFixed(3)} per kWh</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow>
                                                                    <CTableDataCell>Demand Charge</CTableDataCell>
                                                                    <CTableDataCell>Rs. {billData.rates.demandCharge.toFixed(2)} per kW</CTableDataCell>
                                                                </CTableRow>
                                                                <CTableRow>
                                                                    <CTableDataCell>Monthly Fixed Charge</CTableDataCell>
                                                                    <CTableDataCell>Rs. {billData.rates.fixedCharge.toFixed(2)}</CTableDataCell>
                                                                </CTableRow>
                                                            </CTableBody>
                                                        </CTable>
                                                    </div>

                                                    <div className="text-center text-muted">
                                                        <small>Bill generated on {new Date().toLocaleDateString()}</small>
                                                    </div>
                                                </div>
                                            )}
                                        </CModalBody>
                                        <CModalFooter>
                                            <CButton color="secondary" onClick={() => setBillModal(false)}>
                                                Close
                                            </CButton>
                                            <CButton color="primary" onClick={() => window.print()}>
                                                <CIcon icon={cilCloudDownload} className="me-2" />
                                                Download PDF
                                            </CButton>
                                        </CModalFooter>
                                    </CModal>

                                    {loading && (
                                        <div className="text-center my-4">
                                            <CSpinner color="primary" />
                                            <div className="mt-2">Loading...</div>
                                        </div>
                                    )}

                                    {error && (
                                        <CRow className="mb-4">
                                            <CCol xs={12}>
                                                <CAlert color="danger">
                                                    <strong>Error:</strong> {error}
                                                </CAlert>
                                            </CCol>
                                        </CRow>
                                    )}

                                    {selectedMeters.length === 0 && selectedDeviceName && (
                                        <CRow className="mb-4">
                                            <CCol xs={12}>
                                                <CAlert color="info">
                                                    <CIcon icon={cilHome} className="me-2" />
                                                    Please select at least one meter to view usage data and generate bills.
                                                </CAlert>
                                            </CCol>
                                        </CRow>
                                    )}
                                
                                
                                </CCardBody>
                                </CCard>
                                </CCol>
                                </CRow>
            )}
                                </CContainer>
                                );
};

                                export default ElectricityBillPage;

