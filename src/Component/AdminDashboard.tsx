import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useOutletContext } from 'react-router-dom' // Import context hook
import { motion } from 'framer-motion'
import { Users, UserCheck, UserPlus, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'

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

    // Fetch Initial Data
    const fetchData = async () => {
        setLoading(true)

        // Fetch Branches for filter
        const { data: branchData } = await supabase.from('branches').select('name')
        if (branchData) setBranches(branchData.map(b => b.name))

        // 1. Fetch Logs (Last 100)
        const { data: logsData, error: logsError } = await supabase
            .from('attendance_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100)

        if (logsError) console.error('Error fetching logs:', logsError)
        else setLogs(logsData || [])

        // 2. Fetch Stats (Counts)
        // Get all logs count
        const { count: totalCount } = await supabase.from('attendance_logs').select('*', { count: 'exact', head: true })

        const { count: memberCount } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Member')

        const { count: guestCount } = await supabase
            .from('attendance_logs')
            .select('*', { count: 'exact', head: true })
            .in('status', ['Guest', 'First Timer']) // Count both as Guests

        setStats({
            total: totalCount || 0,
            members: memberCount || 0,
            guests: guestCount || 0
        })

        setLoading(false)
    }

    useEffect(() => {
        fetchData()

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
                if (status === 'SUBSCRIBED') {
                    // console.log('Subscribed to realtime events')
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

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

                <button className="btn-icon" onClick={fetchData} title="Refresh">
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
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>Loading...</td></tr>
                        ) : filteredLogs.length === 0 ? (
                            <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>No records found matching "{searchTerm}"</td></tr>
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    )
}
