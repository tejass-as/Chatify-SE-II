import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import cloudinary from "../lib/cloudinary.js"; // Added cloudinary import which was missing
import CryptoJS from "crypto-js"; // Import crypto-js for encryption

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

export const getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find().populate("members", "fullname email profilePic");

    if (!groups.length) {
      return res.status(404).json({ message: "No groups found." });
    }

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ message: "Error fetching groups", error });
  }
};

export const getGroupMessages = async (req, res) => {
  try {
    const { id } = req.params;

    const encryptedMessages = await GroupMessage.find({ groupId: id })
      .populate("senderId", "fullname email profilePic")
      .sort({ createdAt: 1 });

    // Decrypt messages before sending to client
    const decryptedMessages = encryptedMessages.map(message => {
      const messageObj = message.toObject();
      
      // Decrypt text content
      if (messageObj.text) {
        messageObj.text = decryptData(messageObj.text);
      }
      
      return messageObj;
    });

    res.status(200).json(decryptedMessages);
  } catch (error) {
    console.error("Error fetching group messages:", error);
    res.status(500).json({ message: "Error fetching group messages", error });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, file, image } = req.body;
    const { id: groupId } = req.params;
    const senderId = req.user._id;

    // Check if the group exists and if the user is a member
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found." });
    }

    if (!group.members.includes(senderId)) {
      return res.status(403).json({ message: "You are not a member of this group." });
    }

    let fileData = null;

    // Handle file uploads (client-side uploads)
    if (file && file.url) {
      fileData = {
        url: file.url,
        type: file.type || '',
        name: file.name || 'Attachment'
      };
    }
    // Handle image uploads (for backward compatibility)
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

    // Create and save the new group message with encrypted text
    const newMessage = new GroupMessage({
      senderId,
      groupId,
      text: encryptedText,
      file: fileData,
      image: fileData?.url
    });

    await newMessage.save();

    // For socket.io, create a decrypted version to send to other members
    const messageForSocket = newMessage.toObject();
    messageForSocket.text = text; // Use original text for real-time socket delivery

    // Emit the message to all group members via Socket.IO
    group.members.forEach(memberId => {
      if (memberId.toString() !== senderId.toString()) { // Avoid sending to the sender
        const receiverSocketId = getReceiverSocketId(memberId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("newGroupMessage", messageForSocket);
        }
      }
    });

    // Return decrypted version to the sender
    res.status(201).json(messageForSocket);
  } catch (error) {
    console.error("Error sending group message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};