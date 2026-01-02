/**
 * /src/ui/icons.tsx
 * PRESENTATION ONLY
 * 
 * Centralized icon components using lucide-react.
 * Replaces emoji-based UI indicators with consistent vector icons.
 * 
 * RULES:
 * - Icons are presentational only
 * - Must not alter behavior
 * - Maintain consistent sizing and styling
 */

import {
  AlertTriangle,
  Lightbulb,
  Search,
  Wrench,
  Target,
  DollarSign,
  Check,
  CheckCircle,
  Download,
  Save,
  HelpCircle,
  Car,
  Key,
  Battery,
  Disc,
  Settings,
  FileText,
  Info,
  Clock,
  CircleDot,
  Fuel,
  Thermometer,
  Gauge,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Circle,
} from "lucide-react";

// Default icon size for inline usage
const DEFAULT_SIZE = 16;
const BADGE_SIZE = 14;
const HEADER_SIZE = 20;

// Common style for inline icons
const inlineStyle: React.CSSProperties = {
  display: "inline-block",
  verticalAlign: "middle",
  marginRight: 4,
};

// ===== SEMANTIC ICON COMPONENTS =====
// These provide consistent icons for specific semantic purposes

/** Warning/Caution indicator */
export function WarningIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <AlertTriangle size={size} style={{ ...inlineStyle, color: "#ffd700", ...style }} />;
}

/** Tip/Hint indicator */
export function TipIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Lightbulb size={size} style={{ ...inlineStyle, color: "#ffd700", ...style }} />;
}

/** Search/Inspect indicator */
export function SearchIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Search size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Tool/Wrench indicator */
export function WrenchIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Wrench size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Target/Precision indicator */
export function TargetIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Target size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Cost/Money indicator */
export function CostIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <DollarSign size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Checkmark indicator */
export function CheckIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Check size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Success/Saved indicator */
export function CheckCircleIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <CheckCircle size={size} style={{ ...inlineStyle, color: "#4ade80", ...style }} />;
}

/** Export/Download indicator */
export function ExportIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Download size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Save indicator */
export function SaveIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Save size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Question/Help indicator */
export function HelpIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <HelpCircle size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Car/Vehicle indicator */
export function CarIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Car size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Key/Ignition indicator */
export function KeyIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Key size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Battery/Electrical indicator */
export function BatteryIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Battery size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Brakes/Disc indicator */
export function BrakesIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Disc size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Settings/Gear indicator */
export function SettingsIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Settings size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Document/Notes indicator */
export function DocumentIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <FileText size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Info indicator */
export function InfoIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Info size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Time/Clock indicator */
export function ClockIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Clock size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Fuel indicator */
export function FuelIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Fuel size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Temperature indicator */
export function TempIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Thermometer size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Gauge/Pressure indicator */
export function GaugeIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <Gauge size={size} style={{ ...inlineStyle, ...style }} />;
}

/** Alert/Error indicator */
export function AlertIcon({ size = DEFAULT_SIZE, style }: { size?: number; style?: React.CSSProperties }) {
  return <AlertCircle size={size} style={{ ...inlineStyle, color: "#ef4444", ...style }} />;
}

/** Chevron Right (collapsed) */
export function ChevronRightIcon({ size = 12, style }: { size?: number; style?: React.CSSProperties }) {
  return <ChevronRight size={size} style={{ ...inlineStyle, opacity: 0.6, ...style }} />;
}

/** Chevron Down (expanded) */
export function ChevronDownIcon({ size = 12, style }: { size?: number; style?: React.CSSProperties }) {
  return <ChevronDown size={size} style={{ ...inlineStyle, opacity: 0.6, ...style }} />;
}

/** Bullet point */
export function BulletIcon({ size = 8, style }: { size?: number; style?: React.CSSProperties }) {
  return <Circle size={size} fill="currentColor" style={{ ...inlineStyle, opacity: 0.4, ...style }} />;
}

// ===== URGENCY ICONS =====
/** Returns appropriate icon for urgency level */
export function UrgencyIcon({ urgency, size = DEFAULT_SIZE }: { urgency: "high" | "medium" | "low"; size?: number }) {
  switch (urgency) {
    case "high":
      return <AlertTriangle size={size} style={{ ...inlineStyle, color: "#fbbf24" }} />;
    case "medium":
      return <Clock size={size} style={{ ...inlineStyle, color: "#60a5fa" }} />;
    case "low":
    default:
      return <Info size={size} style={{ ...inlineStyle, color: "#9ca3af" }} />;
  }
}

// ===== CATEGORY ICONS FOR TIPS =====
export const CATEGORY_ICONS = {
  brakes: BrakesIcon,
  electrical: BatteryIcon,
  engine: WrenchIcon,
  general: DocumentIcon,
  tires: CarIcon,
} as const;

// Re-export raw icons for custom usage
export {
  AlertTriangle,
  Lightbulb,
  Search,
  Wrench,
  Target,
  DollarSign,
  Check,
  CheckCircle,
  Download,
  Save,
  HelpCircle,
  Car,
  Key,
  Battery,
  Disc,
  Settings,
  FileText,
  Info,
  Clock,
  CircleDot,
  Fuel,
  Thermometer,
  Gauge,
  AlertCircle,
  ChevronRight,
  ChevronDown,
};
