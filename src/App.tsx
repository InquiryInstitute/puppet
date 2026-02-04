import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Splash from './components/Splash'
import Simulation from './components/Simulation'
import KleistEssay from './components/KleistEssay'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/sim" element={<Simulation />} />
        <Route path="/kleist" element={<KleistEssay />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
