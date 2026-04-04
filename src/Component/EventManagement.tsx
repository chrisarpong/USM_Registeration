import { useState, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { useAllEvents, formatEventDate } from '../hooks/useEvents'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import type { USMEvent } from '../types'
import {
    CalendarDays,
    Plus,
    Power,
    PowerOff,
    Trash2,
    Edit2,
    X,
    Save,
    MapPin,
    ToggleRight,
    Users,
    CheckCircle,
    Upload,
    Loader2,
    Link as LinkIcon,
    Copy,
    Sparkles,
    Image,
    FileText,
    ToggleLeft,
    Clock
} from 'lucide-react'

type EventFormData = {
    title: string
    date: string
    time: string
    theme: string
    venue: string
    venue_address: string
    map_query: string
    description: string
    flyer_url: string
    is_registration_open: boolean
}

const DEFAULT_FORM: EventFormData = {
    title: 'Unending Spirit Meeting',
    date: '',
    time: '10:00 AM',
    theme: '',
    venue: '3rd floor ORA black star building, Opposite Ofankor Shell filling station',
    venue_address: 'Ofankor, Accra',
    map_query: 'Chatime+Ghana+Ofankor',
    description: 'The Unending Spirit meeting returns. Get ready🔥',
    flyer_url: '/USM.jpeg',
    is_registration_open: true,
}

export default function EventManagement() {
    const { events, loading, refetch } = useAllEvents()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<USMEvent | null>(null)
    const [formData, setFormData] = useState<EventFormData>(DEFAULT_FORM)
    const [saving, setSaving] = useState(false)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [showUrlInput, setShowUrlInput] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFlyerUpload = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file (JPG, PNG, etc.)')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB')
            return
        }

        setUploading(true)
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const fileName = `usm-flyer-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from('event-flyers')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            toast.error('Failed to upload image: ' + uploadError.message)
            setUploading(false)
            return
        }

        const { data: urlData } = supabase.storage
            .from('event-flyers')
            .getPublicUrl(fileName)

        setFormData(prev => ({ ...prev, flyer_url: urlData.publicUrl }))
        toast.success('Flyer uploaded successfully!')
        setUploading(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(false)
        const file = e.dataTransfer.files?.[0]
        if (file) handleFlyerUpload(file)
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = () => {
        setDragActive(false)
    }

    const openCreateModal = () => {
        setEditingEvent(null)
        setFormData(DEFAULT_FORM)
        setIsModalOpen(true)
    }

    const openEditModal = (event: USMEvent) => {
        setEditingEvent(event)
        setFormData({
            title: event.title,
            date: event.date,
            time: event.time,
            theme: event.theme,
            venue: event.venue,
            venue_address: event.venue_address || '',
            map_query: event.map_query || '',
            description: event.description || '',
            flyer_url: event.flyer_url || '',
            is_registration_open: event.is_registration_open,
        })
        setIsModalOpen(true)
    }

    const handleDuplicate = (event: USMEvent) => {
        setEditingEvent(null)
        setFormData({
            title: event.title,
            date: '', 
            time: event.time,
            theme: '', 
            venue: event.venue,
            venue_address: event.venue_address || '',
            map_query: event.map_query || '',
            description: event.description || '',
            flyer_url: event.flyer_url || '',
            is_registration_open: true,
        })
        setIsModalOpen(true)
        toast.success('Event duplicated. Please set a new Date and Theme.')
    }

    const handleSave = async () => {
        if (!formData.date) return toast.error('Please set a date')
        if (!formData.theme) return toast.error('Please set a theme')
        if (!formData.venue) return toast.error('Please set a venue')

        setSaving(true)

        if (editingEvent) {
            // Update existing
            const { error } = await supabase
                .from('events')
                .update({
                    title: formData.title,
                    date: formData.date,
                    time: formData.time,
                    theme: formData.theme,
                    venue: formData.venue,
                    venue_address: formData.venue_address || null,
                    map_query: formData.map_query || null,
                    description: formData.description || null,
                    flyer_url: formData.flyer_url || null,
                    is_registration_open: formData.is_registration_open,
                })
                .eq('id', editingEvent.id)

            if (error) {
                toast.error('Failed to update event: ' + error.message)
            } else {
                toast.success('Event updated successfully')
                setIsModalOpen(false)
                refetch()
            }
        } else {
            // Create new
            const { error } = await supabase
                .from('events')
                .insert({
                    title: formData.title,
                    date: formData.date,
                    time: formData.time,
                    theme: formData.theme,
                    venue: formData.venue,
                    venue_address: formData.venue_address || null,
                    map_query: formData.map_query || null,
                    description: formData.description || null,
                    flyer_url: formData.flyer_url || null,
                    is_active: false,
                    is_registration_open: formData.is_registration_open,
                })

            if (error) {
                toast.error('Failed to create event: ' + error.message)
            } else {
                toast.success('Event created! Activate it when ready.')
                setIsModalOpen(false)
                refetch()
            }
        }
        setSaving(false)
    }

    const handleActivate = async (eventId: string) => {
        // Deactivate all currently active events first
        const { error: deactivateError } = await supabase
            .from('events')
            .update({ is_active: false })
            .eq('is_active', true)

        if (deactivateError) {
            toast.error('Failed to deactivate events: ' + deactivateError.message)
            return
        }

        // Now activate the selected one
        const { error } = await supabase
            .from('events')
            .update({ is_active: true })
            .eq('id', eventId)

        if (error) {
            toast.error('Failed to activate event: ' + error.message)
        } else {
            toast.success('Event activated! Public registration now shows this event.')
            refetch()
        }
    }

    const handleDeactivate = async (eventId: string) => {
        const { error } = await supabase
            .from('events')
            .update({ is_active: false })
            .eq('id', eventId)

        if (error) {
            toast.error('Failed to deactivate event')
        } else {
            toast.success('Event deactivated')
            refetch()
        }
    }

    const handleToggleRegistration = async (eventId: string, currentState: boolean) => {
        const { error } = await supabase
            .from('events')
            .update({ is_registration_open: !currentState })
            .eq('id', eventId)

        if (error) {
            toast.error('Failed to toggle registration')
        } else {
            toast.success(!currentState ? 'Registration opened' : 'Registration closed')
            refetch()
        }
    }

    const handleDelete = async (eventId: string) => {
        setConfirmDeleteId(null)
        const { error } = await supabase
            .from('events')
            .delete()
            .eq('id', eventId)

        if (error) {
            toast.error('Failed to delete event. It may have registrations linked to it.')
        } else {
            toast.success('Event deleted')
            refetch()
        }
    }

    const getEventStatus = (event: USMEvent) => {
        const eventDate = new Date(event.date + 'T23:59:59')
        const now = new Date()
        if (event.is_active) return 'active'
        if (eventDate < now) return 'past'
        return 'upcoming'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif', marginBottom: '4px' }}>
                        Event Management
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                        Create, edit, and activate USM events. Only one event can be active at a time.
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openCreateModal}
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #5b21b6 100%)',
                        border: 'none',
                        borderRadius: '12px',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 600,
                        fontSize: '14px',
                        boxShadow: '0 8px 24px rgba(124, 93, 250, 0.3)'
                    }}
                >
                    <Plus size={18} /> New Event
                </motion.button>
            </div>

            {/* Events Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>Loading events...</div>
            ) : events.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '80px 40px',
                    background: 'rgba(255,255,255,0.03)', borderRadius: '16px',
                    border: '1px dashed rgba(255,255,255,0.1)'
                }}>
                    <CalendarDays size={48} color="rgba(255,255,255,0.2)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>No events yet</h3>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Create your first USM event to get started.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {events.map(event => {
                        const status = getEventStatus(event)
                        return (
                            <motion.div
                                key={event.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="event-card"
                                style={{
                                    background: status === 'active'
                                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(16, 185, 129, 0.02))'
                                        : 'rgba(20, 20, 35, 0.3)',
                                    border: status === 'active'
                                        ? '1px solid rgba(16, 185, 129, 0.3)'
                                        : '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '16px',
                                    padding: '24px',
                                    backdropFilter: 'blur(12px)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                                    {/* Event Info */}
                                    <div style={{ flex: 1, minWidth: '280px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'white', margin: 0, fontFamily: 'Outfit, sans-serif' }}>
                                                {formatEventDate(event.date)}
                                            </h3>

                                            {/* Status badge */}
                                            {status === 'active' && (
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                                                    background: 'rgba(16, 185, 129, 0.2)', color: '#34d399',
                                                    border: '1px solid rgba(16, 185, 129, 0.3)',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    ● ACTIVE
                                                </span>
                                            )}
                                            {status === 'past' && (
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    PAST
                                                </span>
                                            )}
                                            {status === 'upcoming' && (
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                    background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    UPCOMING
                                                </span>
                                            )}

                                            {/* Registration status */}
                                            <span style={{
                                                padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                background: event.is_registration_open ? 'rgba(168, 85, 247, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                                                color: event.is_registration_open ? '#a855f7' : '#f87171',
                                                border: `1px solid ${event.is_registration_open ? 'rgba(168, 85, 247, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                                textTransform: 'uppercase', letterSpacing: '0.5px'
                                            }}>
                                                {event.is_registration_open ? 'REG OPEN' : 'REG CLOSED'}
                                            </span>
                                        </div>

                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Sparkles size={14} color="#a855f7" />
                                                <span>{event.theme}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Clock size={14} />
                                                <span>{event.time}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <MapPin size={14} />
                                                <span style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {event.venue}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                        {/* Activate / Deactivate */}
                                        {event.is_active ? (
                                            <button
                                                onClick={() => handleDeactivate(event.id)}
                                                title="Deactivate"
                                                style={{
                                                    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                                                    background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px',
                                                    fontSize: '12px', fontWeight: 600
                                                }}
                                            >
                                                <PowerOff size={14} /> Deactivate
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(event.id)}
                                                title="Set as Active Event"
                                                style={{
                                                    padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                                                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                                    color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px',
                                                    fontSize: '12px', fontWeight: 600
                                                }}
                                            >
                                                <Power size={14} /> Activate
                                            </button>
                                        )}

                                        {/* Toggle Registration */}
                                        <button
                                            onClick={() => handleToggleRegistration(event.id, event.is_registration_open)}
                                            title={event.is_registration_open ? 'Close Registration' : 'Open Registration'}
                                            style={{
                                                padding: '8px 16px', borderRadius: '10px', cursor: 'pointer',
                                                background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)',
                                                color: '#a855f7', display: 'flex', alignItems: 'center', gap: '6px',
                                                fontSize: '12px', fontWeight: 600
                                            }}
                                        >
                                            {event.is_registration_open ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                            {event.is_registration_open ? 'Close Reg' : 'Open Reg'}
                                        </button>

                                        {/* Edit */}
                                        <button
                                            onClick={() => openEditModal(event)}
                                            className="btn-icon"
                                            title="Edit"
                                            style={{ padding: '8px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.2)' }}
                                        >
                                            <Edit2 size={16} color="#60a5fa" />
                                        </button>

                                        {/* Duplicate */}
                                        <button
                                            onClick={() => handleDuplicate(event)}
                                            className="btn-icon"
                                            title="Duplicate Event"
                                            style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}
                                        >
                                            <Copy size={16} color="#fbbf24" />
                                        </button>

                                        {/* Delete */}
                                        {confirmDeleteId === event.id ? (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button
                                                    onClick={() => handleDelete(event.id)}
                                                    style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setConfirmDeleteId(event.id)}
                                                className="btn-icon"
                                                title="Delete"
                                                style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            style={{
                                width: '100%', maxWidth: '600px',
                                background: 'rgba(30, 30, 45, 0.98)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '20px', padding: '32px',
                                maxHeight: '85vh', overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'white', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                                    {editingEvent ? 'Edit Event' : 'Create New Event'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'grid', gap: '20px' }}>
                                {/* Title */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label><FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Title</label>
                                    <input
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Unending Spirit Meeting"
                                        style={{ paddingLeft: '14px' }}
                                    />
                                </div>

                                {/* Date & Time */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label><CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Date</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                            style={{ paddingLeft: '14px' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label><Clock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Time</label>
                                        <input
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                            placeholder="10:00 AM"
                                            style={{ paddingLeft: '14px' }}
                                        />
                                    </div>
                                </div>

                                {/* Theme */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label><Sparkles size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Theme</label>
                                    <input
                                        value={formData.theme}
                                        onChange={e => setFormData({ ...formData, theme: e.target.value })}
                                        placeholder="e.g., Walking in the Spirit"
                                        style={{ paddingLeft: '14px' }}
                                    />
                                </div>

                                {/* Venue */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label><MapPin size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Venue</label>
                                    <input
                                        value={formData.venue}
                                        onChange={e => setFormData({ ...formData, venue: e.target.value })}
                                        placeholder="Full venue address"
                                        style={{ paddingLeft: '14px' }}
                                    />
                                </div>

                                {/* Venue Address (Short) & Map Query */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Short Address</label>
                                        <input
                                            value={formData.venue_address}
                                            onChange={e => setFormData({ ...formData, venue_address: e.target.value })}
                                            placeholder="Ofankor, Accra"
                                            style={{ paddingLeft: '14px' }}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label>Map Search Query</label>
                                        <input
                                            value={formData.map_query}
                                            onChange={e => setFormData({ ...formData, map_query: e.target.value })}
                                            placeholder="Chatime+Ghana+Ofankor"
                                            style={{ paddingLeft: '14px' }}
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label><FileText size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Description / Tagline</label>
                                    <input
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Inspiring tagline for this event..."
                                        style={{ paddingLeft: '14px' }}
                                    />
                                </div>

                                {/* Flyer Image Upload */}
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label><Image size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Event Flyer</label>

                                    {/* Current Preview */}
                                    {formData.flyer_url && (
                                        <div style={{ marginBottom: '12px', position: 'relative', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img
                                                src={formData.flyer_url}
                                                alt="Current flyer"
                                                style={{
                                                    width: '100%', height: '160px', objectFit: 'cover',
                                                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'block'
                                                }}
                                                onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, flyer_url: '' })}
                                                style={{
                                                    position: 'absolute', top: '8px', right: '8px',
                                                    background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%',
                                                    padding: '6px', cursor: 'pointer', color: 'white',
                                                    backdropFilter: 'blur(4px)'
                                                }}
                                                title="Remove image"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Upload Zone */}
                                    {!formData.flyer_url && (
                                        <div
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onClick={() => !uploading && fileInputRef.current?.click()}
                                            style={{
                                                border: `2px dashed ${dragActive ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                                                borderRadius: '12px',
                                                padding: '32px 20px',
                                                textAlign: 'center',
                                                cursor: uploading ? 'wait' : 'pointer',
                                                background: dragActive ? 'rgba(124, 93, 250, 0.08)' : 'rgba(255,255,255,0.02)',
                                                transition: 'all 0.3s ease',
                                            }}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0]
                                                    if (file) handleFlyerUpload(file)
                                                    e.target.value = ''
                                                }}
                                            />

                                            {uploading ? (
                                                <div>
                                                    <Loader2 size={32} color="var(--primary)" style={{ animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                                                    <p style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600, margin: 0 }}>Uploading flyer...</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <Upload size={32} color="rgba(255,255,255,0.3)" style={{ marginBottom: '12px' }} />
                                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: 500, margin: '0 0 4px 0' }}>
                                                        Click to browse or drag & drop
                                                    </p>
                                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: 0 }}>
                                                        JPG, PNG up to 5MB
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Toggle to URL input */}
                                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowUrlInput(!showUrlInput)}
                                            style={{
                                                background: 'none', border: 'none', cursor: 'pointer',
                                                color: 'rgba(255,255,255,0.35)', fontSize: '12px',
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                padding: '4px 0'
                                            }}
                                        >
                                            <LinkIcon size={12} />
                                            {showUrlInput ? 'Hide URL input' : 'Or paste image URL'}
                                        </button>
                                    </div>

                                    {/* URL Fallback (collapsible) */}
                                    {showUrlInput && (
                                        <input
                                            value={formData.flyer_url}
                                            onChange={e => setFormData({ ...formData, flyer_url: e.target.value })}
                                            placeholder="https://... or /USM.jpeg"
                                            style={{ paddingLeft: '14px', marginTop: '6px' }}
                                        />
                                    )}
                                </div>

                                {/* Registration Toggle */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <Users size={18} color="rgba(255,255,255,0.6)" />
                                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 500 }}>Registration Open</span>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, is_registration_open: !formData.is_registration_open })}
                                        style={{
                                            background: formData.is_registration_open ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                            border: `1px solid ${formData.is_registration_open ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                            color: formData.is_registration_open ? '#34d399' : 'rgba(255,255,255,0.4)',
                                            padding: '6px 16px', borderRadius: '20px', cursor: 'pointer',
                                            fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                                        }}
                                    >
                                        {formData.is_registration_open ? <><CheckCircle size={14} /> Yes</> : <><X size={14} /> No</>}
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '28px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    style={{
                                        padding: '12px 24px', borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 500
                                    }}
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '12px 28px', borderRadius: '10px', border: 'none',
                                        background: 'linear-gradient(135deg, var(--primary) 0%, #5b21b6 100%)',
                                        color: 'white', cursor: 'pointer', fontWeight: 600,
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        boxShadow: '0 8px 24px rgba(124, 93, 250, 0.3)'
                                    }}
                                >
                                    {saving ? 'Saving...' : <><Save size={16} /> {editingEvent ? 'Save Changes' : 'Create Event'}</>}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
