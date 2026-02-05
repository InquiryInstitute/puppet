import { Link, useLocation } from 'react-router-dom'
import './Splash.css'

export default function Splash() {
  const location = useLocation()
  const base = location.pathname.startsWith('/puppet') ? '/puppet' : ''
  return (
    <div className="splash">
      <div className="splash-content">
        <h1 className="splash-title">
          "That most ancient and sacred of arts... puppetry"
        </h1>
        
        <div className="splash-description">
          <p>
            Welcome to an interactive exploration of marionette puppetry, where 
            the timeless craft of string manipulation meets modern physics simulation 
            and artificial intelligence.
          </p>
          
          <p>
            This project brings to life a force-based marionette puppet system where 
            every movement is driven by the physical tension of strings connecting 
            the control bar to the puppet's joints. Through real-time physics simulation, 
            we explore how the position and attitude of the control crossbar translates 
            into motion through the transfer of forces along the strings—the very essence 
            of how marionettes have been animated for centuries.
          </p>
          
          <p>
            Experience the delicate balance between control and physics as you manipulate 
            the marionette, observing how forces propagate through the strings to create 
            lifelike movement. Each string acts as a tendon, transferring tension from 
            the puppeteer's hand to the puppet's limbs, head, and torso.
          </p>
          
          <p className="splash-features">
            <strong>Features:</strong>
          </p>
          <ul>
            <li>Force-based physics simulation with string tension calculations</li>
            <li>Real-time control bar manipulation with keyboard controls</li>
            <li>8-string marionette system (head, chest, hands, shoulders, feet)</li>
            <li>Interactive string pulling and manipulation</li>
            <li>Gravity, collision detection, and joint dynamics</li>
            <li><strong>New:</strong> iPhone controller with IMU and ARKit body tracking</li>
          </ul>
          
          <div className="splash-phone-section">
            <h3>📱 Phone Controller Interface</h3>
            <p>
              Control the marionette using your iPhone as a physical controller! The iOS app offers 
              two modes: <strong>Controller mode</strong> uses the device's IMU sensors to detect 
              orientation and movement, while <strong>Mocap mode</strong> uses ARKit body tracking 
              to capture your skeleton for inverse kinematics mapping to the puppet.
            </p>
            <p>
              Connect your phone via Web Bluetooth (BLE) to stream real-time telemetry data. 
              View the live data stream and see how your movements translate to puppet control.
            </p>
            <a 
              href={`${base}/telemetry.html`} 
              className="splash-button phone-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              View Telemetry Dashboard
            </a>
          </div>
        </div>
        
        <div className="splash-buttons">
          <Link to="/sim" className="splash-button">
            Enter the Simulation
          </Link>
          <Link to="/kleist" className="splash-button secondary">
            Read Kleist's Essay
          </Link>
        </div>
      </div>
    </div>
  )
}
