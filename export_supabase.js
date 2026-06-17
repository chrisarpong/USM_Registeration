import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Did you pass --env-file=.env.local?");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportTable(tableName) {
  console.log(`Exporting ${tableName}...`);
  const { data, error } = await supabase.from(tableName).select('*');
  
  if (error) {
    console.error(`Error exporting ${tableName}:`, error.message);
    return;
  }
  
  const filePath = path.resolve(__dirname, `${tableName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Successfully exported ${data.length} rows to ${tableName}.json`);
}

async function main() {
  await exportTable('events');
  await exportTable('branches');
  await exportTable('attendance_logs');
  
  console.log('Export complete.');
}

main();
