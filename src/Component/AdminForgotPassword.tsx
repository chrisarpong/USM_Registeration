import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from "@convex-dev/auth/react"
import { motion } from 'framer-motion'
import { Mail, ChevronRight, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'
import logo from '../assets/logo.png'
import bgImage from '../assets/14.JPEG'

export default function AdminForgotPassword() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const navigate = useNavigate()

    const { signIn } = useAuthActions()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Note: Password reset requires email integration configured in Convex Auth.
            // If it throws an error because it's not configured, we'll catch it.
            await signIn('password', { email, flow: 'reset' });
            toast.success('Password reset link sent to your email!');
            setSent(true);
        } catch (error: any) {
            console.error("Reset Password Error:", error);
            toast.error(error.message || 'Failed to send reset link. Email provider may not be configured.');
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
                    <h1 style={{ fontSize: '24px', color: 'white', fontWeight: 700, marginBottom: '8px' }}>Reset Password</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {sent ? "Check your inbox for the next steps." : "Enter your email to receive a password reset link."}
                    </p>
                </div>

                {!sent ? (
                    <form onSubmit={handleReset} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                            {loading ? 'Sending...' : (
                                <>Send Reset Link <ChevronRight size={18} /></>
                            )}
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            width: '100%',
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
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        Return to Login
                    </button>
                )}
            </motion.div>
        </div>
    )
}
