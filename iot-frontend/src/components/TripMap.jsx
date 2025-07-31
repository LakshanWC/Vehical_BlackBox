// src/components/TripMap.jsx
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TripMap = ({ points }) => {
    const validPoints = points.filter(p =>
        p.location.lat !== 'waiting-gps' &&
        p.location.lng !== 'waiting-gps'
    ).map(p => [parseFloat(p.location.lat), parseFloat(p.location.lng)]);

    if (validPoints.length === 0) return <div>No valid location data</div>;

    return (
        <MapContainer
            center={validPoints[0]}
            zoom={13}
            style={{ height: '400px', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />
            <Polyline
                positions={validPoints}
                color="blue"
                weight={5}
            />
            <Marker
                position={validPoints[0]}
                icon={L.divIcon({
                    className: 'start-marker',
                    html: '<div style="background:green;width:20px;height:20px;border-radius:50%;border:2px solid white"></div>'
                })}
            >
                <Popup>Start: {points[0].timestamp}</Popup>
            </Marker>
            <Marker
                position={validPoints[validPoints.length - 1]}
                icon={L.divIcon({
                    className: 'end-marker',
                    html: '<div style="background:red;width:20px;height:20px;border-radius:50%;border:2px solid white"></div>'
                })}
            >
                <Popup>End: {points[points.length - 1].timestamp}</Popup>
            </Marker>
        </MapContainer>
    );
};

export default TripMap;