import Group from "../models/group.model.js";
import GroupMessage from "../models/groupMessage.model.js"
import { getReceiverSocketId, io } from "../lib/socket.js"; 

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
  
      const messages = await GroupMessage.find({ groupId: id })
        .populate("senderId", "fullname email profilePic")
        .sort({ createdAt: 1 });

      res.status(200).json(messages);
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
  
      // Create and save the new group message
      const newMessage = new GroupMessage({
        senderId,
        groupId,
        text,
        file: fileData, // Updated file structure
        image: fileData?.url 
      });
  
      await newMessage.save();
  
      // Emit the message to all group members via Socket.IO
      group.members.forEach(memberId => {
        if (memberId.toString() !== senderId.toString()) { // Avoid sending to the sender
          const receiverSocketId = getReceiverSocketId(memberId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("newGroupMessage", newMessage);
          }
        }
      });
  
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending group message:", error);
      res.status(500).json({ error: "Internal server error" });
    }
};