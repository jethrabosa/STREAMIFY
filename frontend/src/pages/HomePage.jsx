import { useChatStore } from "../store/useChatStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import VideoCallProvider from "../components/VideoCallProvider";

const HomePage = () => {
  const { selectedUser } = useChatStore();

  return (
    <VideoCallProvider>
      <main className="mt-16 h-[calc(100dvh-4rem)] min-h-0 bg-base-200">
        <div className="flex h-full items-center justify-center sm:px-4 sm:py-4">
          <div className="h-full w-full max-w-6xl overflow-hidden bg-base-100 sm:rounded-lg sm:shadow-cl">
            <div className="flex h-full min-h-0 overflow-hidden sm:rounded-lg">
              <Sidebar />

              {!selectedUser ? (
                <NoChatSelected />
              ) : (
                <ChatContainer />
              )}
            </div>
          </div>
        </div>
      </main>
    </VideoCallProvider>
  );
};
export default HomePage;
