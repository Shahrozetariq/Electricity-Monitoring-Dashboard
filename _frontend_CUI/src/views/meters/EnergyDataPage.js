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
  CButton
} from '@coreui/react';
import { cilSync, cilBolt, cilSpeedometer, cilCalendar, cilCheckCircle, cilXCircle } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import DataGrid, {
  Column,
  Paging,
  Pager,
  HeaderFilter,
  FilterRow,
  Export,
  Toolbar,
  Item
} from 'devextreme-react/data-grid';
import Chart, {
  Series,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Title,
  Tooltip,
  Grid
} from 'devextreme-react/chart';
import PieChart, {
  Series as PieSeries,
  Label,
  Connector,
  Size,
  Export as PieExport
} from 'devextreme-react/pie-chart';

const EnergyDataPage = () => {
  const [adw300, setAdw300] = useState([]);
  const [adw310, setAdw310] = useState([]);
  const [dtsd4s, setDtsd4s] = useState([]);
  const [dtsd12s, setDtsd12s] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [floatingCardsVisible, setFloatingCardsVisible] = useState(false);

  // Check if a meter is active (synced within last minute)
  const isMeterActive = (receivedAt, time) => {
    if (!receivedAt) return false;
    const now = new Date();
    const lastSync = new Date(receivedAt);
    const diffInMinutes = (now - lastSync) / (1000 * 60);
    return diffInMinutes <= time;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://182.180.69.171:5000/api/energy/all');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();

      setAdw300(result.adw300 || []);
      setAdw310(result.adw310 || []);
      setDtsd4s(result.dtsd.filter(m => m.device_type === 'DTSD-4S') || []);
      setDtsd12s(result.dtsd.filter(m => m.device_type === 'DTSD-12S') || []);
      setLastUpdated(new Date());

      // Auto-select first available meter if none selected
      if (!selectedMeter) {
        if (result.adw300.length > 0) setSelectedMeter(result.adw300[0]);
        else if (result.adw310.length > 0) setSelectedMeter(result.adw310[0]);
        else if (result.dtsd.length > 0) setSelectedMeter(result.dtsd[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle scroll to show/hide floating cards
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setFloatingCardsVisible(scrollTop > 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (selectedMeter) {
      const point = {
        time: new Date(selectedMeter.received_at),
        voltage: parseFloat(selectedMeter.voltage || selectedMeter.voltage_a) || 0,
        current: parseFloat(selectedMeter.current || selectedMeter.current_a) || 0,
        energy_import: parseFloat(selectedMeter.energy_import) || 0
      };
      setHistoricalData(prev => {
        const updated = [...prev, point];
        return updated.slice(-24);
      });
    }
  }, [selectedMeter]);

  const formatDate = (dateString) =>
    dateString ? new Date(dateString).toLocaleString() : 'N/A';

  const formatDeviceId = (devEui) =>
    devEui ? devEui.replace(/(.{4})/g, '$1 ').trim().toUpperCase() : '';

  const getTimeSinceSync = (receivedAt) => {
    if (!receivedAt) return 'Never';
    const now = new Date();
    const lastSync = new Date(receivedAt);
    const diffInSeconds = Math.floor((now - lastSync) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    return `${diffInHours}h ago`;
  };

  const cellRender = (cellData) => {
    const value = cellData.value;
    if (cellData.column.dataField === 'dev_eui') {
      return <code className="text-primary">{formatDeviceId(value)}</code>;
    }
    if (cellData.column.dataField === 'received_at') {
      return formatDate(value);
    }
    if (['voltage', 'voltage_a', 'current', 'current_a', 'energy_import'].includes(cellData.column.dataField)) {
      return value ? <span className="fw-semibold text-success">{value}</span> : <span className="text-muted">N/A</span>;
    }
    return value;
  };

  const statusCellRender = (cellData) => {
    const isActive = isMeterActive(cellData.data.received_at, 5);
    const isStale = isMeterActive(cellData.data.received_at, 30);

    let status = 'Inactive';
    let color = 'danger';
    let icon = cilXCircle;
    let rank = 2;

    if (isActive) {
      status = 'Active';
      color = 'success';
      icon = cilCheckCircle;
      rank = 0;
    } else if (isStale) {
      status = 'Stale';
      color = 'warning';
      icon = cilXCircle;
      rank = 1;
    }

    // Save numeric rank for sorting
    cellData.data.status_rank = rank;

    return (
      <CBadge color={color}>
        <CIcon icon={icon} className="me-1" /> {status}
      </CBadge>
    );
  };


  const pieData = selectedMeter ? [
    { parameter: 'Voltage', value: parseFloat(selectedMeter.voltage || selectedMeter.voltage_a) || 0 },
    { parameter: 'Current', value: Math.max(parseFloat(selectedMeter.current || selectedMeter.current_a) || 0, 0.1) },
    { parameter: 'Energy Import', value: parseFloat(selectedMeter.energy_import) || 0 }
  ].filter(item => item.value > 0) : [];

  const pieChartPalette = ['#f39c12', '#3498db', '#2ecc71'];

  // Floating Stats Cards Component
  const FloatingStatsCards = () => {
    if (!selectedMeter || !floatingCardsVisible) return null;

    const isActive = isMeterActive(selectedMeter.received_at);

    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1050,
          minWidth: '300px',
          maxWidth: '400px'
        }}
        className="floating-cards"
      >
        <CCard className="shadow-lg border-0" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <CCardHeader className="border-0 pb-2">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">Selected Meter</h6>
              <CBadge color={isActive ? 'success' : 'warning'}>
                <CIcon icon={isActive ? cilCheckCircle : cilXCircle} className="me-1" />
                {isActive ? 'Active' : 'Stale'}
              </CBadge>
            </div>
            <small className="text-muted">
              {selectedMeter.meter_id}
            </small>
          </CCardHeader>
          <CCardBody className="pt-2">
            <CRow className="g-2">
              <CCol xs={4} className="text-center">
                <CIcon icon={cilBolt} size="lg" className="text-warning mb-1" />
                <div className="fw-bold">{selectedMeter.voltage || selectedMeter.voltage_a || 'N/A'}</div>
                <small className="text-muted">V</small>
              </CCol>
              <CCol xs={4} className="text-center">
                <CIcon icon={cilSpeedometer} size="lg" className="text-info mb-1" />
                <div className="fw-bold">{selectedMeter.current || selectedMeter.current_a || 'N/A'}</div>
                <small className="text-muted">A</small>
              </CCol>
              <CCol xs={4} className="text-center">
                <CIcon icon={cilBolt} size="lg" className="text-success mb-1" />
                <div className="fw-bold">{selectedMeter.energy_import || 'N/A'}</div>
                <small className="text-muted">kWh</small>
              </CCol>
            </CRow>
            <hr className="my-2" />
            <div className="text-center">
              <CIcon icon={cilCalendar} className="text-primary me-1" />
              <small className="text-muted">
                Last sync: {getTimeSinceSync(selectedMeter.received_at)}
              </small>
            </div>
          </CCardBody>
        </CCard>
      </div>
    );
  };

  const renderTable = (title, data, voltageField = 'voltage', currentField = 'current') => (
    <CCol xs={12} className="mb-4">
      <CCard>
        <CCardHeader>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">{title}</h5>
            <small className="text-muted">
              {data.filter(m => isMeterActive(m.received_at)).length} of {data.length} active
            </small>
          </div>
        </CCardHeader>
        <CCardBody>
          <DataGrid
            dataSource={data.map(m => {
              const meterId = m.meter_id;
              const active = isMeterActive(m.received_at, 5);
              const stale = isMeterActive(m.received_at, 30);

              let rank = 2; // Inactive
              if (active) rank = 0;
              else if (stale) rank = 1;

              return {
                ...m,
                meter_id: meterId,
                is_active: active,
                status_rank: rank,
                time_since_sync: getTimeSinceSync(m.received_at)
              };
            })}

            keyExpr="meter_id"
            allowColumnReordering
            allowColumnResizing
            columnAutoWidth
            showBorders
            rowAlternationEnabled
            hoverStateEnabled
            onRowClick={(e) => setSelectedMeter(e.data)}
            selection={{ mode: 'single' }}
          >
            <FilterRow visible />
            <HeaderFilter visible />
            <Export enabled />
            <Toolbar>
              <Item name="exportButton" />
              <Item name="columnChooserButton" />
            </Toolbar>

            <Column
              dataField="meter_id"
              caption="Meter ID"
              cellRender={(cellData) => (
                <div className="d-flex align-items-center">
                  <code className={`text-${cellData.data.is_active ? 'primary' : 'muted'}`}>
                    {cellData.value}
                  </code>
                  {cellData.data.is_active && (
                    <CBadge color="success" size="sm" className="ms-2">LIVE</CBadge>
                  )}
                </div>
              )}
              minWidth={200}
            />
            <Column
              dataField="time_since_sync"
              caption="Last Sync"
              cellRender={(cellData) => (
                <span className={`text-${cellData.data.is_active ? 'success' : 'warning'}`}>
                  {cellData.value}
                </span>
              )}
              width={100}
            />
            <Column dataField="received_at" caption="Received At" cellRender={cellRender} dataType="datetime" />
            <Column dataField={voltageField} caption="Voltage (V)" cellRender={cellRender} />
            <Column dataField={currentField} caption="Current (A)" cellRender={cellRender} />
            <Column dataField="energy_import" caption="Energy Import (kWh)" cellRender={cellRender} />
            <Column
              dataField="status_rank"
              caption="Status"
              cellRender={statusCellRender}
              sortOrder="asc"
              sortIndex={0}   // default sort by status
            />
            <Paging defaultPageSize={10} />
            <Pager visible allowedPageSizes={[5, 10, 20]} showPageSizeSelector showInfo showNavigationButtons />
          </DataGrid>
        </CCardBody>
      </CCard>
    </CCol>
  );

  if (loading && !selectedMeter) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <CSpinner color="primary" size="lg" />
          <div className="mt-3">Loading energy data...</div>
        </div>
      </CContainer>
    );
  }

  return (
    <>
      <FloatingStatsCards />

      <CContainer fluid className="px-4 py-4" style={{ paddingBottom: '100px' }}>
        <CRow className="mb-4">
          <CCol xs={12} className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="mb-1">Energy Monitoring Dashboard</h2>
              <p className="text-muted mb-0">
                Click on a meter row to view details |
                Active meters: {[...adw300, ...adw310, ...dtsd4s, ...dtsd12s].filter(m => isMeterActive(m.received_at)).length}
              </p>
            </div>
            <CButton
              color="primary"
              variant="outline"
              onClick={fetchData}
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              <CIcon icon={cilSync} className={loading ? 'spin' : ''} />
              Refresh
            </CButton>
          </CCol>
        </CRow>

        {error && (
          <CRow className="mb-4">
            <CCol xs={12}>
              <CAlert color="danger"><strong>Error:</strong> {error}</CAlert>
            </CCol>
          </CRow>
        )}

        {selectedMeter && (
          <>
            <CRow className="mb-4" id="stats-cards">
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="h-100">
                  <CCardBody className="text-center">
                    <CIcon icon={cilBolt} size="3xl" className="text-warning mb-3" />
                    <h4 className="mb-1">{selectedMeter.voltage || selectedMeter.voltage_a || 'N/A'}</h4>
                    <p className="text-muted mb-0">Voltage (V)</p>
                    <CBadge color={isMeterActive(selectedMeter.received_at) ? 'success' : 'warning'} size="sm">
                      {isMeterActive(selectedMeter.received_at) ? 'LIVE' : 'STALE'}
                    </CBadge>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="h-100">
                  <CCardBody className="text-center">
                    <CIcon icon={cilSpeedometer} size="3xl" className="text-info mb-3" />
                    <h4 className="mb-1">{selectedMeter.current || selectedMeter.current_a || 'N/A'}</h4>
                    <p className="text-muted mb-0">Current (A)</p>
                    <CBadge color={isMeterActive(selectedMeter.received_at) ? 'success' : 'warning'} size="sm">
                      {isMeterActive(selectedMeter.received_at) ? 'LIVE' : 'STALE'}
                    </CBadge>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="h-100">
                  <CCardBody className="text-center">
                    <CIcon icon={cilBolt} size="3xl" className="text-success mb-3" />
                    <h4 className="mb-1">{selectedMeter.energy_import || 'N/A'}</h4>
                    <p className="text-muted mb-0">Energy Import (kWh)</p>
                    <CBadge color={isMeterActive(selectedMeter.received_at) ? 'success' : 'warning'} size="sm">
                      {isMeterActive(selectedMeter.received_at) ? 'LIVE' : 'STALE'}
                    </CBadge>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} sm={6} lg={3}>
                <CCard className="h-100">
                  <CCardBody className="text-center">
                    <CIcon icon={cilCalendar} size="3xl" className="text-primary mb-3" />
                    <h6 className="mb-1">{formatDate(selectedMeter.received_at)}</h6>
                    <p className="text-muted mb-0">Last Reading</p>
                    <CBadge color={isMeterActive(selectedMeter.received_at) ? 'success' : 'warning'} size="sm">
                      {getTimeSinceSync(selectedMeter.received_at)}
                    </CBadge>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            <CRow className="mb-4">
              <CCol xs={12} lg={8}>
                <CCard>
                  <CCardHeader>
                    <h5 className="mb-0">Energy Parameters Trend</h5>
                    <small className="text-muted">
                      Meter: {selectedMeter.meter_id || `${selectedMeter.dev_eui}${selectedMeter.addr ? `_${selectedMeter.addr}` : ''}`} |
                      Status: <span className={`text-${isMeterActive(selectedMeter.received_at) ? 'success' : 'warning'}`}>
                        {isMeterActive(selectedMeter.received_at) ? 'Active' : 'Stale'}
                      </span>
                    </small>
                  </CCardHeader>
                  <CCardBody>
                    <Chart dataSource={historicalData} height={350}>
                      <Series valueField="voltage" argumentField="time" name="Voltage (V)" type="line" color="#f39c12" />
                      <Series valueField="current" argumentField="time" name="Current (A)" type="line" color="#3498db" />
                      <Series valueField="energy_import" argumentField="time" name="Energy Import (kWh)" type="line" color="#2ecc71" />
                      <ArgumentAxis><Grid visible /></ArgumentAxis>
                      <ValueAxis><Grid visible /></ValueAxis>
                      <Legend visible />
                      <Title text="Real-time Energy Monitoring" />
                      <Tooltip enabled contentRender={({ argumentText, valueText, seriesName }) => (
                        <div className="p-2">
                          <div><strong>{seriesName}</strong></div>
                          <div>Time: {new Date(argumentText).toLocaleTimeString()}</div>
                          <div>Value: {valueText}</div>
                        </div>
                      )} />
                    </Chart>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol xs={12} lg={4}>
                <CCard>
                  <CCardHeader><h5>Current Distribution</h5></CCardHeader>
                  <CCardBody>
                    {pieData.length > 0 ? (
                      <PieChart dataSource={pieData} height={350} palette={pieChartPalette}>
                        <PieSeries argumentField="parameter" valueField="value">
                          <Label visible format={{ type: 'fixedPoint', precision: 2 }}
                            customizeText={(arg) => `${arg.argumentText}: ${arg.valueText}`}>
                            <Connector visible width={2} />
                          </Label>
                        </PieSeries>
                        <Size height={300} />
                        <PieExport enabled />
                      </PieChart>
                    ) : <p className="text-muted text-center">No data available</p>}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </>
        )}

        <CRow>
          {renderTable('ADW300 Readings', adw300, 'voltage_a', 'current_a')}
          {renderTable('ADW310 Readings', adw310, 'voltage', 'current')}
          {renderTable('DTSD-4S Readings',
            dtsd4s.map(m => ({
              ...m,
              meter_id: `${m.dev_eui}`
            })),
            'voltage_a', 'current_a'
          )}
          {renderTable('DTSD-12S Readings',
            dtsd12s.map(m => ({
              ...m,
              meter_id: `${m.dev_eui}`
            })),
            'voltage', 'current'
          )}
        </CRow>
      </CContainer>
    </>
  );
};

export default EnergyDataPage;