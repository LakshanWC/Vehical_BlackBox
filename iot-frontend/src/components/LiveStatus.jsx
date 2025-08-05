import { Box, Typography, LinearProgress, Paper } from '@mui/material';
import { Speed, Warning, LocalFireDepartment } from '@mui/icons-material';
import SpeedGauge from './SpeedGauge.jsx';

export default function LiveStatus({ data, alert }) {
    const speed = data?.speed === "waiting-gps"
        ? 0
        : parseFloat(data?.speed) || 0;

    const gForces = data?.gforces ? {
        x: parseFloat(data.gforces.X) || 0,
        y: parseFloat(data.gforces.Y) || 0,
        z: parseFloat(data.gforces.Z) || 0
    } : { x: 0, y: 0, z: 0 };

    return (
        <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
                Vehicle Status
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Speed color="primary" sx={{ mr: 1 }} />
                    <Typography>Speed: {speed.toFixed(1)} km/h</Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={Math.min(speed, 100)}
                    color={speed > 60 ? 'error' : 'primary'}
                    sx={{ height: 8 }}
                />
            </Box>

            <SpeedGauge data={gForces} />

            {alert && (
                <Box sx={{
                    mt: 2,
                    p: 2,
                    bgcolor: alert === 'FIRE' ? 'error.dark' :
                        alert === 'SPEEDING' ? 'warning.dark' : 'error.light',
                    color: 'white',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    {alert === 'FIRE' ? (
                        <LocalFireDepartment sx={{ mr: 1 }} />
                    ) : (
                        <Warning sx={{ mr: 1 }} />
                    )}
                    <Typography>
                        {alert === 'FIRE' ? 'FIRE DETECTED!' :
                            alert === 'SPEEDING' ? 'SPEED LIMIT EXCEEDED!' :
                                'HIGH G-FORCE DETECTED!'}
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}