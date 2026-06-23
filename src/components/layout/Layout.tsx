import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import CompareDrawer from '../CompareDrawer'

export default function Layout() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
      <CompareDrawer />
    </div>
  )
}
