import React from 'react';
import {
    CCard, CCardBody, CCardHeader,
    CRow, CCol, CButton, CFormInput
} from '@coreui/react';
import Chart, {
    ArgumentAxis,
    ValueAxis,
    Series,
    Tooltip,
    Legend
} from 'devextreme-react/chart';

const dailyEarnings = [
    { day: 1, earnings: 1000, savings: 1000, export: 0 },
    { day: 3, earnings: 120000, savings: 120000, export: 0 },
    { day: 5, earnings: 280000, savings: 280000, export: 0 },
    { day: 7, earnings: 250000, savings: 250000, export: 0 },
    { day: 9, earnings: 150000, savings: 150000, export: 0 },
    { day: 11, earnings: 290000, savings: 290000, export: 0 },
    { day: 13, earnings: 270000, savings: 270000, export: 0 },
    { day: 15, earnings: 90000, savings: 90000, export: 0 },
    { day: 17, earnings: 160000, savings: 160000, export: 0 },
    { day: 19, earnings: 240000, savings: 240000, export: 0 },
    { day: 21, earnings: 10000, savings: 10000, export: 0 },
];

const EarningsDashboard = () => {
    return (
        <CCard className="mb-4">

            <CRow className="g-4 p-4">
                {/* Earnings Card */}

                <CCol md="9" className="border">

                    <CRow >
                        <CCol md="4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <strong>Earnings</strong>
                                {/* <span className="text-muted" title="Monthly earnings info">?</span> */}
                            </div>

                            <div className="rounded p-3 text-white mb-4" style={{
                                background: 'linear-gradient(135deg, #b2dfdb, #c5cae9)',
                            }}>
                                <div className="small">Monthly earnings</div>
                                <div className="fs-2 fw-bold">3,686,040.00 <span className="fs-6">PKR</span></div>
                            </div>

                            <CRow className="text-center">
                                <CCol>
                                    <div className="text-muted small">Savings</div>
                                    <div className="fw-semibold">3,686,040.00 PKR</div>
                                </CCol>
                                <CCol>
                                    <div className="text-muted small">Export</div>
                                    <div className="fw-semibold">0.00 PKR</div>
                                </CCol>
                            </CRow>
                        </CCol>
                        <CCol md="8">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <div className="btn-group">
                                    <CButton color="light" size="sm">Day</CButton>
                                    <CButton color="primary" size="sm">Month</CButton>
                                    <CButton color="light" size="sm">Year</CButton>
                                    <CButton color="light" size="sm">All</CButton>
                                </div>
                                <CFormInput type="month" defaultValue="2025-06" style={{ maxWidth: '150px' }} />
                            </div>

                            <Chart id="earnings-bar" dataSource={dailyEarnings} size={{ height: 300 }}>
                                <ArgumentAxis title="Day" />
                                <ValueAxis title="PKR" />
                                <Series valueField="earnings" name="Earnings" argumentField="day" type="bar" color="#FBC02D" />
                                <Series valueField="savings" name="Savings" argumentField="day" type="bar" color="#26A69A" />
                                <Series valueField="export" name="Export" argumentField="day" type="bar" color="#B2EBF2" />
                                <Legend verticalAlignment="bottom" horizontalAlignment="center" />
                                <Tooltip enabled={true} shared={true} />
                            </Chart>
                        </CCol>
                    </CRow>

                </CCol>

                {/* Environmental Benefits */}
                <CCol md="3" className="border">

                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <strong>Environmental benefits</strong>
                        {/* <span className="text-muted" title="Environmental info">?</span> */}
                    </div>

                    <div className="mb-3 p-3 rounded bg-success bg-opacity-10 d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fs-5 fw-semibold">1047.0</div>
                            <div className="small text-muted">trees<br />Equivalent planted</div>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/427/427735.png" alt="tree" width="40" />
                    </div>

                    <div className="mb-3 p-3 rounded bg-warning bg-opacity-10 d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fs-5 fw-semibold">63.47 t</div>
                            <div className="small text-muted">CO₂ saved</div>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/728/728093.png" alt="co2" width="40" />
                    </div>

                    <div className="p-3 rounded bg-secondary bg-opacity-10 d-flex justify-content-between align-items-center">
                        <div>
                            <div className="fs-5 fw-semibold">31.84 t</div>
                            <div className="small text-muted">Standard coal saved</div>
                        </div>
                        <img src="https://cdn-icons-png.flaticon.com/512/1001/1001371.png" alt="coal" width="40" />
                    </div>

                </CCol>
            </CRow>
        </CCard >
    );
};

export default EarningsDashboard;
