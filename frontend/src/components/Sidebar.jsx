import { useEffect, useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Trash2, Users } from "lucide-react";

const Sidebar = () => {
  const {
    getUsers,
    users,
    canDeleteUsers,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    deleteUserAccount,
    removeUser,
  } = useChatStore();

  const { onlineUsers, socket } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [confirmUser, setConfirmUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = useRef(null);
  const touchStart = useRef(null);
  const didLongPress = useRef(false);

  const clearLongPress = () => {
    window.clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  };

  const openContextMenu = (user, x, y) => {
    setContextMenu({
      user,
      x: Math.max(8, Math.min(x, window.innerWidth - 208)),
      y: Math.max(8, Math.min(y, window.innerHeight - 56)),
    });
  };

  useEffect(() => {
    getUsers();
  }, [getUsers, onlineUsers]);

  useEffect(() => {
    if (!socket) return;
    const handleUserDeleted = ({ userId }) => removeUser(userId);
    socket.on("user:deleted", handleUserDeleted);
    return () => socket.off("user:deleted", handleUserDeleted);
  }, [socket, removeUser]);

  useEffect(() => () => window.clearTimeout(longPressTimer.current), []);

  useEffect(() => {
    if (!contextMenu && !confirmUser) return;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isDeleting) {
        setContextMenu(null);
        setConfirmUser(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contextMenu, confirmUser, isDeleting]);

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
                onClick={(event) => {
                  if (didLongPress.current) {
                    didLongPress.current = false;
                    event.preventDefault();
                    return;
                  }
                  setContextMenu(null);
                  setSelectedUser(user);
                }}
                onContextMenu={(event) => {
                  if (!canDeleteUsers) return;
                  event.preventDefault();
                  openContextMenu(user, event.clientX, event.clientY);
                }}
                onTouchStart={(event) => {
                  if (!canDeleteUsers) return;
                  const touch = event.touches[0];
                  touchStart.current = { x: touch.clientX, y: touch.clientY };
                  longPressTimer.current = window.setTimeout(() => {
                    didLongPress.current = true;
                    openContextMenu(user, touch.clientX, touch.clientY);
                  }, 550);
                }}
                onTouchMove={(event) => {
                  const start = touchStart.current;
                  const touch = event.touches[0];
                  if (
                    start &&
                    Math.hypot(touch.clientX - start.x, touch.clientY - start.y) > 12
                  ) {
                    clearLongPress();
                  }
                }}
                onTouchEnd={() => {
                  clearLongPress();
                  touchStart.current = null;
                }}
                onTouchCancel={() => {
                  clearLongPress();
                  touchStart.current = null;
                }}
                onKeyDown={(event) => {
                  if (
                    canDeleteUsers &&
                    (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))
                  ) {
                    event.preventDefault();
                    const bounds = event.currentTarget.getBoundingClientRect();
                    openContextMenu(user, bounds.left + 16, bounds.top + 16);
                  }
                }}
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

      {contextMenu && (
        <>
          <button
            type="button"
            aria-label="Close account actions"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => {
              if (didLongPress.current) {
                didLongPress.current = false;
                return;
              }
              setContextMenu(null);
            }}
          />
          <div
            role="menu"
            className="fixed z-50 w-48 overflow-hidden rounded-lg border border-base-300 bg-base-100 p-1 shadow-xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-error hover:bg-base-200"
              onClick={() => {
                setConfirmUser(contextMenu.user);
                setContextMenu(null);
              }}
            >
              <Trash2 className="size-4" />
              Delete account
            </button>
          </div>
        </>
      )}

      {confirmUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-lg bg-base-100 p-5 shadow-2xl"
          >
            <h2 id="delete-account-title" className="text-lg font-semibold">
              Delete {confirmUser.fullName}&apos;s account?
            </h2>
            <p className="mt-2 text-sm text-base-content/70">
              This permanently deletes the account and all of its chat messages. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="btn btn-ghost"
                disabled={isDeleting}
                onClick={() => setConfirmUser(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-error"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  const deleted = await deleteUserAccount(confirmUser._id);
                  setIsDeleting(false);
                  if (deleted) setConfirmUser(null);
                }}
              >
                {isDeleting ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </section>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
