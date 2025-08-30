import { createClient } from '@supabase/supabase-js'

// Environment-specific Supabase configurations
const supabaseConfigs = {
  GMP: {
    url: import.meta.env.VITE_SUPABASE_URL_GMP,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_GMP
  },
  MC: {
    url: import.meta.env.VITE_SUPABASE_URL_MC,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_MC
  },
  FSQM: {
    url: import.meta.env.VITE_SUPABASE_URL_FSQM,
    key: import.meta.env.VITE_SUPABASE_ANON_KEY_FSQM
  }
}

// Create Supabase clients for each environment
export const supabaseClients = {
  GMP: createClient(supabaseConfigs.GMP.url, supabaseConfigs.GMP.key),
  MC: createClient(supabaseConfigs.MC.url, supabaseConfigs.MC.key),
  FSQM: createClient(supabaseConfigs.FSQM.url, supabaseConfigs.FSQM.key)
}

// Function to get the appropriate Supabase client based on environment
export const getSupabaseClient = (environment = 'GMP') => {
  return supabaseClients[environment] || supabaseClients.GMP
}

// Default export for backward compatibility (uses GMP)
export const supabase = supabaseClients.GMP
