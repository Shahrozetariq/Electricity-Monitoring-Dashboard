import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Zap,
  LogOut,
  Activity,
  Thermometer,
  Gauge as GaugeIcon,
  CalendarDays,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const API_URL = "http://localhost:5000/api"; // 🔧 adjust if remote

// ---------------- HEADER ---------------- //
function Header({ selectedBlock, onSelectBlock, selectedHouse, onSelectHouse }) {
  const [blocks, setBlocks] = useState([]);
  const [houses, setHouses] = useState([]);

  useEffect(() => {
    fetchBlocks();
  }, []);

  useEffect(() => {
    if (selectedBlock && selectedBlock !== "All") fetchHouses(selectedBlock);
    else setHouses([]);
  }, [selectedBlock]);

  const fetchBlocks = async () => {
    try {
      const res = await axios.get(`${API_URL}/structure/blocks`);
      setBlocks(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch blocks:", err);
    }
  };

  const fetchHouses = async (blockId) => {
    try {
      const res = await axios.get(`${API_URL}/structure/units?block_id=${blockId}`);
      setHouses(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch houses:", err);
    }
  };

  return (
    <header className="bg-[#0b1628] border-b border-slate-700">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-wrap">
        <img src="/logo-boltvolt.png" alt="Bolt & Volt" className="h-10" />
        <div className="text-center flex-1">
          <h2 className="text-white text-lg font-semibold">Energy Monitoring</h2>
          <p className="text-slate-400 text-xs">Real-time Power & Energy Consumption</p>
        </div>
        <div className="flex items-center gap-2">
          <h3 className="text-white font-semibold text-sm">QDPS</h3>
          <img src="/logo-qdps.png" alt="QDPS" className="h-10" />
        </div>
      </div>

      {/* Blocks */}
      <div className="flex flex-wrap justify-center gap-2 py-2 bg-[#11213a]">
        <button
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

      {/* Houses */}
      {selectedBlock !== "All" && (
        <div className="flex flex-wrap justify-center gap-2 py-2 bg-[#0b1628]">
          <button
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
      )}
    </header>
  );
}

// ---------------- GAUGE ---------------- //
function Gauge({ value = 45 }) {
  const pct = Math.max(0, Math.min(100, value));
  const angle = (pct / 100) * 180;
  return (
    <div className="bg-gradient-to-b from-slate-900/60 to-slate-900/40 rounded-2xl p-5 border border-slate-700 shadow-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-52 h-36">
          <svg viewBox="0 0 200 120" className="w-full h-full">
            <path
              d="M10 110 A90 90 0 0 1 190 110"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M10 110 A90 90 0 0 1 190 110"
              fill="none"
              stroke="url(#g1)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(angle / 180) * 283} 283`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
            <defs>
              <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#16a34a" />
                <stop offset="60%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#60a5fa" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="70" r="28" fill="#0b1220" stroke="#0f1724" strokeWidth="1" />
            <text x="100" y="76" textAnchor="middle" fontSize="20" fill="#e6eef8" fontWeight="700">
              {value}
            </text>
            <text x="100" y="94" textAnchor="middle" fontSize="10" fill="#94a3b8">
              kW
            </text>
          </svg>
        </div>
        <div className="text-center">
          <div className="text-slate-300 text-sm">Current Power</div>
        </div>
      </div>
    </div>
  );
}

function KPI({ title, value, caption }) {
  return (
    <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-700 shadow-md flex flex-col items-center justify-center h-48 text-center">
      <div className="text-slate-400 text-xs uppercase tracking-wide">{title}</div>
      <div className="text-white text-2xl font-semibold">{value}</div>
      {caption && <div className="mt-2 text-xs text-slate-500">{caption}</div>}
    </div>
  );
}

// ---------------- MAIN ---------------- //
export default function EnergyMonitoringSystem() {
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedHouse, setSelectedHouse] = useState("All");
  const [view, setView] = useState("Daily");
  const [power, setPower] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [range, setRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
      key: "selection",
    },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  // Fetch Summary
  useEffect(() => {

    console.log(selectedHouse, "Block :", selectedBlock)
    if (!selectedBlock) return;
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API_URL}/sites/${selectedBlock}/summary`);
        setSummary({
          daily: Number(res.data.daily) || 0,
          weekly: Number(res.data.weekly) || 0,
          monthly: Number(res.data.monthly) || 0,
        });
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, [selectedBlock]);

  // Fetch Trend
  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const res = await axios.get(`${API_URL}/sites/${selectedBlock}/trend?view=${view.toLowerCase()}`);
        const mapped = res.data.map((d) => ({
          label: moment(d.label).format(view === "Daily" ? "HH:mm" : "DD MMM"),
          value: Number(d.value),
        }));
        setTrendData(mapped);
      } catch (err) {
        console.error("Error fetching trend:", err);
      }
    };
    if (selectedBlock !== "All") fetchTrend();
  }, [selectedBlock, view]);

  const exportToExcel = () => {
    if (!trendData || trendData.length === 0) return alert("No data available to export");
    const worksheet = XLSX.utils.json_to_sheet(trendData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trend Data");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const fileName = `trend_data_${view}_${moment().format("YYYYMMDD_HHmm")}.xlsx`;
    saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#071129,_#071023)] text-slate-100">
      <Header
        selectedBlock={selectedBlock}
        onSelectBlock={setSelectedBlock}
        selectedHouse={selectedHouse}
        onSelectHouse={setSelectedHouse}
      />

      <main className="p-6 md:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-1 space-y-12">
            <Gauge value={power} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KPI title="TODAY" value={summary.daily} caption="kWh" />
              <KPI title="Current WEEK" value={summary.weekly} caption="kWh" />
              <KPI title="Current MONTH" value={summary.monthly} caption="kWh" />
            </div>
          </section>

          <section className="xl:col-span-2 space-y-6">
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                <h3 className="font-semibold text-lg text-white">Energy Trend</h3>
                <div className="flex flex-col gap-4 relative">
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-slate-700 text-white hover:bg-slate-600"
                  >
                    <CalendarDays className="w-4 h-4" />
                    {`${moment(range[0].startDate).format("YYYY-MM-DD")} → ${moment(range[0].endDate).format("YYYY-MM-DD")}`}
                  </button>
                  {showPicker && (
                    <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg">
                      <DateRange
                        editableDateInputs
                        onChange={(item) => setRange([item.selection])}
                        moveRangeOnFirstSelection={false}
                        ranges={range}
                        maxDate={new Date()}
                        minDate={new Date(new Date().setDate(new Date().getDate() - 30))}
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    {["Daily", "Monthly", "Yearly"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                          view === v
                            ? "bg-white text-slate-900"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                    <button
                      onClick={exportToExcel}
                      className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-900/20 rounded-lg p-2" style={{ height: 302 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: "#0b1220", borderRadius: 8 }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      fill="url(#grad2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
