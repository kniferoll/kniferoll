import {
  Dropdown,
  DropdownItem,
  DropdownDivider,
  DropdownTriggerButton,
} from "./Dropdown";
import { SlidersIcon, SortIcon, CompactIcon, CopyIcon, ForwardIcon } from "@/components/icons";

interface ToolsMenuProps {
  onSort?: () => void;
  isCompact?: boolean;
  onToggleCompact?: () => void;
  onCopyRecentToToday?: () => void;
  onAddToNextDay?: () => void;
  label?: string;
}

/**
 * ToolsMenu - dropdown menu for station view tools (sort, compact, etc.)
 *
 * Usage:
 * <ToolsMenu
 *   onSort={handleSort}
 *   isCompact={isCompact}
 *   onToggleCompact={() => setIsCompact(!isCompact)}
 * />
 */
export function ToolsMenu({
  onSort,
  isCompact = false,
  onToggleCompact,
  onCopyRecentToToday,
  onAddToNextDay,
  label = "Tools",
}: ToolsMenuProps) {
  return (
    <Dropdown
      trigger={
        <DropdownTriggerButton icon={<SlidersIcon size={16} />}>
          {label}
        </DropdownTriggerButton>
      }
      align="right"
    >
      {onCopyRecentToToday && (
        <DropdownItem onClick={onCopyRecentToToday} icon={<CopyIcon size={16} />}>
          Copy recent items
        </DropdownItem>
      )}
      {onAddToNextDay && (
        <DropdownItem onClick={onAddToNextDay} icon={<ForwardIcon size={16} />}>
          Add to next day
        </DropdownItem>
      )}
      {(onCopyRecentToToday || onAddToNextDay) && (onSort || onToggleCompact) && <DropdownDivider />}
      {onSort && (
        <DropdownItem onClick={onSort} icon={<SortIcon size={16} />}>
          Sort list
        </DropdownItem>
      )}
      {onSort && onToggleCompact && <DropdownDivider />}
      {onToggleCompact && (
        <DropdownItem
          onClick={onToggleCompact}
          icon={<CompactIcon size={16} />}
          isActive={isCompact}
        >
          Compact view
        </DropdownItem>
      )}
    </Dropdown>
  );
}
