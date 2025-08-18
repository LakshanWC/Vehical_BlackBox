import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Accordion, AccordionSummary, AccordionDetails,
    CircularProgress, Chip, Divider, List, ListItem, ListItemText
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RideMap from '../components/RideMap';
import RideStats from '../components/RideStats';
import { database } from '../Firebase';
import { ref, onValue } from 'firebase/database';
import { processRideData, formatDisplayDate } from '../utils/rideUtils';

export default function RideHistory() {
    const [ridesByDate, setRidesByDate] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedRide, setExpandedRide] = useState(null);

    useEffect(() => {
        const eventsRef = ref(database, 'event');
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            const rawData = snapshot.val() || {};
            const processed = processRideData(rawData);
            setRidesByDate(processed);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleRideExpand = (dateIndex, rideIndex) => {
        setExpandedRide(expandedRide === `${dateIndex}-${rideIndex}` ? null : `${dateIndex}-${rideIndex}`);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const dates = Object.keys(ridesByDate || {}).sort().reverse();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Ride History (Last 48 Hours)
            </Typography>

            {dates.length === 0 ? (
                <Typography>No ride data available</Typography>
            ) : (
                dates.map((date, dateIndex) => (
                    <Accordion
                        key={date}
                        defaultExpanded={dateIndex === 0}
                        sx={{ mb: 2 }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ fontWeight: 'medium' }}>
                                {formatDisplayDate(date)}
                            </Typography>
                            <Chip
                                label={`${ridesByDate[date].length} rides`}
                                sx={{ ml: 2 }}
                                size="small"
                            />
                        </AccordionSummary>
                        <AccordionDetails>
                            <List sx={{ width: '100%' }}>
                                {ridesByDate[date].map((ride, rideIndex) => (
                                    <React.Fragment key={rideIndex}>
                                        <ListItem
                                            button
                                            onClick={() => handleRideExpand(dateIndex, rideIndex)}
                                            sx={{
                                                backgroundColor: expandedRide === `${dateIndex}-${rideIndex}`
                                                    ? 'action.selected'
                                                    : 'background.paper',
                                                borderRadius: 1
                                            }}
                                        >
                                            <ListItemText
                                                primary={`Ride ${rideIndex + 1}`}
                                                secondary={`Duration: ${ride.duration} • Avg Speed: ${ride.avgSpeed}`}
                                            />
                                        </ListItem>
                                        {expandedRide === `${dateIndex}-${rideIndex}` && (
                                            <Box sx={{ p: 2, pt: 0 }}>
                                                <Box sx={{ height: '400px', mb: 2 }}>
                                                    <RideMap ride={ride} />
                                                </Box>
                                                <RideStats ride={ride} />
                                            </Box>
                                        )}
                                        {rideIndex < ridesByDate[date].length - 1 && (
                                            <Divider sx={{ my: 1 }} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
}