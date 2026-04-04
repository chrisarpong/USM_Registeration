// Shared type definitions for the USM Registration app

export type USMEvent = {
    id: string
    title: string
    date: string
    time: string
    theme: string
    venue: string
    venue_address: string | null
    map_query: string | null
    description: string | null
    flyer_url: string | null
    is_active: boolean
    is_registration_open: boolean
    created_at: string
}

export type AttendanceLog = {
    id: number
    created_at: string
    full_name: string
    phone_number: string
    email: string | null
    status: string
    branch: string
    invited_by: string | null
    location: string | null
    checked_in: boolean
    event_id: string | null
}

export type Branch = {
    id: string
    name: string
}

export type AttendeeStatus = 'Member' | 'Guest' | 'First Timer'

export type DashboardStats = {
    total: number
    members: number
    guests: number
    firstTimers: number
    checkedIn: number
}
