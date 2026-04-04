import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserCheck, UserPlus, RefreshCw, Edit2, Trash2, Download, CheckCircle, XCircle, Sparkles, Scan, CalendarDays } from 'lucide-react'
import { toast } from 'react-hot-toast'
import EditGuestModal from './EditGuestModal'
import RegistrationChart from './RegistrationChart'
import QRScannerModal from './QRScannerModal'
import { StatsGridSkeleton, TableSkeleton } from './Skeletons'
import type { USMEvent } from '../types'
import { formatEventDate } from '../hooks/useEvents'

// Types for our data
type Log = {
    id: number
    created_at: string
    full_name: string
    phone_number: string
    status: string
    branch: string
    invited_by: string | null
    location: string | null
    checked_in: boolean
    event_id: string | null
}

type Stats = {
    total: number
    members: number
    guests: number
    firstTimers: number
    checkedIn: number
}

export default function AdminDashboard() {
    const { searchTerm } = useOutletContext<{ searchTerm: string }>()
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<Log[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, members: 0, guests: 0, firstTimers: 0, checkedIn: 0 })
    const [branchFilter, setBranchFilter] = useState('')
    const [branches, setBranches] = useState<string[]>([])

    // Event State
    const [events, setEvents] = useState<USMEvent[]>([])
    const [selectedEventId, setSelectedEventId] = useState<string>('')

    // Edit Modal State
    const [editingLog, setEditingLog] = useState<Log | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isScannerOpen, setIsScannerOpen] = useState(false)

    // Pagination State
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const ITEMS_PER_PAGE = 50

    // Premium UI State
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

    // Helper for Avatar Initials
    const getInitials = (name: string) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        return name.substring(0, 2).toUpperCase()
    }

    // Fetch events on mount and set default to active event
    useEffect(() => {
        supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false })
            .then(({ data }) => {
                if (data) {
                    const typedEvents = data as USMEvent[]
                    setEvents(typedEvents)
                    // Default to the active event
                    const activeEvent = typedEvents.find(e => e.is_active)
                    if (activeEvent) {
                        setSelectedEventId(activeEvent.id)
                    } else if (typedEvents.length > 0) {
                        setSelectedEventId(typedEvents[0].id)
                    }
                }
            })
    }, [])

    // Fetch Data for selected event
    const fetchData = async (pageNumber = 0, currentSearch = searchTerm, currentBranch = branchFilter, eventId = selectedEventId) => {
        if (!eventId) return
        if (pageNumber === 0) setLoading(true)

        // Fetch Branches for filter (only once)
        if (pageNumber === 0) {
            const { data: branchData } = await supabase.from('branches').select('name')
            if (branchData) setBranches(branchData.map(b => b.name))
        }

        // 1. Fetch Logs
        const start = pageNumber * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE - 1

        let query = supabase
            .from('attendance_logs')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false })
            .range(start, end)

        if (currentSearch) {
            query = query.or(`full_name.ilike.%${currentSearch}%,phone_number.ilike.%${currentSearch}%,branch.ilike.%${currentSearch}%,location.ilike.%${currentSearch}%`)
        }
        if (currentBranch) {
            query = query.eq('branch', currentBranch)
        }

        const { data: logsData, error: logsError } = await query

        if (logsError) {
            console.error('Error fetching logs:', logsError)
        } else {
            if (logsData) {
                if (pageNumber === 0) {
                    setLogs(logsData)
                } else {
                    setLogs(prev => [...prev, ...logsData])
                }

                if (logsData.length < ITEMS_PER_PAGE) {
                    setHasMore(false)
                } else {
                    setHasMore(true)
                }
            }
        }

        // 2. Fetch Stats (Counts) - Only on first page
        if (pageNumber === 0) {
            const { count: totalCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('event_id', eventId)
            const { count: memberCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'Member')
            const { count: guestCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'Guest')
            const { count: firstTimerCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'First Timer')
            const { count: checkedInCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('event_id', eventId).eq('checked_in', true)

            setStats({
                total: totalCount || 0,
                members: memberCount || 0,
                guests: guestCount || 0,
                firstTimers: firstTimerCount || 0,
                checkedIn: checkedInCount || 0
            })
        }

        setLoading(false)
    }

    // Re-fetch when search, filter, or event changes (debounced)
    useEffect(() => {
        if (!selectedEventId) return
        const timeout = setTimeout(() => {
            setPage(0)
            fetchData(0, searchTerm, branchFilter, selectedEventId)
        }, 300)
        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, branchFilter, selectedEventId])

    useEffect(() => {
        if (!selectedEventId) return

        // Real-time Subscription
        const channel = supabase
            .channel('public:attendance_logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
                (payload) => {
                    const newLog = payload.new as Log

                    // Only add if it matches current event
                    if (newLog.event_id !== selectedEventId) return

                    toast.success(`New Registration: ${newLog.full_name}`, {
                        id: `registration-${newLog.id}`,
                        duration: 5000,
                        icon: '🔔'
                    })

                    setLogs(prev => [newLog, ...prev])

                    setStats(prev => {
                        const isMember = newLog.status === 'Member'
                        const isFirstTimer = newLog.status === 'First Timer'
                        return {
                            total: prev.total + 1,
                            members: isMember ? prev.members + 1 : prev.members,
                            guests: (!isMember && !isFirstTimer) ? prev.guests + 1 : prev.guests,
                            firstTimers: isFirstTimer ? prev.firstTimers + 1 : prev.firstTimers,
                            checkedIn: newLog.checked_in ? prev.checkedIn + 1 : prev.checkedIn
                        }
                    })
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedEventId])

    const handleDelete = async (id: number) => {
        setConfirmDeleteId(null)

        const { error } = await supabase
            .from('attendance_logs')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Failed to delete. Check Database Permissions (RLS).')
        } else {
            toast.success('Record deleted successfully')
            setLogs(prev => prev.filter(l => l.id !== id))
        }
    }

    const openEditModal = (log: Log) => {
        setEditingLog(log)
        setIsEditModalOpen(true)
    }

    const handleCheckIn = async (id: number, currentStatus: boolean) => {
        // Optimistic UI update
        setLogs(prev => prev.map(l => l.id === id ? { ...l, checked_in: !currentStatus } : l))
        setStats(prev => ({ ...prev, checkedIn: !currentStatus ? prev.checkedIn + 1 : prev.checkedIn - 1 }))

        const { error } = await supabase
            .from('attendance_logs')
            .update({ checked_in: !currentStatus })
            .eq('id', id)

        if (error) {
            toast.error('Failed to update check-in status')
            // Revert changes
            setLogs(prev => prev.map(l => l.id === id ? { ...l, checked_in: currentStatus } : l))
            setStats(prev => ({ ...prev, checkedIn: currentStatus ? prev.checkedIn + 1 : prev.checkedIn - 1 }))
        } else {
            toast.success(!currentStatus ? 'Checked in successfully' : 'Check-in removed')
        }
    }

    const handleQRScan = async (decodedText: string) => {
        const registrationId = parseInt(decodedText)
        if (isNaN(registrationId)) return toast.error('Invalid QR Code format')

        setLoading(true)
        const { data, error } = await supabase
            .from('attendance_logs')
            .select('id, full_name, checked_in')
            .eq('id', registrationId)
            .single()

        setLoading(false)

        if (error || !data) {
            return toast.error('Attendee not found in database')
        }

        if (data.checked_in) {
            return toast.error(`${data.full_name} is already checked in`)
        }

        // Perform Check-in
        await handleCheckIn(data.id, false)
        toast.success(`Check-in Successful: ${data.full_name}`, {
            icon: '✅',
            duration: 4000
        })
    }

    const exportToCSV = () => {
        const headers = ['Time', 'Name', 'Status', 'Branch', 'Phone', 'Invited By', 'Location']
        const csvContent = [
            headers.join(','),
            ...logs.map(log => [
                new Date(log.created_at).toLocaleString(),
                `"${log.full_name || ''}"`,
                log.status,
                `"${log.branch || ''}"`,
                log.phone_number,
                `"${log.invited_by || ''}"`,
                `"${log.location || ''}"`
            ].join(','))
        ].join('\n')

        const selectedEvent = events.find(e => e.id === selectedEventId)
        const eventLabel = selectedEvent ? formatEventDate(selectedEvent.date) : 'All'

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `USM_${eventLabel}_Export_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
        toast.success('Export downloaded')
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.phone_number?.includes(searchTerm) ||
            log.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.location?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesBranch = branchFilter ? log.branch === branchFilter : true

        return matchesSearch && matchesBranch
    })

    const selectedEvent = events.find(e => e.id === selectedEventId)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Event Switcher */}
            <div style={{
                marginBottom: '28px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CalendarDays size={20} color="#a855f7" />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Viewing Event:</span>
                </div>
                <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        minWidth: '220px',
                        cursor: 'pointer'
                    }}
                >
                    {events.map(ev => (
                        <option key={ev.id} value={ev.id}>
                            {formatEventDate(ev.date)} — {ev.theme} {ev.is_active ? '(Active)' : ''}
                        </option>
                    ))}
                </select>
                {selectedEvent && (
                    <span style={{
                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                        background: selectedEvent.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.05)',
                        color: selectedEvent.is_active ? '#34d399' : 'rgba(255,255,255,0.4)',
                        border: `1px solid ${selectedEvent.is_active ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                    }}>
                        {selectedEvent.is_active ? '● Live' : 'Past Event'}
                    </span>
                )}
            </div>

            {/* Stats Row */}
            {loading && page === 0 ? (
                <StatsGridSkeleton />
            ) : (
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}><Users size={24} /></div>
                        <div>
                            <h4>Total Registered</h4>
                            <h1>{stats.total}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}><UserCheck size={24} /></div>
                        <div>
                            <h4>Members</h4>
                            <h1>{stats.members}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}><UserPlus size={24} /></div>
                        <div>
                            <h4>Guests</h4>
                            <h1>{stats.guests}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon" style={{ background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}><Sparkles size={24} /></div>
                        <div>
                            <h4>First Timers</h4>
                            <h1>{stats.firstTimers}</h1>
                        </div>
                    </div>
                    <div className="stat-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                        <div className="icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><CheckCircle size={24} /></div>
                        <div>
                            <h4 style={{ color: '#10b981' }}>Checked In</h4>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <h1 style={{ color: '#10b981', margin: 0 }}>{stats.checkedIn}</h1>
                                {stats.total > 0 && (
                                    <span style={{ color: 'rgba(16, 185, 129, 0.8)', fontSize: '14px', fontWeight: 600 }}>
                                        ({Math.round((stats.checkedIn / stats.total) * 100)}%)
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Registration Chart */}
            <RegistrationChart eventId={selectedEventId} />

            {/* Filter Bar */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    style={{
                        width: '200px',
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        color: 'white'
                    }}
                >
                    <option value="">All Branches</option>
                    {branches.map(b => (
                        <option key={b} value={b}>{b}</option>
                    ))}
                </select>

                <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    Showing {filteredLogs.length} records
                </div>

                <button
                    onClick={exportToCSV}
                    title="Export to CSV"
                    style={{
                        padding: '10px 16px', background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px',
                        color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500
                    }}
                >
                    <Download size={16} /> Export
                </button>

                <button
                    onClick={() => setIsScannerOpen(true)}
                    title="Scan Attendee Pass"
                    style={{
                        padding: '10px 16px', background: 'rgba(168, 85, 247, 0.1)',
                        border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '10px',
                        color: '#a855f7', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600
                    }}
                >
                    <Scan size={16} /> Scan Pass
                </button>

                <button className="btn-icon" onClick={() => fetchData(0, searchTerm, branchFilter, selectedEventId)} title="Refresh">
                    <RefreshCw size={18} color="white" />
                </button>
            </div>

            {/* Data Table */}
            {loading && page === 0 ? (
                <TableSkeleton />
            ) : (
                <div className="glass-table-container">
                    <table className="glass-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Name</th>
                                <th>Status</th>
                                <th>Branch</th>
                                <th>Location</th>
                                <th>Phone</th>
                                <th>Invited By</th>
                                <th style={{ textAlign: 'center' }}>Check-In</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                                    {searchTerm ? `No records found matching "${searchTerm}"` : 'No registrations for this event yet'}
                                </td></tr>
                            ) : (
                                filteredLogs.map(log => (
                                    <tr key={log.id}>
                                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                                        <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '4px' }}>
                                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div>
                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 'bold', color: 'white',
                                            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.3)'
                                        }}>
                                            {getInitials(log.full_name)}
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'white' }}>{log.full_name}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${log.status.toLowerCase().replace(' ', '-')}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td>{log.branch === 'N/A' ? '-' : log.branch}</td>
                                    <td style={{ maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.location || '-'}>{log.location || '-'}</td>
                                    <td>{log.phone_number}</td>
                                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{log.invited_by || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05, boxShadow: log.checked_in ? '0 4px 15px rgba(16, 185, 129, 0.2)' : '0 4px 15px rgba(255,255,255,0.1)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleCheckIn(log.id, log.checked_in)}
                                            style={{
                                                background: log.checked_in ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))' : 'rgba(255,255,255,0.03)',
                                                border: log.checked_in ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255,255,255,0.1)',
                                                color: log.checked_in ? '#34d399' : '#9ca3af',
                                                padding: '8px 16px',
                                                borderRadius: '24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                margin: '0 auto',
                                                transition: 'background 0.3s ease, border 0.3s ease, color 0.3s ease',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                textShadow: log.checked_in ? '0 2px 4px rgba(0,0,0,0.3)' : 'none'
                                            }}
                                        >
                                            {log.checked_in ? <CheckCircle size={16} strokeWidth={2.5} /> : <XCircle size={16} strokeWidth={2} />}
                                            {log.checked_in ? 'Checked In' : 'Pending'}
                                        </motion.button>
                                    </td>
                                    <td>
                                        {confirmDeleteId === log.id ? (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleDelete(log.id)}
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
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => openEditModal(log)}
                                                    className="btn-icon"
                                                    title="Edit"
                                                    style={{ padding: '6px', background: 'rgba(96, 165, 250, 0.1)', border: '1px solid rgba(96, 165, 250, 0.2)' }}
                                                >
                                                    <Edit2 size={16} color="#60a5fa" />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(log.id)}
                                                    className="btn-icon"
                                                    title="Delete"
                                                    style={{ padding: '6px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                                >
                                                    <Trash2 size={16} color="#ef4444" />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Load More Button */}
            {hasMore && !loading && filteredLogs.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
                    <button
                        onClick={() => {
                            const nextPage = page + 1
                            setPage(nextPage)
                            fetchData(nextPage)
                        }}
                        style={{
                            padding: '10px 24px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500
                        }}
                    >
                        Load More Records
                    </button>
                </div>
            )}

            <EditGuestModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                log={editingLog}
                onUpdate={() => fetchData(0)}
            />

            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleQRScan}
            />
        </motion.div>
    )
}
