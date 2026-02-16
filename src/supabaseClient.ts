import { createClient } from '@supabase/supabase-js'

// 1. Load the keys from the .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 2. Safety Check: Warn us if keys are missing
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase URL or Anon Key. Check your .env file.')
}

// 3. Create and export the connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey)