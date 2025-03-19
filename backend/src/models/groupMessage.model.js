import mongoose from "mongoose";

const groupMessageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
      default: "",
    },
    file: {
      url: {
        type: String,
      },
      type: {
        type: String,
      },
      name: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

const GroupMessage = mongoose.model("GroupMessage", groupMessageSchema);

export default GroupMessage;
