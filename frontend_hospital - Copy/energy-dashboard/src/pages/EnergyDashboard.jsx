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
import { Zap, LogOut, Activity, Thermometer, Gauge as GaugeIcon } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from 'moment'
import { DateRange } from "react-date-range";
import { CalendarDays } from "lucide-react"; // icon
import { FileSpreadsheet } from "lucide-react"; // Excel icon
import "react-date-range/dist/styles.css"; // main css
import "react-date-range/dist/theme/default.css"; // theme css


// ------------------------
// Constants
// ------------------------

const BLOCKS = ["All", "Block 1", "Block 2 & 3", "Diagnostic Center"];
const API_URL = "http://182.180.69.171:5000/api";
// const API_URL = "http://localhost:5000/api";
// const siteId = selectedBlock === "Block 1" ? 1 : selectedBlock === "Block 2 & 3" ? 2 : 3;

// ------------------------
// Components
// ------------------------



function Topbar({ selected, onSelect }) {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-r from-slate-900/80 to-slate-800/80 border-b border-slate-700 flex-wrap">
      {/* Logo */}
      <img src="logo.png" className="text-white w-30 h-14" alt="Logo" />

      {/* Title */}
      <div className="flex flex-col">
        <h1 className="text-lg md:text-2xl font-semibold text-white leading-tight">
          Energy Monitoring
        </h1>
        <p className="text-xs text-slate-400">
          Real-time power & consumption overview
        </p>
      </div>

      {/* Block Selector & Logout */}
      <div className="flex items-center gap-3 ml-auto">
        {/* ✅ Dropdown for Mobile */}
        <div className="sm:hidden">
          <select
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400/40"
          >
            {BLOCKS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* ✅ Button Group for Desktop */}
        <nav className="hidden sm:flex gap-2 bg-slate-800/40 backdrop-blur rounded-full p-1">
          {BLOCKS.map((b) => (
            <button
              key={b}
              aria-pressed={selected === b}
              onClick={() => onSelect(b)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-green-400/40 ${selected === b
                ? "bg-white text-slate-900 shadow"
                : "text-slate-300 hover:bg-slate-700/60"
                }`}
            >
              {b}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="hidden sm:flex items-center gap-3">
          <button className="inline-flex items-center gap-2 bg-green-500/90 hover:bg-green-600 text-white px-3 py-2 rounded-lg">
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}


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
            <circle
              cx="100"
              cy="70"
              r="28"
              fill="#0b1220"
              stroke="#0f1724"
              strokeWidth="1"
            />
            <text
              x="100"
              y="76"
              textAnchor="middle"
              fontSize="20"
              fill="#e6eef8"
              fontWeight="700"
            >
              {value}
            </text>
            <text
              x="100"
              y="94"
              textAnchor="middle"
              fontSize="10"
              fill="#94a3b8"
            >
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
      <div className="text-slate-400 text-xs uppercase tracking-wide">
        {title}
      </div>
      <div className="text-white text-2xl font-semibold">{value}</div>
      {caption && (
        <div className="mt-2 text-xs text-slate-500">{caption}</div>
      )}
    </div>

  );
}

// ------------------------
// Main Component
// ------------------------

export default function EnergyMonitoringSystem() {
  const [selectedBlock, setSelectedBlock] = useState(BLOCKS[0]);
  const [view, setView] = useState("Daily");
  const [power, setPower] = useState(0);
  const [trendData, setTrendData] = useState([]);
  const [consumptionData, setConsumptionData] = useState([]);
  const [deviceData, setDeviceData] = useState(null);
  const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0 }); // ✅ NEW
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [range, setRange] = useState([
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  const exportToExcel = () => {
    if (!trendData || trendData.length === 0) {
      alert("No data available to export");
      return;
    }

    // Decide column name based on view
    let labelKey = "Label";
    if (view === "Daily") labelKey = "Time";
    else if (view === "Monthly") labelKey = "Date";
    else if (view === "Yearly") labelKey = "Month";

    // Map data with correct key names
    const exportData = trendData.map((item) => ({
      [labelKey]: item.label, // dynamic column header
      Value: item.value ?? "", // show blank if null
    }));

    // Convert chart data into worksheet
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trend Data");

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

    // Save file with proper name
    const fileName = `trend_data_${view.toLowerCase()}_${selectedBlock}_${moment().format(
      "YYYYMMDD_HHmm"
    )}.xlsx`;
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, fileName);
  };


  useEffect(() => {
    if (!selectedBlock) return;

    const fetchSummary = async () => {
      try {
        console.log("this is the selected block sum: ", selectedBlock)
        const siteId =
          selectedBlock === "All"
            ? "all" :
            selectedBlock === "Block 1"
              ? 1
              : selectedBlock === "Block 2 & 3"
                ? 2
                : 3;

        const res = await axios.get(`${API_URL}/sites/${siteId}/summary`);
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

  const fetchTrendRange = async () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end dates");
      return;
    }

    try {
      if (!selectedBlock) return;

      if (selectedBlock === "All") {
        const siteIds = [1, 2, 3];
        let combinedMap = new Map();

        for (const id of siteIds) {
          let url = `${API_URL}/sites/${id}/trend?view=${view.toLowerCase()}&from=${startDate}&to=${endDate}`;
          const res = await axios.get(url);

          res.data.forEach((d) => {
            const date = moment(d.label);
            let label;
            label = date.format("DD MMM");


            const value = Number(d.value) || 0;
            combinedMap.set(label, (combinedMap.get(label) || 0) + value);
          });
        }

        const mapped = Array.from(combinedMap.entries()).map(([label, value]) => ({
          label,
          value,
        }));

        setTrendData(mapped);
        return;
      }

      // Single site
      const siteId =
        selectedBlock === "Block 1"
          ? 1
          : selectedBlock === "Block 2 & 3"
            ? 2
            : 3;

      let url = `${API_URL}/sites/${siteId}/trend?view=${view.toLowerCase()}&from=${startDate}&to=${endDate}`;
      const res = await axios.get(url);

      const mapped = res.data.map((d) => {
        const date = moment(d.label);

        return { label: date.format("DD MMM"), value: Number(d.value) };
      });

      setTrendData(mapped);
    } catch (err) {
      console.error("Error fetching trend range:", err);
    }
  };

  // Fetch Current Device Data
  useEffect(() => {
    if (!selectedBlock) return;
    // final fetch current
    //     const fetchCurrent = async () => {
    //   try {
    //     if (selectedBlock === "All") {
    //       const siteIds = [1, 2, 3];
    //       let totals = {
    //         current_a: 0,
    //         current_b: 0,
    //         current_c: 0,
    //         power_a: 0,
    //         power_b: 0,
    //         power_c: 0,
    //         voltage_a: 0,
    //         voltage_b: 0,
    //         voltage_c: 0,
    //         temperature: 0,
    //         total_power: 0,
    //       };

    //       for (const id of siteIds) {
    //         const res = await axios.get(`${API_URL}/sites/${id}/current`);
    //         const data = res.data;

    //         // Sum currents
    //         totals.current_a += parseFloat(data.current_a) || 0;
    //         totals.current_b += parseFloat(data.current_b) || 0;
    //         totals.current_c += parseFloat(data.current_c) || 0;

    //         // Sum powers
    //         totals.power_a += parseFloat(data.power_a) || 0;
    //         totals.power_b += parseFloat(data.power_b) || 0;
    //         totals.power_c += parseFloat(data.power_c) || 0;

    //         // Average later → sum voltages & temperature
    //         totals.voltage_a += parseFloat(data.voltage_a) || 0;
    //         totals.voltage_b += parseFloat(data.voltage_b) || 0;
    //         totals.voltage_c += parseFloat(data.voltage_c) || 0;
    //         totals.temperature += parseFloat(data.temperature) || 0;

    //         // Sum total_power
    //         const sitePower = parseFloat(data.total_power) || 0;
    //         totals.total_power += sitePower > 0 ? sitePower : 0;
    //       }

    //       // Averages for voltages & temperature
    //       const count = siteIds.length;
    //       totals.voltage_a = totals.voltage_a / count;
    //       totals.voltage_b = totals.voltage_b / count;
    //       totals.voltage_c = totals.voltage_c / count;
    //       totals.temperature = totals.temperature / count;

    //       setDeviceData(totals);
    //       setPower(totals.total_power);
    //       return;
    //     } else {
    //       // Map selected block -> siteId
    //       const siteId =
    //         selectedBlock === "Block 1"
    //           ? 1
    //           : selectedBlock === "Block 2 & 3"
    //           ? 2
    //           : 3;

    //       const res = await axios.get(`${API_URL}/sites/${siteId}/current`);
    //       const data = res.data;

    //       // Clamp negative total_power to 0
    //       const safePower = parseFloat(data.total_power) || 0;
    //       const clampedPower = safePower > 0 ? safePower : 0;

    //       setDeviceData({
    //         ...data,
    //         total_power: clampedPower,
    //       });
    //       setPower(clampedPower);
    //     }
    //   } catch (err) {
    //     console.error("Error fetching current data:", err);
    //     setPower(0);
    //     setDeviceData({});
    //   }
    // };
    const fetchCurrent = async () => {
      try {
        if (selectedBlock === "All") {
          const siteIds = [1, 2, 3];
          let totals = {
            current_a: 0,
            current_b: 0,
            current_c: 0,
            power_a: 0,
            power_b: 0,
            power_c: 0,
            voltage_a: 0,
            voltage_b: 0,
            voltage_c: 0,
            temperature: 0,
            total_power: 0,
            energy_import: 0,
            energy_export: 0,
            max_demand: 0,
          };

          let weightedPFNum = 0; // numerator for weighted PF
          let weightedPFDen = 0; // denominator for weighted PF

          for (const id of siteIds) {
            const res = await axios.get(`${API_URL}/sites/${id}/current`);
            const data = res.data;

            // Sum currents
            totals.current_a += parseFloat(data.current_a) || 0;
            totals.current_b += parseFloat(data.current_b) || 0;
            totals.current_c += parseFloat(data.current_c) || 0;

            // Sum powers
            totals.power_a += parseFloat(data.power_a) || 0;
            totals.power_b += parseFloat(data.power_b) || 0;
            totals.power_c += parseFloat(data.power_c) || 0;

            // Sum voltages for averaging
            totals.voltage_a += parseFloat(data.voltage_a) || 0;
            totals.voltage_b += parseFloat(data.voltage_b) || 0;
            totals.voltage_c += parseFloat(data.voltage_c) || 0;

            // Sum temperature for averaging
            totals.temperature += parseFloat(data.temperature) || 0;

            // Energy
            totals.energy_import += parseFloat(data.energy_import) || 0;
            totals.energy_export += parseFloat(data.energy_export) || 0;

            // Max demand → take maximum
            const md = parseFloat(data.max_demand) || 0;
            if (md > totals.max_demand) totals.max_demand = md;

            // Total power (clamp negatives to 0 for display)
            const sitePower = parseFloat(data.total_power) || 0;
            const clampedPower = sitePower > 0 ? sitePower : 0;
            totals.total_power += clampedPower;

            // Weighted PF = sum(PF * Power) / sum(Power)
            const pf = parseFloat(data.power_factor) || 0;
            if (sitePower > 0) {
              weightedPFNum += pf * sitePower;
              weightedPFDen += sitePower;
            }
          }

          // Finalize averages
          const count = siteIds.length;
          totals.voltage_a = totals.voltage_a / count;
          totals.voltage_b = totals.voltage_b / count;
          totals.voltage_c = totals.voltage_c / count;
          totals.temperature = totals.temperature / count;

          // Calculate weighted PF
          totals.power_factor =
            weightedPFDen > 0 ? weightedPFNum / weightedPFDen : 0;

          setDeviceData(totals);
          setPower(totals.total_power.toFixed(1));
          return;
        } else {
          // Map selected block -> siteId
          const siteId =
            selectedBlock === "Block 1"
              ? 1
              : selectedBlock === "Block 2 & 3"
                ? 2
                : 3;

          const res = await axios.get(`${API_URL}/sites/${siteId}/current`);
          const data = res.data;

          // Clamp negative total_power
          const safePower = parseFloat(data.total_power) || 0;
          const clampedPower = safePower > 0 ? safePower : 0;

          setDeviceData({
            ...data,
            total_power: clampedPower,
          });
          setPower(clampedPower);
        }
      } catch (err) {
        console.error("Error fetching current data:", err);
        setPower(0);
        setDeviceData({});
      }
    };


    fetchCurrent();

    //fix update timer to 5000
    const intervalId = setInterval(fetchCurrent, 500000);

    // Clean up interval on unmount or when selectedBlock changes
    return () => clearInterval(intervalId)
  }, [selectedBlock]);

  // Fetch Consumption Data
  useEffect(() => {
    if (!selectedBlock) return;

    const fetchConsumption = async () => {
      try {
        console.log("this is the selected block con: ", selectedBlock)
        if (selectedBlock === "All") {
          console.log("Going in Cur:", selectedBlock)
          const siteIds = [1, 2, 3];
          let combinedMap = new Map();

          for (const id of siteIds) {
            const res = await axios.get(
              `${API_URL}/sites/${id}/consumption?period=${view.toLowerCase()}`
            );

            res.data.forEach((d) => {
              const label = d.label;
              const value = Number(d.value || d.energy_import) || 0;
              combinedMap.set(label, (combinedMap.get(label) || 0) + value);
            });
          }

          const combined = Array.from(combinedMap.entries()).map(([label, value]) => ({
            label,
            value,
          }));

          setConsumptionData(combined);
          return;
        } else {

          const siteId =
            selectedBlock === "Block 1"
              ? 1
              : selectedBlock === "Block 2 & 3"
                ? 2
                : 3;

          const res = await axios.get(
            `${API_URL}/sites/${siteId}/consumption?period=${view.toLowerCase()}`
          );



          setConsumptionData(res.data || []);
        }
      } catch (err) {
        console.error("Error fetching trend data:", err);
      }
    };

    const fetchTrend = async (isRange = false) => {
      try {

        console.log("this is the selected block : ", selectedBlock)
        if (selectedBlock === "All") {
          console.log("Going in Cur:", selectedBlock)
          const siteIds = [1, 2, 3];
          let combinedMap = new Map();

          for (const id of siteIds) {
            let url = `${API_URL}/sites/${id}/trend?view=${view.toLowerCase()}`;
            if (isRange && startDate && endDate) {
              url += `&start=${startDate}&end=${endDate}`;
            }
            const res = await axios.get(url);

            res.data.forEach((d) => {
              const date = moment(d.label);
              let label;
              if (view === "Daily") label = date.format("HH:mm");
              else if (view === "Monthly") label = date.format("DD MMM");
              else if (view === "Yearly") label = date.format("MMM YYYY");
              else label = date.format("YYYY-MM-DD");

              const value = Number(d.value) || 0;
              combinedMap.set(label, (combinedMap.get(label) || 0) + value);
            });
          }

          // Convert back to array
          const mapped = Array.from(combinedMap.entries()).map(([label, value]) => ({
            label,
            value,
          }));

          setTrendData(mapped);
          return;
        } else {        // Single site
          let siteId =
            selectedBlock === "Block 1"
              ? 1
              : selectedBlock === "Block 2 & 3"
                ? 2
                : 3;

          let url = `${API_URL}/sites/${siteId}/trend?view=${view.toLowerCase()}`;
          if (isRange && startDate && endDate) {
            url += `&start=${startDate}&end=${endDate}`;
          }

          const res = await axios.get(url);
          const mapped = res.data.map((d) => {
            const date = moment(d.label);
            if (view === "Daily") return { label: date.format("HH:mm"), value: Number(d.value) };
            if (view === "Monthly") return { label: date.format("DD MMM"), value: Number(d.value) };
            if (view === "Yearly") return { label: date.format("MMM YYYY"), value: Number(d.value) };
            if (view === "All") return { label: date.format("YYYY-MM-DD"), value: Number(d.value) };
            return { label: date.format("YYYY-MM-DD"), value: Number(d.value) };
          });

          setTrendData(mapped);
        }
      } catch (err) {
        console.error("Error fetching trend data:", err);
      }
    };


    fetchTrend();

    fetchConsumption();


  }, [selectedBlock, view]);


  //  useEffect(() => {
  //   if (!selectedBlock) return;


  //     const fetchTrend = async () => {
  //     try {
  //       const res = await axios.get(`${API_URL}/${selectedBlock}/trend?view=${view.toLowerCase()}`);
  //       const mapped = res.data.map((d) => {
  //         const date = new Date(d.label);
  //         if (view === "Daily") {
  //           return { label: date.getHours() + ":00", value: Number(d.value) };
  //         } else if (view === "Monthly") {
  //           return { label: date.getMonth().toString(), value: Number(d.value) };
  //         } else {
  //           return { label: date.toLocaleString("default", { month: "short" }), value: Number(d.value) };
  //         }
  //       });
  //       setTrendData(mapped);
  //     } catch (err) {
  //       console.error("Error fetching trend data:", err);
  //     }
  //   };

  //   fetchTrend();

  //   },[selectedBlock, view]);



  // Totals derived from trend data
  const totals = useMemo(() => {
    const sum = consumptionData.reduce(
      (s, r) => s + (r.value || r.energy_import || 0),
      0
    );
    return {
      today:
        view === "Daily"
          ? Math.round(sum)
          : view === "Monthly"
            ? Math.round(sum)
            : Math.round(sum / 1000),
      week: Math.round(Math.random() * 200 + 40),
      month: Math.round(Math.random() * 400 + 120),
    };
  }, [trendData, view]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_#071129,_#071023)] text-slate-100">
      <Topbar selected={selectedBlock} onSelect={setSelectedBlock} />

      <main className="p-6 md:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-1 space-y-12">
            <Gauge value={power} className="h-58" />
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

                <div className="text-sm text-slate-400">
                  {selectedBlock} — {view}
                </div>
                {/* <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-slate-700 text-white px-2 py-1 rounded-md text-sm"
                  />
                  <span className="text-slate-400">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-slate-700 text-white px-2 py-1 rounded-md text-sm"
                  />
                  <button
                    onClick={fetchTrendRange}
                    className="px-3 py-1 rounded-md text-sm bg-green-600 text-white hover:bg-green-700"
                  >
                    Apply
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {["Daily", "Monthly", "Yearly"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-3 py-1 rounded-md text-sm transition ${view === v
                        ? "bg-white text-slate-900"
                        : "text-slate-300 hover:bg-slate-700"
                        }`}
                    >
                      {v}
                    </button>
                  ))}

                  <button
                    onClick={exportToExcel}
                    className="px-3 py-1 rounded-md text-sm bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Export Excel
                  </button>
                </div> */}
                <div className="flex flex-col gap-4 relative">
                  {/* Range Icon */}
                  <button
                    onClick={() => setShowPicker(!showPicker)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-slate-700 text-white hover:bg-slate-600"
                  >
                    <CalendarDays className="w-4 h-4" />
                    {`${moment(range[0].startDate).format("YYYY-MM-DD")} → ${moment(
                      range[0].endDate
                    ).format("YYYY-MM-DD")}`}
                  </button>

                  {/* Date Range Picker Popup */}
                  {showPicker && (
                    <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg">
                      <DateRange
                        editableDateInputs={true}
                        onChange={(item) => {
                          setRange([item.selection]);

                          const start = moment(item.selection.startDate).format("YYYY-MM-DD");
                          const end = moment(item.selection.endDate).add(1, "day").format("YYYY-MM-DD"); // +1 day

                          setStartDate(start);
                          setEndDate(end);
                        }}
                        moveRangeOnFirstSelection={false}
                        ranges={range}
                        maxDate={new Date()}
                        minDate={new Date(new Date().setDate(new Date().getDate() - 30))}
                      />


                      <div className="flex justify-end p-2">
                        <button
                          onClick={() => {
                            setStartDate(moment(range[0].startDate).format("YYYY-MM-DD"));
                            setEndDate(moment(range[0].endDate).format("YYYY-MM-DD"));
                            setShowPicker(false);
                            fetchTrendRange(); // apply after selecting
                          }}
                          className="px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Views + Export */}
                  <div className="flex items-center gap-2">
                    {["Daily", "Monthly", "Yearly"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition ${view === v
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

              <div className="md:col-span-2 bg-slate-900/20 rounded-lg p-2">
                <div style={{ height: 302 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} >
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
            </div>
          </section>

        </div>

        {deviceData && (
          <>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 text-sm font-medium">
                    Voltage
                  </div>
                  <Activity className="w-4 h-4 text-green-400" />
                </div>
                <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase A:</span>
                    <span className="font-semibold">
                      {Number(deviceData.voltage_a || 0).toFixed(2)} V
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase B:</span>
                    <span className="font-semibold">
                      {Number(deviceData.voltage_b || 0).toFixed(2)} V
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase C:</span>
                    <span className="font-semibold">
                      {Number(deviceData.voltage_c || 0).toFixed(2)} V
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 text-sm font-medium">
                    Current
                  </div>
                  <Zap className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase A:</span>
                    <span className="font-semibold">
                      {Number(deviceData.current_a || 0).toFixed(2)} A
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase B:</span>
                    <span className="font-semibold">
                      {Number(deviceData.current_b || 0).toFixed(2)} A
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase C:</span>
                    <span className="font-semibold">
                      {Number(deviceData.current_c || 0).toFixed(2)} A
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 text-sm font-medium">
                    Power
                  </div>
                  <GaugeIcon className="w-4 h-4 text-yellow-400" />
                </div>
                <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase A:</span>
                    <span className="font-semibold">
                      {Number(deviceData.power_a || 0).toFixed(2)} kW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase B:</span>
                    <span className="font-semibold">
                      {Number(deviceData.power_b || 0).toFixed(2)} kW
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase C:</span>
                    <span className="font-semibold">
                      {Number(deviceData.power_c || 0).toFixed(2)} kW
                    </span>
                  </div>
                </div>
                {/* <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Power Factor:</span>
                    <span className="font-semibold">
                      {deviceData.power_factor}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Frequency:</span>
                    <span className="font-semibold">
                      {deviceData.frequency || "--"} Hz
                    </span>
                  </div>
                </div> */}
              </div>

              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-slate-300 text-sm font-medium">
                    Temperature
                  </div>
                  <Thermometer className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-white text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase A:</span>
                    <span className="font-semibold">
                      {deviceData.temp_a > 0 ? deviceData.temp_a : 0} °C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase B:</span>
                    <span className="font-semibold">
                      {deviceData.temp_b > 0 ? deviceData.temp_b : 0} °C
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phase C:</span>
                    <span className="font-semibold">
                      {deviceData.temp_c > 0 ? deviceData.temp_c : 0} °C
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 text-center">
                <div className="text-2xl font-bold text-yellow-400">{Number(deviceData.power_factor || 0).toFixed(2)}</div>
                <div className="text-slate-400 text-sm">Power Factor</div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 text-center">
                <div className="text-2xl font-bold text-red-400">{Number(deviceData.energy_import || 0).toFixed(2)}</div>
                <div className="text-slate-400 text-sm">Energy Import (kWh)</div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 text-center">
                <div className="text-2xl font-bold text-green-400">{Number(deviceData.energy_export || 0).toFixed(2)}</div>
                <div className="text-slate-400 text-sm">Energy Export (kWh)</div>
              </div>

              <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700 text-center">
                <div className="text-2xl font-bold text-blue-400">{Number(deviceData.max_demand || 0).toFixed(2)}</div>
                <div className="text-slate-400 text-sm">Max Demand (kW)</div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
