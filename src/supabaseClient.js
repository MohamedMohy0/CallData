import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://egvmqirnnvieythrvrim.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndm1xaXJubnZpZXl0aHJ2cmltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDQ5OTIsImV4cCI6MjA4OTQyMDk5Mn0.lJZbWSE8WLJaqQcs2mnDCG28Rpt9xFhpfxeymO2anmY"

export const supabase = createClient(supabaseUrl, supabaseKey)