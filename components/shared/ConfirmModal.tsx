'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { WarningOctagon, X, Trash } from '@phosphor-icons/react'

export interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  onClose: () => void
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#1c1917]/50 backdrop-blur-sm"
          />

          {/* Modal Dialog Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-[#ddd5c8] bg-[#ede8dc] p-6 sm:p-8 shadow-2xl z-10 space-y-5"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div
                className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  variant === 'danger'
                    ? 'bg-[#c0392b]/15 text-[#c0392b]'
                    : 'bg-[#1c1917]/10 text-heading'
                }`}
              >
                {variant === 'danger' ? (
                  <Trash size={24} weight="duotone" />
                ) : (
                  <WarningOctagon size={24} weight="duotone" />
                )}
              </div>

              <div className="flex-1 min-w-0 pr-2">
                <h3 className="font-serif text-xl sm:text-2xl text-heading leading-snug">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {description}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="text-muted-foreground hover:text-heading p-1.5 rounded-lg hover:bg-[#faf7f2] transition"
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
            <div className="pt-3 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-[#1c1917] text-[#1c1917] hover:bg-[#1c1917] hover:text-[#f5f0e8] transition text-xs font-semibold"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-full text-xs font-semibold transition ${
                  variant === 'danger'
                    ? 'bg-[#c0392b] hover:bg-[#a93226] text-white'
                    : 'bg-[#1c1917] hover:bg-[#2c2420] text-[#f5f0e8]'
                }`}
              >
                {loading ? 'Processing…' : confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
