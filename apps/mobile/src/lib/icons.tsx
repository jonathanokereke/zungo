/**
 * Central icon library — all Lucide icons used in Zungo.
 * Source: https://lucide.dev
 *
 * Usage:
 *   import { Icons } from '../lib/icons'
 *   <Icons.Home size={22} color="#0C6B6B" />
 *
 * To swap an icon: replace the Path/Circle/etc. content below
 * with any SVG path from lucide.dev (copy the inner SVG, not the wrapper).
 */

import React from 'react'
import Svg, { Path, Circle, Polyline, Line, Rect, Polygon } from 'react-native-svg'

interface IconProps {
  size?: number
  color?: string
  strokeWidth?: number
}

function icon(paths: (props: IconProps) => React.ReactNode) {
  return function Icon({ size = 24, color = 'currentColor', strokeWidth = 1.8 }: IconProps) {
    return (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths({ size, color, strokeWidth })}
      </Svg>
    )
  }
}

// ── Navigation ──────────────────────────────────────────────────────────────

export const HomeIcon = icon(() => (
  <>
    <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <Polyline points="9 22 9 12 15 12 15 22" />
  </>
))

export const BookOpenIcon = icon(() => (
  <>
    <Path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <Path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </>
))

export const MessageSquareIcon = icon(() => (
  <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
))

export const BarChart2Icon = icon(() => (
  <>
    <Line x1="18" y1="20" x2="18" y2="10" />
    <Line x1="12" y1="20" x2="12" y2="4" />
    <Line x1="6" y1="20" x2="6" y2="14" />
  </>
))

export const UserIcon = icon(() => (
  <>
    <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <Circle cx="12" cy="7" r="4" />
  </>
))

// ── Learn / Vocab ────────────────────────────────────────────────────────────

export const LayersIcon = icon(() => (
  <>
    <Polygon points="12 2 2 7 12 12 22 7 12 2" />
    <Polyline points="2 17 12 22 22 17" />
    <Polyline points="2 12 12 17 22 12" />
  </>
))

export const FlipCard = icon(() => (
  <>
    <Rect x="2" y="4" width="20" height="16" rx="2" />
    <Path d="M12 8v8" />
    <Path d="M8 12h8" />
  </>
))

export const CheckCircleIcon = icon(() => (
  <>
    <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <Polyline points="22 4 12 14.01 9 11.01" />
  </>
))

export const RefreshCwIcon = icon(() => (
  <>
    <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <Path d="M21 3v5h-5" />
    <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <Path d="M8 16H3v5" />
  </>
))

export const FilterIcon = icon(() => (
  <>
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </>
))

// ── Dashboard ────────────────────────────────────────────────────────────────

export const FlameIcon = icon(() => (
  <Path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z" />
))

export const TrophyIcon = icon(() => (
  <>
    <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <Path d="M4 22h16" />
    <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <Path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
  </>
))

export const StarIcon = icon(() => (
  <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
))

export const ZapIcon = icon(() => (
  <Polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
))

export const CalendarIcon = icon(() => (
  <>
    <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <Line x1="16" y1="2" x2="16" y2="6" />
    <Line x1="8" y1="2" x2="8" y2="6" />
    <Line x1="3" y1="10" x2="21" y2="10" />
  </>
))

export const ClockIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Polyline points="12 6 12 12 16 14" />
  </>
))

// ── Chat ─────────────────────────────────────────────────────────────────────

export const MicIcon = icon(() => (
  <>
    <Path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <Line x1="12" y1="19" x2="12" y2="23" />
    <Line x1="8" y1="23" x2="16" y2="23" />
  </>
))

export const SendIcon = icon(() => (
  <>
    <Line x1="22" y1="2" x2="11" y2="13" />
    <Polygon points="22 2 15 22 11 13 2 9 22 2" />
  </>
))

export const BotIcon = icon(() => (
  <>
    <Path d="M12 8V4H8" />
    <Rect width="16" height="12" x="4" y="8" rx="2" />
    <Path d="M2 14h2" />
    <Path d="M20 14h2" />
    <Path d="M15 13v2" />
    <Path d="M9 13v2" />
  </>
))

