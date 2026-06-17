import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuthActions } from "@convex-dev/auth/react"
import {
    LayoutDashboard, UserPlus, FileText, CalendarDays,
    LogOut, Search, Bell, Menu, X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
        if (isMobile) {
            setTimeout(() => setIsSidebarOpen(false), 0)
        }
    }, [location.pathname, isMobile])

    const { signOut } = useAuthActions()

    const handleLogout = async () => {
        await signOut()
        navigate('/login')
    }

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/register', icon: UserPlus, label: 'Register Member' },
        { path: '/admin/reports', icon: FileText, label: 'Reports' },
        { path: '/admin/events', icon: CalendarDays, label: 'Events' },
    ]

    const pageTitle = navItems.find(item => item.path === location.pathname)?.label || 'Admin Panel'

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-base)'
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
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 40
                        }}
                    />
                )}
            </AnimatePresence>

            {/* ─── SIDEBAR ─── */}
            <motion.aside
                initial={false}
                animate={{
                    x: isMobile ? (isSidebarOpen ? 0 : -280) : 0,
                    width: isMobile ? 260 : (isSidebarOpen ? 260 : 80),
                    opacity: isMobile ? (isSidebarOpen ? 1 : 0) : 1,
                    padding: isSidebarOpen ? '24px 20px' : (isMobile ? '24px 0px' : '24px 12px')
                }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                    height: '100%',
                    background: 'var(--bg-surface)',
                    borderRight: '1px solid var(--border)',
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
                <div style={{ 
                    marginBottom: '40px', 
                    paddingLeft: isSidebarOpen ? '8px' : '0px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                    gap: '12px' 
                }}>
                    <img src={logo} alt="USM Logo" style={{ height: '36px', width: 'auto', flexShrink: 0 }} />
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.h2 
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)', fontSize: '20px', margin: 0, fontWeight: 700, overflow: 'hidden' }}
                            >
                                USM <span style={{ color: 'var(--primary-light)' }}>Admin</span>
                            </motion.h2>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav Links */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                title={!isSidebarOpen ? item.label : undefined}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                                    gap: '12px',
                                    padding: isSidebarOpen ? '10px 14px' : '12px 0',
                                    borderRadius: 'var(--radius-sm)',
                                    textDecoration: 'none',
                                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'var(--bg-subtle)' : 'transparent',
                                    transition: 'all 0.2s',
                                    fontWeight: 500,
                                    fontSize: '14px',
                                    overflow: 'hidden'
                                }}
                            >
                                <item.icon size={20} style={{ flexShrink: 0 }} />
                                <AnimatePresence>
                                    {isSidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            style={{ whiteSpace: 'nowrap' }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Link>
                        )
                    })}
                </nav>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    title={!isSidebarOpen ? "Logout" : undefined}
                    style={{
                        marginTop: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                        gap: '12px',
                        padding: isSidebarOpen ? '10px 14px' : '12px 0',
                        borderRadius: 'var(--radius-sm)',
                        background: isSidebarOpen ? 'var(--danger-bg)' : 'transparent',
                        border: isSidebarOpen ? '1px solid var(--danger-bg)' : 'none',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        fontSize: '14px',
                        transition: 'all 0.2s',
                        overflow: 'hidden'
                    }}
                >
                    <LogOut size={20} style={{ flexShrink: 0 }} />
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </motion.aside>

            {/* ─── MAIN CONTENT ─── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

                {/* Topbar */}
                <header style={{
                    height: '72px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: isMobile ? '0 16px' : '0 32px',
                    background: 'var(--bg-base)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="btn-icon"
                            style={{ marginLeft: '-8px', border: 'none', background: 'transparent' }}
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
                        </button>
                        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{pageTitle}</h1>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* Global Search */}
                        {location.pathname === '/admin' && (
                            <div className="search-bar" style={{ position: 'relative', width: '280px' }}>
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px 8px 36px',
                                        background: 'var(--bg-surface)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 'var(--radius-sm)',
                                        color: 'var(--text-primary)',
                                        height: '36px',
                                        fontSize: '14px',
                                        boxShadow: 'none'
                                    }}
                                />
                            </div>
                        )}

                        <div className="btn-icon" style={{ borderRadius: '50%' }}>
                            <Bell size={18} />
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 4vw, 32px)' }}>
                    <Outlet context={{ searchTerm }} />
                </div>

            </main>
        </div>
    )
}
