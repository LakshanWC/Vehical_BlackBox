// Enhanced LiveTracking.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { createVehicleIcon } from '../components/VehicleIcon';

const LiveTracking = () => {
    const [positions, setPositions] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(null);
    const mapRef = useRef();

    useEffect(() => {
        const eventsRef = ref(database, 'event');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            const newPositions = [];
            snapshot.forEach((childSnapshot) => {
                const event = childSnapshot.val();
                const { lat, lng } = event.location || {};

                if (lat && lng && isValidCoordinate(lat, lng)) {
                    newPositions.push([parseFloat(lat), parseFloat(lng)]);
                }
            });

            // Update state only with valid positions
            setPositions(newPositions);
            if (newPositions.length > 0) {
                setCurrentPosition(newPositions[newPositions.length - 1]);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <Box sx={{ height: '100vh', width: '100%' }}>
            <MapContainer
                center={currentPosition || [6.743987, 79.968389]}
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />

                {/* Vehicle Path */}
                {positions.length > 0 && (
                    <Polyline
                        positions={positions}
                        color="blue"
                        weight={3}
                    />
                )}

                {/* Current Vehicle Position */}
                {currentPosition && (
                    <Marker
                        position={[currentPosition.lat, currentPosition.lng]}
                        icon={createVehicleIcon(currentPosition.heading)}
                    />
                )}

                {/* Trip Start/End Markers */}
                {trips.map((trip, tripIndex) => (
                    <>
                        <Marker
                            key={`start-${tripIndex}`}
                            position={[trip[0].lat, trip[0].lng]}
                            icon={L.divIcon({
                                className: 'trip-marker',
                                html: `<div style="background:#4CAF50;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`
                            })}
                        />
                        <Marker
                            key={`end-${tripIndex}`}
                            position={[trip[trip.length-1].lat, trip[trip.length-1].lng]}
                            icon={L.divIcon({
                                className: 'trip-marker',
                                html: `<div style="background:#F44336;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>`
                            })}
                        />
                    </>
                ))}
            </MapContainer>
        </Box>
    );
};

export default LiveTracking;