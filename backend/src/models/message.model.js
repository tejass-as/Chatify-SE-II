import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
    },
    // Keep image field for backward compatibility
    image: {
      type: String,
      default: "",
    },
    // Add new file field structure
    file: {
      url: {
        type: String,
      },
      type: {
        type: String,
      },
      name: {
        type: String,
      }
    }
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

export default Message;