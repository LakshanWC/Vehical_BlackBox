import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import AlertItem from './AlertItem';

const Overview = () => {
    const [realtimeAlerts, setRealtimeAlerts] = useState([]);

    useEffect(() => {
        const alertsRef = ref(database, 'event');
        const unsubscribe = onValue(alertsRef, (snapshot) => {
            const data = [];
            const now = new Date();

            snapshot.forEach((childSnapshot) => {
                const alertData = childSnapshot.val();
                const alertDate = new Date(childSnapshot.key);
                const hoursDiff = (now - alertDate) / (1000 * 60 * 60);

                if (hoursDiff <= 144) {
                    const classification = classifyAlert(alertData);
                    const isSpeedViolation = checkSpeedViolation(alertData);
                    const isFireAlert = checkFireAlert(alertData);


                    if (classification !== 'NORMAL' || isSpeedViolation) {
                        data.push({
                            ...alertData,
                            id: childSnapshot.key,
                            timestamp: childSnapshot.key,
                            classification: isFireAlert ? 'FIRE' :
                                isSpeedViolation ? 'SPEEDING' : classification
                        });
                    }
                }
            });
            setRealtimeAlerts(data.reverse());
        });

        return () => unsubscribe();
    }, []);

    const classifyAlert = (alert) => {
        if (!alert.gforces || !alert.gyro) return 'INVALID';

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
            return 'NORMAL';
        } catch {
            return 'INVALID';
        }
    };
    const checkFireAlert = (alert) => {
        return alert.fire === 1; // 1 means fire detected
    };
    const checkSpeedViolation = (alert) => {
        if (!alert.speed) return false;
        const speedValue = parseInt(alert.speed.replace(' km/h', ''));
        return speedValue > 60;
    };

    const filteredAlerts = realtimeAlerts.filter(alert => {
        return alert.classification !== 'NORMAL';
    });

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Dashboard Overview
            </Typography>

            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <WarningIcon color="error" sx={{ mr: 1 }} />
                    Live Alerts (Last 24 Hours)
                </Typography>

                {filteredAlerts.length > 0 ? (
                    filteredAlerts.map(alert => (
                        <AlertItem key={alert.id} alert={alert} />
                    ))
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        No alerts in the last 24 hours
                    </Typography>
                )}
            </Paper>
        </Box>
    );
};

export default Overview;