import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useOutletContext } from 'react-router-dom' // Import context hook
import { motion } from 'framer-motion'
import { Users, UserCheck, UserPlus, RefreshCw, Edit2, Trash2, Download, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import EditGuestModal from './EditGuestModal'
import RegistrationChart from './RegistrationChart'

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
}

type Stats = {
    total: number
    members: number
    guests: number
    checkedIn: number
}

export default function AdminDashboard() {
    const { searchTerm } = useOutletContext<{ searchTerm: string }>() // Get search term from Layout
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<Log[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, members: 0, guests: 0, checkedIn: 0 })
    const [branchFilter, setBranchFilter] = useState('') // Local filter
    const [branches, setBranches] = useState<string[]>([])

    // Edit Modal State
    const [editingLog, setEditingLog] = useState<Log | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

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

    // Fetch Initial Data
    const fetchData = async (pageNumber = 0, currentSearch = searchTerm, currentBranch = branchFilter) => {
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

        // 2. Fetch Stats (Counts) - Only on first load to save resources
        if (pageNumber === 0) {
            const { count: totalCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true })
            const { count: memberCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('status', 'Member')
            const { count: guestCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).in('status', ['Guest', 'First Timer'])
            const { count: checkedInCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true }).eq('checked_in', true)

            setStats({
                total: totalCount || 0,
                members: memberCount || 0,
                guests: guestCount || 0,
                checkedIn: checkedInCount || 0
            })
        }

        setLoading(false)
    }

    // Re-fetch when search or filter changes (debounced)
    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(0)
            fetchData(0, searchTerm, branchFilter)
        }, 300)
        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, branchFilter])

    useEffect(() => {
        // Initial fetch is now handled by the filter effect above.

        // Real-time Subscription
        const channel = supabase
            .channel('public:attendance_logs')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'attendance_logs' },
                (payload) => {
                    console.log('REALTIME EVENT:', payload)
                    const newLog = payload.new as Log

                    // Toast Notification
                    toast.success(`New Registration: ${newLog.full_name}`, {
                        id: `registration-${newLog.id}`, // Prevent duplicates
                        duration: 5000,
                        icon: '🔔'
                    })

                    setLogs(prev => [newLog, ...prev])

                    setStats(prev => {
                        const isMember = newLog.status === 'Member'
                        return {
                            total: prev.total + 1,
                            members: isMember ? prev.members + 1 : prev.members,
                            guests: !isMember ? prev.guests + 1 : prev.guests,
                            checkedIn: newLog.checked_in ? prev.checkedIn + 1 : prev.checkedIn
                        }
                    })
                }
            )
            .subscribe((status) => {
                console.log('SUBSCRIPTION STATUS:', status)
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleDelete = async (id: number) => {
        setConfirmDeleteId(null) // Reset UI immediately

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

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `USM_Registration_Export_${new Date().toISOString().split('T')[0]}.csv`
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Stats Row */}
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
                <div className="stat-card" style={{ border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                    <div className="icon" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}><CheckCircle size={24} /></div>
                    <div>
                        <h4 style={{ color: '#10b981' }}>Checked In</h4>
                        <h1 style={{ color: '#10b981' }}>{stats.checkedIn}</h1>
                    </div>
                </div>
            </div>

            {/* Registration Chart */}
            <RegistrationChart />

            {/* Filter Bar */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
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

                <button className="btn-icon" onClick={() => fetchData(0, searchTerm, branchFilter)} title="Refresh">
                    <RefreshCw size={18} color="white" />
                </button>
            </div>

            {/* Data Table */}
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
                        {loading && page === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>No records found matching "{searchTerm}"</td></tr>
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
        </motion.div>
    )
}
