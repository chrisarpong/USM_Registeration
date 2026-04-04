import { motion } from 'framer-motion'

type SkeletonProps = {
    width?: string
    height?: string
    borderRadius?: string
    style?: React.CSSProperties
}

/** Single skeleton bar with a shimmer animation */
export function Skeleton({ width = '100%', height = '20px', borderRadius = '8px', style }: SkeletonProps) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s ease-in-out infinite',
                ...style,
            }}
        />
    )
}

/** Skeleton for a stat card */
export function StatCardSkeleton() {
    return (
        <div className="stat-card" style={{ opacity: 0.6 }}>
            <Skeleton width="50px" height="50px" borderRadius="12px" />
            <div style={{ flex: 1 }}>
                <Skeleton width="80px" height="14px" style={{ marginBottom: '8px' }} />
                <Skeleton width="60px" height="32px" />
            </div>
        </div>
    )
}

/** Skeleton for the stats grid (5 cards) */
export function StatsGridSkeleton() {
    return (
        <div className="stats-grid">
            {[...Array(5)].map((_, i) => (
                <StatCardSkeleton key={i} />
            ))}
        </div>
    )
}

/** Skeleton for the data table */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="glass-table-container">
            <table className="glass-table">
                <thead>
                    <tr>
                        {['Date', 'Name', 'Status', 'Branch', 'Location', 'Phone', 'Invited By', 'Check-In', 'Actions'].map(h => (
                            <th key={h}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(rows)].map((_, i) => (
                        <tr key={i}>
                            <td><Skeleton width="70px" height="14px" /></td>
                            <td style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                                <Skeleton width="32px" height="32px" borderRadius="50%" />
                                <Skeleton width="120px" height="14px" />
                            </td>
                            <td><Skeleton width="70px" height="24px" borderRadius="20px" /></td>
                            <td><Skeleton width="90px" height="14px" /></td>
                            <td><Skeleton width="80px" height="14px" /></td>
                            <td><Skeleton width="100px" height="14px" /></td>
                            <td><Skeleton width="80px" height="14px" /></td>
                            <td><Skeleton width="100px" height="30px" borderRadius="24px" style={{ margin: '0 auto' }} /></td>
                            <td><Skeleton width="70px" height="30px" /></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

/** Skeleton for the chart area */
export function ChartSkeleton() {
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            height: '350px',
            display: 'flex',
            flexDirection: 'column',
        }}>
            <Skeleton width="160px" height="16px" style={{ marginBottom: '20px' }} />
            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '0 20px' }}>
                {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 95].map((h, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        transition={{ delay: i * 0.05, duration: 0.5 }}
                        style={{
                            flex: 1,
                            borderRadius: '4px 4px 0 0',
                            background: 'linear-gradient(to top, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

/** Full page loading skeleton for the registration page */
export function RegistrationSkeleton() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{
                maxWidth: '550px', width: '100%', padding: '40px', textAlign: 'center',
                background: 'rgba(20, 20, 35, 0.5)', borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <Skeleton width="80px" height="80px" borderRadius="50%" style={{ margin: '0 auto 20px' }} />
                <Skeleton width="200px" height="20px" style={{ margin: '0 auto 16px' }} />
                <Skeleton width="280px" height="14px" style={{ margin: '0 auto' }} />
            </div>
        </div>
    )
}
