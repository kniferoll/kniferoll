interface SettingsIconProps {
  size?: number;
  className?: string;
}

/**
 * Settings gear icon
 */
export function SettingsIcon({ size = 24, className = "" }: SettingsIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364-5.364l-4.243 4.243m-4.242 0L5.636 5.636m12.728 12.728l-4.243-4.243m-4.242 0L5.636 18.364" />
    </svg>
  );
}
