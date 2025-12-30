interface PendingIconProps {
  className?: string;
}

export function PendingIcon({ className = "w-6 h-6" }: PendingIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#d1d5db" strokeWidth="2" />
    </svg>
  );
}
