// DashboardGauge.jsx
import React from 'react';
import CircularGauge, {
    Geometry,
    Scale,
    Size,
    ValueIndicator
} from 'devextreme-react/circular-gauge';

function DashboardGauge({ value, capacity }) {
    return (

        <div style={{
            width: '300px',
            padding: '20px',
            border: '1px solid #eee',
            borderRadius: '12px',
            fontFamily: 'sans-serif',
            textAlign: 'center'
        }}>
            {/* <h3 style={{ margin: 0 }}>PAF Base Lahore {capacity.toLocaleString()} kWp</h3> */}
            <span styl
                e={{ color: '#40af50', fontSize: '0.9em' }}>Online</span>

            <CircularGauge
                value={value}
                id="pv-gauge"
                style={{ width: '100%' }}
            >
                <Size width={250} />
                <Scale startValue={0} endValue={capacity} tickInterval={capacity / 5} />
                <Geometry startAngle={225} endAngle={-45} />
                <ValueIndicator indentFromCenter={30} color="#4caf50" />
            </CircularGauge>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                marginTop: '20px',
                fontSize: '0.9em'
            }}>
                {[
                    { label: 'Daily yield', value: '0.00', unit: 'kWh', total: '89.51' },
                    { label: 'Daily consumed', value: '0.00', unit: 'kWh', total: '89.51' },
                    { label: 'Daily self‑use rate', value: '0.00', unit: '%', month: '100.00' },
                    { label: 'Imported energy today', value: '0.00', unit: 'kWh', month: '0.00' }
                ].map((item, idx) => (
                    <div key={idx} style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: 600 }}>{item.label} ⓘ</div>
                        <div>
                            <strong>{item.value}</strong> {item.unit}
                        </div>
                        <div style={{ color: '#888' }}>
                            Total: {item.total ?? item.month} {item.unit}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default DashboardGauge;
