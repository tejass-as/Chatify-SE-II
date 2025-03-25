import { X, Users, Video } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useVideoCallStore } from "../store/useVideoCallStore"; // Import video call store
import VideoCallModal from "../components/Videocall"; // Import the video call modal

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup, isShowingGroups } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall, currentCall, incomingCall } = useVideoCallStore(); // Add video call store methods

  // Determine if video call is possible (for users, not groups)
  const canInitiateVideoCall = !isShowingGroups && selectedUser && onlineUsers.includes(selectedUser?._id);

  return (
    <div className="p-2.5 border-b border-base-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar or Group Icon */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              {isShowingGroups ? (
                <Users className="size-10 text-gray-500" />
              ) : (
                <img
                  src={selectedUser?.profilePic || "/avatar.png"}
                  alt={selectedUser?.fullname}
                />
              )}
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-medium">{isShowingGroups ? selectedGroup?.name : selectedUser?.fullname}</h3>
            <p className="text-sm text-base-content/70">
              {isShowingGroups
                ? `${selectedGroup?.members.length} members`
                : onlineUsers.includes(selectedUser?._id)
                ? "Online"
                : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Video Call Button - Only show for online users */}
          {canInitiateVideoCall && (
            <button 
              className="cursor-pointer hover:bg-base-200 p-2 rounded-full"
              onClick={() => startCall(selectedUser._id)}
              title="Start Video Call"
            >
              <Video className="size-5 text-blue-500" />
            </button>
          )}

          {/* Close button */}
          <button 
            className="cursor-pointer hover:bg-base-200 p-2 rounded-full" 
            onClick={() => (isShowingGroups ? setSelectedGroup(null) : setSelectedUser(null))}
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      {/* Video Call Modal - Renders for incoming or active calls */}
      {(currentCall || incomingCall) && (
        <VideoCallModal 
          selectedUser={selectedUser} 
        />
      )}
    </div>
  );
};

export default ChatHeader;