import { RoomType, RoomStatus, Cadence } from '@/types'

export const ROOM_TYPES: { value: RoomType; label: string; icon: string; description: string }[] = [
  { value: 'pulse_check', label: 'Pulse check', icon: '↗', description: 'Track a feeling over time' },
  { value: 'open_feedback', label: 'Open feedback', icon: '□', description: 'Let people lead the conversation' },
  { value: 'qa', label: 'Q&A', icon: '?', description: 'Ask specific questions' },
  { value: 'decision_vote', label: 'Decision vote', icon: '◉', description: 'Make a call without groupthink' },
  { value: 'hot_take', label: 'Hot take', icon: '!', description: 'Collect and rank honest takes' },
]

export const ACCENTS = ['olive', 'clay', 'charcoal', 'peach']

export function roomTypeLabel(type: RoomType | string): string {
  return ROOM_TYPES.find(t => t.value === type)?.label || type
}

export const ROOM_STATUSES: RoomStatus[] = ['open', 'closed', 'scheduled']

export const CADENCE_OPTIONS: Cadence[] = ['weekly', 'biweekly', 'monthly']

export const INTENSITY_OPTIONS = [
  { value: 'thought', label: 'Just a thought' },
  { value: 'urgent', label: 'This is urgent' },
]

export const SAFETY_SCORE_THRESHOLDS = [
  { max: 40, color: 'red', message: 'Your team may not feel safe speaking up yet' },
  { max: 65, color: 'yellow', message: "There's some openness, but room to grow" },
  { max: 85, color: 'teal', message: 'Your team is engaging honestly' },
  { max: 100, color: 'green', message: 'Exceptional psychological safety' },
]
