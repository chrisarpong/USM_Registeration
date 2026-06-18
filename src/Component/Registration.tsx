import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useActiveEvent, formatEventDate } from '../hooks/useEvents'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Calendar, MapPin, Clock, Users, Phone, User,
    Building2, UserPlus, ChevronRight, Mail, Sparkles,
} from 'lucide-react'

import flyerFallback from '../assets/USM.jpeg'
import bgImage from '../assets/14.JPEG'
import logo from '../assets/logo.png'
import { RegistrationSkeleton } from './Skeletons'

import { useQuery, useMutation, useAction } from "convex/react"
import { api } from "../../convex/_generated/api"

type Status = 'Member' | 'Guest' | 'First Timer'

export default function Registration() {
    const { event, loading: eventLoading, error: eventError } = useActiveEvent()

    // Form state
    const [status, setStatus] = useState<Status>('Member')
    const [phone, setPhone] = useState('')
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [branch, setBranch] = useState('')
    const [location, setLocation] = useState('')
    const [invitee, setInvitee] = useState('')
    const [heardFrom, setHeardFrom] = useState('')

    // UI state
    const branchesData = useQuery(api.branches.getBranches)
    const branches = branchesData || []
    const [loading, setLoading] = useState(false)

    const registerAttendee = useMutation(api.attendanceLogs.registerAttendee)
    const sendWelcomeEmail = useAction(api.sendEmail.sendWelcomeEmail)

    // Conditional visibility
    const showBranch = status === 'Member'
    const showInvitedBy = status === 'First Timer'

    // Set default branch when loaded
    useEffect(() => {
        if (branches.length > 0 && !branch) {
            setBranch(branches[0].name)
        }
    }, [branches, branch])

    // Clear conditional fields when status changes
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (status !== 'Member') setBranch('N/A')
            if (showBranch && branch === 'N/A') setBranch(branches.length > 0 ? branches[0].name : '')
            if (!showInvitedBy) setInvitee('')
        }, 10)
        return () => clearTimeout(timeout)
    }, [status, showBranch, showInvitedBy, branches, branch])

    const handleRegister = async () => {
        if (!event) return

        if (!fullName.trim() || !phone.trim() || !email.trim() || !location.trim()) {
            toast.error('Please fill all required fields.')
            return
        }

        if (showBranch && !branch) {
            toast.error('Please select your branch.')
            return
        }

        if (showInvitedBy && !invitee.trim()) {
            toast.error('Please mention who invited you.')
            return
        }

        setLoading(true)
        try {
            const logId = await registerAttendee({
                event_id: (event as any)._id,
                full_name: fullName,
                email,
                phone_number: phone,
                status,
                branch: showBranch ? branch : undefined,
                location,
                invited_by: showInvitedBy ? invitee : undefined,
                heard_from: heardFrom.trim() || undefined,
                is_admin_registration: false
            })

            if (email) {
                // Send email in background
                sendWelcomeEmail({
                    email,
                    name: fullName,
                    eventId: (event as any)._id,
                    logId: logId as any
                }).catch(e => console.error("Email failed to send", e))
            }

            toast.success('Registration successful!')
            
            setFullName('')
            setEmail('')
            setPhone('')
            setLocation('')
            setInvitee('')
            setHeardFrom('')
            setStatus('Member')

        } catch (error: unknown) {
            console.error("Registration error:", error)
            const err = error as Error
            toast.error(err.message || 'Failed to register. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    if (eventError) {
        return (
            <div className="registration-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw' }}>
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-base)', borderRadius: '16px' }}>
                    <h2 style={{ color: 'var(--danger)', marginBottom: '16px' }}>Configuration Error</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>{eventError}</p>
                </div>
            </div>
        )
    }

    if (eventLoading || !event) {
        return <RegistrationSkeleton />
    }

    const eventDate = formatEventDate(event.date)
    const eventTime = event.time || '10:00 AM'
    const eventVenue = event.venue || '3rd floor ORA black star building, Opposite Ofankor Shell filling station'
    const eventTheme = event.theme || 'The Walking of Miracle 2.0'
    const eventDescription = event.description || 'The Unending Spirit meeting returns. Get ready🔥'
    const registrationOpen = event?.is_registration_open ?? false;
    if (!registrationOpen) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'white' }}>
                Registration is currently closed.
            </div>
        )
    }
    const eventFlyer = event.flyer_url || flyerFallback

    return (
        <div className="page-wrapper">
            {/* Global Background Image (Blurred) */}
            <div style={{
                position: 'fixed',
                inset: -20,
                backgroundImage: `url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(10px)',
                zIndex: -2
            }} />
            
            <div style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: -1
            }} />

            <motion.div
                className="registration-glass-layout"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* ─── LEFT PANEL (Dark Solid/Translucent) ─── */}
                <div className="registration-left-panel">
                    {/* Top Flyer Section */}
                    <div style={{
                        position: 'relative',
                        width: '100%',
                        backgroundColor: '#000',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <img 
                            src={eventFlyer} 
                            alt="Event Flyer" 
                            style={{ 
                                width: '100%', 
                                height: 'auto', 
                                display: 'block',
                                objectFit: 'contain'
                            }} 
                        />
                        {/* Date Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '20px',
                            left: '20px',
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            border: '1px solid rgba(255,255,255,0.1)',
                            zIndex: 2
                        }}>
                            <Calendar size={14} />
                            {eventDate.toUpperCase()}
                        </div>
                    </div>

                    <div style={{ padding: '32px' }}>
                        {/* Logo & Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                            <img src={logo} alt="USM Logo" style={{ width: '48px', height: 'auto' }} />
                            <div>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, lineHeight: 1.1 }}>USM</h2>
                                <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, lineHeight: 1.1 }}>Registration</h2>
                            </div>
                        </div>

                        {/* Tagline */}
                        <div style={{ 
                            borderLeft: '2px solid #8b5cf6', 
                            paddingLeft: '16px', 
                            marginBottom: '32px',
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            fontStyle: 'italic'
                        }}>
                            {eventDescription}
                        </div>

                        {/* Details List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Clock size={18} color="#a1a1aa" />
                                </div>
                                <div>
                                    <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0', fontSize: '14px' }}>{eventTime}</p>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>Doors open early</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <Sparkles size={18} color="#a1a1aa" />
                                </div>
                                <div>
                                    <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0', fontSize: '14px' }}>Theme</p>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>{eventTheme}</p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <MapPin size={18} color="#a1a1aa" />
                                </div>
                                <div>
                                    <p style={{ color: 'white', fontWeight: 600, margin: '0 0 4px 0', fontSize: '14px' }}>Venue</p>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px', lineHeight: 1.4 }}>{eventVenue}</p>
                                </div>
                            </div>
                        </div>

                        {/* Embedded Map */}
                        <div style={{ 
                            marginTop: '32px', 
                            width: '100%', 
                            height: '180px', 
                            borderRadius: '16px', 
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <iframe 
                                width="100%" 
                                height="100%" 
                                frameBorder="0" 
                                scrolling="no" 
                                marginHeight={0} 
                                marginWidth={0} 
                                src={`https://maps.google.com/maps?q=${encodeURIComponent(eventVenue)}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                                style={{ border: 0 }}
                                allowFullScreen
                                loading="lazy"
                            ></iframe>
                        </div>
                    </div>
                </div>

                {/* ─── RIGHT PANEL (Glass Form) ─── */}
                <div className="registration-right-panel">
                    <h2 style={{ fontSize: '28px', color: 'white', marginBottom: '8px', fontWeight: 700 }}>Register Now</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>Fill in your details to confirm attendance</p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {/* Status & Phone */}
                        <div className="form-grid-2">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="glass-label">Status</label>
                                <div className="glass-input-wrapper">
                                    <Users size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as Status)}
                                        disabled={!registrationOpen}
                                        className="glass-input"
                                    >
                                        <option value="Member">Member</option>
                                        <option value="Guest">Guest</option>
                                        <option value="First Timer">First Timer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="glass-label">Phone Number</label>
                                <div className="glass-input-wrapper">
                                    <Phone size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                    <input
                                        type="tel"
                                        placeholder="054 123 4567"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        disabled={!registrationOpen}
                                        className="glass-input"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Full Name */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="glass-label">Full Name</label>
                            <div className="glass-input-wrapper">
                                <User size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    disabled={!registrationOpen}
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="glass-label">Email Address</label>
                            <div className="glass-input-wrapper">
                                <Mail size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={!registrationOpen}
                                    className="glass-input"
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
                                    style={{ overflow: 'hidden', marginBottom: 0 }}
                                >
                                    <label className="glass-label">Branch</label>
                                    <div className="glass-input-wrapper">
                                        <Building2 size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                        <select
                                            value={branch}
                                            onChange={(e) => setBranch(e.target.value)}
                                            disabled={!registrationOpen}
                                            className="glass-input"
                                        >
                                            {branches.length === 0 && <option disabled>Loading...</option>}
                                            {branches.map((b) => <option key={b._id} value={b.name}>{b.name}</option>)}
                                        </select>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Location */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="glass-label">Location</label>
                            <div className="glass-input-wrapper">
                                <MapPin size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                <input
                                    type="text"
                                    placeholder="Your location (e.g., Kasoa, Accra)"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={!registrationOpen}
                                    className="glass-input"
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
                                    style={{ overflow: 'hidden', marginBottom: 0 }}
                                >
                                    <label className="glass-label">Invited By</label>
                                    <div className="glass-input-wrapper">
                                        <UserPlus size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                        <input
                                            type="text"
                                            placeholder="Who invited you?"
                                            value={invitee}
                                            onChange={(e) => setInvitee(e.target.value)}
                                            disabled={!registrationOpen}
                                            className="glass-input"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Heard From */}
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="glass-label">Where did you hear about us? <span style={{ textTransform: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 400 }}>(Optional)</span></label>
                            <div className="glass-input-wrapper">
                                <UserPlus size={16} style={{ color: 'var(--text-muted)', marginRight: '12px' }} />
                                <input
                                    type="text"
                                    placeholder="e.g., Facebook, Friend, Flyer"
                                    value={heardFrom}
                                    onChange={(e) => setHeardFrom(e.target.value)}
                                    disabled={!registrationOpen}
                                    className="glass-input"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleRegister}
                            disabled={loading || !registrationOpen}
                            className="premium-submit-btn"
                        >
                            {loading ? 'Registering...' : <>Register <ChevronRight size={18} /></>}
                        </button>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '24px', textAlign: 'center' }}>
                        <a href="/login" style={{ fontSize: '13px', color: 'var(--text-muted)', textDecoration: 'none' }}>Admin Login</a>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
