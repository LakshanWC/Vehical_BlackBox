export const processRideData = (rawData) => {
    const rides = [];
    let currentRide = null;
    let lastTimestamp = null;

    // Convert object to sorted array
    const dataPoints = Object.entries(rawData)
        .map(([timestamp, data]) => ({ timestamp, ...data }))
        .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    for (const point of dataPoints) {
        const pointTime = new Date(point.timestamp).getTime();

        if (!currentRide || (lastTimestamp && pointTime - lastTimestamp > 10000)) {
            if (currentRide) {
                // Finalize previous ride
                currentRide.duration = calculateDuration(currentRide.start.timestamp, currentRide.end.timestamp);
                currentRide.avgSpeed = calculateAvgSpeed(currentRide);
                rides.push(currentRide);
            }
            // Start new ride
            currentRide = {
                start: point,
                end: point,
                path: [point],
                deviceId: point.deviceId
            };
        } else {
            // Continue current ride
            currentRide.path.push(point);
            currentRide.end = point;
        }
        lastTimestamp = pointTime;
    }

    // Add the last ride
    if (currentRide) {
        currentRide.duration = calculateDuration(currentRide.start.timestamp, currentRide.end.timestamp);
        currentRide.avgSpeed = calculateAvgSpeed(currentRide);
        rides.push(currentRide);
    }

    return groupRidesByDate(rides);
};

const calculateDuration = (startTime, endTime) => {
    const diff = new Date(endTime) - new Date(startTime);
    return new Date(diff).toISOString().substr(11, 8);
};

const calculateAvgSpeed = (ride) => {
    const validSpeeds = ride.path
        .filter(p => p.speed !== "waiting-gps")
        .map(p => parseFloat(p.speed));

    if (validSpeeds.length === 0) return "0 km/h";

    const avg = validSpeeds.reduce((a, b) => a + b, 0) / validSpeeds.length;
    return `${avg.toFixed(2)} km/h`;
};

const groupRidesByDate = (rides) => {
    const grouped = {};

    rides.forEach(ride => {
        const date = new Date(ride.start.timestamp).toISOString().split('T')[0];
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(ride);
    });

    return grouped;
};

export const formatDisplayDate = (isoDate) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (isoDate === today) return "Today";
    if (isoDate === yesterday) return "Yesterday";

    return new Date(isoDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// ✅ New function
export const processRideHistoryData = (rawData) => {
    const ridesByDate = {};
    const currentTime = Date.now();

    Object.entries(rawData).forEach(([deviceId, deviceRides]) => {
        Object.entries(deviceRides).forEach(([startTime, rideData]) => {
            // Only show rides from last 48 hours
            if (currentTime - parseInt(startTime) <= 172800000) {
                const date = new Date(parseInt(startTime)).toISOString().split('T')[0];
                if (!ridesByDate[date]) ridesByDate[date] = [];

                ridesByDate[date].push({
                    deviceId,
                    startTime: parseInt(startTime),
                    ...rideData
                });
            }
        });
    });

    return ridesByDate;
};
