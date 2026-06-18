import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { motion } from 'framer-motion'
import { Mail, Lock, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import logo from '../assets/logo.png'
import bgImage from '../assets/14.JPEG'

export default function AdminSignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const signUpMutation = useMutation(api.adminAuth.signUp)

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (password.length < 8) {
            toast.error('Password must be at least 8 characters long');
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const result = await signUpMutation({ email, password });
            if (result.success) {
                localStorage.setItem('usm_admin_token', result.token!);
                localStorage.setItem('usm_admin_role', result.role!);
                localStorage.setItem('usm_admin_name', result.name!);
                toast.success('Account created successfully!');
                navigate('/admin');
            } else {
                toast.error(result.error || 'Account already exists. Please login instead.');
            }
        } catch (error: any) {
            console.error("SignUp Error:", error);
            toast.error('Failed to create account.');
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
                inset: -20,
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
                    onClick={() => navigate('/login')}
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
                    <h1 style={{ fontSize: '24px', color: 'white', fontWeight: 700, marginBottom: '8px' }}>Create Admin</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Sign up to manage USM events</p>
                </div>

                <form onSubmit={handleSignUp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="glass-label">Email</label>
                        <div className="glass-input-wrapper">
                            <Mail size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                            <input
                                type="email"
                                placeholder="name@usm.com"
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

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="glass-label">Confirm Password</label>
                        <div className="glass-input-wrapper">
                            <Lock size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                        {loading ? 'Creating...' : (
                            <>Sign Up <ChevronRight size={18} /></>
                        )}
                    </button>

                    <div style={{ textAlign: 'center', marginTop: '16px' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Already have an account? </span>
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                fontWeight: 600,
                                fontSize: '14px',
                                cursor: 'pointer',
                                padding: 0
                            }}
                        >
                            Log in
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
