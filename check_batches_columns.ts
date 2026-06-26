import { supabase } from './src/lib/supabase';

async function checkColumns() {
  const { data, error } = await supabase
    .from('batches')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }
  if (data && data.length > 0) {
    console.log('Columns in batches:', Object.keys(data[0]));
  } else {
    console.log('No data in batches to check columns.');
  }
}

checkColumns();
