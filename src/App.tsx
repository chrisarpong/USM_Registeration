import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient' // Fixed path: ./ not ../
import Registration from './Component/Registration'
import AdminLogin from './Component/AdminLogin'
import AdminDashboard from './Component/AdminDashboard'
import AdminLayout from './Layouts/AdminLayout'
import AdminRegister from './Component/AdminRegister'
import AdminReports from './Component/AdminReports'
import type { Session } from '@supabase/supabase-js'

// Protected Route Component
const ProtectedRoute = () => {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session: Session | null) => {
      setAuthenticated(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return null // Or a spinner
  if (!authenticated) return <Navigate to="/login" replace />

  return <Outlet />
}



function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#333',
          color: '#fff',
        },
      }} />
      <Routes>
        <Route path="/" element={<Registration />} />
        <Route path="/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="register" element={<AdminRegister />} />
            <Route path="reports" element={<AdminReports />} />
          </Route>
        </Route>

      </Routes>
    </Router>
  )
}

export default App