import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://182.180.69.171:5000/api";

export default function SettingsPage() {
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [houses, setHouses] = useState({});
  const [meterList, setMeterList] = useState([]);
  const [newBlock, setNewBlock] = useState("");
  const [newHouse, setNewHouse] = useState("");
  const [selectedMeter, setSelectedMeter] = useState("");

  useEffect(() => {
    fetchMeters();
  }, []);

  const fetchMeters = async () => {
    try {
      const res = await axios.get(`${API_URL}/meters/distinct`);
      setMeterList(res.data.map((m) => m.meter_id));
    } catch (err) {
      console.error("Failed to fetch meters:", err);
    }
  };

  const addBlock = () => {
    if (!newBlock.trim()) return alert("Enter block name");
    if (blocks.includes(newBlock)) return alert("Block already exists");
    setBlocks([...blocks, newBlock]);
    setHouses({ ...houses, [newBlock]: [] });
    setNewBlock("");
  };

  const addHouse = () => {
    if (!selectedBlock) return alert("Select a block first");
    if (!newHouse.trim()) return alert("Enter house name");
    if (!selectedMeter) return alert("Select a meter");

    const newHouseObj = { name: newHouse, meter: selectedMeter };
    const updated = {
      ...houses,
      [selectedBlock]: [...(houses[selectedBlock] || []), newHouseObj],
    };
    setHouses(updated);
    setNewHouse("");
    setSelectedMeter("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-semibold mb-6">⚙️ EMS Settings</h1>

      {/* Add Block */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Add Block</h2>
        <div className="flex gap-2">
          <input
            value={newBlock}
            onChange={(e) => setNewBlock(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-60"
            placeholder="Block Name (e.g. Block A)"
          />
          <button
            onClick={addBlock}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg"
          >
            Add Block
          </button>
        </div>
      </div>

      {/* Add Houses */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Add House to Block</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg"
          >
            <option value="">Select Block</option>
            {blocks.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>

          <input
            value={newHouse}
            onChange={(e) => setNewHouse(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg w-40"
            placeholder="House Name"
          />

          <select
            value={selectedMeter}
            onChange={(e) => setSelectedMeter(e.target.value)}
            className="bg-slate-800 border border-slate-700 px-3 py-2 rounded-lg"
          >
            <option value="">Select Meter</option>
            {meterList.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <button
            onClick={addHouse}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
          >
            Add House
          </button>
        </div>
      </div>

      {/* Display Configuration */}
      <div>
        <h2 className="text-lg font-medium mb-4">Current Structure</h2>
        {blocks.length === 0 ? (
          <p className="text-slate-400">No blocks added yet.</p>
        ) : (
          blocks.map((b) => (
            <div
              key={b}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-3"
            >
              <h3 className="text-green-400 font-semibold mb-2">{b}</h3>
              {houses[b] && houses[b].length > 0 ? (
                <ul className="ml-4 space-y-1 text-sm">
                  {houses[b].map((h, idx) => (
                    <li key={idx}>
                      🏠 {h.name} — <span className="text-blue-300">{h.meter}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm ml-4">No houses added yet.</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
