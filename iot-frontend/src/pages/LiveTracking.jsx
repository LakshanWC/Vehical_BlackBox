// pages/LiveTracking.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Card,
    CardContent,
    LinearProgress,
    Chip,
    Grid
} from '@mui/material';
import {
    Speed as SpeedIcon,
    LocalFireDepartment as FireIcon,
    Warning as WarningIcon,
    TrendingUp as TrendingUpIcon,
    AccessTime as TimeIcon,
    DirectionsCar as CarIcon
} from '@mui/icons-material';
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

// Speed gauge component
const SpeedGauge = ({ speed, maxSpeed = 120 }) => {
    const percentage = Math.min((speed / maxSpeed) * 100, 100);
    const isSpeeding = speed > 60;

    return (
        <Paper sx={{ p: 2, textAlign: 'center', background: 'linear-gradient(145deg, #f5f5f5, #e0e0e0)' }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SpeedIcon sx={{ mr: 1 }} /> Live Speed
            </Typography>

            <Box sx={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
                {/* Speed value */}
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center'
                }}>
                    <Typography variant="h3" fontWeight="bold" color={isSpeeding ? 'error.main' : 'primary.main'}>
                        {speed.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        km/h
                    </Typography>
                </Box>

                {/* Progress ring - simplified version */}
                <Box sx={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    border: `12px solid ${isSpeeding ? '#f44336' : '#e0e0e0'}`,
                    borderTop: `12px solid ${isSpeeding ? '#ff7961' : '#1976d2'}`,
                    borderRight: `12px solid ${isSpeeding ? '#ff7961' : '#1976d2'}`,
                    borderBottom: `12px solid ${isSpeeding ? '#f44336' : '#e0e0e0'}`,
                    borderLeft: `12px solid ${isSpeeding ? '#f44336' : '#e0e0e0'}`,
                    transform: `rotate(${45 + (percentage * 2.7)}deg)`,
                    transition: 'all 0.3s ease'
                }} />
            </Box>

            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    mt: 2,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: isSpeeding ? '#f44336' : '#4caf50',
                        borderRadius: 4
                    }
                }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption">0</Typography>
                <Typography variant="caption" color={isSpeeding ? 'error' : 'inherit'}>
                    {isSpeeding ? 'OVER LIMIT!' : '60'}
                </Typography>
                <Typography variant="caption">{maxSpeed}</Typography>
            </Box>
        </Paper>
    );
};

// Helper function to calculate distance between coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    // Return 0 if distance is too small (stationary movement)
    return distance < 0.01 ? 0 : distance;
};

