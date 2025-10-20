import React, { useEffect, useState } from "react";
import axios from "axios";
import { LogOut } from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function Header({ selectedBlock, onSelectBlock, selectedHouse, onSelectHouse }) {
  const [blocks, setBlocks] = useState([]);
  const [houses, setHouses] = useState([]);

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (selectedBlock) fetchHouses(selectedBlock);
  }, [selectedBlock]);

  const fetchBlocks = async () => {
    try {
      const res = await axios.get(`${API_URL}/structure/blocks`);
      setBlocks(res.data);
    } catch (err) {
      console.error("Failed to load blocks:", err);
    }
  };

  const fetchHouses = async (blockId) => {
    try {
      const res = await axios.get(`${API_URL}/structure/units`);
      const filtered = res.data.filter((u) => u.block_id === blockId);
      setHouses(filtered);
    } catch (err) {
      console.error("Failed to load houses:", err);
    }
  };

  return (
    <header className="bg-[#0b1628] border-b border-slate-700">
      <div className="flex items-center justify-between px-4 py-3 flex-wrap">
        {/* Left Logo */}
        <img src="/logo-boltvolt.png" alt="Bolt & Volt" className="h-10" />

        {/* Center Title */}
        <div className="text-center flex-1">
          <h2 className="text-white text-lg font-semibold">Energy Monitoring</h2>
          <p className="text-slate-400 text-xs">Real-time Power & Energy Consumption</p>
        </div>

        {/* Right Logo */}
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">QDPS</h3>
          <img src="/logo-qdps.png" alt="QDPS Logo" className="h-10" />
        </div>
      </div>

      {/* Block Buttons */}
      <div className="flex flex-wrap justify-center gap-2 py-2 bg-[#11213a]">
        <button
          key="overview"
          onClick={() => onSelectBlock("All")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium ${
            selectedBlock === "All"
              ? "bg-slate-200 text-slate-900"
              : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          Overview
        </button>
        {blocks.map((block) => (
          <button
            key={block.id}
            onClick={() => onSelectBlock(block.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ${
              selectedBlock === block.id
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
            }`}
          >
            {block.block_name}
          </button>
        ))}
        <button className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-full ml-2 flex items-center gap-1">
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>

      {/* Houses (dynamic based on block) */}
      <div className="flex flex-wrap justify-center gap-2 py-2 bg-[#0b1628]">
        <button
          key="all"
          onClick={() => onSelectHouse("All")}
          className={`px-3 py-1.5 rounded-full text-sm ${
            selectedHouse === "All"
              ? "bg-white text-slate-900"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
        >
          All
        </button>
        {houses.map((house) => (
          <button
            key={house.id}
            onClick={() => onSelectHouse(house.unit_name)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              selectedHouse === house.unit_name
                ? "bg-white text-slate-900"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {house.unit_name}
          </button>
        ))}
      </div>
    </header>
  );
}
