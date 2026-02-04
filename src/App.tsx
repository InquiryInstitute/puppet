import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Splash from './components/Splash'
import Simulation from './components/Simulation'
import KleistEssay from './components/KleistEssay'

// Handle GitHub Pages 404.html redirect
function RedirectHandler() {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    // Check if we're on GitHub Pages and have a redirect query string
    // The 404.html redirects to /?/path, so we need to extract the path
    const queryParams = new URLSearchParams(location.search)
    const redirectPath = queryParams.get('/')
    
    if (redirectPath) {
      // Convert the redirect path back to a normal path
      // Replace ~and~ with & and ~slash~ with /
      let path = redirectPath.replace(/~and~/g, '&').replace(/~slash~/g, '/')
      // Ensure path starts with /
      if (!path.startsWith('/')) {
        path = '/' + path
      }
      // Navigate to the correct path without reload
      navigate(path, { replace: true })
    }
  }, [location, navigate])

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
