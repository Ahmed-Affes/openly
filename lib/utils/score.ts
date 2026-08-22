import { Submission, Answer, Thread, Vote, SafetyScore } from '@/types'

/**
 * Calculate psychological safety score based on room data
 * Score out of 100 based on participation, response depth, threading, and consistency
 */

export function calculateSafetyScore(
  submissions: Submission[],
  answers: Answer[],
  threads: Thread[],
  votes: Vote[],
  invitedCount: number,
  isRecurring: boolean,
  previousScores?: number[]
): SafetyScore {
  // 1. Participation rate (40% weight)
  const participationRate = invitedCount > 0 ? (submissions.length / invitedCount) * 100 : 0
  const participationScore = Math.min(participationRate, 100) * 0.4
  
  // 2. Response depth (25% weight) - average length of text answers
  const textAnswers = answers.filter(a => a.text && a.text.length > 0)
  const avgTextLength = textAnswers.length > 0 
    ? textAnswers.reduce((sum, a) => sum + (a.text?.length || 0), 0) / textAnswers.length
    : 0
  const depthScore = Math.min((avgTextLength / 200) * 100, 100) * 0.25
  
  // 3. Threading engagement (20% weight)
  const threadCount = threads.length
  const messageCount = threads.reduce((sum, t) => sum + (t.messages?.length || 0), 0)
  const engagementScore = Math.min(((threadCount * 10 + messageCount * 5) / submissions.length) * 100, 100) * 0.2
  
  // 4. Recurring consistency (15% weight)
  let consistencyScore = 0
  if (isRecurring && previousScores && previousScores.length > 0) {
    const avgPrevious = previousScores.reduce((sum, s) => sum + s, 0) / previousScores.length
    const currentScore = participationScore + depthScore + engagementScore
    const stability = 100 - Math.abs(currentScore - avgPrevious)
    consistencyScore = stability * 0.15
  } else if (!isRecurring) {
    consistencyScore = 75 * 0.15 // Baseline for non-recurring
  }
  
  const totalScore = Math.round(participationScore + depthScore + engagementScore + consistencyScore)
  
  // Calculate trend
  let trend: 'up' | 'down' | 'stable' = 'stable'
  let trendPoints = 0
  if (previousScores && previousScores.length > 0) {
    const lastScore = previousScores[previousScores.length - 1]
    trendPoints = totalScore - lastScore
    if (trendPoints > 5) trend = 'up'
    else if (trendPoints < -5) trend = 'down'
  }
  
  // Generate explanation
  const explanation = generateExplanation(
    participationRate,
    avgTextLength,
    threadCount,
    messageCount,
    isRecurring
  )
  
  return {
    score: totalScore,
    trend,
    trendPoints,
    explanation,
  }
}

function generateExplanation(
  participationRate: number,
  avgTextLength: number,
  threadCount: number,
  messageCount: number,
  isRecurring: boolean
): string {
  const parts: string[] = []
  
  if (participationRate >= 70) {
    parts.push('High participation shows people feel comfortable sharing')
  } else if (participationRate >= 40) {
    parts.push('Moderate participation with room for growth')
  } else {
    parts.push('Low participation may indicate hesitation')
  }
  
  if (avgTextLength > 150) {
    parts.push('Detailed responses suggest honest reflection')
  } else if (avgTextLength > 50) {
    parts.push('Responses are thoughtful but could go deeper')
  }
  
  if (threadCount > 3) {
    parts.push('Active threading shows engagement and follow-through')
  }
  
  if (isRecurring) {
    parts.push('Consistent check-ins build trust over time')
  }
  
  return parts.join('. ') || 'Building psychological safety takes time and consistency'
}

export function getScoreColor(score: number): string {
  if (score <= 40) return 'red'
  if (score <= 65) return 'yellow'
  if (score <= 85) return 'teal'
  return 'green'
}

export function getScoreMessage(score: number): string {
  if (score <= 40) return 'Your team may not feel safe speaking up yet'
  if (score <= 65) return "There's some openness, but room to grow"
  if (score <= 85) return 'Your team is engaging honestly'
  return 'Exceptional psychological safety'
}
