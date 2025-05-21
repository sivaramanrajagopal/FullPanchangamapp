// lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ssxiyotwulpettflagna.supabase.co";
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzeGl5b3R3dWxwZXR0ZmxhZ25hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDA0MDksImV4cCI6MjA2MDc3NjQwOX0.epsYMAP-Uguule1dXwCyYRz1nld3g1A68nc8JG8WTGg";

export const supabase = createClient(supabaseUrl, supabaseKey);
