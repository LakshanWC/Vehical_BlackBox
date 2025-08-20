// components/LiveMap.jsx
import React, { useState } from 'react';
import GoogleMapWrapper from './GoogleMapWrapper';

const calculateHeading = (prevPos, currentPos) => {
    if (!prevPos || !currentPos) return 0;
    return Math.atan2(currentPos[1] - prevPos[1], currentPos[0] - prevPos[0]) * 180 / Math.PI;
};

export default function LiveMap({ path, currentPosition, alert, isRideComplete }) {
    const [mapType, setMapType] = useState('roadmap');

    const validPoints = path.filter(p => p.location?.lat !== "waiting-gps")
        .map(p => [parseFloat(p.location.lat), parseFloat(p.location.lng)]);

    const vehicleHeading = validPoints.length > 1
        ? calculateHeading(validPoints[validPoints.length-2], validPoints[validPoints.length-1])
        : 0;

    const googlePath = validPoints.map(point => ({ lat: point[0], lng: point[1] }));

    const markers = [];

    // Moving Vehicle
    if (validPoints.length > 0 && !isRideComplete) {
        markers.push({
            position: {
                lat: validPoints[validPoints.length-1][0],
                lng: validPoints[validPoints.length-1][1]
            },
            title: 'Current Position',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#007bff" transform="rotate(${vehicleHeading} 12 12)">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
          </svg>
        `),
                scaledSize: new window.google.maps.Size(24, 24),
                anchor: new window.google.maps.Point(12, 12)
            }
        });
    }

    // Start/End Markers (only when ride complete)
    if (isRideComplete && validPoints.length > 1) {
        markers.push({
            position: { lat: validPoints[0][0], lng: validPoints[0][1] },
            title: 'Start Point',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#4CAF50" stroke="white" stroke-width="2"/>
          </svg>
        `),
                scaledSize: new window.google.maps.Size(20, 20),
                anchor: new window.google.maps.Point(10, 10)
            }
        });

        markers.push({
            position: {
                lat: validPoints[validPoints.length-1][0],
                lng: validPoints[validPoints.length-1][1]
            },
            title: 'End Point',
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="8" fill="#F44336" stroke="white" stroke-width="2"/>
          </svg>
        `),
                scaledSize: new window.google.maps.Size(20, 20),
                anchor: new window.google.maps.Point(10, 10)
            }
        });
    }

    return (
        <div className="live-map-container" style={{ position: 'relative' }}>
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1000,
                backgroundColor: 'white',
                padding: '5px',
                borderRadius: '3px',
                display: 'flex',
                gap: '5px'
            }}>
                <button
                    onClick={() => setMapType('roadmap')}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: mapType === 'roadmap' ? '#1976d2' : '#f5f5f5',
                        color: mapType === 'roadmap' ? 'white' : 'black',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Normal
                </button>
                <button
                    onClick={() => setMapType('satellite')}
                    style={{
                        padding: '5px 10px',
                        backgroundColor: mapType === 'satellite' ? '#1976d2' : '#f5f5f5',
                        color: mapType === 'satellite' ? 'white' : 'black',
                        border: '1px solid #ccc',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Satellite
                </button>
            </div>

            <GoogleMapWrapper
                center={validPoints.length > 0 ?
                    { lat: validPoints[validPoints.length-1][0], lng: validPoints[validPoints.length-1][1] } :
                    { lat: 0, lng: 0 }
                }
                zoom={17}
                path={googlePath}
                markers={markers}
                mapTypeId={mapType}
                style={{ height: '100%', width: '100%' }}
            />
        </div>
    );
}