// components/RideMap.jsx
import React from 'react';
import { Typography, Box } from '@mui/material';
import GoogleMapWrapper from './GoogleMapWrapper';

// Strict coordinate validation
const isValidSriLankaCoordinate = (lat, lng) => {
    try {
        const numLat = Number(lat);
        const numLng = Number(lng);
        return (
            !isNaN(numLat) && !isNaN(numLng) &&
            numLat >= 5.5 && numLat <= 10 &&
            numLng >= 79 && numLng <= 82
        );
    } catch {
        return false;
    }
};

export default function RideMap({ ride, mapType = 'roadmap' }) {
    const validPoints = ride.path.filter(p =>
        p.location.lat !== "waiting-gps" &&
        p.location.lng !== "waiting-gps" &&
        isValidSriLankaCoordinate(p.location.lat, p.location.lng)
    );

    if (validPoints.length < 2) {
        return <Typography color="textSecondary">Insufficient valid location data for this ride</Typography>;
    }

    const path = validPoints.map(p => ({
        lat: parseFloat(p.location.lat),
        lng: parseFloat(p.location.lng)
    }));

    const markers = [
        {
            position: path[0],
            title: 'Start',
            infoWindow: `
        <div>
          <strong>Start</strong><br />
          ${new Date(ride.start.timestamp).toUTCString()}
        </div>
      `,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#4CAF50" stroke="white" stroke-width="2"/>
          </svg>
        `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
            }
        },
        {
            position: path[path.length - 1],
            title: 'End',
            infoWindow: `
        <div>
          <strong>End</strong><br />
          ${new Date(ride.end.timestamp).toUTCString()}
        </div>
      `,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="#F44336" stroke="white" stroke-width="2"/>
          </svg>
        `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
            }
        }
    ];

    return (
        <Box sx={{ height: '600px', width: '100%', borderRadius: '8px', overflow: 'hidden' }}>
            <GoogleMapWrapper
                path={path}
                markers={markers}
                mapTypeId={mapType}
            />
        </Box>
    );
}