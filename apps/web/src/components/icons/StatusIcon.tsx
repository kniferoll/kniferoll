import type { PrepStatus } from "@kniferoll/types";
import { CheckmarkIcon } from "./CheckmarkIcon";
import { InProgressIcon } from "./InProgressIcon";
import { PendingIcon } from "./PendingIcon";

interface StatusIconProps {
  status: PrepStatus | null;
  size?: number;
  className?: string;
}

/**
 * Status icon component that displays the appropriate icon based on prep item status
 * - complete: blue checkmark in circle
 * - in_progress: yellow circle with dot
 * - pending: gray empty circle
 */
export function StatusIcon({ status, size = 24, className = "" }: StatusIconProps) {
  switch (status) {
    case "complete":
      return <CheckmarkIcon size={size} className={className} />;
    case "in_progress":
      return <InProgressIcon size={size} className={className} />;
    case "pending":
    default:
      return <PendingIcon size={size} className={className} />;
  }
}
