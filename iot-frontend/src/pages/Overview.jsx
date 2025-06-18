import React from 'react';
import {
    Box, Paper, Typography, Grid, IconButton,
    Chip, Divider, Avatar, List, ListItem,
    ListItemText, ListItemAvatar // Added missing import
} from '@mui/material';
import {
    PlayCircleFilled as PlayIcon,
    Warning as WarningIcon,
    LocalFireDepartment as FireIcon,
    Speed as SpeedIcon,
    LocationOn as MapIcon,
    AccessTime as TimeIcon
} from '@mui/icons-material';

// Enhanced mock data
const mockIncidents = {
    accidents: [{
        id: 1,
        type: "accident",
        timestamp: new Date('2023-06-15T14:30:00'),
        location: "Colombo - Galle Road (Near Hilton)",
        speed: 72,
        severity: "high",
        coordinates: { lat: 6.9271, lng: 79.8612 },
        duration: "0:12",
        impactForce: "7.2G",
        videoUrl: "#"
    }],
    fires: [{
        id: 2,
        type: "fire",
        timestamp: new Date('2023-06-15T11:45:00'),
        location: "Kandy - Central Market",
        temperature: 85,
        severity: "critical",
        coordinates: { lat: 7.2906, lng: 80.6337 },
        smokeLevel: "high",
        videoUrl: "#"
    }],
    speeding: [{
        id: 3,
        type: "speeding",
        timestamp: new Date('2023-06-15T09:20:00'),
        location: "Southern Expressway KM 102",
        speed: 118,
        speedLimit: 100,
        severity: "medium",
        coordinates: { lat: 6.8224, lng: 80.0415 },
        overspeedDuration: "2:15",
        videoUrl: "#"
    }]
};

const Overview = () => {
    return (
        <Box sx={{ p: 3 }}>
            {/* Accident Banner */}
            <IncidentBanner
                type="accident"
                icon={<WarningIcon color="error" />}
                incidents={mockIncidents.accidents}
                color="error"
            />

            {/* Fire Banner */}
            <IncidentBanner
                type="fire"
                icon={<FireIcon color="warning" />}
                incidents={mockIncidents.fires}
                color="warning"
            />

            {/* Speeding Banner */}
            <IncidentBanner
                type="speeding"
                icon={<SpeedIcon color="info" />}
                incidents={mockIncidents.speeding}
                color="info"
            />
        </Box>
    );
};

// Reusable Incident Banner Component
const IncidentBanner = ({ type, icon, incidents, color }) => {
    const title = type === 'accident' ? 'Recent Accidents' :
        type === 'fire' ? 'Fire Incidents' : 'Speeding Violations';

    return (
        <Paper sx={{
            mb: 4,
            borderLeft: `6px solid`,
            borderColor: `${color}.main`,
            p: 3,
            position: 'relative'
        }}>
            {/* Banner Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {icon}
                <Typography variant="h6" sx={{ ml: 1 }}>
                    {title}
                </Typography>
                <Chip
                    label={incidents[0].severity}
                    size="small"
                    color={color}
                    sx={{ ml: 2 }}
                />
            </Box>

            <Grid container spacing={3}>
                {/* Left Column - Map & Video */}
                <Grid item xs={5}>
                    <MapPreview
                        location={incidents[0].location}
                        coordinates={incidents[0].coordinates}
                    />
                    <VideoThumbnail />
                </Grid>

                {/* Right Column - Details */}
                <Grid item xs={7}>
                    <IncidentDetails incident={incidents[0]} type={type} />
                </Grid>
            </Grid>
        </Paper>
    );
};

// Map Preview Component
const MapPreview = ({ location, coordinates }) => (
    <Box sx={{
        height: 200,
        bgcolor: 'grey.200',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative'
    }}>
        <MapIcon sx={{ fontSize: 48, color: 'grey.500' }} />
        <Typography variant="body2" sx={{ mt: 1 }}>
            {location}
        </Typography>
        <Typography variant="caption" color="text.secondary">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
        </Typography>
    </Box>
);

// Video Thumbnail Component
const VideoThumbnail = () => (
    <Box sx={{
        mt: 2,
        height: 120,
        bgcolor: 'grey.300',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 1,
        position: 'relative',
        cursor: 'pointer'
    }}>
        <PlayIcon sx={{ fontSize: 48, color: 'white' }} />
    </Box>
);

// Incident Details Component
const IncidentDetails = ({ incident, type }) => (
    <Box>
        <List>
            <ListItem disablePadding sx={{ mb: 1 }}>
                <ListItemText
                    primary={
                        <Typography variant="h6">
                            {incident.location}
                        </Typography>
                    }
                    secondary={incident.timestamp.toLocaleString()}
                />
            </ListItem>

            <Divider sx={{ my: 2 }} />

            {type === 'accident' && (
                <>
                    <DetailItem icon={<SpeedIcon />} text={`Speed: ${incident.speed} km/h`} />
                    <DetailItem icon={<TimeIcon />} text={`Duration: ${incident.duration}`} />
                    <DetailItem icon={<WarningIcon />} text={`Impact: ${incident.impactForce}`} />
                </>
            )}

            {type === 'fire' && (
                <>
                    <DetailItem icon={<FireIcon />} text={`Temperature: ${incident.temperature}°C`} />
                    <DetailItem icon={<WarningIcon />} text={`Smoke Level: ${incident.smokeLevel}`} />
                </>
            )}

            {type === 'speeding' && (
                <>
                    <DetailItem icon={<SpeedIcon />} text={`Speed: ${incident.speed} km/h`} />
                    <DetailItem icon={<WarningIcon />} text={`Speed Limit: ${incident.speedLimit} km/h`} />
                    <DetailItem icon={<TimeIcon />} text={`Over Speed Duration: ${incident.overspeedDuration}`} />
                </>
            )}
        </List>
    </Box>
);

// Reusable Detail Row Component
const DetailItem = ({ icon, text }) => (
    <ListItem disablePadding sx={{ py: 0.5 }}>
        <ListItemAvatar sx={{ minWidth: 40 }}>
            <Avatar sx={{ width: 24, height: 24, bgcolor: 'transparent' }}>
                {React.cloneElement(icon, { fontSize: 'small', color: 'action' })}
            </Avatar>
        </ListItemAvatar>
        <ListItemText primary={text} />
    </ListItem>
);

export default Overview;