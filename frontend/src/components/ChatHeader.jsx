import { X, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser, selectedGroup, setSelectedGroup, isShowingGroups } = useChatStore();
  const { onlineUsers } = useAuthStore();

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

        {/* Close button */}
        <button className="cursor-pointer" onClick={() => (isShowingGroups ? setSelectedGroup(null) : setSelectedUser(null))}>
          <X />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
