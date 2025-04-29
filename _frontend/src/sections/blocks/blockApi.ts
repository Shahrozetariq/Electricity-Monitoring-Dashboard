import axios from "axios";
import { Block } from "./block";

const API_URL = "http://localhost:5000/api";

// Get all blocks
export const getBlocks = async (): Promise<Block[]> => {
    const response = await axios.get<Block[]>(`${API_URL}/blocks`);
    return response.data;
};

// Create a new block
export const createBlock = async (block: Block) => {
    await axios.post(`${API_URL}/blocks`, block);
};

// Update a block
export const updateBlock = async (id: number, block: Block) => {
    await axios.put(`${API_URL}/blocks/${id}`, block);
};

// Delete a block
export const deleteBlock = async (id: number) => {
    await axios.delete(`${API_URL}/blocks/${id}`);
};
