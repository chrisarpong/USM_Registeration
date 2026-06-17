import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileDown, Calendar, Filter, CalendarDays, Clock, CheckCircle, MapPin, BarChart, Users, TrendingUp } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatEventDate } from '../hooks/useEvents'

import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

export default function AdminReports() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [statusFilter, setStatusFilter] = useState('All')
    const [eventFilter, setEventFilter] = useState('')
    const [timeOfDayFilter, setTimeOfDayFilter] = useState('All')
    const [checkInFilter, setCheckInFilter] = useState('All')
    const [branchFilterState, setBranchFilterState] = useState('All')
    
    const [loading, setLoading] = useState(false)
    const [reportData, setReportData] = useState<any[]>([])
    const [generated, setGenerated] = useState(false)

    const events = useQuery(api.events.getEvents)
    const branchesData = useQuery(api.branches.getBranches)
    
    const logsByEvent = useQuery(api.attendanceLogs.getLogsByEvent, 
        eventFilter ? { event_id: eventFilter as Id<"events"> } : "skip"
    )
    const allLogs = useQuery(api.attendanceLogs.getAllLogs)

    useEffect(() => {
        if (events && !eventFilter) {
            const active = events.find(e => e.is_active)
            if (active) setEventFilter(active._id)
        }
    }, [events, eventFilter])

    const generateReport = async () => {
        setLoading(true)
        setGenerated(false)

        let logsToFilter = eventFilter ? logsByEvent : allLogs

        if (logsToFilter === undefined) {
            toast.error("Still loading data...")
            setLoading(false)
            return
        }

        let filtered = [...logsToFilter]

        if (startDate) {
            const start = new Date(startDate).getTime()
            filtered = filtered.filter(l => new Date(l.created_at).getTime() >= start)
        }
        
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59').getTime()
            filtered = filtered.filter(l => new Date(l.created_at).getTime() <= end)
        }

        if (statusFilter !== 'All') {
            if (statusFilter === 'Members') filtered = filtered.filter(l => l.status === 'Member')
            if (statusFilter === 'Guests') filtered = filtered.filter(l => l.status === 'Guest')
            if (statusFilter === 'First Timers') filtered = filtered.filter(l => l.status === 'First Timer')
        }

        if (timeOfDayFilter !== 'All') {
            filtered = filtered.filter(l => {
                const hour = new Date(l.created_at).getHours()
                if (timeOfDayFilter === 'Morning') return hour < 12
                if (timeOfDayFilter === 'Afternoon') return hour >= 12 && hour < 17
                if (timeOfDayFilter === 'Evening') return hour >= 17
                return true
            })
        }

        if (checkInFilter !== 'All') {
            if (checkInFilter === 'Checked In') filtered = filtered.filter(l => l.checked_in)
            if (checkInFilter === 'Pending') filtered = filtered.filter(l => !l.checked_in)
        }

        if (branchFilterState !== 'All') {
            filtered = filtered.filter(l => l.branch === branchFilterState)
        }

        setReportData(filtered)
        setGenerated(true)
        toast.success('Report generated successfully')
        setLoading(false)
    }

    const downloadCSV = () => {
        if (reportData.length === 0) {
            toast.error('No data to export')
            return
        }

        const headers = ['Time', 'Full Name', 'Phone', 'Status', 'Branch', 'Location', 'Invited By', 'Checked In']

        let members = 0, guests = 0, firstTimers = 0, checkedIn = 0;
        reportData.forEach(row => {
            if (row.status === 'Member') members++;
            if (row.status === 'Guest') guests++;
            if (row.status === 'First Timer') firstTimers++;
            if (row.checked_in) checkedIn++;
        })

        const summaryRows = [
            `REPORT SUMMARY`,
            `Total Records,${reportData.length}`,
            `Checked In,${checkedIn}`,
            `Members,${members}`,
            `Guests,${guests}`,
            `First Timers,${firstTimers}`,
            ``,
            headers.join(',')
        ]

        const dataRows = reportData.map(row => {
            return [
                new Date(row.created_at).toLocaleString(),
                `"${row.full_name}"`,
                `"${row.phone_number}"`,
                row.status,
                row.branch,
                row.location || '',
                row.invited_by || '',
                row.checked_in ? 'Yes' : 'No'
            ].join(',')
        })

        const csvContent = [...summaryRows, ...dataRows].join('\n')

        const selectedEvent = events?.find(e => e._id === eventFilter)
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

    const analytics = useMemo(() => {
        if (!reportData.length) return null;
        let members = 0, guests = 0, firstTimers = 0, checkedIn = 0;
        const timeBlocks: Record<string, number> = {};

        reportData.forEach(row => {
            if (row.status === 'Member') members++;
            if (row.status === 'Guest') guests++;
            if (row.status === 'First Timer') firstTimers++;
            if (row.checked_in) checkedIn++;

            const hour = new Date(row.created_at).getHours();
            const block = `${hour}:00 - ${hour+1}:00`;
            timeBlocks[block] = (timeBlocks[block] || 0) + 1;
        });

        let peakTime = 'N/A';
        let maxCount = 0;
        for (const [block, count] of Object.entries(timeBlocks)) {
            if (count > maxCount) {
                maxCount = count;
                peakTime = block;
            }
        }

        return {
            total: reportData.length,
            members,
            guests,
            firstTimers,
            checkedIn,
            checkInRate: Math.round((checkedIn / reportData.length) * 100),
            peakTime
        }
    }, [reportData]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}
        >
            <div className="registration-container" style={{ display: 'block', minHeight: 'auto', padding: '0', overflow: 'hidden' }}>
                <div className="form-panel" style={{ border: 'none', background: 'transparent', padding: '40px' }}>

                    <h2 style={{ fontSize: '24px', marginBottom: '8px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <BarChart size={24} color="var(--primary)" /> Smart Report Generator
                    </h2>
                    <p className="form-subtitle">Use advanced filters to slice attendance data precisely as you need it.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '32px' }}>

                        {/* Event Filter */}
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label className="glass-label"><CalendarDays size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '6px' }} />Event</label>
                            <div className="glass-input-wrapper">
                                <CalendarDays size={18} className="input-icon" />
                                <select className="glass-input" value={eventFilter} onChange={(e) => setEventFilter(e.target.value)}>
                                    <option value="">All Events</option>
                                    {events?.map(ev => (
                                        <option key={ev._id} value={ev._id}>
                                            {formatEventDate(ev.date)} — {ev.theme} {ev.is_active ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date Filters */}
                        <div className="form-group">
                            <label className="glass-label">Start Date</label>
                            <div className="glass-input-wrapper">
                                <Calendar size={18} className="input-icon" />
                                <input className="glass-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="glass-label">End Date</label>
                            <div className="glass-input-wrapper">
                                <Calendar size={18} className="input-icon" />
                                <input className="glass-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="form-group">
                            <label className="glass-label">Type</label>
                            <div className="glass-input-wrapper">
                                <Filter size={18} className="input-icon" />
                                <select className="glass-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    <option value="All">All Attendees</option>
                                    <option value="Members">Members</option>
                                    <option value="Guests">Guests</option>
                                    <option value="First Timers">First Timers</option>
                                </select>
                            </div>
                        </div>

                        {/* Time of Day */}
                        <div className="form-group">
                            <label className="glass-label">Time of Day</label>
                            <div className="glass-input-wrapper">
                                <Clock size={18} className="input-icon" />
                                <select className="glass-input" value={timeOfDayFilter} onChange={(e) => setTimeOfDayFilter(e.target.value)}>
                                    <option value="All">All Times</option>
                                    <option value="Morning">Morning (&lt; 12PM)</option>
                                    <option value="Afternoon">Afternoon (12PM - 5PM)</option>
                                    <option value="Evening">Evening (after 5PM)</option>
                                </select>
                            </div>
                        </div>

                        {/* Check-In Status */}
                        <div className="form-group">
                            <label className="glass-label">Check-In</label>
                            <div className="glass-input-wrapper">
                                <CheckCircle size={18} className="input-icon" />
                                <select className="glass-input" value={checkInFilter} onChange={(e) => setCheckInFilter(e.target.value)}>
                                    <option value="All">All Statuses</option>
                                    <option value="Checked In">Checked In</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>

                        {/* Branch */}
                        <div className="form-group">
                            <label className="glass-label">Branch</label>
                            <div className="glass-input-wrapper">
                                <MapPin size={18} className="input-icon" />
                                <select className="glass-input" value={branchFilterState} onChange={(e) => setBranchFilterState(e.target.value)}>
                                    <option value="All">All Branches</option>
                                    {branchesData?.map(b => (
                                        <option key={b._id} value={b.name}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gridColumn: '1 / -1', marginTop: '10px' }}>
                            <button
                                className="btn-submit"
                                style={{ margin: 0, height: '52px', width: '100%' }}
                                onClick={generateReport}
                                disabled={loading || !events}
                            >
                                {loading ? 'Generating...' : 'Generate Smart Report'}
                            </button>
                        </div>
                    </div>

                    {/* Results Insights & Preview */}
                    <AnimatePresence>
                        {generated && analytics && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{ marginTop: '40px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <TrendingUp size={20} color="#10b981" /> Report Insights
                                        </h3>
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px' }}>Found {reportData.length} records matching your exact criteria.</p>
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
                                            transition: 'all 0.2s',
                                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <FileDown size={20} />
                                        Export CSV
                                    </button>
                                </div>

                                {/* Smart Stats Grid */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Found</div>
                                        <div style={{ fontSize: '28px', fontWeight: 700, color: 'white' }}>{analytics.total}</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Check-In Rate</div>
                                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#34d399' }}>{analytics.checkInRate}%</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peak Arrival Time</div>
                                        <div style={{ fontSize: '28px', fontWeight: 700, color: '#60a5fa' }}>{analytics.peakTime}</div>
                                    </div>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '20px', borderRadius: '16px' }}>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Demographics</div>
                                        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6' }}>
                                            <span style={{color: '#a855f7'}}>●</span> {analytics.firstTimers} First Timers<br/>
                                            <span style={{color: '#fbbf24'}}>●</span> {analytics.guests} Guests<br/>
                                            <span style={{color: '#34d399'}}>●</span> {analytics.members} Members
                                        </div>
                                    </div>
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
                                                    <tr key={row._id}>
                                                        <td style={{ color: 'rgba(255,255,255,0.6)' }}>{new Date(row.created_at).toLocaleDateString()}</td>
                                                        <td style={{ color: 'white', fontWeight: 500 }}>{row.full_name}</td>
                                                        <td>
                                                            <span className={`status-badge ${row.status.toLowerCase().replace(' ', '-')}`}>
                                                                {row.status}
                                                            </span>
                                                        </td>
                                                        <td>{row.branch}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {reportData.length > 5 && (
                                            <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', borderTop: '1px solid var(--border)' }}>
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
