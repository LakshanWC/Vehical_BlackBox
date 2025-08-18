import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Typography } from '@mui/material';
import 'leaflet/dist/leaflet.css';

// Sri Lanka bounds
const SRI_LANKA_BOUNDS = L.latLngBounds(
    L.latLng(5.5, 79), // SW
    L.latLng(10, 82)    // NE
);

const createMarkerIcon = (color) => L.divIcon({
    className: 'custom-marker',
    html: `<div style="
        background: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        transform: translate(-12px, -12px);
    "></div>`
});

// Strict coordinate validation
const isValidSriLankaCoordinate = (lat, lng) => {
    try {
        const numLat = Number(lat);
        const numLng = Number(lng);
        return (
            !isNaN(numLat) && !isNaN(numLng) &&
            numLat >= 5.5 && numLat <= 10 &&
            numLng >= 79 && numLng <= 82
        );
    } catch {
        return false;
    }
};

export default function RideMap({ ride, bounds = SRI_LANKA_BOUNDS }) {
    const validPoints = ride.path.filter(p =>
        p.location.lat !== "waiting-gps" &&
        p.location.lng !== "waiting-gps" &&
        isValidSriLankaCoordinate(p.location.lat, p.location.lng)
    );

    if (validPoints.length < 2) {
        return <Typography color="textSecondary">Insufficient valid location data for this ride</Typography>;
    }

    const path = validPoints.map(p => [
        parseFloat(p.location.lat),
        parseFloat(p.location.lng)
    ]);

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer
                bounds={path.length > 0 ? L.latLngBounds(path) : bounds}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                minZoom={10}
                maxBounds={bounds}
                maxBoundsViscosity={1.0}
                whenReady={(map) => {
                    map.target.setMaxBounds(bounds);
                }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    noWrap={true}
                />
                <Marker
                    position={path[0]}
                    icon={createMarkerIcon('#4CAF50')}
                >
                    <Popup>
                        <strong>Start</strong><br />
                        {new Date(ride.start.timestamp).toUTCString()}
                    </Popup>
                </Marker>
                <Marker
                    position={path[path.length - 1]}
                    icon={createMarkerIcon('#F44336')}
                >
                    <Popup>
                        <strong>End</strong><br />
                        {new Date(ride.end.timestamp).toUTCString()}
                    </Popup>
                </Marker>
                <Polyline
                    positions={path}
                    color="#1976D2"
                    weight={3}
                />
            </MapContainer>
        </div>
    );
}