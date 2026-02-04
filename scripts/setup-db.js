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

    // Students table
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

    // Reviews table
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

    // Submission tracking table
    await sql`
      CREATE TABLE IF NOT EXISTS review_submissions (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id),
        review_period_id INTEGER REFERENCES review_periods(id),
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, review_period_id)
      )
    `;

    // Admin users table
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Tables created successfully!\n');

    // Insert review questions
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
    const groups = [
      { id: 1, name: 'Alpha Team' },
      { id: 2, name: 'Beta Squad' },
      { id: 3, name: 'Gamma Force' },
      { id: 4, name: 'Delta Crew' },
      { id: 5, name: 'Epsilon Guild' }
    ];

    for (const group of groups) {
      await sql`
        INSERT INTO groups (name)
        VALUES (${group.name})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log('✅ Groups created!\n');

    // ============================================================
    // STUDENT DATA CONFIGURATION
    // ============================================================
    // EDIT THIS SECTION TO CUSTOMIZE YOUR STUDENTS
    // Format: { name, email, matric, groupId }
    // ============================================================
    
    console.log('Inserting students...');
    
    const students = [
      // GROUP 1: Alpha Team (Group ID = 1)
      { name: 'James Smith', email: 'james.smith@school.edu', matric: 'SC6/2510/001', groupId: 1 },
      { name: 'Sarah Johnson', email: 'sarah.johnson@school.edu', matric: 'SC6/2510/002', groupId: 1 },
      { name: 'Michael Williams', email: 'michael.williams@school.edu', matric: 'SC6/2510/003', groupId: 1 },
      { name: 'Emily Brown', email: 'emily.brown@school.edu', matric: 'SC6/2510/004', groupId: 1 },
      { name: 'David Jones', email: 'david.jones@school.edu', matric: 'SC6/2510/005', groupId: 1 },
      { name: 'Jessica Garcia', email: 'jessica.garcia@school.edu', matric: 'SC6/2510/006', groupId: 1 },
      { name: 'Daniel Miller', email: 'daniel.miller@school.edu', matric: 'SC6/2510/007', groupId: 1 },
      { name: 'Ashley Davis', email: 'ashley.davis@school.edu', matric: 'SC6/2510/008', groupId: 1 },
      { name: 'Christopher Rodriguez', email: 'christopher.rodriguez@school.edu', matric: 'SC6/2510/009', groupId: 1 },
      { name: 'Amanda Martinez', email: 'amanda.martinez@school.edu', matric: 'SC6/2510/010', groupId: 1 },
      
      // GROUP 2: Beta Squad (Group ID = 2)
      { name: 'Matthew Hernandez', email: 'matthew.hernandez@school.edu', matric: 'SC6/2510/011', groupId: 2 },
      { name: 'Melissa Lopez', email: 'melissa.lopez@school.edu', matric: 'SC6/2510/012', groupId: 2 },
      { name: 'Joshua Gonzalez', email: 'joshua.gonzalez@school.edu', matric: 'SC6/2510/013', groupId: 2 },
      { name: 'Nicole Wilson', email: 'nicole.wilson@school.edu', matric: 'SC6/2510/014', groupId: 2 },
      { name: 'Andrew Anderson', email: 'andrew.anderson@school.edu', matric: 'SC6/2510/015', groupId: 2 },
      { name: 'Stephanie Thomas', email: 'stephanie.thomas@school.edu', matric: 'SC6/2510/016', groupId: 2 },
      { name: 'Ryan Taylor', email: 'ryan.taylor@school.edu', matric: 'SC6/2510/017', groupId: 2 },
      { name: 'Lauren Moore', email: 'lauren.moore@school.edu', matric: 'SC6/2510/018', groupId: 2 },
      { name: 'Kevin Jackson', email: 'kevin.jackson@school.edu', matric: 'SC6/2510/019', groupId: 2 },
      { name: 'Rachel Martin', email: 'rachel.martin@school.edu', matric: 'SC6/2510/020', groupId: 2 },
      
      // GROUP 3: Gamma Force (Group ID = 3)
      { name: 'Brandon Lee', email: 'brandon.lee@school.edu', matric: 'SC6/2510/021', groupId: 3 },
      { name: 'Samantha White', email: 'samantha.white@school.edu', matric: 'SC6/2510/022', groupId: 3 },
      { name: 'Justin Harris', email: 'justin.harris@school.edu', matric: 'SC6/2510/023', groupId: 3 },
      { name: 'Victoria Clark', email: 'victoria.clark@school.edu', matric: 'SC6/2510/024', groupId: 3 },
      { name: 'Tyler Lewis', email: 'tyler.lewis@school.edu', matric: 'SC6/2510/025', groupId: 3 },
      { name: 'Brittany Robinson', email: 'brittany.robinson@school.edu', matric: 'SC6/2510/026', groupId: 3 },
      { name: 'Eric Walker', email: 'eric.walker@school.edu', matric: 'SC6/2510/027', groupId: 3 },
      { name: 'Amber Young', email: 'amber.young@school.edu', matric: 'SC6/2510/028', groupId: 3 },
      { name: 'Nathan Allen', email: 'nathan.allen@school.edu', matric: 'SC6/2510/029', groupId: 3 },
      { name: 'Chelsea King', email: 'chelsea.king@school.edu', matric: 'SC6/2510/030', groupId: 3 },
      
      // GROUP 4: Delta Crew (Group ID = 4)
      { name: 'Jacob Wright', email: 'jacob.wright@school.edu', matric: 'SC6/2510/031', groupId: 4 },
      { name: 'Megan Scott', email: 'megan.scott@school.edu', matric: 'SC6/2510/032', groupId: 4 },
      { name: 'Austin Green', email: 'austin.green@school.edu', matric: 'SC6/2510/033', groupId: 4 },
      { name: 'Hannah Baker', email: 'hannah.baker@school.edu', matric: 'SC6/2510/034', groupId: 4 },
      { name: 'Jordan Adams', email: 'jordan.adams@school.edu', matric: 'SC6/2510/035', groupId: 4 },
      { name: 'Alexis Nelson', email: 'alexis.nelson@school.edu', matric: 'SC6/2510/036', groupId: 4 },
      { name: 'Dylan Carter', email: 'dylan.carter@school.edu', matric: 'SC6/2510/037', groupId: 4 },
      { name: 'Kayla Mitchell', email: 'kayla.mitchell@school.edu', matric: 'SC6/2510/038', groupId: 4 },
      { name: 'Connor Perez', email: 'connor.perez@school.edu', matric: 'SC6/2510/039', groupId: 4 },
      { name: 'Olivia Roberts', email: 'olivia.roberts@school.edu', matric: 'SC6/2510/040', groupId: 4 },
      
      // GROUP 5: Epsilon Guild (Group ID = 5)
      { name: 'Zachary Turner', email: 'zachary.turner@school.edu', matric: 'SC6/2510/041', groupId: 5 },
      { name: 'Madison Phillips', email: 'madison.phillips@school.edu', matric: 'SC6/2510/042', groupId: 5 },
      { name: 'Cody Campbell', email: 'cody.campbell@school.edu', matric: 'SC6/2510/043', groupId: 5 },
      { name: 'Taylor Parker', email: 'taylor.parker@school.edu', matric: 'SC6/2510/044', groupId: 5 },
      { name: 'Logan Evans', email: 'logan.evans@school.edu', matric: 'SC6/2510/045', groupId: 5 },
      { name: 'Morgan Edwards', email: 'morgan.edwards@school.edu', matric: 'SC6/2510/046', groupId: 5 },
      { name: 'Blake Collins', email: 'blake.collins@school.edu', matric: 'SC6/2510/047', groupId: 5 },
      { name: 'Sydney Stewart', email: 'sydney.stewart@school.edu', matric: 'SC6/2510/048', groupId: 5 },
      { name: 'Trevor Sanchez', email: 'trevor.sanchez@school.edu', matric: 'SC6/2510/049', groupId: 5 },
      { name: 'Courtney Morris', email: 'courtney.morris@school.edu', matric: 'SC6/2510/050', groupId: 5 },
    ];

    // Insert all students
    for (const student of students) {
      try {
        await sql`
          INSERT INTO students (name, email, matric_number, group_id)
          VALUES (${student.name}, ${student.email}, ${student.matric}, ${student.groupId})
          ON CONFLICT (matric_number) DO NOTHING
        `;
      } catch (error) {
        console.log(`⚠️  Skipped ${student.matric} (already exists or error)`);
      }
    }
    
    console.log(`✅ ${students.length} students configured!\n`);

    // Insert default admin user
    console.log('Creating default admin user...');
    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES ('admin', 'admin123')
      ON CONFLICT (username) DO NOTHING
    `;
    console.log('✅ Admin user created (username: admin, password: admin123)\n');

    // Show summary
    const groupCount = await sql`SELECT COUNT(*) as count FROM groups`;
    const studentCountResult = await sql`SELECT COUNT(*) as count FROM students`;
    const periodCount = await sql`SELECT COUNT(*) as count FROM review_periods`;
    
    console.log('📊 Database Setup Complete!');
    console.log('═'.repeat(60));
    console.log(`Groups: ${groupCount.rows[0].count}`);
    console.log(`Students: ${studentCountResult.rows[0].count}`);
    console.log(`Review Periods: ${periodCount.rows[0].count}`);
    console.log('═'.repeat(60));
    console.log('\n✨ Your database is ready to use!');
    console.log(`\n📅 Current active period: ${periodName}`);
    console.log('\n🔐 Sample matric numbers: SC6/2510/001 to SC6/2510/050');
    console.log('🔑 Admin login: username "admin", password "admin123"');
    console.log('\n💡 To customize students: Edit the students array in this file');

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