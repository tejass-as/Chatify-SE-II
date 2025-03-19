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
    groupMessages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
    getGroupMessages,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
    isShowingGroups,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  // Fetch messages for the selected user or group
  useEffect(() => {
    if (isShowingGroups && selectedGroup) {
      getGroupMessages(selectedGroup._id);
      subscribeToGroupMessages();
    } else if (!isShowingGroups && selectedUser) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }

    // Cleanup subscriptions when the component unmounts or selection changes
    return () => {
      if (isShowingGroups) {
        unsubscribeFromGroupMessages();
      } else {
        unsubscribeFromMessages();
      }
    };
  }, [
    selectedUser?._id,
    selectedGroup?._id,
    isShowingGroups,
    getMessages,
    getGroupMessages,
    subscribeToMessages,
    subscribeToGroupMessages,
    unsubscribeFromMessages,
    unsubscribeFromGroupMessages,
  ]);

  // Scroll to the latest message when messages change
  useEffect(() => {
    if (messageEndRef.current && (messages?.length > 0 || groupMessages?.length > 0)) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, groupMessages]);

  const renderFileAttachment = (file) => {
    if (!file || typeof file !== 'object') return null;

    if (file.url && (file.type?.startsWith('image/') || file.url.match(/\.(jpeg|jpg|gif|png)$/i))) {
      return (
        <img
          src={file.url}
          alt="Attachment"
          className="sm:max-w-[200px] rounded-md mb-2"
        />
      );
    }

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

      {!isShowingGroups ? (
        // Render user-to-user messages
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
                    src={message.senderId === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className={`${message.file ? "bg-neutral/40 chat-bubble flex flex-col" : "chat-bubble flex flex-col"}`}>
                {message.file && renderFileAttachment(message.file)}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Render group messages
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {groupMessages.map((message, index) => (
            <div
              key={message._id}
              className={`chat ${message.senderId._id === authUser._id ? "chat-end" : "chat-start"}`}
              ref={index === groupMessages.length - 1 ? messageEndRef : null}
            >
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img
                    src={message.senderId._id === authUser._id ? authUser.profilePic || "/avatar.png" : message.senderId.profilePic || "/avatar.png"}
                    alt="profile pic"
                  />
                </div>
              </div>
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
                <div>{" " +message.senderId.fullname}</div>
              </div>
              <div className={`${message.file ? "bg-neutral/40 chat-bubble flex flex-col" : "chat-bubble flex flex-col"}`}>
                {message.file && renderFileAttachment(message.file)}
                {message.text && <p>{message.text}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <MessageInput />
    </div>
  );
};

export default ChatContainer;
