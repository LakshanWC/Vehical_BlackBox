import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Tabs, Tab, Chip } from '@mui/material';
import { Warning as WarningIcon, Error as ErrorIcon, Speed as SpeedIcon, LocalFireDepartment as FireIcon } from '@mui/icons-material';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import AlertItem from './AlertItem';

const Overview = () => {
    const [realtimeAlerts, setRealtimeAlerts] = useState([]);
    const [filter, setFilter] = useState('ALL'); // 'ALL', 'ACCIDENT', 'BUMP', 'SPEEDING', 'FIRE'

    useEffect(() => {
        const alertsRef = ref(database, 'event');
        const unsubscribe = onValue(alertsRef, (snapshot) => {
            const data = [];
            const now = new Date();

            snapshot.forEach((childSnapshot) => {
                const alertData = childSnapshot.val();
                const alertDate = new Date(childSnapshot.key);
                const hoursDiff = (now - alertDate) / (1000 * 60 * 60);

                if (hoursDiff <= 172) {
                    const classification = classifyAlert(alertData);
                    data.push({
                        ...alertData,
                        id: childSnapshot.key,
                        timestamp: childSnapshot.key,
                        classification
                    });
                }
            });
            setRealtimeAlerts(data.reverse());
        });

        return () => unsubscribe();
    }, []);

    const classifyAlert = (alert) => {
        if (alert.speed === "waiting-gps" || alert.location?.lat === "waiting-gps") {
            return 'GPS_DISCONNECTED';
        }
        if (alert.fireStatus === 1) return 'FIRE';
        if (alert.speed && parseFloat(alert.speed.replace(' km/h', '')) > 60) {
            //add speed trajectory for speed violations
            if (alert.speedTrajectory) {
                return 'SPEEDING';
            }
            return 'SPEEDING';
        }
        if (!alert.gforces || !alert.gyro) return 'OTHER';

        try {
            const xG = parseFloat(alert.gforces.X) || 0;
            const yG = parseFloat(alert.gforces.Y) || 0;
            const zG = parseFloat(alert.gforces.Z) || 0;
            const xGyro = Math.abs(parseFloat(alert.gyro.X || 0));
            const yGyro = Math.abs(parseFloat(alert.gyro.Y || 0));

            const gForceTrigger = xG > 2.5 || yG > 3.0 || zG < 0.3 || zG > 2.0;
            const gyroTrigger = xGyro > 60 || yGyro > 60;

            if (gForceTrigger && gyroTrigger) return 'ACCIDENT';
            if (gForceTrigger) return 'BUMP';
            return 'OTHER';
        } catch {
            return 'OTHER';
        }
    };

    const filteredAlerts = realtimeAlerts.filter(alert => {
        const validTypes = ['ACCIDENT', 'BUMP', 'SPEEDING', 'FIRE'];
        if (filter === 'ALL') return validTypes.includes(alert.classification);
        return alert.classification === filter;
    });

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Dashboard Overview
            </Typography>

            <Paper sx={{ p: 2, mb: 3 }}>
                <Tabs
                    value={filter}
                    onChange={(_, newValue) => setFilter(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="All" value="ALL" icon={<WarningIcon />} />
                    <Tab label="Accidents" value="ACCIDENT" icon={<ErrorIcon color="error" />} />
                    <Tab label="Bumps" value="BUMP" icon={<ErrorIcon color="warning" />} />
                    <Tab label="Speeding" value="SPEEDING" icon={<SpeedIcon color="secondary" />} />
                    <Tab label="Fire" value="FIRE" icon={<FireIcon color="error" />} />
                </Tabs>
            </Paper>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    Live Alerts (Last 48 Hours)
                </Typography>

                {filteredAlerts.length > 0 ? (
                    filteredAlerts.map(alert => (
                        <AlertItem key={alert.id} alert={alert} />
                    ))
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        No alerts matching current filter
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default Overview;