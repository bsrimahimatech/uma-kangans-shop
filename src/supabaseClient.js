import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://agfmijteenwwyslxisvu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZm1panRlZW53d3lzbHhpc3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMDM5OTEsImV4cCI6MjA5Nzc3OTk5MX0.986CyUwLa3msTvKWKb5WJ5S1SXGkWBOM69mjrty10tI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
