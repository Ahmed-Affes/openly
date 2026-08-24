'use client'

import React from 'react'

export type RoomTypeKey = 'pulse_check' | 'open_feedback' | 'qa' | 'decision_vote' | 'hot_take' | string

interface RoomTypeBadgeProps {
  type: RoomTypeKey
  className?: string
}

const TYPE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pulse_check: {
    label: 'Pulse Check',
    bg: '#e8f0e0',
    text: '#7c8c5e',
  },
  open_feedback: {
    label: 'Open Feedback',
    bg: '#e0eaf0',
    text: '#4a6580',
  },
  qa: {
    label: 'Q&A',
    bg: '#ede0f0',
    text: '#7c5c8c',
  },
  decision_vote: {
    label: 'Decision Vote',
    bg: '#f0ebe0',
    text: '#8c6c2c',
  },
  hot_take: {
    label: 'Hot Take',
    bg: '#f5ebe8',
    text: '#c2674a',
  },
}

export function formatRoomType(rawType: string): string {
  const key = rawType?.toLowerCase()?.trim() || 'open_feedback'
  return TYPE_CONFIG[key]?.label || rawType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function RoomTypeBadge({ type, className = '' }: RoomTypeBadgeProps) {
  const normalizedKey = (type || 'open_feedback').toLowerCase().trim()
  const config = TYPE_CONFIG[normalizedKey] || {
    label: formatRoomType(type),
    bg: '#ede8dc',
    text: '#6b5c4e',
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
      }}
    >
      {config.label}
    </span>
  )
}

export default RoomTypeBadge
