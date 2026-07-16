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
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Viewing Event:</span>
                </div>
                <select
                    value={selectedEventId}
                    onChange={(e) => {
                        setSelectedEventId(e.target.value)
                    }}
                    style={{
                        padding: '10px 16px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        fontWeight: 500,
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
                        padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: 500,
                        background: selectedEvent.is_active ? 'var(--success-bg)' : 'var(--bg-subtle)',
                        color: selectedEvent.is_active ? 'var(--success)' : 'var(--text-secondary)',
                        border: `1px solid ${selectedEvent.is_active ? 'var(--success-border)' : 'var(--border)'}`,
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
                        <div className="icon"><Users size={24} color="var(--primary)" /></div>
                        <div>
                            <h4>Total Registered</h4>
                            <h1>{stats.total}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon"><UserCheck size={24} color="var(--success)" /></div>
                        <div>
                            <h4>Members</h4>
                            <h1>{stats.members}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon"><UserPlus size={24} color="#eab308" /></div>
                        <div>
                            <h4>Guests</h4>
                            <h1>{stats.guests}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon"><Sparkles size={24} color="var(--text-secondary)" /></div>
                        <div>
                            <h4>First Timers</h4>
                            <h1>{stats.firstTimers}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="icon"><CheckCircle size={24} color="var(--success)" /></div>
                        <div>
                            <h4 style={{ color: '#10b981' }}>Checked In</h4>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                <h1 style={{ color: '#10b981', margin: 0 }}>{stats.checkedIn}</h1>
                                {stats.total > 0 && (
                                    <span style={{ color: 'var(--success)', fontSize: '14px', fontWeight: 600 }}>
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
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        color: 'var(--text-primary)'
                    }}
                >
                    <option value="">All Branches</option>
                    {branchesData?.map(b => (
                        <option key={b._id} value={b.name}>{b.name}</option>
                    ))}
                </select>

                <div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Showing {paginatedLogs?.length || 0} of {stats?.total || 0} records
                </div>

                <button onClick={() => {
                    const csvContent = "data:text/csv;charset=utf-8," 
                        + "Name,Phone,Email,Status,Branch,Location,Invited By,Heard From,Checked In,Date\n"
                        + paginatedLogs?.map((log: any) => 
                            `"${log.full_name}","${log.phone_number}","${log.email || ''}","${log.status}","${log.branch || ''}","${log.location || ''}","${log.invited_by || ''}","${log.heard_from || ''}","${log.checked_in ? 'Yes' : 'No'}","${new Date(log._creationTime).toLocaleDateString()}"`
                        ).join("\n");
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", `usm_attendance_${new Date().toISOString().split('T')[0]}.csv`);
                    document.body.appendChild(link);
                    link.click();
                }} className="btn-secondary" style={{
                    padding: '10px 16px', background: 'var(--primary-bg)',
                    border: '1px solid var(--border)', borderRadius: '10px',
                    color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500
                }}>
                    <Download size={16} /> Export CSV
                </button>

                <button
                    onClick={() => setIsScannerOpen(true)}
                    title="Scan Attendee Pass"
                    style={{
                        padding: '10px 16px', background: 'var(--primary-bg)',
                        border: '1px solid var(--border)', borderRadius: '10px',
                        color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600
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
                                <th>Heard From</th>
                                <th style={{ textAlign: 'center' }}>Check-In</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedLogs.length === 0 ? (
                                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px' }}>
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
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                            {new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </div>
                                        <div>
                                            {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: 'var(--primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 'bold', color: 'white'
                                        }}>
                                            {getInitials(log.full_name)}
                                        </div>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.full_name}>{log.full_name}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${log.status.toLowerCase().replace(' ', '-')}`}>
                                            {log.status}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.branch}>{log.branch === 'N/A' ? '-' : log.branch}</td>
                                    <td style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.location || '-'}>{log.location || '-'}</td>
                                    <td>{log.phone_number}</td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{log.invited_by || '-'}</td>
                                    <td style={{ color: 'var(--text-secondary)', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={log.heard_from || '-'}>{log.heard_from || '-'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleCheckIn(log._id, log.checked_in)}
                                            style={{
                                                background: log.checked_in ? 'var(--success-bg)' : 'var(--bg-subtle)',
                                                border: log.checked_in ? '1px solid var(--success-border)' : '1px solid var(--border)',
                                                color: log.checked_in ? 'var(--success)' : 'var(--text-secondary)',
                                                padding: '8px 16px',
                                                borderRadius: 'var(--radius-xl)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                margin: '0 auto',
                                                transition: 'all 0.2s ease',
                                                fontSize: '13px',
                                                fontWeight: 500
                                            }}
                                        >
                                            {log.checked_in ? <CheckCircle size={16} strokeWidth={2.5} /> : <XCircle size={16} strokeWidth={2} />}
                                            {log.checked_in ? 'Checked In' : 'Pending'}
                                        </button>
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
                                                    style={{ padding: '6px 12px', background: 'var(--bg-subtle)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
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
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteId(log._id)}
                                                    className="btn-icon"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
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
                            background: 'var(--bg-subtle)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: 500,
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    >
                        Load More Records
                    </button>
                </div>
            )}
            {paginatedStatus === "LoadingMore" && (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
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
