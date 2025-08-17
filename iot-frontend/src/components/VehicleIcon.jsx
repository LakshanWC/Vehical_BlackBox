import L from 'leaflet';

export const createVehicleIcon = (heading) => {
    // Properly encoded SVG
    const svg = encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007bff">
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.08 3.11H5.77L6.85 7zM19 17H5v-5h14v5z"/>
        </svg>
    `);

    return L.divIcon({
        className: 'vehicle-icon',
        html: `
            <div style="
                width: 24px;
                height: 24px;
                background: url('data:image/svg+xml;utf8,${svg}');
                background-size: contain;
                transform: rotate(${heading}deg);
                transition: transform 0.5s ease;
            "></div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]  // Center the icon
    });
};