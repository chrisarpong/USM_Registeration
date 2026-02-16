import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import {
    LayoutDashboard,
    UserPlus,
    FileText,
    LogOut,
    Search,
    Bell,
    Menu,
    X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchTerm, setSearchTerm] = useState('')
    const [isSidebarOpen, setIsSidebarOpen] = useState(false) // For mobile

    const handleLogout = async () => {
        await supabase.auth.signOut()
        navigate('/login')
    }

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/register', icon: UserPlus, label: 'Register Member' },
        { path: '/admin/reports', icon: FileText, label: 'Reports' },
    ]

    const pageTitle = navItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'

    return (
        <div className="admin-layout" style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            background: '#0f0f1a' // Dark background behind glass
        }}>
            {/* ─── SIDEBAR ─── */}
            <motion.aside
                className={`sidebar ${isSidebarOpen ? 'open' : ''}`}
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                    width: '260px',
                    height: '100%',
                    background: 'rgba(20, 20, 35, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                    zIndex: 50,
                    position: 'relative' // Mobile adjust needs conditional
                }}
            >
                {/* Logo */}
                <div style={{ marginBottom: '40px', paddingLeft: '12px' }}>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'white', fontSize: '24px' }}>
                        USM <span style={{ color: '#7c5dfa' }}>Admin</span>
                    </h2>
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                                    background: isActive ? 'rgba(124, 93, 250, 0.15)' : 'transparent',
                                    border: isActive ? '1px solid rgba(124, 93, 250, 0.2)' : '1px solid transparent',
                                    transition: 'all 0.2s',
                                    fontWeight: isActive ? 600 : 400
                                }}
                            >
                                <item.icon size={20} color={isActive ? '#a78bfa' : 'currentColor'} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    }}
                >
                    <LogOut size={20} />
                    Logout
                </button>
            </motion.aside>

            {/* ─── MAIN CONTENT ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

                {/* Topbar */}
                <header style={{
                    height: '80px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 32px',
                    background: 'rgba(20, 20, 35, 0.2)', // More transparent
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'white' }}>{pageTitle}</h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* Global Search (Only visible on Dashboard for now) */}
                        {location.pathname === '/admin' && (
                            <div className="search-bar" style={{
                                position: 'relative',
                                width: '300px'
                            }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 10px 10px 40px',
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '10px',
                                        color: 'white',
                                        height: '40px' // Fix height to prevent growth
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Bell size={20} color="rgba(255,255,255,0.7)" />
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                    {/* Pass toggleSearch down to children */}
                    <Outlet context={{ searchTerm }} />
                </div>

            </main>
        </div>
    )
}