export const PenLineIcon = icon(() => (
  <>
    <Path d="M12 20h9" />
    <Path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </>
))

// ── Progress ──────────────────────────────────────────────────────────────────

export const TrendingUpIcon = icon(() => (
  <>
    <Polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <Polyline points="17 6 23 6 23 12" />
  </>
))

export const AwardIcon = icon(() => (
  <>
    <Circle cx="12" cy="8" r="7" />
    <Polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </>
))

export const TargetIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Circle cx="12" cy="12" r="6" />
    <Circle cx="12" cy="12" r="2" />
  </>
))

// ── Settings / Profile ────────────────────────────────────────────────────────

export const SettingsIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="3" />
    <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </>
))

export const BellIcon = icon(() => (
  <>
    <Path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <Path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </>
))

export const LockIcon = icon(() => (
  <>
    <Rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </>
))

export const LogOutIcon = icon(() => (
  <>
    <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <Polyline points="16 17 21 12 16 7" />
    <Line x1="21" y1="12" x2="9" y2="12" />
  </>
))

export const ChevronRightIcon = icon(() => (
  <Polyline points="9 18 15 12 9 6" />
))

export const ArrowLeftIcon = icon(() => (
  <>
    <Line x1="19" y1="12" x2="5" y2="12" />
    <Polyline points="12 19 5 12 12 5" />
  </>
))

// ── Word/Read ─────────────────────────────────────────────────────────────────

export const BookmarkPlusIcon = icon(() => (
  <>
    <Path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    <Line x1="12" y1="7" x2="12" y2="13" />
    <Line x1="9" y1="10" x2="15" y2="10" />
  </>
))

export const TypeIcon = icon(() => (
  <>
    <Polyline points="4 7 4 4 20 4 20 7" />
    <Line x1="9" y1="20" x2="15" y2="20" />
    <Line x1="12" y1="4" x2="12" y2="20" />
  </>
))

export const GlobeIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="2" y1="12" x2="22" y2="12" />
    <Path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </>
))

export const VolumeIcon = icon(() => (
  <>
    <Polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <Path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </>
))

// ── Grammar ───────────────────────────────────────────────────────────────────

export const PencilIcon = icon(() => (
  <>
    <Path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </>
))

export const ListChecksIcon = icon(() => (
  <>
    <Path d="m3 17 2 2 4-4" />
    <Path d="m3 7 2 2 4-4" />
    <Path d="M13 6h8" />
    <Path d="M13 12h8" />
    <Path d="M13 18h8" />
  </>
))

export const SunIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="4" />
    <Line x1="12" y1="2" x2="12" y2="6" />
    <Line x1="12" y1="18" x2="12" y2="22" />
    <Line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
    <Line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
    <Line x1="2" y1="12" x2="6" y2="12" />
    <Line x1="18" y1="12" x2="22" y2="12" />
    <Line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
    <Line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
  </>
))

export const MoonIcon = icon(() => (
  <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
))

export const RefreshIcon = icon(() => (
  <>
    <Path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <Path d="M21 3v5h-5" />
    <Path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <Path d="M8 16H3v5" />
  </>
))

export const DownloadIcon = icon(() => (
  <>
    <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <Polyline points="7 10 12 15 17 10" />
    <Line x1="12" y1="15" x2="12" y2="3" />
  </>
))

export const XCircleIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Line x1="15" y1="9" x2="9" y2="15" />
    <Line x1="9" y1="9" x2="15" y2="15" />
  </>
))

export const SparklesIcon = icon(() => (
  <>
    <Path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <Path d="M5 3v4" />
    <Path d="M19 17v4" />
    <Path d="M3 5h4" />
    <Path d="M17 19h4" />
  </>
))

export const TrashIcon = icon(() => (
  <>
    <Path d="M3 6h18" />
    <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </>
))

export const SearchIcon = icon(() => (
  <>
    <Circle cx="11" cy="11" r="8" />
    <Path d="m21 21-4.3-4.3" />
  </>
))

export const HelpCircleIcon = icon(() => (
  <>
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Line x1="12" y1="17" x2="12.01" y2="17" />
  </>
))

