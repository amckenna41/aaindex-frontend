import { Link, NavLink } from 'react-router-dom'
import { useAAIndexStore } from '../../store/useAAIndexStore'
import { useEffect, useState } from 'react'

const THEME_KEY = 'aaindex_theme'

/** Matches the inline bootstrap in index.html: stored choice first, OS
 *  preference second. Reading the class here alone lost the choice on reload. */
function initialDark(): boolean {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === 'dark') return true
    if (stored === 'light') return false
  } catch {
    // Storage can be blocked; fall through to the media query.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export default function Navbar() {
  const selectedCount = useAAIndexStore((s) => s.selectedAccessions.length)
  const [dark, setDark] = useState(initialDark)
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // The hairline under the bar only appears once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light')
    } catch {
      // Non-fatal — the theme just won't survive a reload.
    }
  }, [dark])

  const navLinks = [
    { to: '/explorer',      label: 'Explorer' },
    { to: '/sequence',      label: 'Sequence' },
    { to: '/encode',        label: 'Encode' },
    { to: '/compare',       label: 'Compare', badge: selectedCount > 0 ? selectedCount : null },
    { to: '/visualise',     label: 'Visualiser' },
    { to: '/similarity',    label: 'Similarity' },
    { to: '/api-reference', label: 'API' },
    { to: '/guide',         label: 'Guide' },
    { to: '/about',         label: 'About' },
  ]

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm tabular-nums underline-offset-[6px] decoration-1 ${
      isActive
        ? 'text-ink dark:text-gray-100 underline'
        : 'text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400'
    }`

  return (
    <nav
      className={`sticky top-0 z-40 bg-paper/95 dark:bg-gray-950/95 backdrop-blur-sm border-b ${
        scrolled ? 'border-gray-200 dark:border-gray-800' : 'border-transparent'
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10 h-14 flex items-center justify-between">
        <Link to="/explorer" className="font-[600] tracking-tight text-ink dark:text-gray-100">
          AAIndex
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map(({ to, label, badge }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
              {badge != null && <span className="ml-1">({badge})</span>}
            </NavLink>
          ))}
          <button
            onClick={() => setDark((d) => !d)}
            className="btn-text"
            aria-label="Toggle dark mode"
          >
            {dark ? 'Light' : 'Dark'}
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-5">
          <button onClick={() => setDark((d) => !d)} className="btn-text" aria-label="Toggle dark mode">
            {dark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-sm text-ink dark:text-gray-100"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {/* Mobile list */}
      {menuOpen && (
        <div className="md:hidden bg-paper dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 px-6 sm:px-10 pb-6 flex flex-col">
          {navLinks.map(({ to, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `py-3 border-t border-gray-200 dark:border-gray-800 text-body tabular-nums ${
                  isActive ? 'text-ink dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              {label}
              {badge != null && <span className="ml-1">({badge})</span>}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
