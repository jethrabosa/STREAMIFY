import { ArrowLeft, Video, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useVideoCall } from "../hooks/useVideoCall";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const { startCall } = useVideoCall();
  const isOnline = onlineUsers.includes(selectedUser._id);

  return (
    <div className="border-b border-base-300 p-2.5 sm:px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-square min-h-11 min-w-11 lg:hidden"
            aria-label="Back to contacts"
          >
            <ArrowLeft />
          </button>
          {/* Avatar */}
          <div className="avatar">
            <div className="size-10 rounded-full relative">
              <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
            </div>
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium">{selectedUser.fullName}</h3>
            <p className="text-sm text-base-content/70">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startCall(selectedUser)}
            disabled={!isOnline}
            className="btn btn-ghost btn-square min-h-11 min-w-11"
            aria-label={`Start video call with ${selectedUser.fullName}`}
            title={isOnline ? "Start video call" : "User is offline"}
          >
            <Video />
          </button>
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="btn btn-ghost btn-square min-h-11 min-w-11 hidden lg:inline-flex"
            aria-label="Close chat"
          >
            <X />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
