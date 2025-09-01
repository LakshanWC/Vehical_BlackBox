import { useState } from 'react';
import {
    Box, Paper, Typography, Collapse, Divider, Avatar, Chip, Grid, Button
} from '@mui/material';
import {
    Warning as WarningIcon,
    Speed as SpeedIcon,
    DirectionsCar as CarIcon,
    Report as CrashIcon,
    Sync as RolloverIcon,
    Directions as DirectionIcon,
    LocalFireDepartment as FireIcon,
    Videocam as VideoIcon
} from '@mui/icons-material';
import MapView from './MapView';
import { Marker, Popup } from 'react-leaflet';
import { divIcon } from 'leaflet';
import GoogleMapWrapper from "../components/GoogleMapWrapper";

const AlertItem = ({ alert }) => {
    const [expanded, setExpanded] = useState(false);
    const [videoUrl, setVideoUrl] = useState(null);
    const [loadingVideo, setLoadingVideo] = useState(false);
    const [videoError, setVideoError] = useState(null);

    const getSpeedColor = (speed) => {
        if (speed >= 80) return 'red';
        if (speed >= 70) return 'orange';
        if (speed >= 60) return 'yellow';
        return 'green';
    };
    const speeds = alert.speedTrajectory?.map(p => parseFloat(p.speed)) || [];
    const highestSpeed = speeds.length ? Math.max(...speeds) : null;
    const avgSpeed = speeds.length
        ? (speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(2)
        : null;

    const fetchVideoClip = async () => {
        setLoadingVideo(true);
        setVideoError(null);
        setVideoUrl(null);

        try {
            const generateResponse = await fetch('http://localhost:8099/cam-api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    deviceId: alert.deviceId,
                    timestamp: alert.timestamp,
                    location: alert.location
                })
            });

            if (!generateResponse.ok) {
                throw new Error(`Video generation failed with status ${generateResponse.status}`);
            }

            const result = await generateResponse.text();
            const match = result.match(/Video saved as: (.+\.mp4)/);
            if (!match) {
                throw new Error('Could not parse video filename from response');
            }

            const filename = match[1].trim();
            const videoStreamUrl = `http://localhost:8099/cam-api/video/${filename}`;

            const videoCheck = await fetch(videoStreamUrl);
            if (!videoCheck.ok) {
                throw new Error('Generated video not found on server');
            }

            setVideoUrl(videoStreamUrl);
        } catch (error) {
            console.error('Video error:', error);
            setVideoError(error.message || 'Failed to load video');
        } finally {
            setLoadingVideo(false);
        }
    };

    const formatUTCTimestamp = (isoString) => {
        if (!isoString) return { date: 'N/A', time: 'N/A' };

        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return { date: 'N/A', time: 'N/A' };

            return {
                date: date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    timeZone: 'UTC'
                }),
                time: date.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    timeZone: 'UTC'
                })
            };
        } catch {
            return { date: 'N/A', time: 'N/A' };
        }
    };

    const analyzeImpact = () => {
        if (!alert.gforces) return { direction: 'Unknown', type: 'Unknown' };

        try {
            const xG = parseFloat(alert.gforces.X);
            const yG = parseFloat(alert.gforces.Y);
            const zG = parseFloat(alert.gforces.Z);

            let direction;
            const maxForce = Math.max(Math.abs(xG), Math.abs(yG), Math.abs(zG));

            if (maxForce === Math.abs(xG)) {
                direction = xG > 0 ? 'Right Side' : 'Left Side';
            } else if (maxForce === Math.abs(yG)) {
                direction = yG > 0 ? 'Front' : 'Rear';
            } else {
                direction = zG > 0 ? 'Underneath' : 'Top';
            }

            let type = 'Collision';
            if (zG < 0.3 || zG > 2.0) {
                if (Math.abs(xG) > 2.5 || Math.abs(yG) > 3.0) {
                    type = 'Rollover';
                } else {
                    type = zG > 1.0 ? 'Jump/Lift' : 'Fall/Drop';
                }
            }

            return { direction, type };
        } catch {
            return { direction: 'Unknown', type: 'Unknown' };
        }
    };

    const getVehicleStatus = () => {
        if (!alert.gyro) return 'Normal';

        try {
            const xAngle = parseFloat(alert.gyro.X);
            const yAngle = parseFloat(alert.gyro.Y);

            if (Math.abs(xAngle) > 90 || Math.abs(yAngle) > 90) {
                return 'Upside Down';
            } else if (Math.abs(xAngle) > 60 || Math.abs(yAngle) > 60) {
                return 'Rolled Over';
            } else if (Math.abs(xAngle) > 45 || Math.abs(yAngle) > 45) {
                return 'Tilted';
            }
            return 'Normal';
        } catch {
            return 'Unknown';
        }
    };

    const renderSpeedTrajectory = () => {
        if (alert.classification !== 'SPEEDING' || !alert.speedTrajectory) return null;

        const positions = alert.speedTrajectory.map(point => ({
            lat: parseFloat(point.lat),
            lng: parseFloat(point.lng),
            speed: parseFloat(point.speed)
        }));

        return (
            <>
                {positions.map((point, index) => {
                    const color = getSpeedColor(point.speed);
                    const isStart = index === 0;
                    const isEnd = index === positions.length - 1;

                    return (
                        <Marker
                            key={index}
                            position={[point.lat, point.lng]}
                            icon={divIcon({
                                className: `speed-point-${index}`,
                                html: `<div style="
                                    background: ${color};
                                    width: ${isStart || isEnd ? '20px' : '10px'};
                                    height: ${isStart || isEnd ? '20px' : '10px'};
                                    border-radius: 50%;
                                    border: 2px solid white;
                                    transform: translate(-6px, -6px);
                                "></div>`
                            })}
                        >
                            <Popup>
                                {isStart ? 'Start' : isEnd ? 'End' : 'Point ' + (index + 1)}
                                <br />
                                Speed: {point.speed} km/h
                            </Popup>
                        </Marker>
                    );
                })}
            </>
        );
    };

    const { direction, type } = analyzeImpact();
    const vehicleStatus = getVehicleStatus();
    const formattedTime = formatUTCTimestamp(alert.timestamp);
    const isSpeedingAlert = alert.classification === 'SPEEDING';
    const isFireAlert = alert.classification === 'FIRE';
    const isSimpleAlert = isSpeedingAlert || isFireAlert;

    const renderVideoSection = () => (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Button
                variant="contained"
                startIcon={<VideoIcon />}
                onClick={fetchVideoClip}
                disabled={loadingVideo}
                sx={{ mb: 2 }}
            >
                {loadingVideo ? 'Generating...' : 'View Incident Video'}
            </Button>

            {videoError && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {videoError}
                </Typography>
            )}

            {videoUrl && (
                <Box sx={{ width: '100%', maxWidth: '600px' }}>
                    <video
                        controls
                        autoPlay
                        muted
                        style={{
                            width: '100%',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            backgroundColor: '#000'
                        }}
                        key={videoUrl}
                    >
                        <source src={videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                    <Typography variant="caption" display="block" textAlign="center" mt={1}>
                        <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                            Open video in new tab
                        </a>
                    </Typography>
                </Box>
            )}
        </Box>
    );

    const renderSimpleAlert = () => (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        {isFireAlert ? (
                            <FireIcon color="error" sx={{ mr: 1 }} />
                        ) : (
                            <SpeedIcon color="secondary" sx={{ mr: 1 }} />
                        )}
                        {isFireAlert ? 'Fire Alert Details' : 'Speed Violation Details'}
                    </Typography>

                    {isFireAlert && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FireIcon color="error" sx={{ mr: 1 }} />
                            <Typography variant="body1">
                                <strong>Severity:</strong> {alert.fireSeverity || 'High'} risk
                            </Typography>
                        </Box>
                    )}

                    {/* === Show highest & average speeds if speeding */}
                    {isSpeedingAlert && (
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="body1">
                                <strong>Highest Speed:</strong> {highestSpeed ? `${highestSpeed} km/h` : '--'}
                            </Typography>
                            <Typography variant="body1">
                                <strong>Average Speed:</strong> {avgSpeed ? `${avgSpeed} km/h` : '--'}
                            </Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <SpeedIcon color="info" sx={{ mr: 1 }} />
                        <Typography variant="body1">
                            <strong>Current Speed:</strong>{' '}
                            {alert.speed === 'waiting-gps' ? 'GPS Connecting' : `${alert.speed || '--'} km/h`}
                        </Typography>
                    </Box>

                    {alert.location && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="h6" gutterBottom>
                                Location:{' '}
                                {alert.location.lat === 'waiting-gps'
                                    ? 'GPS Connecting'
                                    : `${alert.location.lat}, ${alert.location.lng}`}
                            </Typography>

                            {alert.location.lat !== 'waiting-gps' ? (
                                // In the renderSimpleAlert function, update the map section:
                                <Box sx={{ height: '600px', width: '1000px', borderRadius: 1, overflow: 'hidden' }}>
                                    <GoogleMapWrapper
                                        center={{
                                            lat: parseFloat(alert.location.lat),
                                            lng: parseFloat(alert.location.lng)
                                        }}
                                        markers={[
                                            {
                                                position: {
                                                    lat: parseFloat(alert.location.lat),
                                                    lng: parseFloat(alert.location.lng)
                                                },
                                                infoWindow: `Current Speed: ${alert.speed} km/h`
                                            },
                                            // Add speed violation trajectory markers
                                            ...(alert.speedTrajectory || []).map((point, index) => ({
                                                position: {
                                                    lat: parseFloat(point.lat),
                                                    lng: parseFloat(point.lng)
                                                },
                                                title: `Speed: ${point.speed} km/h`,
                                                icon: {
                                                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
                                                        <circle cx="7" cy="7" r="5" fill="${point.speed > 80 ? '#ff0000' : point.speed > 70 ? '#ff6b00' : '#ffd700'}" stroke="white" stroke-width="1"/>
                                                        <text x="7" y="9" text-anchor="middle" fill="white" font-size="5" font-weight="bold">
                                                            ${Math.round(point.speed)}
                                                        </text>
                                                    </svg>
                    `),
                                                    scaledSize: new window.google.maps.Size(14, 14),
                                                    anchor: new window.google.maps.Point(7, 7)
                                                }
                                            }))
                                        ]}
                                        zoom={15}
                                    />
                                </Box>
                            ) : (
                                <Typography color="error" sx={{ py: 2 }}>
                                    <SpeedIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                                    Waiting for GPS signal...
                                </Typography>
                            )}

                            {renderVideoSection()}
                        </Box>
                    )}
                </Paper>
            </Grid>
        </Grid>
    );

    return (
        <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    bgcolor: alert.classification === 'ACCIDENT' ? '#ffeeee' :
                        alert.classification === 'BUMP' ? '#fff8e1' : '#f5f5f5'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Avatar sx={{
                    bgcolor: alert.classification === 'ACCIDENT' ? 'error.main' :
                        alert.classification === 'BUMP' ? 'warning.main' :
                            alert.classification === 'SPEEDING' ? 'secondary.main' :
                                alert.classification === 'FIRE' ? 'error.dark' : 'grey.500',
                    mr: 2
                }}>
                    {alert.classification === 'ACCIDENT' ? <WarningIcon /> :
                        alert.classification === 'BUMP' ? <SpeedIcon /> :
                            alert.classification === 'SPEEDING' ? <SpeedIcon /> :
                                alert.classification === 'FIRE' ? <FireIcon /> : null}
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" component="div">
                        {alert.classification} Detected
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        Device: {alert.deviceId} • {formattedTime.date} at {formattedTime.time}
                    </Typography>
                </Box>
            </Box>

            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ p: 3 }}>
                    {isSimpleAlert ? (
                        renderSimpleAlert()
                    ) : (
                        <>
                            <Grid container spacing={3} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Paper sx={{ p: 2, height: '100%' }}>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CrashIcon color="error" sx={{ mr: 1 }} /> Impact Analysis
                                        </Typography>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <SpeedIcon color="info" sx={{ mr: 1 }} />
                                            <Typography variant="body1">
                                                <strong>Speed:</strong> {alert.speed || '--'} km/h
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <DirectionIcon color="info" sx={{ mr: 1 }} />
                                            <Typography variant="body1">
                                                <strong>Direction:</strong> {direction} impact
                                            </Typography>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <WarningIcon color="info" sx={{ mr: 1 }} />
                                            <Typography variant="body1">
                                                <strong>Type:</strong> {type}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                </Grid>

                                <Grid item xs={6}>
                                    <Paper sx={{ p: 2, height: '100%' }}>
                                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                            <CarIcon color="info" sx={{ mr: 1 }} /> Vehicle Status
                                        </Typography>

                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            color: vehicleStatus === 'Normal' ? 'success.main' :
                                                vehicleStatus.includes('Upside') ? 'error.main' :
                                                    'warning.main',
                                            mb: 1
                                        }}>
                                            {vehicleStatus.includes('Upside') ? <RolloverIcon sx={{ mr: 1 }} /> :
                                                vehicleStatus.includes('Rolled') ? <RolloverIcon sx={{ mr: 1 }} /> :
                                                    <CarIcon sx={{ mr: 1 }} />}
                                            <Typography variant="body1">
                                                <strong>Status:</strong> {vehicleStatus}
                                            </Typography>
                                        </Box>

                                        <Typography variant="body2" sx={{ mt: 2 }}>
                                            <strong>Orientation:</strong>
                                        </Typography>
                                        <Typography variant="body2">
                                            • Pitch (Front/Rear tilt): {alert.gyro?.X || '--'}°
                                        </Typography>
                                        <Typography variant="body2">
                                            • Roll (Side tilt): {alert.gyro?.Y || '--'}°
                                        </Typography>
                                        <Typography variant="body2">
                                            • Yaw (Rotation): {alert.gyro?.Z || '--'}°
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>

                            <Paper sx={{ p: 2, mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    Force Measurements
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={4}>
                                        <Typography variant="body1">
                                            <strong>Lateral (X):</strong> {alert.gforces?.X || '--'}g
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Side impacts
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body1">
                                            <strong>Longitudinal (Y):</strong> {alert.gforces?.Y || '--'}g
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Front/Rear impacts
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Typography variant="body1">
                                            <strong>Vertical (Z):</strong> {alert.gforces?.Z || '--'}g
                                        </Typography>
                                        <Typography variant="caption" display="block" color="text.secondary">
                                            Up/Down forces
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>

                            {alert.location?.lat && (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Incident Location: {alert.location.lat}, {alert.location.lng}
                                    </Typography>
                                    <Box sx={{ height: '400px', borderRadius: 1, overflow: 'hidden' }}>
                                        <MapView
                                            center={[parseFloat(alert.location.lat), parseFloat(alert.location.lng)]}
                                            markers={[{
                                                position: [parseFloat(alert.location.lat), parseFloat(alert.location.lng)],
                                                color: alert.classification === 'ACCIDENT' ? 'red' : 'orange',
                                                size: 30,
                                                popup: `${alert.classification} - ${direction} impact`
                                            }]}
                                            zoom={15}
                                        />
                                    </Box>
                                    {renderVideoSection()}
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default AlertItem;