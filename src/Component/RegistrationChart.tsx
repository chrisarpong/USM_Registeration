import { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../supabaseClient'

type ChartData = {
    date: string
    count: number
}

export default function RegistrationChart() {
    const [data, setData] = useState<ChartData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchChartData = async () => {
            const { data: logs, error } = await supabase
                .from('attendance_logs')
                .select('created_at')
                .order('created_at', { ascending: true })

            if (error) {
                console.error('Error fetching chart data:', error)
                setLoading(false)
                return
            }

            if (logs) {
                // Group by date
                const grouped = logs.reduce((acc: Record<string, number>, log) => {
                    const date = new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
                    acc[date] = (acc[date] || 0) + 1
                    return acc
                }, {})

                // Convert to array
                const chartData = Object.entries(grouped).map(([date, count]) => ({
                    date,
                    count
                }))

                // Take last 7 days or just show all? Show all for now, maybe slice if too many.
                setData(chartData)
            }
            setLoading(false)
        }

        fetchChartData()
    }, [])

    if (loading) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>Loading chart...</div>
    if (data.length === 0) return null

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            height: '350px'
        }}>
            <h3 style={{ marginBottom: '20px', color: 'white', fontSize: '16px' }}>Registration Trends</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        tick={{ fill: 'rgba(255,255,255,0.5)' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1e1e2e',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            color: 'white'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#8b5cf6"
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        strokeWidth={3}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
