import mongoose from 'mongoose';

const MONGO_URI = "mongodb://127.0.0.1:27017/pos-db";
const TARGET_PASSWORD_HASH = "$2b$10$sPFVQmUu7AkllyTN1t/./eKiSojtAy6ZoH90hjxkEi14aDF0X1GVm"; // plain-text: "admin"

async function repair() {
    try {
        console.log(`Connecting straight to: ${MONGO_URI}`);
        await mongoose.connect(MONGO_URI);
        
        const db = mongoose.connection.db;
        
        // 1. Drop existing structural variations to prevent overlapping namespaces
        await db.collection('users').deleteMany({});
        console.log("Cleared matching collection structures.");

        // 2. Insert clean account payload directly to the raw collection driver layer
        await db.collection('users').insertOne({
            name: "admin",
            email: "admin@gmail.com",
            password: TARGET_PASSWORD_HASH,
            address: "admin address",
            role: "admin"
        });

        console.log("\n🚀 Verification Record Written to pos-db.users!");
        console.log("Database:  pos-db");
        console.log("Collection: users");
        console.log("Email:      admin@gmail.com");
        console.log("Password:   admin\n");

    } catch (err) {
        console.error("Execution failed:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

repair();