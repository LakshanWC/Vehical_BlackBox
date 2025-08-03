import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Typography } from '@mui/material';

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

export default function RideMap({ ride }) {
    const validPoints = ride.path.filter(p =>
        p.location.lat !== "waiting-gps" && p.location.lng !== "waiting-gps"
    );

    if (validPoints.length < 2) {
        return <Typography color="textSecondary">Insufficient location data for this ride</Typography>;
    }

    const startPoint = validPoints[0];
    const endPoint = validPoints[validPoints.length - 1];
    const path = validPoints.map(p => [parseFloat(p.location.lat), parseFloat(p.location.lng)]);

    return (
        <div style={{ height: '300px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <MapContainer
                center={path[0]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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