// components/EnergyMonitoring/EnergyMonitoringSystem.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import Header from "./Header";
import Gauge from "./Gauge";
import KPI from "./KPI";
import TrendChart from "./TrendChart";
import DateRangePicker from "./DateRangePicker";
import { FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import moment from "moment";

const API_URL = "http://localhost:5000/api";

export default function EnergyMonitoringSystem() {
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedHouse, setSelectedHouse] = useState("All");
  const [view, setView] = useState("Daily");
  const [trendData, setTrendData] = useState([]);
  const [summary, setSummary] = useState({ daily: 0, weekly: 0, monthly: 0 });
  const [power, setPower] = useState(0);
  const [range, setRange] = useState([
    { startDate: new Date(new Date().setDate(new Date().getDate() - 30)), endDate: new Date(), key: "selection" },
  ]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (selectedBlock === "All") return;
    const fetchSummary = async () => {
      try {
        const res = await axios.get(`${API_URL}/sites/${selectedBlock}/summary`);
        setSummary(res.data);
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, [selectedBlock]);

  useEffect(() => {
    if (selectedBlock === "All") return;
    const fetchTrend = async () => {
      try {
        const res = await axios.get(`${API_URL}/sites/${selectedBlock}/trend?view=${view.toLowerCase()}`);
        setTrendData(
          res.data.map((d) => ({
            label: moment(d.label).format(view === "Daily" ? "HH:mm" : "DD MMM"),
            value: Number(d.value),
          }))
        );
      } catch (err) {
        console.error("Error fetching trend:", err);
      }
    };
    fetchTrend();
  }, [selectedBlock, view]);

  const exportToExcel = () => {
    if (!trendData || trendData.length === 0) return alert("No data available to export");
    const ws = XLSX.utils.json_to_sheet(trendData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Trend Data");
    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), `trend_${moment().format("YYYYMMDD_HHmm")}.xlsx`);
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
                <DateRangePicker
                  range={range}
                  show={showPicker}
                  onToggle={() => setShowPicker(!showPicker)}
                  onApply={() => setShowPicker(false)}
                  setRange={setRange}
                />
                <div className="flex items-center gap-2">
                  {["Daily", "Monthly", "Yearly"].map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
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
              <TrendChart data={trendData} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
