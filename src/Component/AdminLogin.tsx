import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, ChevronRight, ArrowLeft, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import logo from '../assets/logo.png'
import bgImage from '../assets/13.JPEG'
import { useAuditLogger } from '../utils/auditLogger'

export default function AdminLogin() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { log } = useAuditLogger()

    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        // Hardcoded secure login
        setTimeout(() => {
            if (username === 'Admin@2026' && password === 'USMADMIN@26') {
                localStorage.setItem('admin_auth', 'true')
                toast.success('Welcome back, Admin!')
                log('LOGIN', `Admin logged in successfully`)
                navigate('/admin')
            } else {
                toast.error('Invalid username or password')
            }
            setLoading(false)
        }, 800) // Small delay for UX
    }

    return (
        <div className="page-wrapper" style={{ 
            minHeight: '100vh', 
            width: '100%',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Global Background Image */}
            <div style={{
                position: 'absolute',
                inset: -20, // slightly larger to hide blur edges
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)',
                zIndex: -2
            }} />
            
            {/* Dark Overlay for better contrast */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: -1
            }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    padding: '40px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        left: '24px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>

                <div style={{ textAlign: 'center', marginBottom: '32px', marginTop: '20px' }}>
                    <img src={logo} alt="USM Logo" style={{ height: '48px', margin: '0 auto 16px', display: 'block' }} />
                    <h1 style={{ fontSize: '24px', color: 'var(--text-primary)', fontWeight: 700, marginBottom: '8px' }}>Admin Login</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Enter your secure admin credentials
                    </p>
                </div>

                <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="glass-label">Username</label>
                        <div className="glass-input-wrapper">
                            <User size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                            <input
                                type="text"
                                placeholder="Admin Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="glass-input"
                            />
                        </div>
                    </div>
                    
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="glass-label">Password</label>
                        <div className="glass-input-wrapper">
                            <KeyRound size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="glass-input"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !username || !password}
                        style={{
                            marginTop: '8px',
                            height: '48px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
                            opacity: loading || !username || !password ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Authenticating...' : (
                            <>Secure Login <ChevronRight size={18} /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}
