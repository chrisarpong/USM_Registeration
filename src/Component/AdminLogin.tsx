import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, ChevronRight, ArrowLeft } from 'lucide-react'

export default function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            alert(error.message)
            setLoading(false)
        } else {
            navigate('/admin')
        }
    }

    return (
        <motion.div
            className="registration-container" // Reusing glass container style
            style={{ maxWidth: '400px', minHeight: 'auto', display: 'flex', flexDirection: 'column' }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
        >
            <div className="form-panel" style={{ borderLeft: 'none', padding: '40px' }}>
                <div style={{ marginBottom: '20px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                    <ArrowLeft size={20} color="white" />
                </div>

                <h2>Admin Login</h2>
                <p className="form-subtitle">Enter your credentials to access the dashboard</p>

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="admin@usm.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" />
                                Logging in...
                            </>
                        ) : (
                            <>
                                Login <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </motion.div>
    )
}
