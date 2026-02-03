const { sql } = require('@vercel/postgres');

async function setupDatabase() {
  console.log('🚀 Setting up database...\n');

  try {
    // Create tables
    console.log('Creating tables...');
    
    // Groups table
    await sql`
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Students table (UPDATED - added email)
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        matric_number VARCHAR(50) UNIQUE NOT NULL,
        group_id INTEGER REFERENCES groups(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Review questions table
    await sql`
      CREATE TABLE IF NOT EXISTS review_questions (
        id SERIAL PRIMARY KEY,
        question_number INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        max_score INTEGER DEFAULT 5
      )
    `;

    // Review periods table
    await sql`
      CREATE TABLE IF NOT EXISTS review_periods (
        id SERIAL PRIMARY KEY,
        period_name VARCHAR(100) NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(month, year)
      )
    `;

    // Reviews table (UPDATED - with unique constraint per reviewer per period)
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        reviewer_id INTEGER REFERENCES students(id),
        reviewed_id INTEGER REFERENCES students(id),
        review_period_id INTEGER REFERENCES review_periods(id),
        question1_score INTEGER NOT NULL CHECK (question1_score >= 1 AND question1_score <= 5),
        question2_score INTEGER NOT NULL CHECK (question2_score >= 1 AND question2_score <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(reviewer_id, reviewed_id, review_period_id)
      )
    `;

    // NEW: Submission tracking table (prevents double submissions)
    await sql`
      CREATE TABLE IF NOT EXISTS review_submissions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        review_period_id INTEGER REFERENCES review_periods(id),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, review_period_id)
      )
    `;

    // NEW: Admin users table (for admin authentication)
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Tables created successfully!\n');

    // Insert review questions (1-5 scale)
    console.log('Inserting review questions...');
    await sql`
      INSERT INTO review_questions (question_number, question_text, max_score)
      VALUES 
        (1, 'How would you rate this peer''s contribution to group discussions and collaborative work?', 5),
        (2, 'How would you rate this peer''s reliability and commitment to meeting deadlines?', 5)
      ON CONFLICT DO NOTHING
    `;
    console.log('✅ Review questions added!\n');

    // Insert current review period
    console.log('Creating current review period...');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const periodName = `${monthNames[currentMonth - 1]} ${currentYear}`;

    await sql`
      INSERT INTO review_periods (period_name, month, year, is_active)
      VALUES (${periodName}, ${currentMonth}, ${currentYear}, true)
      ON CONFLICT (month, year) DO UPDATE SET is_active = true
    `;
    console.log(`✅ Active review period: ${periodName}\n`);

    // Insert demo groups
    console.log('Inserting demo groups...');
    const groupNames = [
      'Alpha Team', 'Beta Squad', 'Gamma Force', 'Delta Crew', 'Epsilon Guild'
    ];

    for (const groupName of groupNames) {
      await sql`
        INSERT INTO groups (name)
        VALUES (${groupName})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log('✅ Groups created!\n');

    // Insert demo students (WITH REALISTIC MATRIC NUMBERS)
    console.log('Inserting demo students...');
    const firstNames = ['James', 'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Daniel', 'Ashley', 'Christopher', 'Amanda', 'Matthew', 'Melissa', 'Joshua', 'Nicole', 'Andrew'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];

    let studentCount = 1;
    for (let groupId = 1; groupId <= 5; groupId++) {
      const studentsInGroup = 10 + Math.floor(Math.random() * 6); // 10-15 students per group
      
      for (let i = 0; i < studentsInGroup; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const name = `${firstName} ${lastName}`;
        
        // Realistic matric format: SC6/2510/XXX
        const matricNumber = `SC6/2510/${String(studentCount).padStart(3, '0')}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@school.edu`;

        await sql`
          INSERT INTO students (name, email, matric_number, group_id)
          VALUES (${name}, ${email}, ${matricNumber}, ${groupId})
          ON CONFLICT (matric_number) DO NOTHING
        `;
        studentCount++;
      }
    }
    console.log(`✅ ${studentCount - 1} demo students created!\n`);

    // Insert default admin user (username: admin, password: admin123)
    console.log('Creating default admin user...');
    // Simple hash for demo (in production, use bcrypt)
    const defaultPasswordHash = 'admin123'; // Change this in production!
    
    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES ('admin', ${defaultPasswordHash})
      ON CONFLICT (username) DO NOTHING
    `;
    console.log('✅ Admin user created (username: admin, password: admin123)\n');

    // Show summary
    const groupCount = await sql`SELECT COUNT(*) as count FROM groups`;
    const studentCountResult = await sql`SELECT COUNT(*) as count FROM students`;
    const periodCount = await sql`SELECT COUNT(*) as count FROM review_periods`;
    
    console.log('📊 Database Setup Complete!');
    console.log('═'.repeat(50));
    console.log(`Groups: ${groupCount.rows[0].count}`);
    console.log(`Students: ${studentCountResult.rows[0].count}`);
    console.log(`Review Periods: ${periodCount.rows[0].count}`);
    console.log('═'.repeat(50));
    console.log('\n✨ Your database is ready to use!');
    console.log(`\n📅 Current active period: ${periodName}`);
    console.log('\n🔐 Sample matric numbers: SC6/2510/001, SC6/2510/002, etc.');
    console.log('🔑 Admin login: username "admin", password "admin123"');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  }
}

setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });