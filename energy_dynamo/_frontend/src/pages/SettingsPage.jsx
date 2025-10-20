import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";


export default function SettingsPage() {
  const [blocks, setBlocks] = useState([]);
  const [units, setUnits] = useState([]);
  const [meterList, setMeterList] = useState([]);

  const [newBlock, setNewBlock] = useState("");
  const [newHouse, setNewHouse] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedMeter, setSelectedMeter] = useState("");

  const [editingBlock, setEditingBlock] = useState(null);
  const [editingUnit, setEditingUnit] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    await Promise.all([fetchBlocks(), fetchUnits(), fetchMeters()]);
  };

  const fetchBlocks = async () => {
    try {
      const res = await axios.get(`${API_URL}/structure/blocks`);
      setBlocks(res.data);
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get(`${API_URL}/structure/units`);
      setUnits(res.data);
    } catch (err) {
      console.error("Failed to fetch units:", err);
    }
  };

  const fetchMeters = async () => {
    try {
      const res = await axios.get(`${API_URL}/devices`);
      setMeterList(res.data);
    } catch (err) {
      console.error("Failed to fetch meters:", err);
    }
  };

  // ➕ Add block
  const addBlock = async () => {
    if (!newBlock.trim()) return alert("Enter block name");
    try {
      await axios.post(`${API_URL}/structure/blocks`, { block_name: newBlock });
      setNewBlock("");
      fetchBlocks();
    } catch (err) {
      console.error("Failed to add block:", err);
    }
  };

  // ✏️ Update block
  const updateBlock = async (block) => {
    try {
      await axios.put(`${API_URL}/structure/blocks/${block.id}`, {
        block_name: block.block_name,
      });
      setEditingBlock(null);
      fetchBlocks();
    } catch (err) {
      console.error("Failed to update block:", err);
    }
  };

  // ❌ Delete block
  const deleteBlock = async (id) => {
    if (!window.confirm("Delete this block and all its houses?")) return;
    try {
      await axios.delete(`${API_URL}/structure/blocks/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Failed to delete block:", err);
    }
  };

  // ➕ Add house/unit
  const addHouse = async () => {
    if (!selectedBlock || !newHouse.trim() || !selectedMeter)
      return alert("Select block, house name, and meter");

    try {
      await axios.post(`${API_URL}/structure/units`, {
        unit_name: newHouse,
        block_id: selectedBlock,
        dev_eui: selectedMeter,
      });
      setNewHouse("");
      setSelectedMeter("");
      fetchAll();
    } catch (err) {
      console.error("Failed to add house:", err);
    }
  };

  // ✏️ Update unit
  const updateUnit = async (unit) => {
    try {
      await axios.put(`${API_URL}/structure/units/${unit.id}`, {
        unit_name: unit.unit_name,
        dev_eui: unit.dev_eui,
      });
      setEditingUnit(null);
      fetchAll();
    } catch (err) {
      console.error("Failed to update unit:", err);
    }
  };

  // ❌ Delete unit
  const deleteUnit = async (id) => {
    if (!window.confirm("Delete this house?")) return;
    try {
      await axios.delete(`${API_URL}/structure/units/${id}`);
      fetchAll();
    } catch (err) {
      console.error("Failed to delete unit:", err);
    }
  };

  // 🧮 Helpers
  const getUnitsByBlock = (blockId) =>
    units.filter((u) => u.block_id === blockId);

  const getUnassignedMeters = () =>
    meterList.filter((m) => !m.block_name && !m.unit_name);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-2xl font-semibold mb-6">⚙️ EMS Settings</h1>

      {/* ADD BLOCK */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-2">Add Block</h2>
        <div className="flex gap-2 flex-wrap items-center">
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

      {/* ADD HOUSE */}
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
              <option key={b.id} value={b.id}>
                {b.block_name}
              </option>
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
            {getUnassignedMeters().map((m) => (
              <option key={m.meter_id} value={m.meter_id}>
                {m.meter_id} (Unassigned)
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

      {/* DISPLAY STRUCTURE */}
      <div>
        <h2 className="text-lg font-medium mb-4">Current Structure</h2>

        {blocks.length === 0 ? (
          <p className="text-slate-400">No blocks added yet.</p>
        ) : (
          blocks.map((block) => (
            <div
              key={block.id}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-3"
            >
              {/* Block Header */}
              <div className="flex justify-between items-center mb-2">
                {editingBlock === block.id ? (
                  <div className="flex gap-2 items-center">
                    <input
                      value={block.block_name}
                      onChange={(e) =>
                        setBlocks((prev) =>
                          prev.map((b) =>
                            b.id === block.id
                              ? { ...b, block_name: e.target.value }
                              : b
                          )
                        )
                      }
                      className="bg-slate-900 border border-slate-700 px-2 py-1 rounded"
                    />
                    <button
                      onClick={() => updateBlock(block)}
                      className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingBlock(null)}
                      className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-green-400 font-semibold">
                      {block.block_name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingBlock(block.id)}
                        className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteBlock(block.id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Houses */}
              {getUnitsByBlock(block.id).length > 0 ? (
                <ul className="ml-4 space-y-1 text-sm">
                  {getUnitsByBlock(block.id).map((unit) => (
                    <li
                      key={unit.id}
                      className="flex justify-between items-center"
                    >
                      {editingUnit === unit.id ? (
                        <>
                          <input
                            value={unit.unit_name}
                            onChange={(e) =>
                              setUnits((prev) =>
                                prev.map((u) =>
                                  u.id === unit.id
                                    ? { ...u, unit_name: e.target.value }
                                    : u
                                )
                              )
                            }
                            className="bg-slate-900 border border-slate-700 px-2 py-1 rounded mr-2"
                          />
                          <select
                            value={unit.dev_eui}
                            onChange={(e) =>
                              setUnits((prev) =>
                                prev.map((u) =>
                                  u.id === unit.id
                                    ? { ...u, dev_eui: e.target.value }
                                    : u
                                )
                              )
                            }
                            className="bg-slate-900 border border-slate-700 px-2 py-1 rounded mr-2"
                          >
                            {meterList.map((m) => (
                              <option key={m.meter_id} value={m.meter_id}>
                                {m.meter_id}
                                {m.block_name
                                  ? ` (${m.block_name}-${m.unit_name})`
                                  : ""}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateUnit(unit)}
                            className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUnit(null)}
                            className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-sm"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span>
                            🏠 {unit.unit_name} —{" "}
                            <span className="text-blue-300">{unit.dev_eui}</span>
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUnit(unit.id)}
                              className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteUnit(unit.id)}
                              className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm ml-4">
                  No houses added yet.
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
