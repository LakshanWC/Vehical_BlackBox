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
    Tooltip,
    Paper,
    Link
} from '@mui/material';
import {
    Warning as WarningIcon,
    Error as ErrorIcon,
    CheckCircle as CheckCircleIcon,
    AccessTime as TimeIcon,
    LocationOn as LocationIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { database } from '../Firebase';
import { ref, query, orderByChild, onValue } from 'firebase/database';

const Accidents = () => {
    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        const dbRef = ref(database, 'event');
        const dbQuery = query(dbRef, orderByChild('timestamp'));

        const unsubscribe = onValue(dbQuery, (snapshot) => {
            const data = [];
            snapshot.forEach((childSnapshot) => {
                const incident = childSnapshot.val();
                data.push({
                    id: childSnapshot.key,
                    ...incident,
                    classification: classifyIncident(incident)
                });
            });
            setIncidents(data.reverse());
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const classifyIncident = (incident) => {
        if (!incident.gforces || !incident.gyro) return 'INVALID';

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
            return 'NORMAL';
        } catch {
            return 'INVALID';
        }
    };

    const filteredIncidents = incidents.filter(incident => {
        if (tabValue === 0) return incident.classification === 'ACCIDENT';
        if (tabValue === 1) return incident.classification === 'BUMP';
        return incident.classification === 'INVALID';
    });

    const recentIncidents = filteredIncidents.filter(incident => {
        try {
            const incidentDate = new Date(incident.timestamp);
            const now = new Date();
            return (now - incidentDate) <= 24 * 60 * 60 * 1000;
        } catch {
            return false;
        }
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
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="error" /> Incident History
            </Typography>

            <Paper sx={{ mb: 3, p: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, newValue) => setTabValue(newValue)}
                    variant="fullWidth"
                >
                    <Tab label="Accidents" icon={<WarningIcon />} />
                    <Tab label="Bumps" icon={<ErrorIcon color="warning" />} />
                    <Tab label="Invalid Data" icon={<ErrorIcon color="disabled" />} />
                </Tabs>
            </Paper>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Device ID</TableCell>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Classification</TableCell>
                        <TableCell>Details</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {recentIncidents.length > 0 ? (
                        recentIncidents.map((incident) => (
                            <TableRow key={incident.id} hover>
                                <TableCell>{incident.deviceId || 'N/A'}</TableCell>
                                <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <TimeIcon fontSize="small" />
                                        {new Date(incident.timestamp).toLocaleString()}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    {incident.location && (
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <LocationIcon fontSize="small" />
                                            <Box>
                                                <Tooltip
                                                    title={`Raw coordinates: ${incident.location.lat}, ${incident.location.lng}`}
                                                >
                                                    <Typography variant="body2">
                                                        {incident.address || "Fetching address..."}
                                                    </Typography>
                                                </Tooltip>
                                                {incident.location.lat && incident.location.lng && (
                                                    <Link
                                                        href={`https://www.google.com/maps?q=${incident.location.lat},${incident.location.lng}`}
                                                        target="_blank"
                                                        rel="noopener"
                                                        variant="caption"
                                                        sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}
                                                    >
                                                        Open in Maps <OpenInNewIcon fontSize="inherit" sx={{ ml: 0.5 }} />
                                                    </Link>
                                                )}
                                            </Box>
                                        </Box>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={incident.classification}
                                        color={
                                            incident.classification === 'ACCIDENT' ? 'error' :
                                                incident.classification === 'BUMP' ? 'warning' :
                                                    'default'
                                        }
                                        icon={
                                            incident.classification === 'ACCIDENT' ? <WarningIcon /> :
                                                incident.classification === 'BUMP' ? <ErrorIcon /> :
                                                    <CheckCircleIcon />
                                        }
                                    />
                                </TableCell>
                                <TableCell>
                                    {incident.gforces && (
                                        <Box component="span" sx={{ mr: 2 }}>
                                            <strong>G-Forces:</strong> X={incident.gforces.X || 'N/A'}, Y={incident.gforces.Y || 'N/A'}, Z={incident.gforces.Z || 'N/A'}
                                        </Box>
                                    )}
                                    {incident.gyro && (
                                        <Box component="span">
                                            <strong>Gyro:</strong> X={incident.gyro.X || 'N/A'}, Y={incident.gyro.Y || 'N/A'}
                                        </Box>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                No {tabValue === 0 ? 'accidents' : tabValue === 1 ? 'bumps' : 'invalid data'} found in the last 24 hours.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </Box>
    );
};

export default Accidents;