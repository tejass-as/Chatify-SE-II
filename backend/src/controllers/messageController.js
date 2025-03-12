import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, file } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Handle both image and file for backward compatibility
    const { image } = req.body;
    
    let fileData = null;
    
    // Process file upload if file is provided
    if (file && file.url) {
      // If we already have a URL (client-side upload to Cloudinary)
      fileData = {
        url: file.url,
        type: file.type || '',
        name: file.name || 'Attachment'
      };
    } 
    // For backward compatibility - handle direct image uploads
    else if (image) {
      try {
        const uploadResponse = await cloudinary.uploader.upload(image);
        fileData = {
          url: uploadResponse.secure_url,
          type: 'image',
          name: 'Image'
        };
      } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return res.status(500).json({ error: "Failed to upload file" });
      }
    }

    // Create and save the new message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      file: fileData,            // New file structure
      image: fileData?.url       // For backward compatibility
    });

    await newMessage.save();

    // Notify the receiver through socket.io if they're online
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};