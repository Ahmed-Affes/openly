export type RoomType = 'open_feedback' | 'qa' | 'hot_take' | 'decision_vote' | 'pulse_check'
export type RoomStatus = 'open' | 'closed' | 'scheduled'
export type Cadence = 'weekly' | 'biweekly' | 'monthly'
export type Intensity = 'thought' | 'urgent'
export type Sender = 'creator' | 'responder'
export type VoteType = 'up' | 'down' | 'yes' | 'no' | 'unsure'

export interface Room {
  id: string
  creator_id: string
  name: string
  description: string | null
  type: RoomType
  status: RoomStatus
  is_recurring: boolean
  cadence: Cadence | null
  max_participants: number | null
  opens_at: string
  closes_at: string | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  room_id: string
  text: string
  order_index: number
  created_at: string
}

export interface Submission {
  id: string
  room_id: string
  device_hash: string
  created_at: string
}

export interface Answer {
  id: string
  submission_id: string
  question_id: string
  text: string | null
  reaction_level: number | null
  intensity: Intensity | null
  created_at: string
}

export interface Thread {
  id: string
  submission_id: string
  room_id: string
  is_resolved: boolean
  is_pinned: boolean
  created_at: string
  messages?: ThreadMessage[]
}

export interface ThreadMessage {
  id: string
  thread_id: string
  sender: Sender
  text: string
  created_at: string
}

export interface Vote {
  id: string
  submission_id: string
  room_id: string
  device_hash: string
  vote_type: VoteType
  created_at: string
}

export interface Invite {
  id: string
  room_id: string
  email: string
  sent_at: string | null
  created_at: string
}

export interface SafetyScore {
  score: number
  trend: 'up' | 'down' | 'stable'
  trendPoints: number
  explanation: string
}

export interface SubmissionWithAnswers extends Submission {
  answers: Answer[]
}

export interface RoomWithQuestions extends Room {
  questions: Question[]
}
