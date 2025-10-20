// components/EnergyMonitoring/KPI.jsx
import React from "react";

export default function KPI({ title, value, caption }) {
  return (
    <div className="bg-slate-900/60 rounded-lg p-6 border border-slate-700 shadow-md flex flex-col items-center justify-center h-48 text-center">
      <div className="text-slate-400 text-xs uppercase tracking-wide">{title}</div>
      <div className="text-white text-2xl font-semibold">{value}</div>
      {caption && <div className="mt-2 text-xs text-slate-500">{caption}</div>}
    </div>
  );
}
