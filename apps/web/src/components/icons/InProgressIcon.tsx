interface InProgressIconProps {
  className?: string;
}

export function InProgressIcon({ className = "w-6 h-6" }: InProgressIconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#eab308" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" fill="#eab308" />
    </svg>
  );
}
