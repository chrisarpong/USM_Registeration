import { useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardList, Filter, CalendarDays, Search, MapPin, User, Activity } from 'lucide-react'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"

export default function AdminLogs() {
    const [searchTerm, setSearchTerm] = useState('')
    const [actionFilter, setActionFilter] = useState('All')
    const [dateFilter, setDateFilter] = useState('')

    const logs = useQuery(api.auditLogs.getLogs)

    if (logs === undefined) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', color: 'var(--text-secondary)' }}>
                <div className="spinner" style={{ marginRight: '10px', width: '20px', height: '20px', border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                Loading logs...
            </div>
        )
    }

    let filteredLogs = [...logs]

    if (searchTerm) {
        const lower = searchTerm.toLowerCase()
        filteredLogs = filteredLogs.filter(l => 
            l.adminName.toLowerCase().includes(lower) || 
            l.details.toLowerCase().includes(lower) ||
            l.ipAddress.toLowerCase().includes(lower)
        )
    }

    if (actionFilter !== 'All') {
        filteredLogs = filteredLogs.filter(l => l.action === actionFilter)
    }

    if (dateFilter) {
        const selectedDate = new Date(dateFilter).toDateString()
        filteredLogs = filteredLogs.filter(l => new Date(l._creationTime).toDateString() === selectedDate)
    }

    const getActionColor = (action: string) => {
        if (action === 'LOGIN') return 'var(--primary)'
        if (action.includes('CREATE') || action.includes('REGISTER')) return 'var(--success)'
        if (action.includes('DELETE')) return '#ef4444' // red
        if (action.includes('UPDATE') || action.includes('ACTIVATE') || action.includes('TOGGLE')) return '#eab308' // yellow
        return 'var(--text-secondary)'
    }

    // Extract unique actions for the filter dropdown
    const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort()

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}
        >
            <div className="registration-container" style={{ display: 'block', minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                <div className="form-panel" style={{ border: 'none', background: 'transparent' }}>
                    
                    <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={24} color="var(--primary)" /> Activity Logs
                    </h2>
                    <p className="form-subtitle">Monitor administrative actions, logins, and IP addresses securely.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '32px', marginBottom: '24px' }}>
                        {/* Search Filter */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <div className="glass-input-wrapper">
                                <Search size={18} className="input-icon" />
                                <input 
                                    className="glass-input" 
                                    type="text" 
                                    placeholder="Search by Admin, IP Address, or details..."
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>

                        {/* Action Filter */}
                        <div className="form-group">
                            <label className="glass-label">Action Type</label>
                            <div className="glass-input-wrapper">
                                <Filter size={18} className="input-icon" />
                                <select className="glass-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
                                    <option value="All">All Actions</option>
                                    {uniqueActions.map(action => (
                                        <option key={action} value={action}>{action.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="form-group">
                            <label className="glass-label">Date</label>
                            <div className="glass-input-wrapper">
                                <CalendarDays size={18} className="input-icon" />
                                <input 
                                    className="glass-input" 
                                    type="date" 
                                    value={dateFilter} 
                                    onChange={(e) => setDateFilter(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Logs Table */}
                    <div className="glass-table-container">
                        {filteredLogs.length > 0 ? (
                            <table className="glass-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Admin</th>
                                        <th>Action</th>
                                        <th>Details</th>
                                        <th>IP Address</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredLogs.map(row => (
                                        <tr key={row._id}>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                                                {new Date(row._creationTime).toLocaleString()}
                                            </td>
                                            <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <User size={14} style={{ color: 'var(--text-muted)' }}/>
                                                    {row.adminName}
                                                </div>
                                            </td>
                                            <td>
                                                <span style={{ 
                                                    padding: '4px 10px', 
                                                    background: 'var(--bg-surface)', 
                                                    border: `1px solid ${getActionColor(row.action)}`,
                                                    color: getActionColor(row.action),
                                                    borderRadius: '20px',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {row.action}
                                                </span>
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '14px', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.details}>
                                                {row.details}
                                            </td>
                                            <td style={{ color: 'var(--text-secondary)', fontSize: '13px', fontFamily: 'monospace' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <MapPin size={12} style={{ color: 'var(--text-muted)' }}/>
                                                    {row.ipAddress}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <ClipboardList size={40} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
                                <p>No logs found matching your filters.</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </motion.div>
    )
}
