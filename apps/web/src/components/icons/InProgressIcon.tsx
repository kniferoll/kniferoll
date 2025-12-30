interface InProgressIconProps {
  size?: number;
  className?: string;
}

export function InProgressIcon({
  size = 24,
  className = "",
}: InProgressIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="#eab308" />
    </svg>
  );
}
