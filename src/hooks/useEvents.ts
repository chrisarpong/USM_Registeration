import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import type { USMEvent } from '../types'

/**
 * Fetches the currently active USM event from the database.
 * Used by public Registration page and Success page to dynamically
 * display event details instead of hardcoding them.
 */
export function useActiveEvent() {
    const [event, setEvent] = useState<USMEvent | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchActiveEvent = async () => {
            const { data, error: fetchError } = await supabase
                .from('events')
                .select('*')
                .eq('is_active', true)
                .single()

            if (fetchError) {
                console.error('Error fetching active event:', fetchError)
                setError('No active event found')
            } else if (data) {
                setEvent(data as USMEvent)
            }
            setLoading(false)
        }

        fetchActiveEvent()
    }, [])

    return { event, loading, error }
}

/**
 * Fetches all USM events, ordered by date descending.
 * Used by admin pages for event switching and management.
 */
export function useAllEvents() {
    const [events, setEvents] = useState<USMEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        let cancelled = false
        const controller = new AbortController()

        supabase
            .from('events')
            .select('*')
            .order('date', { ascending: false })
            .then(({ data, error }) => {
                if (cancelled) return
                if (!error && data) {
                    setEvents(data as USMEvent[])
                }
                setLoading(false)
            })

        return () => {
            cancelled = true
            controller.abort()
        }
    }, [refreshKey])

    const refetch = () => {
        setLoading(true)
        setRefreshKey(k => k + 1)
    }

    return { events, loading, refetch }
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
