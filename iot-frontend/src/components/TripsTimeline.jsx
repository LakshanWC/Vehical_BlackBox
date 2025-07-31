// src/components/TripsTimeline.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Divider } from '@mui/material';
import TripMap from './TripMap';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';

const TripsTimeline = () => {
    const [tripsByDate, setTripsByDate] = useState({});
    const [selectedTrip, setSelectedTrip] = useState(null);

    useEffect(() => {
        const eventsRef = ref(database, 'event');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            const data = snapshot.val();
            processTripsData(data);
        });

        return () => unsubscribe();
    }, []);

    const processTripsData = (rawData) => {
        if (!rawData) return;

        const now = new Date();
        const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        // Filter and sort data
        const filteredData = Object.entries(rawData)
            .filter(([timestamp]) => new Date(timestamp) > fortyEightHoursAgo)
            .sort(([a], [b]) => new Date(b) - new Date(a));

        // Group by date (UTC)
        const grouped = {};
        filteredData.forEach(([timestamp, data]) => {
            const date = new Date(timestamp).toISOString().split('T')[0];
            if (!grouped[date]) grouped[date] = [];
            grouped[date].push({ timestamp, ...data });
        });

        // Detect trips
        const tripsByDate = {};
        Object.entries(grouped).forEach(([date, points]) => {
            const trips = detectTrips(points);
            tripsByDate[date] = trips;
        });

        setTripsByDate(tripsByDate);
    };

    const detectTrips = (points) => {
        const validPoints = points.filter(p =>
            p.location.lat !== 'waiting-gps' &&
            p.location.lng !== 'waiting-gps' &&
            p.speed !== 'waiting-gps'
        );

        if (validPoints.length === 0) return [];

        const trips = [];
        let currentTrip = [validPoints[0]];
        let lastTimestamp = new Date(validPoints[0].timestamp);

        for (let i = 1; i < validPoints.length; i++) {
            const currentTime = new Date(validPoints[i].timestamp);
            const timeDiff = (currentTime - lastTimestamp) / 1000; // in seconds

            if (timeDiff > 15) { // 15 seconds gap = new trip
                trips.push(currentTrip);
                currentTrip = [validPoints[i]];
            } else {
                currentTrip.push(validPoints[i]);
            }
            lastTimestamp = currentTime;
        }

        if (currentTrip.length > 0) {
            trips.push(currentTrip);
        }

        return trips;
    };

    return (
        <Box sx={{ p: 3 }}>
            {Object.entries(tripsByDate).map(([date, trips]) => (
                <Paper key={date} sx={{ p: 3, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        {new Date(date).toUTCString().split(' ').slice(0, 4).join(' ')}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                        {trips.map((trip, index) => (
                            <Button
                                key={index}
                                variant={selectedTrip?.date === date && selectedTrip?.index === index ? 'contained' : 'outlined'}
                                onClick={() => setSelectedTrip({ date, index, points: trip })}
                            >
                                Trip {index + 1}
                            </Button>
                        ))}
                    </Box>

                    {selectedTrip?.date === date && (
                        <>
                            <TripMap points={selectedTrip.points} />
                            <Box sx={{ mt: 2 }}>
                                <Typography>Start: {selectedTrip.points[0].timestamp}</Typography>
                                <Typography>End: {selectedTrip.points[selectedTrip.points.length - 1].timestamp}</Typography>
                                <Typography>
                                    Duration: {(
                                    (new Date(selectedTrip.points[selectedTrip.points.length - 1].timestamp) -
                                        new Date(selectedTrip.points[0].timestamp)
                                    ) / 1000 / 60).toFixed(1)} minutes
                                </Typography>
                            </Box>
                        </>
                    )}

                    <Divider sx={{ mt: 3 }} />
                </Paper>
            ))}
        </Box>
    );
};

export default TripsTimeline;