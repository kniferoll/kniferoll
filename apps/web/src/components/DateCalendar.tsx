import { useState, useRef, useEffect } from "react";
import {
  getTodayLocalDate,
  toLocalDate,
  formatToDateString,
} from "../lib/dateUtils";

interface DateCalendarProps {
  selectedDate: string; // ISO date string (YYYY-MM-DD)
  onDateSelect: (date: string) => void;
  closedDays?: string[]; // Array of day names (e.g., ["sunday", "monday"])
}

function CalendarGrid({
  selectedDate,
  onDateSelect,
  closedDays = [],
  onClose,
}: DateCalendarProps & { onClose: () => void }) {
  const [viewDate, setViewDate] = useState(() => {
    const date = toLocalDate(selectedDate);
    return new Date(date.getFullYear(), date.getMonth(), 1);
  });

  const today = toLocalDate(getTodayLocalDate());

  const selectedDateObj = toLocalDate(selectedDate);

  // Get first day of month and number of days
  const firstDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth(),
    1
  );
  const lastDayOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0
  );
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  // Create array of day objects
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isDayNameClosed = (date: Date) => {
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    return closedDays.includes(dayName);
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateString = formatToDateString(newDate);
    onDateSelect(dateString);
  };

  const handleGoToToday = () => {
    const dateString = formatToDateString(today);
    onDateSelect(dateString);
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const monthName = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 p-6 shadow-sm dark:shadow-lg w-80 max-w-[calc(100vw-32px)]">
      {/* Header with month/year and navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="flex-1 text-center">
          <h3 className="text-base font-semibold text-gray-900 dark:text-slate-50">
            {monthName}
          </h3>
        </div>

        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Next month"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Today button */}
      {selectedDate !== formatToDateString(today) && (
        <button
          onClick={handleGoToToday}
          className="w-full mb-4 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-blue-200 dark:border-blue-400"
        >
          Go to Today
        </button>
      )}

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2 mb-3">
        {weekDays.map((day) => (
          <div
            key={day}
            className="h-10 flex items-center justify-center text-xs font-semibold text-gray-500 dark:text-slate-400"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="h-10" />;
          }

          const date = new Date(
            viewDate.getFullYear(),
            viewDate.getMonth(),
            day
          );
          const isClosed = isDayNameClosed(date);
          const isSelected = date.getTime() === selectedDateObj.getTime();
          const isToday = date.getTime() === today.getTime();

          return (
            <button
              key={day}
              onClick={() => {
                if (!isClosed) {
                  handleDateClick(day);
                  onClose();
                }
              }}
              disabled={isClosed}
              className={`h-10 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${
                isClosed
                  ? "text-gray-300 dark:text-slate-600 cursor-not-allowed"
                  : isSelected
                  ? "bg-blue-600 dark:bg-blue-700 text-white font-semibold shadow-md dark:shadow-lg"
                  : isToday
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800"
                  : "text-gray-900 dark:text-slate-50 hover:bg-gray-100 dark:hover:bg-slate-800"
              }`}
              title={isClosed ? "Kitchen closed" : ""}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateCalendar({
  selectedDate,
  onDateSelect,
  closedDays = [],
}: DateCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDateObj = toLocalDate(selectedDate);
  const todayString = getTodayLocalDate();

  const isToday = selectedDate === todayString;

  const formattedDate = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Minimal date display button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <div className="text-left">
          <div className="text-sm font-semibold text-gray-900 dark:text-slate-50">
            {formattedDate}
          </div>
          {isToday && (
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              Today
            </div>
          )}
        </div>
      </button>

      {/* Dropdown with calendar grid */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl p-4">
            <CalendarGrid
              selectedDate={selectedDate}
              onDateSelect={(date) => {
                onDateSelect(date);
                setIsOpen(false);
              }}
              closedDays={closedDays}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
