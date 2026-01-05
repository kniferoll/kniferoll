import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker } from "react-day-picker";
import { getTodayLocalDate, toLocalDate, formatToDateString } from "@/lib";
import "react-day-picker/style.css";

interface DateCalendarProps {
  selectedDate: string; // ISO date string (YYYY-MM-DD)
  onDateSelect: (date: string) => void;
  closedDays?: string[]; // Array of day names (e.g., ["sunday", "monday"])
}

const DAY_NAME_TO_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function DateCalendar({ selectedDate, onDateSelect, closedDays = [] }: DateCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState(() => toLocalDate(selectedDate));
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDateObj = toLocalDate(selectedDate);
  const todayString = getTodayLocalDate();
  const today = toLocalDate(todayString);
  const isToday = selectedDate === todayString;

  const formattedDate = selectedDateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  // Convert closedDays names to day indices for react-day-picker
  const closedDayIndices = closedDays
    .map((day) => DAY_NAME_TO_INDEX[day.toLowerCase()])
    .filter((index) => index !== undefined);

  // Matcher for disabled days
  const disabledMatcher = useCallback(
    (date: Date) => {
      const dayOfWeek = date.getDay();
      return closedDayIndices.includes(dayOfWeek);
    },
    [closedDayIndices]
  );

  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        const dateString = formatToDateString(date);
        onDateSelect(dateString);
        setIsOpen(false);
      }
    },
    [onDateSelect]
  );

  const handleGoToToday = useCallback(() => {
    onDateSelect(todayString);
    setMonth(today);
    setIsOpen(false);
  }, [onDateSelect, todayString, today]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Update month view when selected date changes externally
  useEffect(() => {
    setMonth(toLocalDate(selectedDate));
  }, [selectedDate]);

  // Show "Go to Today" if selected date is different from today
  const showGoToToday = selectedDate !== todayString;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800/50 border-2 border-stone-300 dark:border-slate-700 rounded-xl hover:bg-stone-50 dark:hover:bg-slate-800 hover:border-stone-400 dark:hover:border-slate-600 transition-all cursor-pointer text-sm font-semibold text-gray-900 dark:text-white"
      >
        <svg
          className={`w-5 h-5 transition-colors ${
            isToday ? "text-orange-500 dark:text-orange-400" : "text-gray-600 dark:text-slate-400"
          }`}
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
        {formattedDate}
      </button>

      {/* Calendar dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 md:left-auto md:right-0 z-50 animate-slideDown">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 shadow-xl dark:shadow-2xl dark:shadow-slate-900/50 p-4">
            {/* Go to Today button */}
            {showGoToToday && (
              <button
                onClick={handleGoToToday}
                className="w-full mb-3 px-3 py-2 text-xs font-semibold text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-xl transition-colors border border-orange-200 dark:border-orange-500/30 cursor-pointer"
              >
                Go to Today
              </button>
            )}

            <DayPicker
              mode="single"
              selected={selectedDateObj}
              onSelect={handleSelect}
              month={month}
              onMonthChange={setMonth}
              today={today}
              disabled={disabledMatcher}
              showOutsideDays={false}
              fixedWeeks={false}
              style={
                {
                  "--rdp-accent-color": "#f97316",
                  "--rdp-accent-background-color": "#fff7ed",
                  "--rdp-day_button-border-radius": "8px",
                  "--rdp-selected-border": "none",
                  "--rdp-today-color": "#ea580c",
                } as React.CSSProperties
              }
              classNames={{
                month_caption:
                  "rdp-month_caption flex justify-center py-2 text-base font-semibold text-gray-800 dark:text-slate-100 cursor-default",
                button_previous:
                  "rdp-button_previous p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors cursor-pointer",
                button_next:
                  "rdp-button_next p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 transition-colors cursor-pointer",
                chevron: "rdp-chevron w-4 h-4 fill-stone-500 dark:fill-slate-400",
                weekday:
                  "rdp-weekday text-xs font-medium text-stone-400 dark:text-slate-500 w-9 h-9",
                day: "rdp-day w-9 h-9 text-center",
                day_button:
                  "rdp-day_button w-9 h-9 text-sm font-medium rounded-lg cursor-pointer text-stone-700 dark:text-slate-300 transition-all duration-150 hover:bg-stone-200 dark:hover:bg-slate-600 hover:scale-105",
                today:
                  "rdp-today [&>button]:font-semibold [&>button]:text-orange-600 [&>button]:dark:text-orange-400",
                selected:
                  "rdp-selected [&>button]:bg-orange-500 [&>button]:text-white [&>button]:font-semibold [&>button]:hover:bg-orange-500 [&>button]:shadow-md [&>button]:shadow-orange-500/40",
                disabled:
                  "rdp-disabled [&>button]:text-stone-300 [&>button]:dark:text-slate-600 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent [&>button]:hover:scale-100",
                outside: "rdp-outside [&>button]:text-stone-300 [&>button]:dark:text-slate-600",
              }}
              labels={{
                labelPrevious: () => "Previous month",
                labelNext: () => "Next month",
              }}
              formatters={{
                formatCaption: (date) =>
                  date.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  }),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
