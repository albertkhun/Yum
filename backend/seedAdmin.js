

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const User     = require('./models/User');

dotenv.config();

// ── Validate env vars exist ────────────────────────────────
const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

if (!MONGO_URI) {
  console.error(' MONGO_URI is not set in .env');
  process.exit(1);
}
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
  console.error('   Example:');
  console.error('   ADMIN_EMAIL=admin@yourdomain.com');
  console.error('   ADMIN_PASSWORD=StrongPass@2024!');
  process.exit(1);
}

// Password
const isStrongPassword = (pwd) => {
  if (pwd.length < 8)                    return 'at least 8 characters';
  if (!/[A-Z]/.test(pwd))                 return 'at least one uppercase letter';
  if (!/[a-z]/.test(pwd))                 return 'at least one lowercase letter';
  if (!/[0-9]/.test(pwd))                 return 'at least one number';
  if (!/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(pwd)) return 'at least one special character (!@#$%^&*...)';
  return null; 
};

const weakness = isStrongPassword(ADMIN_PASSWORD);
if (weakness) {
  console.error(`ADMIN_PASSWORD is too weak — needs ${weakness}`);
  process.exit(1);
}

// ── Seed ──────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existing) {
    if (existing.role !== 'admin') {
      console.error(`A non-admin account already exists for ${ADMIN_EMAIL}`);
      process.exit(1);
    }
    console.log(` Admin already exists: ${ADMIN_EMAIL}`);
    console.log('   To reset the password, delete the admin in MongoDB and re-run.');
    process.exit(0);
  }

  await User.create({
    name:     ADMIN_NAME || 'Admin',
    email:    ADMIN_EMAIL.toLowerCase(),
    password: ADMIN_PASSWORD,
    role:     'admin',
  });

  console.log('Admin account created successfully');
  console.log(`   Email : ${ADMIN_EMAIL}`);
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
