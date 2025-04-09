import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import CryptoJS from "crypto-js"; // Import crypto-js library

// Encryption secret key - store this in environment variables in production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "your-secret-encryption-key";

// Helper functions for encryption/decryption
const encryptData = (text) => {
  if (!text) return null;
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedText) => {
  if (!encryptedText) return null;
  const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

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

    const encryptedMessages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });
    
    // Decrypt messages before sending to client
    const decryptedMessages = encryptedMessages.map(message => {
      const messageObj = message.toObject();
      
      // Decrypt text content
      if (messageObj.text) {
        messageObj.text = decryptData(messageObj.text);
      }
      
      // Note: File URLs are kept as is since they need to be accessible
      // Only metadata could be encrypted if needed
      
      return messageObj;
    });

    res.status(200).json(decryptedMessages);
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

    // Encrypt the message text before saving
    const encryptedText = text ? encryptData(text) : null;

    // Create and save the new message with encrypted text
    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptedText,
      file: fileData,
      image: fileData?.url
    });

    await newMessage.save();

    // For socket.io, send the decrypted version
    const messageForSocket = newMessage.toObject();
    messageForSocket.text = text; // Use original text for real-time socket delivery

    // Notify the receiver through socket.io if they're online
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageForSocket);
    }

    // Return decrypted version to the sender
    res.status(201).json(messageForSocket);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};