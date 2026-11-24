import { HashRouter, NavLink, Route, Routes } from 'react-router-dom'
import AuthGate, { signOut } from './auth/AuthGate'
import { isDemo } from './lib/supabase'
import SeasonPage from './pages/SeasonPage'
import DriversPage from './pages/DriversPage'
import DriverPage from './pages/DriverPage'
import RacePage from './pages/RacePage'

// HashRouter keeps deep links working on static hosts (GitHub Pages, Netlify).
export default function App() {
  return (
    <AuthGate>
      <HashRouter>
        <div className="shell">
          <nav className="topbar">
            <NavLink to="/" className="brand">
              <span className="brand-mark">F1</span> League Tracker
            </NavLink>
            <div className="nav-links">
              <NavLink to="/" end>Season</NavLink>
              <NavLink to="/drivers">Drivers</NavLink>
              {!isDemo && (
                <button className="link-button" onClick={signOut}>Sign out</button>
              )}
            </div>
          </nav>
          {isDemo && (
            <p className="demo-banner">
              Demo mode · made-up drivers and results
            </p>
          )}
          <main className="content">
            <Routes>
              <Route path="/" element={<SeasonPage />} />
              <Route path="/seasons/:number" element={<SeasonPage />} />
              <Route path="/drivers" element={<DriversPage />} />
              <Route path="/drivers/:id" element={<DriverPage />} />
              <Route path="/races/:id" element={<RacePage />} />
              <Route path="*" element={<p className="muted">Page not found.</p>} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthGate>
  )
}
