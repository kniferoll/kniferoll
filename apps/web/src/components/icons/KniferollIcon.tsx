interface KniferollIconProps {
  size?: number;
  className?: string;
}

/**
 * Kniferoll brand icon - the box/crate symbol
 */
export function KniferollIcon({ size = 20, className = "" }: KniferollIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
    </svg>
  );
}
