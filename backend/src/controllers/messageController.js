import cloudinary from "../lib/cloudinary.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedinUserID = req.user._id;
        const filteredUsers = await User.find({_id: {$ne:loggedinUserID}}).select("-password");

        res.status(200).json(filteredUsers)
    } catch (error) {
        console.log("Error in getUsersForSidebar", error.message);
        res.status(500).json({message:"Internal server error"})
    }
}

export const getMessages = async (req, res) => {
    try {
        const {id:userToChatID} = req.params;
        const myID = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderID:myID, recieverID:userToChatID},
                {senderID:userToChatID, recieverID:myID}
            ]
        })

        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({message:"Internal server error"});
    }
}

export const sendMessage = async (req, res) => {
    try {
        const {text, image} = req.body;
        const {id:userToChatID} = req.params;
        const myID = req.user._id;

        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderID: myID,
            recieverID: userToChatID,
            text,
            image: imageUrl,
        })

        await newMessage.save();

        //todo : realtime functionality goes here => socket.io

        res.status(200).json(newMessage)
    } catch (error) {
        console.log("Error in sendMessage controller", error.message);
        res.status(500).json({message:"Internal server error"});
    }
}