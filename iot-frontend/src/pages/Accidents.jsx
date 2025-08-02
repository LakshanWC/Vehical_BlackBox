import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    CircularProgress,
    Chip,
    Tabs,
    Tab,
    Paper,
    Link
} from '@mui/material';
import {
    Error as ErrorIcon,
    Speed as SpeedIcon,
    LocationOn as LocationIcon,
    OpenInNew as OpenInNewIcon,
    LocalFireDepartment as FireIcon
} from '@mui/icons-material';
import { database } from '../Firebase';
import { ref, query, orderByChild, onValue, limitToLast } from 'firebase/database';
import { formatFirebaseTimestamp } from "../utils/formatTime";

const Accidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const dbRef = ref(database, 'event');
        const dbQuery = query(dbRef, orderByChild('timestamp'), limitToLast(100));

        const unsubscribe = onValue(dbQuery, (snapshot) => {
            const data = [];
            const now = new Date();

            snapshot.forEach((childSnapshot) => {
                const hoursDiff = (now - new Date(childSnapshot.key)) / (1000 * 60 * 60);
                if (hoursDiff <= 48) {
                    const incident = childSnapshot.val();
                    data.push({
                        id: childSnapshot.key,
                        ...incident,
                        timestamp: childSnapshot.key,
                        classification: classifyIncident(incident),
                        vehicleStatus: getVehicleStatus(incident),
                        impactDirection: getImpactDirection(incident)
                    });
                }
            });
            setIncidents(data.reverse());
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const classifyIncident = (incident) => {
        if (incident.speed === "waiting-gps" || incident.location?.lat === "waiting-gps") {
            return 'GPS_DISCONNECTED';
        }

        if (incident.fireStatus === 1) return 'FIRE';

        if (incident.speed) {
            const speedStr = incident.speed.replace(' km/h', '').trim();
            const speedValue = parseFloat(speedStr) || 0;
            if (speedValue > 60) return 'SPEEDING';
        }

        if (!incident.gforces || !incident.gyro) return 'OTHER';

        try {
            const xG = parseFloat(incident.gforces.X) || 0;
            const yG = parseFloat(incident.gforces.Y) || 0;
            const zG = parseFloat(incident.gforces.Z) || 0;
            const xGyro = Math.abs(parseFloat(incident.gyro.X || 0));
            const yGyro = Math.abs(parseFloat(incident.gyro.Y || 0));

            const gForceTrigger = xG > 2.5 || yG > 3.0 || zG < 0.3 || zG > 2.0;
            const gyroTrigger = xGyro > 60 || yGyro > 60;

            if (gForceTrigger && gyroTrigger) return 'ACCIDENT';
            if (gForceTrigger) return 'BUMP';
            return 'OTHER';
        } catch {
            return 'OTHER';
        }
    };

    const getVehicleStatus = (incident) => {
        if (!incident.gyro) return 'Normal';
        try {
            const xAngle = Math.abs(parseFloat(incident.gyro.X || 0));
            const yAngle = Math.abs(parseFloat(incident.gyro.Y || 0));

            if (xAngle > 90 || yAngle > 90) return 'Upside Down';
            if (xAngle > 60 || yAngle > 60) return 'Rolled Over';
            if (xAngle > 45 || yAngle > 45) return 'Tilted';
            return 'Normal';
        } catch {
            return 'Unknown';
        }
    };

    const getImpactDirection = (incident) => {
        if (!incident.gforces) return 'Unknown';
        try {
            const xG = parseFloat(incident.gforces.X || 0);
            const yG = parseFloat(incident.gforces.Y || 0);

            if (Math.abs(xG) > Math.abs(yG)) {
                return xG > 0 ? 'Right Side' : 'Left Side';
            } else {
                return yG > 0 ? 'Front' : 'Rear';
            }
        } catch {
            return 'Unknown';
        }
    };

    // Define filteredIncidents before using it in the render
    const filteredIncidents = incidents.filter(incident => {
        const validTypes = ['ACCIDENT', 'BUMP', 'SPEEDING', 'FIRE'];
        if (tabValue === 0) return incident.classification === 'ACCIDENT';
        if (tabValue === 1) return incident.classification === 'BUMP';
        if (tabValue === 2) return incident.classification === 'SPEEDING';
        if (tabValue === 3) return incident.classification === 'FIRE';
        return validTypes.includes(incident.classification); // For "All" tab
    });

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                All Alerts
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    variant="fullWidth"
                >
                    <Tab label="Accidents" icon={<ErrorIcon color="error" />} />
                    <Tab label="Bumps" icon={<ErrorIcon color="warning" />} />
                    <Tab label="Speeding" icon={<SpeedIcon color="secondary" />} />
                    <Tab label="Fire" icon={<FireIcon color="error" />} />
                </Tabs>
            </Paper>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Device ID</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Time</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Speed</TableCell>
                        {(tabValue === 0 || tabValue === 1) && <TableCell>Status</TableCell>}
                        {(tabValue === 0 || tabValue === 1) && <TableCell>Impact</TableCell>}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {filteredIncidents.length > 0 ? (
                        filteredIncidents.map((incident) => (
                            <TableRow key={incident.id} hover>
                                <TableCell>{incident.deviceId || 'N/A'}</TableCell>
                                <TableCell>
                                    {formatFirebaseTimestamp(incident.timestamp).date}
                                </TableCell>
                                <TableCell>
                                    {formatFirebaseTimestamp(incident.timestamp).time}
                                </TableCell>
                                <TableCell>
                                    {incident.location && (
                                        <Link
                                            href={`https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                textDecoration: 'none',
                                                color: 'primary.main',
                                                '&:hover': {
                                                    textDecoration: 'underline'
                                                }
                                            }}
                                        >
                                            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                                            {incident.address || 'View on Map'}
                                            <OpenInNewIcon fontSize="small" sx={{ ml: 1 }} />
                                        </Link>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {incident.speed === "waiting-gps" ? "GPS Connecting" : `${incident.speed} km/h`}
                                </TableCell>
                                {(tabValue === 0 || tabValue === 1) && (
                                    <TableCell>
                                        <Chip
                                            label={incident.vehicleStatus}
                                            size="small"
                                            color={
                                                incident.vehicleStatus === 'Normal' ? 'success' :
                                                    incident.vehicleStatus === 'Upside Down' ? 'error' : 'warning'
                                            }
                                        />
                                    </TableCell>
                                )}
                                {(tabValue === 0 || tabValue === 1) && (
                                    <TableCell>{incident.impactDirection}</TableCell>
                                )}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={(tabValue === 2 || tabValue === 3) ? 5 : 7} align="center">
                                No {tabValue === 0 ? 'accidents' :
                                tabValue === 1 ? 'bumps' :
                                    tabValue === 2 ? 'speeding violations' : 'fire alerts'} found
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Box>
    );
};

export default Accidents;