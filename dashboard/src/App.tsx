import { Routes, Route, Navigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import LeadsPage from './pages/Leads'
import PlaceholderPage from './pages/Placeholder'
import { menuItems, insightItems } from './data/nav'

const placeholderRoutes = [...menuItems, ...insightItems].filter((item) => item.path !== '/leads')

function App() {
  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <Routes>
        <Route path="/leads" element={<LeadsPage />} />
        {placeholderRoutes.map((item) => (
          <Route key={item.path} path={item.path} element={<PlaceholderPage title={item.label} />} />
        ))}
        <Route path="*" element={<Navigate to="/leads" replace />} />
      </Routes>
    </div>
  )
}

export default App
