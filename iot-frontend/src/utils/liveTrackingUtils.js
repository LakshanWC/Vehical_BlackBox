// Helper function to detect alerts
export const shouldTriggerAlert = (entry) => {
    if (!entry) return null;

    // 1. Fire detection (highest priority)
    if (entry.fireStatus === "1") return 'FIRE';

    // 2. Accident detection
    if (entry.gforces) {
        const xG = parseFloat(entry.gforces.X) || 0;
        const yG = parseFloat(entry.gforces.Y) || 0;
        if (xG > 2.5 || yG > 3.0) return 'ACCIDENT';
    }

    // 3. Speeding detection
    if (entry.speed && entry.speed !== "waiting-gps") {
        const speed = parseFloat(entry.speed);
        if (speed > 60) return 'SPEEDING';
    }

    return null;
};

// Processes incoming data points for live ride tracking
export const processLiveRide = (newPoint, currentRide) => {
    if (!newPoint || newPoint.deviceId !== 'ESP12E_001') return currentRide;

    const pointTime = new Date(newPoint.timestamp).getTime();
    const isGpsValid = newPoint.location?.lat !== "waiting-gps";

    // Initialize new ride if:
    // 1. No current ride exists, OR
    // 2. Gap >10 seconds from last update
    if (!currentRide || (currentRide.lastUpdate && (pointTime - currentRide.lastUpdate > 10000))) {
        return {
            start: newPoint,
            end: newPoint,
            path: isGpsValid ? [newPoint] : [],
            lastUpdate: pointTime,
            isActive: true
        };
    }

    // Continue existing ride
    return {
        ...currentRide,
        end: newPoint,
        path: isGpsValid ? [...currentRide.path, newPoint] : currentRide.path,
        lastUpdate: pointTime
    };
};

// Checks if a ride should be marked inactive
export const checkRideStatus = (ride) => {
    if (!ride) return null;
    const now = Date.now();
    return (now - ride.lastUpdate > 10000)
        ? { ...ride, isActive: false }
        : ride;
};

// Calculate ride statistics
export const calculateRideStats = (ride) => {
    if (!ride?.path?.length) return null;

    const validPoints = ride.path.filter(p =>
        p.location?.lat !== "waiting-gps" &&
        p.speed !== "waiting-gps"
    );

    if (validPoints.length < 2) return null;

    const speeds = validPoints.map(p => parseFloat(p.speed));
    const startTime = new Date(ride.start.timestamp);
    const endTime = new Date(ride.end.timestamp);
    const durationMs = endTime - startTime;

    // Simple distance calculation (approximate)
    let distance = 0;
    for (let i = 1; i < validPoints.length; i++) {
        const p1 = validPoints[i-1].location;
        const p2 = validPoints[i].location;
        distance += Math.sqrt(
            Math.pow(p2.lat - p1.lat, 2) +
            Math.pow(p2.lng - p1.lng, 2)
        );
    }
    distance = distance * 111.32; // Convert to kilometers

    return {
        maxSpeed: Math.max(...speeds),
        avgSpeed: speeds.reduce((a, b) => a + b, 0) / speeds.length,
        duration: new Date(durationMs).toISOString().substr(11, 8),
        distance: distance.toFixed(2)
    };
};