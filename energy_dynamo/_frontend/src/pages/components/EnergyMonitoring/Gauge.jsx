// components/EnergyMonitoring/Gauge.jsx
import React from "react";

export default function Gauge({ value = 45 }) {
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
        <div className="text-center text-slate-300 text-sm">Current Power</div>
      </div>
    </div>
  );
}
