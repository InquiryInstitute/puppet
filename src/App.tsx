import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Splash from './components/Splash'
import Simulation from './components/Simulation'
import KleistEssay from './components/KleistEssay'

// Basename when app is served from a subpath (e.g. GitHub Pages at .../puppet/)
// So /puppet/sim matches Route path="/sim"
function getBasename(): string {
  const p = window.location.pathname
  if (p.startsWith('/puppet')) return '/puppet'
  return ''
}

// Handle GitHub Pages 404.html redirect
// This runs immediately when the app loads to fix the URL before React Router renders
function RedirectHandler() {
  const navigate = useNavigate()
  const basename = getBasename()

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const redirectPath = queryParams.get('/')
    if (!redirectPath) return

    // Convert the redirect path back to a normal path (e.g. sim or sim~slash~foo)
    let path = redirectPath.replace(/~and~/g, '&').replace(/~slash~/g, '/')
    if (!path.startsWith('/')) path = '/' + path
    // Full URL path: basename + path so we end up at e.g. /puppet/sim not /sim
    const fullPath = basename + path + window.location.hash
    window.history.replaceState({}, '', fullPath)
    navigate(path, { replace: true })
  }, [navigate, basename])

  return null
}

function App() {
  const basename = getBasename()
  return (
    <BrowserRouter basename={basename}>
      <RedirectHandler />
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/sim" element={<Simulation />} />
        <Route path="/kleist" element={<KleistEssay />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
