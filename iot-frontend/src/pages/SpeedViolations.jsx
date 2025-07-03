import React from 'react';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell } from '@mui/material';

const SpeedViolations = () => {
    // Mock data - replace with API calls
    const violations = [
        { id: 1, timestamp: '2023-05-15 14:30', speed: '95 km/h', location: 'Colombo' },
        { id: 2, timestamp: '2023-05-15 11:45', speed: '88 km/h', location: 'Kandy' },
    ];

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Speed Violations
            </Typography>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Speed</TableCell>
                        <TableCell>Location</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {violations.map((violation) => (
                        <TableRow key={violation.id}>
                            <TableCell>{violation.timestamp}</TableCell>
                            <TableCell>{violation.speed}</TableCell>
                            <TableCell>{violation.location}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Box>
    );
};

export default SpeedViolations;