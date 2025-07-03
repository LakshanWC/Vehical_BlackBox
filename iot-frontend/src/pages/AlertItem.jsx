import { useState } from 'react';
import {
    Box, Paper, Typography, Button, Collapse, Divider, Avatar, Chip
} from '@mui/material';
import { Warning as WarningIcon, Speed as SpeedIcon } from '@mui/icons-material';
import MapView from './MapView';

const AlertItem = ({ alert }) => {
    const [expanded, setExpanded] = useState(false);

    const formatUTCTimestamp = (isoString) => {
        try {
            const date = new Date(isoString);
            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            let hours = date.getUTCHours();
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12;
            hours = hours ? hours : 12;

            return {
                date: `${year}-${month}-${day}`,
                time: `${hours}:${minutes} ${ampm}`
            };
        } catch {
            return {
                date: 'N/A',
                time: 'N/A'
            };
        }
    };

    return (
        <Paper elevation={2} sx={{ mb: 2, overflow: 'hidden' }}>
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    cursor: 'pointer',
                    bgcolor: alert.classification === 'ACCIDENT' ? '#ffeeee' : '#fff8e1'
                }}
                onClick={() => setExpanded(!expanded)}
            >
                <Avatar sx={{
                    bgcolor: alert.classification === 'ACCIDENT' ? 'error.main' :
                        alert.classification === 'BUMP' ? 'warning.main' : 'grey.500',
                    mr: 2
                }}>
                    {alert.classification === 'ACCIDENT' ? <WarningIcon /> :
                        alert.classification === 'BUMP' ? <SpeedIcon /> : null}
                </Avatar>

                <Box sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                            label={alert.classification}
                            size="small"
                            color={
                                alert.classification === 'ACCIDENT' ? 'error' :
                                    alert.classification === 'BUMP' ? 'warning' : 'default'
                            }
                        />
                        <Typography variant="body1">
                            Device: {alert.deviceId}
                        </Typography>
                    </Box>
                    <Typography variant="body2">
                        {formatUTCTimestamp(alert.timestamp).date} at {formatUTCTimestamp(alert.timestamp).time}
                    </Typography>
                </Box>
            </Box>

            <Collapse in={expanded}>
                <Divider />
                <Box sx={{ p: 2 }}>
                    {alert.location?.lat && (
                        <>
                            <Typography variant="body2" paragraph>
                                <strong>Location:</strong> {alert.location.lat}, {alert.location.lng}
                            </Typography>

                            <Box sx={{ height: '300px', mt: 2 }}>
                                <MapView
                                    center={[parseFloat(alert.location.lat), parseFloat(alert.location.lng)]}
                                    markers={[{
                                        position: [parseFloat(alert.location.lat), parseFloat(alert.location.lng)],
                                        color: alert.classification === 'ACCIDENT' ? 'red' : 'orange',
                                        size: 30
                                    }]}
                                    zoom={15}
                                />
                            </Box>
                        </>
                    )}

                    {alert.gforces && (
                        <Typography variant="body2" paragraph>
                            <strong>Impact Forces:</strong> X={alert.gforces.X}, Y={alert.gforces.Y}, Z={alert.gforces.Z}
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export default AlertItem;