import { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Paper, Alert, Snackbar, Chip, Stack } from '@mui/material';
import LiveMap from '../components/LiveMap';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import {
    processLiveRide,
    checkRideStatus,
    shouldTriggerAlert,
    calculateRideStats
} from '../utils/liveTrackingUtils';

export default function LiveTracking() {
    const [currentRide, setCurrentRide] = useState(null);
    const [activeAlert, setActiveAlert] = useState(null);
    const [stats, setStats] = useState(null);

    // Process real-time data
    useEffect(() => {
        const dbRef = ref(database, 'event');
        const unsubscribe = onValue(dbRef, (snapshot) => {
            const data = snapshot.val();
            if (!data) return;

            const latestEntry = Object.entries(data)
                .map(([timestamp, entry]) => ({ timestamp, ...entry }))
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            setCurrentRide(prev => {
                const updatedRide = processLiveRide(latestEntry, prev);
                setStats(calculateRideStats(updatedRide));
                return updatedRide;
            });

            const alertType = shouldTriggerAlert(latestEntry);
            if (alertType) setActiveAlert({ type: alertType, position: latestEntry.location });
        });

        const interval = setInterval(() => {
            setCurrentRide(prev => {
                const updatedRide = checkRideStatus(prev);
                if (updatedRide?.isActive !== prev?.isActive) {
                    setStats(calculateRideStats(updatedRide));
                }
                return updatedRide;
            });
        }, 1000);

        return () => {
            unsubscribe();
            clearInterval(interval);
        };
    }, []);

    // Auto-dismiss alerts
    useEffect(() => {
        if (activeAlert) {
            const timer = setTimeout(() => setActiveAlert(null), 10000);
            return () => clearTimeout(timer);
        }
    }, [activeAlert]);

    return (
        <Box sx={{ p: 2, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
            <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                    {currentRide?.isActive ? 'Live Tracking Active' : 'No Active Ride'}
                </Typography>

                {stats && (
                    <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        <Chip label={`Duration: ${stats.duration}`} />
                        <Chip label={`Avg Speed: ${stats.avgSpeed.toFixed(1)} km/h`} />
                        <Chip
                            label={`Max Speed: ${stats.maxSpeed.toFixed(1)} km/h`}
                            color={stats.maxSpeed > 60 ? 'error' : 'default'}
                        />
                        <Chip label={`Distance: ${stats.distance} km`} />
                    </Stack>
                )}
            </Paper>

            <Paper sx={{ flexGrow: 1, position: 'relative' }}>
                <LiveMap
                    path={currentRide?.path || []}
                    currentPosition={currentRide?.end?.location}
                    alert={activeAlert?.type}
                    isRideComplete={!currentRide?.isActive}
                />
            </Paper>

            <Snackbar open={!!activeAlert} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity={
                    activeAlert?.type === 'FIRE' ? 'error' :
                        activeAlert?.type === 'ACCIDENT' ? 'error' : 'warning'
                }>
                    {activeAlert?.type === 'FIRE' ? '🔥 FIRE DETECTED' :
                        activeAlert?.type === 'ACCIDENT' ? '🚨 ACCIDENT DETECTED' : '🚔 SPEEDING WARNING'}
                </Alert>
            </Snackbar>
        </Box>
    );
}