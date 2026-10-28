// seed.js
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config(); 

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pos-db");
        console.log("Connected to MongoDB for seeding...");

        // Clear out existing users to prevent conflicts
        await User.deleteMany({}); 

        // Hash a clean, predictable password: "adminpassword123"
        const hashedPassword = await bcrypt.hash("adminpassword123", 10);

        const admin = new User({
            name: "System Admin",
            email: "admin@test.com",
            password: hashedPassword,
            role: "admin"
        });

        await admin.save();
        console.log("🚀 Admin account created successfully!");
        console.log("Email: admin@test.com");
        console.log("Password: adminpassword123");
        
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedAdmin();