export const SunriseIcon = icon(() => (
  <>
    <Path d="M12 2v8" />
    <Path d="m4.93 10.93 1.41 1.41" />
    <Path d="M2 18h2" />
    <Path d="M20 18h2" />
    <Path d="m19.07 10.93-1.41 1.41" />
    <Path d="M22 22H2" />
    <Path d="m8 6 4-4 4 4" />
    <Path d="M16 18a4 4 0 0 0-8 0" />
  </>
))

export const SunsetIcon = icon(() => (
  <>
    <Path d="M12 10V2" />
    <Path d="m4.93 10.93 1.41 1.41" />
    <Path d="M2 18h2" />
    <Path d="M20 18h2" />
    <Path d="m19.07 10.93-1.41 1.41" />
    <Path d="M22 22H2" />
    <Path d="m16 6-4 4-4-4" />
    <Path d="M16 18a4 4 0 0 0-8 0" />
  </>
))

export const CoffeeIcon = icon(() => (
  <>
    <Path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <Path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <Line x1="6" y1="2" x2="6" y2="4" />
    <Line x1="10" y1="2" x2="10" y2="4" />
    <Line x1="14" y1="2" x2="14" y2="4" />
  </>
))

export const PlayIcon = icon(() => (
  <Polygon points="5 3 19 12 5 21 5 3" />
))

export const PauseIcon = icon(() => (
  <>
    <Rect x="6" y="4" width="4" height="16" />
    <Rect x="14" y="4" width="4" height="16" />
  </>
))

export const RotateCcwIcon = icon(() => (
  <>
    <Path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <Path d="M3 3v5h5" />
  </>
))

export const ChevronLeftIcon = icon(() => (
  <Path d="m15 18-6-6 6-6" />
))

export const HeadphonesIcon = icon(() => (
  <Path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
))

export const RepeatIcon = icon(() => (
  <>
    <Path d="m17 2 4 4-4 4" />
    <Path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <Path d="m7 22-4-4 4-4" />
    <Path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </>
))

export const CheckIcon = icon(() => (
  <Path d="M20 6 9 17l-5-5" />
))

export const PlusIcon = icon(() => (
  <>
    <Path d="M5 12h14" />
    <Path d="M12 5v14" />
  </>
))

// Convenience named export
export const Icons = {
  Home: HomeIcon,
  BookOpen: BookOpenIcon,
  MessageSquare: MessageSquareIcon,
  BarChart2: BarChart2Icon,
  User: UserIcon,
  Layers: LayersIcon,
  CheckCircle: CheckCircleIcon,
  RefreshCw: RefreshCwIcon,
  Filter: FilterIcon,
  Flame: FlameIcon,
  Trophy: TrophyIcon,
  Star: StarIcon,
  Zap: ZapIcon,
  Calendar: CalendarIcon,
  Clock: ClockIcon,
  Mic: MicIcon,
  Send: SendIcon,
  Bot: BotIcon,
  PenLine: PenLineIcon,
  TrendingUp: TrendingUpIcon,
  Award: AwardIcon,
  Target: TargetIcon,
  Settings: SettingsIcon,
  Bell: BellIcon,
  Lock: LockIcon,
  LogOut: LogOutIcon,
  ChevronRight: ChevronRightIcon,
  ChevronLeft: ChevronLeftIcon,
  ArrowLeft: ArrowLeftIcon,
  BookmarkPlus: BookmarkPlusIcon,
  Type: TypeIcon,
  Globe: GlobeIcon,
  Volume: VolumeIcon,
  Pencil: PencilIcon,
  ListChecks: ListChecksIcon,
  Sparkles: SparklesIcon,
  Download: DownloadIcon,
  XCircle: XCircleIcon,
  Sun: SunIcon,
  Moon: MoonIcon,
  Refresh: RefreshIcon,
  Trash: TrashIcon,
  Search: SearchIcon,
  HelpCircle: HelpCircleIcon,
  Sunrise: SunriseIcon,
  Sunset: SunsetIcon,
  Coffee: CoffeeIcon,
  Play: PlayIcon,
  Pause: PauseIcon,
  RotateCcw: RotateCcwIcon,
  Headphones: HeadphonesIcon,
  Repeat: RepeatIcon,
  Check: CheckIcon,
  Plus: PlusIcon,
  FlipCard,
}
