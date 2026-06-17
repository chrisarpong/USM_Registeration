import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { motion } from 'framer-motion'
import { Mail, Lock, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import logo from '../assets/logo.png'
import bgImage from '../assets/14.JPEG'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const loginMutation = useMutation(api.adminAuth.login)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await loginMutation({ email, password })
            if (result.success) {
                localStorage.setItem('usm_admin_token', result.token!)
                localStorage.setItem('usm_admin_role', result.role!)
                localStorage.setItem('usm_admin_name', result.name!)
                toast.success(`Welcome back, ${result.name}!`)
                
                if (result.role === 'scanner') {
                    navigate('/admin/scan')
                } else {
                    navigate('/admin')
                }
            } else {
                toast.error(result.error || 'Invalid credentials')
            }
        } catch (error) {
            toast.error('An error occurred during login')
        } finally {
            setLoading(false)
        }
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
                    background: 'rgba(20, 20, 25, 0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
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
                    <h1 style={{ fontSize: '24px', color: 'white', fontWeight: 700, marginBottom: '8px' }}>Admin Login</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Enter your credentials to access the dashboard</p>
                </div>

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="glass-label">Email</label>
                        <div className="glass-input-wrapper">
                            <Mail size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                            <input
                                type="email"
                                placeholder="nadia@usm.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="glass-input"
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="glass-label">Password</label>
                        <div className="glass-input-wrapper">
                            <Lock size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
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
                        disabled={loading}
                        style={{
                            marginTop: '8px',
                            height: '48px',
                            background: '#000000',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            fontSize: '15px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        {loading ? 'Logging in...' : (
                            <>Login <ChevronRight size={18} /></>
                        )}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}