const LiveTracking = () => {
    const [positions, setPositions] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [trips, setTrips] = useState([]);
    const [dataError, setDataError] = useState(null);
    const [mapType, setMapType] = useState('roadmap');
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [tripStats, setTripStats] = useState({
        distance: 0,
        avgSpeed: 0,
        duration: 0,
        startTime: null
    });
    const mapRef = useRef(null);
    const currentTripRef = useRef([]);
    const [speedTrajectory, setSpeedTrajectory] = useState([]);
    const [currentRideActive, setCurrentRideActive] = useState(false);

    const checkRideActivity = (lastUpdateTime) => {
        const now = Date.now();
        const timeDiff = now - lastUpdateTime;
        return timeDiff < 30000;
    }



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

    //process speed vilotaion
    const processSpeedViolations = (trip) => {
        const violations = trip.filter(point => {
            // Filter out stationary points and invalid coordinates
            if (!point.lat || !point.lng || point.speed <= 60) return false;

            // Check if this point is significantly different from previous points
            const recentViolations = speedTrajectory.slice(-5);
            const isDuplicate = recentViolations.some(violation =>
                Math.abs(violation.lat - point.lat) < 0.0001 &&
                Math.abs(violation.lng - point.lng) < 0.0001
            );

            return !isDuplicate;
        });

        setSpeedTrajectory(prev => {
            // Keep only violations from last 5 minutes
            const fiveMinutesAgo = Date.now() - 300000;
            const recentViolations = prev.filter(v =>
                new Date(v.timestamp).getTime() > fiveMinutesAgo
            );
            return [...recentViolations, ...violations];
        });
    };

        setSpeedTrajectory(prev => {
            // Keep only violations from last 5 minutes to prevent memory buildup
            const fiveMinutesAgo = Date.now() - 300000;
            const recentViolations = prev.filter(v =>
                new Date(v.timestamp).getTime() > fiveMinutesAgo
            );
            return [...recentViolations, ...violations];
        });
    };

    // Check for alerts in new data
    const checkForAlerts = (event) => {
        const newAlerts = [];

        // Fire detection
        if (event.fireStatus === "1") {
            newAlerts.push({ type: 'FIRE', timestamp: new Date(), severity: 'high' });
        }

        // Accident detection
        if (event.gforces) {
            const xG = parseFloat(event.gforces.X) || 0;
            const yG = parseFloat(event.gforces.Y) || 0;
            if (xG > 2.5 || yG > 3.0) {
                newAlerts.push({ type: 'ACCIDENT', timestamp: new Date(), severity: 'critical' });
            }
        }

        // Speeding detection
        if (event.speed && event.speed !== "waiting-gps") {
            const speed = parseFloat(event.speed);
            if (speed > 60) {
                newAlerts.push({
                    type: 'SPEEDING',
                    timestamp: new Date(),
                    severity: 'medium',
                    speed: speed
                });
            }
        }

        if (newAlerts.length > 0) {
            setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]); // Keep only latest 5 alerts
        }
    };

    useEffect(() => {
        const eventsRef = ref(database, 'event');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            try {
                const now = Date.now();
                const newPositions = [];
                let currentTrip = [];
                let validPoints = 0;
                let latestPoint = null;

                snapshot.forEach((childSnapshot) => {
                    const event = childSnapshot.val();

                    // Check for alerts first
                    checkForAlerts(event);

                    if (event.location && event.location.lat !== 'waiting-gps') {
                        const lat = parseFloat(event.location.lat);
                        const lng = parseFloat(event.location.lng);

                        if (isValidSriLankaCoordinate(lat, lng)) {
                            const point = {
                                lat: lat,
                                lng: lng,
                                timestamp: childSnapshot.key,
                                heading: event.heading || 0,
                                speed: event.speed && event.speed !== "waiting-gps" ? parseFloat(event.speed) : 0,
                                rawTime: new Date(childSnapshot.key).getTime()
                            };

                            latestPoint = point;
                            validPoints++;

                            // Update current speed
                            if (point.speed > 0) {
                                setCurrentSpeed(point.speed);
                            }

                            // Check if point is recent (within last 30 seconds)
                            const pointTime = new Date(point.timestamp).getTime();
                            const isRecent = (now - pointTime) < 30000;

                            if (isRecent) {
                                // Add to current trip if recent
                                currentTrip.push(point);
                                newPositions.push({ lat: point.lat, lng: point.lng });
                            }
                        }
                    }
                });

                if (validPoints === 0) {
                    setDataError('No valid GPS data found');
                    setCurrentRideActive(false);
                    setCurrentPosition(null);
                    setPositions([]);
                    setTripStats({
                        distance: 0,
                        avgSpeed: 0,
                        duration: 0,
                        startTime: null,
                        isActive: false
                    });
                    return;
                }

                // Check if ride is active based on latest point
                if (latestPoint) {
                    const isRideActive = (now - latestPoint.rawTime) < 30000;
                    setCurrentRideActive(isRideActive);

                    if (isRideActive) {
                        setCurrentPosition(latestPoint);

                        // Calculate trip statistics only for active ride
                        if (currentTrip.length > 1) {
                            const startTime = new Date(currentTrip[0].timestamp);
                            const endTime = new Date(currentTrip[currentTrip.length - 1].timestamp);
                            const durationMs = endTime - startTime;

                            // Calculate distance using only consecutive points
                            let distance = 0;
                            for (let i = 1; i < currentTrip.length; i++) {
                                const prev = currentTrip[i-1];
                                const curr = currentTrip[i];
                                // Only add distance if points are close together (avoid stationary jumps)
                                const pointDistance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
                                if (pointDistance < 1.0) { // Filter out large jumps
                                    distance += pointDistance;
                                }
                            }

                            // Calculate average speed
                            const speeds = currentTrip
                                .filter(point => point.speed > 0)
                                .map(point => point.speed);

                            const avgSpeed = speeds.length > 0
                                ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
                                : 0;

                            setTripStats({
                                distance: parseFloat(distance.toFixed(2)),
                                avgSpeed: parseFloat(avgSpeed.toFixed(1)),
                                duration: durationMs,
                                startTime: startTime,
                                isActive: true
                            });
                        }

                        // Process speed violations
                        processSpeedViolations(currentTrip);

                        // Smooth map movement
                        if (mapRef.current && latestPoint) {
                            const currentCenter = mapRef.current.getCenter();
                            const newCenter = new window.google.maps.LatLng(latestPoint.lat, latestPoint.lng);

                            // Only pan if significant movement (> 10 meters)
                            const distanceMoved = window.google.maps.geometry.spherical.computeDistanceBetween(
                                currentCenter,
                                newCenter
                            );

                            if (distanceMoved > 10) {
                                mapRef.current.panTo({ lat: latestPoint.lat, lng: latestPoint.lng });
                            }
                        }
                    } else {
                        // Clear everything when ride ends
                        setCurrentPosition(null);
                        setPositions([]);
                        setTripStats({
                            distance: 0,
                            avgSpeed: 0,
                            duration: 0,
                            startTime: null,
                            isActive: false
                        });
                        setSpeedTrajectory([]);
                    }
                }

                setPositions(newPositions);
                setDataError(null);

            } catch (error) {
                console.error('Data processing error:', error);
                setDataError('Error processing GPS data');
            }


        });

        return () => unsubscribe();
    }, []);

    // Add this function to clean up old data
    const cleanupOldData = () => {
        const now = Date.now();
        const thirtySecondsAgo = now - 30000;

        // Clean up positions older than 30 seconds
        setPositions(prev => prev.filter(pos => {
            // Assuming positions have timestamp, if not, we need to track time
            return true; // Keep all for now, adjust based on your data structure
        }));

        // Clean up speed trajectory older than 5 minutes
        setSpeedTrajectory(prev => prev.filter(violation =>
            new Date(violation.timestamp).getTime() > thirtySecondsAgo
        ));
    };

