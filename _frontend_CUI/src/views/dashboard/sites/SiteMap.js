// src/components/SiteMap.js
import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { mockSites } from './mockSites';
import 'leaflet/dist/leaflet.css';

// Marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

// Colored markers
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const SiteMap = () => {
    const center = [32.185103562527466, 74.18251110942104];

    return (
        <MapContainer center={center} zoom={14} style={{ height: '500px', width: '100%' }}>
            <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            />
            {mockSites.map(site => (
                <Marker
                    key={site.id}
                    position={site.coordinates}
                    icon={site.status === 'Online' ? greenIcon : redIcon}
                >
                    <Popup>
                        <strong>{site.name}</strong><br />
                        Status: {site.status} <br />
                        Output: {site.currentOutputKW} kW<br />
                        Today: {site.energyTodayKWh} kWh
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default SiteMap;
