// Updated LiveTracking.jsx with robust error handling
import React, { useEffect, useState, useRef } from 'react';
import { Box } from '@mui/material';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { createVehicleIcon } from '../components/VehicleIcon';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Sri Lanka approximate bounds
const SRI_LANKA_BOUNDS = L.latLngBounds(
    L.latLng(5.5, 79), // SW
    L.latLng(10, 82)   // NE
);

const LiveTracking = () => {
    const [positions, setPositions] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [trips, setTrips] = useState([]);
    const [dataError, setDataError] = useState(null);
    const mapRef = useRef();

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

    useEffect(() => {
        const eventsRef = ref(database, 'event');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            try {
                const newPositions = [];
                const newTrips = [];
                let currentTrip = [];
                let lastTimestamp = null;
                let validPoints = 0;

                snapshot.forEach((childSnapshot) => {
                    const event = childSnapshot.val();
                    if (event.location && event.location.lat !== 'waiting-gps') {
                        const lat = parseFloat(event.location.lat);
                        const lng = parseFloat(event.location.lng);

                        if (isValidSriLankaCoordinate(lat, lng)) {
                            const point = {
                                lat: lat,
                                lng: lng,
                                timestamp: childSnapshot.key,
                                heading: event.heading || 0
                            };

                            // Trip detection
                            if (lastTimestamp && (new Date(point.timestamp) - new Date(lastTimestamp) > 300000)) {
                                if (currentTrip.length > 0) {
                                    newTrips.push([...currentTrip]);
                                    currentTrip = [];
                                }
                            }

                            currentTrip.push(point);
                            newPositions.push([point.lat, point.lng]);
                            lastTimestamp = point.timestamp;
                            validPoints++;
                        }
                    }
                });

                if (validPoints === 0) {
                    setDataError('No valid GPS data found');
                    return;
                }

                // Final trip addition
                if (currentTrip.length > 0) {
                    newTrips.push(currentTrip);
                }

                setPositions(newPositions);
                setTrips(newTrips);
                setDataError(null);

                if (currentTrip.length > 0) {
                    const latestPos = currentTrip[currentTrip.length - 1];
                    setCurrentPosition(latestPos);

                    // Smoothly animate to new position
                    if (mapRef.current) {
                        mapRef.current.flyTo(
                            [latestPos.lat, latestPos.lng],
                            17,
                            { duration: 1 }
                        );
                    }
                }
            } catch (error) {
                console.error('Data processing error:', error);
                setDataError('Error processing GPS data');
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <Box sx={{ height: '100vh', width: '100%', position: 'relative' }}>
            {dataError && (
                <Box sx={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    zIndex: 1000,
                    backgroundColor: 'white',
                    padding: 2,
                    borderRadius: 1,
                    boxShadow: 3
                }}>
                    <Typography color="error">{dataError}</Typography>
                </Box>
            )}

            <MapContainer
                center={[6.9271, 79.8612]} // Colombo coordinates
                zoom={15}
                style={{ height: '100%', width: '100%' }}
                ref={mapRef}
                minZoom={10}
                maxBounds={SRI_LANKA_BOUNDS}
                maxBoundsViscosity={1.0}
                whenCreated={(map) => {
                    mapRef.current = map;
                    map.setMaxBounds(SRI_LANKA_BOUNDS);
                }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    noWrap={true}
                />

                {/* Vehicle Path */}
                <Polyline
                    positions={positions}
                    color="blue"
                    weight={3}
                />

                {/* Current Vehicle Position */}
                {currentPosition && (
                    <Marker
                        position={[currentPosition.lat, currentPosition.lng]}
                        icon={createVehicleIcon(currentPosition.heading)}
                    />
                )}

                {/* Trip Markers */}
                {trips.map((trip, tripIndex) => (
                    <React.Fragment key={`trip-${tripIndex}`}>
                        {trip.length > 0 && (
                            <>
                                <Marker
                                    position={[trip[0].lat, trip[0].lng]}
                                    icon={L.divIcon({
                                        className: 'trip-marker',
                                        html: '<div style="background:#4CAF50;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>'
                                    })}
                                />
                                <Marker
                                    position={[trip[trip.length-1].lat, trip[trip.length-1].lng]}
                                    icon={L.divIcon({
                                        className: 'trip-marker',
                                        html: '<div style="background:#F44336;width:12px;height:12px;border-radius:50%;border:2px solid white"></div>'
                                    })}
                                />
                            </>
                        )}
                    </React.Fragment>
                ))}
            </MapContainer>
        </Box>
    );
};

export default LiveTracking;