import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Phone,
    User,
    Building2,
    MapPin,
    UserPlus,
    ChevronRight,
    CheckCircle,
    Mail
} from 'lucide-react'

type Branch = {
    id: string
    name: string
}

type Status = 'Member' | 'Guest'

export default function AdminRegister() {
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
    const [success, setSuccess] = useState(false)

    // Conditional visibility
    const showLocation = status === 'Member' || status === 'Guest'
    const showInvitedBy = status === 'Guest'

    useEffect(() => {
        const fetchBranches = async () => {
            const { data } = await supabase.from('branches').select('*').order('name')
            if (data && data.length > 0) {
                setBranches(data)
                setBranch(data[0].name)
            }
        }
        fetchBranches()
    }, [])

    const resetForm = () => {
        setStatus('Member')
        setPhone('')
        setFullName('')
        setEmail('')
        setBranch(branches.length > 0 ? branches[0].name : '')
        setLocation('')
        setInvitee('')
    }



    const handleRegister = async () => {
        if (!fullName.trim()) return toast.error('Please enter full name')
        if (!phone.trim()) return toast.error('Please enter phone number')
        // Email optional for admin manual entry? 
        // Let's make it optional but recommended.
        // If email is provided, validate it?

        setLoading(true)
        // Check for existing registration
        const { data: existingUser, error: checkError } = await supabase
            .from('attendance_logs')
            .select('id')
            .eq('phone_number', phone.trim())
            .maybeSingle()

        if (checkError) {
            setLoading(false)
            return toast.error('Error checking registration')
        }

        if (existingUser) {
            setLoading(false)
            return toast.error('Phone number already registered!')
        }

        const { error } = await supabase
            .from('attendance_logs')
            .insert([
                {
                    full_name: fullName.trim(),
                    phone_number: phone.trim(),
                    email: email.trim() || null,
                    status: status,
                    branch: branch,
                    location: showLocation ? location.trim() || null : null,
                    invited_by: showInvitedBy ? invitee.trim() || null : null,
                }
            ])
        setLoading(false)

        // Trigger Email Notification if email is provided
        if (email.trim() && !error) {
            fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: fullName.trim(),
                    email: email.trim()
                })
            }).catch(err => console.error('Failed to send email:', err))
        }

        if (error) {
            toast.error('Error registering user: ' + error.message)
        } else {
            toast.success('User registered successfully!')
            setSuccess(true)
            resetForm()
            setTimeout(() => setSuccess(false), 3000)
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
                    <div className="form-group">
                        <label>Branch</label>
                        <div className="input-wrapper">
                            <Building2 size={18} className="input-icon" />
                            <select
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                            >
                                {branches.map((b) => (
                                    <option key={b.id} value={b.name}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Fields */}
                    {showLocation && (
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
                    )}

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

                    <button
                        className="btn-submit"
                        onClick={handleRegister}
                        disabled={loading}
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
