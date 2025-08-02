export const formatFirebaseTimestamp = (timestamp) => {
    if (!timestamp || timestamp.includes("waiting")) {
        return { date: "GPS Disconnected", time: "" };
    }

    try {
        const date = new Date(timestamp);
        return {
            date: date.toLocaleDateString("en-US", { timeZone: "UTC" }),
            time: date.toLocaleTimeString("en-US", { timeZone: "UTC" }),
        };
    } catch {
        return { date: "Invalid", time: "" };
    }
};