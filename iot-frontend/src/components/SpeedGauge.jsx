import { Box, Typography, LinearProgress } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';

export default function SpeedGauge({ current, max }) {
    // Ensure max is at least 60 to show meaningful comparison
    const displayMax = Math.max(max, 60);
    const percentage = Math.min((current / displayMax) * 100, 100);

    return (
        <Box sx={{
            width: 200,
            p: 2,
            border: '1px solid #ddd',
            borderRadius: 2,
            bgcolor: 'background.paper'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SpeedIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                    Speed Monitor
                </Typography>
            </Box>

            <Box sx={{ mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    Current: <strong>{current.toFixed(1)} km/h</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Max: <strong>{max.toFixed(1)} km/h</strong>
                </Typography>
            </Box>

            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: '#e0e0e0',
                    '& .MuiLinearProgress-bar': {
                        backgroundColor: current > 60 ? '#f44336' : '#4caf50',
                        borderRadius: 5
                    }
                }}
            />

            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                mt: 0.5
            }}>
                <Typography variant="caption">0</Typography>
                <Typography variant="caption">{displayMax.toFixed(0)}</Typography>
            </Box>
        </Box>
    );
}