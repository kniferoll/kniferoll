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
        className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-white/10 border-2 border-gray-300 dark:border-white/20 rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-colors text-sm font-semibold text-gray-900 dark:text-white"
      >
        <svg
          className={`w-5 h-5 transition-colors ${
            isToday
              ? "text-blue-500 dark:text-blue-400"
              : "text-gray-600 dark:text-white/70"
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
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-800 shadow-lg dark:shadow-xl p-4">
            {/* Go to Today button */}
            {showGoToToday && (
              <button
                onClick={handleGoToToday}
                className="w-full mb-3 px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-blue-200 dark:border-blue-400"
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
                button_previous: `${defaultClassNames.button_previous} hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors`,
                button_next: `${defaultClassNames.button_next} hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors`,
                chevron: `${defaultClassNames.chevron} fill-gray-600 dark:fill-slate-400`,
                weekday: `${defaultClassNames.weekday} text-xs font-semibold text-gray-500 dark:text-slate-400`,
                day: `${defaultClassNames.day} text-sm font-medium text-gray-900 dark:text-slate-50`,
                day_button: `${defaultClassNames.day_button} rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors`,
                today: `${defaultClassNames.today} bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-200`,
                selected: `${defaultClassNames.selected} bg-blue-600 dark:bg-blue-700 text-white font-semibold`,
                disabled: `${defaultClassNames.disabled} text-gray-300 dark:text-slate-600 cursor-not-allowed`,
                outside: `${defaultClassNames.outside} text-gray-400 dark:text-slate-600`,
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
