import React from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'dark' | 'terracotta' | 'ghost'
  className?: string
}

export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '',
  type = 'button',
  disabled,
  ...props
}: ButtonProps) {
  let variantClass = 'primary-button'
  if (variant === 'secondary' || variant === 'ghost') {
    variantClass = 'secondary-button'
  } else if (variant === 'danger') {
    variantClass = 'danger-button'
  } else if (variant === 'terracotta') {
    variantClass = 'primary-button !bg-[#c2674a] hover:!bg-[#ab563b]'
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${variantClass} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
