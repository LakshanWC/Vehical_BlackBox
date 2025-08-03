import { useState, useEffect } from 'react';
import {
    Box, Typography, Accordion, AccordionSummary, AccordionDetails,
    CircularProgress, Chip, Divider
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

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
            </Box>
        );
    }

    const dates = Object.keys(ridesByDate).sort().reverse();

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Ride History (Last 48 Hours)
            </Typography>

            {dates.length === 0 ? (
                <Typography>No ride data available</Typography>
            ) : (
                dates.map(date => (
                    <Accordion
                        key={date}
                        defaultExpanded={date === dates[0]}
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
                            {ridesByDate[date].length > 0 ? (
                                ridesByDate[date].map((ride, index) => (
                                    <Box key={index} sx={{ mb: 4 }}>
                                        <RideMap ride={ride} />
                                        <RideStats ride={ride} />
                                        {index < ridesByDate[date].length - 1 && (
                                            <Divider sx={{ my: 3 }} />
                                        )}
                                    </Box>
                                ))
                            ) : (
                                <Typography color="text.secondary">
                                    No rides recorded on this day
                                </Typography>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );
}