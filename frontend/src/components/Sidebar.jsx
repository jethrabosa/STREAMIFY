import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers, onlineUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  return (
    <aside
      className={`h-full min-h-0 flex-col border-r border-base-300 transition-all duration-200 ${
        selectedUser ? "hidden lg:flex lg:w-72" : "flex w-full lg:w-72"
      }`}
    >
      {isUsersLoading ? (
        <SidebarSkeleton />
      ) : (
        <>
          <div className="w-full border-b border-base-300 p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Users className="size-6" />
              <span className="font-medium">Contacts</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={(e) => setShowOnlineOnly(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="text-sm">Show online only</span>
              </label>
              <span className="ml-auto text-xs text-zinc-500">
                {Math.max(onlineUsers.length - 1, 0)} online
              </span>
            </div>
          </div>

          <div className="w-full flex-1 overflow-y-auto py-2">
            {filteredUsers.map((user) => (
              <button
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`
                  flex w-full items-center gap-3 px-4 py-3 text-left
                  transition-colors hover:bg-base-300
                  ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
                `}
              >
                <div className="relative shrink-0">
                  <img
                    src={user.profilePic || "/avatar.png"}
                    alt=""
                    className="size-12 rounded-full object-cover"
                  />
                  {onlineUsers.includes(user._id) && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-500 ring-2 ring-base-100" />
                  )}
                </div>

                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate font-medium">{user.fullName}</div>
                  <div className="text-sm text-base-content/60">
                    {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                  </div>
                </div>
              </button>
            ))}

            {filteredUsers.length === 0 && (
              <div className="px-4 py-6 text-center text-sm text-base-content/60">
                {showOnlineOnly ? "No contacts are online" : "No contacts yet"}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
};
export default Sidebar;
