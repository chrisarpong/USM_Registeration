import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { supabase } from '../supabaseClient'
import { useActiveEvent, formatEventDate } from '../hooks/useEvents'
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
    Mail,
    Sparkles,
} from 'lucide-react'

import flyerFallback from '../assets/USM.jpeg'
import logo from '../assets/logo.png'

type Branch = {
    id: string
    name: string
}

type Status = 'Member' | 'Guest' | 'First Timer'

export default function Registration() {
    const navigate = useNavigate()
    const { event, loading: eventLoading, error: eventError } = useActiveEvent()

    // Form state
    const [status, setStatus] = useState<Status>('Member')
    const [phone, setPhone] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [branch, setBranch] = useState('')
    const [location, setLocation] = useState('')
    const [invitee, setInvitee] = useState('')

    // UI state
    const [branches, setBranches] = useState<Branch[]>([])
    const [loading, setLoading] = useState(false)

    // Conditional visibility
    const showBranch = status === 'Member'
    const showInvitedBy = status === 'Guest' || status === 'First Timer'

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
        const timeout = setTimeout(() => {
            if (status !== 'Member') setBranch('N/A')
            if (showBranch && branch === 'N/A') setBranch(branches.length > 0 ? branches[0].name : '')
            if (!showInvitedBy) setInvitee('')
        }, 10)
        return () => clearTimeout(timeout)
    }, [status, showBranch, showInvitedBy, branches, branch])

    const resetForm = () => {
        setStatus('Member')
        setPhone('')
        setFullName('')
        setEmail('')
        setBranch(branches.length > 0 ? branches[0].name : '')
        setLocation('')
        setInvitee('')
    }

    // Derived event values with fallbacks
    const eventDate = event ? formatEventDate(event.date) : '—'
    const eventTime = event?.time || '10:00 AM'
    const eventTheme = event?.theme || 'TBD'
    const eventVenue = event?.venue || 'Venue TBD'
    const eventMapQuery = event?.map_query || 'Chatime+Ghana+Ofankor'
    const eventDescription = event?.description || 'The Unending Spirit meeting returns. Get ready🔥'
    const eventFlyer = event?.flyer_url || flyerFallback
    const registrationOpen = event?.is_registration_open ?? true

    // Show loading state while event data is being fetched
    if (eventLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}
                >
                    <img src={logo} alt="USM Logo" style={{ height: '80px', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.6))' }} />
                    <p>Loading event details...</p>
                </motion.div>
            </div>
        )
    }

    // Show error state if no active event
    if (eventError || !event) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', maxWidth: '400px', padding: '40px' }}
                >
                    <img src={logo} alt="USM Logo" style={{ height: '80px', margin: '0 auto 20px', display: 'block', filter: 'drop-shadow(0 0 16px rgba(168, 85, 247, 0.6))' }} />
                    <h2 style={{ color: 'white', marginBottom: '12px', fontFamily: 'Outfit, sans-serif' }}>No Active Event</h2>
                    <p style={{ lineHeight: 1.6 }}>Registration is not currently open. Check back later for the next Unending Spirit Meeting!</p>
                    <div style={{ marginTop: '24px' }}>
                        <a href="/login" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>Admin Login</a>
                    </div>
                </motion.div>
            </div>
        )
    }


    const handleRegister = async () => {
        if (!registrationOpen) return toast.error('Registration is currently closed for this event')
        if (!fullName.trim()) return toast.error('Please enter your full name')
        if (!phone.trim()) return toast.error('Please enter your phone number')
        if (!email.trim()) return toast.error('Please enter your email address')
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(email.trim())) return toast.error('Please enter a valid email address')
        
        const finalBranch = status === 'Member' ? branch : 'N/A'
        if (status === 'Member' && !finalBranch) return toast.error('Please select a branch')
        if (!location.trim()) return toast.error('Please enter your location')

        setLoading(true)

        const { data, error } = await supabase
            .from('attendance_logs')
            .insert([
                {
                    full_name: fullName.trim(),
                    phone_number: phone.trim(),
                    email: email.trim(),
                    status: status,
                    branch: finalBranch,
                    location: location.trim(),
                    invited_by: showInvitedBy ? invitee.trim() || null : null,
                    event_id: event.id,
                }
            ])
            .select()

        setLoading(false)

        if (error) {
            console.error('Registration error:', error)
            toast.error('Something went wrong. Please try again.')
            return
        }

        // Trigger Email Notification with dynamic event details
        fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: fullName.trim(),
                email: email.trim(),
                eventDate: eventDate,
                eventTime: eventTime,
                eventTheme: eventTheme,
                eventVenue: eventVenue,
                flyerUrl: event.flyer_url,
            })
        }).catch(err => console.error('Failed to send email:', err))

        toast.success('Registration successful! See you soon! 🎉', { duration: 5000 })
        const registrationId = data?.[0]?.id
        resetForm()
        navigate('/success', {
            state: {
                name: fullName.trim(),
                registrationId,
                event: {
                    date: eventDate,
                    time: eventTime,
                    theme: eventTheme,
                    venue: eventVenue,
                }
            }
        })
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
                        backgroundImage: `url(${eventFlyer})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }} />

                    {/* Gradient Overlay for Blend */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 0%, transparent 60%, rgba(20, 20, 35, 0.95) 95%, #151525 100%)',
                    }} />

                    <div style={{ position: 'absolute', bottom: '20px', left: 'clamp(20px, 5vw, 32px)' }}>
                        <div className="event-badge">
                            <Calendar size={14} />
                            {eventDate}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                            <img src={logo} alt="Church Logo" style={{ height: 'clamp(40px, 6vw, 56px)', width: 'auto', filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.5))' }} />
                            <h1 style={{ margin: 0, fontSize: 'clamp(20px, 5vw, 28px)', lineHeight: 1.2 }}>USM<br />Registration</h1>
                        </div>
                    </div>
                </div>

                {/* 2. DETAILS AREA (Bottom Half) */}
                <div style={{ padding: 'clamp(20px, 4vw, 32px)', background: '#151525' }}>
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
                            {eventDescription.split('\n').map((line, i) => (
                                <span key={i}>{line}<br /></span>
                            ))}
                        </div>

                        <div className="info-details">
                            <div className="info-detail">
                                <div className="info-icon">
                                    <Clock size={16} />
                                </div>
                                <div className="info-detail-text">
                                    <h4>{eventTime}</h4>
                                    <p>Doors open early</p>
                                </div>
                            </div>

                            <div className="info-detail">
                                <div className="info-icon">
                                    <Sparkles size={16} />
                                </div>
                                <div className="info-detail-text">
                                    <h4>Theme</h4>
                                    <p>{eventTheme}</p>
                                </div>
                            </div>

                            <div className="info-detail">
                                <div className="info-icon">
                                    <MapPin size={16} />
                                </div>
                                <div className="info-detail-text">
                                    <h4>Venue</h4>
                                    <p>{eventVenue}</p>
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
                                    src={`https://maps.google.com/maps?q=${eventMapQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    style={{ border: 0 }}
                                    title="Map of Event Location"
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
                    <p className="form-subtitle">
                        {registrationOpen
                            ? 'Fill in your details to confirm attendance'
                            : 'Registration for this event is currently closed'
                        }
                    </p>

                    {!registrationOpen && (
                        <div style={{
                            padding: '16px', borderRadius: '12px', marginBottom: '24px',
                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#f87171', fontSize: '14px', fontWeight: 500, textAlign: 'center'
                        }}>
                            Registration is closed. Check back later!
                        </div>
                    )}

                    {/* Status & Phone */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <div className="input-wrapper">
                                <Users size={18} className="input-icon" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as Status)}
                                    disabled={!registrationOpen}
                                >
                                    <option value="Member">Member</option>
                                    <option value="Guest">Guest</option>
                                    <option value="First Timer">First Timer</option>
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
                                    disabled={!registrationOpen}
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
                                disabled={!registrationOpen}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="form-group">
                        <label>Email Address</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!registrationOpen}
                            />
                        </div>
                    </div>

                    {/* Branch (Conditional) */}
                    <AnimatePresence>
                        {showBranch && (
                            <motion.div
                                className="form-group"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <label>Branch</label>
                                <div className="input-wrapper">
                                    <Building2 size={18} className="input-icon" />
                                    <select
                                        value={branch}
                                        onChange={(e) => setBranch(e.target.value)}
                                        disabled={!registrationOpen}
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
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Location (Globally Required) */}
                    <div className="form-group">
                        <label>Location</label>
                        <div className="input-wrapper">
                            <MapPin size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Your location (e.g., Kasoa, Accra)"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                disabled={!registrationOpen}
                            />
                        </div>
                    </div>

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
                                        disabled={!registrationOpen}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        whileHover={!loading && registrationOpen ? { scale: 1.02, boxShadow: '0 12px 40px rgba(99, 102, 241, 0.6)' } : {}}
                        whileTap={!loading && registrationOpen ? { scale: 0.98 } : {}}
                        className="btn-submit"
                        onClick={handleRegister}
                        disabled={loading || !registrationOpen}
                        style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '8px',
                            background: registrationOpen
                                ? 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)'
                                : 'rgba(255,255,255,0.1)',
                            boxShadow: registrationOpen ? '0 8px 32px rgba(99, 102, 241, 0.4)' : 'none',
                            border: '1px solid rgba(255,255,255,0.2)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                            cursor: registrationOpen ? 'pointer' : 'not-allowed'
                        }}
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
                    </motion.button>
                </motion.div>

                {/* Admin Link (Subtle) */}
                <div style={{ marginTop: 'auto', paddingTop: '20px', textAlign: 'center' }}>
                    <a href="/login" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' }}>Admin Login</a>
                </div>
            </div>
        </motion.div>
    )
}