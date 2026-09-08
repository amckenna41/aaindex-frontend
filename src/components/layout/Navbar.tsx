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

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/explorer" className="flex items-center gap-2 font-bold text-lg text-indigo-600 dark:text-indigo-400">
          🧬 AAIndex Explorer
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `relative px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                }`
              }
            >
              {label}
              {badge != null && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
          <button
            onClick={() => setDark((d) => !d)}
            className="ml-2 p-1.5 rounded text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setDark((d) => !d)} className="p-1.5 text-gray-500">
            {dark ? '☀️' : '🌙'}
          </button>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="p-1.5 text-gray-500"
            aria-label="Toggle menu"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-2 flex flex-col gap-1">
          {navLinks.map(({ to, label, badge }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`
              }
            >
              {label}
              {badge != null && (
                <span className="bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  )
}
