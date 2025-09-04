export const isStationary = (point1, point2, threshold = 0.0001) => {
    if (!point1 || !point2) return false;

    const latDiff = Math.abs(point1.lat - point2.lat);
    const lngDiff = Math.abs(point1.lng - point2.lng);

    return latDiff < threshold && lngDiff < threshold;
};

export const filterStationaryPoints = (points, threshold = 0.0001) => {
    if (points.length < 2) return points;

    const filtered = [points[0]];

    for (let i = 1; i < points.length; i++) {
        const current = points[i];
        const previous = filtered[filtered.length - 1];

        if (!isStationary(current, previous, threshold)) {
            filtered.push(current);
        }
    }

    return filtered;
};

export const calculateMovementStats = (points) => {
    if (points.length < 2) return { totalDistance: 0, avgSpeed: 0, movingTime: 0 };

    let totalDistance = 0;
    let movingTime = 0;

    for (let i = 1; i < points.length; i++) {
        const prev = points[i-1];
        const curr = points[i];

        const distance = calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        const timeDiff = (curr.rawTime - prev.rawTime) / 1000; // seconds

        if (distance > 0.0001) { // Vehicle moved
            totalDistance += distance;
            movingTime += timeDiff;
        }
    }

    const avgSpeed = movingTime > 0 ? (totalDistance / movingTime) * 3600 : 0; // km/h

    return { totalDistance, avgSpeed, movingTime };
};