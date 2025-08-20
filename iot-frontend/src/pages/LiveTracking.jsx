// pages/LiveTracking.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import GoogleMapWrapper from '../components/GoogleMapWrapper';

// Create vehicle icon with heading
const createVehicleIcon = (heading) => {
    return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#007bff" transform="rotate(${heading} 12 12)">
        <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
      </svg>
    `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
    };
};

const LiveTracking = () => {
    const [positions, setPositions] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [trips, setTrips] = useState([]);
    const [dataError, setDataError] = useState(null);
    const [mapType, setMapType] = useState('roadmap');
    const mapRef = useRef(null);

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
                            newPositions.push({ lat: point.lat, lng: point.lng });
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
                    if (mapRef.current && latestPos) {
                        mapRef.current.panTo({ lat: latestPos.lat, lng: latestPos.lng });
                        mapRef.current.setZoom(18);
                    }
                }
            } catch (error) {
                console.error('Data processing error:', error);
                setDataError('Error processing GPS data');
            }
        });

        return () => unsubscribe();
    }, []);

    const handleMapLoad = (map) => {
        mapRef.current = map;
    };

    const markers = [];

    // Current Vehicle Position
    if (currentPosition) {
        markers.push({
            position: { lat: currentPosition.lat, lng: currentPosition.lng },
            title: 'Current Position',
            icon: createVehicleIcon(currentPosition.heading)
        });
    }

    // Trip Markers
    trips.forEach((trip, tripIndex) => {
        if (trip.length > 0) {
            // Start marker
            markers.push({
                position: { lat: trip[0].lat, lng: trip[0].lng },
                title: `Trip ${tripIndex + 1} Start`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="#4CAF50" stroke="white" stroke-width="2"/>
            </svg>
          `),
                    scaledSize: new window.google.maps.Size(16, 16),
                    anchor: new window.google.maps.Point(8, 8)
                }
            });

            // End marker
            markers.push({
                position: { lat: trip[trip.length-1].lat, lng: trip[trip.length-1].lng },
                title: `Trip ${tripIndex + 1} End`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="6" fill="#F44336" stroke="white" stroke-width="2"/>
            </svg>
          `),
                    scaledSize: new window.google.maps.Size(16, 16),
                    anchor: new window.google.maps.Point(8, 8)
                }
            });
        }
    });

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

            <Box sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1000,
                backgroundColor: 'white',
                padding: 1,
                borderRadius: 1,
                boxShadow: 3,
                display: 'flex',
                gap: 1
            }}>
                <button
                    onClick={() => setMapType('roadmap')}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: mapType === 'roadmap' ? '#1976d2' : '#f5f5f5',
                        color: mapType === 'roadmap' ? 'white' : 'black',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Normal
                </button>
                <button
                    onClick={() => setMapType('satellite')}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: mapType === 'satellite' ? '#1976d2' : '#f5f5f5',
                        color: mapType === 'satellite' ? 'white' : 'black',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Satellite
                </button>
            </Box>

            <GoogleMapWrapper
                center={currentPosition ? { lat: currentPosition.lat, lng: currentPosition.lng } : { lat: 6.9271, lng: 79.8612 }}
                zoom={15}
                path={positions}
                markers={markers}
                onMapLoad={handleMapLoad}
                mapTypeId={mapType}
                style={{ height: '600px', width: '100%' }}
            />
        </Box>
    );
};

export default LiveTracking;