import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar,
    MapPin,
    Clock,
    Users,
    Phone,
    User,
    Building2,
    UserPlus,
    ChevronRight,
} from 'lucide-react'

import flyerImage from '../assets/USM.jpeg'

type Branch = {
    id: string
    name: string
}

type Status = 'Member' | 'Guest'

export default function Registration() {
    // Form state
    const [status, setStatus] = useState<Status>('Member')
    const [phone, setPhone] = useState('')
    const [fullName, setFullName] = useState('')
    const [branch, setBranch] = useState('')
    const [location, setLocation] = useState('')
    const [invitee, setInvitee] = useState('')

    // UI state
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)

    // Conditional visibility
    const showLocation = status === 'Member' || status === 'Guest'
    const showInvitedBy = status === 'Guest'

    // Fetch branches on mount
    useEffect(() => {
        const fetchBranches = async () => {
            const { data, error } = await supabase
                .from('branches')
                .select('*')
                .order('name')

            if (error) {
                console.error('Error fetching branches:', error)
                return
            }

            if (data && data.length > 0) {
                setBranches(data)
                setBranch(data[0].name)
            }
        }

        fetchBranches()
    }, [])

    // Clear conditional fields when status changes
    useEffect(() => {
        if (!showLocation) setLocation('')
        if (!showInvitedBy) setInvitee('')
    }, [status, showLocation, showInvitedBy])

    const resetForm = () => {
        setStatus('Member')
        setPhone('')
        setFullName('')
        setBranch(branches.length > 0 ? branches[0].name : '')
        setLocation('')
        setInvitee('')
    }

    const handleRegister = async () => {
        if (!fullName.trim()) return alert('Please enter your full name')
        if (!phone.trim()) return alert('Please enter your phone number')
        if (!branch) return alert('Please select a branch')

        setLoading(true)

        const { error } = await supabase
            .from('attendance_logs')
            .insert([
                {
                    full_name: fullName.trim(),
                    phone_number: phone.trim(),
                    status: status,
                    branch: branch,
                    location: showLocation ? location.trim() || null : null,
                    invited_by: showInvitedBy ? invitee.trim() || null : null,
                }
            ])

        setLoading(false)

        if (error) {
            console.error('Registration error:', error)
            alert('Something went wrong. Please try again.')
            return
        }

        setSuccess(true)
        resetForm()
        setTimeout(() => setSuccess(false), 5000)
    }

    return (
        <motion.div
            className="registration-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* ─── LEFT: Event Info Panel ─── */}
            <div className="info-panel" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>

                {/* 1. FLYER IMAGE AREA (Top Half) */}
                <div style={{ flex: '1', position: 'relative', overflow: 'hidden', minHeight: '300px' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: `url(${flyerImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />

                    {/* Gradient Overlay for Blend */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 0%, rgba(20, 20, 35, 0.9) 90%, #151525 100%)',
                    }} />

                    <div style={{ position: 'absolute', bottom: '20px', left: '32px' }}>
                        <div className="event-badge">
                            <Calendar size={14} />
                            21st Feb
                        </div>
                        <h1>USM<br />Registration</h1>
                    </div>
                </div>

                {/* 2. DETAILS AREA (Bottom Half) */}
                <div style={{ padding: '0 32px 32px 32px', background: '#151525' }}>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="subtitle" style={{
                            fontStyle: 'italic',
                            borderLeft: '3px solid var(--primary)',
                            paddingLeft: '16px',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '15px'
                        }}>
                            "We know you waited<br />
                            We know you anticipated<br />
                            Well, now it's here again.<br />
                            The Unending Spirit meeting returns.<br />
                            Get ready🔥"
                        </div>

                        <div className="info-details">
                            <div className="info-detail">
                                <div className="info-icon">
                                    <Clock size={16} />
                                </div>
                                <div className="info-detail-text">
                                    <h4>9:00 AM</h4>
                                    <p>Doors open early</p>
                                </div>
                            </div>

                            <div className="info-detail">
                                <div className="info-icon">
                                    <MapPin size={16} />
                                </div>
                                <div className="info-detail-text">
                                    <h4>New Location</h4>
                                    <p>3rd floor ORA black star building<br />Opposite Ofankor Shell filling station</p>
                                </div>
                            </div>

                            {/* Compact Map */}
                            <div style={{
                                marginTop: '20px',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                height: '140px',
                                border: '1px solid rgba(255,255,255,0.1)'
                            }}>
                                <iframe
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    src="https://maps.google.com/maps?q=Chatime+Ghana+Ofankor&t=&z=15&ie=UTF8&iwloc=&output=embed"
                                    style={{ border: 0 }}
                                    title="Map of Ofankor Location"
                                ></iframe>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ─── RIGHT: Registration Form ─── */}
            <div className="form-panel">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <h2>Register Now</h2>
                    <p className="form-subtitle">Fill in your details to confirm attendance</p>

                    {/* Success Message */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                className="success-message"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            >
                                🎉 See you on Saturday!
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Status & Phone */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <div className="input-wrapper">
                                <Users size={18} className="input-icon" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as Status)}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Guest">Guest</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="input-wrapper">
                                <Phone size={18} className="input-icon" />
                                <input
                                    type="tel"
                                    placeholder="054 123 4567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Full Name */}
                    <div className="form-group">
                        <label>Full Name</label>
                        <div className="input-wrapper">
                            <User size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Branch */}
                    <div className="form-group">
                        <label>Branch</label>
                        <div className="input-wrapper">
                            <Building2 size={18} className="input-icon" />
                            <select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                            >
                                {branches.length === 0 && (
                                    <option disabled>Loading branches...</option>
                                )}
                                {branches.map((b) => (
                                    <option key={b.id} value={b.name}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Location */}
                    <AnimatePresence>
                        {showLocation && (
                            <motion.div
                                className="form-group"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <label>Location</label>
                                <div className="input-wrapper">
                                    <MapPin size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Your location"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Invited By */}
                    <AnimatePresence>
                        {showInvitedBy && (
                            <motion.div
                                className="form-group"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <label>Invited By</label>
                                <div className="input-wrapper">
                                    <UserPlus size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Who invited you?"
                                        value={invitee}
                                        onChange={(e) => setInvitee(e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                        className="btn-submit"
                        onClick={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" />
                                Registering...
                            </>
                        ) : (
                            <>
                                Register <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Admin Link (Subtle) */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center' }}>
                    <a href="/login" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>Admin Login</a>
                </div>
            </div>
        </motion.div>
    )
}