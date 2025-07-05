import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapView = ({ center, markers, zoom = 13 }) => {
    // Validate center coordinates
    const lat = parseFloat(center[0]);
    const lng = parseFloat(center[1]);

    if (isNaN(lat) || isNaN(lng)) {
        return <div>Invalid location data</div>;
    }

    const validatedCenter = [lat, lng];

    return (
        <MapContainer
            center={validatedCenter}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {markers.map((marker, index) => {
                // Validate marker positions
                const markerLat = parseFloat(marker.position[0]);
                const markerLng = parseFloat(marker.position[1]);

                if (isNaN(markerLat) || isNaN(markerLng)) {
                    console.warn(`Invalid marker position at index ${index}`);
                    return null;
                }

                const validatedPosition = [markerLat, markerLng];

                return (
                    <Marker
                        key={index}
                        position={validatedPosition}
                        icon={L.divIcon({
                            className: 'custom-marker',
                            html: `<div style="
                                background: ${marker.color};
                                width: ${marker.size}px;
                                height: ${marker.size}px;
                                border-radius: 50%;
                                border: 2px solid white;
                                transform: translate(-50%, -50%);
                            "></div>`
                        })}
                    >
                        {marker.popup && <Popup>{marker.popup}</Popup>}
                    </Marker>
                );
            })}
        </MapContainer>
    );
};

export default MapView;