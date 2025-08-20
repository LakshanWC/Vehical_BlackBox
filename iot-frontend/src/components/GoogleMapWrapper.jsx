import React, { useRef, useEffect, useState } from 'react';

const GoogleMapWrapper = ({
                              center,
                              zoom = 15,
                              path = [],
                              markers = [],
                              onMapLoad,
                              mapTypeId = 'roadmap',
                              style = { height: '100%', width: '100%' }
                          }) => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const polylinesRef = useRef([]);   // 👈 ref instead of state
    const markersRef = useRef([]);     // 👈 ref instead of state

    // Initialize map
    useEffect(() => {
        if (mapRef.current && !map) {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: center || { lat: 6.9271, lng: 79.8612 },
                zoom,
                mapTypeId,
                streetViewControl: false,
                fullscreenControl: false,
                mapTypeControl: true,
                mapTypeControlOptions: {
                    style: window.google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                    position: window.google.maps.ControlPosition.TOP_RIGHT,
                    mapTypeIds: ['roadmap', 'satellite']
                }
            });

            setMap(newMap);
            if (onMapLoad) onMapLoad(newMap);
        }
    }, [map, center, zoom, mapTypeId, onMapLoad]);

    // Update map center
    useEffect(() => {
        if (map && center) {
            map.setCenter(center);
        }
    }, [map, center]);

    // Update zoom
    useEffect(() => {
        if (map && zoom) {
            map.setZoom(zoom);
        }
    }, [map, zoom]);

    // Update map type
    useEffect(() => {
        if (map) {
            map.setMapTypeId(mapTypeId);
        }
    }, [map, mapTypeId]);

    // Draw path
    useEffect(() => {
        // Clear old
        polylinesRef.current.forEach(polyline => polyline.setMap(null));
        polylinesRef.current = [];

        if (map && path.length > 1) {
            const newPolyline = new window.google.maps.Polyline({
                path,
                geodesic: true,
                strokeColor: '#1976D2',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map
            });

            polylinesRef.current.push(newPolyline);

            // Fit bounds
            const bounds = new window.google.maps.LatLngBounds();
            path.forEach(point => bounds.extend(point));
            map.fitBounds(bounds);
        }
    }, [map, path]);

    // Handle markers
    useEffect(() => {
        // Clear old markers
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        if (map && markers.length > 0) {
            markersRef.current = markers.map(markerConfig => {
                const marker = new window.google.maps.Marker({
                    position: markerConfig.position,
                    map,
                    title: markerConfig.title || '',
                    icon: markerConfig.icon || null
                });

                if (markerConfig.infoWindow) {
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: markerConfig.infoWindow
                    });
                    marker.addListener('click', () => infoWindow.open(map, marker));
                }

                return marker;
            });
        }
    }, [map, markers]);

    return <div ref={mapRef} style={style} />;
};

export default GoogleMapWrapper;
