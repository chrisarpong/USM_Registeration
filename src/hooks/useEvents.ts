import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import type { USMEvent } from '../types'

/**
 * Fetches the currently active USM event from the database.
 * Used by public Registration page and Success page to dynamically
 * display event details instead of hardcoding them.
 */
export function useActiveEvent() {
    const event = useQuery(api.events.getActiveEvent)
    const loading = event === undefined
    const error = event === null && !loading ? 'No active event found' : null

    return { event: event as unknown as USMEvent | null, loading, error }
}

/**
 * Fetches all USM events, ordered by date descending.
 * Used by admin pages for event switching and management.
 */
export function useAllEvents() {
    const events = useQuery(api.events.getEvents)
    const loading = events === undefined

    // Convex queries are reactive, so manual refetch isn't necessary.
    // Kept for backward compatibility with components using this hook.
    const refetch = () => {}

    return { events: events as unknown as USMEvent[] || [], loading, refetch }
}

/**
 * Format an event date string for display.
 * e.g., "2026-04-25" → "25th April"
 */
export function formatEventDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    const day = date.getDate()
    const month = date.toLocaleDateString('en-GB', { month: 'long' })

    const suffix = (d: number) => {
        if (d > 3 && d < 21) return 'th'
        switch (d % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
        }
    }

    return `${day}${suffix(day)} ${month}`
}
