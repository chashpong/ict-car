import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ใส่บรรทัดนี้เพื่อเช็กใน Console ของ Browser
console.log("Supabase URL:", supabaseUrl); 

export const supabase = createClient(supabaseUrl, supabaseKey)