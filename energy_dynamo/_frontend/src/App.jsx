import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SettingsPage from "./pages/SettingsPage";
import './App.css'

import EnergyDashboard from './pages/EnergyDashboard'
import EnergyMonitoringSystem from './pages/components/EnergyMonitoring/EnergyMonitoringSystem';

function App() {
  const [count, setCount] = useState(0)

  

       return (
    <Router>
      <Routes>
        <Route path="/hsp" element={<EnergyDashboard />} />
        {/* <Route path='/hsp' element={<EnergyMonitoringSystem />} /> */}
        <Route path="/hsp/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
     
  
}

export default App
