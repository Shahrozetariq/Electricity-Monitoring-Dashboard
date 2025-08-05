// src/components/SiteOverviewPanel.js
import React from 'react';
import { CRow, CCol } from '@coreui/react';
import SiteMap from './SiteMap';
import SiteOverviewTable from './SiteOverviewTable';

const SiteOverviewPanel = () => {
    return (
        <div style={{ padding: '1rem' }}>
            <h4>Site / Plant Overview</h4>
            <SiteMap />
            {/* <CRow>
                <CCol md={6}>
                   
                </CCol>
                <CCol md={6}>
                    <SiteOverviewTable />
                </CCol>
            </CRow> */}
        </div>
    );
};

export default SiteOverviewPanel;
