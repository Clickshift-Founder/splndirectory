// Import students from CSV file (WITH PHONE NUMBERS)
// Usage: node scripts/import-students.js students.csv

const fs = require('fs');

function parseCSV(filePath) {
  console.log(`\n📂 Reading file: ${filePath}\n`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Skip header and instruction lines
  const dataLines = lines.slice(1).filter(line => {
    return !line.startsWith('INSTRUCTIONS') && !line.startsWith('1.') && 
           !line.startsWith('2.') && !line.startsWith('3.') &&
           !line.startsWith('4.') && !line.startsWith('5.') &&
           !line.startsWith('6.') && !line.startsWith('7.') &&
           !line.startsWith('8.') && line.trim().length > 0;
  });
  
  const students = [];
  
  dataLines.forEach((line, index) => {
    const parts = line.split(',').map(p => p.trim());
    
    if (parts.length >= 5) {
      const [name, email, matric, groupNum, groupName, phoneNumber] = parts;
      
      if (name && matric && groupNum) {
        students.push({
          name,
          email: email || '',
          matric,
          groupNum: parseInt(groupNum),
          groupName: groupName || `Group ${groupNum}`,
          phoneNumber: phoneNumber || ''
        });
      }
    }
  });
  
  return students;
}

function generateSQL(students) {
  console.log(`\n✅ Parsed ${students.length} students\n`);
  console.log('📝 Generating SQL...\n');
  console.log('═'.repeat(80));
  console.log('\n-- Copy everything below this line and paste into Vercel Query tab\n');
  console.log('═'.repeat(80));
  console.log('\n');
  
  // Get unique groups
  const groups = [...new Set(students.map(s => ({ num: s.groupNum, name: s.groupName })))];
  const uniqueGroups = [];
  const seen = new Set();
  
  groups.forEach(g => {
    const key = `${g.num}-${g.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueGroups.push(g);
    }
  });
  
  // Generate group inserts
  console.log('-- ============================================================');
  console.log('-- STEP 1: Insert Groups');
  console.log('-- ============================================================\n');
  
  uniqueGroups.sort((a, b) => a.num - b.num).forEach(g => {
    console.log(`INSERT INTO groups (name) VALUES ('${g.name}') ON CONFLICT DO NOTHING;`);
  });
  
  console.log('\n-- ============================================================');
  console.log('-- STEP 2: Insert Students (WITH PHONE NUMBERS)');
  console.log('-- ============================================================\n');
  
  // Group students by group number
  const studentsByGroup = {};
  students.forEach(s => {
    if (!studentsByGroup[s.groupNum]) {
      studentsByGroup[s.groupNum] = [];
    }
    studentsByGroup[s.groupNum].push(s);
  });
  
  // Generate student inserts grouped by group
  Object.keys(studentsByGroup).sort((a, b) => parseInt(a) - parseInt(b)).forEach(groupNum => {
    const groupStudents = studentsByGroup[groupNum];
    const groupName = groupStudents[0].groupName;
    
    console.log(`\n-- GROUP ${groupNum}: ${groupName} (${groupStudents.length} students)`);
    console.log('INSERT INTO students (name, email, matric_number, group_id, phone_number) VALUES');
    
    groupStudents.forEach((student, index) => {
      const isLast = index === groupStudents.length - 1;
      const email = student.email || `${student.name.toLowerCase().replace(/\s+/g, '.')}@school.edu`;
      const phone = student.phoneNumber || '';
      
      console.log(`  ('${student.name}', '${email}', '${student.matric}', ${groupNum}, '${phone}')${isLast ? ';' : ','}`);
    });
  });
  
  console.log('\n-- ============================================================');
  console.log('-- STEP 3: Verify Import');
  console.log('-- ============================================================\n');
  console.log('SELECT COUNT(*) as total_students FROM students;');
  console.log('SELECT g.name, COUNT(*) as student_count FROM groups g');
  console.log('  JOIN students s ON g.id = s.group_id');
  console.log('  GROUP BY g.name ORDER BY g.name;\n');
  
  console.log('-- Check students with phone numbers');
  console.log('SELECT name, matric_number, phone_number FROM students WHERE phone_number IS NOT NULL AND phone_number != \'\' LIMIT 10;\n');
  
  console.log('═'.repeat(80));
  console.log(`\n✅ SQL generated for ${students.length} students in ${uniqueGroups.length} groups\n`);
  console.log('📋 Next steps:');
  console.log('   1. Copy the SQL above (from "INSERT INTO groups" onwards)');
  console.log('   2. Go to Vercel Dashboard → Storage → Your Database → Query tab');
  console.log('   3. Paste the SQL');
  console.log('   4. Click "Run"');
  console.log('   5. Check verification queries at the end\n');
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('\n❌ Usage: node scripts/import-students.js <csv-file>\n');
  console.log('Example: node scripts/import-students.js students.csv\n');
  process.exit(1);
}

const csvFile = args[0];

if (!fs.existsSync(csvFile)) {
  console.log(`\n❌ File not found: ${csvFile}\n`);
  process.exit(1);
}

try {
  const students = parseCSV(csvFile);
  
  if (students.length === 0) {
    console.log('\n❌ No valid student data found in CSV\n');
    console.log('Please check your CSV format:\n');
    console.log('Name,Email,Matric Number,Group Number,Group Name,Phone Number');
    console.log('John Doe,john@school.edu,SC6/2510/001,1,Group Alpha,08012345678\n');
    process.exit(1);
  }
  
  generateSQL(students);
  
} catch (error) {
  console.error('\n❌ Error processing CSV:', error.message);
  process.exit(1);
}