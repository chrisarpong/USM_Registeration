import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthActions } from "@convex-dev/auth/react"
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ChevronRight, ArrowLeft, KeyRound } from 'lucide-react'
import { toast } from 'react-hot-toast'
import logo from '../assets/logo.png'
import bgImage from '../assets/13.JPEG'
import { useAuditLogger } from '../utils/auditLogger'

export default function AdminLogin() {
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()
    const { log } = useAuditLogger()

    const { signIn } = useAuthActions()

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await signIn("resend-otp", { email })
            toast.success("OTP sent to your email")
            setStep('otp')
        } catch (error: any) {
            console.error("SignIn Error:", error)
            toast.error(error.message || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            await signIn("resend-otp", { email, code })
            toast.success('Welcome back!')
            log('LOGIN', `Admin logged in via email: ${email}`)
            navigate('/admin')
        } catch (error: any) {
            console.error("SignIn Error:", error)
            toast.error(error.message || 'Invalid OTP code')
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
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    position: 'relative',
                    zIndex: 10
                }}
            >
                <button 
                    onClick={() => {
                        if (step === 'otp') {
                            setStep('email')
                            setCode('')
                        } else {
                            navigate('/')
                        }
                    }}
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
                        {step === 'email' ? 'Enter your email to receive an OTP' : 'Enter the 6-digit code sent to your email'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 'email' ? (
                        <motion.form 
                            key="email-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleEmailSubmit} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="glass-label">Email</label>
                                <div className="glass-input-wrapper">
                                    <Mail size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                    <input
                                        type="email"
                                        placeholder="admin@usm.com"
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
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? 'Sending...' : (
                                    <>Send Code <ChevronRight size={18} /></>
                                )}
                            </button>
                        </motion.form>
                    ) : (
                        <motion.form 
                            key="otp-form"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            onSubmit={handleOtpSubmit} 
                            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
                        >
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="glass-label">6-Digit Code</label>
                                <div className="glass-input-wrapper">
                                    <KeyRound size={18} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                    <input
                                        type="text"
                                        placeholder="••••••"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value)}
                                        required
                                        maxLength={6}
                                        className="glass-input"
                                        style={{ letterSpacing: '4px', fontFamily: 'monospace', fontSize: '18px' }}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading || code.length < 6}
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
                                    cursor: loading || code.length < 6 ? 'not-allowed' : 'pointer',
                                    opacity: loading || code.length < 6 ? 0.7 : 1,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {loading ? 'Verifying...' : (
                                    <>Verify <ChevronRight size={18} /></>
                                )}
                            </button>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    )
}
