// pages/LiveTracking.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Grid,
    LinearProgress
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

// Constants
const RIDE_TIMEOUT_MS = 30000; // 30 seconds
const STATIONARY_THRESHOLD = 0.0001; // ~11 meters
const DATA_RETENTION_MS = 300000; // 5 minutes for data cleanup

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

// Helper function to calculate distance between coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance < 0.01 ? 0 : distance;
};

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

// Check if point is stationary
const isStationaryPoint = (point1, point2, threshold = STATIONARY_THRESHOLD) => {
    if (!point1 || !point2) return false;
    const latDiff = Math.abs(point1.lat - point2.lat);
    const lngDiff = Math.abs(point1.lng - point2.lng);
    return latDiff < threshold && lngDiff < threshold;
};

// Filter out stationary points
const filterStationaryPoints = (points) => {
    if (points.length < 2) return points;

    const filtered = [points[0]];

    for (let i = 1; i < points.length; i++) {
        const current = points[i];
        const previous = filtered[filtered.length - 1];

        if (!isStationaryPoint(current, previous)) {
            filtered.push(current);
        }
    }

    return filtered;
};

const LiveTracking = () => {
    const [currentRide, setCurrentRide] = useState([]);
    const [rideHistory, setRideHistory] = useState([]);
    const [currentPosition, setCurrentPosition] = useState(null);
    const [dataError, setDataError] = useState(null);
    const [mapType, setMapType] = useState('roadmap');
    const [currentSpeed, setCurrentSpeed] = useState(0);
    const [alerts, setAlerts] = useState([]);
    const [tripStats, setTripStats] = useState({
        distance: 0,
        avgSpeed: 0,
        duration: 0,
        startTime: null,
        isActive: false
    });
    const [speedTrajectory, setSpeedTrajectory] = useState([]);
    const mapRef = useRef(null);

    // Check for alerts
    const checkForAlerts = (event) => {
        const newAlerts = [];
        if (event.fireStatus === "1") {
            newAlerts.push({ type: 'FIRE', timestamp: new Date(), severity: 'high' });
        }
        if (event.gforces) {
            const xG = parseFloat(event.gforces.X) || 0;
            const yG = parseFloat(event.gforces.Y) || 0;
            if (xG > 2.5 || yG > 3.0) {
                newAlerts.push({ type: 'ACCIDENT', timestamp: new Date(), severity: 'critical' });
            }
        }
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
            setAlerts(prev => [...newAlerts, ...prev.slice(0, 4)]);
        }
    };

    // Process ride data with proper segmentation
    const processRideData = (events) => {
        const rides = [];
        let currentRideEvents = [];
        let lastTimestamp = null;

        // Sort events by timestamp
        events.sort((a, b) => a.rawTime - b.rawTime);

        events.forEach(event => {
            const eventTime = event.rawTime;

            // Check if this starts a new ride (30+ second gap)
            if (lastTimestamp !== null && (eventTime - lastTimestamp > RIDE_TIMEOUT_MS)) {
                // Save current ride if it has valid data
                if (currentRideEvents.length >= 2) {
                    const filteredRide = filterStationaryPoints(currentRideEvents);
                    if (filteredRide.length >= 2) {
                        rides.push(filteredRide);
                    }
                }
                currentRideEvents = [];
            }

            // Add valid GPS points to current ride
            if (event.location && event.location.lat !== 'waiting-gps') {
                const lat = parseFloat(event.location.lat);
                const lng = parseFloat(event.location.lng);

                if (isValidSriLankaCoordinate(lat, lng)) {
                    currentRideEvents.push({
                        lat,
                        lng,
                        timestamp: event.timestamp,
                        rawTime: event.rawTime,
                        speed: event.speed && event.speed !== "waiting-gps" ?
                            parseFloat(event.speed) : 0,
                        heading: event.heading || 0
                    });
                }
            }

            lastTimestamp = eventTime;
        });

        // Add the final ride
        if (currentRideEvents.length >= 2) {
            const filteredRide = filterStationaryPoints(currentRideEvents);
            if (filteredRide.length >= 2) {
                rides.push(filteredRide);
            }
        }

        return rides;
    };

    // Calculate trip statistics
    const calculateTripStats = (ride) => {
        if (!ride || ride.length < 2) {
            return {
                distance: 0,
                avgSpeed: 0,
                duration: 0,
                startTime: null,
                isActive: false
            };
        }

        const startTime = new Date(ride[0].timestamp);
        const endTime = new Date(ride[ride.length - 1].timestamp);
        const durationMs = endTime - startTime;

        let distance = 0;
        const speeds = [];

        for (let i = 1; i < ride.length; i++) {
            const prev = ride[i-1];
            const curr = ride[i];

            const pointDistance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
            if (pointDistance < 1.0) {
                distance += pointDistance;
            }

            if (curr.speed > 0) {
                speeds.push(curr.speed);
            }
        }

        const avgSpeed = speeds.length > 0
            ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
            : 0;

        return {
            distance: parseFloat(distance.toFixed(2)),
            avgSpeed: parseFloat(avgSpeed.toFixed(1)),
            duration: durationMs,
            startTime: startTime,
            isActive: true
        };
    };

    // Process speed violations
    const processSpeedViolations = (ride) => {
        if (!ride) return;

        const violations = ride
            .filter(point => point.speed > 60)
            .map(point => ({
                lat: point.lat,
                lng: point.lng,
                speed: point.speed,
                timestamp: point.timestamp
            }));

        setSpeedTrajectory(prev => {
            const fiveMinutesAgo = Date.now() - DATA_RETENTION_MS;
            const recentViolations = prev.filter(v =>
                new Date(v.timestamp).getTime() > fiveMinutesAgo
            );
            return [...recentViolations, ...violations];
        });
    };

    // Clean up old data
    const cleanupOldData = () => {
        const now = Date.now();
        setSpeedTrajectory(prev => prev.filter(violation =>
            new Date(violation.timestamp).getTime() > now - DATA_RETENTION_MS
        ));
        setAlerts(prev => prev.filter(alert =>
            new Date(alert.timestamp).getTime() > now - DATA_RETENTION_MS
        ));
    };

    // Handle map load
    const handleMapLoad = (map) => {
        mapRef.current = map;
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

    useEffect(() => {
        const eventsRef = ref(database, 'event');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            try {
                const now = Date.now();
                const allEvents = [];

                // Collect all events
                snapshot.forEach((childSnapshot) => {
                    const event = childSnapshot.val();
                    checkForAlerts(event);

                    allEvents.push({
                        ...event,
                        timestamp: childSnapshot.key,
                        rawTime: new Date(childSnapshot.key).getTime()
                    });
                });

                // Process rides with proper segmentation
                const rides = processRideData(allEvents);

                if (rides.length === 0) {
                    setDataError('No valid ride data found');
                    setCurrentRide([]);
                    setCurrentPosition(null);
                    setTripStats({
                        distance: 0,
                        avgSpeed: 0,
                        duration: 0,
                        startTime: null,
                        isActive: false
                    });
                    return;
                }

                // Set current ride (most recent)
                const currentRideData = rides[rides.length - 1];
                setCurrentRide(currentRideData);
                setRideHistory(rides.slice(0, -1));

                // Set current position (last point of current ride)
                const latestPoint = currentRideData[currentRideData.length - 1];
                setCurrentPosition(latestPoint);

                if (latestPoint.speed > 0) {
                    setCurrentSpeed(latestPoint.speed);
                }

                // Check if ride is active (last point within 30 seconds)
                const isRideActive = (now - latestPoint.rawTime) < RIDE_TIMEOUT_MS;

                // Calculate trip statistics
                const stats = calculateTripStats(currentRideData);
                setTripStats({
                    ...stats,
                    isActive: isRideActive
                });

                // Process speed violations
                if (isRideActive) {
                    processSpeedViolations(currentRideData);
                }

                setDataError(null);

            } catch (error) {
                console.error('Data processing error:', error);
                setDataError('Error processing GPS data');
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const cleanupInterval = setInterval(cleanupOldData, 10000);
        return () => clearInterval(cleanupInterval);
    }, []);

    useEffect(() => {
        if (mapRef.current && tripStats.isActive && currentPosition) {
            const animateMap = () => {
                if (mapRef.current && currentPosition) {
                    mapRef.current.panTo({
                        lat: currentPosition.lat,
                        lng: currentPosition.lng
                    });
                }
            };
            const mapUpdateTimer = setTimeout(animateMap, 1000);
            return () => clearTimeout(mapUpdateTimer);
        }
    }, [currentPosition, tripStats.isActive]);

    const markers = [];
    let mapPath = [];

    if (tripStats.isActive && currentRide.length > 0) {
        // Only show path for current active ride (filtered stationary points)
        mapPath = currentRide.map(point => ({ lat: point.lat, lng: point.lng }));

        // Add vehicle marker
        markers.push({
            position: { lat: currentPosition.lat, lng: currentPosition.lng },
            title: `Current Position - ${currentSpeed} km/h`,
            icon: createVehicleIcon(currentPosition.heading || 0)
        });

        // Add speed violation markers (only from current ride)
        speedTrajectory.forEach((violation) => {
            const violationTime = new Date(violation.timestamp).getTime();
            const currentTime = Date.now();
            if (currentTime - violationTime < DATA_RETENTION_MS) {
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
            <Paper sx={{ width: 320, p: 2, display: 'flex', flexDirection: 'column', gap: 2, borderRadius: 0, boxShadow: 3, zIndex: 1000 }}>
                {tripStats.isActive ? (
                    <>
                        <SpeedGauge speed={currentSpeed} />
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
                                        <Typography variant="body2" color="text.secondary">km</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h4" color="primary" fontWeight="bold">
                                            {tripStats.avgSpeed}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">km/h avg</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                        <TimeIcon color="action" />
                                        <Typography variant="h6">{formatDuration(tripStats.duration)}</Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
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
                                            color={alert.severity === 'critical' ? 'error' : alert.severity === 'high' ? 'warning' : 'info'}
                                            variant="filled"
                                            size="small"
                                        />
                                    ))}
                                </Box>
                            </Paper>
                        )}
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                <CarIcon sx={{ mr: 1 }} /> Vehicle Status
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Connection:</Typography>
                                <Chip label="Live" size="small" color="success" variant="outlined" />
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
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <CarIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary" gutterBottom>No Active Ride</Typography>
                        <Typography variant="body2" color="text.secondary">
                            Vehicle is currently stationary. Trip statistics will appear when a ride begins.
                        </Typography>
                    </Paper>
                )}
            </Paper>

            <Box sx={{ flex: 1, position: 'relative' }}>
                {dataError && (
                    <Box sx={{ position: 'absolute', top: 10, left: 10, zIndex: 1000, backgroundColor: 'white', padding: 2, borderRadius: 1, boxShadow: 3 }}>
                        <Typography color="error">{dataError}</Typography>
                    </Box>
                )}
                <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 1000, backgroundColor: 'white', padding: 1, borderRadius: 1, boxShadow: 3, display: 'flex', gap: 1 }}>
                    <button onClick={() => setMapType('roadmap')} style={{ padding: '5px 10px', backgroundColor: mapType === 'roadmap' ? '#1976d2' : '#f5f5f5', color: mapType === 'roadmap' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}>Normal</button>
                    <button onClick={() => setMapType('satellite')} style={{ padding: '5px 10px', backgroundColor: mapType === 'satellite' ? '#1976d2' : '#f5f5f5', color: mapType === 'satellite' ? 'white' : 'black', border: '1px solid #ccc', borderRadius: '3px', cursor: 'pointer' }}>Satellite</button>
                </Box>
                <GoogleMapWrapper
                    center={tripStats.isActive && currentPosition ?
                        {lat: currentPosition.lat, lng: currentPosition.lng} :
                        {lat: 6.9271, lng: 79.8612}}
                    zoom={tripStats.isActive ? 15 : 10}
                    path={mapPath} // Only shows current active ride's path
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