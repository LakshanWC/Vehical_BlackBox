import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapView = ({ center, markers, zoom = 13 }) => {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {markers.map((marker, index) => (
                <Marker
                    key={index}
                    position={marker.position}
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
            ))}
        </MapContainer>
    );
};

export default MapView;