'use client'

import React, { useState } from 'react'
import { CalendarBlank, Clock, X } from '@phosphor-icons/react'

interface DatePickerProps {
  value: string // ISO string or datetime string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, label = 'Closing date', placeholder = 'Choose close date' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Presets
  const setPreset = (daysFromNow: number) => {
    const d = new Date()
    d.setDate(d.getDate() + daysFromNow)
    d.setHours(17, 0, 0, 0) // default 5:00 PM
    onChange(d.toISOString())
    setIsOpen(false)
  }

  const selectedDate = value ? new Date(value) : null
  const formattedDisplay = selectedDate && !isNaN(selectedDate.getTime())
    ? selectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : ''

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-heading mb-1.5">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between px-4 py-3 bg-[#faf7f2] border border-[#ddd5c8] rounded-xl text-left text-sm transition focus:border-[#c2674a] focus:ring-2 focus:ring-[#c2674a]/20"
        >
          <div className="flex items-center gap-2.5">
            <CalendarBlank size={18} className="text-[#c2674a]" />
            <span className={formattedDisplay ? 'text-heading font-medium' : 'text-muted-foreground'}>
              {formattedDisplay || placeholder}
            </span>
          </div>
          <Clock size={16} className="text-muted-foreground" />
        </button>

        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="p-3 bg-[#ede8dc] border border-[#ddd5c8] rounded-xl text-muted-foreground hover:text-heading transition"
            title="Clear date"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 p-4 bg-[#ede8dc] border border-[#ddd5c8] rounded-2xl shadow-xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Options</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'In 24 hours', days: 1 },
              { label: 'In 3 days', days: 3 },
              { label: 'In 1 week', days: 7 },
              { label: 'In 2 weeks', days: 14 },
            ].map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setPreset(preset.days)}
                className="px-3 py-2 bg-[#faf7f2] hover:bg-[#1c1917] hover:text-[#f5f0e8] border border-[#ddd5c8] rounded-xl text-xs font-medium text-heading transition"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-[#ddd5c8] flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setIsOpen(false)
              }}
              className="text-xs text-muted-foreground hover:text-heading underline"
            >
              No closing date (Open indefinitely)
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-[#c2674a] hover:underline"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DatePicker
