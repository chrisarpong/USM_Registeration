import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useOutletContext } from 'react-router-dom' // Import context hook
import { motion } from 'framer-motion'
import { Users, UserCheck, UserPlus, RefreshCw, Edit2, Trash2 } from 'lucide-react'
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
}

type Stats = {
    total: number
    members: number
    guests: number
}

export default function AdminDashboard() {
    const { searchTerm } = useOutletContext<{ searchTerm: string }>() // Get search term from Layout
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<Log[]>([])
    const [stats, setStats] = useState<Stats>({ total: 0, members: 0, guests: 0 })
    const [branchFilter, setBranchFilter] = useState('') // Local filter
    const [branches, setBranches] = useState<string[]>([])

    // Edit Modal State
    const [editingLog, setEditingLog] = useState<Log | null>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    // Pagination State
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const ITEMS_PER_PAGE = 50

    // Fetch Initial Data
    const fetchData = async (pageNumber = 0) => {
        if (pageNumber === 0) setLoading(true)

        // Fetch Branches for filter (only once)
        if (pageNumber === 0) {
            const { data: branchData } = await supabase.from('branches').select('name')
            if (branchData) setBranches(branchData.map(b => b.name))
        }

        // 1. Fetch Logs
        const start = pageNumber * ITEMS_PER_PAGE
        const end = start + ITEMS_PER_PAGE - 1

        const { data: logsData, error: logsError } = await supabase
            .from('attendance_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .range(start, end)

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

            setStats({
                total: totalCount || 0,
                members: memberCount || 0,
                guests: guestCount || 0
            })
        }

        setLoading(false)
    }

    useEffect(() => {
        fetchData(0)

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
                            guests: !isMember ? prev.guests + 1 : prev.guests
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
        if (!confirm('Are you sure you want to delete this record?')) return

        const { error } = await supabase
            .from('attendance_logs')
            .delete()
            .eq('id', id)

        if (error) {
            toast.error('Failed to delete')
        } else {
            toast.success('Record deleted')
            setLogs(prev => prev.filter(l => l.id !== id))
            // Update stats vaguely or refetch
            fetchData(0)
        }
    }

    const openEditModal = (log: Log) => {
        setEditingLog(log)
        setIsEditModalOpen(true)
    }

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.phone_number?.includes(searchTerm) ||
            log.branch?.toLowerCase().includes(searchTerm.toLowerCase())

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

                <button className="btn-icon" onClick={() => fetchData(0)} title="Refresh">
                    <RefreshCw size={18} color="white" />
                </button>
            </div>

            {/* Data Table */}
            <div className="glass-table-container">
                <table className="glass-table">
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Name</th>
                            <th>Status</th>
                            <th>Branch</th>
                            <th>Phone</th>
                            <th>Invited By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && page === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No records found matching "{searchTerm}"</td></tr>
                        ) : (
                            filteredLogs.map(log => (
                                <tr key={log.id}>
                                    <td style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ fontWeight: 600, color: 'white' }}>{log.full_name}</td>
                                    <td>
                                        <span className={`status-badge ${log.status.toLowerCase().replace(' ', '-')}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td>{log.branch}</td>
                                    <td>{log.phone_number}</td>
                                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{log.invited_by || '-'}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => openEditModal(log)}
                                                className="btn-icon"
                                                title="Edit"
                                                style={{ padding: '6px' }}
                                            >
                                                <Edit2 size={16} color="#60a5fa" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(log.id)}
                                                className="btn-icon"
                                                title="Delete"
                                                style={{ padding: '6px' }}
                                            >
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        </div>
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
