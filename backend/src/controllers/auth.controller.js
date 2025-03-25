import nodemailer from "nodemailer";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { generateToken } from "../lib/utils.js";

// Create a temporary store for OTPs (for development)
// In production, consider using Redis or a database model
const otpStore = {};

// Nodemailer Setup
let transporter;

// Initialize email transporter (async function to be called when app starts)
export const initializeEmailService = async () => {
    // For development/testing, use Ethereal
    if (process.env.NODE_ENV === "production") {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            }
        });
        console.log("Email test account created:", testAccount.user);
    } else {
        // For production, use your actual SMTP service
        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "tejassonawane1110@gmail.com",
                pass: "pzopafelewvjedma",
            }
        });
    }
};

// Call this function when your app starts
initializeEmailService();

// Generate 6-digit OTP
function generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
}

// Send OTP Email
async function sendOTPEmail(email, otp) {
    try {
        if (!transporter) {
            console.error("Mailer transporter not initialized.");
            return false;
        }
        const mailOptions = {
            from: process.env.EMAIL_USER || '"URL Shortener" <no-reply@urlshortener.com>',
            to: email,
            subject: "Your OTP Code",
            text: `Your OTP is: ${otp}. It is valid for 5 minutes.`,
            html: `<p>Your OTP is: <strong>${otp}</strong></p><p>It is valid for 5 minutes.</p>`
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent: %s", info.messageId);
        
        // For development, log the URL where you can preview the email
        if (process.env.NODE_ENV !== "production") {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }
        
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

// Request OTP for Signup
export const requestSignupOTP = async (req, res) => {
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ message: "Email is required" });
    
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });
        
        const otp = generateOTP();
        otpStore[email] = { 
            otp, 
            expires: Date.now() + 5 * 60 * 1000  // 5 minutes expiry
        };
        
        const emailSent = await sendOTPEmail(email, otp);
        if (!emailSent) {
            return res.status(500).json({ message: "Failed to send OTP email" });
        }
        
        res.json({ success: true, message: "OTP sent for signup verification" });
    } catch (error) {
        console.error("Error in requestSignupOTP:", error);
        res.status(500).json({ message: "Error sending OTP" });
    }
};

// Verify OTP (without creating user yet)
export const verifySignupOtp = async (req, res) => {
    const { email, otp } = req.body;
    
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required!" });
    
    try {
        // Check OTP from in-memory store
        if (!otpStore[email]) {
            return res.status(400).json({ message: "OTP not found or already used" });
        }
        
        if (otpStore[email].expires < Date.now()) {
            delete otpStore[email]; // Clean up expired OTP
            return res.status(400).json({ message: "OTP expired. Request a new one." });
        }
        
        if (otpStore[email].otp !== otp) {
            return res.status(400).json({ message: "Incorrect OTP" });
        }
        
        // Don't delete the OTP yet, as it will be needed in the signup function
        // Just mark it as verified
        otpStore[email].verified = true;
        
        res.status(200).json({ message: "OTP verified successfully!" });
    } catch (error) {
        console.error("Error in verifySignupOtp:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Signup User after OTP verification
export const signup = async (req, res) => {
    const { fullname, email, password, otp } = req.body;
    
    if (!fullname || !email || !password || !otp)
        return res.status(400).json({ message: "All fields are required" });
    
    // Verify OTP again
    if (!otpStore[email] || otpStore[email].expires < Date.now()) {
        return res.status(400).json({ message: "OTP expired or invalid" });
    }
    
    if (otpStore[email].otp !== otp) {
        return res.status(400).json({ message: "Incorrect OTP" });
    }
    
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Create new user
        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        });
        
        // Save user to database
        await newUser.save();
        
        // Generate JWT token
        generateToken(newUser._id, res);
        
        // Clean up OTP
        delete otpStore[email];
        
        // Return user details (excluding password)
        res.status(201).json({
            id: newUser._id,
            fullname: newUser.fullname,
            email: newUser.email,
        });
    } catch (error) {
        console.error("Error in signup:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Regular Login with Password
export const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid credentials" });

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
        });
    } catch (error) {
        console.log("Error in login", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Logout User
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log("Error in logout", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Update Profile
export const updateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userID = req.user._id;

        if (!profilePic) return res.status(400).json({ message: "Profile pic is not provided" });

        const updatedUser = await User.findByIdAndUpdate(
            userID, 
            { profilePic }, 
            { new: true }
        );

        res.status(200).json({ message: "Profile pic updated" });
    } catch (error) {
        console.log("Error in updateProfile controller");
        res.status(500).json({ message: "Internal server error" });
    }
};

// Check Authentication
export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller");
        res.status(500).json({ message: "Internal server error" });
    }
};
