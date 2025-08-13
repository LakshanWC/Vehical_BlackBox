import { Box, Typography, Chip, Divider } from '@mui/material';
import { DirectionsCar, Schedule, Speed } from '@mui/icons-material';

export default function RideStats({ ride }) {
    return (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip
                    icon={<DirectionsCar />}
                    label={`Device: ${ride.deviceId}`}
                    variant="outlined"
                />
                <Chip
                    icon={<Schedule />}
                    label={`Duration: ${ride.duration}`}
                    variant="outlined"
                />
                <Chip
                    icon={<Speed />}
                    label={`Avg Speed: ${ride.avgSpeed}`}
                    variant="outlined"
                />
            </Box>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body2" color="text.secondary">
                Start: {new Date(ride.start.timestamp).toUTCString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                End: {new Date(ride.end.timestamp).toUTCString()}
            </Typography>
        </Box>
    );
}