import axios from "axios";
import { Company } from "./company";

const API_URL = "http://localhost:5000/api";

// Get all companies
export const getCompanies = async (): Promise<Company[]> => {
    const response = await axios.get<Company[]>(`${API_URL}/companies`);
    return response.data;
};

// Get all blocks (for dropdown)
export const getBlocks = async () => {
    const response = await axios.get(`${API_URL}/blocks`);
    return response.data;
};

// Create a new company
export const createCompany = async (company: Company) => {
    await axios.post(`${API_URL}/companies`, company);
};

// Update a company
export const updateCompany = async (id: number, company: Company) => {
    await axios.put(`${API_URL}/companies/${id}`, company);
};

// Delete a company
export const deleteCompany = async (id: number) => {
    await axios.delete(`${API_URL}/companies/${id}`);
};