// Add this useEffect for periodic cleanup
    useEffect(() => {
        const cleanupInterval = setInterval(cleanupOldData, 10000); // Clean every 10 seconds
        return () => clearInterval(cleanupInterval);
    }, []);



    const isStationaryPoint = (currentPoint, previousPoint, threshold = 0.0001) => {
        if (!previousPoint) return false;
        const latDiff = Math.abs(currentPoint.lat - previousPoint.lat);
        const lngDiff = Math.abs(currentPoint.lng - previousPoint.lng);
        return latDiff < threshold && lngDiff < threshold;
    };

    const processSpeedTrajectoryUtil = (ridePoints) => {
        if (!ridePoints || ridePoints.length === 0) return [];
        const violations = [];
        let lastValidPoint = null;

        ridePoints.forEach(point => {
            if (point.speed && point.speed !== "waiting-gps" && parseFloat(point.speed) > 60) {
                const currentPoint = {
                    lat: parseFloat(point.location?.lat),
                    lng: parseFloat(point.location?.lng),
                    speed: parseFloat(point.speed),
                    timestamp: point.timestamp
                };

                // Skip if this is a stationary duplicate
                if (!lastValidPoint || !isStationaryPoint(currentPoint, lastValidPoint)) {
                    violations.push(currentPoint);
                    lastValidPoint = currentPoint;
                }
            }
        });

        return violations;
    }

