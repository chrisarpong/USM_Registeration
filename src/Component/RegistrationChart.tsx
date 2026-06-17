import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { Id } from "../../convex/_generated/dataModel"

type Props = {
    eventId?: string
}

export default function RegistrationChart({ eventId }: Props) {
    const logs = useQuery(api.attendanceLogs.getLogsByEvent, 
        eventId ? { event_id: eventId as Id<"events"> } : "skip"
    )

    const data = useMemo(() => {
        if (!logs) return []

        // Group by date
        const grouped = logs.reduce((acc: Record<string, number>, log: any) => {
            const date = new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
            acc[date] = (acc[date] || 0) + 1
            return acc
        }, {})

        // Convert to array
        return Object.entries(grouped)
            .map(([date, count]) => ({ date, count }))
            .reverse() // Reverse to show chronological order since our query returns descending
    }, [logs])

    if (logs === undefined) return <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'gray' }}>Loading chart...</div>
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
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}
