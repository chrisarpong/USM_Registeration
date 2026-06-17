import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, User, Phone, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuery, useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

type Log = {
    _id: Id<"attendanceLogs">
    full_name: string
    phone_number: string
    status: string
    branch?: string
    invited_by?: string
    location?: string
}

type Props = {
    isOpen: boolean
    onClose: () => void
    log: Log | null
}

export default function EditGuestModal({ isOpen, onClose, log }: Props) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Log>>({})
    
    const branchesData = useQuery(api.branches.getBranches)
    const branches = branchesData?.map(b => b.name) || []
    const updateLog = useMutation(api.attendanceLogs.updateLog)

    useEffect(() => {
        if (log) {
            setFormData({
                full_name: log.full_name,
                phone_number: log.phone_number,
                status: log.status,
                branch: log.branch,
                invited_by: log.invited_by,
                location: log.location
            })
        }
    }, [log])

    const handleChange = (field: keyof Log, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSave = async () => {
        if (!log) return
        setLoading(true)
        
        const payloadToSave = { ...formData }
        if (payloadToSave.status === 'Guest') {
            payloadToSave.branch = 'N/A'
        }

        try {
            await updateLog({
                id: log._id,
                full_name: payloadToSave.full_name,
                phone_number: payloadToSave.phone_number,
                status: payloadToSave.status,
                branch: payloadToSave.branch,
                invited_by: payloadToSave.invited_by,
                location: payloadToSave.location,
            })
            toast.success('Record updated successfully')
            onClose()
        } catch (error) {
            console.error('Update error:', error)
            toast.error('Failed to update record')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !log) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        background: '#1e1e2e',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '500px',
                        color: 'white'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <h3>Edit Registration</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '16px' }}>

                        {/* Full Name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'gray', marginBottom: '6px' }}>Full Name</label>
                            <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <User size={16} color="gray" style={{ marginLeft: '12px' }} />
                                <input
                                    value={formData.full_name || ''}
                                    onChange={e => handleChange('full_name', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px' }}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'gray', marginBottom: '6px' }}>Phone</label>
                            <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <Phone size={16} color="gray" style={{ marginLeft: '12px' }} />
                                <input
                                    value={formData.phone_number || ''}
                                    onChange={e => handleChange('phone_number', e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px' }}
                                />
                            </div>
                        </div>

                        {/* Status & Branch Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'gray', marginBottom: '6px' }}>Status</label>
                                <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <select
                                        value={formData.status || ''}
                                        onChange={e => handleChange('status', e.target.value)}
                                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', width: '100%' }}
                                    >
                                        <option value="Member">Member</option>
                                        <option value="Guest">Guest</option>
                                        <option value="First Timer">First Timer</option>
                                    </select>
                                </div>
                            </div>
                            {formData.status === 'Member' && (
                                <div>
                                    <label style={{ display: 'block', fontSize: '13px', color: 'gray', marginBottom: '6px' }}>Branch</label>
                                    <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                        <select
                                            value={formData.branch || ''}
                                            onChange={e => handleChange('branch', e.target.value)}
                                            style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', width: '100%' }}
                                        >
                                            {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Invited By (Conditional) */}
                        {formData.status !== 'Member' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: 'gray', marginBottom: '6px' }}>Invited By</label>
                                <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <UserPlus size={16} color="gray" style={{ marginLeft: '12px' }} />
                                    <input
                                        value={formData.invited_by || ''}
                                        onChange={e => handleChange('invited_by', e.target.value)}
                                        placeholder="Inviter's name"
                                        style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px' }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Location (Globally Required) */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', color: 'gray', marginBottom: '6px' }}>Location</label>
                            <div className="input-wrapper" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <input
                                    value={formData.location || ''}
                                    onChange={e => handleChange('location', e.target.value)}
                                    placeholder="Attendee location"
                                    style={{ background: 'transparent', border: 'none', color: 'white', padding: '10px', width: '100%' }}
                                />
                            </div>
                        </div>

                    </div>

                    <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'var(--primary)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 500
                            }}
                        >
                            {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>

                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
