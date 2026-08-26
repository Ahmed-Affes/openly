import { RoomType, RoomStatus, Cadence } from '@/types'

export const ROOM_TYPES: { value: RoomType; label: string; iconName: string; description: string }[] = [
  { value: 'pulse_check', label: 'Pulse Check', iconName: 'Activity', description: 'Track team temperature and emotional climate over time' },
  { value: 'open_feedback', label: 'Open Feedback', iconName: 'ChatCircleDots', description: 'Let people lead the conversation with open reflections' },
  { value: 'qa', label: 'Q&A', iconName: 'Question', description: 'Ask specific questions and gather honest answers safely' },
  { value: 'decision_vote', label: 'Decision Vote', iconName: 'CheckSquareOffset', description: 'Make clear team calls without loud voices dominating' },
  { value: 'hot_take', label: 'Hot Take', iconName: 'Flame', description: 'Make space for bold opinions behind polite conversations' },
]

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
