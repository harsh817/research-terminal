// require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tpwervipwozezddyuizg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwd2Vydmlwd296ZXpkZHl1aXpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTk4MDg3NywiZXhwIjoyMDgxNTU2ODc3fQ.GUd8QMCAMxXFfuaE7IpMd5tfd9wCgHGu1c80cYJwbR4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkNews() {
  const { data, error } = await supabase
    .from('news_items')
    .select('headline, url, published_at')
    .order('published_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Total news items: ${data.length}`);
    console.log('Latest news items:');
    data.forEach(item => {
      console.log(`${item.published_at}: ${item.headline}: ${item.url}`);
    });
  }
}

checkNews();