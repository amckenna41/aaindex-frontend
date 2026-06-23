import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Explorer from './pages/Explorer'
import RecordDetail from './pages/RecordDetail'
import Comparator from './pages/Comparator'
import Visualiser from './pages/Visualiser'
import SequenceAnalysis from './pages/SequenceAnalysis'
import About from './pages/About'
import Encode from './pages/Encode'
import HowToGuide from './pages/HowToGuide'
import APIReference from './pages/APIReference'
import CategoryStats from './pages/CategoryStats'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/explorer" replace />} />
          <Route path="/explorer" element={<Explorer />} />
          <Route path="/records/:accession" element={<RecordDetail />} />
          <Route path="/compare" element={<Comparator />} />
          <Route path="/visualise" element={<Visualiser />} />
          <Route path="/sequence" element={<SequenceAnalysis />} />
          <Route path="/encode" element={<Encode />} />
          <Route path="/about" element={<About />} />
          <Route path="/guide" element={<HowToGuide />} />
          <Route path="/api-reference" element={<APIReference />} />
          <Route path="/stats" element={<CategoryStats />} />
          <Route path="*" element={<Navigate to="/explorer" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
