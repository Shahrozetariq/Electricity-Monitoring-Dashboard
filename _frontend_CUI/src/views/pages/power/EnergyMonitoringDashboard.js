import React, { useState, useEffect } from 'react';
import { CRow,CCol } from '@coreui/react';
import DataGrid, { Column, Paging, Pager } from 'devextreme-react/data-grid';
import Chart, { Series, ArgumentAxis, ValueAxis, Legend, Title, Tooltip } from 'devextreme-react/chart';
import CircularGauge, { Scale, RangeContainer, Range, ValueIndicator, Text } from 'devextreme-react/circular-gauge';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { CheckBox } from 'devextreme-react/check-box';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import EnergyComparisonChart from './EnergyComparisionChart';
import 'devextreme/dist/css/dx.light.css';

const EnergyMonitoringDashboard = () => {
    const [selectedType, setSelectedType] = useState('grid');
    const [combinedData, setCombinedData] = useState(null);
    const [metersData, setMetersData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [voltageChartData, setVoltageChartData] = useState([]);
    const [currentChartData, setCurrentChartData] = useState([]);
    const [energyChartData, setEnergyChartData] = useState([]);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Date selection state
    const [selectedDays, setSelectedDays] = useState(7);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [energyLoading, setEnergyLoading] = useState(false);
    const [useCustomDateRange, setUseCustomDateRange] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [comparisonData, setComparisonData] = useState([]);

    // Configuration
    const API_BASE_URL = 'http://182.180.69.171:5000';

    const typeOptions = [
        { value: 'grid', text: 'Grid' },
        { value: 'solar', text: 'Solar' },
        { value: 'genset', text: 'Genset' }
    ];

    const dayOptions = [
        { value: 7, text: 'Last 7 days' },
        { value: 14, text: 'Last 14 days' },
        { value: 30, text: 'Last 30 days' },
        { value: 90, text: 'Last 90 days' },
        { value: 'custom', text: 'Custom Range' }
    ];

    // Fetch comparison data for all meter types
    const fetchComparisonData = async () => {
        if (!showComparison) return;

        setEnergyLoading(true);
        try {
            let url = `${API_BASE_URL}/api/adw/energy/daily-energy/all`;
            const params = new URLSearchParams();

            if (useCustomDateRange && startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            } else {
                params.append('days', selectedDays);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch comparison data: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch comparison data');
            }

            // Transform data for multi-series chart
            const transformedData = data.data.map(day => ({
                date: day.dateString,
                gridImport: day.grid.import,
                gridExport: day.grid.export,
                gridNet: day.grid.net,
                solarImport: day.solar.import,
                solarExport: day.solar.export,
                solarNet: day.solar.net,
                gensetImport: day.genset.import,
                gensetExport: day.genset.export,
                gensetNet: day.genset.net
            }));

            setComparisonData(transformedData);

        } catch (error) {
            console.error('Error fetching comparison data:', error);
            setComparisonData([]);
        } finally {
            setEnergyLoading(false);
        }
    };
    const fetchEnergyData = async (type, days, startDate = null, endDate = null) => {
        setEnergyLoading(true);
        try {
            let url = `${API_BASE_URL}/api/adw/energy/${type}/daily-energy`;
            const params = new URLSearchParams();

            if (startDate && endDate) {
                params.append('startDate', startDate);
                params.append('endDate', endDate);
            } else {
                params.append('days', days);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch energy data: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to fetch energy data');
            }

            setEnergyChartData(data.data || []);

        } catch (error) {
            console.error('Error fetching energy data:', error);
            setEnergyChartData([]);
        } finally {
            setEnergyLoading(false);
        }
    };
    const fetchData = async (type) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/adw/energy/${type}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                // Add timeout
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'API returned unsuccessful response');
            }

            // Update state with real data
            setCombinedData(data.combined);
            setMetersData(data.meters || []);
            setLastUpdated(new Date(data.timestamp));

            // Prepare chart data
            setVoltageChartData([
                { phase: 'Phase A', voltage: data.combined.voltageA || 0 },
                { phase: 'Phase B', voltage: data.combined.voltageB || 0 },
                { phase: 'Phase C', voltage: data.combined.voltageC || 0 }
            ]);

            setCurrentChartData([
                { phase: 'Phase A', current: data.combined.currentA || 0 },
                { phase: 'Phase B', current: data.combined.currentB || 0 },
                { phase: 'Phase C', current: data.combined.currentC || 0 }
            ]);

            console.log(`Successfully loaded ${data.totalMeters} ${type} meters`);

        } catch (error) {
            console.error('Error fetching data:', error);
            setError(error.message);

            // Fallback to empty data instead of mock data
            setCombinedData({
                voltageA: 0, voltageB: 0, voltageC: 0,
                currentA: 0, currentB: 0, currentC: 0,
                totalPower: 0, totalImport: 0, totalExport : 0
            });
            setMetersData([]);
            setVoltageChartData([
                { phase: 'Phase A', voltage: 0 },
                { phase: 'Phase B', voltage: 0 },
                { phase: 'Phase C', voltage: 0 }
            ]);
            setCurrentChartData([
                { phase: 'Phase A', current: 0 },
                { phase: 'Phase B', current: 0 },
                { phase: 'Phase C', current: 0 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh data every 30 seconds
    useEffect(() => {
        fetchData(selectedType);
        fetchEnergyData(selectedType, selectedDays, startDate, endDate);

        const interval = setInterval(() => {
            fetchData(selectedType);
            // Don't auto-refresh energy chart as frequently since it's daily data
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [selectedType]);

    // Fetch energy data when date selection changes
    useEffect(() => {
        if (useCustomDateRange && startDate && endDate) {
            fetchEnergyData(selectedType, selectedDays, startDate, endDate);
            fetchComparisonData();
        } else if (!useCustomDateRange) {
            fetchEnergyData(selectedType, selectedDays);
            fetchComparisonData();
        }
    }, [selectedDays, startDate, endDate, useCustomDateRange, showComparison]);

    const onTypeSelectionChanged = (e) => {
        setSelectedType(e.value);
    };

    const onDaySelectionChanged = (e) => {
        setSelectedDays(e.value);
        if (e.value === 'custom') {
            setUseCustomDateRange(true);
            // Set default date range (last 7 days)
            const end = new Date();
            const start = new Date();
            start.setDate(start.getDate() - 7);
            setStartDate(start.toISOString().split('T')[0]);
            setEndDate(end.toISOString().split('T')[0]);
        } else {
            setUseCustomDateRange(false);
            setStartDate(null);
            setEndDate(null);
        }
    };

    const onStartDateChanged = (e) => {
        setStartDate(e.value ? e.value.toISOString().split('T')[0] : null);
    };

    const onEndDateChanged = (e) => {
        setEndDate(e.value ? e.value.toISOString().split('T')[0] : null);
    };

    const onRefreshClick = () => {
        fetchData(selectedType);
        fetchEnergyData(selectedType, selectedDays, startDate, endDate);
        fetchComparisonData();
    };

    const formatPowerValue = (value) => {
        return `${value?.toFixed(2) || '0.00'} kW`;
    };

    const formatVoltageValue = (value) => {
        return `${value?.toFixed(1) || '0.0'} V`;
    };

    const formatCurrentValue = (value) => {
        return `${value?.toFixed(1) || '0.0'} A`;
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleString();
    };

    // Calculate max power for gauge based on type
    const getMaxPower = (type) => {
        switch (type) {
            case 'solar': return 20;
            case 'genset': return 100;
            default: return 50; // grid
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Header */}
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#333', marginBottom: '20px' }}>
                    Energy Monitoring Dashboard
                </h1>
                {/* <EnergyComparisonChart /> */}
                {/* Controls */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '20px',
                    flexWrap: 'wrap'
                }}>
                    <SelectBox
                        dataSource={typeOptions}
                        value={selectedType}
                        onValueChanged={onTypeSelectionChanged}
                        displayExpr="text"
                        valueExpr="value"
                        width={200}
                        placeholder="Select Type"
                    />

                    <SelectBox
                        dataSource={dayOptions}
                        value={selectedDays}
                        onValueChanged={onDaySelectionChanged}
                        displayExpr="text"
                        valueExpr="value"
                        width={200}
                        placeholder="Select Period"
                    />

                    {useCustomDateRange && (
                        <>
                            <DateBox
                                value={startDate ? new Date(startDate) : null}
                                onValueChanged={onStartDateChanged}
                                placeholder="Start Date"
                                type="date"
                                width={150}
                            />
                            <DateBox
                                value={endDate ? new Date(endDate) : null}
                                onValueChanged={onEndDateChanged}
                                placeholder="End Date"
                                type="date"
                                width={150}
                            />
                        </>
                    )}

                    <CheckBox
                        value={showComparison}
                        onValueChanged={(e) => setShowComparison(e.value)}
                        text="Show All Sources Comparison"
                    />

                    <Button
                        text="Refresh"
                        type="default"
                        onClick={onRefreshClick}
                        disabled={loading || energyLoading}
                    />

                    {lastUpdated && (
                        <div style={{ fontSize: '14px', color: '#666' }}>
                            Last updated: {formatTimestamp(lastUpdated)}
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '15px',
                        marginBottom: '20px',
                        color: '#dc2626'
                    }}>
                        <strong>Error:</strong> {error}
                        <br />
                        <small>Check if the backend server is running on {API_BASE_URL}</small>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <LoadIndicator visible={true} />
                </div>
            ) : combinedData ? (
                <>
                    {/* Combined Data Overview */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '30px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
                            Combined {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Data
                            {metersData.length > 0 && (
                                <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
                                    ({metersData.length} meter{metersData.length !== 1 ? 's' : ''})
                                </span>
                            )}
                        </h2>

                        <CRow style={{
                                  
                                    borderRadius: '8px',
                                    margin: '20px',
                                   
                                }}>
                            <CCol>
                                {/* Energy Import Card */}
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                }}>
                                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                                        Energy Import
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                                        {(combinedData.totalImport || 0).toFixed(1)} kWh
                                    </div>
                                </div>
                                </CCol>
<CCol>
                                {/* Energy Export Card */}
                                <div style={{
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                                }}>
                                    <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                                        Energy Export
                                    </div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                                        {(combinedData.totalExport || 0).toFixed(1)} kWh
                                    </div>
                                </div>
                           </CCol>

                        </CRow>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: '30px', alignItems: 'center' }}>
                            {/* Voltage Chart */}

                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '15px' }}>
                                    Voltage (V)
                                </h3>
                                <Chart
                                    dataSource={voltageChartData}
                                    height={250}
                                >
                                    <Series
                                        valueField="voltage"
                                        argumentField="phase"
                                        type="bar"
                                        color="#3b82f6"
                                    />
                                    <ArgumentAxis />
                                    <ValueAxis min={200} max={260} />
                                    <Title text="" />
                                </Chart>
                            </div>

                            {/* Current Chart */}
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '15px' }}>
                                    Current (A)
                                </h3>
                                <Chart
                                    dataSource={currentChartData}
                                    height={250}
                                >
                                    <Series
                                        valueField="current"
                                        argumentField="phase"
                                        type="bar"
                                        color="#10b981"
                                    />
                                    <ArgumentAxis />
                                    <ValueAxis min={0} />
                                    <Title text="" />
                                </Chart>
                            </div>

                            {/* Power Gauge */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#333', marginBottom: '15px' }}>
                                    Total Power
                                </h3>
                                <CircularGauge
                                    value={combinedData.totalPower || 0}
                                    width={250}
                                    height={250}
                                >
                                    <Scale startValue={0} endValue={getMaxPower(selectedType)} tickInterval={getMaxPower(selectedType) / 5} />
                                    <RangeContainer>
                                        <Range startValue={0} endValue={getMaxPower(selectedType) * 0.5} color="#10b981" />
                                        <Range startValue={getMaxPower(selectedType) * 0.5} endValue={getMaxPower(selectedType) * 0.8} color="#f59e0b" />
                                        <Range startValue={getMaxPower(selectedType) * 0.8} endValue={getMaxPower(selectedType)} color="#ef4444" />
                                    </RangeContainer>
                                    <ValueIndicator type="rectangleNeedle" />
                                    <Text format={formatPowerValue} />
                                </CircularGauge>
                            </div>
                        </div>

                        {/* Energy Stats */}
                        <div style={{
                            marginTop: '30px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '20px'
                        }}>
                            {/* <div style={{ 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px', 
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                  Total Energy
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                  {(combinedData.totalImport || 0).toFixed(1)} kWh
                </div>
              </div> */}
                            <div style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                                    Average Voltage
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                                    {(((combinedData.voltageA || 0) + (combinedData.voltageB || 0) + (combinedData.voltageC || 0)) / 3).toFixed(1)} V
                                </div>
                            </div>
                            <div style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                padding: '20px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                                    Total Current
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                                    {((combinedData.currentA || 0) + (combinedData.currentB || 0) + (combinedData.currentC || 0)).toFixed(1)} A
                                </div>
                            </div>
                            <div style={{
                                backgroundColor: '#f8fafc',
                                borderRadius: '8px',
                                padding: '25px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '5px' }}>
                                    Total Power
                                </div>
                                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b' }}>
                                    {combinedData.totalPower.toFixed(1) < 0 ? 0 : combinedData.totalPower.toFixed(1)} A
                                </div>
                            </div>
                        </div>

                    </div>


                    {/* Individual Meters DataGrid */}
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333', marginBottom: '20px' }}>
                            {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Meters
                        </h2>

                        {metersData.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '40px',
                                color: '#666',
                                backgroundColor: '#f9fafb',
                                borderRadius: '8px'
                            }}>
                                No {selectedType} meters found in the database.
                            </div>
                        ) : (
                            <DataGrid
                                dataSource={metersData}
                                keyExpr="id"
                                showBorders={true}
                                rowAlternationEnabled={true}
                                hoverStateEnabled={true}
                                height={400}
                                columnAutoWidth={true}
                            >
                                <Column
                                    dataField="name"
                                    caption="Meter Name"
                                    width={100}
                                />
                                <Column
                                    dataField="voltageA"
                                    caption="Voltage A (V)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                <Column
                                    dataField="voltageB"
                                    caption="Voltage B (V)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                <Column
                                    dataField="voltageC"
                                    caption="Voltage C (V)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                <Column
                                    dataField="currentA"
                                    caption="Current A (A)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                <Column
                                    dataField="currentB"
                                    caption="Current B (A)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                <Column
                                    dataField="currentC"
                                    caption="Current C (A)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                <Column
                                    dataField="totalPower"
                                    caption="Total Power (kW)"
                                    format="fixedPoint"
                                    precision={2}
                                    alignment="center"
                                />
                                <Column
                                    dataField="energyImport"
                                    caption="Energy Import (kWh)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                />
                                {/* <Column
                                    dataField="powerFactor"
                                    caption="Power Factor"
                                    format="fixedPoint"
                                    precision={3}
                                    alignment="center"
                                />
                                <Column
                                    dataField="frequency"
                                    caption="Frequency (Hz)"
                                    format="fixedPoint"
                                    precision={1}
                                    alignment="center"
                                /> */}
                                <Column
                                    dataField="receivedAt"
                                    caption="Last Reading"
                                    dataType="datetime"
                                    format="dd/MM/yyyy HH:mm:ss"
                                    alignment="center"
                                    width={150}
                                />

                                <Paging enabled={true} pageSize={10} />
                                <Pager
                                    showPageSizeSelector={true}
                                    allowedPageSizes={[5, 10, 20]}
                                    showInfo={true}
                                />
                            </DataGrid>
                        )}
                    </div>
                </>
            ) : null}
        </div>
    );
};

export default EnergyMonitoringDashboard;