// Update processSpeedTrajectory to avoid stationary duplicates
    export const processSpeedTrajectory = (ridePoints) => {
        if (!ridePoints || ridePoints.length === 0) return [];

        const violations = [];
        let lastValidPoint = null;

        ridePoints.forEach(point => {
            if (point.speed && point.speed !== "waiting-gps" && parseFloat(point.speed) > 60) {
                const currentPoint = {
                    lat: parseFloat(point.location?.lat),
                    lng: parseFloat(point.location?.lng),
                    speed: parseFloat(point.speed),
                    timestamp: point.timestamp
                };

                // Skip if this is a stationary duplicate
                if (!lastValidPoint || !isStationaryPoint(currentPoint, lastValidPoint)) {
                    violations.push(currentPoint);
                    lastValidPoint = currentPoint;
                }
            }
        });

        return violations;
    };

    useEffect(() => {
        if (mapRef.current && currentRideActive && currentPosition) {
            // Use requestAnimationFrame for smooth updates
            const animateMap = () => {
                if (mapRef.current && currentPosition) {
                    const currentCenter = mapRef.current.getCenter();
                    const newCenter = new window.google.maps.LatLng(
                        currentPosition.lat,
                        currentPosition.lng
                    );

                    // Smooth transition with easing
                    mapRef.current.panTo(newCenter);
                }
            };

            // Throttle map updates to prevent blinking
            const mapUpdateTimer = setTimeout(animateMap, 1000); // Update every second
            return () => clearTimeout(mapUpdateTimer);
        }
    }, [currentPosition, currentRideActive]);

    const handleMapLoad = (map) => {
    mapRef.current = map;

    // Add smooth panning options
    map.setOptions({
        gestureHandling: 'cooperative',
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: true,
        fullscreenControl: false
    });
};

    const markers = [];

    if (currentRideActive && currentPosition) {
        // Current Vehicle Position - ONLY show when ride is active
        markers.push({
            position: { lat: currentPosition.lat, lng: currentPosition.lng },
            title: `Current Position - ${currentSpeed} km/h`,
            icon: createVehicleIcon(currentPosition.heading || 0)
        });

        // Speed Violation Markers - Only show for current active ride
        speedTrajectory.forEach((violation) => {
            // Only show violations from current ride session
            const violationTime = new Date(violation.timestamp).getTime();
            const currentTime = Date.now();
            if (currentTime - violationTime < 30000) { // Only last 30 seconds
                markers.push({
                    position: { lat: violation.lat, lng: violation.lng },
                    title: `Speed Violation: ${violation.speed} km/h`,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
                            <circle cx="8" cy="8" r="6" fill="#FF6B00" stroke="white" stroke-width="2"/>
                            <text x="8" y="10" text-anchor="middle" fill="white" font-size="8" font-weight="bold">
                                ${Math.round(violation.speed)}
                            </text>
                        </svg>
                    `),
                        scaledSize: new window.google.maps.Size(16, 16),
                        anchor: new window.google.maps.Point(8, 8)
                    }
                });
            }
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

    // Format duration for display
    const formatDuration = (ms) => {
        if (!ms) return '00:00:00';
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor(ms / (1000 * 60 * 60));

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0')
        ].join(':');
    };

    return (
        <Box sx={{ height: '100vh', width: '100%', position: 'relative', display: 'flex' }}>
            {/* Sidebar with metrics */}
            <Paper sx={{
                width: 320,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                borderRadius: 0,
                boxShadow: 3,
                zIndex: 1000
            }}>
                {currentRideActive ? (
                    <>
                        {/* Speed Gauge */}
                        <SpeedGauge speed={currentSpeed} />

                        {/* Trip Statistics - ONLY show when ride is active */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <TrendingUpIcon sx={{ mr: 1 }} /> Live Trip Statistics
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                            {tripStats.distance}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            km
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                            {tripStats.avgSpeed}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            km/h avg
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Grid item xs={12}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 1
                                    }}>
                                        <TimeIcon color="action" />
                                        <Typography variant="h6">
                                            {formatDuration(tripStats.duration)}
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* Active Alerts */}
                        {alerts.length > 0 && (
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                    <WarningIcon sx={{ mr: 1, color: 'warning.main' }} /> Active Alerts
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {alerts.map((alert, index) => (
                                        <Chip
                                            key={index}
                                            icon={alert.type === 'FIRE' ? <FireIcon /> : <WarningIcon />}
                                            label={`${alert.type} - ${new Date(alert.timestamp).toLocaleTimeString()}`}
                                            color={
                                                alert.severity === 'critical' ? 'error' :
                                                    alert.severity === 'high' ? 'warning' : 'info'
                                            }
                                            variant="filled"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        )}

                        {/* Vehicle Status - ONLY show when ride is active */}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <CarIcon sx={{ mr: 1 }} /> Vehicle Status
                            </Typography>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Connection:</Typography>
                                <Chip
                                    label="Live"
                                    size="small"
                                    color="success"
                                    variant="outlined"
                                />
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                <Typography variant="body2">Last update:</Typography>
                                <Typography variant="body2">
                                    {currentPosition ? new Date(currentPosition.timestamp).toLocaleTimeString() : 'N/A'}
                                </Typography>
                            </Box>
                        </Paper>
                    </>
                ) : (
                    /* Show this when no active ride */
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Active Ride
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vehicle is currently stationary.
                            Trip statistics will appear when a ride begins.
                        </Typography>
                    </Paper>
                )}
            </Paper>


            {/* Map Area */}
            <Box sx={{ flex: 1, position: 'relative' }}>
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
                    center={currentRideActive && currentPosition ?
                {lat : currentPosition.lat, lng: currentPosition.lng} :
                {lat: 6.9271, lng: 79.8612}
                }
                    zoom={currentRideActive ? 15 : 10}
                    path={currentRideActive ? positions : []}
                    markers={markers}
                    onMapLoad={handleMapLoad}
                    mapTypeId={mapType}
                    style={{ height: '100%', width: '100%' }}
                />
            </Box>
        </Box>
    );
};

export default LiveTracking;