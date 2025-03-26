import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";



const HomePage = () => {
  const { selectedUser, isShowingGroups, selectedGroup } = useChatStore();
  const { authUser } = useAuthStore();

    useEffect(() => {
        if(authUser) {
            const initializeSocket = useAuthStore.getState().initializeSocket;
            const authUser = useAuthStore.getState().authUser;
            initializeSocket(authUser._id);
        }
    }, [authUser])

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {
                !isShowingGroups ? (
                    !selectedUser ? <NoChatSelected /> : <ChatContainer />
                ) : (
                    !selectedGroup ? <NoChatSelected /> : <ChatContainer />
                )
            }
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;