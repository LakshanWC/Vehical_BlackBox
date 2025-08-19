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
    const [polylines, setPolylines] = useState([]);
    const [mapMarkers, setMapMarkers] = useState([]);

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
    }, [center, zoom, mapTypeId, onMapLoad, map]);

    // Update map center and zoom
    useEffect(() => {
        if (map && center) {
            map.setCenter(center);
        }
    }, [map, center]);

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
        // Clear existing polylines
        polylines.forEach(polyline => polyline.setMap(null));

        if (map && path.length > 1) {
            const newPolyline = new window.google.maps.Polyline({
                path: path,
                geodesic: true,
                strokeColor: '#1976D2',
                strokeOpacity: 1.0,
                strokeWeight: 3,
                map: map
            });

            setPolylines([newPolyline]);

            // Adjust bounds to show entire path
            if (path.length > 0) {
                const bounds = new window.google.maps.LatLngBounds();
                path.forEach(point => bounds.extend(point));
                map.fitBounds(bounds);
            }
        } else {
            setPolylines([]);
        }

        return () => {
            polylines.forEach(polyline => polyline.setMap(null));
        };
    }, [map, path]);

    // Handle markers
    useEffect(() => {
        // Clear existing markers
        mapMarkers.forEach(marker => marker.setMap(null));

        if (map && markers.length > 0) {
            const newMarkers = markers.map(markerConfig => {
                const marker = new window.google.maps.Marker({
                    position: markerConfig.position,
                    map: map,
                    title: markerConfig.title || '',
                    icon: markerConfig.icon || null
                });

                if (markerConfig.infoWindow) {
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: markerConfig.infoWindow
                    });

                    marker.addListener('click', () => {
                        infoWindow.open(map, marker);
                    });
                }

                return marker;
            });

            setMapMarkers(newMarkers);
        } else {
            setMapMarkers([]);
        }

        return () => {
            mapMarkers.forEach(marker => marker.setMap(null));
        };
    }, [map, markers]);

    return <div ref={mapRef} style={style} />;
};

export default GoogleMapWrapper;