// components/EnergyMonitoring/DateRangePicker.jsx
import React from "react";
import { DateRange } from "react-date-range";
import moment from "moment";
import { CalendarDays } from "lucide-react";

export default function DateRangePicker({ range, show, onToggle, onApply, setRange }) {
  return (
    <div className="flex flex-col gap-4 relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-slate-700 text-white hover:bg-slate-600"
      >
        <CalendarDays className="w-4 h-4" />
        {`${moment(range[0].startDate).format("YYYY-MM-DD")} → ${moment(range[0].endDate).format("YYYY-MM-DD")}`}
      </button>
      {show && (
        <div className="absolute z-50 mt-2 bg-white shadow-lg rounded-lg">
          <DateRange
            editableDateInputs
            onChange={(item) => setRange([item.selection])}
            moveRangeOnFirstSelection={false}
            ranges={range}
            maxDate={new Date()}
            minDate={new Date(new Date().setDate(new Date().getDate() - 30))}
          />
          <div className="flex justify-end p-2">
            <button
              onClick={onApply}
              className="px-4 py-1 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
