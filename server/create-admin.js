// Creates (or resets) an admin account in the database named by MONGO_URI.
// Unlike seed.js, this does NOT delete any other users.
//
// Usage (from the server/ folder, with a .env containing your Atlas MONGO_URI):
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-strong-password' node --env-file=.env create-admin.js
// Windows PowerShell:
//   $env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-strong-password"; node --env-file=.env create-admin.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';

const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD first.');
    process.exit(1);
}
if (ADMIN_PASSWORD.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
}

try {
    await mongoose.connect(MONGO_URI);
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const user = await User.findOneAndUpdate(
        { email: ADMIN_EMAIL },
        { $set: { password: hash, role: 'admin' }, $setOnInsert: { name: 'Admin' } },
        { upsert: true, new: true }
    );

    console.log(`Admin ready: ${user.email} (database: ${mongoose.connection.name})`);
} catch (error) {
    console.error('Failed:', error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
