import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { createVehicleIcon } from './VehicleIcon';
import { useEffect, useMemo } from 'react';

const AutoCenterMap = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 18, { duration: 1 });
        }
    }, [position, map]);
    return null;
};

const calculateHeading = (prevPos, currentPos) => {
    if (!prevPos || !currentPos) return 0;
    return Math.atan2(currentPos[1] - prevPos[1], currentPos[0] - prevPos[0]) * 180 / Math.PI;
};

export default function LiveMap({ path, currentPosition, alert, isRideComplete }) {
    const validPoints = useMemo(() =>
            path.filter(p => p.location?.lat !== "waiting-gps")
                .map(p => [parseFloat(p.location.lat), parseFloat(p.location.lng)]),
        [path]
    );

    const vehicleHeading = useMemo(() =>
            validPoints.length > 1
                ? calculateHeading(validPoints[validPoints.length-2], validPoints[validPoints.length-1])
                : 0,
        [validPoints]
    );

    return (
        <div className="live-map-container">
            <MapContainer
                center={validPoints[validPoints.length-1] || [0, 0]}
                zoom={17}
                style={{ height: '100%', width: '100%' }}
            >
                <AutoCenterMap position={validPoints[validPoints.length-1]} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Dynamic Trajectory */}
                <Polyline
                    positions={validPoints}
                    color={alert ? '#ff0000' : '#007bff'}
                    weight={6}
                />

                {/* Moving Vehicle */}
                {validPoints.length > 0 && !isRideComplete && (
                    <Marker
                        position={validPoints[validPoints.length-1]}
                        icon={createVehicleIcon(vehicleHeading)}
                    >
                        <Popup>Current Position</Popup>
                    </Marker>
                )}

                {/* Start/End Markers (only when ride complete) */}
                {isRideComplete && validPoints.length > 1 && (
                    <>
                        <Marker position={validPoints[0]} icon={L.divIcon({
                            className: 'start-marker',
                            html: '<div style="background:#4CAF50;width:16px;height:16px;border-radius:50%;border:3px solid white;"></div>',
                            iconSize: [16, 16]
                        })}>
                            <Popup>Start Point</Popup>
                        </Marker>
                        <Marker position={validPoints[validPoints.length-1]} icon={L.divIcon({
                            className: 'end-marker',
                            html: '<div style="background:#F44336;width:16px;height:16px;border-radius:50%;border:3px solid white;"></div>',
                            iconSize: [16, 16]
                        })}>
                            <Popup>End Point</Popup>
                        </Marker>
                    </>
                )}
            </MapContainer>
        </div>
    );
}