import React from "react";
import {
  Video,
  Film,
  Link,
  Trash2,
  X,
  MoreVertical,
  Square,
  Circle,
  CheckCircle2,
  XCircle,
  Folder,
  Brain,
  Mic,
  Settings,
  FileText,
  Wrench,
  Calendar,
  Timer,
  HardDrive,
  Check,
  ChevronLeft,
  ChevronRight,
  type LucideProps,
} from "lucide-react";

/**
 * Icon name mapping for type safety
 */
export type IconName =
  | "video"
  | "film"
  | "link"
  | "trash"
  | "close"
  | "menu"
  | "stop"
  | "record"
  | "check-circle"
  | "x-circle"
  | "folder"
  | "brain"
  | "mic"
  | "settings"
  | "file-text"
  | "wrench"
  | "calendar"
  | "timer"
  | "save"
  | "check"
  | "chevron-left"
  | "chevron-right";

/**
 * Icon component props
 */
interface IconProps extends Omit<LucideProps, "ref"> {
  name: IconName;
  className?: string;
}

/**
 * Icon mapping object
 */
const iconMap: Record<IconName, React.ComponentType<LucideProps>> = {
  video: Video,
  film: Film,
  link: Link,
  trash: Trash2,
  close: X,
  menu: MoreVertical,
  stop: Square,
  record: Circle,
  "check-circle": CheckCircle2,
  "x-circle": XCircle,
  folder: Folder,
  brain: Brain,
  mic: Mic,
  settings: Settings,
  "file-text": FileText,
  wrench: Wrench,
  calendar: Calendar,
  timer: Timer,
  save: HardDrive,
  check: Check,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
};

/**
 * Icon component with theme support via currentColor
 *
 * Uses lucide-react icons and automatically inherits color from parent text color,
 * making it compatible with dark mode and any color scheme.
 *
 * @example
 * ```tsx
 * <Icon name="video" size={20} />
 * <Icon name="trash" className="text-red-600" size={16} />
 * ```
 */
const Icon: React.FC<IconProps> = ({ name, size = 16, className = "", ...props }) => {
  const IconComponent = iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in iconMap`);
    return null;
  }

  return (
    <IconComponent
      size={size}
      className={className}
      {...props}
      // Use currentColor to inherit from parent text color for theme support
      style={{ color: "currentColor", ...props.style }}
    />
  );
};

export default Icon;
