import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useActiveEvent, formatEventDate } from '../hooks/useEvents'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Phone, User, Building2, MapPin, UserPlus,
    ChevronRight, CheckCircle, Mail
} from 'lucide-react'

import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

type Status = 'Member' | 'Guest' | 'First Timer'

export default function AdminRegister() {
    const { event } = useActiveEvent()

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
    const [success, setSuccess] = useState(false)

    const registerAttendee = useMutation(api.attendanceLogs.registerAttendee)

    // Conditional visibility
    const showBranch = status === 'Member'
    const showInvitedBy = status === 'First Timer'

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

    const resetForm = () => {
        setStatus('Member')
        setPhone('')
        setFullName('')
        setEmail('')
        setBranch(branches.length > 0 ? branches[0].name : '')
        setLocation('')
        setInvitee('')
        setHeardFrom('')
    }

    const handleRegister = async () => {
        if (!fullName.trim()) return toast.error('Please enter full name')
        if (!phone.trim()) return toast.error('Please enter phone number')
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (email.trim() && !emailRegex.test(email.trim())) {
            return toast.error('Please enter a valid email address')
        }

        const finalBranch = status === 'Member' ? branch : 'N/A'
        if (status === 'Member' && !finalBranch) return toast.error('Please select a branch')
        if (!location.trim()) return toast.error('Please enter a location')
        if (!event) return toast.error('No active event found to register under.')

        setLoading(true)

        try {
            await registerAttendee({
                full_name: fullName.trim(),
                phone_number: phone.trim(),
                email: email.trim() || undefined,
                status: status,
                branch: finalBranch,
                location: location.trim(),
                invited_by: showInvitedBy ? invitee.trim() || undefined : undefined,
                heard_from: heardFrom.trim() || undefined,
                event_id: event.id as Id<"events">,
                is_admin_registration: true,
            })

            // Trigger Email Notification if email is provided
            if (email.trim()) {
                fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: fullName.trim(),
                        email: email.trim(),
                        eventDate: event ? formatEventDate(event.date) : undefined,
                        eventTime: event?.time,
                        eventTheme: event?.theme,
                        eventVenue: event?.venue,
                        flyerUrl: event?.flyer_url,
                    })
                }).catch(err => console.error('Failed to send email:', err))
            }

            toast.success('User registered successfully!')
            setSuccess(true)
            resetForm()
            setTimeout(() => setSuccess(false), 3000)
        } catch (error: any) {
            toast.error('Error registering user: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '600px', margin: '0 auto' }}
        >
            <div className="registration-container" style={{ display: 'block', minHeight: 'auto', padding: '0', overflow: 'visible' }}>
                <div className="form-panel" style={{ border: 'none', background: 'transparent', padding: '40px' }}>

                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Manual Registration</h2>
                        <p className="form-subtitle">Register a member or guest manually.</p>
                    </div>

                    {/* Success Message */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                style={{
                                    background: 'rgba(52, 211, 153, 0.2)',
                                    border: '1px solid rgba(52, 211, 153, 0.3)',
                                    color: '#34d399',
                                    padding: '16px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    fontWeight: 600
                                }}
                            >
                                <CheckCircle size={20} />
                                User registered successfully!
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Status & Phone */}
                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <div className="input-wrapper">
                                <UserPlus size={18} className="input-icon" />
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as Status)}
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
                                placeholder="Enter full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
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
                                placeholder="Enter email (optional)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Branch */}
                    {showBranch && (
                        <div className="form-group">
                            <label>Branch</label>
                            <div className="input-wrapper">
                                <Building2 size={18} className="input-icon" />
                                <select
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                >
                                    {branches.map((b) => (
                                        <option key={b._id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Location (Globally Required) */}
                    <div className="form-group">
                        <label>Location</label>
                        <div className="input-wrapper">
                            <MapPin size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>
                    </div>

                    {showInvitedBy && (
                        <div className="form-group">
                            <label>Invited By</label>
                            <div className="input-wrapper">
                                <UserPlus size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Who invited them?"
                                    value={invitee}
                                    onChange={(e) => setInvitee(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Heard From (Optional) */}
                    <div className="form-group">
                        <label>Where did they hear about us? <span style={{ textTransform: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 400 }}>(Optional)</span></label>
                        <div className="input-wrapper">
                            <UserPlus size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="e.g., Facebook, Friend, Flyer"
                                value={heardFrom}
                                onChange={(e) => setHeardFrom(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className="btn-submit"
                        onClick={handleRegister}
                        disabled={loading || !event}
                    >
                        {loading ? 'Registering...' : (
                            <>Register Member <ChevronRight size={18} style={{ verticalAlign: 'middle', marginLeft: 4 }} /></>
                        )}
                    </button>

                </div>
            </div>
        </motion.div>
    )
}
