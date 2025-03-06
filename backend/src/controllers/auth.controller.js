import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"

export const signup = async (req, res) => {
    const {fullname, email, password} = req.body;
    try {
        if(!fullname || !email || !password)
            return res.status(400).json({message : "All fields are required!"})

        if(password.length < 6)
            return res.status(400).json({message: "Password must be of 6 characters"})

        const user = await User.findOne({email});

        if(user)
            return res.status(400).json({message: "User already exists"})

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const newUser = new User({
            fullname,
            email,
            password: hashedPassword,
        })

        if(newUser) {
            generateToken(newUser._id, res)
            await newUser.save()

            res.status(201).json({
                _id: newUser._id,
                fullname: newUser.fullname,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })
        } else {
            return res.status(400).json({message: "Invalid user data"})
        }
    } catch (error) {
        console.log("Error in signup controller", error.message)
        res.status(500).json({message: "Internal server error"})
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body;
    try {
        if (!email || !password)
            return res.status(400).json({ message: "All fields are required!" });

        const user = await User.findOne({email});
        if(!user)
            return res.status(400).json({message : "Invalid credentials"});

        const isPasswordCorrect = await bcrypt.compare(password, user.password)
        if(!isPasswordCorrect)
            return res.status(400).json({message : "Invalid credentials"});

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            profilePic: user.profilePic,
        })
    } catch (error) {
        console.log("Error in login controller", error.message)
        res.status(500).json({message: "Internal server error"})
    }
}

export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", {maxAge: 0})
        res.status(200).json({message:"Logged out successfully"})
    } catch (error) {
        console.log("Error in logout controller", error.message)
        res.status(500).json({message: "Internal server error"})
    }
}

export const updateProfile = async (req, res) => {
    try {
        const {profilePic} = req.body;
        const userID = req.user._id;

        if(!profilePic)
            return res.status(400).json({message:"Profile pic is not provided"})

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userID, {profilePic: uploadResponse.secure_url}, {new:true})

        res.status(200).json({message:"Profile pic updated"})
    } catch (error) {
        console.log("Error in update-profile controller")
        res.status(500).json({message:"Internal server error"})
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch(error) {
        console.log("Error in checkAuth controller")
        res.status(500).json({message:"Internal server error"})
    }
}