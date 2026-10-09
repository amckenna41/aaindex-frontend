import { Link, Outlet } from 'react-router-dom'
import Navbar from './Navbar'

const footerLink = 'hover:text-indigo-600 dark:hover:text-indigo-400'

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-paper dark:bg-gray-950 text-ink dark:text-gray-100 text-body">
      <Navbar />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 sm:px-10 py-16">
        <Outlet />
      </main>
      <footer className="text-sm text-gray-400 dark:text-gray-500">
        <div className="max-w-5xl mx-auto px-6 sm:px-10 py-16 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4">
          <p>AJ McKenna · AAIndex Explorer</p>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-6 gap-y-2">
            <Link to="/about" className={footerLink}>About</Link>
            <Link to="/guide" className={footerLink}>Guide</Link>
            <Link to="/api-reference" className={footerLink}>API</Link>
            <a href="https://github.com/amckenna41" target="_blank" rel="noopener noreferrer" className={footerLink}>
              GitHub ↗
            </a>
            <a href="https://www.genome.jp/aaindex/" target="_blank" rel="noopener noreferrer" className={footerLink}>
              AAIndex source ↗
            </a>
          </nav>
        </div>
      </footer>
    </div>
  )
}
