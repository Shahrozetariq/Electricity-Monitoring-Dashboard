import React, { useState, useEffect } from 'react';
import Chart, { Series, ArgumentAxis, ValueAxis, Legend, Title, Tooltip } from 'devextreme-react/chart';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';

const EnergyComparisonChart = () => {
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [useCustomDateRange, setUseCustomDateRange] = useState(false);
  const [chartType, setChartType] = useState('import'); // import, export, net

  const API_BASE_URL =  'http://182.180.69.171:5000';

  const dayOptions = [
    { value: 7, text: 'Last 7 days' },
    { value: 14, text: 'Last 14 days' },
    { value: 30, text: 'Last 30 days' },
    { value: 90, text: 'Last 90 days' },
    { value: 'custom', text: 'Custom Range' }
  ];

  const chartTypeOptions = [
    { value: 'import', text: 'Energy Import' },
    { value: 'export', text: 'Energy Export' },
    { value: 'net', text: 'Net Energy' },
    { value: 'all', text: 'All (Stacked)' }
  ];

  const fetchComparisonData = async () => {
    setLoading(true);
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
        gensetNet: day.genset.net,
        totalImport: day.grid.import + day.solar.import + day.genset.import,
        totalExport: day.grid.export + day.solar.export + day.genset.export,
        totalNet: day.grid.net + day.solar.net + day.genset.net
      }));

      setComparisonData(transformedData);
      
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      setComparisonData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparisonData();
  }, [selectedDays, startDate, endDate, useCustomDateRange]);

  const onDaySelectionChanged = (e) => {
    setSelectedDays(e.value);
    if (e.value === 'custom') {
      setUseCustomDateRange(true);
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

  const onChartTypeChanged = (e) => {
    setChartType(e.value);
  };

  const renderChart = () => {
    if (chartType === 'all') {
      return (
        <Chart dataSource={comparisonData} height={500}>
          {/* Import Series */}
          <Series valueField="gridImport" argumentField="date" name="Grid Import" type="stackedBar" stack="import" color="#3b82f6" />
          <Series valueField="solarImport" argumentField="date" name="Solar Import" type="stackedBar" stack="import" color="#10b981" />
          <Series valueField="gensetImport" argumentField="date" name="Genset Import" type="stackedBar" stack="import" color="#f59e0b" />
          
          {/* Export Series (negative values) */}
          <Series 
            valueField="gridExport" 
            argumentField="date" 
            name="Grid Export" 
            type="stackedBar" 
            stack="export" 
            color="#ef4444"
            customizePoint={() => ({ value: -Math.abs(this.value) })}
          />
          <Series 
            valueField="solarExport" 
            argumentField="date" 
            name="Solar Export" 
            type="stackedBar" 
            stack="export" 
            color="#ec4899"
            customizePoint={() => ({ value: -Math.abs(this.value) })}
          />
          <Series 
            valueField="gensetExport" 
            argumentField="date" 
            name="Genset Export" 
            type="stackedBar" 
            stack="export" 
            color="#8b5cf6"
            customizePoint={() => ({ value: -Math.abs(this.value) })}
          />
          
          <ArgumentAxis><Title text="Date" /></ArgumentAxis>
          <ValueAxis><Title text="Energy (kWh)" /></ValueAxis>
          <Legend verticalAlignment="bottom" horizontalAlignment="center" />
          <Tooltip enabled={true} />
          <Title text="Energy Import/Export Comparison (All Sources)" />
        </Chart>
      );
    }

    const getSeriesConfig = () => {
      switch (chartType) {
        case 'import':
          return [
            { valueField: 'gridImport', name: 'Grid', color: '#3b82f6' },
            { valueField: 'solarImport', name: 'Solar', color: '#10b981' },
            { valueField: 'gensetImport', name: 'Genset', color: '#f59e0b' }
          ];
        case 'export':
          return [
            { valueField: 'gridExport', name: 'Grid', color: '#ef4444' },
            { valueField: 'solarExport', name: 'Solar', color: '#ec4899' },
            { valueField: 'gensetExport', name: 'Genset', color: '#8b5cf6' }
          ];
        case 'net':
          return [
            { valueField: 'gridNet', name: 'Grid', color: '#3b82f6' },
            { valueField: 'solarNet', name: 'Solar', color: '#10b981' },
            { valueField: 'gensetNet', name: 'Genset', color: '#f59e0b' }
          ];
        default:
          return [];
      }
    };

    const seriesConfig = getSeriesConfig();

    return (
      <Chart dataSource={comparisonData} height={500}>
        {seriesConfig.map((series, index) => (
          <Series
            key={index}
            valueField={series.valueField}
            argumentField="date"
            name={series.name}
            type="line"
            color={series.color}
          />
        ))}
        <ArgumentAxis><Title text="Date" /></ArgumentAxis>
        <ValueAxis><Title text="Energy (kWh)" /></ValueAxis>
        <Legend verticalAlignment="bottom" horizontalAlignment="center" />
        <Tooltip enabled={true} />
        <Title text={`Energy ${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Comparison`} />
      </Chart>
    );
  };

  return (
    <div style={{ 
      backgroundColor: 'white', 
      borderRadius: '8px', 
      padding: '20px', 
      marginBottom: '30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#333', margin: 0 }}>
          Energy Comparison (All Sources)
        </h2>
        {loading && (
          <LoadIndicator visible={true} width="20px" height="20px" />
        )}
      </div>

      {/* Controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '15px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <SelectBox
          dataSource={chartTypeOptions}
          value={chartType}
          onValueChanged={onChartTypeChanged}
          displayExpr="text"
          valueExpr="value"
          width={150}
          placeholder="Chart Type"
        />

        <SelectBox
          dataSource={dayOptions}
          value={selectedDays}
          onValueChanged={onDaySelectionChanged}
          displayExpr="text"
          valueExpr="value"
          width={150}
          placeholder="Select Period"
        />
        
        {useCustomDateRange && (
          <>
            <DateBox
              value={startDate ? new Date(startDate) : null}
              onValueChanged={onStartDateChanged}
              placeholder="Start Date"
              type="date"
              width={130}
            />
            <DateBox
              value={endDate ? new Date(endDate) : null}
              onValueChanged={onEndDateChanged}
              placeholder="End Date"
              type="date"
              width={130}
            />
          </>
        )}
        
        <Button
          text="Refresh"
          type="default"
          onClick={fetchComparisonData}
          disabled={loading}
        />
      </div>

      {/* Chart */}
      {comparisonData.length === 0 && !loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666',
          backgroundColor: '#f9fafb',
          borderRadius: '8px'
        }}>
          No comparison data available for the selected period.
        </div>
      ) : (
        renderChart()
      )}

      {/* Summary Statistics */}
      {comparisonData.length > 0 && (
        <div style={{ 
          marginTop: '20px', 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px' 
        }}>
          <div style={{ 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px', 
            padding: '15px',
            textAlign: 'center',
            border: '1px solid #bae6fd'
          }}>
            <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '5px' }}>
              Total Grid Energy
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#0c4a6e' }}>
              {comparisonData.reduce((sum, day) => sum + (day.gridImport - day.gridExport), 0).toFixed(1)} kWh
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f0fdf4', 
            borderRadius: '8px', 
            padding: '15px',
            textAlign: 'center',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '12px', color: '#166534', marginBottom: '5px' }}>
              Total Solar Energy
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#14532d' }}>
              {comparisonData.reduce((sum, day) => sum + (day.solarImport - day.solarExport), 0).toFixed(1)} kWh
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#fffbeb', 
            borderRadius: '8px', 
            padding: '15px',
            textAlign: 'center',
            border: '1px solid #fde68a'
          }}>
            <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '5px' }}>
              Total Genset Energy
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#78350f' }}>
              {comparisonData.reduce((sum, day) => sum + (day.gensetImport - day.gensetExport), 0).toFixed(1)} kWh
            </div>
          </div>

          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '8px', 
            padding: '15px',
            textAlign: 'center',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '12px', color: '#475569', marginBottom: '5px' }}>
              System Total
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#334155' }}>
              {comparisonData.reduce((sum, day) => sum + day.totalNet, 0).toFixed(1)} kWh
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnergyComparisonChart;