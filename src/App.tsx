import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useConvexAuth } from "convex/react"
import Registration from './Component/Registration'
import SuccessPage from './Component/SuccessPage'
import AdminLogin from './Component/AdminLogin'
import AdminDashboard from './Component/AdminDashboard'
import AdminLayout from './Layouts/AdminLayout'
import AdminRegister from './Component/AdminRegister'
import AdminReports from './Component/AdminReports'
import EventManagement from './Component/EventManagement'
import ScannerMode from './Component/ScannerMode'
import AdminLogs from './Component/AdminLogs'

// Protected Route Component
const ProtectedRoute = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}



function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Registration />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/login" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/scan" element={<ScannerMode />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="register" element={<AdminRegister />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="events" element={<EventManagement />} />
              <Route path="logs" element={<AdminLogs />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </>
  )
}

export default App