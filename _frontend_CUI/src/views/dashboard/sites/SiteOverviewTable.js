// src/components/SiteOverviewTable.js
import React from 'react';
import DataGrid, { Column, Paging, SearchPanel } from 'devextreme-react/data-grid';
import { mockSites } from './mockSites';

const SiteOverviewTable = () => {
    return (
        <div>
            <h5>Site Overview</h5>
            <DataGrid
                dataSource={mockSites}
                showBorders={true}
                columnAutoWidth={true}
            >
                <SearchPanel visible={true} />
                <Paging defaultPageSize={5} />
                <Column dataField="name" caption="Site Name" />
                <Column dataField="currentOutputKW" caption="Current Output (kW)" />
                <Column dataField="energyTodayKWh" caption="Energy Today (kWh)" />
                <Column
                    dataField="status"
                    caption="Status"
                    cellRender={({ data }) => (
                        <span style={{ color: data.status === 'Online' ? 'green' : 'red' }}>
                            {data.status}
                        </span>
                    )}
                />
            </DataGrid>
        </div>
    );
};

export default SiteOverviewTable;
