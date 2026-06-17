import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Users, UserCheck, UserPlus, Edit2, Trash2, Download, CheckCircle, XCircle, Sparkles, Scan, CalendarDays } from 'lucide-react'
import { toast } from 'react-hot-toast'
import EditGuestModal from './EditGuestModal'
import RegistrationChart from './RegistrationChart'
import QRScannerModal from './QRScannerModal'
import { StatsGridSkeleton, TableSkeleton } from './Skeletons'
import { formatEventDate } from '../hooks/useEvents'

import { useQuery, useMutation, usePaginatedQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export default function AdminDashboard() {
    const { searchTerm } = useOutletContext<{ searchTerm: string }>()
    
    // Convex queries
    const events = useQuery(api.events.getEvents)
    const branchesData = useQuery(api.branches.getBranches)
    
    const [selectedEventId, setSelectedEventId] = useState<string>('')
    const [branchFilter, setBranchFilter] = useState('')

    // Set active event by default
    useEffect(() => {
        if (events && !selectedEventId) {
            const activeEvent = events.find(e => e.is_active)
            if (activeEvent) {
                setSelectedEventId(activeEvent._id)
            } else if (events.length > 0) {
                setSelectedEventId(events[0]._id)
            }
        }
    }, [events, selectedEventId])

    const { results: paginatedLogs, status: paginatedStatus, loadMore } = usePaginatedQuery(
        api.attendanceLogs.getPaginatedLogs,
        { 
            event_id: selectedEventId ? (selectedEventId as Id<"events">) : undefined,
            branch: branchFilter || undefined,
            searchTerm: searchTerm || undefined
        },
        { initialNumItems: 50 }
    )

    const statsQuery = useQuery(api.attendanceLogs.getLogStats, 
        selectedEventId ? { event_id: selectedEventId as Id<"events"> } : "skip"
    )

    const toggleCheckIn = useMutation(api.attendanceLogs.toggleCheckIn)
    const deleteLog = useMutation(api.attendanceLogs.deleteLog)

    // Edit Modal State
    const [editingLog, setEditingLog] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isScannerOpen, setIsScannerOpen] = useState(false)

    // Premium UI State

    // Premium UI State
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

    // Helper for Avatar Initials
    const getInitials = (name: string) => {
        if (!name) return '?'
        const parts = name.trim().split(' ')
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        return name.substring(0, 2).toUpperCase()
    }

    const stats = useMemo(() => {
        if (!statsQuery) return { total: 0, members: 0, guests: 0, firstTimers: 0, checkedIn: 0 }
        return statsQuery
    }, [statsQuery])

    const handleDelete = async (id: string) => {
        setConfirmDeleteId(null)
        try {
            await deleteLog({ id: id as Id<"attendanceLogs"> })
            toast.success('Record deleted successfully')
        } catch (error) {
            toast.error('Failed to delete record.')
        }
    }

    const openEditModal = (log: any) => {
        setEditingLog(log)
        setIsEditModalOpen(true)
    }

    const handleCheckIn = async (id: string, currentStatus: boolean) => {
        try {
            await toggleCheckIn({ id: id as Id<"attendanceLogs">, status: !currentStatus })
            toast.success(!currentStatus ? 'Checked in successfully' : 'Check-in removed')
        } catch (error) {
            toast.error('Failed to update check-in status')
        }
    }

    const handleQRScan = async (decodedText: string) => {
        const registrationId = decodedText as Id<"attendanceLogs">
        if (!paginatedLogs) return toast.error('Logs not loaded')

        const data = paginatedLogs.find((l: any) => l._id === registrationId)

        if (!data) {
            return toast.error('Attendee not found in database')
        }

        if (data.checked_in) {
            return toast.error(`${data.full_name} is already checked in`)
        }

        await handleCheckIn(data._id, false)
        toast.success(`Check-in Successful: ${data.full_name}`, {
            icon: '✅',
            duration: 4000
        })
    }

    const selectedEvent = events?.find(e => e._id === selectedEventId)

    if (events === undefined) {
        return <StatsGridSkeleton />
    }

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
                    onChange={(e) => {
                        setSelectedEventId(e.target.value)
                    }}
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
                    {events?.map(ev => (
                        <option key={ev._id} value={ev._id}>
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
            {paginatedLogs === undefined ? (
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
                    {branchesData?.map(b => (
                        <option key={b._id} value={b.name}>{b.name}</option>
                    ))}
                </select>

                <div style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                    Showing {paginatedLogs?.length || 0} of {stats?.total || 0} records
                </div>

                <button onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                        + "Name,Phone,Email,Status,Branch,Location,Invited By,Checked In,Date\n"
                        + paginatedLogs?.map((log: any) => 
                            `"${log.full_name}","${log.phone_number}","${log.email || ''}","${log.status}","${log.branch || ''}","${log.location || ''}","${log.invited_by || ''}","${log.checked_in ? 'Yes' : 'No'}","${new Date(log._creationTime).toLocaleDateString()}"`
                        ).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `usm_attendance_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                }} className="btn-secondary" style={{
                    padding: '10px 16px', background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '10px',
                    color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500
                }}>
                    <Download size={16} /> Export CSV
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
            </div>

            {/* Data Table */}
            {paginatedLogs === undefined ? (
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
                            {paginatedLogs.length === 0 ? (
                                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                                    {searchTerm ? `No records found matching "${searchTerm}"` : 'No registrations for this event yet'}
                                </td></tr>
                            ) : (
                                paginatedLogs.filter((log: any) => {
                                    const matchSearch =
                                        log.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        log.phone_number?.includes(searchTerm) ||
                                        log.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        log.location?.toLowerCase().includes(searchTerm.toLowerCase());
                                    const matchBranch = branchFilter ? log.branch === branchFilter : true;
                                    return matchSearch && matchBranch;
                                }).map((log: any) => (
                                    <tr key={log._id}>
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
                                        <span style={{ fontWeight: 600, color: 'white', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.full_name}>{log.full_name}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${log.status.toLowerCase().replace(' ', '-')}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.branch}>{log.branch === 'N/A' ? '-' : log.branch}</td>
                                    <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.location || '-'}>{log.location || '-'}</td>
                                    <td>{log.phone_number}</td>
                                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{log.invited_by || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05, boxShadow: log.checked_in ? '0 4px 15px rgba(16, 185, 129, 0.2)' : '0 4px 15px rgba(255,255,255,0.1)' }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleCheckIn(log._id, log.checked_in)}
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
                                        {confirmDeleteId === log._id ? (
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                                <button
                                                    onClick={() => handleDelete(log._id)}
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
                                                    onClick={() => setConfirmDeleteId(log._id)}
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
            {paginatedStatus === "CanLoadMore" && (
                <div style={{ textAlign: 'center', marginTop: '20px', marginBottom: '40px' }}>
                    <button
                        onClick={() => loadMore(50)}
                        style={{
                            padding: '10px 24px',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    >
                        Load More Records
                    </button>
                </div>
            )}
            {paginatedStatus === "LoadingMore" && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                    Loading more records...
                </div>
            )}

            {isEditModalOpen && (
                <EditGuestModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    log={editingLog}
                />
            )}

            <QRScannerModal
                isOpen={isScannerOpen}
                onClose={() => setIsScannerOpen(false)}
                onScan={handleQRScan}
            />
        </motion.div>
    )
}
