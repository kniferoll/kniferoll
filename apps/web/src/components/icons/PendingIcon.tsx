interface PendingIconProps {
  size?: number;
  className?: string;
}

export function PendingIcon({ size = 24, className = "" }: PendingIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2" />
    </svg>
  );
}
