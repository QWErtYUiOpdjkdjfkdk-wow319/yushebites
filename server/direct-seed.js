import mongoose from 'mongoose';
import User from './models/User.js'; // Adjust path if your model is elsewhere

const MONGO_URI = "mongodb://127.0.0.1:27017/pos-db";
const ADMIN_PASSWORD_HASH = "$2b$10$sPFVQmUu7AkllyTN1t/./eKiSojtAy6ZoH90hjxkEi14aDF0X1GVm";

async function run() {
    try {
        console.log(`Connecting directly to: ${MONGO_URI}...`);
        await mongoose.connect(MONGO_URI);
        
        // This confirms what collection Mongoose is looking for
        console.log(`Targeting collection: ${User.collection.name}`);

        // Clear existing records to avoid conflicts
        await User.deleteMany({});
        console.log("Cleared old users.");

        // Insert our verified administrator account
        const admin = new User({
            name: "System Admin",
            email: "admin@test.com",
            password: ADMIN_PASSWORD_HASH, // Plain text password: admin
            role: "admin"
        });

        await admin.save();
        console.log("\n🚀 Success! Admin account written directly to database.");
        console.log("-----------------------------------------");
        console.log("Email:    admin@test.com");
        console.log("Password: admin");
        console.log("-----------------------------------------\n");

    } catch (error) {
        console.error("❌ Seeding encountered an error:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

run();