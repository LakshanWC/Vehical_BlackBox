import React from 'react';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const Accidents = () => {
    // Mock data - replace with API calls
    const accidents = [
        { id: 1, timestamp: '2023-05-15 14:30', location: 'Colombo', severity: 'High' },
        { id: 2, timestamp: '2023-05-14 09:15', location: 'Kandy', severity: 'Medium' },
    ];

    return (
        <Box>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="error" /> Recent Accidents
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Location</TableCell>
                        <TableCell>Severity</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {accidents.map((accident) => (
                        <TableRow key={accident.id}>
                            <TableCell>{accident.timestamp}</TableCell>
                            <TableCell>{accident.location}</TableCell>
                            <TableCell>
                                <Typography color={accident.severity === 'High' ? 'error' : 'warning.main'}>
                                    {accident.severity}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default Accidents;