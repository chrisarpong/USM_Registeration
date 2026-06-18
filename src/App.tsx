import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useConvexAuth } from "convex/react"
import Registration from './Component/Registration'
import SuccessPage from './Component/SuccessPage'
import AdminLogin from './Component/AdminLogin'
import AdminSignUp from './Component/AdminSignUp'
import AdminForgotPassword from './Component/AdminForgotPassword'
import AdminDashboard from './Component/AdminDashboard'
import AdminLayout from './Layouts/AdminLayout'
import AdminRegister from './Component/AdminRegister'
import AdminReports from './Component/AdminReports'
import EventManagement from './Component/EventManagement'
import ScannerMode from './Component/ScannerMode'

// Protected Route Component
const ProtectedRoute = () => {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const hasLocalToken = !!localStorage.getItem('usm_admin_token');

  if (isLoading) return null
  if (!isAuthenticated && !hasLocalToken) return <Navigate to="/login" replace />

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
          <Route path="/signup" element={<AdminSignUp />} />
          <Route path="/forgot-password" element={<AdminForgotPassword />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/scan" element={<ScannerMode />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="register" element={<AdminRegister />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="events" element={<EventManagement />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </>
  )
}

export default App