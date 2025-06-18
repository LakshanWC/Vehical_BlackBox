// src/api/accidentService.js
import axios from 'axios';

const API_URL = '/api';

export const getAccidents = async () => {
    try {
        const response = await axios.get(`${API_URL}/accidents`);
        return response.data;
    } catch (error) {
        console.error('Error fetching accidents:', error);
        throw error;
    }
};

export const getSpeedViolations = async () => {
    try {
        const response = await axios.get(`${API_URL}/speed-violations`);
        return response.data;
    } catch (error) {
        console.error('Error fetching speed violations:', error);
        throw error;
    }
};