//authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Log what the user actually typed into the React input box
        console.log("--- DEBUGGING LOGIN ATTEMPT ---");
        console.log("Typed Email:   ", `"${email}"`);
        console.log("Typed Password:", `"${password}"`);

        const user = await User.findOne({ email });
        
        // 2. Log if MongoDB found the document
        if (!user) {
            console.log("❌ Result: No user document found matching this email.");
            return res.status(401).json({ success: false, message: "User not found" });
        }

        console.log("✅ Result: User document successfully located.");
        console.log("Database Hash: ", `"${user.password}"`);

        // 3. Log what Bcrypt decides
        const isMatch = await bcrypt.compare(password, user.password);
        console.log("Bcrypt Match?  ", isMatch);

        if (!isMatch) {
            console.log("❌ Result: Passwords do not match.");
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2d' });
        return res.status(200).json({
            success: true, message: "login successful", token, user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            }
        });
    }
    catch (error) {
        console.error("🔥 Controller Crash Stack:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
