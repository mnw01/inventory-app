
import { createClient } from '@supabase/supabase-js';

// 这些将由用户在 .env 文件或直接在此处替换
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uhukjjmwtkcjobdxmjyc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVodWtqam13dGtjam9iZHhtanljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2Nzc1OTgsImV4cCI6MjA4NTI1MzU5OH0.FySpSsZ1qTjHVAgs0vqb0dlx-HysC9pkmmb12fjQtAw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
