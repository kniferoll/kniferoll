import { useState, useRef, useEffect, useCallback } from "react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
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

export function DateCalendar({
  selectedDate,
  onDateSelect,
  closedDays = [],
}: DateCalendarProps) {
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

  // Update month view when selected date changes externally
  useEffect(() => {
    setMonth(toLocalDate(selectedDate));
  }, [selectedDate]);

  const defaultClassNames = getDefaultClassNames();

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
            isToday
              ? "text-orange-500 dark:text-orange-400"
              : "text-gray-600 dark:text-slate-400"
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
              classNames={{
                root: `${defaultClassNames.root}`,
                month_caption: `${defaultClassNames.month_caption} justify-center text-base font-semibold text-gray-900 dark:text-slate-50`,
                nav: `${defaultClassNames.nav}`,
                button_previous: `${defaultClassNames.button_previous} hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer`,
                button_next: `${defaultClassNames.button_next} hover:bg-stone-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer`,
                chevron: `${defaultClassNames.chevron} fill-gray-600 dark:fill-slate-400`,
                weekday: `${defaultClassNames.weekday} text-xs font-semibold text-stone-500 dark:text-slate-500`,
                day: `${defaultClassNames.day} text-sm font-medium text-gray-900 dark:text-slate-200`,
                day_button: `${defaultClassNames.day_button} rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer`,
                today: `${defaultClassNames.today} bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 font-semibold`,
                selected: `${defaultClassNames.selected} !bg-gradient-to-br !from-orange-500 !to-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30`,
                disabled: `${defaultClassNames.disabled} text-stone-300 dark:text-slate-600 !cursor-not-allowed hover:!bg-transparent`,
                outside: `${defaultClassNames.outside} text-stone-400 dark:text-slate-600`,
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
