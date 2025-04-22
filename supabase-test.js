require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or Anon Key is missing. Check your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl.substring(0, 10) + '...');
console.log('Supabase Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection by attempting to get a user count
async function testConnection() {
  try {
    const { count, error } = await supabase
      .from('speech_language_reports')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('Connection successful!');
    console.log('API is operational');
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (!success) process.exit(1);
});