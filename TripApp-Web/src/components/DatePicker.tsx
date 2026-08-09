import { useState } from "react";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

type DateRange = {
  from?: Date;
  to?: Date;
};

interface DatePickerProps {
  selected?: DateRange;
  onSelect?: (range?: DateRange) => void;
}

export default function DatePicker({ selected, onSelect }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const range = selected;
  const label = range?.from && range?.to
    ? `${range.from.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} - ${range.to.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`
    : range?.from
    ? `${range.from.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })} - ...`
    : "Start - End date";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <Calendar className="h-5 w-5 text-slate-400" />
        <div>
          <p className="text-sm font-semibold">Select dates</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
          <DayPicker
            mode="range"
            selected={range as any}
            onSelect={(nextRange) => {
              onSelect?.(nextRange as DateRange | undefined);
              if (nextRange?.from && nextRange?.to) {
                setOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
