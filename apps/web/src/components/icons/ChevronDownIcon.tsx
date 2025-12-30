interface ChevronDownIconProps {
  size?: number;
  className?: string;
}

export function ChevronDownIcon({ size = 20, className = "" }: ChevronDownIconProps) {
  return (
    <svg
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      className={className}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
