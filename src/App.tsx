import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import Splash from './components/Splash'
import Simulation from './components/Simulation'
import KleistEssay from './components/KleistEssay'

// Handle GitHub Pages 404.html redirect
// This runs immediately when the app loads to fix the URL before React Router renders
function RedirectHandler() {
  const navigate = useNavigate()

  // Run synchronously on mount to fix URL immediately
  useEffect(() => {
    // Check if we're on GitHub Pages and have a redirect query string
    // The 404.html redirects to /?/path, so we need to extract the path
    const queryParams = new URLSearchParams(window.location.search)
    const redirectPath = queryParams.get('/')
    
    if (redirectPath) {
      // Convert the redirect path back to a normal path
      // Replace ~and~ with & and ~slash~ with /
      let path = redirectPath.replace(/~and~/g, '&').replace(/~slash~/g, '/')
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path
      }
      // Immediately replace the URL in the browser (synchronously, before any rendering)
      // This prevents the flash of the wrong URL
      window.history.replaceState({}, '', path + window.location.hash)
      // Force navigation (this will update React Router's internal state)
      navigate(path, { replace: true })
    }
  }, [navigate]) // Include navigate in dependencies

  return null
}

function App() {
  return (
    <BrowserRouter>
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
