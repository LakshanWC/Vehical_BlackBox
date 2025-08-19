import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Typography } from '@mui/material';
import PropTypes from 'prop-types';

const MapView = ({ center, markers = [], zoom = 13, children, polyline, polylineColors }) => {
    const lat = parseFloat(center[0]);
    const lng = parseFloat(center[1]);

    if (isNaN(lat) || isNaN(lng) || center[0] === "waiting-gps") {
        return <Typography color="error">Invalid GPS Data</Typography>;
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
            {children}

            {markers.map((marker, index) => {
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

            {polyline && (
                <Polyline
                    positions={polyline}
                    pathOptions={{ color: polylineColors || "blue" }}
                    weight={3}
                    opacity={0.7}
                />
            )}
        </MapContainer>
    );
};

MapView.propTypes = {
    polylineColors: PropTypes.string, // single color string
};

export default MapView;
