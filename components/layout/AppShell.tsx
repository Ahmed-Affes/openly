'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/shared'
import { useUser } from '@/hooks/useUser'
import { getInitials } from '@/lib/utils/helpers'

type NavItem = { icon: string; label: string; href: string }

const NAV: NavItem[] = [
  { icon: '⌂', label: 'Home', href: '/' },
  { icon: '◌', label: 'Explore', href: '/explore' },
  { icon: '＋', label: 'Create', href: '/room/create' },
  { icon: '◫', label: 'Results', href: '/rooms' },
  { icon: '⚙', label: 'Settings', href: '/settings' },
]

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname.startsWith(href)
}

function Navigation({ pathname, go, name }: { pathname: string; go: (href: string) => void; name: string }) {
  return (
    <>
      <aside className="sidebar">
        <Logo />
        <nav className="side-nav">
          {NAV.map(item => (
            <button key={item.label} className={isActive(pathname, item.href) ? 'active' : ''} onClick={() => go(item.href)}>
              <span>{item.icon}</span>
              <b>{item.label}</b>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-mini">
            <span>✦</span>
            <p>
              <strong>Privacy first</strong>
              <small>No names. No tracking.</small>
            </p>
          </div>
          <div className="profile">
            <span className="avatar">{getInitials(name)}</span>
            <span>
              <strong>{name}</strong>
              <small>Personal space</small>
            </span>
            <span className="dots">···</span>
          </div>
        </div>
      </aside>
      <nav className="bottom-nav">
        {NAV.map(item => (
          <button key={item.label} className={isActive(pathname, item.href) ? 'active' : ''} onClick={() => go(item.href)}>
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </button>
        ))}
      </nav>
    </>
  )
}

function Topbar({ title, openMenu, go }: { title: string; openMenu: () => void; go: (href: string) => void }) {
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <header className="topbar">
      <div className="mobile-logo"><Logo /></div>
      <div className="top-title">
        <p className="eyebrow">{today}</p>
        <h1>{title}</h1>
      </div>
      <div className="top-actions">
        <button aria-label="Search" className="icon-button" onClick={() => go('/explore')}>⌕</button>
        <button aria-label="Your rooms" className="icon-button" onClick={() => go('/rooms')}>♧</button>
        <button aria-label="Open menu" onClick={openMenu} className="hamburger"><i></i><i></i></button>
      </div>
    </header>
  )
}

function MobileMenu({ close, go }: { close: () => void; go: (href: string) => void }) {
  return (
    <div className="mobile-overlay">
      <div className="overlay-top">
        <Logo />
        <button onClick={close} className="close">×</button>
      </div>
      <div className="overlay-links">
        {NAV.map((item, i) => (
          <button key={item.label} onClick={() => { go(item.href); close() }}>
            <span>0{i + 1}</span>{item.label}<b>↗</b>
          </button>
        ))}
      </div>
      <div className="overlay-footer">
        <p>Say what you<br /><em>really</em> mean.</p>
        <small>© openly / your quiet corner</small>
      </div>
    </div>
  )
}

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useUser()
  const [menu, setMenu] = useState(false)
  const name = (user?.user_metadata?.name as string | undefined) || user?.email?.split('@')[0] || 'Guest'
  const go = (href: string) => router.push(href)

  return (
    <main className="app-shell">
      <Navigation pathname={pathname} go={go} name={name} />
      <div className="main">
        <Topbar title={title} openMenu={() => setMenu(true)} go={go} />
        {children}
      </div>
      <button className="floating-plus" onClick={() => go('/room/create')} aria-label="Create room">+</button>
      {menu && <MobileMenu close={() => setMenu(false)} go={go} />}
    </main>
  )
}
