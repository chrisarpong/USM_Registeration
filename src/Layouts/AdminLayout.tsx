import { useState, useEffect } from 'react'
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
import adminBgImage from '../assets/11.JPEG'
import logo from '../assets/logo.png'

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const [searchTerm, setSearchTerm] = useState('')
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768)

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        // Close sidebar on route change (mobile)
        if (isMobile) {
            setTimeout(() => setIsSidebarOpen(false), 0)
        }
    }, [location.pathname, isMobile])

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
            backgroundColor: '#0f0f1a', // Fallback color
            backgroundImage: `linear-gradient(135deg, rgba(15, 15, 26, 0.95) 0%, rgba(40, 20, 60, 0.85) 100%), url(${adminBgImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
        }}>
            {/* ─── MOBILE OVERLAY ─── */}
            <AnimatePresence>
                {isMobile && isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 40
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ─── SIDEBAR ─── */}
            <motion.aside
                className={`sidebar`}
                initial={false}
                animate={{
                    x: isMobile ? (isSidebarOpen ? 0 : -280) : 0,
                    width: isMobile ? 260 : (isSidebarOpen ? 260 : 0),
                    opacity: isMobile ? 1 : (isSidebarOpen ? 1 : 0),
                    padding: isSidebarOpen ? '24px' : '24px 0px'
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                    height: '100%',
                    background: 'rgba(20, 20, 35, 0.65)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    position: isMobile ? 'fixed' : 'relative',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                }}
            >
                {/* Logo */}
                <div style={{ marginBottom: '40px', paddingLeft: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="USM Logo" style={{ height: '48px', width: 'auto', filter: 'drop-shadow(0 0 12px rgba(168, 85, 247, 0.8))' }} />
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', color: 'white', fontSize: '24px', margin: 0 }}>
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
                    padding: isMobile ? '0 16px' : '0 32px',
                    background: 'rgba(20, 20, 35, 0.2)', // More transparent
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <motion.button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'white',
                                cursor: 'pointer',
                                padding: '8px',
                                marginLeft: '-8px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '40px',
                                height: '40px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }}
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={isSidebarOpen ? 'close' : 'open'}
                                    initial={{ opacity: 0, rotate: -90 }}
                                    animate={{ opacity: 1, rotate: 0 }}
                                    exit={{ opacity: 0, rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ display: 'flex' }}
                                >
                                    {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
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
