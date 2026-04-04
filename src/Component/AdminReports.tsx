import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, Calendar, Filter, CalendarDays } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { USMEvent } from '../types'
import { formatEventDate } from '../hooks/useEvents'

export default function AdminReports() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [eventFilter, setEventFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [generated, setGenerated] = useState(false)
    const [events, setEvents] = useState<USMEvent[]>([])

    // Fetch events on mount
    useEffect(() => {
        supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false })
            .then(({ data }) => {
                if (data) {
                    const typedEvents = data as USMEvent[]
                    setEvents(typedEvents)
                    // Default to active event
                    const active = typedEvents.find(e => e.is_active)
                    if (active) setEventFilter(active.id)
                }
            })
    }, [])

    const generateReport = async () => {
        setLoading(true)
        setGenerated(false)

        let query = supabase
            .from('attendance_logs')
            .select('*')
            .order('created_at', { ascending: false })

        // Event filter
        if (eventFilter) {
            query = query.eq('event_id', eventFilter)
        }

        if (startDate) query = query.gte('created_at', startDate)
        if (endDate) query = query.lte('created_at', endDate + 'T23:59:59')

        if (statusFilter !== 'All') {
            if (statusFilter === 'Members') query = query.eq('status', 'Member')
            if (statusFilter === 'Guests') query = query.eq('status', 'Guest')
            if (statusFilter === 'First Timers') query = query.eq('status', 'First Timer')
        }

        const { data, error } = await query

        if (error) {
            toast.error('Error generating report: ' + error.message)
        } else {
            setReportData(data || [])
            setGenerated(true)
            toast.success('Report generated successfully')
        }
        setLoading(false)
    }

    const downloadCSV = () => {
        if (reportData.length === 0) {
            toast.error('No data to export')
            return
        }

        const headers = ['Time', 'Full Name', 'Phone', 'Status', 'Branch', 'Location', 'Invited By']

        const rows = reportData.map(row => {
            return [
                new Date(row.created_at).toLocaleString(),
                `"${row.full_name}"`,
                `"${row.phone_number}"`,
                row.status,
                row.branch,
                row.location || '',
                row.invited_by || ''
            ].join(',')
        })

        const csvContent = [headers.join(','), ...rows].join('\n')

        const selectedEvent = events.find(e => e.id === eventFilter)
        const eventLabel = selectedEvent ? formatEventDate(selectedEvent.date) : 'All_Events'

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', `USM_${eventLabel}_report_${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '800px', margin: '0 auto' }}
        >
            <div className="registration-container" style={{ display: 'block', minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                <div className="form-panel" style={{ border: 'none', background: 'transparent', padding: '40px' }}>

                    <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'white' }}>Generate Reports</h2>
                    <p className="form-subtitle">Select event, date range, and filters to export attendance data.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '32px' }}>

                        {/* Event Filter */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label><CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Event</label>
                            <div className="input-wrapper">
                                <CalendarDays size={18} className="input-icon" />
                                <select
                                    value={eventFilter}
                                    onChange={(e) => setEventFilter(e.target.value)}
                                >
                                    <option value="">All Events</option>
                                    {events.map(ev => (
                                        <option key={ev.id} value={ev.id}>
                                            {formatEventDate(ev.date)} — {ev.theme} {ev.is_active ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date Filters */}
                        <div className="form-group">
                            <label>Start Date</label>
                            <div className="input-wrapper">
                                <Calendar size={18} className="input-icon" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>End Date</label>
                            <div className="input-wrapper">
                                <Calendar size={18} className="input-icon" />
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="form-group">
                            <label>Filter By Type</label>
                            <div className="input-wrapper">
                                <Filter size={18} className="input-icon" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="All">All Attendees</option>
                                    <option value="Members">Members Only</option>
                                    <option value="Guests">Guests Only</option>
                                    <option value="First Timers">First Timers Only</option>
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button
                                className="btn-submit"
                                style={{ margin: 0, height: '52px' }}
                                onClick={generateReport}
                                disabled={loading}
                            >
                                {loading ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    </div>

                    {/* Results Preview */}
                    <AnimatePresence>
                        {generated && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', color: 'white' }}>Report Ready</h3>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Found {reportData.length} records matching your criteria.</p>
                                    </div>
                                    <button
                                        onClick={downloadCSV}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            padding: '12px 24px',
                                            borderRadius: '10px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <FileDown size={20} />
                                        Download CSV
                                    </button>
                                </div>

                                {/* Mini Preview Table (First 5) */}
                                {reportData.length > 0 && (
                                    <div className="glass-table-container">
                                        <table className="glass-table">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Name</th>
                                                    <th>Status</th>
                                                    <th>Branch</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {reportData.slice(0, 5).map(row => (
                                                    <tr key={row.id}>
                                                        <td style={{ color: 'rgba(255,255,255,0.6)' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                                                        <td style={{ color: 'white', fontWeight: 500 }}>{row.full_name}</td>
                                                        <td>{row.status}</td>
                                                        <td>{row.branch}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {reportData.length > 5 && (
                                            <div style={{ padding: '12px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                                                ...and {reportData.length - 5} more records
                                            </div>
                                        )}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    )
}
