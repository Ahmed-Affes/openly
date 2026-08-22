export function Button({ 
  children, 
  onClick, 
  variant = 'dark', 
  className = '' 
}: { 
  children: React.ReactNode
  onClick?: () => void
  variant?: 'dark' | 'terracotta' | 'ghost'
  className?: string
}) {
  return (
    <button 
      onClick={onClick} 
      className={`button button-${variant} ${className}`}
    >
      {children}
    </button>
  )
}
