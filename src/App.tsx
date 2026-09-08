import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Explorer from './pages/Explorer'
import ErrorBoundary from './components/ErrorBoundary'

// Route-level code splitting. Explorer is the landing route, so it stays eager;
// everything else — and the databases each page pulls in — loads on demand.
const RecordDetail    = lazy(() => import('./pages/RecordDetail'))
const Comparator      = lazy(() => import('./pages/Comparator'))
const Visualiser      = lazy(() => import('./pages/Visualiser'))
const SequenceAnalysis = lazy(() => import('./pages/SequenceAnalysis'))
const Encode          = lazy(() => import('./pages/Encode'))
const Similarity      = lazy(() => import('./pages/Similarity'))
const About           = lazy(() => import('./pages/About'))
const HowToGuide      = lazy(() => import('./pages/HowToGuide'))
const APIReference    = lazy(() => import('./pages/APIReference'))

const Loading = () => (
  <p className="text-sm text-gray-400 dark:text-gray-500 animate-pulse py-16 text-center">Loading…</p>
)

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Navigate to="/explorer" replace />} />
            <Route path="/explorer" element={<Explorer />} />
            <Route path="/records/:accession" element={<Suspense fallback={<Loading />}><RecordDetail /></Suspense>} />
            <Route path="/compare" element={<Suspense fallback={<Loading />}><Comparator /></Suspense>} />
            <Route path="/visualise" element={<Suspense fallback={<Loading />}><Visualiser /></Suspense>} />
            <Route path="/sequence" element={<Suspense fallback={<Loading />}><SequenceAnalysis /></Suspense>} />
            <Route path="/encode" element={<Suspense fallback={<Loading />}><Encode /></Suspense>} />
            <Route path="/similarity" element={<Suspense fallback={<Loading />}><Similarity /></Suspense>} />
            <Route path="/about" element={<Suspense fallback={<Loading />}><About /></Suspense>} />
            <Route path="/guide" element={<Suspense fallback={<Loading />}><HowToGuide /></Suspense>} />
            <Route path="/api-reference" element={<Suspense fallback={<Loading />}><APIReference /></Suspense>} />
            <Route path="*" element={<Navigate to="/explorer" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
