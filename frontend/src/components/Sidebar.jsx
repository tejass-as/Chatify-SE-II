import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search } from "lucide-react"; // Import the search icon
import { ToggleLeft, ToggleRight } from "lucide-react"; // Import icons for the toggle button

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, getGroups, groups, selectedGroup, setSelectedGroup, isGroupsLoading, isShowingGroups, toggleIsShowingGroups } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [searchGroupQuery, setSearchGroupQuery] = useState(""); // State for search query for groups

  useEffect(() => {
    getUsers();
    getGroups(); // Fetch groups when the component mounts
  }, [getUsers, getGroups]);

  // Filter users based on the search query and online status
  const filteredUsers = users
    .filter((user) => user.fullname.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((user) => (showOnlineOnly ? onlineUsers.includes(user._id) : true));

  // Filter groups based on the search query
  const filteredGroups = groups
    .filter((group) => group.name.toLowerCase().includes(searchGroupQuery.toLowerCase()));

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="size-6" />
            <span className="font-medium hidden lg:block">{isShowingGroups ? "Groups" : "Contacts"}</span>
          </div>

          <button
            onClick={() => toggleIsShowingGroups(!isShowingGroups)}
            className="btn btn-sm btn-ghost flex items-center gap-2 lg:hidden"  // Hide on large screens
          >
            {isShowingGroups ? (
              <ToggleRight className="size-5" />
            ) : (
              <ToggleLeft className="size-5" />
            )}
          </button>

          <button
            onClick={() => toggleIsShowingGroups(!isShowingGroups)}
            className="btn btn-sm btn-ghost hidden lg:flex items-center gap-2"  // Show on large screens
          >
            <span className={`text-sm ${isShowingGroups ? "text-zinc-500" : "text-primary"}`}>
              Users
            </span>

            {isShowingGroups ? (
              <ToggleRight className="size-5" />
            ) : (
              <ToggleLeft className="size-5" />
            )}

            <span className={`text-sm ${isShowingGroups ? "text-primary" : "text-zinc-500"}`}>
              Groups
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="hidden mt-3 lg:flex items-center gap-2">
          <input
            type="text"
            placeholder={isShowingGroups ? "Search groups..." : "Search users..."}
            value={isShowingGroups ? searchGroupQuery : searchQuery}
            onChange={(e) => {
              if (isShowingGroups) {
                setSearchGroupQuery(e.target.value);
              } else {
                setSearchQuery(e.target.value);
              }
            }}
            className="input input-sm w-full lg:w-60"
          />
          <Search className="size-5 text-gray-500" />
        </div>

        {/* Online filter toggle for users */}
        {!isShowingGroups && (
          <div className="mt-3 hidden lg:flex items-center gap-2">
            <label className="cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlineOnly}
                onChange={(e) => setShowOnlineOnly(e.target.checked)}
                className="checkbox checkbox-sm"
              />
              <span className="text-sm">Show online only</span>
            </label>
            <span className="text-xs text-zinc-500">({onlineUsers.length - 1} online)</span>
          </div>
        )}
      </div>

      {/* Users List */}
      {!isShowingGroups && (
        <div className="overflow-y-auto w-full py-3">
          {filteredUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => setSelectedUser(user)}
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="relative mx-auto lg:mx-0">
                <img
                  src={user.profilePic || "/avatar.png"}
                  alt={user.name}
                  className="size-12 object-cover rounded-full"
                />
                {onlineUsers.includes(user._id) && (
                  <span
                    className="absolute bottom-0 right-0 size-3 bg-green-500 
                    rounded-full ring-2 ring-zinc-900"
                  />
                )}
              </div>

              <div className="hidden lg:block text-left min-w-0">
                <div className="font-medium truncate">{user.fullname}</div>
                <div className="text-sm text-zinc-400">
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </div>
              </div>
            </button>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center text-zinc-500 py-4">No users found</div>
          )}
        </div>
      )}

      {/* Groups List */}
      {isShowingGroups && (
        <div className="overflow-y-auto w-full py-3">
          {filteredGroups.map((group) => (
            <button
              key={group._id}
              onClick={() => setSelectedGroup(group)} // Assuming `setSelectedUser` can also handle group selection
              className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                selectedGroup?._id === group._id ? "bg-base-300 ring-1 ring-base-300" : ""
              }`}
            >
              <div className="text-left min-w-0">
                <div className="font-medium truncate">{group.name}</div>
                <div className="text-sm text-zinc-400">
                  {group.members.length} users
                </div>
              </div>
            </button>
          ))}

          {filteredGroups.length === 0 && (
            <div className="text-center text-zinc-500 py-4">No groups found</div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
