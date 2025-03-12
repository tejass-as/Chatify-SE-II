import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    getMessages(selectedUser._id);

    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages?.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const renderFileAttachment = (file) => {
    // Check if we have the complete file object structure
    if (!file || typeof file !== 'object') return null;
    
    // Handle image files
    if (file.url && (file.type?.startsWith('image/') || file.url.match(/\.(jpeg|jpg|gif|png)$/i))) {
      return (
        <img
          src={file.url}
          alt="Attachment"
          className="sm:max-w-[200px] rounded-md mb-2"
        />
      );
    }
    
    // For any other file type, display a file link
    if (file.url) {
      return (
        <a 
          href={file.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2 rounded-md mb-2"
        >
          <span>📄</span>
          <span className="text-sm underline">
            {file.name || "Download attachment"}
          </span>
        </a>
      );
    }
    
    return null;
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={message._id}
            className={`chat ${message.senderId === authUser._id ? "chat-end" : "chat-start"}`}
            ref={index === messages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={
                    message.senderId === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className={`${message.file?"bg-neutral/40 chat-bubble flex flex-col":"chat-bubble flex flex-col"}`}>
              {/* Check for both file and image fields for backward compatibility */}
              {message.file && renderFileAttachment(message.file)}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;