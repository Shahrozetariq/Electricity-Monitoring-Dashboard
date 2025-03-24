import axios from "axios";
import { Meter } from "./meter";



const API_URL = "http://localhost:5000/api";



export const getMeterTypes = async () => {
    const response = await axios.get(`${API_URL}/metertype`);
    return response.data; // Returns the meter types from the backend
};

export const getEnergySources = async () => {
    const response = await axios.get(`${API_URL}/energy_sources`);
    return response.data;
};

export const getCompanies = async () => {
    const response = await axios.get(`${API_URL}/companies`);
    return response.data;
};

export const getBlocks = async () => {
    const response = await axios.get(`${API_URL}/blocks`);
    return response.data;
};
export const getMeters = async (): Promise<Meter[]> => {
    try {
        const response = await axios.get<Meter[]>(`${API_URL}/meters`);
        console.log("meter api : ", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching meters:", error);
        return [];
    }
};



export const getMeterById = async (id: number): Promise<Meter | null> => {
    try {
        const response = await axios.get<Meter>(`${API_URL}/meters/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching meter:", error);
        return null;
    }
};

export const createMeter = async (meter: Meter): Promise<void> => {
    try {
        await axios.post(API_URL, meter);
    } catch (error) {
        console.error("Error creating meter:", error);
    }
};

export const updateMeter = async (id: number, meter: Meter): Promise<void> => {
    try {
        await axios.put(`${API_URL}/meters/${id}`, meter);
    } catch (error) {
        console.error("Error updating meter:", error);
    }
};

export const deleteMeter = async (id: number): Promise<void> => {
    try {
        await axios.delete(`${API_URL}/meters/${id}`);
    } catch (error) {
        console.error("Error deleting meter:", error);
    }
};


export const updateMetersFromReadings = async () => {
    try {
        await axios.post(`${API_URL}/meters/update-from-readings`);
        return "Update Successful";
    } catch (error) {
        throw new Error("Failed to update meters");
    }
};