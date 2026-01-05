interface CheckIconProps {
  size?: number;
  className?: string;
}

export function CheckIcon({ size = 20, className = "" }: CheckIconProps) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24" className={className}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}
